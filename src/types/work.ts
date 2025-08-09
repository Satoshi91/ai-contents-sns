export interface Work {
  id: string;
  uid?: string;
  userId?: string;
  username: string;
  displayName: string;
  userPhotoURL?: string | null;
  title: string;
  caption?: string;
  description?: string;
  prompt?: string;
  imageUrl?: string;
  audioUrl?: string;
  audioId?: string;
  audioOriginalFilename?: string;
  likeCount: number;
  replyCount?: number;
  commentCount?: number;
  retweetCount?: number;
  tags?: string[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateWorkInput {
  title: string;
  caption: string;
  audioUrl?: string;
  audioId?: string;
  audioOriginalFilename?: string;
}

export interface WorkInteraction {
  workId: string;
  uid: string;
  type: 'like' | 'retweet' | 'reply';
  createdAt: Date;
}