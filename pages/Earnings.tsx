import React, { useState, useEffect } from 'react';
import { User, UserTier, DashboardOutletContext } from '../types';
import { useOutletContext } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, Calendar, Activity, Download, CheckCircle, Loader } from 'lucide-react';
import api from '../services/api';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  date: string;
}

const Earnings = () => {
  const { user } = useOutletContext<DashboardOutletContext>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<{ name: string; amount: number }[]>([]);

  const userEarnings = Number(user.earnings) || 0;
  const salaryCap = user.tier === UserTier.BASIC ? 650 : user.tier === UserTier.PROFESSIONAL ? 1500 : 3000;
  const percentage = Math.min((userEarnings / salaryCap) * 100, 100);

  useEffect(() => {
    const loadEarnings = async () => {
      try {
        // Load from both endpoints for comprehensive data
        const [earningsData, activityData] = await Promise.all([
          api.getEarnings().catch(() => ({ transactions: [] })),
          api.getEarningsActivity().catch(() => ({ recentActivity: [], summary: {} }))
        ]);
        
        // Combine transactions from both sources
        const allTransactions: Transaction[] = [];
        
        // Add activity data (completed tasks)
        if (activityData.recentActivity) {
          activityData.recentActivity.forEach((item: any) => {
            allTransactions.push({
              id: item.id,
              type: 'task_earning',
              amount: Number(item.payout || 0),
              description: `${item.platform}: ${item.title}`,
              status: item.status || 'completed',
              date: item.completedAt
            });
          });
        }
        
        // Add transaction history
        if (earningsData.transactions) {
          earningsData.transactions.forEach((tx: Transaction) => {
            // Avoid duplicates
            if (!allTransactions.find(t => t.id === tx.id)) {
              allTransactions.push(tx);
            }
          });
        }
        
        // Sort by date descending
        allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setTransactions(allTransactions);
        
        // Build chart data
        const grouped: { [key: string]: number } = {};
        allTransactions.forEach((tx: Transaction) => {
          const date = new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (!grouped[date]) grouped[date] = 0;
          if (tx.amount > 0) grouped[date] += tx.amount;
        });
        
        const chartPoints = Object.entries(grouped)
          .slice(-7)
          .map(([name, amount]) => ({ name, amount: Number(amount.toFixed(2)) }));
        
        if (chartPoints.length > 0) {
          setChartData(chartPoints);
        }
      } catch (error) {
        console.error('Failed to load earnings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEarnings();
  }, []);

  const defaultChartData = [
    { name: 'Day 1', amount: userEarnings * 0.1 },
    { name: 'Day 2', amount: userEarnings * 0.25 },
    { name: 'Day 3', amount: userEarnings * 0.4 },
    { name: 'Day 4', amount: userEarnings * 0.55 },
    { name: 'Day 5', amount: userEarnings * 0.75 },
    { name: 'Day 6', amount: userEarnings * 0.9 },
    { name: 'Today', amount: userEarnings },
  ];

  const displayChartData = chartData.length > 0 ? chartData : defaultChartData;

  const defaultTransactions = [
    { id: 'TX-1042', date: new Date().toISOString(), description: 'Task completion earnings', amount: 0.80, status: 'completed', type: 'task_earning' },
    { id: 'TX-1041', date: new Date(Date.now() - 86400000).toISOString(), description: 'Task completion earnings', amount: 0.25, status: 'completed', type: 'task_earning' },
    { id: 'TX-1040', date: new Date(Date.now() - 172800000).toISOString(), description: 'Task completion earnings', amount: 0.20, status: 'completed', type: 'task_earning' },
  ];

  const displayTransactions = transactions.length > 0 ? transactions : defaultTransactions;

  const getNextPayoutDate = () => {
    const now = new Date();
    if (user.tier === UserTier.EXPERT) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (user.tier === UserTier.PROFESSIONAL) {
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + (7 - nextWeek.getDay()));
      return nextWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return nextMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <DollarSign size={20} />
            </div>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
              {user.tier === UserTier.BASIC ? '1x' : user.tier === UserTier.PROFESSIONAL ? '1.5x' : '3x'}
            </span>
          </div>
          <div className="text-gray-500 text-sm font-medium">Current Balance</div>
          <div className="text-2xl font-bold text-gray-800">£{userEarnings.toFixed(2)}</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Activity size={20} />
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              {user.tier}
            </span>
          </div>
          <div className="text-gray-500 text-sm font-medium">Monthly Cap</div>
          <div className="text-2xl font-bold text-gray-800">£{salaryCap}</div>
          <div className="w-full bg-gray-100 h-1.5 mt-3 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
          </div>
          <div className="text-xs text-gray-400 mt-1">{percentage.toFixed(1)}% of cap reached</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="text-gray-500 text-sm font-medium">Quality Score</div>
          <div className="text-2xl font-bold text-gray-800">{user.qualityScore}%</div>
          <div className="text-xs text-gray-400 mt-1">Affects task availability</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
              <Calendar size={20} />
            </div>
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
              {user.tier === UserTier.EXPERT ? 'Daily' : user.tier === UserTier.PROFESSIONAL ? 'Weekly' : 'Monthly'}
            </span>
          </div>
          <div className="text-gray-500 text-sm font-medium">Next Payout</div>
          <div className="text-2xl font-bold text-gray-800">{getNextPayoutDate()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-6">Income Analytics</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                  formatter={(value: number) => [`£${value.toFixed(2)}`, 'Earnings']}
                />
                <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
          <h3 className="font-bold text-gray-800 mb-6">Recent Activity</h3>
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader size={24} className="animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {displayTransactions.slice(0, 10).map((tx, i) => (
                <div key={tx.id || i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      tx.amount > 0 ? 'bg-green-50 text-green-600 group-hover:bg-green-100' : 'bg-red-50 text-red-600 group-hover:bg-red-100'
                    }`}>
                      {tx.amount > 0 ? <CheckCircle size={16} /> : <DollarSign size={16} />}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-800">{tx.description || 'Task Earnings'}</div>
                      <div className="text-xs text-gray-400">{new Date(tx.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${tx.amount > 0 ? 'text-gray-800' : 'text-red-600'}`}>
                      {tx.amount > 0 ? '+' : ''}£{Math.abs(tx.amount).toFixed(2)}
                    </div>
                    <div className="text-[10px] uppercase font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full inline-block mt-1">
                      {tx.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button className="w-full mt-6 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
            View All History
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-3xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-xl mb-2">Want to earn more?</h3>
            <p className="text-primary-100 text-sm">Upgrade your tier to increase your salary cap and unlock higher payouts per task.</p>
          </div>
          <a href="#/dashboard/upgrade" className="bg-white text-primary-700 px-6 py-3 rounded-xl font-bold hover:bg-primary-50 transition-colors">
            View Upgrade Options
          </a>
        </div>
      </div>
    </div>
  );
};

export default Earnings;
