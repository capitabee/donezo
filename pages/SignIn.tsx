import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
import api from '../services/api';

const SignIn = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.signin(email, password);
      
      if (response.user && !response.user.onboarding_completed) {
        localStorage.setItem('onboardingName', response.user.name);
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-purple-600/20"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-40 right-20 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        
        <div className="relative z-10 flex flex-col justify-center p-16 text-white">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center">
                <span className="text-2xl font-bold text-white">D</span>
              </div>
              <span className="text-2xl font-bold">Donezo</span>
            </div>
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Welcome Back,
              <span className="block bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
                Champion
              </span>
            </h1>
            <p className="text-xl text-white/70 leading-relaxed">
              Your tasks are waiting. Continue your journey to financial success.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <div className="text-3xl font-bold text-white mb-1">12,000+</div>
              <div className="text-white/60 text-sm">Active Workers</div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <div className="text-3xl font-bold text-white mb-1">£2.5M+</div>
              <div className="text-white/60 text-sm">Paid Out</div>
            </div>
          </div>

          <div className="mt-12 bg-gradient-to-r from-primary-500/20 to-purple-500/20 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-semibold">Top Performer Today</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                JM
              </div>
              <div>
                <div className="text-white font-medium">James M.</div>
                <div className="text-white/60 text-sm">Earned £127.50 today</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold">D</div>
              <span className="text-2xl font-bold text-white">Donezo</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-white/10">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Sign In</h2>
              <p className="text-white/60">Welcome back! Please enter your details.</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-white/40" />
                </div>
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-white/40" />
                </div>
                <input 
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/40 hover:text-white/60"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary-500 focus:ring-primary-500 focus:ring-offset-0"
                  />
                  <span className="text-white/60 text-sm">Remember me</span>
                </label>
                <a href="#" className="text-primary-400 text-sm hover:text-primary-300 transition-colors">
                  Forgot password?
                </a>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-600 to-purple-600 text-white py-4 rounded-xl font-bold hover:from-primary-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary-600/25"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-white/50">
                Don't have an account?{' '}
                <a href="#/signup" className="text-primary-400 font-semibold hover:text-primary-300 transition-colors">
                  Create Account
                </a>
              </p>
            </div>
          </div>

          <p className="text-center text-white/40 text-xs mt-6">
            Protected by enterprise-grade security
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
