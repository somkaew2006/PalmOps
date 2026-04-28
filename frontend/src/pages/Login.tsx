import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Lock, User, LogIn, Loader2, ShieldCheck } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', { username, password });
      login(response.data.token, response.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d] relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-green/10 rounded-full blur-[120px] -z-0"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-light/5 rounded-full blur-[120px] -z-0"></div>

      <div className="max-w-md w-full p-1 bg-[#1a1a1a]/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl z-10 mx-4">
        <div className="bg-[#1a1a1a] rounded-xl p-8 md:p-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-brand-green to-emerald-600 mb-6 shadow-lg shadow-brand-green/20">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight mb-2 font-heading">PalmOps <span className="text-brand-light">Vault</span></h2>
            <p className="text-neutral-500 text-sm">Enterprise Resource Planning for Palm Oil Industry</p>
          </div>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm animate-in shake duration-300">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div className="form-group">
                <label className="text-neutral-400 text-xs font-medium uppercase tracking-wider mb-2 block">Username</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-neutral-500 group-focus-within:text-brand-light transition-colors" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-neutral-900/50 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-brand-light/50 focus:ring-1 focus:ring-brand-light/20 transition-all placeholder:text-neutral-700"
                    placeholder="Enter username"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="text-neutral-400 text-xs font-medium uppercase tracking-wider mb-2 block">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-neutral-500 group-focus-within:text-brand-light transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-neutral-900/50 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-brand-light/50 focus:ring-1 focus:ring-brand-light/20 transition-all placeholder:text-neutral-700"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-brand-green to-emerald-600 hover:from-brand-light hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-brand-green/20 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <LogIn className="h-5 w-5" />
              )}
              {isLoading ? 'Authenticating...' : 'Sign In to Dashboard'}
            </button>
            
            <div className="text-center mt-6">
              <span className="text-neutral-600 text-xs">Forgot your password? </span>
              <button type="button" className="text-brand-light text-xs font-medium hover:underline">Contact Support</button>
            </div>
          </form>
        </div>
      </div>
      
      <div className="absolute bottom-8 text-neutral-600 text-[10px] uppercase tracking-widest z-10">
        © 2026 PalmOps Ecosystem • Secure Access
      </div>
    </div>
  );
};

export default Login;
