import { streamText, convertToCoreMessages } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// OpenRouter用のOpenAIクライアント設定（デバッグ機能付き）
const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  compatibility: 'compatible', // OpenRouterとの互換性を明示
  fetch: async (url, options) => {
    console.log('🌐 [OpenRouter] Request:', {
      url: url.toString(),
      method: options?.method || 'GET',
      headers: options?.headers ? Object.fromEntries(
        Object.entries(options.headers).map(([k, v]) => 
          k.toLowerCase() === 'authorization' ? [k, `Bearer ${(v as string).substring(7, 20)}...`] : [k, v]
        )
      ) : {},
      body: options?.body ? JSON.parse(options.body as string) : null
    });
    
    const response = await fetch(url, options);
    
    console.log('🌐 [OpenRouter] Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    });
    
    // レスポンス内容を確認
    if (!response.ok) {
      const errorText = await response.clone().text();
      console.log('🌐 [OpenRouter] Error response body:', errorText);
    }
    
    return response;
  }
});

const SYSTEM_PROMPT = `
あなたはVOICARISMEのAIチャットです。
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
  // 強制的にコンソール出力
  const log = (message: string) => {
    console.log(message);
    console.error(message); // エラーログにも出力して確実に表示
  };
  
  try {
    log('🚀 [API] ===== CHAT REQUEST START =====');
    const { messages } = await req.json();
    log('📨 [API] Messages received: ' + JSON.stringify(messages, null, 2));

    const coreMessages = convertToCoreMessages(messages);
    log('🔄 [API] Converted to core messages: ' + JSON.stringify(coreMessages, null, 2));

    const modelName = process.env.NEXT_PUBLIC_DEFAULT_AI_MODEL || 'openai/gpt-4o-mini';
    const hasApiKey = !!process.env.OPENROUTER_API_KEY;
    const apiKeyPrefix = process.env.OPENROUTER_API_KEY?.substring(0, 10) || 'none';
    
    log('🔧 [API] Configuration:');
    log('  Model: ' + modelName);
    log('  API Key present: ' + hasApiKey);
    log('  API Key prefix: ' + apiKeyPrefix + '...');
    log('  OpenRouter URL: https://openrouter.ai/api/v1');
    
    log('🤖 [API] Calling streamText...');
    const result = await streamText({
      model: openrouter(process.env.NEXT_PUBLIC_DEFAULT_AI_MODEL || 'openai/gpt-4o-mini'),
      system: SYSTEM_PROMPT,
      messages: coreMessages,
      temperature: 0.7,
      maxRetries: 3,
    });

    log('✅ [API] streamText completed successfully');
    log('📊 [API] Result object properties: ' + Object.keys(result).join(', '));
    
    return result.toTextStreamResponse();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';
    
    log('❌ [API] ===== CHAT REQUEST ERROR =====');
    log('Error message: ' + errorMessage);
    log('Error stack: ' + errorStack);
    log('=====================================');
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: errorMessage,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}