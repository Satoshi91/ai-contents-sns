# Canvas Mode 設計書

## 1. 概要

### 1.1 機能概要
Canvas Mode は、AIチャット機能の拡張機能として、ChatGPTライクなデュアルペイン構成を提供します。左側でAIとの対話を行い、右側に成果物となるテキスト（スクリプト、台本、企画書など）をリアルタイムで表示・編集できます。

### 1.2 目的
- **AI回答文と成果物の分離**: チャットでの会話と実際のテキスト成果物を明確に区別
- **協働的な文書作成**: AIと協力してテキストを段階的に作成・改善
- **効率的な創作プロセス**: ワンストップでの企画から完成まで

### 1.3 ユースケース
1. **台本制作**: AIとの対話でキャラクターや設定を詰めながら、台本をcanvasに蓄積
2. **企画書作成**: アイデア出しから具体的な企画書への落とし込み
3. **SSML生成**: プレーンテキストからSSML形式への変換・最適化
4. **長文創作**: 小説やシナリオなど長文コンテンツの段階的作成

## 2. システム設計

### 2.1 全体アーキテクチャ

```
┌─────────────────────────────────────────────────────┐
│                Canvas Mode UI                        │
├─────────────────────┬───────────────────────────────┤
│   Chat Pane (60%)   │      Canvas Pane (40%)       │
│ ┌─────────────────┐ │ ┌───────────────────────────┐ │
│ │  AI Chat        │ │ │     Text Editor           │ │
│ │  Messages       │ │ │   (Textarea/CodeMirror)   │ │
│ │                 │ │ │                           │ │
│ └─────────────────┘ │ └───────────────────────────┘ │
│ ┌─────────────────┐ │ ┌───────────────────────────┐ │
│ │  Input Field    │ │ │  Canvas Controls          │ │
│ └─────────────────┘ │ │  (Save/Clear/Export)      │ │
│                     │ └───────────────────────────┘ │
└─────────────────────┴───────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────┐
│               API Layer                              │
├─────────────────────────────────────────────────────┤
│  /api/chat/canvas - Canvas専用エンドポイント            │
│  - OpenRouter LLM との通信                            │
│  - 構造化レスポンス処理                                │
│  - Context管理（Canvas内容をPromptに含める）           │
└─────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────┐
│             Data Persistence                         │
├─────────────────────────────────────────────────────┤
│  Firebase Firestore                                 │
│  - canvasContents collection                        │
│  - リアルタイム同期                                   │
│  - バージョン履歴                                     │
└─────────────────────────────────────────────────────┘
```

### 2.2 データフロー

#### 基本フロー
1. **ユーザー入力** → Chat Input
2. **Canvas内容をContextに含める** → LLM Prompt構築
3. **LLM処理** → 構造化レスポンス生成
4. **レスポンス解析** → ChatとCanvas部分を分離
5. **UI更新** → Chat履歴 + Canvas内容更新
6. **永続化** → Firestore保存

#### Canvas修正フロー
1. **Canvas内容修正指示** → "2行目を○○に変更して"
2. **現在のCanvas内容をPromptに挿入** → Full Context
3. **LLM処理** → 修正版Canvas生成
4. **Canvas内容置換** → リアルタイム更新

## 3. 技術仕様

### 3.1 レスポンス形式

#### LLMへのPrompt設計
```typescript
const CANVAS_SYSTEM_PROMPT = `
あなたはCanvas Modeでの創作支援AIです。
ユーザーとの会話を通じて、右側のCanvasエリアにテキスト成果物を作成します。

## レスポンス形式
必ず以下のJSON形式で回答してください：

{
  "chatContent": "ユーザーへの回答メッセージ",
  "canvasContent": "Canvas に表示/更新するテキスト（必要時のみ）",
  "canvasAction": "append" | "replace" | "insert",
  "insertPosition": 数値（insert時のみ）
}

