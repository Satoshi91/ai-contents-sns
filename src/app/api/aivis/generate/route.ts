import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, isFirebaseAdminInitialized, requireFirebaseAdmin } from '@/lib/firebase/admin';
import { getAudioUploadURL } from '@/lib/cloudflare/r2';

interface AivisGenerateRequest {
  text: string;
  modelUuid?: string;
  speakerUuid?: string;
  outputFormat?: 'mp3' | 'wav' | 'flac' | 'aac' | 'opus';
}

interface AivisGenerateResponse {
  success: boolean;
  audioUrl?: string;
  audioId?: string;
  error?: string;
}

// デフォルト設定（後で環境変数化）
const DEFAULT_MODEL_UUID = process.env.AIVIS_DEFAULT_MODEL_UUID || 'a59cb814-0083-4369-8542-f51a29e72af7';
const DEFAULT_OUTPUT_FORMAT = 'mp3';
const AIVIS_API_KEY = process.env.AIVIS_API_KEY;
const AIVIS_API_BASE_URL = 'https://api.aivis-project.com/v1';

export async function POST(req: NextRequest): Promise<NextResponse<AivisGenerateResponse>> {
  try {
    // Firebase Admin SDK初期化チェック
    if (!isFirebaseAdminInitialized()) {
      return NextResponse.json(
        { success: false, error: 'サーバーの設定に問題があります。管理者に連絡してください。' },
        { status: 500 }
      );
    }

    // 認証確認
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'ログインが必要です' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    
    let decodedToken;
    try {
      const { adminAuth: auth } = requireFirebaseAdmin();
      decodedToken = await auth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: '認証トークンが無効です' },
        { status: 401 }
      );
    }

    // APIキー確認
    if (!AIVIS_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Aivis APIキーが設定されていません' },
        { status: 500 }
      );
    }

    const body: AivisGenerateRequest = await req.json();
    const { text, modelUuid, speakerUuid, outputFormat } = body;

    // バリデーション
    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'テキストが入力されていません' },
        { status: 400 }
      );
    }

    if (text.length > 3000) {
      return NextResponse.json(
        { success: false, error: 'テキストが長すぎます（最大3000文字）' },
        { status: 400 }
      );
    }

    const userId = decodedToken.uid;
    const workId = `chat_${Date.now()}`;

    // 1. Aivis Cloud APIで音声生成
    const aivisRequest = {
      model_uuid: modelUuid || DEFAULT_MODEL_UUID,
      text: text.trim(),
      output_format: outputFormat || DEFAULT_OUTPUT_FORMAT,
      use_ssml: true,
      speaking_rate: 1.0,
      emotional_intensity: 1.0,
      volume: 1.0,
    };

    // speakerUuidが指定された場合のみ追加
    const finalRequest: any = { ...aivisRequest };
    if (speakerUuid) {
      finalRequest.speaker_uuid = speakerUuid;
    }

    console.log('Aivis API request:', finalRequest);

    const aivisResponse = await fetch(`${AIVIS_API_BASE_URL}/tts/synthesize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIVIS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(finalRequest),
    });

    if (!aivisResponse.ok) {
      const errorText = await aivisResponse.text();
      console.error('Aivis API error:', errorText);
      return NextResponse.json(
        { 
          success: false, 
          error: `音声生成に失敗しました: ${aivisResponse.status} ${errorText}` 
        },
        { status: 500 }
      );
    }

    // 2. 生成された音声データを取得
    const audioBuffer = await aivisResponse.arrayBuffer();
    const audioBlob = new Blob([audioBuffer], { 
      type: aivisResponse.headers.get('content-type') || 'audio/mpeg' 
    });

    // 3. Cloudflare R2にアップロード用のURLを取得
    const fileName = `aivis_generated_${Date.now()}.${outputFormat || DEFAULT_OUTPUT_FORMAT}`;
    const uploadResult = await getAudioUploadURL(
      userId,
      workId,
      fileName,
      audioBlob.type
    );

    if (!uploadResult.success) {
      return NextResponse.json(
        { success: false, error: uploadResult.error },
        { status: 500 }
      );
    }

    // 4. 音声データをR2にアップロード
    const uploadResponse = await fetch(uploadResult.uploadUrl!, {
      method: 'PUT',
      body: audioBuffer,
      headers: {
        'Content-Type': audioBlob.type,
      },
    });

    if (!uploadResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'ファイルのアップロードに失敗しました' },
        { status: 500 }
      );
    }

    // 5. 成功レスポンス
    return NextResponse.json({
      success: true,
      audioUrl: uploadResult.audioUrl,
      audioId: uploadResult.audioId,
    });

  } catch (error) {
    console.error('Aivis generate error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '音声生成中にエラーが発生しました',
      },
      { status: 500 }
    );
  }
}