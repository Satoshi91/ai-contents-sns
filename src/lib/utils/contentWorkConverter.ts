import { Content } from '@/types/content';
import { Work } from '@/types/work';

/**
 * Content型からWork型への変換関数
 * 既存のWorksCardやWorksSectionで表示できるようにする
 */
export function convertContentToWork(content: Content): Work {
  return {
    id: content.id,
    uid: content.uid,
    userId: content.userId,
    username: content.username,
    displayName: content.displayName,
    userPhotoURL: content.userPhotoURL,
    title: content.title,
    caption: content.description || '',
    script: content.scriptText || undefined,
    description: content.description,
    imageUrl: content.imageUrl,
    imageId: content.imageId,
    audioUrl: content.audioUrl,
    audioId: content.audioId,
    audioOriginalFilename: content.audioOriginalFilename,
    likeCount: content.likeCount,
    replyCount: content.replyCount,
    commentCount: content.commentCount,
    retweetCount: content.retweetCount,
    tags: content.tags,
    tagIds: content.tagIds,
    tagNames: content.tagNames,
    isR18Work: content.isR18Content,
    contentRating: content.contentRating,
    createdAt: content.createdAt,
    updatedAt: content.updatedAt,
    // Content-specific fields
    type: content.type,
    contentType: 'new' as const,
  };
}

/**
 * Work型からContent型への変換関数（逆変換）
 * 新しいコンテンツシステムで扱えるようにする
 */
export function convertWorkToContent(work: Work): Content {
  // 既存のworkは'work'タイプとして扱う
  const contentType = work.type || 'work';
  
  return {
    id: work.id,
    type: contentType,
    uid: work.uid,
    userId: work.userId,
    username: work.username,
    displayName: work.displayName,
    userPhotoURL: work.userPhotoURL,
    title: work.title,
    description: work.caption || work.description || undefined,
    
    // Type-specific fields
    audioUrl: work.audioUrl,
    audioId: work.audioId,
    audioOriginalFilename: work.audioOriginalFilename,
    scriptText: work.script,
    imageUrl: work.imageUrl,
    imageId: work.imageId,
    
    // Common fields
    tags: work.tags,
    tagIds: work.tagIds,
    tagNames: work.tagNames,
    isR18Content: work.isR18Work,
    contentRating: work.contentRating,
    likeCount: work.likeCount,
    commentCount: work.commentCount,
    replyCount: work.replyCount,
    retweetCount: work.retweetCount,
    createdAt: work.createdAt,
    updatedAt: work.updatedAt,
  };
}

/**
 * Content配列をWork配列に変換する関数
 */
export function convertContentsToWorks(contents: Content[]): Work[] {
  return contents.map(convertContentToWork);
}

/**
 * Work配列をContent配列に変換する関数
 */
export function convertWorksToContents(works: Work[]): Content[] {
  return works.map(convertWorkToContent);
}

/**
 * ContentTypeに基づいてWork表示用のアイコンや説明を取得する関数
 */
export function getWorkDisplayInfo(work: Work) {
  if (work.contentType === 'new' && work.type) {
    switch (work.type) {
      case 'voice':
        return {
          icon: '🎤',
          typeLabel: 'ボイス',
          description: '音声コンテンツ'
        };
      case 'script':
        return {
          icon: '📝',
          typeLabel: 'スクリプト', 
          description: 'テキストコンテンツ'
        };
      case 'image':
        return {
          icon: '🎨',
          typeLabel: 'イラスト',
          description: '画像コンテンツ'
        };
      case 'work':
        return {
          icon: '🎭',
          typeLabel: '作品',
          description: '複合コンテンツ'
        };
      default:
        return {
          icon: '📄',
          typeLabel: 'コンテンツ',
          description: 'その他のコンテンツ'
        };
    }
  }
  
  // 従来のworkの場合
  return {
    icon: '🎭',
    typeLabel: '作品',
    description: 'AIボイスドラマ作品'
  };
}

/**
 * ContentTypeに基づいてWork内容の主要な部分を取得する関数
 */
export function getPrimaryWorkContent(work: Work): {
  hasAudio: boolean;
  hasImage: boolean;
  hasScript: boolean;
  primaryType: 'audio' | 'image' | 'script' | 'mixed';
} {
  const hasAudio = !!(work.audioUrl && work.audioId);
  const hasImage = !!(work.imageUrl && work.imageId);
  const hasScript = !!(work.script && work.script.trim());
  
  let primaryType: 'audio' | 'image' | 'script' | 'mixed' = 'mixed';
  
  if (work.type === 'voice' || (hasAudio && !hasImage && !hasScript)) {
    primaryType = 'audio';
  } else if (work.type === 'image' || (hasImage && !hasAudio && !hasScript)) {
    primaryType = 'image';
  } else if (work.type === 'script' || (hasScript && !hasAudio && !hasImage)) {
    primaryType = 'script';
  }
  
  return {
    hasAudio,
    hasImage, 
    hasScript,
    primaryType
  };
}