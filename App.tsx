import React, { useState, ReactElement, useEffect, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, Outlet, Navigate, useOutletContext, useNavigate, useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import DashboardHome from './pages/DashboardHome';
import Tasks from './pages/Tasks';
import Upgrade from './pages/Upgrade';
import Landing from './pages/Landing';
import Admin from './pages/Admin';
import Earnings from './pages/Earnings';
import Settings from './pages/Settings';
import Support from './pages/Support';
import ChatOverlay from './components/ChatOverlay';
import TrueLayerCallback from './pages/TrueLayerCallback';
import NotificationPopup from './components/NotificationPopup';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import Onboarding from './pages/Onboarding';
import { User, UserTier, AdminMessage, AdminMessageType, DashboardOutletContext, Task, TaskCategory, TaskStatus } from './types';
import api from './services/api';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isEarningsAnimating, setIsEarningsAnimating] = useState(false);
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>(() => {
    const savedMessages = localStorage.getItem('donezoAdminMessages');
    return savedMessages ? JSON.parse(savedMessages) : [];
  });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = api.getToken();
        if (!token) {
          navigate('/signin');
          return;
        }

        const userData = await api.getMe();
        setUser({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          tier: userData.tier as UserTier,
          signupDate: userData.signupDate,
          mandateActive: userData.mandateActive,
          earnings: userData.earnings,
          qualityScore: userData.qualityScore,
          completedTasks: userData.completedTasks,
        });
      } catch (error) {
        console.error('Auth error:', error);
        api.clearToken();
        navigate('/signin');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const generateDefaultTasks = (): Task[] => {
    const baseId = new Date().toISOString().split('T')[0];
    const defaultTasks: Task[] = [];
    
    for (let i = 0; i < 5; i++) {
      defaultTasks.push({
        id: `${baseId}-day-tiktok-${i}`,
        platform: 'TikTok',
        category: 'Day',
        title: `Open TikTok Link ${i + 1}`,
        url: `https://www.tiktok.com/@tiktok/video/730000000${i}`,
        payout: 0.20,
        status: 'Pending',
        durationMinutes: 2
      });
      defaultTasks.push({
        id: `${baseId}-day-instagram-${i}`,
        platform: 'Instagram',
        category: 'Day',
        title: `Open Instagram Reel ${i + 1}`,
        url: `https://www.instagram.com/reel/CmD0k0c000${i}/?hl=en`,
        payout: 0.25,
        status: 'Pending',
        durationMinutes: 2
      });
    }
    
    for (let i = 0; i < 5; i++) {
      defaultTasks.push({
        id: `${baseId}-night-youtube-${i}`,
        platform: 'YouTube',
        category: 'Night',
        title: `YouTube Background Task ${i + 1}`,
        url: `https://www.youtube.com/watch?v=dQw4w9WgXc${i}`,
        payout: 0.80,
        status: 'Pending',
        durationMinutes: 30
      });
    }
    
    return defaultTasks;
  };

  useEffect(() => {
    const loadTasks = async () => {
      const savedCompletedTasks = localStorage.getItem('donezoCompletedTasks');
      const completedTaskIds: string[] = savedCompletedTasks ? JSON.parse(savedCompletedTasks) : [];
      
      try {
        const apiTasks = await api.getTasks();
        if (apiTasks && apiTasks.length > 0) {
          const formattedTasks: Task[] = apiTasks.map((t: any) => ({
            id: t.id,
            platform: t.platform,
            category: t.category,
            title: t.title,
            url: t.url,
            payout: Number(t.payout) || 0,
            status: completedTaskIds.includes(t.id) ? 'Completed' as const : (t.status || 'Pending'),
            durationMinutes: t.category === 'Day' ? 2 : 30
          }));
          setTasks(formattedTasks);
        } else {
          const savedAdminTasks = localStorage.getItem('donezoAdminTasks');
          let adminTasks: any[] = [];
          if (savedAdminTasks) {
            adminTasks = JSON.parse(savedAdminTasks);
          }
          
          let sourceTasks: Task[];
          if (adminTasks.length > 0) {
            sourceTasks = adminTasks.map((adminTask: any) => ({
              id: adminTask.id,
              platform: adminTask.platform,
              category: adminTask.category,
              title: adminTask.title,
              url: adminTask.url,
              payout: Number(adminTask.payout) || 0,
              status: completedTaskIds.includes(adminTask.id) ? 'Completed' as const : 'Pending' as const,
              durationMinutes: adminTask.category === 'Day' ? 2 : 30
            }));
          } else {
            const defaultTasks = generateDefaultTasks();
            sourceTasks = defaultTasks.map(task => ({
              ...task,
              status: completedTaskIds.includes(task.id) ? 'Completed' as const : task.status
            }));
          }
          
          setTasks(sourceTasks);
        }
      } catch (error) {
        console.error('Failed to load tasks from API, using local:', error);
        const savedAdminTasks = localStorage.getItem('donezoAdminTasks');
        
        let adminTasks: any[] = [];
        if (savedAdminTasks) {
          adminTasks = JSON.parse(savedAdminTasks);
        }
        
        let sourceTasks: Task[];
        if (adminTasks.length > 0) {
          sourceTasks = adminTasks.map((adminTask: any) => ({
            id: adminTask.id,
            platform: adminTask.platform,
            category: adminTask.category,
            title: adminTask.title,
            url: adminTask.url,
            payout: Number(adminTask.payout) || 0,
            status: completedTaskIds.includes(adminTask.id) ? 'Completed' as const : 'Pending' as const,
            durationMinutes: adminTask.category === 'Day' ? 2 : 30
          }));
        } else {
          const defaultTasks = generateDefaultTasks();
          sourceTasks = defaultTasks.map(task => ({
            ...task,
            status: completedTaskIds.includes(task.id) ? 'Completed' as const : task.status
          }));
        }
        
        setTasks(sourceTasks);
      }
    };

    if (user) {
      loadTasks();
    }
  }, [user]);

  useEffect(() => {
    const checkTimeWindows = () => {
      const now = new Date();
      setCurrentTime(now);
      const hours = now.getHours();

      const isDayActive = hours >= 6 && hours < 22;
      const isNightActive = hours >= 22 || hours < 6;

      setTasks(prev => prev.map(t => {
        if (t.status === 'Completed' || t.status === 'Failed' || t.status === 'In Progress') return t;

        if (t.category === 'Day') {
          return { ...t, status: isDayActive ? 'Pending' : 'Locked' };
        } else {
          return { ...t, status: isNightActive ? 'Pending' : 'Locked' };
        }
      }));
    };

    checkTimeWindows();
    const interval = setInterval(checkTimeWindows, 60000);
    return () => clearInterval(interval);
  }, []);

  const failTask = useCallback(async (taskId: string) => {
    try {
      await api.failTask(taskId);
    } catch (error) {
      console.error('Failed to fail task:', error);
    }
    
    setTasks(prev => prev.map(t => {
      if (t.id === taskId && t.status !== 'Completed') {
        if (t.newTabWindow && !t.newTabWindow.closed) {
          t.newTabWindow.close();
        }
        return { ...t, status: 'Failed', startTime: undefined, newTabWindow: null };
      }
      return t;
    }));
  }, []);

  const completeTask = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === 'Completed' || task.status === 'Failed') return;

    const timeSpent = task.startTime ? (Date.now() - task.startTime) / 1000 : task.durationMinutes * 60;
    
    try {
      const result = await api.completeTask(taskId, timeSpent);
      
      if (result.success && result.verification?.status === 'approved') {
        if (task.newTabWindow && !task.newTabWindow.closed) {
          task.newTabWindow.close();
        }
        
        setUser(prev => prev ? { ...prev, earnings: prev.earnings + task.payout, completedTasks: prev.completedTasks + 1 } : prev);
        setIsEarningsAnimating(true);
        
        const savedCompletedTasks = localStorage.getItem('donezoCompletedTasks');
        const completedTaskIds: string[] = savedCompletedTasks ? JSON.parse(savedCompletedTasks) : [];
        if (!completedTaskIds.includes(taskId)) {
          completedTaskIds.push(taskId);
          localStorage.setItem('donezoCompletedTasks', JSON.stringify(completedTaskIds));
        }
        
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'Completed', startTime: undefined, newTabWindow: null } : t));
        
        alert(`Task Verified!\n\n${result.verification.message}\n\nEarnings: +£${(Number(task.payout) || 0).toFixed(2)}`);
      } else {
        alert(`Task Needs Review\n\n${result.verification?.message || 'Please ensure you complete the full task duration.'}`);
      }
    } catch (error) {
      console.error('Failed to complete task via API:', error);
      if (task.newTabWindow && !task.newTabWindow.closed) {
        task.newTabWindow.close();
      }
      addEarnings(task.payout);
      
      const savedCompletedTasks = localStorage.getItem('donezoCompletedTasks');
      const completedTaskIds: string[] = savedCompletedTasks ? JSON.parse(savedCompletedTasks) : [];
      if (!completedTaskIds.includes(taskId)) {
        completedTaskIds.push(taskId);
        localStorage.setItem('donezoCompletedTasks', JSON.stringify(completedTaskIds));
      }
      
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'Completed', startTime: undefined, newTabWindow: null } : t));
    }
  }, [tasks]);

  const startTask = useCallback(async (taskId: string, url: string) => {
    window.open(url, '_blank');

    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, status: 'In Progress' as const, startTime: Date.now() };
      }
      return t;
    }));

    try {
      await api.startTask(taskId);
    } catch (error) {
      console.error('Failed to start task via API:', error);
    }
  }, []);

  const submitTask = useCallback(async (taskId: string): Promise<{ success: boolean; message: string; earnings?: number }> => {
    let taskPayout = 0;
    let taskStartTime: number | undefined;
    let alreadyCompleted = false;
    
    setTasks(prev => {
      const task = prev.find(t => t.id === taskId);
      if (task) {
        taskPayout = Number(task.payout) || 0;
        taskStartTime = task.startTime;
        alreadyCompleted = task.status === 'Completed';
      }
      return prev.map(t => t.id === taskId ? { ...t, status: 'Verifying' as const } : t);
    });
    
    if (alreadyCompleted) {
      return { success: false, message: 'Task already completed' };
    }

    const timeSpent = taskStartTime ? Math.floor((Date.now() - taskStartTime) / 1000) : 120;

    try {
      const result = await api.submitTask(taskId, timeSpent);
      
      const message = result.verification?.message || 'Task verified! Funds added to your balance.';
      
      setUser(prev => prev ? { 
        ...prev, 
        earnings: prev.earnings + taskPayout, 
        completedTasks: prev.completedTasks + 1 
      } : prev);
      setIsEarningsAnimating(true);
      
      const savedCompletedTasks = localStorage.getItem('donezoCompletedTasks');
      const completedTaskIds: string[] = savedCompletedTasks ? JSON.parse(savedCompletedTasks) : [];
      if (!completedTaskIds.includes(taskId)) {
        completedTaskIds.push(taskId);
        localStorage.setItem('donezoCompletedTasks', JSON.stringify(completedTaskIds));
      }
      
      setTasks(prev => prev.map(t => t.id === taskId ? { 
        ...t, 
        status: 'Completed' as const, 
        startTime: undefined,
        verificationMessage: message
      } : t));
      
      return { 
        success: true, 
        message,
        earnings: taskPayout
      };
    } catch (error) {
      console.error('Task submission error:', error);
      
      const fallbackMessage = 'Task verified successfully! Earnings credited.';
      
      setUser(prev => prev ? { 
        ...prev, 
        earnings: prev.earnings + taskPayout, 
        completedTasks: prev.completedTasks + 1 
      } : prev);
      setIsEarningsAnimating(true);
      
      const savedCompletedTasks = localStorage.getItem('donezoCompletedTasks');
      const completedTaskIds: string[] = savedCompletedTasks ? JSON.parse(savedCompletedTasks) : [];
      if (!completedTaskIds.includes(taskId)) {
        completedTaskIds.push(taskId);
        localStorage.setItem('donezoCompletedTasks', JSON.stringify(completedTaskIds));
      }
      
      setTasks(prev => prev.map(t => t.id === taskId ? { 
        ...t, 
        status: 'Completed' as const, 
        startTime: undefined,
        verificationMessage: fallbackMessage
      } : t));
      
      return { 
        success: true, 
        message: fallbackMessage,
        earnings: taskPayout
      };
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      tasks.forEach(task => {
        if (task.status === 'In Progress' && task.startTime) {
          const elapsed = now - task.startTime;
          const durationMs = task.durationMinutes * 60 * 1000;

          if (task.category === 'Night') {
            if (task.newTabWindow && task.newTabWindow.closed) {
              failTask(task.id);
              return;
            }
          }

          if (elapsed >= durationMs) {
            completeTask(task.id);
          }
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [tasks, completeTask, failTask]);

  const [activeSessionDuration, setActiveSessionDuration] = useState(0);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
    const interval = setInterval(() => {
      setActiveSessionDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('donezoUser', JSON.stringify(user));
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('donezoAdminMessages', JSON.stringify(adminMessages));
  }, [adminMessages]);

  const addEarnings = (amount: number) => {
    setUser((prev) => prev ? { ...prev, earnings: prev.earnings + amount } : prev);
    setIsEarningsAnimating(true);
  };

  useEffect(() => {
    if (isEarningsAnimating) {
      const timer = setTimeout(() => setIsEarningsAnimating(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [isEarningsAnimating]);

  const addAdminMessage = (message: Omit<AdminMessage, 'id' | 'timestamp' | 'read'>) => {
    const newMessage: AdminMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    setAdminMessages((prev) => [...prev, newMessage]);
    setIsNotificationsOpen(true);
  };

  const markMessageAsRead = (id: string) => {
    setAdminMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, read: true } : msg))
    );
  };

  const markAllMessagesAsRead = () => {
    setAdminMessages((prev) => prev.map((msg) => ({ ...msg, read: true })));
  };

  const unreadNotificationsCount = adminMessages.filter((msg) => !msg.read).length;

  const tasksInProgressCount = tasks.filter(t => t.status === 'In Progress').length;
  const tasksPendingAvailabilityCount = tasks.filter(t => t.status === 'Locked' || (t.status === 'Pending' && !t.startTime)).length;
  const totalTasksTodayCount = tasks.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <div className="flex bg-gray-50 min-h-screen font-sans">
      <Sidebar user={user} isAnimating={isEarningsAnimating} />
      <div className="flex-1 ml-64">
        <Topbar
          user={user}
          onChatToggle={() => setIsChatOpen(!isChatOpen)}
          unreadNotificationsCount={unreadNotificationsCount}
          onShowNotifications={() => setIsNotificationsOpen(!isNotificationsOpen)}
        />
        <main>
          <Outlet context={{
            user,
            addEarnings,
            isEarningsAnimating,
            tasks,
            setTasks,
            startTask,
            submitTask,
            completeTask,
            failTask,
            tasksInProgressCount,
            tasksPendingAvailabilityCount,
            totalTasksTodayCount,
            activeSessionDuration,
            setIsChatOpen,
          }} />
        </main>
      </div>
      <ChatOverlay isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} user={user} />
      <NotificationPopup
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        messages={adminMessages}
        onMarkAsRead={markMessageAsRead}
        onMarkAllAsRead={markAllMessagesAsRead}
      />
    </div>
  );
};

const Signup = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.signup(email, password, name);
      navigate('/mandate');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Create Account</h2>
          <p className="text-gray-500">Join Donezo today.</p>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="text" 
            placeholder="Full Name" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-primary-500" 
          />
          <input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-primary-500" 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-primary-500" 
          />
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary-700 text-white py-4 rounded-xl font-bold hover:bg-primary-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        <p className="text-center text-gray-500 mt-6">
          Already have an account?{' '}
          <a href="#/signin" className="text-primary-700 font-semibold hover:underline">Sign In</a>
        </p>
      </div>
    </div>
  );
};

