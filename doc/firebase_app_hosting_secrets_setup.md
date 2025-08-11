# Firebase App Hosting 環境変数設定ガイド

## 概要
Firebase App Hostingでは、機密情報を含む環境変数をSecret Managerを使用して安全に管理します。

## 設定が必要な環境変数一覧

### 必須（エラー解消に必要）
```bash
# AI API関連
firebase apphosting:secrets:set OPENROUTER_API_KEY      # OpenRouter APIキー（チャット機能）

# Firebase Admin SDK
firebase apphosting:secrets:set FIREBASE_ADMIN_PROJECT_ID      # プロジェクトID
firebase apphosting:secrets:set FIREBASE_ADMIN_CLIENT_EMAIL    # サービスアカウントメール
firebase apphosting:secrets:set FIREBASE_ADMIN_PRIVATE_KEY     # 秘密鍵（改行含む）
```

### 重要（主要機能に必要）
```bash
# Aivis TTS API
firebase apphosting:secrets:set AIVIS_API_KEY                  # Aivis Cloud APIキー
firebase apphosting:secrets:set AIVIS_DEFAULT_MODEL_UUID       # デフォルトモデルUUID

# Cloudflare設定
firebase apphosting:secrets:set CLOUDFLARE_ACCOUNT_ID          # アカウントID
firebase apphosting:secrets:set CLOUDFLARE_IMAGES_API_TOKEN    # Images APIトークン
firebase apphosting:secrets:set CLOUDFLARE_IMAGES_ACCOUNT_HASH # アカウントハッシュ
```

### 公開設定（NEXT_PUBLIC_系）
```bash
# Firebase設定（クライアント側）
firebase apphosting:secrets:set NEXT_PUBLIC_FIREBASE_API_KEY
firebase apphosting:secrets:set NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
firebase apphosting:secrets:set NEXT_PUBLIC_FIREBASE_PROJECT_ID
firebase apphosting:secrets:set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
firebase apphosting:secrets:set NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
firebase apphosting:secrets:set NEXT_PUBLIC_FIREBASE_APP_ID
firebase apphosting:secrets:set NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID

# その他の公開設定
firebase apphosting:secrets:set NEXT_PUBLIC_DEFAULT_AI_MODEL
firebase apphosting:secrets:set NEXT_PUBLIC_CLOUDFLARE_IMAGES_ACCOUNT_HASH
```

## 設定手順

### 1. Firebase CLIでの設定（推奨）

各コマンドを実行すると、値の入力を求められます：

```bash
$ firebase apphosting:secrets:set OPENROUTER_API_KEY
? Enter a value for OPENROUTER_API_KEY: [ここに.env.localから値をペースト]
```

**注意事項:**
- 値を入力する際、引用符は不要です
- `FIREBASE_ADMIN_PRIVATE_KEY`は改行を含むため、コピペ時に注意
- 入力した値は画面に表示されません（セキュリティのため）

### 2. Firebase Console UIでの設定

1. https://console.firebase.google.com にアクセス
2. プロジェクト `imageservice-e438b` を選択
3. 左メニューから「App Hosting」を選択
4. 「Settings」または「環境変数」タブを開く
5. 「Add Variable」または「変数を追加」をクリック
6. キーと値を入力して保存

### 3. 設定確認

設定後、以下のコマンドで確認できます：

```bash
# 特定のシークレットの情報を表示
firebase apphosting:secrets:describe OPENROUTER_API_KEY

# アクセス権限の確認
firebase apphosting:secrets:access OPENROUTER_API_KEY
```

## apphosting.yamlでの参照方法

環境変数設定後、apphosting.yamlで以下のように参照します：

```yaml
env:
  - variable: OPENROUTER_API_KEY
    secret: OPENROUTER_API_KEY
    availability:
      - BUILD
      - RUNTIME
  
  - variable: FIREBASE_ADMIN_PROJECT_ID
    secret: FIREBASE_ADMIN_PROJECT_ID
    availability:
      - BUILD
      - RUNTIME
```

## トラブルシューティング

### エラー: "The OPENAI_API_KEY environment variable is missing"
→ `OPENROUTER_API_KEY`を設定してください

### エラー: "Project ID is not set in Firebase App Hosting environment"
→ `FIREBASE_ADMIN_PROJECT_ID`を設定してください

### エラー: "Service account object must contain a string 'project_id' property"
→ Firebase Admin SDK関連の3つの環境変数をすべて設定してください

## セキュリティに関する注意

- これらの環境変数値は`.env.local`にのみ保存し、GitHubにはコミットしない
- `apphosting.yaml`には変数名のみ記載し、実際の値は記載しない
- Secret Managerで管理される値は暗号化されて保存される

## 設定完了後

1. すべての環境変数を設定
2. `apphosting.yaml`が更新されていることを確認
3. Firebase App Hostingに再デプロイ：
   ```bash
   firebase apphosting:rollouts:create default
   ```