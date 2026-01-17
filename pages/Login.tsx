import React, { useState } from 'react';
import { db } from '../services/storageService';
import { Button, Input } from '../components/Components';
import { Library, User, KeyRound, UserPlus } from 'lucide-react';
import { User as UserType } from '../types';

interface LoginProps {
  onLogin: (user: UserType) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegister) {
      if (!fullName.trim()) {
        setError('Vui lòng nhập họ tên');
        return;
      }
      const result = db.registerUser(fullName, username, password);
      if (typeof result === 'string') {
        setError(result); // Registration failed with message
      } else {
        onLogin(result); // Registration success, auto login
      }
    } else {
      // Login Mode
      const user = db.login(username, password);
      if (user) {
        onLogin(user);
      } else {
        setError('Tên đăng nhập hoặc mật khẩu không đúng');
      }
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError('');
    setUsername('');
    setPassword('');
    setFullName('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-gray-200 p-8 space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <Library className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-black">LibManager Pro</h2>
          <p className="mt-2 text-sm text-gray-600 font-medium">
            {isRegister ? 'Đăng ký tài khoản độc giả' : 'Đăng nhập để tiếp tục'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {isRegister && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <UserPlus className="h-5 w-5 text-gray-500" />
                </div>
                <Input 
                  className="pl-10"
                  placeholder="Họ và tên hiển thị" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={isRegister}
                />
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-500" />
              </div>
              <Input 
                className="pl-10"
                placeholder="Tên đăng nhập" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound className="h-5 w-5 text-gray-500" />
              </div>
              <Input 
                type="password"
                className="pl-10"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-md border border-red-200 flex items-center">
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" className="w-full font-bold shadow-md" size="lg">
            {isRegister ? 'Đăng ký ngay' : 'Đăng nhập'}
          </Button>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm font-bold text-blue-700 hover:text-blue-800 hover:underline focus:outline-none"
            >
              {isRegister ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký ngay'}
            </button>
          </div>
        </form>
        
        {!isRegister && (
          <div className="text-center text-xs text-gray-500 border-t pt-4 font-medium">
            <p>Tài khoản mẫu:</p>
            <p>Admin: admin / 123</p>
            <p>Thủ thư: librarian / 123</p>
            <p>User: user / 123</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;