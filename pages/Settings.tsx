import React from 'react';
import { User, DashboardOutletContext } from '../types';
import { useOutletContext } from 'react-router-dom';
import { User as UserIcon, Mail, Lock, CreditCard, Shield, Save, AlertTriangle, LogOut } from 'lucide-react';

const Settings = () => {
  const { user } = useOutletContext<DashboardOutletContext>(); // Use Outlet context

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

            <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6 relative z-10">
              <div className="flex items-center gap-2 text-green-800 font-bold text-sm mb-1">
                <Shield size={16} /> Mandate Active
              </div>
              <p className="text-xs text-green-700">Your bank is successfully connected via Stripe Direct Debit.</p>
            </div>

            <div className="space-y-3 relative z-10">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Bank</span>
                <span className="font-medium text-gray-900">Chase Bank</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Account</span>
                <span className="font-medium text-gray-900">**** 8829</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span className="font-medium text-green-600">Verified</span>
              </div>
            </div>

            <button className="w-full mt-6 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors relative z-10">
              Update Payment Method
            </button>
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