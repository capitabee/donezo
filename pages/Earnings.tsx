import React from 'react';
import { User, UserTier, DashboardOutletContext } from '../types';
import { useOutletContext } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, Calendar, Activity, Download, CheckCircle } from 'lucide-react';

const data = [
  { name: 'Oct 1', amount: 40 },
  { name: 'Oct 5', amount: 120 },
  { name: 'Oct 10', amount: 180 },
  { name: 'Oct 15', amount: 250 },
  { name: 'Oct 20', amount: 390 },
  { name: 'Oct 25', amount: 450 },
];

const transactions = [
  { id: 'TX-1042', date: 'Oct 24, 2023', task: 'Sentiment Analysis Batch', amount: 45.50, status: 'Processed' },
  { id: 'TX-1041', date: 'Oct 22, 2023', task: 'Grammar Correction', amount: 22.00, status: 'Processed' },
  { id: 'TX-1040', date: 'Oct 20, 2023', task: 'Image Annotation', amount: 18.50, status: 'Processed' },
  { id: 'TX-1039', date: 'Oct 18, 2023', task: 'Data Comparison', amount: 35.00, status: 'Processed' },
];

const Earnings = () => {
  const { user } = useOutletContext<DashboardOutletContext>(); // Use Outlet context
  const salaryCap = user.tier === UserTier.BASIC ? 650 : user.tier === UserTier.PROFESSIONAL ? 1500 : 3000;
  const percentage = Math.min((user.earnings / salaryCap) * 100, 100);

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Earnings & Payouts</h1>
          <p className="text-gray-500 text-sm mt-1">Track your salary progress and payment history.</p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <DollarSign size={20} />
            </div>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+12%</span>
          </div>
          <div className="text-gray-500 text-sm font-medium">Current Balance</div>
          <div className="text-2xl font-bold text-gray-800">£{user.earnings.toFixed(2)}</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Activity size={20} />
            </div>
          </div>
          <div className="text-gray-500 text-sm font-medium">Monthly Cap</div>
          <div className="text-2xl font-bold text-gray-800">£{salaryCap}</div>
          <div className="w-full bg-gray-100 h-1.5 mt-3 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${percentage}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="text-gray-500 text-sm font-medium">Quality Score</div>
          <div className="text-2xl font-bold text-gray-800">{user.qualityScore}%</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
              <Calendar size={20} />
            </div>
          </div>
          <div className="text-gray-500 text-sm font-medium">Next Payout</div>
          <div className="text-2xl font-bold text-gray-800">Oct 30</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-6">Income Analytics</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} tickFormatter={(value) => `£${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value: number) => [`£${value}`, 'Earnings']}
                />
                <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* History List */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
          <h3 className="font-bold text-gray-800 mb-6">Recent Activity</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {transactions.map((tx, i) => (
              <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                    <CheckCircle size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-800">{tx.task}</div>
                    <div className="text-xs text-gray-400">{tx.date}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-800">+£{tx.amount.toFixed(2)}</div>
                  <div className="text-[10px] uppercase font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full inline-block mt-1">{tx.status}</div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
            View All History
          </button>
        </div>
      </div>
    </div>
  );
};

export default Earnings;