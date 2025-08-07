export interface Post {
  id: string;
  uid: string;
  username: string;
  displayName: string;
  userPhotoURL?: string | null;
  content: string;
  likeCount: number;
  replyCount: number;
  retweetCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePostInput {
  content: string;
}

export interface PostInteraction {
  postId: string;
  uid: string;
  type: 'like' | 'retweet' | 'reply';
  createdAt: Date;
}