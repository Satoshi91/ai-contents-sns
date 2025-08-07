# Twitterクローン - API設計書

## 1. API概要

### 1.1 アーキテクチャ
- **Next.js API Routes** + **Firebase SDK**
- RESTful API設計
- JSON形式でのデータ交換
- JWT認証（Firebase Authentication）

### 1.2 エンドポイント規約
- Base URL: `/api/v1/`
- HTTPメソッド: GET, POST, PUT, DELETE
- レスポンス形式: JSON
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
- `400`: リクエスト不正
- `401`: 認証エラー
- `403`: 権限エラー
- `404`: リソース不在
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
      "photoURL": "https://..."
    }
  }
}
```

### 3.3 ログアウト
**エンドポイント**: `POST /api/v1/auth/logout`

#### リクエスト
```json
{}
```

#### レスポンス
```json
{
  "success": true,
  "data": {
    "message": "ログアウトしました"
  }
}
```

### 3.4 トークン更新
**エンドポイント**: `POST /api/v1/auth/refresh`

#### リクエスト
```json
{
  "refreshToken": "refresh_token_here"
}
```

#### レスポンス
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token_here",
    "refreshToken": "new_refresh_token_here"
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
    "bio": "Hello, I'm John!",
    "postCount": 42,
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
  "bio": "Updated bio",
  "photoURL": "https://..."
}
```

#### レスポンス
```json
{
  "success": true,
  "data": {
    "uid": "user_id_123",
    "username": "johndoe",
    "displayName": "John Doe Updated",
    "bio": "Updated bio",
    "photoURL": "https://...",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 4.3 現在のユーザー情報取得
**エンドポイント**: `GET /api/v1/users/me`

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
    "bio": "Hello!",
    "postCount": 42
  }
}
```

## 5. 投稿API

### 5.1 投稿作成
**エンドポイント**: `POST /api/v1/posts`

#### リクエスト
```json
{
  "content": "これはツイートです！"
}
```

#### レスポンス
```json
{
  "success": true,
  "data": {
    "id": "post_id_123",
    "content": "これはツイートです！",
    "authorId": "user_id_123",
    "authorData": {
      "username": "johndoe",
      "displayName": "John Doe",
      "photoURL": "https://..."
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "likeCount": 0,
    "replyCount": 0,
    "retweetCount": 0
  }
}
```

### 5.2 投稿一覧取得（タイムライン）
**エンドポイント**: `GET /api/v1/posts`

#### クエリパラメータ
- `limit`: 取得件数（デフォルト: 20、最大: 50）
- `cursor`: ページネーション用カーソル
- `authorId`: 特定ユーザーの投稿のみ取得（オプション）

#### レスポンス
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "post_id_123",
        "content": "これはツイートです！",
        "authorId": "user_id_123",
        "authorData": {
          "username": "johndoe",
          "displayName": "John Doe",
          "photoURL": "https://..."
        },
        "createdAt": "2024-01-01T00:00:00Z",
        "likeCount": 10,
        "replyCount": 3,
        "retweetCount": 2
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
    "content": "これはツイートです！",
    "authorId": "user_id_123",
    "authorData": {
      "username": "johndoe",
      "displayName": "John Doe",
      "photoURL": "https://..."
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "likeCount": 10,
    "replyCount": 3,
    "retweetCount": 2
  }
}
```

### 5.4 投稿更新
**エンドポイント**: `PUT /api/v1/posts/{postId}`

#### リクエスト
```json
{
  "content": "更新されたツイート内容"
}
```

#### レスポンス
```json
{
  "success": true,
  "data": {
    "id": "post_id_123",
    "content": "更新されたツイート内容",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 5.5 投稿削除
**エンドポイント**: `DELETE /api/v1/posts/{postId}`

#### レスポンス
```json
{
  "success": true,
  "data": {
    "message": "投稿を削除しました"
  }
}
```

## 6. ユーザー名チェックAPI

### 6.1 ユーザー名の利用可能性確認
**エンドポイント**: `GET /api/v1/username/check`

#### クエリパラメータ
- `username`: チェックするユーザー名

#### レスポンス
```json
{
  "success": true,
  "data": {
    "username": "johndoe",
    "available": true
  }
}
```

## 7. エラーコード一覧

| コード | 説明 |
|--------|------|
| `AUTH_REQUIRED` | 認証が必要 |
| `INVALID_TOKEN` | 無効なトークン |
| `USER_NOT_FOUND` | ユーザーが見つからない |
| `POST_NOT_FOUND` | 投稿が見つからない |
| `PERMISSION_DENIED` | 権限がない |
| `INVALID_REQUEST` | リクエストが不正 |
| `USERNAME_TAKEN` | ユーザー名が既に使用されている |
| `CONTENT_TOO_LONG` | コンテンツが長すぎる |
| `RATE_LIMIT_EXCEEDED` | レート制限超過 |
| `SERVER_ERROR` | サーバーエラー |

## 8. レート制限

### 8.1 制限値
- 認証なし: 100リクエスト/時
- 認証あり: 1000リクエスト/時
- 投稿作成: 100投稿/日

### 8.2 レスポンスヘッダー
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## 9. Firebase Functions（サーバーレス関数）

### 9.1 onUserCreate
**トリガー**: ユーザー作成時
**処理**:
- ユーザープロフィールの初期化
- ウェルカムメッセージの送信（将来）

### 9.2 onPostCreate
**トリガー**: 投稿作成時
**処理**:
- ユーザーの投稿数カウンターを更新
- 不適切なコンテンツのチェック（将来）

### 9.3 onPostDelete
**トリガー**: 投稿削除時
**処理**:
- ユーザーの投稿数カウンターを更新
- 関連データのクリーンアップ

## 10. WebSocket（リアルタイム通信）

### 10.1 接続
```javascript
// Firestore リアルタイムリスナー
const unsubscribe = firestore
  .collection('posts')
  .orderBy('createdAt', 'desc')
  .limit(20)
  .onSnapshot((snapshot) => {
    // 新規投稿の処理
  });
```

### 10.2 イベント
- `post:created`: 新規投稿
- `post:updated`: 投稿更新
- `post:deleted`: 投稿削除