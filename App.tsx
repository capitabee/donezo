import React, { useState, ReactElement, useEffect, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, Outlet, Navigate, useOutletContext } from 'react-router-dom';
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
import NotificationPopup from './components/NotificationPopup'; // New import
import { User, UserTier, AdminMessage, AdminMessageType, DashboardOutletContext, Task, TaskCategory, TaskStatus } from './types';

// Mock Auth Wrapper
const DashboardLayout = () => {
  // Mock User - loaded from localStorage or default
  const [user, setUser] = useState<User>(() => {
    const savedUser = localStorage.getItem('donezoUser');
    return savedUser ? JSON.parse(savedUser) : {
      id: 'user_123',
      name: 'Totok Michael',
      email: 'tmichael09@mail.com',
      tier: UserTier.BASIC,
      signupDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago for Day 15 task demo
      mandateActive: true,
      earnings: 450,
      qualityScore: 88,
      completedTasks: 12,
      referralLink: ''
    };
  });

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false); // New state for notifications
  const [isEarningsAnimating, setIsEarningsAnimating] = useState(false);
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>(() => {
    const savedMessages = localStorage.getItem('donezoAdminMessages');
    return savedMessages ? JSON.parse(savedMessages) : [];
  });

  // --- Lifted Tasks State and Logic ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Task Generation (daily)
  useEffect(() => {
    const newTasks: Task[] = [];
    const baseId = new Date().toISOString().split('T')[0]; // Reset daily to get new tasks each day

    // 10 Day Tasks (5 TikTok, 5 Instagram)
    for (let i = 0; i < 5; i++) {
      // TikTok
      newTasks.push({
        id: `${baseId}-day-tiktok-${i}`,
        platform: 'TikTok',
        category: 'Day',
        title: `Open TikTok Link ${i + 1}`,
        url: `https://www.tiktok.com/@tiktok/video/730000000${i}`, // Example TikTok links
        payout: 0.20,
        status: 'Pending',
        durationMinutes: 2 // 2 minutes for day tasks
      });
      // Instagram
      newTasks.push({
        id: `${baseId}-day-instagram-${i}`,
        platform: 'Instagram',
        category: 'Day',
        title: `Open Instagram Reel Link ${i + 1}`,
        url: `https://www.instagram.com/reel/CmD0k0c000${i}/?hl=en`, // Example Instagram links
        payout: 0.25,
        status: 'Pending',
        durationMinutes: 2 // 2 minutes for day tasks
      });
    }

    // 5 Night Tasks (YouTube Background)
    for (let i = 0; i < 5; i++) {
      newTasks.push({
        id: `${baseId}-night-youtube-${i}`,
        platform: 'YouTube',
        category: 'Night',
        title: `YouTube Background Task ${i + 1}`,
        url: `https://www.youtube.com/watch?v=dQw4w9WgXc${i}`, // Mock YouTube links
        payout: 0.80, // Higher payout for night
        status: 'Pending', // Will be locked by time check initially
        durationMinutes: 30 // 30 minutes for night tasks
      });
    }

    setTasks(newTasks);
  }, [user.signupDate]); // Re-generate if user changes (for demo purposes, otherwise once per day for actual app)

  // Time Window Management
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
        } else { // Night Task
          return { ...t, status: isNightActive ? 'Pending' : 'Locked' };
        }
      }));
    };

    checkTimeWindows();
    const interval = setInterval(checkTimeWindows, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const sendHeartbeat = (taskId: string) => {
    // console.log(`Heartbeat sent for ${taskId}`);
    // In real app, ping backend to verify tab is still open
  };

  const failTask = useCallback((taskId: string) => {
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

  const completeTask = useCallback((taskId: string) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === taskId);
      if (task && task.status !== 'Completed' && task.status !== 'Failed') {
        // Close the opened window if it's still open
        if (task.newTabWindow && !task.newTabWindow.closed) {
          task.newTabWindow.close();
        }
        addEarnings(task.payout);
        return prev.map(t => t.id === taskId ? { ...t, status: 'Completed', startTime: undefined, newTabWindow: null } : t);
      }
      return prev;
    });
  }, [user.earnings]); // Added user.earnings to dependency array for addEarnings to be up-to-date

  const startTask = useCallback((taskId: string, url: string) => {
    const openedWindow = window.open(url, '_blank');

    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, status: 'In Progress', startTime: Date.now(), newTabWindow: openedWindow };
      }
      return t;
    }));
  }, []);

  // Global Timer Loop for tasks
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      tasks.forEach(task => {
        if (task.status === 'In Progress' && task.startTime) {
          const elapsed = now - task.startTime;
          const durationMs = task.durationMinutes * 60 * 1000;

          // Night Task Specific Logic (Tab Monitoring)
          if (task.category === 'Night') {
            if (task.newTabWindow && task.newTabWindow.closed) {
              failTask(task.id);
              return;
            }
            if (Math.floor(now / 1000) % 10 === 0) { // Every 10 seconds
              sendHeartbeat(task.id);
            }
          }

          // Auto-complete logic for all tasks
          if (elapsed >= durationMs) {
            completeTask(task.id);
          }
        }
      });
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [tasks, completeTask, failTask]);

  // --- Auto-starting Time Tracker ---
  const [activeSessionDuration, setActiveSessionDuration] = useState(0);
  const startTimeRef = useRef(Date.now()); // Store session start time

  useEffect(() => {
    startTimeRef.current = Date.now(); // Reset start time on mount
    const interval = setInterval(() => {
      setActiveSessionDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []); // Run once on mount

  // Save user to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('donezoUser', JSON.stringify(user));
  }, [user]);

  // Save admin messages to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('donezoAdminMessages', JSON.stringify(adminMessages));
  }, [adminMessages]);


  const addEarnings = (amount: number) => {
    setUser((prev) => ({ ...prev, earnings: prev.earnings + amount }));
    setIsEarningsAnimating(true); // Start animation
  };

  useEffect(() => {
    if (isEarningsAnimating) {
      const timer = setTimeout(() => setIsEarningsAnimating(false), 2500); // Duration of animation
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
    setIsNotificationsOpen(true); // Automatically open notifications when a new message is received from admin
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

  // Derived Task Counts for DashboardHome
  const tasksInProgressCount = tasks.filter(t => t.status === 'In Progress').length;
  const tasksPendingAvailabilityCount = tasks.filter(t => t.status === 'Locked' || (t.status === 'Pending' && !t.startTime)).length;
  const totalTasksTodayCount = tasks.length; // Always 15 tasks generated per day

  return (
    <div className="flex bg-gray-50 min-h-screen font-sans">
      <Sidebar user={user} isAnimating={isEarningsAnimating} />
      <div className="flex-1 ml-64">
        <Topbar
          user={user}
          onChatToggle={() => setIsChatOpen(!isChatOpen)}
          unreadNotificationsCount={unreadNotificationsCount} // New prop
          onShowNotifications={() => setIsNotificationsOpen(!isNotificationsOpen)} // New prop
        />
        <main>
          {/* Outlet context for passing user, addEarnings, isEarningsAnimating to nested routes */}
          <Outlet context={{
            user,
            addEarnings,
            isEarningsAnimating,
            tasks,
            setTasks,
            startTask,
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

// Signup Mock Page
const Signup = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-800">Create Account</h2>
                    <p className="text-gray-500">Join Donezo today.</p>
                </div>
                <form className="space-y-4">
                    <input type="text" placeholder="Full Name" className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-primary-500" />
                    <input type="email" placeholder="Email" className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-primary-500" />
                    <input type="password" placeholder="Password" className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-primary-500" />
                    <button type="button" onClick={() => window.location.hash = '#/mandate'} className="w-full bg-primary-700 text-white py-4 rounded-xl font-bold hover:bg-primary-800 transition-colors">Sign Up</button>
                </form>
                <p className="text-center text-gray-500 mt-6">
                    Already have an account?{' '}
                    <a href="#/signin" className="text-primary-700 font-semibold hover:underline">Sign In</a>
                </p>
            </div>
        </div>
    )
}

// Signin Mock Page
const Signin = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
                    <p className="text-gray-500">Sign in to your account.</p>
                </div>
                <form className="space-y-4">
                    <input type="email" placeholder="Email" className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-primary-500" />
                    <input type="password" placeholder="Password" className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-primary-500" />
                    <button type="button" onClick={() => window.location.hash = '#/dashboard'} className="w-full bg-primary-700 text-white py-4 rounded-xl font-bold hover:bg-primary-800 transition-colors">Sign In</button>
                </form>
                <p className="text-center text-gray-500 mt-6">
                    Don't have an account?{' '}
                    <a href="#/signup" className="text-primary-700 font-semibold hover:underline">Sign Up</a>
                </p>
            </div>
        </div>
    )
}

// Mandate Mock Page
const Mandate = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Connect Bank</h2>
                <p className="text-gray-500 mb-8 text-sm">
                    This mandate authorizes Donezo to process salary payouts and verify your identity via Stripe/GoCardless.
                    <span className="block mt-2 font-bold text-gray-700">No payment is taken immediately.</span>
                </p>

                <div className="space-y-3 mb-8">
                    <div className="p-4 border rounded-xl flex items-center gap-3 cursor-pointer hover:border-primary-500 transition-colors">
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        <div className="font-medium">Chase Bank</div>
                    </div>
                    <div className="p-4 border rounded-xl flex items-center gap-3 cursor-pointer hover:border-primary-500 transition-colors">
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        <div className="font-medium">Bank of America</div>
                    </div>
                </div>

                <button onClick={() => window.location.hash = '#/dashboard'} className="w-full bg-primary-700 text-white py-4 rounded-xl font-bold hover:bg-primary-800 transition-colors">Authorize Mandate</button>
            </div>
        </div>
    )
}

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
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/mandate" element={<Mandate />} />
        <Route path="/admin" element={<Admin onSendAdminMessage={addAdminMessageFromAdmin} />} />

        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          {/* These components now use useOutletContext for user data */}
          <Route index element={<DashboardHome />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="upgrade" element={<Upgrade />} />
          <Route path="earnings" element={<Earnings />} />
          <Route path="settings" element={<Settings />} />
          <Route path="support" element="<Support />" />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;