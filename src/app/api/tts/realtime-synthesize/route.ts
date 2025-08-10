import { NextRequest, NextResponse } from 'next/server';
import { splitTextForRealtimeTTS, analyzeSplitResult } from '@/lib/utils/textSplitter';

export interface RealtimeTTSRequest {
  text: string;
  model_uuid?: string;
  speaker_uuid?: string;
  style_id?: number;
  style_name?: string;
  speaking_rate?: number;
  pitch?: number;
  volume?: number;
  emotional_intensity?: number;
  tempo_dynamics?: number;
  output_format?: 'mp3' | 'wav' | 'aac' | 'opus';
  output_sampling_rate?: number;
  use_ssml?: boolean;
  leading_silence_seconds?: number;
  trailing_silence_seconds?: number;
  line_break_silence_seconds?: number;
}

export interface RealtimeTTSChunkResponse {
  chunkId: string;
  chunkIndex: number;
  totalChunks: number;
  text: string;
  audioData?: Uint8Array;
  error?: string;
  isComplete: boolean;
  metadata?: {
    characterCount: number;
    estimatedDuration: number;
  };
}

const AIVIS_API_URL = 'https://api.aivis-project.com/v1/tts/synthesize';
const DEFAULT_MODEL_UUID = 'a59cb814-0083-4369-8542-f51a29e72af7'; // デモ用モデル

export async function POST(request: NextRequest) {
  try {
    const body: RealtimeTTSRequest = await request.json();
    
    if (!body.text?.trim()) {
      return NextResponse.json(
        { error: 'テキストが入力されていません' },
        { status: 400 }
      );
    }

    // APIキーの確認
    const apiKey = process.env.AIVIS_API_KEY;
    if (!apiKey) {
      console.error('AIVIS_API_KEY is not set');
      return NextResponse.json(
        { error: '音声合成サービスの設定エラー' },
        { status: 500 }
      );
    }

    // テキストを分割
    const chunks = splitTextForRealtimeTTS(body.text);
    const stats = analyzeSplitResult(chunks);

    console.log(`Realtime TTS: ${stats.totalChunks} chunks, ${stats.totalLength} characters`);

    // ストリーミングレスポンスを設定
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 最初に統計情報を送信
          const initResponse: RealtimeTTSChunkResponse = {
            chunkId: 'init',
            chunkIndex: -1,
            totalChunks: chunks.length,
            text: '',
            isComplete: false,
            metadata: {
              characterCount: stats.totalLength,
              estimatedDuration: Math.round(stats.totalLength * 0.1) // 概算：100文字/秒
            }
          };
          
          const initData = `data: ${JSON.stringify(initResponse)}\n\n`;
          controller.enqueue(encoder.encode(initData));

          // 各チャンクを順次処理
          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            
            try {
              // Aivis Cloud APIを呼び出し
              const audioData = await synthesizeChunk(chunk.text, {
                ...body,
                model_uuid: body.model_uuid || DEFAULT_MODEL_UUID,
                output_format: body.output_format || 'mp3',
                use_ssml: body.use_ssml ?? true,
              }, apiKey);

              const chunkResponse: RealtimeTTSChunkResponse = {
                chunkId: chunk.id,
                chunkIndex: chunk.index,
                totalChunks: chunks.length,
                text: chunk.text,
                audioData: audioData,
                isComplete: i === chunks.length - 1,
                metadata: {
                  characterCount: chunk.originalLength,
                  estimatedDuration: Math.round(chunk.originalLength * 0.1)
                }
              };

              const chunkDataStr = JSON.stringify(chunkResponse, (key, value) => {
                if (key === 'audioData' && value instanceof Uint8Array) {
                  return Array.from(value); // Uint8ArrayをArrayに変換
                }
                return value;
              });
              
              const responseData = `data: ${chunkDataStr}\n\n`;
              controller.enqueue(encoder.encode(responseData));

            } catch (error) {
              console.error(`Error synthesizing chunk ${i}:`, error);
              
              const errorResponse: RealtimeTTSChunkResponse = {
                chunkId: chunk.id,
                chunkIndex: chunk.index,
                totalChunks: chunks.length,
                text: chunk.text,
                error: error instanceof Error ? error.message : '音声合成エラー',
                isComplete: false
              };
              
              const errorData = `data: ${JSON.stringify(errorResponse)}\n\n`;
              controller.enqueue(encoder.encode(errorData));
            }
          }

          // 完了通知
          const completeResponse: RealtimeTTSChunkResponse = {
            chunkId: 'complete',
            chunkIndex: chunks.length,
            totalChunks: chunks.length,
            text: '',
            isComplete: true
          };
          
          const completeData = `data: ${JSON.stringify(completeResponse)}\n\n`;
          controller.enqueue(encoder.encode(completeData));
          
        } catch (error) {
          console.error('Streaming error:', error);
          const errorData = `data: ${JSON.stringify({ error: 'ストリーミングエラー' })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error) {
    console.error('Realtime TTS API error:', error);
    return NextResponse.json(
      { error: 'リアルタイム音声合成でエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * 単一チャンクの音声合成
 */
async function synthesizeChunk(
  text: string, 
  params: RealtimeTTSRequest, 
  apiKey: string
): Promise<Uint8Array> {
  // リクエストタイムアウトを設定
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), 30000); // 30秒タイムアウト

  try {
    const requestBody = {
      model_uuid: params.model_uuid,
      text: text,
      speaker_uuid: params.speaker_uuid,
      style_id: params.style_id,
      style_name: params.style_name,
      speaking_rate: params.speaking_rate || 1.0,
      pitch: params.pitch || 0.0,
      volume: params.volume || 1.0,
      emotional_intensity: params.emotional_intensity || 1.0,
      tempo_dynamics: params.tempo_dynamics || 1.0,
      output_format: params.output_format || 'mp3',
      output_sampling_rate: params.output_sampling_rate || 44100,
      use_ssml: params.use_ssml ?? true,
      leading_silence_seconds: params.leading_silence_seconds || 0.1,
      trailing_silence_seconds: params.trailing_silence_seconds || 0.1,
      line_break_silence_seconds: params.line_break_silence_seconds || 0.4,
    };

    const response = await fetch(AIVIS_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: timeoutController.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorText = await response.text();
        errorMessage += `: ${errorText}`;
        
        // Aivis APIの特定エラーハンドリング
        if (response.status === 401) {
          errorMessage = 'APIキーが無効です';
        } else if (response.status === 402) {
          errorMessage = 'クレジット残高が不足しています';
        } else if (response.status === 404) {
          errorMessage = '指定された音声モデルが見つかりません';
        } else if (response.status === 429) {
          errorMessage = 'API使用制限に達しました。しばらく待ってから再試行してください';
        }
      } catch (e) {
        // errorTextの取得に失敗した場合はスルー
      }
      throw new Error(errorMessage);
    }

    const arrayBuffer = await response.arrayBuffer();
    
    // 空のレスポンスチェック
    if (arrayBuffer.byteLength === 0) {
      throw new Error('音声データが生成されませんでした');
    }

    return new Uint8Array(arrayBuffer);

  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('音声生成がタイムアウトしました');
      }
      throw error;
    }
    throw new Error('音声生成で予期しないエラーが発生しました');
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}