interface DirectUploadResponse {
  result: {
    id: string;
    uploadURL: string;
  };
  success: boolean;
  errors: any[];
  messages: any[];
}

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
const CLOUDFLARE_ACCOUNT_HASH = process.env.CLOUDFLARE_IMAGES_ACCOUNT_HASH;

export async function getDirectUploadURL(userId: string): Promise<{ uploadURL: string; imageId: string }> {
  const imageId = `profile-${userId}`;
  
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v2/direct_upload`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: imageId,
        requireSignedURLs: false,
        metadata: {
          userId,
          type: 'profile',
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get upload URL: ${response.statusText}`);
  }

  const data: DirectUploadResponse = await response.json();
  
  if (!data.success) {
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

export function getImageURL(imageId: string, variant: 'avatar' | 'profile' | 'public' = 'profile'): string {
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