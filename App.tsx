import React, { useState, useEffect } from 'react';
import { db } from './services/storageService';
import { Role, User } from './types';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import UserLibrary from './pages/UserLibrary';
import UserSettings from './pages/UserSettings';
import { LogOut, LayoutDashboard, Settings, ArrowLeft } from 'lucide-react';

type ViewState = 'dashboard' | 'settings';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');

  useEffect(() => {
    // Check for existing session
    const currentUser = db.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      applyTheme(currentUser.preferences?.darkMode);
    }
    setLoading(false);
  }, []);

  const applyTheme = (isDark?: boolean) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    applyTheme(loggedInUser.preferences?.darkMode);
    setCurrentView('dashboard');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    applyTheme(updatedUser.preferences?.darkMode);
  };

  const handleLogout = () => {
    db.logout();
    setUser(null);
    document.documentElement.classList.remove('dark'); // Reset theme on logout
  };

  const getRoleLabel = (role: Role) => {
    switch (role) {
      case Role.ADMIN: return 'Administrator';
      case Role.LIBRARIAN: return 'Thủ Thư';
      default: return 'Độc Giả';
    }
  };

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-white dark:bg-black text-blue-600 font-bold">Loading...</div>;
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Determine if user has management access
  const isManagement = user.role === Role.ADMIN || user.role === Role.LIBRARIAN;

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg flex flex-col transition-colors duration-200">
      {/* Navbar */}
      <header className="bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border sticky top-0 z-10 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
              <LayoutDashboard className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold text-black dark:text-white">LibManager Pro</span>
              <span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold border ${
                user.role === Role.ADMIN 
                  ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-100 dark:border-red-800'
                  : user.role === Role.LIBRARIAN
                  ? 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-100 dark:border-purple-800'
                  : 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600'
              }`}>
                {getRoleLabel(user.role)}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setCurrentView(currentView === 'settings' ? 'dashboard' : 'settings')}
                  className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full py-1 px-2 transition-colors"
                >
                    <img src={user.avatar || 'https://ui-avatars.com/api/?name=' + user.username} alt="Avatar" className="h-8 w-8 rounded-full bg-gray-200 object-cover border border-gray-300 dark:border-gray-600" />
                    <span className="text-sm font-bold text-gray-800 dark:text-white hidden md:block">{user.fullName}</span>
                </button>
              </div>

              <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-1"></div>

              <div className="flex gap-1">
                {currentView === 'settings' ? (
                   <button 
                     onClick={() => setCurrentView('dashboard')}
                     className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-full transition-colors"
                     title="Quay lại"
                   >
                     <ArrowLeft className="h-5 w-5" />
                   </button>
                ) : (
                   <button 
                     onClick={() => setCurrentView('settings')}
                     className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-full transition-colors"
                     title="Cài đặt"
                   >
                     <Settings className="h-5 w-5" />
                   </button>
                )}
                
                <button 
                  onClick={handleLogout}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-gray-800 rounded-full transition-colors"
                  title="Đăng xuất"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'settings' ? (
          <UserSettings currentUser={user} onUpdateUser={handleUpdateUser} />
        ) : (
          <>
            {isManagement ? (
              <AdminDashboard currentUser={user} />
            ) : (
              <UserLibrary currentUser={user} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-dark-card border-t border-gray-200 dark:border-dark-border mt-auto transition-colors duration-200">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} LibManager Pro System. Designed for Libraries.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;