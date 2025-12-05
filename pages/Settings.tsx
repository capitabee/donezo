import React, { useEffect, useState } from 'react';
import { User, DashboardOutletContext } from '../types';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { User as UserIcon, Mail, Lock, CreditCard, Shield, Save, AlertTriangle, LogOut, RefreshCw, Building2, ExternalLink, Gift, Copy, Check, Users } from 'lucide-react';
import api from '../services/api';

const Settings = () => {
  const { user } = useOutletContext<DashboardOutletContext>();
  const navigate = useNavigate();
  const [mandateStatus, setMandateStatus] = useState({ mandateActive: false, hasPaymentMethod: false });
  const [loadingMandate, setLoadingMandate] = useState(true);
  const [truelayerStatus, setTruelayerStatus] = useState({ connected: false, hasAccount: false });
  const [loadingTruelayer, setLoadingTruelayer] = useState(true);
  const [connectingTruelayer, setConnectingTruelayer] = useState(false);
  const [referralInfo, setReferralInfo] = useState<{ referralCode: string; referralLink: string; walletBalance: number; referralEarnings: number } | null>(null);
  const [referralStats, setReferralStats] = useState<{ totalReferrals: number; totalEarnings: number; referrals: any[] } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const [mandate, truelayer, refInfo, refStats] = await Promise.all([
          api.getMandateStatus(),
          api.getTrueLayerStatus().catch(() => ({ connected: false, hasAccount: false })),
          api.getReferralInfo().catch(() => null),
          api.getReferralStats().catch(() => null)
        ]);
        setMandateStatus(mandate);
        setTruelayerStatus(truelayer);
        setReferralInfo(refInfo);
        setReferralStats(refStats);
      } catch (error) {
        console.error('Failed to fetch statuses:', error);
      } finally {
        setLoadingMandate(false);
        setLoadingTruelayer(false);
      }
    };
    fetchStatuses();
  }, []);

  const copyReferralLink = () => {
    if (referralInfo?.referralLink) {
      navigator.clipboard.writeText(referralInfo.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConnectUKBank = async () => {
    try {
      setConnectingTruelayer(true);
      const { authUrl } = await api.getTrueLayerAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to get TrueLayer auth URL:', error);
      alert('Failed to start bank connection. Please try again.');
      setConnectingTruelayer(false);
    }
  };

  const handleDisconnectUKBank = async () => {
    if (!confirm('Are you sure you want to disconnect your UK bank account?')) return;
    try {
      await api.disconnectTrueLayer();
      setTruelayerStatus({ connected: false, hasAccount: false });
    } catch (error) {
      console.error('Failed to disconnect TrueLayer:', error);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Account Settings</h1>
      <p className="text-gray-500 text-sm mb-8">Manage your profile, payment mandate, and security preferences.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Profile & Security */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Profile Section */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
                <UserIcon size={20} />
              </div>
              <h2 className="text-lg font-bold text-gray-800">Personal Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type="text" defaultValue={user.name} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type="email" defaultValue={user.email} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input type="tel" placeholder="+44 7700 900000" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none" />
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
              <button className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-800 transition-colors">
                <Save size={18} /> Save Changes
              </button>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gray-100 text-gray-600 rounded-lg">
                <Lock size={20} />
              </div>
              <h2 className="text-lg font-bold text-gray-800">Security</h2>
            </div>
            <div className="space-y-4">
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none" />
               </div>
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <input type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none" />
               </div>
            </div>
             <div className="mt-8 flex justify-end">
              <button className="bg-white border border-gray-200 text-gray-800 px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors">
                Update Password
              </button>
            </div>
          </div>

          {/* Referral Program Section */}
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-8 rounded-3xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <Gift size={120} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 backdrop-blur rounded-lg">
                  <Gift size={20} />
                </div>
                <h2 className="text-lg font-bold">Referral Program</h2>
              </div>
              <p className="text-white/80 mb-6">Invite friends and earn £50 for each successful referral. Your friend also gets £50!</p>
              
              {referralInfo ? (
                <>
                  <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-4">
                    <label className="block text-sm text-white/70 mb-2">Your Referral Link</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={referralInfo.referralLink} 
                        readOnly
                        className="flex-1 bg-white/20 border border-white/20 rounded-lg px-4 py-2 text-white text-sm"
                      />
                      <button 
                        onClick={copyReferralLink}
                        className="bg-white text-purple-600 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-white/90 transition-colors"
                      >
                        {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy</>}
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Users size={16} className="text-white/70" />
                        <span className="text-sm text-white/70">Total Referrals</span>
                      </div>
                      <div className="text-2xl font-bold">{referralStats?.totalReferrals || 0}</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Gift size={16} className="text-white/70" />
                        <span className="text-sm text-white/70">Referral Earnings</span>
                      </div>
                      <div className="text-2xl font-bold">£{(referralInfo.referralEarnings || 0).toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-white/70">Wallet Balance</span>
                        <div className="text-xl font-bold">£{(referralInfo.walletBalance || 0).toFixed(2)}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-white/70">Code</span>
                        <div className="text-xl font-bold font-mono">{referralInfo.referralCode}</div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw size={24} className="animate-spin text-white/50" />
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Mandate & Danger Zone */}
        <div className="space-y-8">
          
          {/* Mandate Status */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <Shield size={100} className="text-primary-700" />
            </div>
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <CreditCard size={20} />
              </div>
              <h2 className="text-lg font-bold text-gray-800">Bank Mandate</h2>
            </div>

            {loadingMandate ? (
              <div className="flex items-center justify-center py-8 relative z-10">
                <RefreshCw size={24} className="animate-spin text-gray-400" />
              </div>
            ) : mandateStatus.mandateActive ? (
              <>
                <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6 relative z-10">
                  <div className="flex items-center gap-2 text-green-800 font-bold text-sm mb-1">
                    <Shield size={16} /> Mandate Active
                  </div>
                  <p className="text-xs text-green-700">Your payment method is connected via Stripe.</p>
                </div>

                <div className="space-y-3 relative z-10">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Status</span>
                    <span className="font-medium text-green-600">Verified</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Payment Method</span>
                    <span className="font-medium text-gray-900">Connected</span>
                  </div>
                </div>

                <button 
                  onClick={() => navigate('/mandate')}
                  className="w-full mt-6 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors relative z-10"
                >
                  Update Payment Method
                </button>
              </>
            ) : (
              <>
                <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 mb-6 relative z-10">
                  <div className="flex items-center gap-2 text-yellow-800 font-bold text-sm mb-1">
                    <AlertTriangle size={16} /> Mandate Required
                  </div>
                  <p className="text-xs text-yellow-700">Connect a payment method to receive salary payouts.</p>
                </div>

                <button 
                  onClick={() => navigate('/mandate')}
                  className="w-full py-3 bg-primary-700 text-white rounded-xl text-sm font-bold hover:bg-primary-800 transition-colors relative z-10"
                >
                  Connect Bank Account
                </button>
              </>
            )}
          </div>

          {/* UK Bank Connection via TrueLayer */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <Building2 size={100} className="text-blue-700" />
            </div>
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Building2 size={20} />
              </div>
              <h2 className="text-lg font-bold text-gray-800">UK Bank (Open Banking)</h2>
            </div>

            {loadingTruelayer ? (
              <div className="flex items-center justify-center py-8 relative z-10">
                <RefreshCw size={24} className="animate-spin text-gray-400" />
              </div>
            ) : truelayerStatus.connected ? (
              <>
                <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6 relative z-10">
                  <div className="flex items-center gap-2 text-green-800 font-bold text-sm mb-1">
                    <Shield size={16} /> Bank Connected
                  </div>
                  <p className="text-xs text-green-700">Your UK bank is connected via Open Banking.</p>
                </div>

                <div className="space-y-3 relative z-10">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Provider</span>
                    <span className="font-medium text-gray-900">TrueLayer</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Status</span>
                    <span className="font-medium text-green-600">Active</span>
                  </div>
                </div>

                <button 
                  onClick={handleDisconnectUKBank}
                  className="w-full mt-6 py-3 bg-white border border-red-200 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors relative z-10"
                >
                  Disconnect Bank
                </button>
              </>
            ) : (
              <>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 relative z-10">
                  <div className="flex items-center gap-2 text-blue-800 font-bold text-sm mb-1">
                    <Building2 size={16} /> Open Banking
                  </div>
                  <p className="text-xs text-blue-700">Connect your UK bank for balance verification. Secure and read-only.</p>
                </div>

                <button 
                  onClick={handleConnectUKBank}
                  disabled={connectingTruelayer}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors relative z-10 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {connectingTruelayer ? (
                    <><RefreshCw size={16} className="animate-spin" /> Connecting...</>
                  ) : (
                    <><ExternalLink size={16} /> Connect UK Bank</>
                  )}
                </button>
              </>
            )}
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 p-8 rounded-3xl border border-red-100">
            <h3 className="text-red-800 font-bold mb-2 flex items-center gap-2">
              <AlertTriangle size={18} /> Danger Zone
            </h3>
            <p className="text-red-600 text-xs mb-6">
              Deleting your account will remove all earnings history and deactivate your mandate.
            </p>
            <button className="w-full py-3 bg-red-100 text-red-700 rounded-xl text-sm font-bold hover:bg-red-200 transition-colors">
              Delete Account
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;