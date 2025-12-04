import React, { useEffect, useRef } from 'react';
import { X, Bell, Info, Tag, AlertCircle, CheckCircle } from 'lucide-react';
import { AdminMessage, AdminMessageType, NotificationPopupProps } from '../types';

const NotificationPopup = ({ isOpen, onClose, messages, onMarkAsRead, onMarkAllAsRead }: NotificationPopupProps) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      popupRef.current?.focus(); // Focus for accessibility
      // Scroll to bottom when opening or new messages arrive
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }
  }, [isOpen, messages]); // Depend on messages to scroll on new ones

  if (!isOpen) return null;

  const getMessageIcon = (type: AdminMessageType) => {
    switch (type) {
      case AdminMessageType.PROMOTIONAL: return <Tag size={16} />;
      case AdminMessageType.ALERT: return <AlertCircle size={16} />;
      case AdminMessageType.GENERAL: return <Info size={16} />;
      default: return <Bell size={16} />;
    }
  };

  const getMessageColors = (type: AdminMessageType) => {
    switch (type) {
      case AdminMessageType.PROMOTIONAL: return 'bg-purple-50 text-purple-800 border-purple-100';
      case AdminMessageType.ALERT: return 'bg-red-50 text-red-800 border-red-100';
      case AdminMessageType.GENERAL: return 'bg-blue-50 text-blue-800 border-blue-100';
      default: return 'bg-gray-50 text-gray-800 border-gray-100';
    }
  };

  return (
    <div
      ref={popupRef}
      tabIndex={-1}
      className="fixed bottom-6 right-6 w-[380px] h-[600px] bg-white rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-100 transition-all duration-300 transform animate-slideUpFade"
      style={{ backdropFilter: 'blur(5px)', backgroundColor: 'rgba(255,255,255,0.95)' }}
    >
      
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-700 to-primary-800 p-4 flex items-center justify-between text-white shadow-md z-10">
        <div className="flex items-center gap-3">
          <Bell size={20} />
          <h3 className="font-bold text-sm leading-tight">Notifications</h3>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onMarkAllAsRead} className="text-white/80 hover:text-white text-xs transition-colors flex items-center gap-1">
            <CheckCircle size={14} /> Mark all read
          </button>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors"><X size={20} /></button>
        </div>
      </div>

      {/* Messages Body */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-12">
            <Bell size={48} className="mx-auto mb-4 text-gray-300" />
            No new notifications.
          </div>
        ) : (
          [...messages].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) // Sort by latest first
          .map((msg) => (
            <div
              key={msg.id}
              className={`p-4 rounded-xl border flex flex-col gap-2 cursor-pointer transition-all duration-200
                          ${getMessageColors(msg.type)} ${msg.read ? 'opacity-70' : 'shadow-md scale-[1.01]'}`}
              onClick={() => !msg.read && onMarkAsRead(msg.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <div className={`p-1 rounded-full ${msg.read ? 'bg-white/20' : 'bg-white'} `}>
                    {getMessageIcon(msg.type)}
                  </div>
                  <span>{msg.title}</span>
                </div>
                {!msg.read && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" title="Unread"></div>}
              </div>
              <p className="text-xs leading-snug">{msg.content}</p>
              <div className="text-[10px] text-gray-500 text-right">{new Date(msg.timestamp).toLocaleString()}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPopup;