export interface UserData {
  name?: string;
  email?: string;
  photoURL?: string;
  enrolledAt?: string | number | { seconds: number; nanoseconds: number };
  createdAt?: string | number | { seconds: number; nanoseconds: number };
  [key: string]: any;
}
