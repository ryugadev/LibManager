export enum Role {
  ADMIN = 'ADMIN',
  LIBRARIAN = 'LIBRARIAN',
  USER = 'USER'
}

export interface UserPreferences {
  darkMode: boolean;
  notifications: boolean;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  password?: string; // In real app, this is hashed. keeping simple for demo.
  avatar?: string;
  birthDate?: string; // ISO Date YYYY-MM-DD
  preferences?: UserPreferences;
}

export interface UserEditRequest {
  id: string;
  targetUserId: string;
  targetCurrentName: string;
  requestedBy: string; // Librarian username
  requestedAt: string; // ISO Date
  newData: User; // The proposed new data
}

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  publishYear: number;
  totalStock: number;
  availableStock: number;
  imageUrl: string;
  description?: string;
  // New fields
  language?: string;
  translator?: string;
  publisher?: string;
}

export enum BorrowStatus {
  PENDING = 'PENDING',       // User requested
  BORROWED = 'BORROWED',     // Admin approved / Active
  RETURNED = 'RETURNED',     // Returned on time
  OVERDUE = 'OVERDUE',       // System flag (virtual status often calculated)
  LOST = 'LOST'              // Marked as lost
}

export interface BorrowRecord {
  id: string;
  userId: string;
  userName: string;
  bookId: string;
  bookTitle: string;
  borrowDate: string; // ISO Date string
  dueDate: string;    // ISO Date string
  returnDate?: string; // ISO Date string
  status: BorrowStatus;
  fineAmount?: number;
  notes?: string;
}

export interface Statistic {
  totalBooks: number;
  activeBorrows: number;
  totalMembers: number;
  totalFines: number;
}