## Canvas操作パターン
- "replace": Canvas全体を置き換え
- "append": Canvas末尾に追加
- "insert": 指定位置に挿入

## 現在のCanvas内容
${canvasContent || "（空）"}

上記を踏まえて、適切なレスポンスを生成してください。
`;
```

#### 構造化レスポンス型定義
```typescript
interface CanvasResponse {
  chatContent: string;           // AI回答文
  canvasContent?: string;        // Canvas更新内容
  canvasAction?: 'append' | 'replace' | 'insert';
  insertPosition?: number;       // insert時の位置
}
```

### 3.2 コンポーネント設計

#### CanvasMode.tsx
```typescript
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useChat } from 'ai/react';
import { ChatMessage } from '../ChatMessage';
import { CanvasEditor } from './CanvasEditor';
import { CanvasControls } from './CanvasControls';
import { useCanvasSync } from '@/lib/hooks/useCanvasSync';

interface CanvasModeProps {
  sessionId?: string;
  userId?: string;
}

export function CanvasMode({ sessionId, userId }: CanvasModeProps) {
  const [canvasContent, setCanvasContent] = useState('');
  const [canvasTitle, setCanvasTitle] = useState('無題のドキュメント');
  
  // Canvas内容の永続化
  const { saveCanvas, loadCanvas } = useCanvasSync(sessionId, userId);
  
  // Canvas専用のチャット
  const { messages, input, handleInputChange, isLoading, error } = useChat({
    api: '/api/chat/canvas',
    body: { canvasContent, canvasTitle },
    onFinish: handleCanvasResponse
  });

  const handleCanvasResponse = useCallback(async (message: any) => {
    try {
      const response: CanvasResponse = JSON.parse(message.content);
      
      // Chat内容は通常通り履歴に追加される
      // Canvas内容のみ特別処理
      if (response.canvasContent) {
        switch (response.canvasAction) {
          case 'replace':
            setCanvasContent(response.canvasContent);
            break;
          case 'append':
            setCanvasContent(prev => prev + '\n' + response.canvasContent);
            break;
          case 'insert':
            // 位置指定での挿入
            const lines = canvasContent.split('\n');
            lines.splice(response.insertPosition || 0, 0, response.canvasContent);
            setCanvasContent(lines.join('\n'));
            break;
        }
        
        // 自動保存
        if (sessionId && userId) {
          await saveCanvas(canvasContent, canvasTitle);
        }
      }
    } catch (error) {
      console.error('Canvas response parsing error:', error);
    }
  }, [canvasContent, canvasTitle, sessionId, userId, saveCanvas]);

  return (
    <div className="flex h-full">
      {/* Chat Pane - 60% */}
      <div className="w-3/5 border-r border-gray-200 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
        </div>
        
        <ChatInput
          value={input}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          placeholder="Canvasの内容について指示してください..."
        />
      </div>
      
      {/* Canvas Pane - 40% */}
      <div className="w-2/5 flex flex-col">
        <CanvasControls
          title={canvasTitle}
          onTitleChange={setCanvasTitle}
          onSave={() => saveCanvas(canvasContent, canvasTitle)}
          onClear={() => setCanvasContent('')}
          onExport={() => exportCanvas(canvasContent, canvasTitle)}
        />
        
        <CanvasEditor
          content={canvasContent}
          onChange={setCanvasContent}
          placeholder="AIとの会話でここにテキストが生成されます..."
        />
      </div>
    </div>
  );
}
```

### 3.3 データベース設計

#### Firestore Schema
```typescript
// canvasContents collection
interface CanvasDocument {
  id: string;                    // Canvas ID
  sessionId?: string;            // 関連するチャットセッション
  userId: string;                // 作成者
  title: string;                 // タイトル
  content: string;               // Canvas内容
  contentType: 'plain' | 'ssml' | 'script'; // 内容タイプ
  createdAt: Timestamp;
  updatedAt: Timestamp;
  version: number;               // バージョン番号
  isPublic: boolean;             // 公開設定
  tags: string[];                // タグ
}

// canvasVersions subcollection
interface CanvasVersion {
  id: string;
  canvasId: string;
  content: string;
  version: number;
  createdAt: Timestamp;
  authorId: string;
  changeDescription: string;     // 変更内容の説明
}
```

### 3.4 APIエンドポイント

#### /api/chat/canvas/route.ts
```typescript
import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

const CANVAS_SYSTEM_PROMPT = `
あなたはCanvas Modeでの創作支援AIです。
ユーザーとの会話を通じて、右側のCanvasエリアにテキスト成果物を作成します。

## レスポンス形式
必ず以下のJSON形式で回答してください：

{
  "chatContent": "ユーザーへの回答メッセージ",
  "canvasContent": "Canvas に表示/更新するテキスト（必要時のみ）",
  "canvasAction": "append" | "replace" | "insert",
  "insertPosition": 数値（insert時のみ）
}

## Canvas操作ルール
1. 新しい内容を作成する場合: "replace"
2. 既存内容に追加する場合: "append"
3. 特定位置に挿入する場合: "insert"

## 重要な注意事項
- chatContentには必ずユーザーへの説明を含める
- canvasContentは更新が必要な時のみ含める
- JSON形式を厳密に守る
`;

export async function POST(req: Request) {
  try {
    const { messages, canvasContent, canvasTitle } = await req.json();

    // Canvas内容をシステムプロンプトに含める
    const systemPromptWithCanvas = `${CANVAS_SYSTEM_PROMPT}

## 現在のCanvas内容
タイトル: ${canvasTitle || '無題'}
内容:
${canvasContent || '（空）'}
`;

    const response = await openai.chat.completions.create({
      model: process.env.NEXT_PUBLIC_DEFAULT_AI_MODEL || 'openai/gpt-4o-mini',
      stream: true,
      messages: [
        {
          role: 'system',
          content: systemPromptWithCanvas,
        },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error('Canvas Chat API error:', error);
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
```

## 4. UI/UX設計

### 4.1 レスポンシブ対応

#### デスクトップ（1024px以上）
- 横並び2ペイン構成
- Chat: 60%, Canvas: 40%
- リサイザーで幅調整可能

#### タブレット（768px-1023px）
- 横並び維持
- Chat: 55%, Canvas: 45%
- フォントサイズ調整

#### モバイル（767px以下）
- タブ切り替え式
- Chat/Canvasタブで表示切り替え
- タブ間でのドラッグ&ドロップは無効

### 4.2 Canvas Editor仕様

#### エディタ機能
- **プレーンテキストエディタ**: TextArea ベース
- **シンタックスハイライト**: SSML用（将来拡張）
- **行番号表示**: オプション
- **自動保存**: 5秒間隔のデバウンス
- **フォントサイズ調整**: 14px-20px
- **ダークモード対応**: システム設定連動

#### エディタControls
```typescript
interface CanvasControlsProps {
  title: string;
  onTitleChange: (title: string) => void;
  onSave: () => void;
  onClear: () => void;
  onExport: (format: 'txt' | 'json' | 'ssml') => void;
  wordCount: number;
  characterCount: number;
}
```

## 5. 実装手順

### Phase 1: Core Canvas Mode (1-2日)
1. **APIエンドポイント作成**
   - `/api/chat/canvas/route.ts`
   - 構造化レスポンス処理
   - OpenRouter連携

2. **基本コンポーネント実装**
   - `CanvasMode.tsx` - メインコンテナ
   - `CanvasEditor.tsx` - テキストエディタ
   - `CanvasControls.tsx` - 制御UI

3. **モードセレクタ統合**
   - 既存チャット画面にCanvas選択追加
   - モード切り替え機能

### Phase 2: Advanced Features (2-3日)
1. **永続化機能**
   - Firebase連携
   - 自動保存
   - バージョン履歴

2. **レスポンシブ対応**
   - モバイル用タブUI
   - リサイザー実装

