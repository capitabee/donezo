import React, { useState } from 'react';
import { Play, CheckCircle, ExternalLink, Youtube, Instagram, Music2, Loader2, Moon, Sun, Lock, AlertTriangle, XCircle, Send, Sparkles } from 'lucide-react';
import { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onStart: (taskId: string, url: string) => void;
  onSubmit: (taskId: string) => Promise<{ success: boolean; message: string; earnings?: number }>;
  onFail: (taskId: string) => void;
}

const TaskCard = ({ task, onStart, onSubmit, onFail }: TaskCardProps) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const taskPayout = Number(task.payout) || 0;
  const isNight = task.category === 'Night';
  const isLocked = task.status === 'Locked';
  const isFailed = task.status === 'Failed';
  const isAwaitingSubmission = task.status === 'Awaiting Submission';
  const isInProgress = task.status === 'In Progress';
  
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
    if (isVerifying) return 'bg-purple-50 border-purple-200';
    if (isAwaitingSubmission) return 'bg-yellow-50 border-yellow-200';
    
    if (isNight) {
      return 'bg-gray-900 border-gray-800 text-white shadow-lg shadow-blue-900/10';
    }
    
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

  const handleSubmit = async () => {
    setIsVerifying(true);
    setVerificationResult(null);
    
    try {
      const result = await onSubmit(task.id);
      setVerificationResult(result);
    } catch (error) {
      setVerificationResult({ success: false, message: 'Verification failed. Please try again.' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleStart = () => {
    onStart(task.id, task.url);
  };

  return (
    <div className={`
      group relative rounded-2xl border p-5 shadow-sm 
      transition-all duration-300 flex flex-col justify-between h-[260px]
      ${getThemeClasses()}
      ${task.status === 'Completed' ? 'opacity-75' : ''}
    `}>
      
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

      <div className="flex justify-between items-start mb-3 mt-1">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${getIconContainerClass()}`}>
          {getIcon()}
        </div>
      </div>

      <div className="flex-1">
        <div className="flex justify-between items-baseline mb-1">
           <h3 className={`font-bold text-sm line-clamp-2 leading-tight ${isNight ? 'text-gray-100' : 'text-gray-800'}`}>
             {task.title}
           </h3>
           <span className={`text-sm font-bold ${isNight ? 'text-green-400' : 'text-gray-900'}`}>£{taskPayout.toFixed(2)}</span>
        </div>
        <p className={`text-xs truncate flex items-center gap-1 font-mono ${isNight ? 'text-gray-500' : 'text-gray-400'}`}>
          <ExternalLink size={10} /> {task.url.replace('https://', '')}
        </p>
        
        <div className="mt-2 h-8">
           {isFailed ? (
             <span className="text-xs text-red-600 font-bold flex items-center gap-1"><AlertTriangle size={12}/> Task Failed</span>
           ) : isVerifying ? (
             <div className="flex items-center gap-2 text-purple-600">
               <Sparkles size={14} className="animate-pulse" />
               <span className="text-xs font-bold animate-pulse">AI Analysing...</span>
             </div>
           ) : isAwaitingSubmission ? (
             <span className="text-xs text-yellow-700 font-bold flex items-center gap-1">
               <Send size={12}/> Ready to submit for review
             </span>
           ) : isInProgress ? (
             <span className="text-xs text-orange-500 font-medium flex items-center gap-1">
               <Loader2 size={12} className="animate-spin"/> Task in progress...
             </span>
           ) : verificationResult ? (
             <span className={`text-xs font-bold flex items-center gap-1 ${verificationResult.success ? 'text-green-600' : 'text-red-600'}`}>
               {verificationResult.success ? <CheckCircle size={12}/> : <XCircle size={12}/>}
               {verificationResult.message.substring(0, 40)}...
             </span>
           ) : null}
        </div>
      </div>

      <div className="mt-4">
        {isLocked ? (
          <div className="w-full py-2.5 bg-gray-200 border border-gray-300 text-gray-500 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed">
            <Lock size={14} /> Available {isNight ? '10 PM' : '6 AM'}
          </div>
        ) : task.status === 'Completed' ? (
          <div className={`w-full py-2.5 border rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${isNight ? 'bg-green-900/20 border-green-800 text-green-400' : 'bg-green-50 border-green-100 text-green-700'}`}>
            <CheckCircle size={16} /> Completed +£{taskPayout.toFixed(2)}
          </div>
        ) : task.status === 'Failed' ? (
          <div className="w-full py-2.5 bg-red-100 border border-red-200 text-red-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
            <XCircle size={16} /> Task Failed
          </div>
        ) : isVerifying ? (
          <div className="w-full py-2.5 bg-purple-100 border border-purple-200 text-purple-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Verifying with AI...
          </div>
        ) : isAwaitingSubmission ? (
          <button 
            onClick={handleSubmit}
            className="w-full py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-600/20 active:scale-95"
          >
            <Send size={14} /> Submit Task for Review
          </button>
        ) : isInProgress ? (
          <button 
            onClick={handleSubmit}
            className="w-full py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 active:scale-95"
          >
            <Send size={14} /> Submit Task
          </button>
        ) : (
          <button 
            onClick={handleStart}
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
