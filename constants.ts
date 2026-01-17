import { Book, Role, User } from './types';

export const APP_NAME = "LibManager Pro";
export const CURRENCY_LOCALE = 'vi-VN';
export const FINE_PER_DAY = 5000; // 5000 VND per day late

// Seed Data
export const INITIAL_USERS: User[] = [
  {
    id: 'admin-1',
    username: 'admin',
    password: '123',
    fullName: 'Quản Trị Viên',
    role: Role.ADMIN,
    avatar: 'https://picsum.photos/id/1/200/200'
  },
  {
    id: 'lib-1',
    username: 'librarian',
    password: '123',
    fullName: 'Thủ Thư',
    role: Role.LIBRARIAN,
    avatar: 'https://ui-avatars.com/api/?name=Thu+Thu&background=random'
  },
  {
    id: 'user-1',
    username: 'user',
    password: '123',
    fullName: 'Nguyễn Văn Độc Giả',
    role: Role.USER,
    avatar: 'https://picsum.photos/id/2/200/200'
  }
];

export const INITIAL_BOOKS: Book[] = [
  {
    id: 'bk-1',
    title: 'Nhà Giả Kim',
    author: 'Paulo Coelho',
    category: 'Văn học',
    publishYear: 1988,
    totalStock: 5,
    availableStock: 3,
    imageUrl: 'https://picsum.photos/id/24/300/450',
    description: 'Cuốn sách bán chạy nhất mọi thời đại về hành trình theo đuổi ước mơ.',
    language: 'Tiếng Việt',
    translator: 'Lê Chu Cầu',
    publisher: 'NXB Văn Học'
  },
  {
    id: 'bk-2',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    category: 'Công nghệ',
    publishYear: 2008,
    totalStock: 3,
    availableStock: 1,
    imageUrl: 'https://picsum.photos/id/3/300/450',
    description: 'Hướng dẫn viết mã sạch và tối ưu cho lập trình viên.',
    language: 'Tiếng Anh',
    publisher: 'Prentice Hall'
  },
  {
    id: 'bk-3',
    title: 'Đắc Nhân Tâm',
    author: 'Dale Carnegie',
    category: 'Kỹ năng sống',
    publishYear: 1936,
    totalStock: 10,
    availableStock: 8,
    imageUrl: 'https://picsum.photos/id/4/300/450',
    description: 'Nghệ thuật thu phục lòng người.',
    language: 'Tiếng Việt',
    translator: 'Nguyễn Hiến Lê',
    publisher: 'NXB Tổng Hợp TP.HCM'
  },
  {
    id: 'bk-4',
    title: 'Sapiens: Lược sử loài người',
    author: 'Yuval Noah Harari',
    category: 'Lịch sử',
    publishYear: 2011,
    totalStock: 4,
    availableStock: 4,
    imageUrl: 'https://picsum.photos/id/5/300/450',
    description: 'Câu chuyện về sự tiến hóa và phát triển của loài người.',
    language: 'Tiếng Việt',
    translator: 'Nguyễn Thủy Chung',
    publisher: 'NXB Tri Thức'
  },
  {
    id: 'bk-5',
    title: 'Tuổi trẻ đáng giá bao nhiêu',
    author: 'Rosie Nguyễn',
    category: 'Kỹ năng sống',
    publishYear: 2016,
    totalStock: 6,
    availableStock: 0,
    imageUrl: 'https://picsum.photos/id/6/300/450',
    description: 'Cuốn sách truyền cảm hứng cho giới trẻ Việt Nam.',
    language: 'Tiếng Việt',
    publisher: 'NXB Nhã Nam'
  }
];