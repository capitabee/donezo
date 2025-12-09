import React, { useState, useEffect, useCallback } from 'react';
import { TaskCategory, DashboardOutletContext } from '../types';
import { useOutletContext } from 'react-router-dom';
import TaskCard from '../components/TaskCard';
import RewardAnimation from '../components/RewardAnimation';
import { Sun, Moon, Info, Clock, AlertTriangle } from 'lucide-react';

const Tasks = () => {
  const {
    user,
    tasks,
    startTask,
    submitTask,
    failTask,
  } = useOutletContext<DashboardOutletContext>();
  const [showReward, setShowReward] = useState(false);
  const [activeTab, setActiveTab] = useState<TaskCategory>('Day');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmitTask = useCallback(async (taskId: string) => {
    const result = await submitTask(taskId);
    if (result.success) {
      setShowReward(true);
    }
    return result;
  }, [submitTask]);

  const dayTasks = tasks.filter(t => t.category === 'Day');
  const nightTasks = tasks.filter(t => t.category === 'Night');
  const activeHours = currentTime.getHours();
  const isNightShift = activeHours >= 22 || activeHours < 6;

  useEffect(() => {
    if (isNightShift && activeTab !== 'Night') {
      setActiveTab('Night');
    } else if (!isNightShift && activeTab !== 'Day') {
      setActiveTab('Day');
    }
  }, [isNightShift, activeTab]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {showReward && <RewardAnimation onAnimationComplete={() => setShowReward(false)} />}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1 ${isNightShift ? 'bg-blue-900 text-white' : 'bg-orange-100 text-orange-700'}`}>
               {isNightShift ? <Moon size={12} /> : <Sun size={12} />}
               Current Shift: {isNightShift ? 'Night (10 PM - 6 AM)' : 'Day (6 AM - 10 PM)'}
            </span>
            <span className="text-gray-400 text-xs font-mono">{currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">
            Daily Task Queue
          </h1>
          <p className="text-gray-500 mt-1 max-w-lg text-sm">
            Complete your {tasks.length} daily tasks. Click Start to open the link, then Submit when done for AI verification.
          </p>
        </div>

        <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
          <button
            onClick={() => setActiveTab('Day')}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'Day' ? 'bg-orange-50 text-orange-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Sun size={16} /> Day Tasks ({dayTasks.filter(t => t.status === 'Completed').length}/{dayTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('Night')}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'Night' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Moon size={16} /> Night Tasks ({nightTasks.filter(t => t.status === 'Completed').length}/{nightTasks.length})
          </button>
        </div>
      </div>

      {activeTab === 'Night' && (isNightShift ? (
        <div className="mb-6 bg-blue-900 text-blue-100 p-4 rounded-xl flex items-start gap-3 border border-blue-700 shadow-lg shadow-blue-900/10">
           <AlertTriangle className="flex-shrink-0 text-yellow-400" size={20} />
           <div className="text-sm">
             <strong>How it works:</strong> Click "Start Task" to open the video. Watch/engage with the content, then return here and click "Submit Task" for AI verification. If approved, funds are credited instantly!
           </div>
        </div>
      ) : (
        <div className="mb-6 bg-gray-700 text-gray-100 p-4 rounded-xl flex items-start gap-3 border border-gray-600 shadow-lg shadow-gray-900/10">
           <Clock className="flex-shrink-0 text-gray-400" size={20} />
           <div className="text-sm">
             <strong>Night Tasks are currently inactive.</strong> They become available between 10 PM and 6 AM. Switch to Day Tasks for now.
           </div>
        </div>
      ))}
      
      {activeTab === 'Day' && (!isNightShift ? (
        <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-xl flex items-start gap-3 border border-green-100 shadow-lg shadow-green-900/5">
           <Info className="flex-shrink-0 text-green-500" size={20} />
           <div className="text-sm">
             <strong>How it works:</strong> Click "Start Task" to open the content. Engage with it (watch, like, comment), then return and click "Submit Task". Our AI will verify your completion and credit your earnings!
           </div>
        </div>
      ) : (
        <div className="mb-6 bg-gray-700 text-gray-100 p-4 rounded-xl flex items-start gap-3 border border-gray-600 shadow-lg shadow-gray-900/10">
           <Clock className="flex-shrink-0 text-gray-400" size={20} />
           <div className="text-sm">
             <strong>Day Tasks are currently inactive.</strong> They become available between 6 AM and 10 PM. Switch to Night Tasks for now.
           </div>
        </div>
      ))}

      {tasks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
          <div className="mb-4">
            <Clock size={48} className="mx-auto text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">No Tasks Available</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Tasks are published by the admin. Please check back later for new opportunities.
          </p>
        </div>
      ) : (activeTab === 'Day' ? dayTasks : nightTasks).length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
          <div className="mb-4">
            {activeTab === 'Day' ? <Sun size={48} className="mx-auto text-orange-200" /> : <Moon size={48} className="mx-auto text-blue-200" />}
          </div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">No {activeTab} Tasks Available</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Switch to {activeTab === 'Day' ? 'Night' : 'Day'} tasks or check back later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {(activeTab === 'Day' ? dayTasks : nightTasks).map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              userTier={user?.tier}
              totalTaskCount={tasks.length}
              onStart={startTask}
              onSubmit={handleSubmitTask}
              onFail={failTask}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Tasks;
