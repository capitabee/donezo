import React from 'react';
import { Check, Star, Zap, Crown, Clock } from 'lucide-react';

const Upgrade = () => {
  const tiers = [
    {
      name: "Basic",
      price: "Free",
      limit: "£650",
      icon: <Star size={24} className="text-gray-400" />,
      features: ["Basic Tasks", "Standard Support", "Monthly Payout"],
      current: true,
      color: "bg-white border-gray-200 text-gray-800",
      btn: "Current Plan"
    },
    {
      name: "Professional",
      price: "£250",
      limit: "£1,500",
      icon: <Zap size={24} className="text-white" />,
      features: ["Advanced Tasks", "Priority Support", "Weekly Payout", "1.5x Multiplier"],
      current: false,
      color: "bg-primary-700 text-white border-primary-700 transform scale-105 shadow-xl",
      btn: "Upgrade Now"
    },
    {
      name: "Expert",
      price: "£600",
      limit: "£3,000",
      icon: <Crown size={24} className="text-yellow-500" />,
      features: ["All Task Types", "Dedicated Agent", "Daily Payout", "3x Multiplier", "API Access"],
      current: false,
      color: "bg-gray-900 text-white border-gray-900",
      btn: "Go Expert"
    }
  ];

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Upgrade Your Earning Potential</h1>
        <p className="text-gray-500">Choose a plan that fits your ambition. Limited time offer expires soon.</p>
      </div>

      {/* Countdown Banner */}
      <div className="max-w-4xl mx-auto bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center justify-center gap-3 mb-12 text-red-700 font-medium animate-pulse">
        <Clock size={20} />
        <span>Offer ends in 6 days 23 hours. Automatic charging available via Mandate.</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
        {tiers.map((tier, idx) => (
          <div key={idx} className={`rounded-3xl p-8 border relative ${tier.color} flex flex-col h-[500px]`}>
            {tier.name === 'Professional' && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                Most Popular
              </div>
            )}
            
            <div className="mb-6">
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${tier.name === 'Professional' ? 'bg-white/20' : 'bg-gray-100'}`}>
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

            <button className={`w-full py-4 rounded-xl font-bold mt-8 transition-colors ${tier.current ? 'bg-gray-100 text-gray-400 cursor-default' : 'bg-primary-500 hover:bg-primary-600 text-white'}`}>
              {tier.btn}
            </button>
          </div>
        ))}
      </div>
      
      <div className="mt-12 text-center text-sm text-gray-500 max-w-2xl mx-auto bg-blue-50 p-4 rounded-xl border border-blue-100">
        <p className="font-semibold text-blue-800 mb-1">Payment Mandate Active</p>
        Payment will be processed via your connected bank mandate. Funds usually clear within 3-5 business days.
      </div>
    </div>
  );
};

export default Upgrade;