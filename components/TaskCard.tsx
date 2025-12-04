

import React from 'react';
import { Play, CheckCircle, ExternalLink, Youtube, Instagram, Music2, Loader2, Moon, Sun, Lock, AlertTriangle, XCircle } from 'lucide-react';
import { Task } from '../types';
import CountdownTimer from './CountdownTimer';

// Add onFail to TaskCardProps
interface TaskCardProps {
  task: Task;
  onStart: (taskId: string, url: string) => void;
  onComplete: (taskId: string) => void;
  onFail: (taskId: string) => void; // Added onFail prop
}

const TaskCard = ({ task, onStart, onComplete }: TaskCardProps) => {
  const isNight = task.category === 'Night';
  const isLocked = task.status === 'Locked';
  const isFailed = task.status === 'Failed';
  
  const getIcon = () => {
    switch (task.platform) {
      case 'YouTube': return <Youtube size={20} />;
      case 'TikTok': return <Music2 size={20} />;
      case 'Instagram': return <Instagram size={20} />;
      default: return <ExternalLink size={20} />;
    }
  };

  const getThemeClasses = () => {
    if (isFailed) return 'bg-red-50 border-red-200';
    if (isLocked) return 'bg-gray-100 border-gray-200 opacity-70';
    
    if (isNight) {
      return 'bg-gray-900 border-gray-800 text-white shadow-lg shadow-blue-900/10';
    }
    
    // Day themes
    switch (task.platform) {
      case 'YouTube': return 'bg-white border-red-100 hover:border-red-200 text-gray-800';
      case 'TikTok': return 'bg-white border-gray-200 hover:border-black/20 text-gray-800';
      case 'Instagram': return 'bg-white border-pink-100 hover:border-pink-200 text-gray-800';
      default: return 'bg-white border-gray-100 text-gray-800';
    }
  };

  const getIconContainerClass = () => {
    if (isNight) return 'bg-gray-800 text-gray-300';
    switch (task.platform) {
      case 'YouTube': return 'bg-red-50 text-red-600';
      case 'TikTok': return 'bg-black/5 text-black';
      case 'Instagram': return 'bg-pink-50 text-pink-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  return (
    <div className={`
      group relative rounded-2xl border p-5 shadow-sm 
      transition-all duration-300 flex flex-col justify-between h-[240px]
      ${getThemeClasses()}
      ${task.status === 'Completed' ? 'opacity-75' : ''}
    `}>
      
      {/* Category Badge */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {isNight ? (
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-blue-900/30 text-blue-200 px-2 py-0.5 rounded-full border border-blue-800">
            <Moon size={10} /> Night Task
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
            <Sun size={10} /> Day Task
          </div>
        )}
      </div>

      {/* Header */}
      <div className="flex justify-between items-start mb-3 mt-1">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${getIconContainerClass()}`}>
          {getIcon()}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="flex justify-between items-baseline mb-1">
           <h3 className={`font-bold text-sm line-clamp-2 leading-tight ${isNight ? 'text-gray-100' : 'text-gray-800'}`}>
             {task.title}
           </h3>
           <span className={`text-sm font-bold ${isNight ? 'text-green-400' : 'text-gray-900'}`}>£{task.payout.toFixed(2)}</span>
        </div>
        <p className={`text-xs truncate flex items-center gap-1 font-mono ${isNight ? 'text-gray-500' : 'text-gray-400'}`}>
          <ExternalLink size={10} /> {task.url.replace('https://', '')}
        </p>
        
        {/* Status Text */}
        <div className="mt-2 h-5">
           {isFailed ? (
             <span className="text-xs text-red-600 font-bold flex items-center gap-1"><AlertTriangle size={12}/> Failed - Tab Closed</span>
           ) : task.status === 'In Progress' ? (
             <span className="text-xs text-orange-500 font-medium flex items-center gap-1"><Loader2 size={12} className="animate-spin"/> Monitoring Tab...</span>
           ) : null}
        </div>
      </div>

      {/* Footer / Action */}
      <div className="mt-4">
        {isLocked ? (
          <div className="w-full py-2.5 bg-gray-200 border border-gray-300 text-gray-500 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed">
            <Lock size={14} /> Available {isNight ? '10 PM' : '6 AM'}
          </div>
        ) : task.status === 'Completed' ? (
          <div className={`w-full py-2.5 border rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${isNight ? 'bg-green-900/20 border-green-800 text-green-400' : 'bg-green-50 border-green-100 text-green-700'}`}>
            <CheckCircle size={16} /> Completed
          </div>
        ) : task.status === 'Failed' ? (
          <div className="w-full py-2.5 bg-red-100 border border-red-200 text-red-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
            <XCircle size={16} /> Task Failed
          </div>
        ) : task.status === 'In Progress' && task.startTime ? (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <CountdownTimer 
                startTime={task.startTime} 
                durationMinutes={task.durationMinutes} 
                onComplete={() => onComplete(task.id)} 
              />
            </div>
            {isNight && (
              <p className="text-[10px] text-gray-500 text-center animate-pulse">Do not close background tab</p>
            )}
          </div>
        ) : (
          <button 
            onClick={() => onStart(task.id, task.url)}
            className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
              isNight 
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20' 
                : 'bg-gray-900 hover:bg-gray-800 text-white shadow-gray-900/20'
            }`}
          >
            Start Task <Play size={14} fill="currentColor" />
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskCard;