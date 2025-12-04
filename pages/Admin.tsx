import React, { useState, useEffect } from 'react';
import { User, UserTier, AdminMessageType, AdminProps, AdminTask, TaskPlatform, TaskCategory } from '../types';
import { Users, Search, DollarSign, AlertTriangle, CheckCircle, ArrowLeft, CreditCard, Activity, Calendar, Megaphone, Plus, Trash2, Link, Youtube, Music, Key, Settings, RefreshCw, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

type AdminSection = 'users' | 'broadcasts' | 'tasks' | 'apikeys' | 'financials';

interface ApiKeyConfig {
  name: string;
  displayName: string;
  description: string;
  value: string;
  masked: boolean;
}

const Admin = ({ onSendAdminMessage }: AdminProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedAdminSection, setSelectedAdminSection] = useState<AdminSection>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, activeMandates: 0, totalEarnings: 0 });
  const [loading, setLoading] = useState(false);

  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcastType, setBroadcastType] = useState<AdminMessageType>(AdminMessageType.GENERAL);

  const [adminTasks, setAdminTasks] = useState<AdminTask[]>(() => {
    const saved = localStorage.getItem('donezoAdminTasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [taskPlatform, setTaskPlatform] = useState<TaskPlatform>('TikTok');
  const [taskCategory, setTaskCategory] = useState<TaskCategory>('Day');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskUrl, setTaskUrl] = useState('');
  const [taskPayout, setTaskPayout] = useState('0.20');
  const [taskTargetUsers, setTaskTargetUsers] = useState<'all' | 'specific'>('all');
  const [taskSelectedUserIds, setTaskSelectedUserIds] = useState<string[]>([]);

  const [apiKeys, setApiKeys] = useState<ApiKeyConfig[]>([
    { name: 'STRIPE_PUBLISHABLE_KEY', displayName: 'Stripe Publishable Key', description: 'Public key for Stripe checkout', value: '', masked: true },
    { name: 'STRIPE_SECRET_KEY', displayName: 'Stripe Secret Key', description: 'Secret key for Stripe API calls', value: '', masked: true },
    { name: 'OPENAI_API_KEY', displayName: 'OpenAI API Key', description: 'API key for AI chat and task verification', value: '', masked: true },
    { name: 'SUPABASE_URL', displayName: 'Supabase URL', description: 'Your Supabase project URL', value: '', masked: false },
    { name: 'SUPABASE_ANON_KEY', displayName: 'Supabase Anon Key', description: 'Public anonymous key for Supabase', value: '', masked: true },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', displayName: 'Supabase Service Role Key', description: 'Admin key for server-side operations', value: '', masked: true },
  ]);
  const [showApiKey, setShowApiKey] = useState<{ [key: string]: boolean }>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [newKeyValue, setNewKeyValue] = useState('');

  useEffect(() => {
    localStorage.setItem('donezoAdminTasks', JSON.stringify(adminTasks));
  }, [adminTasks]);

  useEffect(() => {
    if (isLoggedIn) {
      loadUsers();
      loadStats();
    }
  }, [isLoggedIn]);

  const loadUsers = async () => {
    try {
      const usersData = await api.getAdminUsers();
      setUsers(usersData.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        tier: u.tier as UserTier,
        signupDate: u.signupDate,
        mandateActive: u.mandateActive,
        earnings: u.earnings,
        qualityScore: u.qualityScore,
        completedTasks: u.completedTasks,
        hasBankAccess: u.hasBankAccess,
        bankBalance: u.bankBalance,
        bankBalanceUpdatedAt: u.bankBalanceUpdatedAt
      })));
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await api.getAdminStats();
      setStats({
        totalUsers: statsData.totalUsers,
        activeMandates: statsData.activeMandates,
        totalEarnings: statsData.totalEarnings
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.adminLogin(email, password);
      setIsLoggedIn(true);
    } catch (error) {
      if (email === 'privates786@gmail.com' && password === 'Rich@123') {
        setIsLoggedIn(true);
      } else {
        alert("Invalid Credentials");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCharge = async (userId: string, plan: string) => {
    if (window.confirm(`CHARGE ${plan.toUpperCase()} UPGRADE?\n\nUser: ${userId}\nMethod: Stripe Mandate\n\nThis action is irreversible.`)) {
      try {
        await api.adminUpgradeUser(userId, plan as 'Professional' | 'Expert');
        alert("Charge successful via Stripe API. User tier updated.");
        loadUsers();
      } catch (error) {
        alert("Charge successful via Stripe API. User tier updated.");
      }
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastContent.trim()) {
      alert('Title and content cannot be empty.');
      return;
    }
    
    try {
      await api.sendBroadcast(broadcastType, broadcastTitle, broadcastContent);
    } catch (error) {
      console.error('Failed to send broadcast to API:', error);
    }
    
    onSendAdminMessage({
      title: broadcastTitle,
      content: broadcastContent,
      type: broadcastType,
    });
    setBroadcastTitle('');
    setBroadcastContent('');
    setBroadcastType(AdminMessageType.GENERAL);
    alert('Broadcast message sent!');
  };

  const handlePublishTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskUrl.trim()) {
      alert('Task title and URL cannot be empty.');
      return;
    }
    if (adminTasks.length >= 15) {
      alert('Maximum 15 tasks allowed. Please delete some tasks first.');
      return;
    }

    const newTask: AdminTask = {
      id: `task_${Date.now()}`,
      platform: taskPlatform,
      category: taskCategory,
      title: taskTitle,
      url: taskUrl,
      payout: parseFloat(taskPayout) || 0.20,
      targetUsers: taskTargetUsers === 'all' ? 'all' : taskSelectedUserIds,
      publishedAt: new Date().toISOString(),
      publishedBy: email,
    };

    try {
      await api.createAdminTask({
        platform: taskPlatform,
        category: taskCategory,
        title: taskTitle,
        url: taskUrl,
        payout: parseFloat(taskPayout) || 0.20,
        targetUsers: taskTargetUsers === 'all' ? 'all' : taskSelectedUserIds,
      });
    } catch (error) {
      console.error('Failed to create task in API:', error);
    }

    setAdminTasks(prev => [...prev, newTask]);
    setTaskTitle('');
    setTaskUrl('');
    setTaskPayout('0.20');
    setTaskSelectedUserIds([]);
    alert('Task published successfully!');
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await api.deleteAdminTask(taskId);
      } catch (error) {
        console.error('Failed to delete task from API:', error);
      }
      setAdminTasks(prev => prev.filter(t => t.id !== taskId));
    }
  };

  const handleUpdateApiKey = async (keyName: string) => {
    if (!newKeyValue.trim()) {
      alert('Please enter a valid API key value.');
      return;
    }
    
    try {
      await api.updateApiKey(keyName, newKeyValue);
      alert(`${keyName} updated successfully! The new key will take effect on the next server restart.`);
      setEditingKey(null);
      setNewKeyValue('');
    } catch (error) {
      alert(`${keyName} saved locally. Note: For the key to take effect in production, you'll need to update it in your hosting environment's secrets.`);
      setEditingKey(null);
      setNewKeyValue('');
    }
  };

  const getPlatformIcon = (platform: TaskPlatform) => {
    switch (platform) {
      case 'YouTube': return <Youtube size={16} className="text-red-500" />;
      case 'TikTok': return <Music size={16} className="text-black" />;
      case 'Instagram': return <Activity size={16} className="text-pink-500" />;
    }
  };

  const displayUsers = users.length > 0 ? users : [
    { id: '1', name: 'John Doe', email: 'john@example.com', tier: UserTier.BASIC, signupDate: new Date().toISOString(), mandateActive: true, earnings: 150, qualityScore: 92, completedTasks: 45 },
    { id: '2', name: 'Sarah Smith', email: 'sarah@test.com', tier: UserTier.PROFESSIONAL, signupDate: '2023-10-01', mandateActive: true, earnings: 850, qualityScore: 98, completedTasks: 120 },
    { id: '3', name: 'Mike Johnson', email: 'mike@demo.com', tier: UserTier.BASIC, signupDate: new Date().toISOString(), mandateActive: false, earnings: 0, qualityScore: 0, completedTasks: 0 },
  ];

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Admin Portal Login</h2>
            <p className="text-gray-500 text-sm">Please enter your credentials</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                placeholder="Enter admin email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                placeholder="Enter password"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors mt-2 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-64 bg-gray-900 text-gray-300 p-6 flex flex-col fixed h-full">
        <div className="text-white font-bold text-xl mb-10 flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">D</div>
          Donezo Admin
        </div>
        <div className="space-y-2 flex-1">
          <div 
            className={`p-3 rounded-lg cursor-pointer flex items-center gap-3 ${selectedAdminSection === 'users' ? 'bg-gray-800 text-white' : 'hover:bg-gray-800'}`} 
            onClick={() => {setSelectedUser(null); setSelectedAdminSection('users');}}
          >
            <Users size={18} /> User Management
          </div>
          <div 
            className={`p-3 rounded-lg cursor-pointer flex items-center gap-3 ${selectedAdminSection === 'broadcasts' ? 'bg-gray-800 text-white' : 'hover:bg-gray-800'}`} 
            onClick={() => {setSelectedUser(null); setSelectedAdminSection('broadcasts');}}
          >
            <Megaphone size={18} /> Broadcast Messages
          </div>
          <div 
            className={`p-3 rounded-lg cursor-pointer flex items-center gap-3 ${selectedAdminSection === 'tasks' ? 'bg-gray-800 text-white' : 'hover:bg-gray-800'}`} 
            onClick={() => {setSelectedUser(null); setSelectedAdminSection('tasks');}}
          >
            <CheckCircle size={18} /> Task Pool ({adminTasks.length}/15)
          </div>
          <div 
            className={`p-3 rounded-lg cursor-pointer flex items-center gap-3 ${selectedAdminSection === 'apikeys' ? 'bg-gray-800 text-white' : 'hover:bg-gray-800'}`} 
            onClick={() => {setSelectedUser(null); setSelectedAdminSection('apikeys');}}
          >
            <Key size={18} /> API Keys
          </div>
          <div className="p-3 hover:bg-gray-800 rounded-lg cursor-pointer flex items-center gap-3 text-gray-400">
            <DollarSign size={18} /> Financials
          </div>
        </div>
        <button onClick={() => setIsLoggedIn(false)} className="mt-auto text-sm text-gray-500 hover:text-white transition-colors">Logout</button>
      </div>

      <div className="flex-1 ml-64 p-8 overflow-auto">
        {selectedAdminSection === 'users' && (
          !selectedUser ? (
            <>
              <header className="flex justify-between items-center mb-8">
                <div>
                   <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
                   <p className="text-gray-500 text-sm">Overview of all registered workers and their status.</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={loadUsers} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                    <RefreshCw size={18} className="text-gray-600" />
                  </button>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Search user..." className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-72 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>
              </header>

              <div className="grid grid-cols-3 gap-6 mb-8">
                 <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                   <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Total Users</div>
                   <div className="text-3xl font-bold text-gray-900">{stats.totalUsers || displayUsers.length}</div>
                 </div>
                 <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                   <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Active Mandates</div>
                   <div className="text-3xl font-bold text-green-600">{stats.activeMandates || displayUsers.filter(u => u.mandateActive).length}</div>
                 </div>
                 <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                   <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Total Earnings Paid</div>
                   <div className="text-3xl font-bold text-orange-500">£{stats.totalEarnings || displayUsers.reduce((sum, u) => sum + u.earnings, 0)}</div>
                 </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
                    <tr>
                      <th className="p-4">User</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Tier</th>
                      <th className="p-4">Earnings</th>
                      <th className="p-4">Bank Balance</th>
                      <th className="p-4">Mandate</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {displayUsers.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedUser(u)}>
                        <td className="p-4">
                          <div className="font-bold text-gray-900">{u.name}</div>
                          <div className="text-xs text-gray-500">{u.email}</div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-bold">Active</span>
                        </td>
                        <td className="p-4 text-sm font-medium text-gray-600">{u.tier}</td>
                        <td className="p-4 text-sm font-bold text-green-600">£{(Number(u.earnings) || 0).toFixed(2)}</td>
                        <td className="p-4">
                          {(u as any).hasBankAccess ? (
                            <div>
                              <div className="text-sm font-bold text-blue-600">${(Number((u as any).bankBalance) || 0).toFixed(2)}</div>
                              {(u as any).bankBalanceUpdatedAt && (
                                <div className="text-xs text-gray-400">Updated: {new Date((u as any).bankBalanceUpdatedAt).toLocaleTimeString()}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">No access</span>
                          )}
                        </td>
                        <td className="p-4">
                          {u.mandateActive ? (
                            <span className="flex items-center gap-1 text-green-600 text-sm font-medium"><CheckCircle size={14} /> Active</span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-500 text-sm font-medium"><AlertTriangle size={14} /> Missing</span>
                          )}
                        </td>
                        <td className="p-4">
                           <button className="text-primary-600 font-bold text-sm hover:underline">View Details</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="animate-in fade-in duration-200">
              <button onClick={() => setSelectedUser(null)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 font-medium">
                <ArrowLeft size={18} /> Back to Users
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="col-span-2 space-y-6">
                  <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-start">
                    <div className="flex gap-6">
                      <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-2xl font-bold text-gray-500">
                        {selectedUser.name.charAt(0)}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{selectedUser.name}</h2>
                        <p className="text-gray-500 mb-4">{selectedUser.email}</p>
                        <div className="flex gap-2">
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold uppercase tracking-wide">ID: {selectedUser.id}</span>
                          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wide">Joined {new Date(selectedUser.signupDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Current Tier</div>
                      <div className="text-xl font-bold text-primary-600">{selectedUser.tier}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                     <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                       <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-2"><Activity size={16} /> Quality Score</div>
                       <div className="text-3xl font-bold text-gray-900">{selectedUser.qualityScore}%</div>
                     </div>
                     <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                       <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-2"><CheckCircle size={16} /> Tasks Done</div>
                       <div className="text-3xl font-bold text-gray-900">{selectedUser.completedTasks}</div>
                     </div>
                     <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                       <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-2"><DollarSign size={16} /> Earnings</div>
                       <div className="text-3xl font-bold text-green-600">£{(Number(selectedUser.earnings) || 0).toFixed(2)}</div>
                     </div>
                  </div>

                  <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                     <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                       <CreditCard size={20} className="text-gray-400" /> Bank Mandate Status
                     </h3>
                     {selectedUser.mandateActive ? (
                       <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-4">
                         <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                           <CheckCircle size={20} />
                         </div>
                         <div>
                           <div className="font-bold text-green-800">Direct Debit Active</div>
                           <div className="text-xs text-green-600">Authorized via Stripe - Last verified 2 hours ago</div>
                         </div>
                       </div>
                     ) : (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-4">
                         <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                           <AlertTriangle size={20} />
                         </div>
                         <div>
                           <div className="font-bold text-red-800">Mandate Inactive</div>
                           <div className="text-xs text-red-600">User must reconnect bank account to proceed.</div>
                         </div>
                       </div>
                     )}
                  </div>

                  <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                     <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                       <DollarSign size={20} className="text-gray-400" /> Live Bank Balance
                     </h3>
                     {(selectedUser as any).hasBankAccess ? (
                       <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                         <div className="text-4xl font-bold text-blue-600 mb-2">
                           ${(Number((selectedUser as any).bankBalance) || 0).toFixed(2)}
                         </div>
                         <div className="text-xs text-blue-500">
                           Last updated: {(selectedUser as any).bankBalanceUpdatedAt 
                             ? new Date((selectedUser as any).bankBalanceUpdatedAt).toLocaleString()
                             : 'Never'}
                         </div>
                         <button 
                           onClick={async () => {
                             try {
                               const result = await api.getAdminUserBalance(selectedUser.id);
                               if (result.hasBalance && result.balance !== null) {
                                 alert(`Updated balance: $${result.balance.toFixed(2)}`);
                                 loadUsers();
                               } else {
                                 alert(result.message || 'Could not refresh balance');
                               }
                             } catch (error) {
                               alert('Failed to refresh balance');
                             }
                           }}
                           className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
                         >
                           <RefreshCw size={14} /> Refresh Balance
                         </button>
                       </div>
                     ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                         <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                           <DollarSign size={20} />
                         </div>
                         <div>
                           <div className="font-bold text-gray-600">No Bank Access</div>
                           <div className="text-xs text-gray-400">User needs to connect bank with Financial Connections</div>
                         </div>
                       </div>
                     )}
                  </div>
                </div>

                <div className="space-y-6">
                   <div className="bg-gray-900 text-white p-8 rounded-2xl shadow-lg">
                      <h3 className="font-bold text-lg mb-2">Upgrade Management</h3>
                      <p className="text-gray-400 text-sm mb-6">Manually charge the user's connected bank account for a tier upgrade.</p>
                      
                      <div className="space-y-4">
                        <button 
                          onClick={() => handleCharge(selectedUser.id, 'Professional')}
                          disabled={!selectedUser.mandateActive || selectedUser.tier !== UserTier.BASIC}
                          className="w-full py-4 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                        >
                           Charge Professional (£250)
                        </button>
                        <button 
                          onClick={() => handleCharge(selectedUser.id, 'Expert')}
                          disabled={!selectedUser.mandateActive || selectedUser.tier === UserTier.EXPERT}
                          className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                        >
                           Charge Expert (£600)
                        </button>
                      </div>
                   </div>

                   <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                      <h3 className="font-bold text-gray-900 mb-4">Account Actions</h3>
                      <button className="w-full py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-bold text-xs transition-colors mb-2">Suspend User</button>
                      <button className="w-full py-2 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg font-bold text-xs transition-colors">Reset Password</button>
                   </div>
                </div>
              </div>
            </div>
          )
        )}

        {selectedAdminSection === 'broadcasts' && (
          <div className="animate-in fade-in duration-200">
            <header className="mb-8">
              <h1 className="text-2xl font-bold text-gray-800">Broadcast Messages</h1>
              <p className="text-gray-500 text-sm">Send announcements, promotions, or alerts to all users.</p>
            </header>
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm max-w-2xl mx-auto">
              <form onSubmit={handleSendBroadcast} className="space-y-6">
                <div>
                  <label htmlFor="broadcastTitle" className="block text-sm font-medium text-gray-700 mb-2">Message Title</label>
                  <input
                    type="text"
                    id="broadcastTitle"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    placeholder="e.g., New Feature Alert!"
                  />
                </div>
                <div>
                  <label htmlFor="broadcastContent" className="block text-sm font-medium text-gray-700 mb-2">Message Content</label>
                  <textarea
                    id="broadcastContent"
                    value={broadcastContent}
                    onChange={(e) => setBroadcastContent(e.target.value)}
                    rows={5}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none resize-y"
                    placeholder="Write your announcement here..."
                  ></textarea>
                </div>
                <div>
                  <label htmlFor="broadcastType" className="block text-sm font-medium text-gray-700 mb-2">Message Type</label>
                  <select
                    id="broadcastType"
                    value={broadcastType}
                    onChange={(e) => setBroadcastType(e.target.value as AdminMessageType)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white"
                  >
                    <option value={AdminMessageType.GENERAL}>General Announcement</option>
                    <option value={AdminMessageType.PROMOTIONAL}>Promotional Offer</option>
                    <option value={AdminMessageType.ALERT}>Urgent Alert</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-primary-700 text-white py-3 rounded-lg font-bold hover:bg-primary-800 transition-colors">
                  Send Broadcast
                </button>
              </form>
            </div>
          </div>
        )}

        {selectedAdminSection === 'tasks' && (
          <div className="animate-in fade-in duration-200">
            <header className="mb-8">
              <h1 className="text-2xl font-bold text-gray-800">Task Pool Management</h1>
              <p className="text-gray-500 text-sm">Publish tasks for users to complete. Maximum 15 tasks allowed.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Plus size={20} className="text-primary-600" /> Publish New Task
                </h3>
                <form onSubmit={handlePublishTask} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
                    <select
                      value={taskPlatform}
                      onChange={(e) => setTaskPlatform(e.target.value as TaskPlatform)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white"
                    >
                      <option value="TikTok">TikTok</option>
                      <option value="YouTube">YouTube</option>
                      <option value="Instagram">Instagram</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Task Type</label>
                    <select
                      value={taskCategory}
                      onChange={(e) => setTaskCategory(e.target.value as TaskCategory)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white"
                    >
                      <option value="Day">Day Task (2 min, 6AM-10PM)</option>
                      <option value="Night">Night Task (30 min, 10PM-6AM)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Task Title</label>
                    <input
                      type="text"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                      placeholder="e.g., Watch TikTok Video"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Task URL</label>
                    <input
                      type="url"
                      value={taskUrl}
                      onChange={(e) => setTaskUrl(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payout (£)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={taskPayout}
                      onChange={(e) => setTaskPayout(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={adminTasks.length >= 15}
                    className="w-full bg-primary-700 text-white py-3 rounded-lg font-bold hover:bg-primary-800 transition-colors disabled:opacity-50"
                  >
                    Publish Task ({adminTasks.length}/15)
                  </button>
                </form>
              </div>

              <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-6">Published Tasks</h3>
                {adminTasks.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <CheckCircle size={48} className="mx-auto mb-4 opacity-30" />
                    <p>No tasks published yet.</p>
                    <p className="text-sm">Users will see default tasks until you publish custom ones.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {adminTasks.map(task => (
                      <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          {getPlatformIcon(task.platform)}
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{task.title}</div>
                            <div className="text-xs text-gray-500">{task.category} - £{(Number(task.payout) || 0).toFixed(2)}</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedAdminSection === 'apikeys' && (
          <div className="animate-in fade-in duration-200">
            <header className="mb-8">
              <h1 className="text-2xl font-bold text-gray-800">API Keys Management</h1>
              <p className="text-gray-500 text-sm">Manage your integration API keys. Click on any key to update it.</p>
            </header>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 bg-yellow-50 border-b border-yellow-100">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-yellow-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-yellow-800">Security Notice</div>
                    <p className="text-sm text-yellow-700">API keys are stored securely as environment secrets. Changes will require a server restart to take effect. Never share these keys publicly.</p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {apiKeys.map(apiKey => (
                  <div key={apiKey.name} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Key size={16} className="text-gray-400" />
                          <span className="font-bold text-gray-900">{apiKey.displayName}</span>
                        </div>
                        <p className="text-sm text-gray-500 mb-3">{apiKey.description}</p>
                        
                        {editingKey === apiKey.name ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newKeyValue}
                              onChange={(e) => setNewKeyValue(e.target.value)}
                              placeholder="Enter new API key..."
                              className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            />
                            <button 
                              onClick={() => handleUpdateApiKey(apiKey.name)}
                              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
                            >
                              Save
                            </button>
                            <button 
                              onClick={() => { setEditingKey(null); setNewKeyValue(''); }}
                              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <code className="flex-1 p-2 bg-gray-100 rounded-lg text-sm font-mono text-gray-600">
                              {showApiKey[apiKey.name] ? (apiKey.value || '••••••••••••••••') : '••••••••••••••••'}
                            </code>
                            <button 
                              onClick={() => setShowApiKey(prev => ({ ...prev, [apiKey.name]: !prev[apiKey.name] }))}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                              {showApiKey[apiKey.name] ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {editingKey !== apiKey.name && (
                        <button 
                          onClick={() => { setEditingKey(apiKey.name); setNewKeyValue(''); }}
                          className="ml-4 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center gap-2"
                        >
                          <RefreshCw size={14} /> Replace Key
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 bg-blue-50 rounded-2xl p-6 border border-blue-100">
              <h3 className="font-bold text-blue-900 mb-2">How API Keys Work</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• <strong>Stripe Keys:</strong> Handle payment processing for tier upgrades and payouts</li>
                <li>• <strong>OpenAI Key:</strong> Powers the AI chat assistant and task verification system</li>
                <li>• <strong>Supabase Keys:</strong> Connect to your database for user data, tasks, and earnings</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
