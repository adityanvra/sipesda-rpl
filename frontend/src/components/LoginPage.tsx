import React, { useState } from 'react';
import { User } from '../types';
import { useDatabaseContext } from '../contexts/DatabaseContext';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const { db, isLoading: isDbLoading } = useDatabaseContext();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || isDbLoading) return;
    
    setLoading(true);
    setError('');

    try {
      const user = await db.authenticateUser(username, password);
      if (user) {
        onLogin(user);
      } else {
        setError('Username atau password salah');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat login');
    } finally {
      setLoading(false);
    }
  };

  if (isDbLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#65465F] to-[#6C7278] flex items-center justify-center p-4">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#65465F] to-[#6C7278] flex items-center justify-center p-4">
      <div className="bg-[rgba(255,255,255,0.15)] backdrop-blur-sm rounded-lg p-8 w-full max-w-sm shadow-xl">
        {/* Logo & Title */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3">
            <img src="/image.png" alt="MI Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-white text-xl font-bold uppercase">SIPESDA</h2>
          <p className="text-white/80 text-xs mt-1">Sistem Pembayaran Sekolah Dasar</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Field */}
          <div className="relative">
            <div className="flex items-center">
              <img src="/username.png" alt="Username" className="w-5 h-5 mr-2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full px-3 py-2 bg-white/90 border border-gray-300 rounded-md focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="relative">
            <div className="flex items-center">
              <img src="/password.png" alt="Password" className="w-5 h-5 mr-2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-3 py-2 bg-white/90 border border-gray-300 rounded-md focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center mt-2">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              id="rememberMe"
              className="mr-2"
            />
            <label htmlFor="rememberMe" className="text-white/80 text-xs">Ingat Saya</label>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading || !db}
            className="w-full bg-[#75456C] text-white py-2 rounded-md font-medium mt-2 hover:bg-[#65365C]"
          >
            Login
          </button>
        </form>

        {/* Demo Credentials */}
        <div className="mt-4 p-3 bg-white/10 rounded-md">
          <p className="text-white/80 text-xs mb-1">Demo Login:</p>
          <p className="text-white/70 text-xs">Admin: admin / admin123</p>
          <p className="text-white/70 text-xs">Operator: operator / operator123</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;