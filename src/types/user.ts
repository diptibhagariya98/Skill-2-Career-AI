export interface UserData {
  name?: string;
  email?: string;
  photoURL?: string;
  role?: "admin" | "student" | "candidate" | string;
  enrolledAt?: string | number | { seconds: number; nanoseconds: number };
  createdAt?: string | number | { seconds: number; nanoseconds: number };
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}
