import React, { useEffect, useState, useRef } from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  BarChart2, 
  Settings, 
  HelpCircle, 
  LogOut, 
  ArrowUpCircle,
  Coins
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User } from '../types';

interface SidebarProps {
  user?: User;
  isAnimating?: boolean;
}

// Hook for number counting animation
const useCountUp = (end: number, duration: number = 2000, start: number = 0) => {
  const [count, setCount] = useState(start);
  
  useEffect(() => {
    let startTime: number | null = null;
    let animationFrameId: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function (easeOutExpo) for satisfying finish
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setCount(start + (end - start) * ease);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    if (end !== start) {
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [end, duration, start]);

  return count;
};

const Sidebar = ({ user, isAnimating }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const prevEarningsRef = useRef(user?.earnings || 0);

  // Use the count up hook
  const displayEarnings = useCountUp(
    user?.earnings || 0, 
    2000, 
    prevEarningsRef.current
  );

  // Update ref after render
  useEffect(() => {
    prevEarningsRef.current = user?.earnings || 0;
  }, [user?.earnings]);

  const isActive = (path: string) => location.pathname === path;

  const linkClass = (path: string) => `
    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium relative overflow-hidden
    ${isActive(path) 
      ? 'bg-primary-700 text-white shadow-lg shadow-primary-700/30' 
      : 'text-gray-500 hover:bg-gray-100 hover:text-primary-700'}
  `;

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0 z-50 shadow-sm">
      {/* Logo */}
      <div className="p-8 flex items-center gap-2">
        <div className="w-8 h-8 bg-primary-700 rounded-lg flex items-center justify-center text-white font-bold shadow-md shadow-primary-500/20">D</div>
        <span className="text-xl font-bold text-gray-800 tracking-tight">Donezo</span>
      </div>

      {/* Menu */}
      <div className="flex-1 px-4 overflow-y-auto space-y-1">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4 mt-2">Menu</div>
        
        <Link to="/dashboard" className={linkClass('/dashboard')}>
          <LayoutDashboard size={18} />
          Dashboard
        </Link>
        <Link to="/dashboard/tasks" className={linkClass('/dashboard/tasks')}>
          <CheckSquare size={18} />
          Tasks
        </Link>
        
        {/* Animated Earnings Tab */}
        <Link 
          to="/dashboard/earnings" 
          id="sidebar-earnings-tab"
          className={`
            flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-500 text-sm font-medium relative group
            ${isActive('/dashboard/earnings') ? 'bg-primary-700 text-white' : 'text-gray-500 hover:bg-gray-50'}
            ${isAnimating ? 'bg-green-50 !text-green-700 shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-green-200 scale-105 z-10' : ''}
          `}
        >
          <div className="flex items-center gap-3">
             <BarChart2 size={18} className={`${isAnimating ? 'animate-bounce text-green-600' : ''}`} />
             <span>Earnings</span>
          </div>
          {user && (
            <div className={`
              text-xs font-bold px-2 py-0.5 rounded-full transition-all duration-300
              ${isAnimating ? 'bg-green-600 text-white scale-110' : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'}
            `}>
              £{displayEarnings.toFixed(2)}
            </div>
          )}
          
          {/* Subtle Glow Background during animation */}
          {isAnimating && (
             <div className="absolute inset-0 bg-green-400 opacity-10 rounded-xl animate-pulse"></div>
          )}
        </Link>

        <Link to="/dashboard/upgrade" className={linkClass('/dashboard/upgrade')}>
          <ArrowUpCircle size={18} />
          Upgrade Plan
        </Link>

        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4 mt-8">General</div>
        
        <Link to="/dashboard/settings" className={linkClass('/dashboard/settings')}>
          <Settings size={18} />
          Settings
        </Link>
        <Link to="/dashboard/support" className={linkClass('/dashboard/support')}>
          <HelpCircle size={18} />
          Support
        </Link>
        <button onClick={() => navigate('/')} className={`${linkClass('')} w-full text-left`}>
          <LogOut size={18} />
          Logout
        </button>
      </div>

      {/* Mobile App Promo */}
      <div className="p-4">
        <div className="bg-gray-900 rounded-2xl p-4 relative overflow-hidden text-white shadow-xl shadow-gray-900/10">
          <div className="relative z-10">
            <h4 className="font-semibold mb-1 text-sm">Download App</h4>
            <p className="text-xs text-gray-400 mb-3">Get full access on mobile</p>
            <button className="bg-primary-500 hover:bg-primary-600 text-white text-xs px-3 py-2 rounded-lg w-full font-medium transition-colors shadow-lg shadow-primary-500/20">
              Download
            </button>
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary-700 rounded-full opacity-30"></div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-primary-500 rounded-full opacity-20 blur-xl"></div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;