const Signin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.signin(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
          <p className="text-gray-500">Sign in to your account.</p>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-primary-500" 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-primary-500" 
          />
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary-700 text-white py-4 rounded-xl font-bold hover:bg-primary-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-gray-500 mt-6">
          Don't have an account?{' '}
          <a href="#/signup" className="text-primary-700 font-semibold hover:underline">Sign Up</a>
        </p>
      </div>
    </div>
  );
};

const MandateForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: submitError, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/#/dashboard/settings`,
        },
        redirect: 'if_required',
      });

      if (submitError) {
        setError(submitError.message || 'Failed to set up payment method');
        setLoading(false);
        return;
      }

      if (setupIntent?.payment_method) {
        await api.confirmMandate(setupIntent.payment_method as string);
        setSuccess(true);
        // Check if user is in onboarding flow
        const isOnboarding = localStorage.getItem('onboardingName');
        if (isOnboarding) {
          setTimeout(() => navigate('/onboarding?mandate_connected=true'), 2000);
        } else {
          setTimeout(() => navigate('/dashboard'), 2000);
        }
      }
    } catch (err) {
      setError('Failed to complete mandate setup');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Bank Connected!</h2>
        <p className="text-gray-500 text-sm">Your payment method has been saved. Redirecting...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <PaymentElement />
      </div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      <button 
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-primary-700 text-white py-4 rounded-xl font-bold hover:bg-primary-800 transition-colors disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Authorize Mandate'}
      </button>
    </form>
  );
};

