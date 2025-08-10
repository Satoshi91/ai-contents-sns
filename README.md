# AI Contents SNS

Twitter風のSNSアプリケーション。音声作品とサムネイル画像の投稿・共有ができます。

## 技術スタック

- **フロントエンド**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **バックエンド**: Firebase (Auth, Firestore)
- **画像配信**: Cloudflare Images
- **音声配信**: Cloudflare R2
- **ホスティング**: Firebase App Hosting

## 環境変数設定

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```env
# Firebase
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# Cloudflare Images
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_IMAGES_API_TOKEN=your_api_token
CLOUDFLARE_IMAGES_ACCOUNT_HASH=your_account_hash

# Cloudflare R2
CLOUDFLARE_R2_ACCOUNT_ID=your_account_id
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key_id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_access_key
CLOUDFLARE_R2_BUCKET_NAME=your_bucket_name
CLOUDFLARE_R2_PUBLIC_DOMAIN=your_public_domain
```

## Getting Started

First, install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 主な機能

- 📝 **作品投稿**: タイトル、キャプション、サムネイル画像、音声ファイルを投稿
- 🎵 **音声再生**: グローバル音声プレイヤーで作品を再生
- 🖼️ **画像最適化**: Cloudflare Imagesによる自動リサイズ・最適化
- 👤 **ユーザー認証**: Firebase Authによる安全な認証
- ❤️ **いいね機能**: 作品にいいねを付ける
- 🔍 **デバッグ機能**: `/debug`ページでシステムの動作確認

## ページ構成

- `/` - ランディングページ
- `/home` - ホームタイムライン
- `/compose` - 作品投稿
- `/works` - 自分の作品一覧
- `/debug` - システムデバッグ（開発用）

## Cloudflare Images バリアント

詳細は [`docs/cloudflare-images.md`](./docs/cloudflare-images.md) を参照してください。

| 用途 | バリアント | サイズ |
|------|-----------|-------|
| サムネイル | `thumbnail` | 200x200 |
| ギャラリー | `gallery` | 300x300 |
| プレビュー | `preview` | 400x400 |
| 中サイズ | `medium` | 800x800 |
| 大サイズ | `large` | 1200x1200 |
| フル解像度 | `public` | 2048x2048 |

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
