import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, Shield, Globe, X, Clock, Zap, Crown } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const [showTiersModal, setShowTiersModal] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-700 rounded-lg flex items-center justify-center text-white font-bold">D</div>
          <span className="text-xl font-bold text-gray-800">Donezo</span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-medium text-gray-600">
          <a href="#" className="hover:text-primary-700">How it Works</a>
          <a href="#" className="hover:text-primary-700">Pricing</a>
          <a href="#" className="hover:text-primary-700">Success Stories</a>
        </div>
        <div className="flex gap-4">
          <button onClick={() => navigate('/admin')} className="text-sm font-medium text-gray-500 hover:text-gray-800">Admin</button>
          <button onClick={() => navigate('/signup')} className="bg-primary-700 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-primary-800 transition-colors">
            Onboard
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-8 py-20 md:py-32 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-block bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-bold mb-6">
            New: High-Paying AI Tasks Available
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Turn Data into <span className="text-primary-600">Salary.</span>
          </h1>
          <p className="text-xl text-gray-500 mb-8 leading-relaxed">
            Join thousands of remote workers helping scale top AI companies. Simple tasks, guaranteed monthly payouts, and career growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={() => navigate('/signup')} className="bg-primary-700 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-primary-800 transition-all shadow-lg shadow-primary-700/30 flex items-center justify-center gap-2">
              Onboarding <ArrowRight size={20} />
            </button>
            <button onClick={() => setShowTiersModal(true)} className="bg-white text-gray-800 border border-gray-200 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-50 transition-colors">
              View Salary Tiers
            </button>
          </div>
          <div className="mt-8 flex items-center gap-4 text-sm text-gray-500">
             <div className="flex -space-x-2">
               {[1,2,3,4].map(i => (
                 <img key={i} src={`https://picsum.photos/30/30?random=${i}`} className="w-8 h-8 rounded-full border-2 border-white" alt="User" />
               ))}
             </div>
             <p>Trusted by 12,000+ workers</p>
          </div>
        </div>
        <div className="relative">
          <div className="bg-gray-100 rounded-[3rem] p-8 relative z-10">
             <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" alt="Dashboard Preview" className="rounded-3xl shadow-2xl border-4 border-white" />
          </div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary-500 blur-[100px] opacity-20 -z-0"></div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why work with Donezo?</h2>
            <p className="text-gray-500">We provide a secure, consistent platform for you to earn a reliable secondary income.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Guaranteed Payouts", desc: "Connect your bank via Stripe Mandate for secure, automatic salary processing.", icon: <Shield size={32} className="text-primary-600" /> },
              { title: "Global Access", desc: "Work from anywhere in the world. All you need is a laptop and internet.", icon: <Globe size={32} className="text-blue-600" /> },
              { title: "Verified Tasks", desc: "We partner directly with Scale AI companies to provide steady work streams.", icon: <CheckCircle size={32} className="text-green-600" /> }
            ].map((f, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">{f.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Salary Tiers Modal */}
      {showTiersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-6 flex items-center justify-between rounded-t-3xl">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Salary Tiers & Plans</h2>
                <p className="text-gray-500 mt-1">Choose the plan that fits your earning goals</p>
              </div>
              <button 
                onClick={() => setShowTiersModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={28} />
              </button>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Basic Tier */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-200 hover:border-gray-300 transition-all">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <Clock size={20} className="text-gray-700" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Basic (T1)</h3>
                    <span className="text-sm text-gray-600">Starter Plan</span>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="text-4xl font-bold text-gray-900">£650</div>
                  <div className="text-gray-500 text-sm">per month cap</div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-2">
                    <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Free to join</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Monthly withdrawals</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Access to basic tasks</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Standard payout rates</span>
                  </div>
                </div>

                <button 
                  onClick={() => navigate('/signup')}
                  className="w-full bg-gray-700 text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
                >
                  Start Free
                </button>
              </div>

              {/* Professional Tier */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-300 hover:border-blue-400 transition-all relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold">
                  POPULAR
                </div>
                
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <Zap size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Professional (T2)</h3>
                    <span className="text-sm text-blue-700">Growth Plan</span>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="text-4xl font-bold text-gray-900">£1,500</div>
                  <div className="text-gray-600 text-sm">per month cap</div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-2">
                    <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700"><strong>£250 upgrade fee</strong></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Weekly withdrawals (Fridays)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Higher payout rates</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Priority task access</span>
                  </div>
                </div>

                <button 
                  onClick={() => navigate('/signup')}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  Upgrade to Pro
                </button>
              </div>

              {/* Expert Tier */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border-2 border-purple-300 hover:border-purple-400 transition-all">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                    <Crown size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Expert (T3)</h3>
                    <span className="text-sm text-purple-700">Premium Plan</span>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="text-4xl font-bold text-gray-900">£3,000</div>
                  <div className="text-gray-600 text-sm">per month cap</div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-2">
                    <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700"><strong>£600 upgrade fee</strong></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Anytime withdrawals (2-3 mins)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Maximum payout rates</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Exclusive high-value tasks</span>
                  </div>
                </div>

                <button 
                  onClick={() => navigate('/signup')}
                  className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
                >
                  Upgrade to Expert
                </button>
              </div>
            </div>

            <div className="bg-gray-50 px-8 py-6 border-t border-gray-200 rounded-b-3xl">
              <p className="text-center text-gray-600 text-sm">
                💡 <strong>Pro Tip:</strong> Start with Basic and upgrade anytime as you earn more. All tiers include full platform access and support.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;