import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle, Sparkles, Shield, Zap, Users } from 'lucide-react';
import api from '../services/api';

const SignUp = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref);
    }
  }, [searchParams]);

  const passwordStrength = () => {
    if (!password) return { score: 0, label: '', color: 'bg-gray-200' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score === 2) return { score, label: 'Fair', color: 'bg-yellow-500' };
    if (score === 3) return { score, label: 'Good', color: 'bg-blue-500' };
    return { score, label: 'Strong', color: 'bg-green-500' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1) {
      if (!name.trim()) {
        setError('Please enter your full name');
        return;
      }
      setError('');
      setStep(2);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.signup(email, password, name, referralCode || undefined);
      localStorage.setItem('onboardingName', name);
      navigate('/onboarding');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const strength = passwordStrength();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-purple-600/20"></div>
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <div className="relative z-10 flex flex-col justify-center p-16 text-white">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center">
                <span className="text-2xl font-bold text-white">D</span>
              </div>
              <span className="text-2xl font-bold">Donezo</span>
            </div>
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Start Your Journey to
              <span className="block bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
                Financial Freedom
              </span>
            </h1>
            <p className="text-xl text-white/70 leading-relaxed">
              Join thousands of remote workers earning a reliable income through simple digital tasks.
            </p>
          </div>

          <div className="space-y-6">
            {[
              { icon: <Zap className="w-5 h-5" />, title: 'Instant Setup', desc: 'Start earning within minutes' },
              { icon: <Shield className="w-5 h-5" />, title: 'Secure Payments', desc: 'Bank-grade security for your earnings' },
              { icon: <Users className="w-5 h-5" />, title: 'Referral Bonus', desc: 'Earn £50 for every friend you invite' },
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-4 bg-white/5 backdrop-blur-xl rounded-2xl p-4">
                <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center text-primary-400">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="text-white/60 text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
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
            <div className="flex items-center gap-3 mb-2">
              <div className="flex gap-2">
                <div className={`w-3 h-3 rounded-full transition-all ${step >= 1 ? 'bg-primary-500' : 'bg-white/20'}`}></div>
                <div className={`w-3 h-3 rounded-full transition-all ${step >= 2 ? 'bg-primary-500' : 'bg-white/20'}`}></div>
              </div>
              <span className="text-white/50 text-sm">Step {step} of 2</span>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">
                {step === 1 ? "Let's get started" : 'Secure your account'}
              </h2>
              <p className="text-white/60">
                {step === 1 ? 'Tell us a bit about yourself' : 'Create your login credentials'}
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                {error}
              </div>
            )}

            {referralCode && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-300 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Referral bonus applied! You'll receive £50 after completing onboarding.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {step === 1 ? (
                <div className="space-y-5">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-white/40" />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Full Name" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
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
                      minLength={6}
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

                  {password && (
                    <div className="space-y-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full ${i <= strength.score ? strength.color : 'bg-white/10'}`}></div>
                        ))}
                      </div>
                      <p className="text-xs text-white/50">Password strength: <span className={strength.score >= 3 ? 'text-green-400' : strength.score >= 2 ? 'text-yellow-400' : 'text-red-400'}>{strength.label}</span></p>
                    </div>
                  )}

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-white/40" />
                    </div>
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirm Password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                    {confirmPassword && password === confirmPassword && (
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-600 to-purple-600 text-white py-4 rounded-xl font-bold hover:from-primary-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary-600/25"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    {step === 1 ? 'Continue' : 'Create Account'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {step === 2 && (
              <button 
                onClick={() => setStep(1)} 
                className="w-full mt-4 text-white/60 hover:text-white transition-colors text-sm"
              >
                ← Back to previous step
              </button>
            )}

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-white/50">
                Already have an account?{' '}
                <a href="#/signin" className="text-primary-400 font-semibold hover:text-primary-300 transition-colors">
                  Sign In
                </a>
              </p>
            </div>
          </div>

          <p className="text-center text-white/40 text-xs mt-6">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
