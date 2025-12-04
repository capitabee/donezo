import React from 'react';
import { Search, Bell, Mail } from 'lucide-react';
import { User, TopbarProps } from '../types';
import { useNavigate } from 'react-router-dom';

const Topbar = ({ user, onChatToggle, unreadNotificationsCount, onShowNotifications }: TopbarProps) => {
  const navigate = useNavigate();

  return (
    <div className="h-20 bg-white/50 backdrop-blur-sm sticky top-0 z-40 px-8 flex items-center justify-between">
      {/* Search */}
      <div className="relative w-96 hidden md:block">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Search task..." 
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-300 text-sm transition-all"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded text-[10px] font-bold">⌘ F</div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-6">
        <button 
          onClick={onChatToggle}
          className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors group tooltip-container"
          title="Message Team Leader"
        >
          <Mail size={20} className="group-hover:text-primary-600 transition-colors" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full border border-white animate-pulse"></span>
        </button>
        <button
          onClick={onShowNotifications}
          className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors group"
          title="Notifications"
        >
          <Bell size={20} className="group-hover:text-primary-600 transition-colors" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white animate-pulse">
              {unreadNotificationsCount}
            </span>
          )}
        </button>

        <button 
          onClick={() => navigate('/dashboard/settings')}
          className="flex items-center gap-3 pl-6 border-l border-gray-200 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-100 rounded-full pr-1 py-1 -my-1"
        >
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold text-gray-800 group-hover:text-primary-700 transition-colors">{user.name}</div>
            <div className="text-xs text-gray-500">{user.email}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
            <img src="https://picsum.photos/100/100" alt="User" className="w-full h-full object-cover" />
          </div>
        </button>
      </div>
    </div>
  );
};

export default Topbar;