// Canvas Mode related type definitions

export interface CanvasResponse {
  chatContent: string;           // AI回答文
  canvasContent?: string;        // Canvas更新内容
  canvasAction?: 'append' | 'replace' | 'insert';
  insertPosition?: number;       // insert時の位置
}

export interface CanvasDocument {
  id: string;                    // Canvas ID
  sessionId?: string;            // 関連するチャットセッション
  userId: string;                // 作成者
  title: string;                 // タイトル
  content: string;               // Canvas内容
  contentType: 'plain' | 'ssml' | 'script'; // 内容タイプ
  createdAt: Date;
  updatedAt: Date;
  version: number;               // バージョン番号
  isPublic: boolean;             // 公開設定
  tags: string[];                // タグ
}

export interface CanvasVersion {
  id: string;
  canvasId: string;
  content: string;
  version: number;
  createdAt: Date;
  authorId: string;
  changeDescription: string;     // 変更内容の説明
}

export interface CanvasState {
  content: string;
  title: string;
  lastSaved: Date | null;
  isDirty: boolean;
  wordCount: number;
  characterCount: number;
}

export type CanvasMode = 'canvas';
export type ChatMode = 'general' | 'roleplay' | CanvasMode;