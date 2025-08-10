# Cloudflare Images 設定ドキュメント

## 概要

このプロジェクトでは、画像の配信にCloudflare Imagesを使用しています。Cloudflare Imagesは画像の最適化、リサイズ、CDN配信を自動で行うサービスです。

## バリアント設定

Cloudflare Images Dashboardで以下のバリアントが設定されています：

### プロファイル用バリアント

| バリアント名 | サイズ | 用途 |
|-------------|-------|------|
| `avatar` | 100 x 100 | ユーザーアイコン |
| `profile` | 400 x 400 | プロファイル画像 |

### 作品用バリアント

| バリアント名 | サイズ | 用途 |
|-------------|-------|------|
| `thumbnail` | 200 x 200 | サムネイル表示 |
| `gallery` | 300 x 300 | ギャラリー表示 |
| `preview` | 400 x 400 | プレビュー表示 |
| `medium` | 800 x 800 | 中サイズ表示 |
| `large` | 1200 x 1200 | 大サイズ表示 |
| `public` | 2048 x 2048 | フル解像度（ダウンロード用） |

## 使用方法

### TypeScript型定義

```typescript
// プロファイル用
export type ProfileImageVariant = 'avatar' | 'profile';

// 作品用
export type WorkImageVariant = 'thumbnail' | 'preview' | 'medium' | 'large' | 'gallery' | 'public';
```

### URL生成関数

```typescript
// プロファイル画像のURL生成
import { getImageURL } from '@/lib/cloudflare/images';

const avatarUrl = getImageURL(imageId, 'avatar'); // 100x100
const profileUrl = getImageURL(imageId, 'profile'); // 400x400 (デフォルト)

// 作品画像のURL生成
import { getWorkImageURL } from '@/lib/cloudflare/images';

const thumbnailUrl = getWorkImageURL(imageId, 'thumbnail'); // 200x200 (デフォルト)
const mediumUrl = getWorkImageURL(imageId, 'medium'); // 800x800
const fullUrl = getWorkImageURL(imageId, 'public'); // 2048x2048
```

### React コンポーネントでの使用例

```tsx
import Image from 'next/image';
import { getWorkImageURL } from '@/lib/cloudflare/images';

// サムネイル表示
<Image
  src={getWorkImageURL(work.imageId, 'thumbnail')}
  alt={work.title}
  width={200}
  height={200}
/>

// レスポンシブ対応での使用
const WorkCard = ({ work }) => {
  return (
    <picture>
      <source 
        media="(max-width: 768px)" 
        srcSet={getWorkImageURL(work.imageId, 'thumbnail')} 
      />
      <source 
        media="(max-width: 1200px)" 
        srcSet={getWorkImageURL(work.imageId, 'medium')} 
      />
      <img 
        src={getWorkImageURL(work.imageId, 'large')} 
        alt={work.title} 
      />
    </picture>
  );
};
```

## 環境変数

以下の環境変数が必要です：

```env
# Cloudflare Account ID
CLOUDFLARE_ACCOUNT_ID=your_account_id

# Cloudflare Images API Token
CLOUDFLARE_IMAGES_API_TOKEN=your_api_token

# Cloudflare Images Account Hash (画像配信用)
CLOUDFLARE_IMAGES_ACCOUNT_HASH=your_account_hash
```

## API エンドポイント

### 画像アップロード用

- `POST /api/works/image/upload` - 作品画像のアップロード用URL取得
- `POST /api/profile/image/upload` - プロファイル画像のアップロード用URL取得

## デバッグ機能

デバッグページ (`/debug`) で以下の機能をテストできます：

1. **接続テスト** - Cloudflare Images APIとの接続確認
2. **アップロードテスト** - 実際の画像アップロード
3. **バリエーションテスト** - 設定されているバリアントのURL確認

## 注意事項

- バリアント設定を変更した場合は、このドキュメントとTypeScript型定義を更新してください
- 新しいバリアントを追加する場合は、適切な用途とサイズを決めてから設定してください
- 画像は自動でWebP形式に最適化されます
- CDN配信により世界中で高速に配信されます

## トラブルシューティング

### よくある問題

1. **画像が表示されない**
   - 環境変数が正しく設定されているか確認
   - next.config.tsに`imagedelivery.net`が追加されているか確認

2. **アップロードが失敗する**
   - API Tokenの権限を確認
   - ファイルサイズ制限（10MB）を確認

3. **バリアントが見つからない**
   - Cloudflare Images Dashboardでバリアントが正しく設定されているか確認