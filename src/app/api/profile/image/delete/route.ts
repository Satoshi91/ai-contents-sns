import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, isFirebaseAdminInitialized, requireFirebaseAdmin } from '@/lib/firebase/admin';
import { deleteImage } from '@/lib/cloudflare/images';

export async function DELETE(request: NextRequest) {
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
    const { imageId } = await request.json();
    
    if (!imageId || !imageId.includes(userId)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    await deleteImage(imageId);
    
    const { adminDb: db } = requireFirebaseAdmin();
    await db.collection('users').doc(userId).update({
      photoURL: null,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}