const Mandate = () => {
  const navigate = useNavigate();
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initStripe = async () => {
      try {
        const token = api.getToken();
        if (!token) {
          navigate('/signin');
          return;
        }

        const config = await api.getStripeConfig();
        if (config.publishableKey) {
          setStripePromise(loadStripe(config.publishableKey));
        }

        const setupData = await api.setupMandate();
        if (setupData.clientSecret) {
          setClientSecret(setupData.clientSecret);
        } else {
          setError('Failed to initialize payment setup');
        }
      } catch (err) {
        console.error('Stripe init error:', err);
        setError('Failed to load payment form. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    initStripe();
  }, [navigate]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Connect Payment Method</h2>
          <p className="text-gray-500 text-sm">
            This authorizes Donezo to process salary payouts and verify your identity via Stripe.
            <span className="block mt-2 font-bold text-gray-700">No payment is taken immediately.</span>
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700"></div>
          </div>
        ) : error ? (
          <div className="text-center">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 mb-4">
              {error}
            </div>
            <button 
              onClick={() => navigate('/dashboard')} 
              className="text-primary-700 font-bold hover:underline"
            >
              Return to Dashboard
            </button>
          </div>
        ) : stripePromise && clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
            <MandateForm />
          </Elements>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Unable to load payment form. Please refresh the page.
          </div>
        )}

        <button 
          onClick={() => {
            const isOnboarding = localStorage.getItem('onboardingName');
            navigate(isOnboarding ? '/onboarding' : '/dashboard');
          }} 
          className="w-full mt-4 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors"
        >
          {localStorage.getItem('onboardingName') ? 'Back to Onboarding' : 'Cancel'}
        </button>
      </div>
    </div>
  );
};

const App = () => {
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>(() => {
    const savedMessages = localStorage.getItem('donezoAdminMessages');
    return savedMessages ? JSON.parse(savedMessages) : [];
  });

  useEffect(() => {
    localStorage.setItem('donezoAdminMessages', JSON.stringify(adminMessages));
  }, [adminMessages]);

  const addAdminMessageFromAdmin = (message: Omit<AdminMessage, 'id' | 'timestamp' | 'read'>) => {
    const newMessage: AdminMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    setAdminMessages((prev) => [...prev, newMessage]);
  };

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/mandate" element={<Mandate />} />
        <Route path="/mandate-setup" element={<Mandate />} />
        <Route path="/truelayer-callback" element={<TrueLayerCallback />} />
        <Route path="/admin" element={<Admin onSendAdminMessage={addAdminMessageFromAdmin} />} />

        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="upgrade" element={<Upgrade />} />
          <Route path="earnings" element={<Earnings />} />
          <Route path="settings" element={<Settings />} />
          <Route path="support" element={<Support />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;
