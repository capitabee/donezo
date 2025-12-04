import React, { useState } from 'react';
import { Check, Star, Zap, Crown, Clock, Loader } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { DashboardOutletContext, UserTier } from '../types';
import api from '../services/api';

const Upgrade = () => {
  const { user } = useOutletContext<DashboardOutletContext>();
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (tier: 'Professional' | 'Expert') => {
    setLoading(tier);
    try {
      const result = await api.upgrade(tier);
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        alert('Failed to create checkout session. Please try again.');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Unable to process upgrade. Please contact support.');
    } finally {
      setLoading(null);
    }
  };

  const tiers = [
    {
      name: "Basic",
      tier: UserTier.BASIC,
      price: "Free",
      limit: "£650",
      icon: <Star size={24} className="text-gray-400" />,
      features: ["15 Tasks Daily", "Standard Support", "Monthly Payout", "Basic Quality Score"],
      current: user.tier === UserTier.BASIC,
      color: "bg-white border-gray-200 text-gray-800",
      btn: user.tier === UserTier.BASIC ? "Current Plan" : "Downgrade Not Available"
    },
    {
      name: "Professional",
      tier: UserTier.PROFESSIONAL,
      price: "£250",
      limit: "£1,500",
      icon: <Zap size={24} className="text-white" />,
      features: ["15 Tasks Daily", "Priority Support", "Weekly Payout", "1.5x Earnings Multiplier", "Higher Task Payouts"],
      current: user.tier === UserTier.PROFESSIONAL,
      color: user.tier === UserTier.PROFESSIONAL 
        ? "bg-primary-700 text-white border-primary-700 transform scale-105 shadow-xl ring-4 ring-primary-200" 
        : "bg-primary-700 text-white border-primary-700 transform scale-105 shadow-xl",
      btn: user.tier === UserTier.PROFESSIONAL ? "Current Plan" : user.tier === UserTier.EXPERT ? "Already Expert" : "Upgrade Now"
    },
    {
      name: "Expert",
      tier: UserTier.EXPERT,
      price: "£600",
      limit: "£3,000",
      icon: <Crown size={24} className="text-yellow-500" />,
      features: ["15 Tasks Daily", "Dedicated Support Agent", "Daily Payout", "3x Earnings Multiplier", "Premium Task Access", "API Access"],
      current: user.tier === UserTier.EXPERT,
      color: user.tier === UserTier.EXPERT 
        ? "bg-gray-900 text-white border-gray-900 ring-4 ring-gray-300" 
        : "bg-gray-900 text-white border-gray-900",
      btn: user.tier === UserTier.EXPERT ? "Current Plan" : "Go Expert"
    }
  ];

  const canUpgrade = (tier: UserTier) => {
    if (user.tier === UserTier.BASIC && (tier === UserTier.PROFESSIONAL || tier === UserTier.EXPERT)) return true;
    if (user.tier === UserTier.PROFESSIONAL && tier === UserTier.EXPERT) return true;
    return false;
  };

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Upgrade Your Earning Potential</h1>
        <p className="text-gray-500">Choose a plan that fits your ambition. One-time payment, lifetime access.</p>
      </div>

      <div className="max-w-4xl mx-auto bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 flex items-center justify-center gap-3 mb-8 text-green-700 font-medium">
        <Check size={20} />
        <span>Your current tier: <strong>{user.tier}</strong> - Salary cap: <strong>£{user.tier === UserTier.BASIC ? '650' : user.tier === UserTier.PROFESSIONAL ? '1,500' : '3,000'}</strong>/month</span>
      </div>

      <div className="max-w-4xl mx-auto bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center justify-center gap-3 mb-12 text-red-700 font-medium animate-pulse">
        <Clock size={20} />
        <span>Limited time offer! Upgrade now and earn back your investment within the first month.</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
        {tiers.map((tier, idx) => (
          <div key={idx} className={`rounded-3xl p-8 border relative ${tier.color} flex flex-col h-[520px]`}>
            {tier.name === 'Professional' && user.tier === UserTier.BASIC && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                Most Popular
              </div>
            )}
            {tier.current && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                Your Plan
              </div>
            )}
            
            <div className="mb-6">
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${tier.name === 'Professional' || tier.name === 'Expert' ? 'bg-white/20' : 'bg-gray-100'}`}>
                 {tier.icon}
               </div>
               <h3 className="text-xl font-bold mb-1">{tier.name}</h3>
               <div className="text-sm opacity-70">Salary Cap: {tier.limit}/month</div>
            </div>

            <div className="text-4xl font-bold mb-8">{tier.price}<span className="text-sm opacity-50 font-normal"> / lifetime</span></div>

            <div className="space-y-4 flex-1">
              {tier.features.map((feat, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className={`p-1 rounded-full ${tier.name === 'Professional' || tier.name === 'Expert' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    <Check size={10} />
                  </div>
                  {feat}
                </div>
              ))}
            </div>

            <button 
              onClick={() => canUpgrade(tier.tier) ? handleUpgrade(tier.name as 'Professional' | 'Expert') : null}
              disabled={tier.current || !canUpgrade(tier.tier) || loading !== null}
              className={`w-full py-4 rounded-xl font-bold mt-8 transition-colors flex items-center justify-center gap-2 ${
                tier.current 
                  ? 'bg-green-100 text-green-600 cursor-default' 
                  : !canUpgrade(tier.tier)
                    ? 'bg-gray-100 text-gray-400 cursor-default'
                    : 'bg-white text-gray-900 hover:bg-gray-100 shadow-lg'
              }`}
            >
              {loading === tier.name ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Processing...
                </>
              ) : tier.current ? (
                <>
                  <Check size={18} />
                  {tier.btn}
                </>
              ) : (
                tier.btn
              )}
            </button>
          </div>
        ))}
      </div>
      
      <div className="mt-12 text-center text-sm text-gray-500 max-w-2xl mx-auto bg-blue-50 p-4 rounded-xl border border-blue-100">
        <p className="font-semibold text-blue-800 mb-1">Secure Payment via Stripe</p>
        Payment is processed securely through Stripe. Your upgrade is instant and you'll have immediate access to all new features.
      </div>

      <div className="mt-6 max-w-4xl mx-auto grid grid-cols-3 gap-6 text-center">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="text-2xl font-bold text-primary-600">2.3x</div>
          <div className="text-sm text-gray-500">Average ROI in first month</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="text-2xl font-bold text-primary-600">24hrs</div>
          <div className="text-sm text-gray-500">To earn back upgrade cost</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="text-2xl font-bold text-primary-600">98%</div>
          <div className="text-sm text-gray-500">User satisfaction rate</div>
        </div>
      </div>
    </div>
  );
};

export default Upgrade;
