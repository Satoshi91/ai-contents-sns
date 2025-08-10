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
  // Content compatibility fields
  type?: ContentType; // 従来のworkはundefined、新しいcontentから変換したものは該当タイプ
  contentType?: 'legacy' | 'new'; // 'legacy' for existing works, 'new' for content-based works
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
}

export interface WorkInteraction {
  workId: string;
  uid: string;
  type: 'like' | 'retweet' | 'reply';
  createdAt: Date;
}