import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { db } from '../services/storageService';
import { Button, Input, Card } from '../components/Components';
import { Save, User as UserIcon, Bell, Moon, Sun, Calendar } from 'lucide-react';

interface UserSettingsProps {
  currentUser: User;
  onUpdateUser: (updatedUser: User) => void;
}

const UserSettings: React.FC<UserSettingsProps> = ({ currentUser, onUpdateUser }) => {
  const [formData, setFormData] = useState({
    fullName: currentUser.fullName,
    avatar: currentUser.avatar || '',
    birthDate: currentUser.birthDate || '',
  });

  const [preferences, setPreferences] = useState({
    darkMode: currentUser.preferences?.darkMode || false,
    notifications: currentUser.preferences?.notifications ?? true,
  });

  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    // Sync local state if currentUser prop changes
    setFormData({
        fullName: currentUser.fullName,
        avatar: currentUser.avatar || '',
        birthDate: currentUser.birthDate || '',
    });
    setPreferences({
        darkMode: currentUser.preferences?.darkMode || false,
        notifications: currentUser.preferences?.notifications ?? true,
    });
  }, [currentUser]);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const updatedUser: User = {
      ...currentUser,
      fullName: formData.fullName,
      avatar: formData.avatar,
      birthDate: formData.birthDate,
      preferences: preferences
    };

    try {
      db.updateUser(updatedUser);
      onUpdateUser(updatedUser); // Update App state
      setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Có lỗi xảy ra khi lưu thông tin.' });
    }
  };

  // Auto save preferences on toggle
  const togglePreference = (key: 'darkMode' | 'notifications') => {
    const newPrefs = { ...preferences, [key]: !preferences[key] };
    setPreferences(newPrefs);
    
    // Create temp user object to save immediately
    const updatedUser: User = {
        ...currentUser,
        fullName: formData.fullName,
        avatar: formData.avatar,
        birthDate: formData.birthDate,
        preferences: newPrefs
    };
    db.updateUser(updatedUser);
    onUpdateUser(updatedUser);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Cài đặt tài khoản</h2>

      {/* Profile Section */}
      <Card title="Thông tin cá nhân" className="relative">
        <form onSubmit={handleSave} className="space-y-6">
            <div className="flex flex-col items-center sm:flex-row gap-6">
                <div className="relative group cursor-pointer">
                    <img 
                        src={formData.avatar || `https://ui-avatars.com/api/?name=${formData.fullName}`} 
                        alt="Avatar" 
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg dark:border-slate-700"
                    />
                </div>
                
                <div className="flex-1 space-y-4 w-full">
                    <Input 
                        label="Họ và tên" 
                        value={formData.fullName} 
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    />
                    <div className="relative">
                         <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none mt-6">
                            <Calendar className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input 
                            label="Ngày sinh" 
                            type="date"
                            value={formData.birthDate} 
                            onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                 <Input 
                    label="Đường dẫn Avatar (URL)" 
                    placeholder="https://example.com/my-avatar.jpg"
                    value={formData.avatar} 
                    onChange={(e) => setFormData({...formData, avatar: e.target.value})}
                />
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-slate-700">
                <Button type="submit">
                    <Save className="w-4 h-4 mr-2" /> Lưu thay đổi
                </Button>
            </div>
        </form>
      </Card>

      {/* Preferences Section */}
      <Card title="Tuỳ chỉnh ứng dụng">
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                        {preferences.darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </div>
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">Giao diện tối</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Chuyển đổi giao diện sáng/tối để bảo vệ mắt</p>
                    </div>
                </div>
                <button 
                    onClick={() => togglePreference('darkMode')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${preferences.darkMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-700'}`}
                >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-700 pt-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600 dark:bg-purple-900/30 dark:text-purple-300">
                        <Bell className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">Thông báo</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Nhận thông báo khi sách đến hạn trả</p>
                    </div>
                </div>
                <button 
                    onClick={() => togglePreference('notifications')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${preferences.notifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-700'}`}
                >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.notifications ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>
        </div>
      </Card>

      {/* Toast Notification */}
      {message && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white animate-fade-in ${message.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            {message.text}
        </div>
      )}
    </div>
  );
};

export default UserSettings;