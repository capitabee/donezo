import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, Shield, Globe } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

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
            <button className="bg-white text-gray-800 border border-gray-200 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-50 transition-colors">
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
    </div>
  );
};

export default Landing;