3. **エクスポート機能**
   - テキスト/JSON/SSML出力
   - ファイルダウンロード

### Phase 3: Integration & Polish (1日)
1. **既存システム統合**
   - Works機能との連携
   - 音声生成連携

2. **エラーハンドリング**
   - ネットワークエラー対応
   - JSON Parse エラー対応
   - 自動復旧機能

3. **パフォーマンス最適化**
   - メモ化
   - 遅延読み込み
   - バンドルサイズ最適化

## 6. テスト戦略

### 6.1 単体テスト
- Canvas レスポンス解析ロジック
- Firestore CRUD操作
- エラーハンドリング

### 6.2 結合テスト
- API ↔ フロントエンド連携
- リアルタイム同期
- モード切り替え

### 6.3 E2Eテスト
- 基本的なCanvas作成フロー
- レスポンシブ動作
- 永続化機能

## 7. パフォーマンス考慮事項

### 7.1 フロントエンド最適化
- **デバウンス**: 自動保存の頻度制御（5秒）
- **メモ化**: Canvas内容の不要な再レンダリング防止
- **遅延読み込み**: エディタコンポーネントの動的インポート
- **仮想化**: 大量テキスト対応（将来拡張）

### 7.2 API最適化
- **ストリーミング**: リアルタイム応答表示
- **キャッシュ**: よく使用されるプロンプトテンプレート
- **圧縮**: Canvas内容のgzip圧縮
- **レート制限**: API使用量制御

### 7.3 データベース最適化
- **インデックス**: userId, sessionId, updatedAt
- **複合クエリ最適化**: ユーザー別Canvas一覧取得
- **パーティション**: 大量データ対応（将来）

## 8. セキュリティ考慮事項

### 8.1 入力検証
- Canvas内容のサイズ制限（10MB）
- XSS対策（DOMPurify）
- JSON構造検証

### 8.2 認証・認可
- Firebase Authentication連携
- Canvas所有権検証
- 公開Canvas の適切な権限管理

### 8.3 データ保護
- Canvas内容の暗号化（機密情報対応）
- GDPR コンプライアンス
- データ保持期間ポリシー

## 9. モニタリング・分析

### 9.1 使用状況メトリクス
- Canvas作成数
- 平均セッション時間
- モード別利用率
- エラー発生率

### 9.2 品質メトリクス
- API レスポンス時間
- Canvas保存成功率
- ユーザー継続率
- 機能満足度スコア

## 10. 将来の拡張可能性

### 10.1 機能拡張
- **リアルタイム協働編集**: 複数ユーザーでの同時編集
- **バージョン管理UI**: GitライクなDiff表示
- **テンプレートギャラリー**: Canvas雛形の共有
- **AI提案機能**: 自動改善案の表示

### 10.2 技術拡張
- **CodeMirror統合**: 高機能エディタ
- **WebSocket**: リアルタイム同期
- **PWA対応**: オフライン編集機能
- **音声入力**: Speech-to-Text連携

### 10.3 エコシステム連携
- **外部ツール連携**: Notion, Google Docs
- **API公開**: サードパーティ製ツール連携
- **プラグインシステム**: カスタム機能追加

## 11. まとめ

Canvas Mode は、既存のAIチャット機能を大幅に拡張し、創作活動における「思考」と「成果物」を明確に分離する画期的な機能です。

### 期待される効果
1. **創作効率の向上**: ワンストップでのアイデア創出〜成果物作成
2. **品質向上**: AIとの対話による段階的な改善プロセス
3. **ユーザー満足度向上**: 直感的で強力な創作ツールの提供

### 成功指標
- Canvas機能の利用率: 30%以上
- 平均Canvas作成時間: 15分以下
- ユーザー継続率: 80%以上
- 機能満足度: 4.5/5.0以上

この設計書に基づいて段階的な実装を進めることで、VOICARISMEプラットフォームの価値を大幅に向上させるCanvas Mode機能を実現します。