import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}

const r2Config: R2Config = {
  accountId: process.env.CLOUDFLARE_R2_ACCOUNT_ID!,
  accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
  secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  bucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
};

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${r2Config.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: r2Config.accessKeyId,
    secretAccessKey: r2Config.secretAccessKey,
  },
});

export interface AudioUploadResult {
  success: boolean;
  audioId?: string;
  audioUrl?: string;
  uploadUrl?: string;
  error?: string;
}

export interface ImageUploadResult {
  success: boolean;
  imageId?: string;
  imageUrl?: string;
  uploadUrl?: string;
  error?: string;
}

/**
 * 音声ファイルの署名付きアップロードURLを生成
 */
export async function getAudioUploadURL(
  userId: string,
  workId: string,
  fileName: string,
  fileType: string
): Promise<AudioUploadResult> {
  try {
    if (!userId || !workId || !fileName) {
      return { success: false, error: '必須パラメータが不足しています' };
    }

    // ファイル拡張子の検証
    const validExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg'];
    const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      return { 
        success: false, 
        error: `サポートされていないファイル形式です。対応形式: ${validExtensions.join(', ')}` 
      };
    }

    const audioId = `audio/${userId}/${workId}${fileExtension}`;
    
    const command = new PutObjectCommand({
      Bucket: r2Config.bucketName,
      Key: audioId,
      ContentType: fileType,
      Metadata: {
        userId,
        workId,
        originalName: fileName,
      },
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 }); // 1時間有効

    return {
      success: true,
      audioId,
      audioUrl: getAudioPublicURL(audioId),
      uploadUrl,
    };
  } catch (error) {
    console.error('R2 audio upload URL generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '署名付きURLの生成に失敗しました',
    };
  }
}

/**
 * 音声ファイルを削除
 */
export async function deleteAudioFile(audioId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: r2Config.bucketName,
      Key: audioId,
    });

    await r2Client.send(command);
    return { success: true };
  } catch (error) {
    console.error('R2 audio delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '音声ファイルの削除に失敗しました',
    };
  }
}

/**
 * 音声ファイルの公開URLを生成
 */
export function getAudioPublicURL(audioId: string): string {
  const publicDomain = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN;
  
  if (publicDomain) {
    return `https://${publicDomain}/${audioId}`;
  }
  
  // フォールバック: R2の直接URL
  return `https://${r2Config.bucketName}.${r2Config.accountId}.r2.cloudflarestorage.com/${audioId}`;
}

/**
 * 音声ファイルの署名付きダウンロードURLを生成（プライベートファイル用）
 */
export async function getAudioDownloadURL(
  audioId: string,
  expiresIn: number = 3600
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const command = new GetObjectCommand({
      Bucket: r2Config.bucketName,
      Key: audioId,
    });

    const url = await getSignedUrl(r2Client, command, { expiresIn });
    return { success: true, url };
  } catch (error) {
    console.error('R2 audio download URL generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'ダウンロードURLの生成に失敗しました',
    };
  }
}

/**
 * 音声ファイル情報を取得
 */
export async function getAudioFileInfo(audioId: string) {
  try {
    const command = new GetObjectCommand({
      Bucket: r2Config.bucketName,
      Key: audioId,
    });

    const response = await r2Client.send(command);
    return {
      success: true,
      data: {
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        metadata: response.Metadata,
      },
    };
  } catch (error) {
    console.error('R2 audio file info error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '音声ファイル情報の取得に失敗しました',
    };
  }
}

/**
 * ファイルサイズとタイプの検証
 */
export function validateAudioFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 50 * 1024 * 1024; // 50MB
  const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/m4a', 'audio/mp4', 'audio/aac', 'audio/ogg'];

  if (file.size > maxSize) {
    return { valid: false, error: 'ファイルサイズは50MB以下にしてください' };
  }

  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'サポートされていない音声ファイル形式です' };
  }

  return { valid: true };
}

/**
 * 画像ファイルの署名付きアップロードURLを生成
 */
export async function getImageUploadURL(
  userId: string,
  workId: string,
  fileName: string,
  fileType: string
): Promise<ImageUploadResult> {
  try {
    if (!userId || !workId || !fileName) {
      return { success: false, error: '必須パラメータが不足しています' };
    }

    // ファイル拡張子の検証
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      return { 
        success: false, 
        error: `サポートされていないファイル形式です。対応形式: ${validExtensions.join(', ')}` 
      };
    }

    const imageId = `images/${userId}/${workId}${fileExtension}`;
    
    const command = new PutObjectCommand({
      Bucket: r2Config.bucketName,
      Key: imageId,
      ContentType: fileType,
      Metadata: {
        userId,
        workId,
        originalName: fileName,
      },
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 }); // 1時間有効

    return {
      success: true,
      imageId,
      imageUrl: getImagePublicURL(imageId),
      uploadUrl,
    };
  } catch (error) {
    console.error('R2 image upload URL generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '署名付きURLの生成に失敗しました',
    };
  }
}

/**
 * 画像ファイルを削除
 */
export async function deleteImageFile(imageId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: r2Config.bucketName,
      Key: imageId,
    });

    await r2Client.send(command);
    return { success: true };
  } catch (error) {
    console.error('R2 image delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '画像ファイルの削除に失敗しました',
    };
  }
}

/**
 * 画像ファイルの公開URLを生成
 */
export function getImagePublicURL(imageId: string): string {
  const publicDomain = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN;
  
  if (publicDomain) {
    return `https://${publicDomain}/${imageId}`;
  }
  
  // フォールバック: R2の直接URL
  return `https://${r2Config.bucketName}.${r2Config.accountId}.r2.cloudflarestorage.com/${imageId}`;
}

/**
 * 画像ファイル情報を取得
 */
export async function getImageFileInfo(imageId: string) {
  try {
    const command = new GetObjectCommand({
      Bucket: r2Config.bucketName,
      Key: imageId,
    });

    const response = await r2Client.send(command);
    return {
      success: true,
      data: {
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        metadata: response.Metadata,
      },
    };
  } catch (error) {
    console.error('R2 image file info error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '画像ファイル情報の取得に失敗しました',
    };
  }
}

/**
 * 画像ファイルのバリデーション
 */
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