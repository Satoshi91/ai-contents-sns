import { WorkTag } from './tag';
import { ContentType } from './content';

export interface Work {
  id: string;
  uid?: string;
  userId?: string;
  username: string;
  displayName: string;
  userPhotoURL?: string | null;
  title: string;
  caption?: string;
  script?: string;
  description?: string;
  prompt?: string;
  // Content type identification
  contentType?: 'voice' | 'script' | 'image' | 'mixed' | 'legacy'; // コンテンツタイプ識別
  // voice: 音声のみ, script: スクリプトのみ, image: 画像のみ, mixed: 複合コンテンツ, legacy: 従来の作品
  imageUrl?: string;
  imageId?: string;
  audioUrl?: string;
  audioId?: string;
  audioOriginalFilename?: string;
  likeCount: number;
  replyCount?: number;
  commentCount?: number;
  retweetCount?: number;
  tags: WorkTag[];
  tagIds: string[];
  tagNames: string[];
  isR18Work: boolean;
  contentRating: 'all' | '12+' | '15+' | '18+';
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateWorkInput {
  title: string;
  caption: string;
  script?: string;
  imageUrl?: string;
  imageId?: string;
  audioUrl?: string;
  audioId?: string;
  audioOriginalFilename?: string;
  tags?: string[];
  ageRating?: 'all' | '18+';
  contentType?: 'voice' | 'script' | 'image' | 'mixed'; // コンテンツタイプを指定可能
}

export interface WorkInteraction {
  workId: string;
  uid: string;
  type: 'like' | 'retweet' | 'reply';
  createdAt: Date;
}