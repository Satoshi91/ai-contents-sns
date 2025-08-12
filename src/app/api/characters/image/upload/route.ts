import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, isFirebaseAdminInitialized, requireFirebaseAdmin } from '@/lib/firebase/admin';
import { getCharacterImageUploadURL, getWorkImageURL } from '@/lib/cloudflare/images';

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
    
    const body = await request.json();
    const { characterId } = body;

    if (!characterId) {
      return NextResponse.json(
        { error: 'Missing required parameter: characterId' },
        { status: 400 }
      );
    }

    try {
      console.log('🔍 Cloudflare Images API call starting for character...');
      console.log('📋 Parameters:', { userId, characterId });
      
      // 環境変数の存在確認
      const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
      const apiToken = process.env.CLOUDFLARE_IMAGES_API_TOKEN;
      const accountHash = process.env.CLOUDFLARE_IMAGES_ACCOUNT_HASH;
      
      console.log('🔧 Environment variables check:', {
        accountId: accountId ? '✅ Set' : '❌ Missing',
        apiToken: apiToken ? '✅ Set' : '❌ Missing',
        accountHash: accountHash ? '✅ Set' : '❌ Missing'
      });

      if (!accountId || !apiToken || !accountHash) {
        console.error('❌ Missing required environment variables for Cloudflare Images');
        return NextResponse.json(
          { error: 'Cloudflare Images configuration incomplete' },
          { status: 500 }
        );
      }

      const result = await getCharacterImageUploadURL(userId, characterId);
      
      // Cloudflare Imagesの画像URLを生成（公開用variant）
      const imageUrl = getWorkImageURL(result.imageId, 'public');
      
      console.log('✅ Character image upload URL generated successfully:', {
        imageId: result.imageId,
        imageUrl: imageUrl
      });

      return NextResponse.json({
        uploadURL: result.uploadURL,
        imageId: result.imageId,
        imageUrl: imageUrl,
      });
    } catch (error) {
      console.error('❌ Cloudflare Images character upload URL generation error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return NextResponse.json(
        { 
          error: 'Failed to generate character upload URL',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Character image upload API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}