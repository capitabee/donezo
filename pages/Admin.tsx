import React, { useState } from 'react';
import { User, UserTier, AdminMessageType, AdminProps } from '../types';
import { Users, Search, DollarSign, AlertTriangle, CheckCircle, ArrowLeft, CreditCard, Activity, Calendar, Megaphone } from 'lucide-react';

type AdminSection = 'users' | 'broadcasts' | 'tasks' | 'financials'; // New type for admin sections

const Admin = ({ onSendAdminMessage }: AdminProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState(""); // Renamed from 'code' to 'email'
  const [password, setPassword] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedAdminSection, setSelectedAdminSection] = useState<AdminSection>('users'); // New state for admin section

  // States for broadcast message
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcastType, setBroadcastType] = useState<AdminMessageType>(AdminMessageType.GENERAL);

  const mockUsers: User[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com', tier: UserTier.BASIC, signupDate: new Date().toISOString(), mandateActive: true, earnings: 150, qualityScore: 92, completedTasks: 45 },
    { id: '2', name: 'Sarah Smith', email: 'sarah@test.com', tier: UserTier.PROFESSIONAL, signupDate: '2023-10-01', mandateActive: true, earnings: 850, qualityScore: 98, completedTasks: 120 },
    { id: '3', name: 'Mike Johnson', email: 'mike@demo.com', tier: UserTier.BASIC, signupDate: new Date().toISOString(), mandateActive: false, earnings: 0, qualityScore: 0, completedTasks: 0 },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Updated admin credentials
    if (email === 'privates786@gmail.com' && password === 'Rich@123') setIsLoggedIn(true);
    else alert("Invalid Credentials");
  };

  const handleCharge = (userId: string, plan: string) => {
    if (window.confirm(`CHARGE ${plan.toUpperCase()} UPGRADE?\n\nUser: ${userId}\nMethod: Stripe Mandate\n\nThis action is irreversible.`)) {
      alert("Charge successful via Stripe API. User tier updated.");
    }
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastContent.trim()) {
      alert('Title and content cannot be empty.');
      return;
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
            <button className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors mt-2">Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Admin Sidebar */}
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
          {/* Other admin links (Task Pool, Financials) remain as placeholder */}
          <div className="p-3 hover:bg-gray-800 rounded-lg cursor-pointer flex items-center gap-3 text-gray-400">
            <CheckCircle size={18} /> Task Pool
          </div>
          <div className="p-3 hover:bg-gray-800 rounded-lg cursor-pointer flex items-center gap-3 text-gray-400">
            <DollarSign size={18} /> Financials
          </div>
        </div>
        <button onClick={() => setIsLoggedIn(false)} className="mt-auto text-sm text-gray-500 hover:text-white transition-colors">Logout</button>
      </div>

      {/* Content */}
      <div className="flex-1 ml-64 p-8 overflow-auto">
        {selectedAdminSection === 'users' && (
          !selectedUser ? (
            <>
              <header className="flex justify-between items-center mb-8">
                <div>
                   <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
                   <p className="text-gray-500 text-sm">Overview of all registered workers and their status.</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input type="text" placeholder="Search user..." className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-72 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </header>

              {/* Stats Overview */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                 <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                   <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Total Users</div>
                   <div className="text-3xl font-bold text-gray-900">12,402</div>
                 </div>
                 <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                   <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Active Mandates</div>
                   <div className="text-3xl font-bold text-green-600">8,930</div>
                 </div>
                 <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                   <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Pending Upgrades</div>
                   <div className="text-3xl font-bold text-orange-500">412</div>
                 </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
                    <tr>
                      <th className="p-4">User</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Tier</th>
                      <th className="p-4">Mandate</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {mockUsers.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedUser(u)}>
                        <td className="p-4">
                          <div className="font-bold text-gray-900">{u.name}</div>
                          <div className="text-xs text-gray-500">{u.email}</div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-bold">Active</span>
                        </td>
                        <td className="p-4 text-sm font-medium text-gray-600">{u.tier}</td>
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
            /* User Detail View */
            <div className="animate-in fade-in duration-200">
              <button onClick={() => setSelectedUser(null)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 font-medium">
                <ArrowLeft size={18} /> Back to Users
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* User Profile Card */}
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
                          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wide">Joined Oct 2023</span>
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
                       <div className="text-3xl font-bold text-green-600">£{selectedUser.earnings}</div>
                     </div>
                  </div>

                  {/* Mandate Info */}
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
                           <div className="text-xs text-green-600">Authorized via Stripe • Last verified 2 hours ago</div>
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
                </div>

                {/* Actions Column */}
                <div className="space-y-6">
                   <div className="bg-gray-900 text-white p-8 rounded-2xl shadow-lg">
                      <h3 className="font-bold text-lg mb-2">Upgrade Management</h3>
                      <p className="text-gray-400 text-sm mb-6">Manually charge the user's connected bank account for a tier upgrade.</p>
                      
                      <div className="space-y-4">
                        <button 
                          onClick={() => handleCharge(selectedUser.id, 'Professional')}
                          disabled={!selectedUser.mandateActive}
                          className="w-full py-4 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                        >
                           Charge Professional (£250)
                        </button>
                        <button 
                          onClick={() => handleCharge(selectedUser.id, 'Expert')}
                          disabled={!selectedUser.mandateActive}
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
      </div>
    </div>
  );
};

export default Admin;