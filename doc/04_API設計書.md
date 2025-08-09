# AIボイスドラマ投稿プラットフォーム - API設計書

## 1. API概要

### 1.1 アーキテクチャ
- **Next.js API Routes** + **Firebase SDK**
- RESTful API設計
- JSON形式でのデータ交換
- JWT認証（Firebase Authentication）
- マルチパート形式でのファイルアップロード対応

### 1.2 エンドポイント規約
- Base URL: `/api/v1/`
- HTTPメソッド: GET, POST, PUT, DELETE
- レスポンス形式: JSON
- ファイルアップロード: multipart/form-data
- 文字コード: UTF-8

## 2. 共通仕様

### 2.1 認証
```http
Authorization: Bearer {firebase-id-token}
```

### 2.2 共通レスポンス形式

#### 成功時
```json
{
  "success": true,
  "data": {
    // レスポンスデータ
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### エラー時
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": {}
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 2.3 HTTPステータスコード
- `200`: 成功
- `201`: 作成成功
- `202`: 処理受付（非同期処理）
- `400`: リクエスト不正
- `401`: 認証エラー
- `403`: 権限エラー
- `404`: リソース不在
- `413`: ファイルサイズ超過
- `415`: サポートしていないファイル形式
- `500`: サーバーエラー

## 3. 認証API

### 3.1 ユーザー登録
**エンドポイント**: `POST /api/v1/auth/signup`

#### リクエスト
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "johndoe",
  "displayName": "John Doe"
}
```

#### レスポンス
```json
{
  "success": true,
  "data": {
    "uid": "user_id_123",
    "email": "user@example.com",
    "username": "johndoe",
    "displayName": "John Doe",
    "token": "jwt_token_here"
  }
}
```

### 3.2 ログイン
**エンドポイント**: `POST /api/v1/auth/login`

#### リクエスト
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### レスポンス
```json
{
  "success": true,
  "data": {
    "uid": "user_id_123",
    "email": "user@example.com",
    "token": "jwt_token_here",
    "user": {
      "username": "johndoe",
      "displayName": "John Doe",
      "photoURL": "https://...",
      "postCount": 5,
      "totalPlays": 1250
    }
  }
}
```

### 3.3 ログアウト
**エンドポイント**: `POST /api/v1/auth/logout`

#### レスポンス
```json
{
  "success": true,
  "data": {
    "message": "ログアウトしました"
  }
}
```

## 4. ユーザーAPI

### 4.1 ユーザー情報取得
**エンドポイント**: `GET /api/v1/users/{uid}`

