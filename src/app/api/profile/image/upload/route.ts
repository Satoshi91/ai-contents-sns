import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, isFirebaseAdminInitialized, requireFirebaseAdmin } from '@/lib/firebase/admin';
import { getDirectUploadURL, getImageURL } from '@/lib/cloudflare/images';

export async function POST(request: NextRequest) {
  try {
    // Firebase Admin SDK初期化チェック
    if (!isFirebaseAdminInitialized()) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    
    let decodedToken;
    try {
      const { adminAuth: auth } = requireFirebaseAdmin();
      decodedToken = await auth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;
    
    const { uploadURL, imageId } = await getDirectUploadURL(userId);
    
    const imageUrls = {
      avatar: getImageURL(imageId, 'avatar'),
      profile: getImageURL(imageId, 'profile'),
    };

    return NextResponse.json({
      uploadURL,
      imageId,
      imageUrls,
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}