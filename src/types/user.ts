import { UserRole } from "@/constants/roles";

export interface UserData {
  id?: string;
  name?: string;
  email?: string;
  photoURL?: string;
  role?: UserRole | string;
  enrolledAt?: string | number | { seconds: number; nanoseconds: number };
  createdAt?: string | number | { seconds: number; nanoseconds: number };
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}