#### レスポンス
```json
{
  "success": true,
  "data": {
    "uid": "user_id_123",
    "username": "johndoe",
    "displayName": "John Doe",
    "email": "user@example.com",
    "photoURL": "https://...",
    "bio": "AIボイスドラマクリエイター",
    "postCount": 15,
    "totalPlays": 3500,
    "followerCount": 120,
    "followingCount": 75,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 4.2 ユーザー情報更新
**エンドポイント**: `PUT /api/v1/users/{uid}`

#### リクエスト
```json
{
  "displayName": "John Doe Updated",
  "bio": "プロのボイスドラマクリエイター",
  "photoURL": "https://..."
}
```

### 4.3 現在のユーザー情報取得
**エンドポイント**: `GET /api/v1/users/me`

## 5. ボイスドラマ投稿API

### 5.1 投稿作成
**エンドポイント**: `POST /api/v1/posts`

#### リクエスト（multipart/form-data）
```
title: "魔法少女の冒険 第1話"
description: "新人魔法少女ミーナの最初の冒険を描いた作品です。"
genre: "ファンタジー"
tags: ["魔法", "冒険", "ファンタジー"]
isPublic: true
audioFile: [音声ファイル (MP3/WAV/M4A)]
thumbnail: [サムネイル画像 (JPEG/PNG)] (optional)
```

#### レスポンス
```json
{
  "success": true,
  "data": {
    "id": "post_id_123",
    "title": "魔法少女の冒険 第1話",
    "description": "新人魔法少女ミーナの最初の冒険を描いた作品です。",
    "authorId": "user_id_123",
    "authorData": {
      "username": "johndoe",
      "displayName": "John Doe",
      "photoURL": "https://..."
    },
    "audioFile": {
      "url": "https://storage.googleapis.com/...",
      "filename": "episode1.mp3",
      "duration": 1245,
      "fileSize": 15680000,
      "format": "mp3"
    },
    "thumbnail": {
      "url": "https://storage.googleapis.com/...",
      "filename": "thumbnail.jpg"
    },
    "genre": "ファンタジー",
    "tags": ["魔法", "冒険", "ファンタジー"],
    "isPublic": true,
    "playCount": 0,
    "favoriteCount": 0,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 5.2 投稿一覧取得（フィード）
**エンドポイント**: `GET /api/v1/posts`

#### クエリパラメータ
- `limit`: 取得件数（デフォルト: 20、最大: 50）
- `cursor`: ページネーション用カーソル
- `authorId`: 特定ユーザーの投稿のみ取得（オプション）
- `genre`: ジャンルフィルター（オプション）
- `tag`: タグフィルター（オプション）
- `sort`: ソート順（`latest`/`popular`、デフォルト: `latest`）

#### レスポンス
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "post_id_123",
        "title": "魔法少女の冒険 第1話",
        "description": "新人魔法少女ミーナの最初の冒険...",
        "authorId": "user_id_123",
        "authorData": {
          "username": "johndoe",
          "displayName": "John Doe",
          "photoURL": "https://..."
        },
        "audioFile": {
          "duration": 1245,
          "format": "mp3"
        },
        "thumbnail": {
          "url": "https://..."
        },
        "genre": "ファンタジー",
        "tags": ["魔法", "冒険"],
        "playCount": 125,
        "favoriteCount": 8,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "nextCursor": "next_page_cursor",
    "hasMore": true
  }
}
```

### 5.3 投稿詳細取得
**エンドポイント**: `GET /api/v1/posts/{postId}`

#### レスポンス
```json
{
  "success": true,
  "data": {
    "id": "post_id_123",
    "title": "魔法少女の冒険 第1話",
    "description": "新人魔法少女ミーナの最初の冒険を描いた作品です。キャラクター設定や世界観も詳しく説明されています。",
    "authorId": "user_id_123",
    "authorData": {
      "username": "johndoe",
      "displayName": "John Doe",
      "photoURL": "https://..."
    },
    "audioFile": {
      "url": "https://storage.googleapis.com/...",
      "filename": "episode1.mp3",
      "duration": 1245,
      "fileSize": 15680000,
      "format": "mp3",
      "bitRate": 128000
    },
    "thumbnail": {
      "url": "https://...",
      "filename": "thumbnail.jpg"
    },
    "genre": "ファンタジー",
    "tags": ["魔法", "冒険", "ファンタジー"],
    "isPublic": true,
    "playCount": 125,
    "favoriteCount": 8,
    "commentCount": 3,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 5.4 投稿更新
**エンドポイント**: `PUT /api/v1/posts/{postId}`

#### リクエスト
```json
{
  "title": "魔法少女の冒険 第1話（改訂版）",
  "description": "更新された説明文",
  "tags": ["魔法", "冒険", "ファンタジー", "改訂版"],
  "isPublic": false
}
```

### 5.5 投稿削除
**エンドポイント**: `DELETE /api/v1/posts/{postId}`

#### レスポンス
```json
{
  "success": true,
  "data": {
    "message": "投稿を削除しました",
    "deletedFiles": ["audio", "thumbnail"]
  }
}
```

## 6. 再生・統計API

### 6.1 再生回数記録
**エンドポイント**: `POST /api/v1/posts/{postId}/play`

#### リクエスト
```json
{
  "duration": 1200,
  "completionRate": 0.96,
  "deviceType": "web"
}
```

#### レスポンス
```json
{
  "success": true,
  "data": {
    "playId": "play_id_123",
    "postId": "post_id_123",
    "newPlayCount": 126
  }
}
```

### 6.2 再生履歴取得
**エンドポイント**: `GET /api/v1/users/me/plays`

#### クエリパラメータ
- `limit`: 取得件数（デフォルト: 20）
- `cursor`: ページネーション用カーソル

#### レスポンス
```json
{
  "success": true,
  "data": {
    "plays": [
      {
        "id": "play_id_123",
        "postId": "post_id_123",
        "postData": {
          "title": "魔法少女の冒険 第1話",
          "authorId": "user_id_123",
          "duration": 1245
        },
        "playedAt": "2024-01-01T10:30:00Z",
        "duration": 1200,
        "completionRate": 0.96
      }
    ],
    "nextCursor": "next_cursor",
    "hasMore": true
  }
}
```

## 7. お気に入りAPI

### 7.1 お気に入り登録
**エンドポイント**: `POST /api/v1/posts/{postId}/favorite`

#### レスポンス
```json
{
  "success": true,
  "data": {
    "favoriteId": "favorite_id_123",
    "postId": "post_id_123",
    "isFavorited": true,
    "newFavoriteCount": 9
  }
}
```

### 7.2 お気に入り解除
**エンドポイント**: `DELETE /api/v1/posts/{postId}/favorite`

### 7.3 お気に入り一覧取得
**エンドポイント**: `GET /api/v1/users/me/favorites`

#### レスポンス
```json
{
  "success": true,
  "data": {
    "favorites": [
      {
        "id": "favorite_id_123",
        "postId": "post_id_123",
        "postData": {
          "title": "魔法少女の冒険 第1話",
          "authorId": "user_id_123",
          "thumbnail": "https://..."
        },
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "nextCursor": "next_cursor",
    "hasMore": true
  }
}
```

## 8. 検索API

### 8.1 作品検索
**エンドポイント**: `GET /api/v1/search/posts`

#### クエリパラメータ
- `q`: 検索クエリ（タイトル・説明文を検索）
- `genre`: ジャンルフィルター
- `tags`: タグフィルター（配列）
- `authorId`: 制作者フィルター
- `sort`: ソート順（`relevance`/`latest`/`popular`）
- `limit`: 取得件数（デフォルト: 20）

#### レスポンス
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "post_id_123",
        "title": "魔法少女の冒険 第1話",
        "description": "新人魔法少女ミーナ...",
        "authorData": {
          "username": "johndoe",
          "displayName": "John Doe"
        },
        "genre": "ファンタジー",
        "playCount": 125,
        "relevanceScore": 0.95
      }
    ],
    "totalCount": 45,
    "hasMore": true
  }
}
```

### 8.2 制作者検索
**エンドポイント**: `GET /api/v1/search/users`

#### クエリパラメータ
- `q`: 検索クエリ（ユーザー名・表示名を検索）
- `limit`: 取得件数

#### レスポンス
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "uid": "user_id_123",
        "username": "johndoe",
        "displayName": "John Doe",
        "photoURL": "https://...",
        "postCount": 15,
        "totalPlays": 3500
      }
    ],
    "totalCount": 12
  }
}
```

