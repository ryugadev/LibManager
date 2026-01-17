import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/storageService';
import { Book, BorrowRecord, BorrowStatus, User } from '../types';
import { Card, Button, Input, Badge } from '../components/Components';
import { Search, BookOpen, Clock, Calendar, X, AlertTriangle } from 'lucide-react';

const UserLibrary: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [myBorrows, setMyBorrows] = useState<BorrowRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'browse' | 'my-books'>('browse');

  // Modal State
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [dueDateInput, setDueDateInput] = useState('');

  const loadData = () => {
    setBooks(db.getBooks());
    setMyBorrows(db.getBorrowsByUser(currentUser.id));
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Calculate Lost Books and Fines
  const lostRecords = useMemo(() => {
    return myBorrows.filter(b => b.status === BorrowStatus.LOST);
  }, [myBorrows]);

  const totalLostFines = useMemo(() => {
    return lostRecords.reduce((sum, record) => sum + (record.fineAmount || 0), 0);
  }, [lostRecords]);

  // Handle opening the borrow modal
  const openBorrowModal = (book: Book) => {
    // Check constraints first
    const activeCount = myBorrows.filter(b => b.status === BorrowStatus.BORROWED || b.status === BorrowStatus.PENDING).length;
    if (activeCount >= 3) {
      alert("Bạn đang mượn (hoặc chờ duyệt) quá 3 cuốn sách. Vui lòng trả bớt.");
      return;
    }

    // Set default due date to 14 days from now
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 14);
    setDueDateInput(defaultDate.toISOString().split('T')[0]);
    
    setSelectedBook(book);
  };

  const confirmBorrow = () => {
    if (!selectedBook) return;

    if (!dueDateInput) {
      alert("Vui lòng chọn ngày trả");
      return;
    }

    const selectedDate = new Date(dueDateInput);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate <= today) {
        alert("Ngày trả phải lớn hơn ngày hiện tại");
        return;
    }

    if (db.requestBorrow(currentUser.id, selectedBook.id, dueDateInput)) {
      alert("Gửi yêu cầu mượn thành công! Vui lòng chờ admin duyệt.");
      setSelectedBook(null); // Close modal
      loadData();
    } else {
      alert("Sách đã hết hoặc có lỗi xảy ra.");
    }
  };

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* LOST BOOK NOTIFICATION BANNER */}
      {lostRecords.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 p-4 rounded-r-lg animate-fade-in shadow-sm">
            <div className="flex items-start gap-4">
               <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
               </div>
               <div className="flex-1">
                  <h3 className="text-lg font-bold text-red-800 dark:text-red-300">Thông báo xử phạt</h3>
                  <p className="text-red-700 dark:text-red-200 mt-1">
                    Bạn nhận được thông báo làm mất <strong>{lostRecords.length}</strong> cuốn sách. 
                    Tổng số tiền được xử phạt là: <span className="text-xl font-bold">{totalLostFines.toLocaleString('vi-VN')} đ</span>.
                  </p>
                  
                  <div className="mt-3 bg-white/50 dark:bg-black/20 rounded-lg p-3 space-y-2">
                     {lostRecords.map(rec => (
                        <div key={rec.id} className="text-sm text-red-800 dark:text-red-200 flex justify-between items-center border-b border-red-100 dark:border-red-800/30 pb-1 last:border-0 last:pb-0">
                           <span className="font-medium">• {rec.bookTitle}</span>
                           <span className="font-bold">-{rec.fineAmount?.toLocaleString()}đ</span>
                        </div>
                     ))}
                  </div>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-3 italic">
                    * Vui lòng liên hệ thủ thư để nộp phạt và giải quyết sự cố.
                  </p>
               </div>
            </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex space-x-2 bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
          <button 
             onClick={() => setActiveTab('browse')}
             className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'browse' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
          >
            Thư viện sách
          </button>
          <button 
             onClick={() => setActiveTab('my-books')}
             className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'my-books' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
          >
            Sách của tôi ({myBorrows.filter(b => b.status === BorrowStatus.BORROWED || b.status === BorrowStatus.PENDING).length})
          </button>
        </div>
      </div>

      {activeTab === 'browse' ? (
        <>
          <div className="relative max-w-lg">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input 
              className="pl-10" 
              placeholder="Tìm kiếm theo tên sách, tác giả..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map(book => (
              <Card key={book.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
                <div className="aspect-[2/3] w-full overflow-hidden rounded-md mb-4 bg-gray-100 dark:bg-slate-800 relative group">
                  <img src={book.imageUrl} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  {book.availableStock === 0 && (
                     <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-bold px-4 py-2 bg-red-600 rounded-full text-sm">HẾT HÀNG</span>
                     </div>
                  )}
                </div>
                <div className="flex flex-col flex-grow">
                  <Badge color="blue">{book.category}</Badge>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-2 line-clamp-2">{book.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{book.author}</p>
                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <span className={`text-sm font-medium ${book.availableStock > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {book.availableStock > 0 ? `Còn ${book.availableStock} cuốn` : 'Tạm hết'}
                    </span>
                    <Button 
                      size="sm" 
                      disabled={book.availableStock === 0}
                      onClick={() => openBorrowModal(book)}
                    >
                      Mượn ngay
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Lịch sử mượn sách</h3>
          {myBorrows.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-dark-card rounded-lg border border-dashed border-gray-300 dark:border-slate-700">
               <BookOpen className="h-12 w-12 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
               <p className="text-gray-500 dark:text-gray-400">Bạn chưa mượn cuốn sách nào.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {myBorrows.slice().reverse().map(record => (
                <div key={record.id} className="bg-white dark:bg-dark-card p-4 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                     <div className={`p-3 rounded-full flex-shrink-0 ${record.status === BorrowStatus.BORROWED ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-slate-700'}`}>
                        <BookOpen className={`h-6 w-6 ${record.status === BorrowStatus.BORROWED ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                     </div>
                     <div>
                       <h4 className="font-bold text-gray-900 dark:text-white">{record.bookTitle}</h4>
                       <p className="text-sm text-gray-500 dark:text-gray-400">Mượn ngày: {new Date(record.borrowDate).toLocaleDateString('vi-VN')}</p>
                       {record.status === BorrowStatus.BORROWED && (
                         <p className="text-sm text-red-500 flex items-center mt-1">
                           <Clock className="w-3 h-3 mr-1" /> Hạn trả: {new Date(record.dueDate).toLocaleDateString('vi-VN')}
                         </p>
                       )}
                     </div>
                  </div>
                  <div className="flex flex-col md:items-end gap-1">
                    <div className="flex items-center gap-2">
                        {record.status === BorrowStatus.PENDING && <Badge color="yellow">Đang chờ duyệt</Badge>}
                        {record.status === BorrowStatus.BORROWED && <Badge color="blue">Đang đọc</Badge>}
                        {record.status === BorrowStatus.RETURNED && <Badge color="green">Đã trả</Badge>}
                        {record.status === BorrowStatus.LOST && <Badge color="red">Đã mất</Badge>}
                    </div>
                    
                    {record.fineAmount && record.fineAmount > 0 && (
                      <p className="text-xs text-red-600 font-bold mt-1">Phạt: {record.fineAmount.toLocaleString()}đ</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Borrow Confirmation Modal */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Xác nhận mượn sách</h3>
                    <button onClick={() => setSelectedBook(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div className="flex gap-4">
                        <img src={selectedBook.imageUrl} className="w-16 h-24 object-cover rounded shadow" alt="" />
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{selectedBook.title}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{selectedBook.author}</p>
                        </div>
                    </div>

                    <div className="pt-2">
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <span className="flex items-center gap-2"><Calendar className="w-4 h-4"/> Ngày hẹn trả</span>
                         </label>
                         <Input 
                            type="date" 
                            value={dueDateInput}
                            min={new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]} // Min is tomorrow
                            onChange={(e) => setDueDateInput(e.target.value)}
                         />
                         <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            * Lưu ý: Quá hạn trả sẽ bị tính phí phạt 5.000đ/ngày
                         </p>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-slate-900/50 flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => setSelectedBook(null)}>Hủy bỏ</Button>
                    <Button onClick={confirmBorrow}>Xác nhận mượn</Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default UserLibrary;