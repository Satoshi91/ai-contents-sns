import { User, UserProfile } from './user';
import { Post } from './post';
import { PaginatedResponse } from './common';

export interface AuthResponse {
  user: User;
  token: string;
}

export interface GetPostsResponse extends PaginatedResponse<Post> {}

export interface GetUserProfileResponse {
  profile: UserProfile;
  posts: Post[];
}

export interface CreatePostResponse {
  post: Post;
}

export interface DeletePostResponse {
  success: boolean;
  message: string;
}