export type UserRole = "admin" | "partner" | "board";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface SessionUser {
  user: User;
}