import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, Shield, Globe, X, Clock, Zap, Crown } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const [showTiersModal, setShowTiersModal] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const resetTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!buttonRef.current) return;
    
    const button = buttonRef.current.getBoundingClientRect();
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    // Calculate button center
    const buttonCenterX = button.left + button.width / 2;
    const buttonCenterY = button.top + button.height / 2;
    
    const distanceX = mouseX - buttonCenterX;
    const distanceY = mouseY - buttonCenterY;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    
    // If mouse is within 120px of the button, make it dodge
    if (distance < 120) {
      // Calculate dodge direction (away from mouse)
      const angle = Math.atan2(distanceY, distanceX);
      const dodgeDistance = 120;
      
      // Calculate new offset from dodge
      let newX = buttonPosition.x - Math.cos(angle) * dodgeDistance;
      let newY = buttonPosition.y - Math.sin(angle) * dodgeDistance;
      
      // Get the delta change
      const deltaX = newX - buttonPosition.x;
      const deltaY = newY - buttonPosition.y;
      
      // Calculate where button will be after this move
      const futureLeft = button.left + deltaX;
      const futureTop = button.top + deltaY;
      const futureRight = button.right + deltaX;
      const futureBottom = button.bottom + deltaY;
      
      // Define safe margins
      const margin = 40;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Clamp to viewport bounds
      if (futureLeft < margin) {
        newX = buttonPosition.x + (margin - button.left);
      } else if (futureRight > viewportWidth - margin) {
        newX = buttonPosition.x + (viewportWidth - margin - button.right);
      }
      
      if (futureTop < margin) {
        newY = buttonPosition.y + (margin - button.top);
      } else if (futureBottom > viewportHeight - margin) {
        newY = buttonPosition.y + (viewportHeight - margin - button.bottom);
      }
      
      setButtonPosition({ x: newX, y: newY });
      
      // Clear existing reset timer
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
      
      // Reset position after 7 seconds
      resetTimerRef.current = setTimeout(() => {
        setButtonPosition({ x: 0, y: 0 });
      }, 7000);
    }
  };

  return (
    <div className="min-h-screen bg-white" onMouseMove={handleMouseMove}>
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
          <button 
            ref={buttonRef}
            onClick={() => navigate('/signup')} 
            className="bg-primary-700 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-primary-800 transition-colors"
            style={{
              transform: `translate(${buttonPosition.x}px, ${buttonPosition.y}px)`,
              transition: buttonPosition.x !== 0 || buttonPosition.y !== 0 ? 'transform 0.4s ease-out' : 'none'
            }}
          >
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
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3 flex items-center justify-between rounded-t-xl">
              <div>
                <h2 className="text-lg font-bold text-white">Salary Tiers</h2>
                <p className="text-primary-100 text-xs">Three earning levels</p>
              </div>
              <button 
                onClick={() => setShowTiersModal(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* Basic Tier */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <Clock size={14} className="text-gray-700" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Basic (T1)</h3>
                      <p className="text-lg font-bold text-gray-900">£650<span className="text-xs font-normal text-gray-500">/mo</span></p>
                    </div>
                  </div>
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold">FREE</span>
                </div>
                <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                  Start earning with no cost. Monthly withdrawals.
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                  <CheckCircle size={12} className="text-green-600 flex-shrink-0" />
                  <span>Monthly • Standard tasks</span>
                </div>
              </div>

              {/* Professional Tier */}
              <div className="bg-blue-50 rounded-lg p-3 border-2 border-blue-300 relative">
                <div className="absolute -top-2 right-3 bg-blue-600 text-white px-2 py-0.5 rounded-full text-[9px] font-bold">
                  POPULAR
                </div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <Zap size={14} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Professional (T2)</h3>
                      <p className="text-lg font-bold text-gray-900">£1,500<span className="text-xs font-normal text-gray-600">/mo</span></p>
                    </div>
                  </div>
                  <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">£250</span>
                </div>
                <p className="text-xs text-gray-700 mb-2 leading-relaxed">
                  Pay £250 once for higher earnings & weekly Friday withdrawals.
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
                  <CheckCircle size={12} className="text-green-600 flex-shrink-0" />
                  <span>Weekly • Higher rates</span>
                </div>
              </div>

              {/* Expert Tier */}
              <div className="bg-purple-50 rounded-lg p-3 border-2 border-purple-300">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                      <Crown size={14} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Expert (T3)</h3>
                      <p className="text-lg font-bold text-gray-900">£3,000<span className="text-xs font-normal text-gray-600">/mo</span></p>
                    </div>
                  </div>
                  <span className="bg-purple-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">£600</span>
                </div>
                <p className="text-xs text-gray-700 mb-2 leading-relaxed">
                  Pay £600 once for instant withdrawals (2-3 min) & max rates.
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
                  <CheckCircle size={12} className="text-green-600 flex-shrink-0" />
                  <span>Instant • Max rates</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 rounded-b-xl">
              <div className="flex items-start gap-2 mb-3">
                <div className="text-lg">💡</div>
                <div>
                  <p className="text-xs text-gray-700 font-semibold mb-0.5">Start Free, Upgrade Anytime</p>
                  <p className="text-[10px] text-gray-600 leading-relaxed">
                    Everyone starts at Basic (free). Upgrade fees are one-time payments.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowTiersModal(false);
                  navigate('/signup');
                }}
                className="w-full bg-primary-700 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-800 transition-colors"
              >
                Start Onboarding (Free)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;