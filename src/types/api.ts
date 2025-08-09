import { User, UserProfile } from './user';
import { Work } from './work';
import { PaginatedResponse } from './common';

export interface AuthResponse {
  user: User;
  token: string;
}

export interface GetWorksResponse extends PaginatedResponse<Work> {}

export interface GetUserProfileResponse {
  profile: UserProfile;
  works: Work[];
}

export interface CreateWorkResponse {
  work: Work;
}

export interface DeleteWorkResponse {
  success: boolean;
  message: string;
}