## 9. ランキングAPI

### 9.1 人気作品ランキング
**エンドポイント**: `GET /api/v1/ranking/posts`

#### クエリパラメータ
- `period`: 期間（`day`/`week`/`month`/`all`）
- `genre`: ジャンルフィルター（オプション）
- `limit`: 取得件数（デフォルト: 50、最大: 100）

#### レスポンス
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "rank": 1,
        "id": "post_id_456",
        "title": "宇宙戦争 最終話",
        "authorData": {
          "username": "spacecreator",
          "displayName": "宇宙クリエイター"
        },
        "playCount": 15420,
        "favoriteCount": 234,
        "genre": "SF"
      }
    ],
    "period": "week",
    "updatedAt": "2024-01-01T06:00:00Z"
  }
}
```

### 9.2 新人ランキング
**エンドポイント**: `GET /api/v1/ranking/creators`

#### レスポンス
```json
{
  "success": true,
  "data": {
    "creators": [
      {
        "rank": 1,
        "uid": "user_id_789",
        "username": "newcreator",
        "displayName": "新人クリエイター",
        "totalPlays": 5420,
        "postCount": 3,
        "accountAge": 30
      }
    ]
  }
}
```

## 10. ファイルアップロードAPI

### 10.1 音声ファイルアップロード
**エンドポイント**: `POST /api/v1/upload/audio`

#### リクエスト（multipart/form-data）
```
audioFile: [音声ファイル (MP3/WAV/M4A, 最大100MB)]
```

#### レスポンス
```json
{
  "success": true,
  "data": {
    "fileUrl": "https://storage.googleapis.com/...",
    "filename": "audio_12345.mp3",
    "fileSize": 15680000,
    "duration": 1245,
    "format": "mp3",
    "bitRate": 128000,
    "uploadId": "upload_id_123"
  }
}
```

### 10.2 画像ファイルアップロード
**エンドポイント**: `POST /api/v1/upload/image`

#### リクエスト（multipart/form-data）
```
imageFile: [画像ファイル (JPEG/PNG/WebP, 最大10MB)]
type: "thumbnail" | "profile"
```

#### レスポンス
```json
{
  "success": true,
  "data": {
    "fileUrl": "https://storage.googleapis.com/...",
    "filename": "thumbnail_12345.jpg",
    "fileSize": 256000,
    "dimensions": {
      "width": 800,
      "height": 600
    }
  }
}
```

## 11. ユーザー名チェックAPI

### 11.1 ユーザー名の利用可能性確認
**エンドポイント**: `GET /api/v1/username/check`

#### クエリパラメータ
- `username`: チェックするユーザー名

#### レスポンス
```json
{
  "success": true,
  "data": {
    "username": "johndoe",
    "available": true,
    "suggestions": ["johndoe2024", "johndoe_creator"]
  }
}
```

## 12. エラーコード一覧

| コード | 説明 |
|--------|------|
| `AUTH_REQUIRED` | 認証が必要 |
| `INVALID_TOKEN` | 無効なトークン |
| `USER_NOT_FOUND` | ユーザーが見つからない |
| `POST_NOT_FOUND` | 投稿が見つからない |
| `PERMISSION_DENIED` | 権限がない |
| `INVALID_REQUEST` | リクエストが不正 |
| `USERNAME_TAKEN` | ユーザー名が既に使用されている |
| `TITLE_TOO_LONG` | タイトルが長すぎる |
| `DESCRIPTION_TOO_LONG` | 説明文が長すぎる |
| `FILE_TOO_LARGE` | ファイルサイズが大きすぎる |
| `UNSUPPORTED_FILE_FORMAT` | サポートしていないファイル形式 |
| `AUDIO_PROCESSING_FAILED` | 音声処理に失敗 |
| `UPLOAD_FAILED` | アップロードに失敗 |
| `RATE_LIMIT_EXCEEDED` | レート制限超過 |
| `STORAGE_QUOTA_EXCEEDED` | ストレージ容量超過 |
| `SERVER_ERROR` | サーバーエラー |

## 13. レート制限

### 13.1 制限値
- 認証なし: 100リクエスト/時
- 認証あり: 1000リクエスト/時
- 投稿作成: 10投稿/日
- ファイルアップロード: 50MB/日
- 再生記録: 1000回/日

### 13.2 レスポンスヘッダー
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
X-Upload-Limit-Remaining: 45000000
```

