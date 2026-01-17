import { Book, BorrowRecord, BorrowStatus, Role, User, UserEditRequest } from '../types';
import { INITIAL_BOOKS, INITIAL_USERS, FINE_PER_DAY } from '../constants';

// Key Constants
const KEYS = {
  USERS: 'lib_users',
  BOOKS: 'lib_books',
  BORROWS: 'lib_borrows',
  CURRENT_USER: 'lib_current_user',
  EDIT_REQUESTS: 'lib_edit_requests'
};

class StorageService {
  constructor() {
    this.init();
  }

  private init() {
    if (!localStorage.getItem(KEYS.USERS)) {
      localStorage.setItem(KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem(KEYS.BOOKS)) {
      localStorage.setItem(KEYS.BOOKS, JSON.stringify(INITIAL_BOOKS));
    }
    if (!localStorage.getItem(KEYS.BORROWS)) {
      localStorage.setItem(KEYS.BORROWS, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.EDIT_REQUESTS)) {
      localStorage.setItem(KEYS.EDIT_REQUESTS, JSON.stringify([]));
    }
  }

  // --- Auth & User Management ---
  getUsers(): User[] {
    return JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  }

  login(username: string, password: string): User | null {
    const users: User[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
      return user;
    }
    return null;
  }

  // Public registration (Auto login)
  registerUser(fullName: string, username: string, password: string): User | string {
    const users = this.getUsers();
    
    if (users.some(u => u.username === username)) {
      return "Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác.";
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      username,
      password,
      fullName,
      role: Role.USER,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`,
      preferences: { darkMode: false, notifications: true }
    };

    users.push(newUser);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(newUser));
    
    return newUser;
  }

  // Admin creates user (No auto login)
  createUser(user: User): string | null {
    const users = this.getUsers();
    if (users.some(u => u.username === user.username)) {
      return "Tên đăng nhập đã tồn tại.";
    }
    
    // Ensure ID
    if (!user.id) user.id = `user-${Date.now()}`;
    // Ensure Avatar
    if (!user.avatar) user.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random`;
    // Ensure preferences
    if (!user.preferences) user.preferences = { darkMode: false, notifications: true };

    users.push(user);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    return null; // Success
  }

  updateUser(updatedUser: User): void {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    
    if (index !== -1) {
      // Keep existing password if not provided in update
      if (!updatedUser.password) {
        updatedUser.password = users[index].password;
      }
      
      users[index] = updatedUser;
      localStorage.setItem(KEYS.USERS, JSON.stringify(users));
      
      // Update current session if it's the same user
      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.id === updatedUser.id) {
        // Don't expose password in current user session if possible, but for this demo keep consistent
        localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(updatedUser));
      }
    }
  }

  deleteUser(id: string): void {
    let users = this.getUsers();
    // Prevent deleting the last admin
    const userToDelete = users.find(u => u.id === id);
    if (userToDelete?.role === Role.ADMIN) {
       const adminCount = users.filter(u => u.role === Role.ADMIN).length;
       if (adminCount <= 1) {
         throw new Error("Không thể xóa quản trị viên cuối cùng của hệ thống.");
       }
    }

    users = users.filter(u => u.id !== id);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  }

  logout() {
    localStorage.removeItem(KEYS.CURRENT_USER);
  }

  getCurrentUser(): User | null {
    const u = localStorage.getItem(KEYS.CURRENT_USER);
    return u ? JSON.parse(u) : null;
  }

  // --- User Edit Requests (For Librarians) ---
  getEditRequests(): UserEditRequest[] {
    return JSON.parse(localStorage.getItem(KEYS.EDIT_REQUESTS) || '[]');
  }

  createUserEditRequest(targetUser: User, newData: User, requesterUsername: string): void {
    const requests = this.getEditRequests();
    
    // Check if pending request exists for this user, replace it
    const existingIdx = requests.findIndex(r => r.targetUserId === targetUser.id);
    
    const newRequest: UserEditRequest = {
        id: `req-${Date.now()}`,
        targetUserId: targetUser.id,
        targetCurrentName: targetUser.fullName,
        requestedBy: requesterUsername,
        requestedAt: new Date().toISOString(),
        newData: newData
    };

    if (existingIdx >= 0) {
        requests[existingIdx] = newRequest;
    } else {
        requests.push(newRequest);
    }
    
    localStorage.setItem(KEYS.EDIT_REQUESTS, JSON.stringify(requests));
  }

  resolveEditRequest(requestId: string, approved: boolean): void {
      let requests = this.getEditRequests();
      const req = requests.find(r => r.id === requestId);
      
      if (req && approved) {
          this.updateUser(req.newData);
      }
      
      // Remove request regardless of approval/rejection
      requests = requests.filter(r => r.id !== requestId);
      localStorage.setItem(KEYS.EDIT_REQUESTS, JSON.stringify(requests));
  }

  // --- Books ---
  getBooks(): Book[] {
    return JSON.parse(localStorage.getItem(KEYS.BOOKS) || '[]');
  }

