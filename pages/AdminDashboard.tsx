import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/storageService';
import { Book, BorrowRecord, BorrowStatus, Role, User } from '../types';
import { Card, Button, Input, Badge, Select } from '../components/Components';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';
import { Plus, Trash2, Edit2, Search, CheckCircle, AlertTriangle, RefreshCcw, Save, Book as BookIcon, User as UserIcon, Archive, X, FileWarning, Clock, Calculator, BarChart3, Users, Shield } from 'lucide-react';
import { CURRENCY_LOCALE, FINE_PER_DAY } from '../constants';

const COLORS = ['#000000', '#4b5563', '#9ca3af', '#d1d5db', '#2563eb', '#dc2626'];

// Accept currentUser to check permissions
const AdminDashboard: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'books' | 'users' | 'borrows' | 'reports'>('overview');
  const [stats, setStats] = useState(db.getStats());
  const [books, setBooks] = useState<Book[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [borrows, setBorrows] = useState<BorrowRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Permission Checks
  const isSuperAdmin = currentUser.role === Role.ADMIN;
  const isLibrarian = currentUser.role === Role.LIBRARIAN;

  // Book Form State
  const [isEditingBook, setIsEditingBook] = useState(false);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);

  // User Form State
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  // Lost & Overdue Modal State
  const [selectedLostRecord, setSelectedLostRecord] = useState<BorrowRecord | null>(null);
  const [selectedOverdueRecord, setSelectedOverdueRecord] = useState<BorrowRecord | null>(null);
  const [overdueDaysInput, setOverdueDaysInput] = useState<number>(0);

  const initialBookForm = {
    title: '', 
    author: '', 
    category: '', 
    publishYear: new Date().getFullYear(),
    totalStock: 5, 
    availableStock: 5, 
    imageUrl: '', 
    description: '',
    language: '',
    translator: '',
    publisher: ''
  };
  const [bookForm, setBookForm] = useState<Partial<Book>>(initialBookForm);

  const initialUserForm = {
    username: '',
    password: '',
    fullName: '',
    role: Role.USER,
    avatar: ''
  };
  const [userForm, setUserForm] = useState<Partial<User>>(initialUserForm);

  // Load Data
  const refreshData = () => {
    setStats(db.getStats());
    setBooks(db.getBooks());
    setBorrows(db.getBorrows());
    setUsers(db.getUsers());
  };

  useEffect(() => {
    refreshData();
  }, []);

  // --- REPORT DATA CALCULATIONS ---
  const monthlyStats = useMemo(() => {
    const data: Record<string, { name: string; borrowed: number; lost: number }> = {};
    
    // Initialize last 6 months to ensure chart looks good even with no data
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getMonth() + 1}/${d.getFullYear()}`;
        data[key] = { name: key, borrowed: 0, lost: 0 };
    }

    borrows.forEach(b => {
        const d = new Date(b.borrowDate);
        const key = `${d.getMonth() + 1}/${d.getFullYear()}`;
        if (!data[key]) {
            data[key] = { name: key, borrowed: 0, lost: 0 };
        }
        data[key].borrowed += 1;
        if (b.status === BorrowStatus.LOST) {
            data[key].lost += 1;
        }
    });

    return Object.values(data);
  }, [borrows]);

  const categoryStats = useMemo(() => {
    const data: Record<string, number> = {};
    borrows.forEach(b => {
        const book = books.find(k => k.id === b.bookId);
        if (book) {
            const cat = book.category || 'Khác';
            data[cat] = (data[cat] || 0) + 1;
        }
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [borrows, books]);

  // --- Handlers: Books ---
  const handleEditBook = (book: Book) => {
    setBookForm(book);
    setEditingBookId(book.id);
    setIsEditingBook(true);
  };

  const handleCancelEdit = () => {
    setIsEditingBook(false);
    setEditingBookId(null);
    setBookForm(initialBookForm);
  };

  const handleDeleteBook = (id: string) => {
    if(window.confirm('Bạn có chắc chắn muốn xóa sách này? Hành động này không thể hoàn tác.')) {
        db.deleteBook(id);
        refreshData();
    }
  };

  const handleSaveBook = (e: React.FormEvent) => {
    e.preventDefault();
    if(!bookForm.title || !bookForm.author || !bookForm.totalStock) {
        alert("Vui lòng nhập đầy đủ các trường bắt buộc (*)");
        return;
    }

    const bookToSave = {
        ...bookForm,
        id: editingBookId || '', // ID handled by service if empty
    } as Book;

    db.saveBook(bookToSave);
    handleCancelEdit();
    refreshData();
  };

  // --- Handlers: Users ---
  const handleEditUser = (user: User) => {
    // Security Check: Librarian cannot edit Admin or other Librarians
    if (isLibrarian && (user.role === Role.ADMIN || user.role === Role.LIBRARIAN)) {
        alert("Bạn không có quyền chỉnh sửa tài khoản này.");
        return;
    }

    setUserForm({
      ...user,
      password: '' // Don't show existing password
    });
    setEditingUserId(user.id);
    setIsEditingUser(true);
  };

  const handleCancelEditUser = () => {
    setIsEditingUser(false);
    setEditingUserId(null);
    setUserForm(initialUserForm);
  };

  const handleDeleteUser = (id: string) => {
    const targetUser = users.find(u => u.id === id);
    if (!targetUser) return;

    // Security Check: Only Admin can delete users
    if (!isSuperAdmin) {
        alert("Chỉ Quản trị viên mới có quyền xóa người dùng.");
        return;
    }

    // Confirmation Dialog
    if(window.confirm(`Bạn có chắc chắn muốn xoá người dùng ${targetUser.fullName} không?`)) {
      try {
        db.deleteUser(id);
        // Optimistic update
        setUsers(users.filter(u => u.id !== id));
        refreshData();
        alert("Đã xóa người dùng thành công.");
      } catch (err: any) {
        console.error(err);
        alert("Lỗi: " + err.message);
      }
    }
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.username || !userForm.fullName) {
      alert("Vui lòng nhập tên đăng nhập và họ tên.");
      return;
    }

    if (!editingUserId && !userForm.password) {
      alert("Vui lòng nhập mật khẩu cho người dùng mới.");
      return;
    }

    // Security Check: Librarian can only create/edit USERS
    if (isLibrarian && userForm.role !== Role.USER) {
        alert("Thủ thư chỉ có thể thao tác với tài khoản Độc giả.");
        return;
    }

    const userToSave = {
      ...userForm,
      id: editingUserId || '', 
    } as User;

    if (editingUserId) {
        // UPDATE LOGIC: Direct update for everyone (Admin & Librarian)
        db.updateUser(userToSave);
        if (isLibrarian) alert("Đã cập nhật thông tin độc giả thành công.");
    } else {
        // CREATE LOGIC
        const error = db.createUser(userToSave as User);
        if (error) {
            alert(error);
            return;
        }
    }
    
    handleCancelEditUser();
    refreshData();
  };

  // --- Handlers: Borrows ---
  const handleApprove = (id: string) => {
      db.approveBorrow(id);
      refreshData();
  };

  const initiateReturn = (record: BorrowRecord) => {
      // Check if overdue
      const now = new Date();
      now.setHours(0,0,0,0);
      const dueDate = new Date(record.dueDate);
      dueDate.setHours(0,0,0,0);

      if (now > dueDate) {
          // Calculate days
          const diffTime = Math.abs(now.getTime() - dueDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          setOverdueDaysInput(diffDays);
          setSelectedOverdueRecord(record);
      } else {
          // Not overdue, process normally
          processReturn(record.id, false);
      }
  };

  const processReturn = (id: string, isLost: boolean, overdueDays?: number) => {
      const fine = db.returnBook(id, isLost, overdueDays);
      let msg = isLost ? 'Đã báo mất sách.' : 'Đã trả sách thành công.';
      if(fine > 0) msg += ` Phí phạt: ${fine.toLocaleString(CURRENCY_LOCALE)} đ`;
      
      if (!isLost && !overdueDays) {
           alert(msg);
      }
      
      // Close all modals
      setSelectedLostRecord(null);
      setSelectedOverdueRecord(null);
      refreshData();
  };

  // --- Render Helpers ---
  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(u => {
    // If Librarian, hide Admins and Librarians from the list to avoid confusion/unauthorized access
    if (isLibrarian && (u.role === Role.ADMIN || u.role === Role.LIBRARIAN)) return false;
    
    return u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           u.username.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getStatusBadge = (status: BorrowStatus) => {
      switch(status) {
          case BorrowStatus.PENDING: return <Badge color="yellow">Chờ duyệt</Badge>;
          case BorrowStatus.BORROWED: return <Badge color="blue">Đang mượn</Badge>;
          case BorrowStatus.RETURNED: return <Badge color="green">Đã trả</Badge>;
          case BorrowStatus.LOST: return <Badge color="red">Đã mất</Badge>;
          default: return <Badge color="gray">{status}</Badge>;
      }
  };

  return (
    <div className="space-y-6">
      {/* Admin Nav */}
      <div className="flex space-x-1 bg-white dark:bg-dark-card p-1 rounded-xl border border-gray-200 dark:border-dark-border shadow-sm w-fit overflow-x-auto">
        <button 
           onClick={() => setActiveTab('overview')}
           className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'overview' ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
        >
           <Archive className="w-4 h-4" /> Tổng quan
        </button>
        <button 
           onClick={() => setActiveTab('books')}
           className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'books' ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
        >
           <BookIcon className="w-4 h-4" /> Quản lý Sách
        </button>
        <button 
           onClick={() => setActiveTab('users')}
           className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap relative ${activeTab === 'users' ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
        >
           <Users className="w-4 h-4" /> Quản lý Độc giả
        </button>
        <button 
           onClick={() => setActiveTab('borrows')}
           className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'borrows' ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
        >
           <UserIcon className="w-4 h-4" /> Quản lý Mượn/Trả
        </button>
        {isSuperAdmin && (
            <button 
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'reports' ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
            <BarChart3 className="w-4 h-4" /> Báo cáo thống kê
            </button>
        )}
      </div>

      {/* --- OVERVIEW TAB --- */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-black text-white border-none dark:bg-white dark:text-black">
                    <p className="text-gray-400 dark:text-gray-600 text-sm font-bold mb-1 uppercase">Tổng đầu sách</p>
                    <h3 className="text-3xl font-extrabold">{stats.totalBooks}</h3>
                </Card>
                <Card className="bg-white dark:bg-dark-card border-l-8 border-blue-600">
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-bold mb-1 uppercase">Đang mượn</p>
                    <h3 className="text-3xl font-extrabold text-black dark:text-white">{stats.activeBorrows}</h3>
                </Card>
                <Card className="bg-white dark:bg-dark-card border-l-8 border-gray-600">
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-bold mb-1 uppercase">Thành viên</p>
                    <h3 className="text-3xl font-extrabold text-black dark:text-white">{stats.totalMembers}</h3>
                </Card>
                <Card className="bg-white dark:bg-dark-card border-l-8 border-red-600">
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-bold mb-1 uppercase">Tổng tiền phạt</p>
                    <h3 className="text-3xl font-extrabold text-black dark:text-white">{stats.totalFines.toLocaleString()} đ</h3>
                </Card>
             </div>
            
            {/* Charts */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card title="Xu hướng mượn sách gần đây" className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyStats.slice(-6)}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Bar dataKey="borrowed" name="Mượn sách" fill="#000000" radius={[4, 4, 0, 0]} barSize={40} className="dark:fill-white" />
                        </BarChart>
                    </ResponsiveContainer>
                 </Card>
                 <Card title="Hoạt động trong tuần" className="h-80">
                    <div className="flex items-center justify-center h-full text-gray-400">
                        Chức năng đang phát triển...
                    </div>
                 </Card>
             </div>
        </div>
      )}

      {/* --- REPORTS TAB (ADMIN ONLY) --- */}
      {activeTab === 'reports' && isSuperAdmin && (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart 1: Monthly Borrow vs Lost */}
                <Card title="Thống kê Mượn/Mất theo tháng" className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyStats}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#000', color: '#fff', border: 'none' }}
                            />
                            <Legend />
                            <Bar dataKey="borrowed" name="Số lượt mượn" fill="#2563eb" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="lost" name="Số sách mất" fill="#dc2626" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>

                {/* Chart 2: Category Distribution */}
                <Card title="Tỷ lệ mượn theo thể loại" className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={categoryStats}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={120}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {categoryStats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#000', color: '#fff', border: 'none' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>
            </div>

            {/* Detailed Table */}
            <Card title="Chi tiết báo cáo" className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-white uppercase bg-black dark:bg-white dark:text-black">
                            <tr>
                                <th className="px-6 py-4">Thời gian</th>
                                <th className="px-6 py-4">Tổng lượt mượn</th>
                                <th className="px-6 py-4">Số sách báo mất</th>
                                <th className="px-6 py-4">Tỷ lệ mất sách</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {monthlyStats.slice().reverse().map((item) => (
                                <tr key={item.name} className="bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-slate-900">
                                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{item.name}</td>
                                    <td className="px-6 py-4 font-medium">{item.borrowed}</td>
                                    <td className="px-6 py-4 text-red-600 font-medium">{item.lost}</td>
                                    <td className="px-6 py-4">
                                        {item.borrowed > 0 
                                            ? ((item.lost / item.borrowed) * 100).toFixed(1) + '%' 
                                            : '0%'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
      )}

      {/* --- USERS TAB --- */}
      {activeTab === 'users' && (
        <div className="space-y-6 animate-fade-in">
             <div className="flex flex-col lg:flex-row gap-6">
                {/* User List */}
                <div className={`flex-1 space-y-4 transition-all ${isEditingUser ? 'hidden lg:block lg:w-1/3' : 'w-full'}`}>
                    <div className="flex justify-between items-center bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-border">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input 
                                type="text" 
                                placeholder="Tìm độc giả..." 
                                className="pl-9 pr-4 py-2 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {!isEditingUser && (
                            <Button onClick={() => setIsEditingUser(true)} className="ml-4">
                                <Plus className="w-4 h-4 mr-1" /> Thêm mới
                            </Button>
                        )}
                    </div>

                    <div className="space-y-3">
                        {filteredUsers.map(u => (
                            <div key={u.id} className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-border flex gap-4 items-center hover:shadow-md transition-shadow">
                                <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.username}`} alt="" className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-gray-900 dark:text-white truncate">{u.fullName}</h4>
                                        {u.role === Role.ADMIN && (
                                            <Badge color="blue">Quản trị viên</Badge>
                                        )}
                                        {u.role === Role.LIBRARIAN && (
                                            <Badge color="red">Thủ thư</Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">@{u.username}</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Button variant="secondary" size="sm" onClick={() => handleEditUser(u)}>
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                    {isSuperAdmin && (
                                        <button 
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteUser(u.id);
                                            }}
                                            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors flex items-center justify-center"
                                            title="Xóa người dùng"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {filteredUsers.length === 0 && (
                            <div className="text-center py-8 text-gray-500">Không tìm thấy người dùng</div>
                        )}
                    </div>
                </div>

                {/* User Form */}
                {isEditingUser && (
                    <div className="flex-1 lg:w-2/3 animate-slide-in-right">
                        <Card title={editingUserId ? "Cập nhật độc giả" : "Thêm độc giả mới"} 
                            action={
                                <button onClick={handleCancelEditUser} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                    <X className="w-5 h-5" />
                                </button>
                            }>
                            <form onSubmit={handleSaveUser} className="space-y-5">
                                {editingUserId && (
                                    <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700 flex items-center gap-2">
                                        <span className="text-sm text-gray-500">ID:</span>
                                        <code className="text-sm font-bold text-gray-800 dark:text-gray-200">{editingUserId}</code>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-5">
                                    <Input label="Họ và tên *" value={userForm.fullName} onChange={e => setUserForm({...userForm, fullName: e.target.value})} required placeholder="Nhập họ tên đầy đủ..." />
                                    
                                    <Input label="Tên đăng nhập *" value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} required placeholder="Tên đăng nhập..." />
                                    
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1">
                                            Mật khẩu {editingUserId && '(Để trống nếu không đổi)'}
                                        </label>
                                        <Input 
                                            type="password"
                                            value={userForm.password} 
                                            onChange={e => setUserForm({...userForm, password: e.target.value})} 
                                            placeholder={editingUserId ? "********" : "Nhập mật khẩu..."}
                                            required={!editingUserId}
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1">Phân quyền</label>
                                        <Select 
                                            value={userForm.role}
                                            onChange={(e) => setUserForm({...userForm, role: e.target.value as Role})}
                                            disabled={isLibrarian} // Librarian cannot change role types (forced to create USER)
                                            options={[
                                                { label: 'Độc giả (User)', value: Role.USER },
                                                ...(isSuperAdmin ? [
                                                    { label: 'Thủ thư (Librarian)', value: Role.LIBRARIAN },
                                                    { label: 'Quản trị viên (Admin)', value: Role.ADMIN }
                                                ] : [])
                                            ]}
                                        />
                                        {isLibrarian && <p className="text-xs text-gray-500 mt-1">Thủ thư chỉ có thể tạo tài khoản Độc giả.</p>}
                                    </div>

                                    <Input label="Avatar URL" value={userForm.avatar} onChange={e => setUserForm({...userForm, avatar: e.target.value})} placeholder="https://..." />
                                </div>
                                
                                {userForm.role === Role.ADMIN && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex items-start gap-2 border border-blue-100 dark:border-blue-900/30">
                                        <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                                        <p className="text-sm text-blue-800 dark:text-blue-200">
                                            Lưu ý: Tài khoản Quản trị viên có toàn quyền truy cập hệ thống, bao gồm quản lý sách, độc giả và báo cáo.
                                        </p>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                                    <Button type="button" variant="secondary" onClick={handleCancelEditUser}>Hủy</Button>
                                    <Button type="submit">
                                        <Save className="w-4 h-4 mr-2" /> Lưu thông tin
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </div>
                )}
             </div>
        </div>
      )}

      {/* --- BOOKS TAB --- */}
      {activeTab === 'books' && (
        <div className="flex flex-col lg:flex-row gap-6 animate-fade-in">
            {/* Book List */}
            <div className={`flex-1 space-y-4 transition-all ${isEditingBook ? 'hidden lg:block lg:w-1/3' : 'w-full'}`}>
                <div className="flex justify-between items-center bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-border">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm sách..." 
                            className="pl-9 pr-4 py-2 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {!isEditingBook && (
                        <Button onClick={() => setIsEditingBook(true)} className="ml-4">
                            <Plus className="w-4 h-4 mr-1" /> Thêm sách
                        </Button>
                    )}
                </div>

                <div className="space-y-3">
                    {filteredBooks.map(book => (
                        <div key={book.id} className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-border flex gap-4 hover:shadow-md transition-shadow">
                            <img src={book.imageUrl} alt="" className="w-16 h-24 object-cover rounded bg-gray-100 dark:bg-slate-700" />
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-900 dark:text-white truncate">{book.title}</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{book.author}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge color="blue">{book.category}</Badge>
                                    <span className="text-xs text-gray-400">Kho: {book.availableStock}/{book.totalStock}</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 justify-center">
                                <Button variant="secondary" size="sm" onClick={() => handleEditBook(book)}>
                                    <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button variant="danger" size="sm" onClick={() => handleDeleteBook(book.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {filteredBooks.length === 0 && (
                        <div className="text-center py-8 text-gray-500">Không tìm thấy sách nào</div>
                    )}
                </div>
            </div>

            {/* Book Form (Add/Edit) */}
            {isEditingBook && (
                <div className="flex-1 lg:w-2/3 animate-slide-in-right">
                    <Card title={editingBookId ? "Cập nhật thông tin sách" : "Thêm sách mới"} 
                          action={
                              <button onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                  <X className="w-5 h-5" />
                              </button>
                          }>
                        <form onSubmit={handleSaveBook} className="space-y-5">
                            {editingBookId && (
                                <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700 flex items-center gap-2">
                                    <span className="text-sm text-gray-500">Mã sách:</span>
                                    <code className="text-sm font-bold text-gray-800 dark:text-gray-200">{editingBookId}</code>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-2">
                                    <Input label="Tên sách *" value={bookForm.title} onChange={e => setBookForm({...bookForm, title: e.target.value})} required placeholder="Nhập tên sách..." />
                                </div>
                                
                                <Input label="Tác giả *" value={bookForm.author} onChange={e => setBookForm({...bookForm, author: e.target.value})} required placeholder="Tên tác giả..." />
                                <Input label="Thể loại" value={bookForm.category} onChange={e => setBookForm({...bookForm, category: e.target.value})} placeholder="Vd: Văn học, Kinh tế..." />
                                
                                <Input label="Ngôn ngữ" value={bookForm.language} onChange={e => setBookForm({...bookForm, language: e.target.value})} placeholder="Vd: Tiếng Việt, Tiếng Anh..." />
                                <Input label="Người dịch" value={bookForm.translator} onChange={e => setBookForm({...bookForm, translator: e.target.value})} placeholder="Tên dịch giả (nếu có)" />
                                
                                <Input label="Nhà xuất bản" value={bookForm.publisher} onChange={e => setBookForm({...bookForm, publisher: e.target.value})} placeholder="Tên NXB" />
                                <Input label="Năm xuất bản" type="number" value={bookForm.publishYear} onChange={e => setBookForm({...bookForm, publishYear: Number(e.target.value)})} />
                                
                                <Input label="Tổng số lượng *" type="number" min="1" value={bookForm.totalStock} onChange={e => setBookForm({...bookForm, totalStock: Number(e.target.value)})} required />
                                <Input label="URL Ảnh bìa" value={bookForm.imageUrl} onChange={e => setBookForm({...bookForm, imageUrl: e.target.value})} placeholder="https://..." />
                                
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả nội dung</label>
                                    <textarea 
                                        rows={4}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-dark-card dark:border-dark-border dark:text-white"
                                        value={bookForm.description}
                                        onChange={e => setBookForm({...bookForm, description: e.target.value})}
                                        placeholder="Tóm tắt nội dung sách..."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                                <Button type="button" variant="secondary" onClick={handleCancelEdit}>Hủy</Button>
                                <Button type="submit"><Save className="w-4 h-4 mr-2" /> Lưu thông tin</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
      )}

      {/* --- BORROWS TAB --- */}
      {activeTab === 'borrows' && (
        <div className="space-y-4 animate-fade-in">
           <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-100 dark:border-dark-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-800 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-3">Mã phiếu</th>
                            <th className="px-6 py-3">Người mượn</th>
                            <th className="px-6 py-3">Sách</th>
                            <th className="px-6 py-3">Ngày mượn / Hẹn trả</th>
                            <th className="px-6 py-3">Trạng thái</th>
                            <th className="px-6 py-3 text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                        {borrows.slice().reverse().map((record) => (
                            <tr key={record.id} className="bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-slate-800">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                    #{record.id.slice(-6)}
                                </td>
                                <td className="px-6 py-4">{record.userName}</td>
                                <td className="px-6 py-4 max-w-xs truncate" title={record.bookTitle}>{record.bookTitle}</td>
                                <td className="px-6 py-4">
                                    <div>{new Date(record.borrowDate).toLocaleDateString('vi-VN')}</div>
                                    <div className="text-xs text-gray-500">→ {new Date(record.dueDate).toLocaleDateString('vi-VN')}</div>
                                </td>
                                <td className="px-6 py-4">
                                    {getStatusBadge(record.status)}
                                    {record.fineAmount && record.fineAmount > 0 ? (
                                        <div className="text-xs text-red-500 font-bold mt-1">-{record.fineAmount.toLocaleString()}đ</div>
                                    ) : null}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        {record.status === BorrowStatus.PENDING && (
                                            <Button size="sm" onClick={() => handleApprove(record.id)} className="bg-green-600 hover:bg-green-700 text-white">
                                                <CheckCircle className="w-4 h-4 mr-1" /> Duyệt
                                            </Button>
                                        )}
                                        {record.status === BorrowStatus.BORROWED && (
                                            <>
                                                <Button size="sm" onClick={() => initiateReturn(record)} className="bg-blue-600 hover:bg-blue-700 text-white">
                                                    <RefreshCcw className="w-4 h-4 mr-1" /> Trả
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="danger" 
                                                    onClick={() => setSelectedLostRecord(record)} 
                                                    title="Báo mất & Xử phạt"
                                                >
                                                    <AlertTriangle className="w-4 h-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                         {borrows.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Chưa có dữ liệu mượn trả</td>
                            </tr>
                        )}
                    </tbody>
                </table>
              </div>
           </div>
        </div>
      )}

      {/* --- OVERDUE PENALTY MODAL --- */}
      {selectedOverdueRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
             <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 border-t-4 border-yellow-500">
                <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-yellow-50 dark:bg-yellow-900/10">
                    <h3 className="text-lg font-bold text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Xử lý quá hạn
                    </h3>
                    <button onClick={() => setSelectedOverdueRecord(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                        <p>Sách <strong className="text-gray-900 dark:text-white">{selectedOverdueRecord.bookTitle}</strong> đã quá hạn.</p>
                        <p className="mt-1">Hạn trả: {new Date(selectedOverdueRecord.dueDate).toLocaleDateString('vi-VN')}</p>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-lg space-y-3">
                         <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Số ngày quá hạn:</label>
                            <input 
                                type="number" 
                                min="1"
                                className="w-20 text-center rounded border border-gray-300 py-1 px-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                value={overdueDaysInput}
                                onChange={(e) => setOverdueDaysInput(Number(e.target.value))}
                            />
                         </div>
                         <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Đơn giá phạt:</label>
                            <span className="text-gray-500 dark:text-gray-400">{FINE_PER_DAY.toLocaleString()} đ/ngày</span>
                         </div>
                         <div className="border-t border-gray-200 dark:border-slate-700 pt-2 flex items-center justify-between font-bold text-lg text-red-600 dark:text-red-400">
                             <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><Calculator className="w-4 h-4" /> Tổng tiền phạt:</span>
                             <span>{(overdueDaysInput * FINE_PER_DAY).toLocaleString()} đ</span>
                         </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-slate-900/50 flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => setSelectedOverdueRecord(null)}>Hủy bỏ</Button>
                    <Button onClick={() => processReturn(selectedOverdueRecord.id, false, overdueDaysInput)}>
                        Xác nhận trả & Phạt
                    </Button>
                </div>
             </div>
        </div>
      )}

      {/* --- LOST BOOK MODAL --- */}
      {selectedLostRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100 border-t-4 border-red-500">
                <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-red-50 dark:bg-red-900/10">
                    <h3 className="text-lg font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Xử lý báo mất sách
                    </h3>
                    <button onClick={() => setSelectedLostRecord(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div className="flex gap-4 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                         <div className="flex-1 space-y-1">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Người mượn</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{selectedLostRecord.userName}</p>
                         </div>
                         <div className="flex-1 space-y-1">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Ngày mượn</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{new Date(selectedLostRecord.borrowDate).toLocaleDateString('vi-VN')}</p>
                         </div>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Sách bị mất</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white border-l-4 border-blue-500 pl-3">{selectedLostRecord.bookTitle}</p>
                    </div>

                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-900/30">
                        <h4 className="text-red-800 dark:text-red-300 font-bold flex items-center gap-2 mb-2">
                            <FileWarning className="w-4 h-4" />
                            Thông tin xử phạt
                        </h4>
                        <div className="space-y-2 text-sm text-red-700 dark:text-red-200">
                            <div className="flex justify-between">
                                <span>Phạt làm mất tài sản:</span>
                                <span className="font-bold">200.000 đ</span>
                            </div>
                            <div className="border-t border-red-200 dark:border-red-800 my-1"></div>
                            <div className="flex justify-between text-base font-bold">
                                <span>Tổng tiền phạt:</span>
                                <span>200.000 đ</span>
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-gray-500 italic text-center">
                        * Hành động này sẽ chuyển trạng thái sách thành "Đã mất" và ghi nhận khoản phạt vào hệ thống.
                    </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-slate-900/50 flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => setSelectedLostRecord(null)}>Hủy bỏ</Button>
                    <Button variant="danger" onClick={() => processReturn(selectedLostRecord.id, true)}>
                        Xác nhận mất & Phạt
                    </Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;