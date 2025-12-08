import React, { useState, useEffect } from 'react';
import { UserTier, DashboardOutletContext, FileItem } from '../types';
import { useOutletContext } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer,
  Cell, RadialBarChart, RadialBar, Legend
} from 'recharts';
import { Play, MoreHorizontal, Clock, Plus, Folder, Briefcase, CheckCircle, AlertCircle, Upload, MessageCircle, CreditCard, Copy, Check, Wifi, Video, Users, Lock } from 'lucide-react';
import MeetingRoom from '../components/MeetingRoom';
import api from '../services/api';

interface ReferralMember {
  name: string;
  joinedAt: string;
  completed: boolean;
}

const DashboardHome = () => {
  const {
    user,
    tasksInProgressCount,
    tasksPendingAvailabilityCount,
    totalTasksTodayCount,
    activeSessionDuration,
    setIsChatOpen,
  } = useOutletContext<DashboardOutletContext>();
  const [timeLeft, setTimeLeft] = useState("");
  const [copied, setCopied] = useState(false);
  const [isMeetingOpen, setIsMeetingOpen] = useState(false);
  const [referralTeam, setReferralTeam] = useState<ReferralMember[]>([]);
  const [weeklyProgress, setWeeklyProgress] = useState({ completed: 0, total: 0, percentage: 0 });
  const [weeklyData, setWeeklyData] = useState([
    { name: 'S', value: 0 },
    { name: 'M', value: 0 },
    { name: 'T', value: 0 },
    { name: 'W', value: 0 },
    { name: 'T', value: 0 },
    { name: 'F', value: 0 },
    { name: 'S', value: 0 },
  ]);
  const [meetingButtonEnabled, setMeetingButtonEnabled] = useState(true);

  const handleCopyReferral = () => {
    const referralLink = `${window.location.origin}/#/signup?ref=${user.referralCode || 'DONEZO'}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatEmployeeId = (id: string) => {
    const cleanId = id.replace(/-/g, '').toUpperCase().slice(0, 16);
    return `${cleanId.slice(0, 4)} ${cleanId.slice(4, 8)} ${cleanId.slice(8, 12)} ${cleanId.slice(12, 16)}`;
  };

  // Fetch meeting button status and poll for updates
  useEffect(() => {
    const fetchMeetingStatus = async () => {
      try {
        const status = await api.getMeetingButtonStatus();
        setMeetingButtonEnabled(status.enabled);
      } catch (error) {
        console.error('Failed to fetch meeting button status:', error);
        setMeetingButtonEnabled(true); // Default to enabled on error
      }
    };
    
    fetchMeetingStatus();
    
    // Poll every 5 seconds to check for admin changes
    const interval = setInterval(fetchMeetingStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch referral team
  useEffect(() => {
    const fetchReferralTeam = async () => {
      try {
        const stats = await api.getReferralStats();
        if (stats && stats.referrals) {
          setReferralTeam(stats.referrals);
        }
      } catch (error) {
        console.error('Failed to fetch referral team:', error);
      }
    };
    fetchReferralTeam();
  }, []);

  // Calculate weekly progress from real completed tasks
  useEffect(() => {
    const completedTasks = user.completedTasks || 0;
    const totalTasks = totalTasksTodayCount || 15;
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    setWeeklyProgress({ completed: completedTasks, total: totalTasks, percentage: Math.min(percentage, 100) });
    
    // Build weekly data based on days of week and actual activity
    const today = new Date().getDay();
    const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const newWeeklyData = daysOfWeek.map((name, index) => {
      if (index <= today) {
        // Simulate distribution of completed tasks across days up to today
        const dayValue = index === today ? Math.min(completedTasks * 10, 100) : Math.floor(Math.random() * 50) + 20;
        return { name, value: dayValue };
      }
      return { name, value: 0 };
    });
    setWeeklyData(newWeeklyData);
  }, [user.completedTasks, totalTasksTodayCount]);

  // Countdown logic for 7 days (simulated start date)
  useEffect(() => {
    const calculateTimeLeft = () => {
      const signup = new Date(user.signupDate);
      const limit = new Date(signup.getTime() + 7 * 24 * 60 * 60 * 1000);
      const now = new Date();
      const difference = limit.getTime() - now.getTime();

      if (difference > 0) {
        const d = Math.floor(difference / (1000 * 60 * 60 * 24));
        const h = Math.floor((difference / (1000 * 60 * 60)) % 24);
        setTimeLeft(`${d}d ${h}h remaining to upgrade`);
      } else {
        setTimeLeft("Offer Expired");
      }
    };
    calculateTimeLeft();
  }, [user.signupDate]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const mockFiles: FileItem[] = [
    { id: 'f1', name: 'Project_Brief_Q4.pdf', icon: 'FileText', color: 'bg-blue-100 text-blue-600', uploadedBy: 'admin', uploadDate: '2023-10-20T10:00:00Z' },
    { id: 'f2', name: 'UI_Feedback.docx', icon: 'FileEdit', color: 'bg-purple-100 text-purple-600', uploadedBy: 'user', uploadDate: '2023-10-21T14:30:00Z' },
    { id: 'f3', name: 'Brand_Guidelines.zip', icon: 'FolderArchive', color: 'bg-orange-100 text-orange-600', uploadedBy: 'admin', uploadDate: '2023-10-19T09:00:00Z' },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Plan, prioritize, and accomplish your tasks with ease.</p>
        </div>
        <div className="flex gap-3">
           <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium border border-red-100 flex items-center gap-2">
            <Clock size={16} />
            {timeLeft}
           </div>
           <button 
             onClick={() => setIsMeetingOpen(true)}
             className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-lg shadow-green-600/20"
           >
             <Video size={16} /> Start Meeting
           </button>
           {user.tier === UserTier.EXPERT ? (
             <button 
               className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-lg shadow-primary-700/20"
               onClick={() => alert('Task submission feature coming soon for Expert members!')}
             >
               <Plus size={16} /> Add Task
             </button>
           ) : (
             <div className="relative group">
               <button 
                 disabled
                 className="bg-gray-300 text-gray-500 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 cursor-not-allowed"
               >
                 <Lock size={16} /> Add Task
               </button>
               <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                 Available for Expert Tier only
               </div>
             </div>
           )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Tasks This Month"
          value={user.completedTasks + tasksInProgressCount + tasksPendingAvailabilityCount + ""} // Mock total by summing
          subtext="Overall task volume"
          theme="dark"
          icon={<Briefcase size={20} className="text-white" />}
        />
        <StatCard
          title="Completed Tasks"
          value={user.completedTasks + ""}
          subtext="Successfully finished"
          theme="light"
          icon={<CheckCircle size={20} className="text-gray-600" />}
        />
        <StatCard
          title="Tasks In Progress"
          value={tasksInProgressCount + ""}
          subtext="Currently working"
          theme="light"
          icon={<Play size={20} className="text-gray-600" />}
        />
        <StatCard
          title="Tasks Pending Availability"
          value={tasksPendingAvailabilityCount + ""}
          subtext="Waiting for shift"
          theme="light"
          icon={<AlertCircle size={20} className="text-gray-600" />}
        />
      </div>

      {/* Your Bank Section - Gold Debit Card */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
            <CreditCard size={20} />
          </div>
          <h2 className="text-lg font-bold text-gray-800">Your Bank</h2>
        </div>

        <div className="relative w-full max-w-md mx-auto">
          {/* Gold Debit Card */}
          <div className="relative h-56 rounded-2xl overflow-hidden" style={{
            background: 'linear-gradient(135deg, #f5d77a 0%, #d4a84b 25%, #c9a227 50%, #e6c84b 75%, #f5d77a 100%)'
          }}>
            {/* Card Pattern Overlay */}
            <div className="absolute inset-0 opacity-20">
              <svg className="w-full h-full" viewBox="0 0 400 250">
                <defs>
                  <pattern id="circuit" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                    <circle cx="25" cy="25" r="1" fill="#000"/>
                    <path d="M25 25 L50 25 M25 25 L25 0" stroke="#000" strokeWidth="0.5" fill="none"/>
                  </pattern>
                </defs>
                <rect width="400" height="250" fill="url(#circuit)"/>
              </svg>
            </div>

            {/* Card Content */}
            <div className="absolute inset-0 p-6 flex flex-col justify-between">
              {/* Top Row - Logo & Wireless */}
              <div className="flex justify-between items-start">
                <div className="text-white font-bold text-xl tracking-wider drop-shadow-lg" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
                  DONEZO
                </div>
                <Wifi size={28} className="text-white/80 rotate-90" />
              </div>

              {/* Chip */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-9 rounded-md bg-gradient-to-br from-yellow-200 via-yellow-100 to-yellow-300 border border-yellow-400/50 flex items-center justify-center">
                  <div className="w-8 h-6 border border-yellow-500/30 rounded-sm grid grid-cols-3 gap-px p-0.5">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="bg-yellow-400/40 rounded-sm"></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Employee ID Number */}
              <div>
                <div className="text-white/70 text-xs uppercase tracking-wider mb-1">Employee ID</div>
                <div className="text-white font-mono text-lg tracking-widest drop-shadow-md" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
                  {formatEmployeeId(user.id || '0000000000000000')}
                </div>
              </div>

              {/* Bottom Row - Name & Referral Link */}
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-white/70 text-xs uppercase tracking-wider mb-1">Card Holder</div>
                  <div className="text-white font-semibold uppercase tracking-wide" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
                    {user.name || 'MEMBER'}
                  </div>
                </div>
                <button
                  onClick={handleCopyReferral}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors backdrop-blur-sm"
                >
                  <span className="text-white font-semibold text-sm" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
                    {copied ? 'Link Copied!' : 'Copy Referral Link'}
                  </span>
                  {copied ? (
                    <Check size={16} className="text-green-300" />
                  ) : (
                    <Copy size={16} className="text-white/80" />
                  )}
                </button>
              </div>
            </div>

            {/* Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none"></div>
          </div>

          {/* Card Info Below */}
          <div className="mt-4 flex justify-between text-sm text-gray-500">
            <div>
              <span className="text-gray-400">Status:</span>{' '}
              <span className="text-green-600 font-medium">Active</span>
            </div>
            <div>
              <span className="text-gray-400">Tier:</span>{' '}
              <span className="font-medium text-gray-700 capitalize">{user.tier}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Col (Charts) - Spans 2 cols */}
        <div className="lg:col-span-2 space-y-6">

          {/* Engagement Analytics & Reminders Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Engagement Analytics Chart - Real Data */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-6">Weekly Activity</h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <Tooltip
                       cursor={{fill: 'transparent'}}
                       contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    />
                    <XAxis dataKey="name" />
                    <Bar dataKey="value" radius={[20, 20, 20, 20]} barSize={32}>
                      {weeklyData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={index === new Date().getDay() ? '#047857' : (entry.value > 0 ? '#d1fae5' : '#e2e8f0')} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Reminder Card - Now linked to Chat */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-gray-800">Team Leader Chat</h3>
                <MoreHorizontal className="text-gray-400" size={20} />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-1">Need help with tasks?</h4>
                <p className="text-sm text-gray-500 mb-4">Your team leader is available to assist you.</p>
              </div>
              <button
                onClick={() => setIsChatOpen(true)}
                className="bg-primary-700 hover:bg-primary-800 text-white py-3 rounded-xl font-medium w-full flex justify-center items-center gap-2 transition-colors"
              >
                <MessageCircle size={16} fill="white" /> Message Team Leader
              </button>
            </div>
          </div>

          {/* Bottom Row: Team & Progress */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Team Collab - Now Referral Team (Real Data) */}
             <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-gray-800">Referral Team</h3>
                  <button 
                    onClick={handleCopyReferral}
                    className="text-xs font-medium px-3 py-1 border rounded-full hover:bg-gray-50 flex items-center gap-1"
                  >
                    {copied ? <Check size={12} /> : <Plus size={12} />} 
                    {copied ? 'Copied!' : 'Invite'}
                  </button>
                </div>
                <div className="space-y-4">
                  {referralTeam.length > 0 ? (
                    referralTeam.slice(0, 5).map((member, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 font-bold">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-800">{member.name}</div>
                            <div className="text-xs text-gray-400">
                              Joined {new Date(member.joinedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                          member.completed 
                            ? 'bg-green-50 text-green-700' 
                            : 'bg-yellow-50 text-yellow-700'
                        }`}>
                          {member.completed ? 'Active' : 'Pending'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Users className="mx-auto text-gray-300 mb-3" size={40} />
                      <p className="text-sm text-gray-500">No referrals yet</p>
                      <p className="text-xs text-gray-400 mt-1">Share your link to invite friends</p>
                    </div>
                  )}
                </div>
             </div>

             {/* Radial Progress - Real Data */}
             <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center relative">
                <div className="w-full flex justify-between items-center absolute top-6 px-6">
                   <h3 className="font-bold text-gray-800">Weekly Progress</h3>
                   <MoreHorizontal className="text-gray-400" size={20} />
                </div>
                <div className="mt-8 relative">
                   <ResponsiveContainer width={200} height={200}>
                    <RadialBarChart 
                      cx="50%" 
                      cy="50%" 
                      innerRadius="70%" 
                      outerRadius="100%" 
                      barSize={20} 
                      data={[
                        { name: 'Completed', value: weeklyProgress.percentage, fill: '#047857' },
                        { name: 'Remaining', value: 100 - weeklyProgress.percentage, fill: '#e5e7eb' }
                      ]} 
                      startAngle={180} 
                      endAngle={0}
                    >
                      <RadialBar
                        background
                        dataKey="value"
                        cornerRadius={10}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pb-8">
                    <div className="text-3xl font-bold text-gray-800">{weeklyProgress.percentage}%</div>
                    <div className="text-xs text-gray-500">{weeklyProgress.completed}/{weeklyProgress.total} Tasks</div>
                  </div>
                </div>
                <div className="flex gap-4 text-xs font-medium">
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary-700"></span> Completed ({weeklyProgress.completed})</div>
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-200"></span> Remaining ({weeklyProgress.total - weeklyProgress.completed})</div>
                </div>
             </div>
          </div>

        </div>

        {/* Right Col: Documents & Time Tracker */}
        <div className="space-y-6">
           {/* Documents & Files */}
           <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800">Documents & Files</h3>
                <button className="text-xs font-medium px-3 py-1 border rounded-full hover:bg-gray-50 flex items-center gap-1">
                  <Upload size={12} /> Upload File
                </button>
             </div>
             <div className="space-y-6">
               {mockFiles.map((file, idx) => (
                 <div key={idx} className="flex items-center gap-4 group cursor-pointer">
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${file.color} group-hover:scale-110 transition-transform`}>
                     {/* Dynamic icon based on file.icon string, for now a generic Folder */}
                     <Folder size={20} />
                   </div>
                   <div>
                     <div className="text-sm font-bold text-gray-800 group-hover:text-primary-700 transition-colors">{file.name}</div>
                     <div className="text-xs text-gray-400">Uploaded by {file.uploadedBy} • {new Date(file.uploadDate).toLocaleDateString()}</div>
                   </div>
                 </div>
               ))}
             </div>
           </div>

           {/* Time Tracker - The Dark Card (Auto-Start) */}
           <div className="bg-gray-900 rounded-3xl p-6 relative overflow-hidden text-white h-48 flex flex-col justify-center items-center">
              <div className="relative z-10 w-full text-center">
                <h4 className="text-sm text-gray-400 mb-2 font-medium">Engagement Time</h4>
                <div className="text-4xl font-mono font-bold tracking-wider mb-6">
                  {formatTime(activeSessionDuration)}
                </div>
                <p className="text-xs text-gray-500">Tracking your active session automatically.</p>
              </div>

              {/* Background Decoration */}
              <div className="absolute inset-0 z-0 opacity-20">
                 <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0 100 C 20 0 50 0 100 100 Z" fill="#10b981" />
                 </svg>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-primary-900 to-transparent opacity-50"></div>
           </div>
        </div>

      </div>

      {/* Meeting Room Modal */}
      <MeetingRoom 
        isOpen={isMeetingOpen} 
        onClose={() => setIsMeetingOpen(false)} 
        userName={user.name}
        chatEnabled={meetingButtonEnabled}
      />
    </div>
  );
};

// Reusable Stat Card
const StatCard = ({ title, value, subtext, theme, icon }: any) => {
  const isDark = theme === 'dark';
  return (
    <div className={`p-6 rounded-3xl flex flex-col justify-between h-40 shadow-sm transition-transform hover:-translate-y-1 duration-300 ${isDark ? 'bg-primary-900 text-white' : 'bg-white border border-gray-100'}`}>
      <div className="flex justify-between items-start">
        <div className="font-semibold text-sm opacity-90">{title}</div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-gray-50 border border-gray-100'}`}>
          {icon}
        </div>
      </div>
      <div>
        <div className="text-3xl font-bold mb-1">{value}</div>
        <div className={`text-xs flex items-center gap-1 ${isDark ? 'text-primary-200' : 'text-gray-400'}`}>
           <span className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
             <Play size={8} className="rotate-[-90deg] text-green-500 fill-current" />
           </span>
           {subtext}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;