import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { createWork } from '@/lib/firebase/works';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/app';

interface SaveWorkRequest {
  title: string;
  caption?: string;
  script?: string;
  audioUrl: string;
  audioId: string;
  isPublic: boolean;
  contentType?: 'voice' | 'script' | 'image' | 'mixed';
}

interface SaveWorkResponse {
  success: boolean;
  workId?: string;
  error?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<SaveWorkResponse>> {
  try {
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
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: '認証トークンが無効です' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;

    // ユーザー情報取得
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'ユーザー情報が見つかりません' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const username = userData.username;
    const displayName = userData.displayName || userData.username;
    const userPhotoURL = userData.photoURL || null;

    // リクエストボディの解析
    const body: SaveWorkRequest = await req.json();
    const { 
      title, 
      caption, 
      script, 
      audioUrl, 
      audioId, 
      isPublic,
      contentType = 'voice'
    } = body;

    // バリデーション
    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'タイトルが必要です' },
        { status: 400 }
      );
    }

    if (!audioUrl || !audioId) {
      return NextResponse.json(
        { success: false, error: '音声ファイルが必要です' },
        { status: 400 }
      );
    }

    // 作品データを作成
    const workInput = {
      title: title.trim(),
      caption: caption?.trim() || (isPublic ? 'AIチャットから生成された音声作品' : ''),
      script: script?.trim() || '',
      audioUrl,
      audioId,
      audioOriginalFilename: `aivis_generated_${Date.now()}.mp3`,
      contentType,
      ageRating: 'all' as const,
    };

    // 非公開作品の場合は、キャプションを空にして非公開であることを示す
    if (!isPublic) {
      workInput.caption = '';
    }

    // 既存のcreateWork関数を使用して作品を作成
    const result = await createWork(
      workInput,
      userId,
      username,
      displayName,
      userPhotoURL
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      workId: result.workId,
    });

  } catch (error) {
    console.error('Save work error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '作品の保存中にエラーが発生しました',
      },
      { status: 500 }
    );
  }
}