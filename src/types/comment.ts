export interface Comment {
  id: string;
  workId: string;
  uid: string;
  username: string;
  displayName: string;
  userPhotoURL?: string | null;
  userImageId?: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateCommentInput {
  content: string;
}

export interface CommentWithReplies extends Comment {
  replies?: Comment[];
  replyCount?: number;
}