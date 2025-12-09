import React from 'react';
import { Wrench, Clock, Mail, Shield } from 'lucide-react';

const Maintenance = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="relative z-10 max-w-2xl w-full">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                <Wrench className="w-12 h-12 text-white animate-bounce" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-ping">
                <div className="w-4 h-4 bg-blue-400 rounded-full"></div>
              </div>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-center text-white mb-4">
            Under Maintenance
          </h1>
          
          <p className="text-xl text-center text-gray-300 mb-8">
            We're making Donezo even better for you!
          </p>

          <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/10">
            <p className="text-gray-300 text-center leading-relaxed">
              Our team is currently performing scheduled maintenance to improve 
              your experience. We'll be back online shortly with new features 
              and enhanced performance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
              <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-white font-semibold">Quick Return</div>
              <div className="text-gray-400 text-sm">Usually under 1 hour</div>
            </div>
            
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
              <Shield className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-white font-semibold">Data Safe</div>
              <div className="text-gray-400 text-sm">Your earnings are secure</div>
            </div>
            
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
              <Mail className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <div className="text-white font-semibold">Stay Updated</div>
              <div className="text-gray-400 text-sm">Check back soon</div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-gray-400">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
            <span className="ml-2">Working on it</span>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-gray-500 text-sm">
              Thank you for your patience. We appreciate your understanding.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <span className="text-white font-bold">Donezo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