## 14. Firebase Functions（サーバーレス関数）

### 14.1 onUserCreate
**トリガー**: ユーザー作成時
**処理**:
- ユーザープロフィールの初期化
- デフォルト設定の適用

### 14.2 onPostCreate
**トリガー**: 投稿作成時
**処理**:
- ユーザーの投稿数カウンターを更新
- 音声メタデータの抽出・保存
- サムネイル自動生成（音声波形）

### 14.3 onPostPlay
**トリガー**: 再生記録時
**処理**:
- 再生回数の更新
- 統計データの集計
- ランキングデータの更新

### 14.4 onPostDelete
**トリガー**: 投稿削除時
**処理**:
- 関連ファイルの削除（音声・画像）
- ユーザーカウンターの更新
- 関連データのクリーンアップ

### 14.5 dailyAnalytics
**スケジュール**: 毎日深夜実行
**処理**:
- 日次統計データの集計
- ランキングデータの更新
- ユーザー活動分析

## 15. WebSocket（リアルタイム通信）

### 15.1 接続
```javascript
// Firestore リアルタイムリスナー
const unsubscribe = firestore
  .collection('posts')
  .where('isPublic', '==', true)
  .orderBy('createdAt', 'desc')
  .limit(20)
  .onSnapshot((snapshot) => {
    // 新規投稿の処理
  });
```

### 15.2 イベント
- `post:created`: 新規投稿
- `post:updated`: 投稿更新
- `post:deleted`: 投稿削除
- `play:recorded`: 再生記録
- `favorite:added`: お気に入り追加

## 16. キャッシュ戦略

### 16.1 CDNキャッシュ
- 音声ファイル: 7日間キャッシュ
- サムネイル画像: 30日間キャッシュ
- API レスポンス: 10分間キャッシュ（読み取り専用）

### 16.2 ブラウザキャッシュ
- 静的リソース: 1年間キャッシュ
- APIレスポンス: ETagによる条件付きリクエスト