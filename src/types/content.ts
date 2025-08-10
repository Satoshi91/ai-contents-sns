import { WorkTag } from './tag';

export type ContentType = 'voice' | 'script' | 'image' | 'work';

export interface Content {
  id: string;
  type: ContentType;
  uid?: string;
  userId?: string;
  username: string;
  displayName: string;
  userPhotoURL?: string | null;
  title: string;
  description?: string;
  
  // Voice content fields
  audioUrl?: string;
  audioId?: string;
  audioOriginalFilename?: string;
  
  // Script content fields
  scriptText?: string;
  
  // Image content fields
  imageUrl?: string;
  imageId?: string;
  
  // Work content fields (composite content)
  relatedContentIds?: string[];
  relatedContents?: Content[];
  
  // Common fields
  tags: WorkTag[];
  tagIds: string[];
  tagNames: string[];
  isR18Content: boolean;
  contentRating: 'all' | '12+' | '15+' | '18+';
  
  // Statistics
  likeCount: number;
  commentCount?: number;
  replyCount?: number;
  retweetCount?: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateContentInput {
  type: ContentType;
  title: string;
  description?: string;
  
  // Type-specific fields
  audioUrl?: string;
  audioId?: string;
  audioOriginalFilename?: string;
  scriptText?: string;
  imageUrl?: string;
  imageId?: string;
  relatedContentIds?: string[];
  
  // Common fields
  tags?: string[];
  ageRating?: 'all' | '18+';
}

export interface UpdateContentInput extends Omit<CreateContentInput, 'type'> {
  id: string;
}

export interface ContentInteraction {
  contentId: string;
  uid: string;
  type: 'like' | 'retweet' | 'reply';
  createdAt: Date;
}

// Content type specific interfaces
export interface VoiceContent extends Omit<Content, 'type' | 'scriptText' | 'imageUrl' | 'imageId' | 'relatedContentIds' | 'relatedContents'> {
  type: 'voice';
  audioUrl: string;
  audioId: string;
  audioOriginalFilename?: string;
}

export interface ScriptContent extends Omit<Content, 'type' | 'audioUrl' | 'audioId' | 'audioOriginalFilename' | 'imageUrl' | 'imageId' | 'relatedContentIds' | 'relatedContents'> {
  type: 'script';
  scriptText: string;
}

export interface ImageContent extends Omit<Content, 'type' | 'audioUrl' | 'audioId' | 'audioOriginalFilename' | 'scriptText' | 'relatedContentIds' | 'relatedContents'> {
  type: 'image';
  imageUrl: string;
  imageId: string;
}

export interface WorkContent extends Content {
  type: 'work';
  relatedContentIds: string[];
  relatedContents?: Content[];
}