  saveBook(book: Book): void {
    const books = this.getBooks();
    const index = books.findIndex(b => b.id === book.id);
    
    if (index >= 0) {
      // Update
      const oldBook = books[index];
      // Logic to prevent availableStock > totalStock if totalStock reduced
      const stockDiff = book.totalStock - oldBook.totalStock;
      book.availableStock = oldBook.availableStock + stockDiff;
      if (book.availableStock < 0) book.availableStock = 0;
      books[index] = book;
    } else {
      // Create
      book.id = `bk-${Date.now()}`;
      book.availableStock = book.totalStock; // Initialize available
      books.push(book);
    }
    localStorage.setItem(KEYS.BOOKS, JSON.stringify(books));
  }

  deleteBook(id: string): void {
    let books = this.getBooks();
    books = books.filter(b => b.id !== id);
    localStorage.setItem(KEYS.BOOKS, JSON.stringify(books));
  }

  // --- Borrows ---
  getBorrows(): BorrowRecord[] {
    return JSON.parse(localStorage.getItem(KEYS.BORROWS) || '[]');
  }

  getBorrowsByUser(userId: string): BorrowRecord[] {
    return this.getBorrows().filter(b => b.userId === userId);
  }

  requestBorrow(userId: string, bookId: string, dueDateStr: string): boolean {
    const books = this.getBooks();
    const bookIndex = books.findIndex(b => b.id === bookId);
    
    if (bookIndex < 0 || books[bookIndex].availableStock <= 0) return false;

    // Decrement stock
    books[bookIndex].availableStock -= 1;
    localStorage.setItem(KEYS.BOOKS, JSON.stringify(books));

    const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
    const user = users.find((u: User) => u.id === userId);

    const now = new Date();
    // Use the provided due date string directly
    const dueDate = new Date(dueDateStr);

    const record: BorrowRecord = {
      id: `br-${Date.now()}`,
      userId,
      userName: user ? user.fullName : 'Unknown',
      bookId,
      bookTitle: books[bookIndex].title,
      borrowDate: now.toISOString(),
      dueDate: dueDate.toISOString(),
      status: BorrowStatus.PENDING 
    };

    const borrows = this.getBorrows();
    borrows.push(record);
    localStorage.setItem(KEYS.BORROWS, JSON.stringify(borrows));
    return true;
  }

  // Admin approves borrowing
  approveBorrow(recordId: string) {
    const borrows = this.getBorrows();
    const idx = borrows.findIndex(b => b.id === recordId);
    if (idx >= 0) {
      borrows[idx].status = BorrowStatus.BORROWED;
      localStorage.setItem(KEYS.BORROWS, JSON.stringify(borrows));
    }
  }

  returnBook(recordId: string, isLost: boolean = false, manualOverdueDays?: number): number {
    const borrows = this.getBorrows();
    const idx = borrows.findIndex(b => b.id === recordId);
    if (idx < 0) return 0;

    const record = borrows[idx];
    if (record.status === BorrowStatus.RETURNED || record.status === BorrowStatus.LOST) return 0;

    const now = new Date();
    record.returnDate = now.toISOString();

    let fine = 0;

    if (isLost) {
      record.status = BorrowStatus.LOST;
      fine = 200000; // Fixed fine for lost book
      record.notes = "Làm mất sách";
    } else {
      record.status = BorrowStatus.RETURNED;
      
      // Calculate late fine
      if (manualOverdueDays !== undefined && manualOverdueDays > 0) {
        // Use manual days input by admin
        fine = manualOverdueDays * FINE_PER_DAY;
        record.notes = `Trễ ${manualOverdueDays} ngày (Admin xác nhận)`;
      } else {
        // Auto check just in case (though UI should handle it)
        const dueDate = new Date(record.dueDate);
        // Reset hours for accurate day diff
        now.setHours(0,0,0,0);
        dueDate.setHours(0,0,0,0);
        
        if (now > dueDate) {
          const diffTime = Math.abs(now.getTime() - dueDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          fine = diffDays * FINE_PER_DAY;
          record.notes = `Trễ ${diffDays} ngày`;
        }
      }
      
      // Increment stock back
      const books = this.getBooks();
      const bookIdx = books.findIndex(b => b.id === record.bookId);
      if (bookIdx >= 0) {
        books[bookIdx].availableStock += 1;
        localStorage.setItem(KEYS.BOOKS, JSON.stringify(books));
      }
    }

    record.fineAmount = fine;
    borrows[idx] = record;
    localStorage.setItem(KEYS.BORROWS, JSON.stringify(borrows));
    
    return fine;
  }

  getStats() {
    const books = this.getBooks();
    const borrows = this.getBorrows();
    const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
    
    // Calculate total fines
    const totalFines = borrows.reduce((sum, b) => sum + (b.fineAmount || 0), 0);
    const activeBorrows = borrows.filter(b => b.status === BorrowStatus.BORROWED || b.status === BorrowStatus.PENDING).length;

    return {
      totalBooks: books.length,
      activeBorrows,
      totalMembers: users.filter((u: User) => u.role === Role.USER).length,
      totalFines
    };
  }
}

export const db = new StorageService();