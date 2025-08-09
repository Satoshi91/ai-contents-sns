import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { getAudioUploadURL } from '@/lib/cloudflare/r2';

export async function POST(request: NextRequest) {
  try {
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
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;
    
    const body = await request.json();
    const { fileName, fileType, workId } = body;

    if (!fileName || !fileType || !workId) {
      return NextResponse.json(
        { error: 'Missing required parameters: fileName, fileType, workId' },
        { status: 400 }
      );
    }

    // 音声ファイル形式の検証
    const validTypes = [
      'audio/mp3',
      'audio/mpeg',
      'audio/wav',
      'audio/x-wav',
      'audio/m4a',
      'audio/mp4',
      'audio/aac',
      'audio/ogg',
    ];

    if (!validTypes.includes(fileType.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid file type. Supported formats: MP3, WAV, M4A, AAC, OGG' },
        { status: 400 }
      );
    }

    try {
      const result = await getAudioUploadURL(userId, workId, fileName, fileType);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to generate upload URL' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        uploadUrl: result.uploadUrl,
        audioId: result.audioId,
        audioUrl: result.audioUrl,
        originalFilename: fileName,
      });
    } catch (error) {
      console.error('R2 upload URL generation error:', error);
      return NextResponse.json(
        { error: 'Failed to generate upload URL' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Audio upload API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}