export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  thumbnail: string | null;
  library_id: string;
  storage_url: string;
  category: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  category: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  videos?: CourseVideo[];
}

export interface CourseVideo {
  id: string;
  course_id: string;
  video_id: string;
  order_index: number;
  created_at: string;
  video?: Video;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  is_admin?: boolean;
}

export interface CourseProgress {
  user_id: string;
  course_id: string;
  completed: boolean;
  completed_at: string | null;
  updated_at: string;
}

export interface VideoProgress {
  user_id: string;
  video_id: string;
  course_id: string | null;
  progress_percentage: number;
  completed: boolean;
  completed_at: string | null;
  updated_at: string;
}