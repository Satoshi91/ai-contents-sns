import { streamText, convertToCoreMessages } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// OpenRouter用のOpenAIクライアント設定（デバッグ機能付き）
const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  fetch: async (url, options) => {
    console.log('🌐 [OpenRouter Canvas] Request:', {
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
    
    console.log('🌐 [OpenRouter Canvas] Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    });
    
    // レスポンス内容を確認
    if (!response.ok) {
      const errorText = await response.clone().text();
      console.log('🌐 [OpenRouter Canvas] Error response body:', errorText);
    }
    
    return response;
  }
});

const CANVAS_SYSTEM_PROMPT = `
あなたはCanvas Modeでの創作支援AIです。
ユーザーとの会話を通じて、右側のCanvasエリアにテキスト成果物を作成・編集します。

## レスポンス形式
必ず以下のJSON形式で回答してください：

{
  "chatContent": "ユーザーへの回答メッセージ",
  "canvasContent": "Canvas に表示/更新するテキスト（必要時のみ）",
  "canvasTitle": "Canvas のタイトル（内容に基づいて自動生成、必要時のみ）",
  "canvasAction": "append" | "replace" | "insert",
  "insertPosition": 数値（insert時のみ）
}

## Canvas操作ルール
1. **新しい内容を作成する場合**: "replace" - Canvas全体を新しい内容で置き換え
2. **既存内容に追加する場合**: "append" - Canvas末尾に新しい内容を追加
3. **特定位置に挿入する場合**: "insert" - 指定した行番号に内容を挿入

## Canvas更新の判断基準
- ユーザーが「作成して」「書いて」「生成して」等の指示をした場合: canvasContentを含める
- ユーザーが「修正して」「変更して」「追加して」等の指示をした場合: canvasContentを含める
- 単純な質問や相談の場合: canvasContentは含めない（chatContentのみ）

## タイトル生成ルール
- Canvas内容を新規作成・大幅変更する場合: 内容に基づいた適切なタイトルをcanvasTitleに生成
- 部分的な修正・追加の場合: canvasTitleは含めない（既存タイトルを維持）
- タイトル例: 「朝の挨拶台本」「商品説明スクリプト」「キャラクター設定書」等
- タイトルは簡潔で内容が分かりやすい日本語で生成する

## AIボイス生成向けCanvas書式ルール【重要】
canvasContentはAIボイス生成モデルが直接読み上げる音声データとなるため、以下を厳守してください：

### 記述すべき内容
- **キャラクターが発言する内容のみ**を記述
- 自然な音声読み上げに適した文章構造
- SSML形式を想定した記述（必要に応じて）

### 記述禁止事項
- ❌ 「タイトル」「説明」「あらすじ」などの筆記的な説明書き
- ❌ 罫線（===、---、***など）やボックス装飾
- ❌ 可読性向上のための記号類（◆、■、※、【】など）
- ❌ ト書きや注釈（「（笑顔で）」「（悲しそうに）」等は除く）
- ❌ 章番号や見出し番号
- ❌ 読み上げに不適切な記号や文字

### 推奨する書式例
良い例：
おはようございます。今日はとても良い天気ですね。散歩に出かけませんか？

悪い例：
=== 第1章 朝の挨拶 ===
【タイトル】朝の会話
◆キャラクター：女性
※明るく元気な声で
「おはようございます...」

## chatContentの口調・時制ルール【重要】
Canvas操作の際の返答は以下の口調で統一してください：

### Canvas更新時の返答口調
- ✅ **完了形・過去形**で返答する
- ✅ 「作成しました」「追加しました」「更新しました」「修正しました」
- ❌ 「作成しますね」「追加します」「更新します」等の未来形・予定形は避ける

### 返答例
良い例：
- 「台本を作成しました。キャラクターの自然な会話を心がけて書きました。」
- 「内容をCanvasに追加しました。感情表現を豊かにしています。」
- 「既存の台詞を修正しました。より自然な音声読み上げになります。」

悪い例：
- 「台本を作成しますね。」
- 「内容を追加します。」
- 「修正しますね。」

### Canvas未更新時（相談・質問回答）
- 現在形・丁寧語を維持（「お答えします」「提案します」等はOK）

## 重要な注意事項
- chatContentには必ずユーザーへの分かりやすい説明を含める
- canvasContentは更新が必要な時のみ含める
- JSON形式を厳密に守り、エスケープ処理も適切に行う
- 改行は\\nで表現する

## 創作支援の専門分野
1. キャラクター設定と台本作成
2. SSML形式での音声演出最適化  
3. 感情表現と話速調整のアドバイス
4. ASMRシナリオの構成提案
5. 創作活動全般のサポート

常に創造的で実践的なアドバイスを心がけ、ユーザーの創作意図を理解して具体的で役立つ提案を行ってください。
`;

export async function POST(req: Request) {
  // 強制的にコンソール出力
  const log = (message: string) => {
    console.log(message);
    console.error(message); // エラーログにも出力して確実に表示
  };
  
  try {
    log('🚀 [Canvas API] ===== CANVAS CHAT REQUEST START =====');
    const { messages, canvasContent, canvasTitle } = await req.json();
    log('📨 [Canvas API] Messages received: ' + JSON.stringify(messages, null, 2));
    log('🎨 [Canvas API] Canvas content: ' + (canvasContent || '(empty)'));
    log('🏷️ [Canvas API] Canvas title: ' + (canvasTitle || '(empty)'));

    const coreMessages = convertToCoreMessages(messages);
    log('🔄 [Canvas API] Converted to core messages: ' + JSON.stringify(coreMessages, null, 2));

    // Canvas内容をシステムプロンプトに含める
    const systemPromptWithCanvas = `${CANVAS_SYSTEM_PROMPT}

## 現在のCanvas状況
タイトル: ${canvasTitle || '無題のドキュメント'}

Canvas内容:
${canvasContent || '（空）'}

上記のCanvas内容を参考に、適切な回答を生成してください。`;

    const modelName = process.env.NEXT_PUBLIC_DEFAULT_AI_MODEL || 'openai/gpt-4o-mini';
    const hasApiKey = !!process.env.OPENROUTER_API_KEY;
    const apiKeyPrefix = process.env.OPENROUTER_API_KEY?.substring(0, 10) || 'none';
    
    log('🔧 [Canvas API] Configuration:');
    log('  Model: ' + modelName);
    log('  API Key present: ' + hasApiKey);
    log('  API Key prefix: ' + apiKeyPrefix + '...');
    log('  OpenRouter URL: https://openrouter.ai/api/v1');
    
    log('🤖 [Canvas API] Calling streamText...');
    const result = await streamText({
      model: openrouter(process.env.NEXT_PUBLIC_DEFAULT_AI_MODEL || 'openai/gpt-4o-mini'),
      system: systemPromptWithCanvas,
      messages: coreMessages,
      temperature: 0.7,
      maxRetries: 3,
    });

    log('✅ [Canvas API] streamText completed successfully');
    log('📊 [Canvas API] Result object properties: ' + Object.keys(result).join(', '));
    
    return result.toTextStreamResponse();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';
    
    log('❌ [Canvas API] ===== CANVAS CHAT REQUEST ERROR =====');
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