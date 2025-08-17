# AI SDK 5 移行ガイド

## 概要

Firebase App Hostingでのデプロイエラーを根本解決するため、現在のAI SDK 3.4.33からAI SDK 5.0.9への移行を実施します。

## 現在の状況

### 問題の経緯
1. **Firebase App Hostingデプロイエラー**: 7回連続で依存関係エラーが発生
2. **ローカルとの差異**: ローカルでは`npm run build`成功、Firebase App Hostingでは失敗
3. **根本原因**: ai@3.4.33とopenai@5.12.2の依存関係競合

### 現在の依存関係構成
```json
{
  "dependencies": {
    "ai": "^3.4.33",           // 要求: openai@^4.42.0
    "openai": "^5.12.2",       // 実際: openai@5.12.2 (互換性なし)
    "zod": "^4.0.15",          // ai SDK系: zod@^3.0.0が必要
    "@ai-sdk/anthropic": "^2.0.1",
    "@ai-sdk/openai": "^2.0.8"
  }
}
```

### 具体的なエラー内容
```
npm error ERESOLVE could not resolve
While resolving: ai@3.4.33
Found: openai@5.12.2
Could not resolve dependency: openai@^4.42.0
```

## 使用している機能の整理

### 現在の使用箇所

#### フロントエンド
- `src/app/(main)/chat/page.tsx`: `useChat` hook
- `src/components/features/AIChat/ChatMessage.tsx`: `Message` 型
- `src/types/chat.ts`: `Message` 型定義

#### APIルート
- `src/app/api/chat/route.ts`: OpenRouter経由でのチャット機能
- `src/app/api/chat/canvas/route.ts`: キャンバスモード機能

#### 使用している機能
1. **Vercel AI SDK (`ai`パッケージ)**:
   - `useChat` - リアルタイムチャット機能
   - `OpenAIStream` - ストリーミングレスポンス
   - `StreamingTextResponse` - フロントエンドへのストリーミング送信
   - `Message` 型 - チャットメッセージの型定義

2. **OpenAI SDK (`openai`パッケージ)**:
   - OpenAI互換クライアント（OpenRouter経由）
   - 型定義 (`ChatCompletionCreateParams`)
   - API呼び出し

## AI SDK 5への移行方針

### 移行理由
1. **依存関係競合の根本解決**: OpenAI v5との完全互換
2. **最新機能の活用**: o1、o3、o4シリーズreasoningモデル対応
3. **将来性**: メンテナンス性と互換性の向上
4. **統一API**: プロバイダー切り替えが簡単

### AI SDK 5の主な改善点
- OpenAI v5 API完全対応
- 統一プロバイダーAPI（OpenAI、Anthropic、Google等）
- 型安全性の向上
- React、Vue、Svelte、Angularの完全サポート

## 移行手順

### Phase 1: パッケージ更新

#### 1.1 古いパッケージ削除
```bash
npm uninstall openai
```

#### 1.2 AI SDK 5インストール
```bash
npm install ai@latest @ai-sdk/openai@latest
```

#### 1.3 依存関係確認
```bash
npm ls ai @ai-sdk/openai
```

### Phase 2: コード修正

#### 2.1 APIルートの修正

**Before: `src/app/api/chat/route.ts`**
```typescript
import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

const response = await openai.chat.completions.create({...});
const stream = OpenAIStream(response);
return new StreamingTextResponse(stream);
```

**After: AI SDK 5**
```typescript
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

const result = await streamText({
  model: openrouter('openai/gpt-4o-mini'),
  system: SYSTEM_PROMPT,
  messages,
  temperature: 0.7,
  maxTokens: 2000,
});

return result.toTextStreamResponse();
```

#### 2.2 フロントエンドの修正

**Before: `src/app/(main)/chat/page.tsx`**
```typescript
import { useChat } from 'ai/react';

const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
  api: '/api/chat'
});
```

**After: AI SDK 5**
```typescript
import { useChat } from 'ai/react';

// 基本的なAPIは変わらないが、型定義が改善
const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
  api: '/api/chat'
});
```

### Phase 3: Canvas Mode修正

#### 3.1 Canvas APIルート修正
```typescript
// Before
const response = await openai.chat.completions.create({...});
const stream = OpenAIStream(response);

// After
const result = await streamText({
  model: openrouter('openai/gpt-4o-mini'),
  system: systemPromptWithCanvas,
  messages,
});
```

### Phase 4: 型定義更新

#### 4.1 Message型の確認
```typescript
// AI SDK 5のMessage型（基本的に互換性あり）
import type { Message } from 'ai';
```

#### 4.2 必要に応じて型定義修正
- `src/types/chat.ts`
- `src/lib/hooks/useChatHistory.ts`

## 検証手順

### 1. ローカル開発環境での確認
```bash
# 依存関係の確認
npm install
npm run build

# 開発サーバー起動
npm run dev
```

### 2. 機能テスト
- [ ] 通常チャット機能の動作確認
- [ ] キャンバスモード機能の動作確認
- [ ] ストリーミング表示の確認
- [ ] エラーハンドリングの確認

### 3. Firebase App Hostingデプロイテスト
```bash
# ローカルビルド成功後
git add -A
git commit -m "feat: AI SDK 5への移行"
git push origin main
```

## ロールバック計画

移行に問題が発生した場合の復旧手順：

### 緊急ロールバック
```bash
npm install ai@3.4.33 openai@4.52.0
git checkout HEAD~1 -- src/app/api/
npm run build
```

### 段階的ロールバック
1. APIルートのみ旧版に戻す
2. フロントエンドは新版を維持
3. 部分的な動作確認

## 期待される効果

### 1. デプロイエラーの根本解決
- npm依存関係競合の完全解消
- Firebase App Hostingでの正常ビルド

### 2. 開発体験の向上
- 型安全性の向上
- 最新APIの活用
- エラーメッセージの改善

### 3. 将来性の確保
- 最新のOpenAIモデル対応
- 継続的なメンテナンス保証
- 他のAIプロバイダーとの統合容易性

## 実装スケジュール

1. **Phase 1**: パッケージ更新（30分）
2. **Phase 2-3**: コード修正（2-3時間）
3. **Phase 4**: 検証・テスト（1時間）
4. **デプロイ**: Firebase App Hosting確認（30分）

**総所要時間**: 約4-5時間

## 注意事項

### 1. API制限
- OpenRouter API使用量の確認
- レート制限への対応

### 2. 環境変数
- `OPENROUTER_API_KEY`の継続使用
- その他の環境変数は変更不要

### 3. ユーザー体験
- 既存のチャット履歴への影響なし
- レスポンス形式の一貫性維持

## 関連ドキュメント

- [AI SDK 5公式ドキュメント](https://ai-sdk.dev/docs/announcing-ai-sdk-5-beta)
- [OpenAI Provider ドキュメント](https://ai-sdk.dev/providers/ai-sdk-providers/openai)
- [Migration Guide AI SDK 4.0 to 5.0](https://ai-sdk.dev/docs/migration-guides/migration-guide-5-0)

---

**作成日**: 2025-08-11  
**最終更新**: 2025-08-11  
**担当者**: Claude Code  
**レビュー**: 要ユーザー承認