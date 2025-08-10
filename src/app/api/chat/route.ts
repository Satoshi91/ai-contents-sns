import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';

// OpenRouter用のOpenAIクライアント設定
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

const SYSTEM_PROMPT = `
あなたはVOICARISMEのAIアシスタントです。
AIボイスドラマとASMR作品の創作を支援する専門家として、
以下の分野でユーザーをサポートしてください：

1. キャラクター設定と台本作成
2. SSML形式での音声演出最適化
3. 感情表現と話速調整のアドバイス
4. ASMRシナリオの構成提案
5. 創作活動全般のサポート

常に創造的で実践的なアドバイスを心がけ、ユーザーの創作意図を理解して
具体的で役立つ提案を行ってください。
`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const response = await openai.chat.completions.create({
      model: process.env.NEXT_PUBLIC_DEFAULT_AI_MODEL || 'openai/gpt-4o-mini',
      stream: true,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}