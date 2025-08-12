interface DirectUploadResponse {
  result: {
    id: string;
    uploadURL: string;
  };
  success: boolean;
  errors: any[];
  messages: any[];
}

/**
 * Cloudflare Images バリアント設定
 * 
 * プロファイル用：
 * - avatar: 100x100 (ユーザーアイコン)
 * - profile: 400x400 (プロファイル画像)
 * 
 * 作品用：
 * - thumbnail: 200x200 (サムネイル)
 * - preview: 400x400 (プレビュー)
 * - medium: 800x800 (中サイズ)
 * - large: 1200x1200 (大サイズ)
 * - gallery: 300x300 (ギャラリー表示)
 * - public: 2048x2048 (フル解像度)
 */
export type ProfileImageVariant = 'avatar' | 'profile';
export type WorkImageVariant = 'thumbnail' | 'preview' | 'medium' | 'large' | 'gallery' | 'public';

interface ImageDetailsResponse {
  result: {
    id: string;
    filename: string;
    uploaded: string;
    requireSignedURLs: boolean;
    variants: string[];
  };
  success: boolean;
}

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_IMAGES_API_TOKEN;
const CLOUDFLARE_ACCOUNT_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_IMAGES_ACCOUNT_HASH || process.env.CLOUDFLARE_IMAGES_ACCOUNT_HASH;

export async function getDirectUploadURL(userId: string): Promise<{ uploadURL: string; imageId: string }> {
  const imageId = `profile-${userId}`;
  
  // FormDataを使用してCloudflare Images APIにリクエストを送信
  const formData = new FormData();
  formData.append('id', imageId);
  formData.append('requireSignedURLs', 'false');
  formData.append('metadata', JSON.stringify({
    userId,
    type: 'profile',
  }));
  
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v2/direct_upload`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        // Content-Typeヘッダーを削除（FormDataが自動設定）
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Cloudflare Images API Error Response:', errorText);
    throw new Error(`Failed to get upload URL: ${response.statusText} - ${errorText}`);
  }

  const data: DirectUploadResponse = await response.json();
  
  if (!data.success) {
    console.error('Cloudflare Images API Error:', data.errors);
    throw new Error(`Cloudflare API error: ${JSON.stringify(data.errors)}`);
  }

  return {
    uploadURL: data.result.uploadURL,
    imageId: data.result.id,
  };
}

export async function getWorkThumbnailUploadURL(userId: string, workId: string): Promise<{ uploadURL: string; imageId: string }> {
  const imageId = `work-${workId}-${userId}`;
  
  // FormDataを使用してCloudflare Images APIにリクエストを送信
  const formData = new FormData();
  formData.append('id', imageId);
  formData.append('requireSignedURLs', 'false');
  formData.append('metadata', JSON.stringify({
    userId,
    workId,
    type: 'work-thumbnail',
  }));
  
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v2/direct_upload`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        // Content-Typeヘッダーを削除（FormDataが自動設定）
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Cloudflare Images API Error Response:', errorText);
    throw new Error(`Failed to get work thumbnail upload URL: ${response.statusText} - ${errorText}`);
  }

  const data: DirectUploadResponse = await response.json();
  
  if (!data.success) {
    console.error('Cloudflare Images API Error:', data.errors);
    throw new Error(`Cloudflare API error: ${JSON.stringify(data.errors)}`);
  }

  return {
    uploadURL: data.result.uploadURL,
    imageId: data.result.id,
  };
}

export async function getCharacterImageUploadURL(userId: string, characterId: string): Promise<{ uploadURL: string; imageId: string }> {
  const imageId = `character-${characterId}-${userId}`;
  
  // FormDataを使用してCloudflare Images APIにリクエストを送信
  const formData = new FormData();
  formData.append('id', imageId);
  formData.append('requireSignedURLs', 'false');
  formData.append('metadata', JSON.stringify({
    userId,
    characterId,
    type: 'character-image',
  }));
  
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v2/direct_upload`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        // Content-Typeヘッダーを削除（FormDataが自動設定）
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Cloudflare Images API Error Response:', errorText);
    throw new Error(`Failed to get character image upload URL: ${response.statusText} - ${errorText}`);
  }

  const data: DirectUploadResponse = await response.json();
  
  if (!data.success) {
    console.error('Cloudflare Images API Error:', data.errors);
    throw new Error(`Cloudflare API error: ${JSON.stringify(data.errors)}`);
  }

  return {
    uploadURL: data.result.uploadURL,
    imageId: data.result.id,
  };
}

export async function deleteImage(imageId: string): Promise<boolean> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1/${imageId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
    }
  );

  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete image: ${response.statusText}`);
  }

  return true;
}

/**
 * プロファイル用画像URLを生成
 * @param imageId Cloudflare Images の画像ID
 * @param variant バリアント (avatar: 100x100, profile: 400x400)
 * @returns 画像の配信URL
 */
export function getImageURL(imageId: string, variant: ProfileImageVariant = 'profile'): string {
  return `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT_HASH}/${imageId}/${variant}`;
}

/**
 * 作品用画像URLを生成
 * @param imageId Cloudflare Images の画像ID
 * @param variant バリアント（thumbnail: 200x200, preview: 400x400, medium: 800x800, large: 1200x1200, gallery: 300x300, public: 2048x2048）
 * @returns 画像の配信URL
 */
export function getWorkImageURL(imageId: string, variant: WorkImageVariant = 'thumbnail'): string {
  return `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT_HASH}/${imageId}/${variant}`;
}

export async function getImageDetails(imageId: string): Promise<ImageDetailsResponse['result'] | null> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1/${imageId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to get image details: ${response.statusText}`);
  }

  const data: ImageDetailsResponse = await response.json();
  
  if (!data.success) {
    return null;
  }

  return data.result;
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (file.size > maxSize) {
    return { valid: false, error: 'ファイルサイズは10MB以下にしてください' };
  }

  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'サポートされていない画像ファイル形式です' };
  }

  return { valid: true };
}