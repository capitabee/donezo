import React, { useState } from 'react';
import { User, DashboardOutletContext } from '../types';
import { useOutletContext } from 'react-router-dom';
import { MessageCircle, Mail, HelpCircle, ChevronDown, ChevronUp, Send } from 'lucide-react';

const Support = () => {
  const { user } = useOutletContext<DashboardOutletContext>(); // Use Outlet context
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "How often are earnings paid out?",
      a: "Earnings are processed according to your tier plan. Basic users are paid monthly, Professional weekly, and Experts daily."
    },
    {
      q: "How do I upgrade my salary tier?",
      a: "You can upgrade from the 'Upgrade Plan' tab in your dashboard. Note that upgrades are only available within the first 7 days of account creation."
    },
    {
      q: "Is the bank mandate safe?",
      a: "Yes. We use Stripe and GoCardless, which are industry-standard payment processors. The mandate is primarily for verification and salary processing."
    },
    {
      q: "My task was rejected. Why?",
      a: "Tasks are reviewed by AI and human moderators. Common reasons for rejection include low quality, grammatical errors, or failure to follow specific instructions."
    }
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">How can we help?</h1>
        <p className="text-gray-500">Choose a channel below or browse our frequently asked questions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="bg-green-50 p-8 rounded-3xl border border-green-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
          <div className="w-16 h-16 bg-white text-green-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
            <MessageCircle size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">WhatsApp Support</h3>
          <p className="text-gray-600 text-sm mb-6">Chat directly with our support agents for instant help.</p>
          <button className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center gap-2">
            Start Chat <Send size={16} />
          </button>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-200 flex flex-col items-center text-center hover:shadow-md transition-shadow">
          <div className="w-16 h-16 bg-gray-50 text-gray-600 rounded-full flex items-center justify-center mb-4">
            <Mail size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Email Support</h3>
          <p className="text-gray-500 text-sm mb-6">Send us a ticket and we'll respond within 24 hours.</p>
          <button className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors">
            Contact Support
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 p-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <HelpCircle size={24} className="text-primary-500" /> Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-gray-100 rounded-2xl overflow-hidden">
              <button 
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full flex items-center justify-between p-5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
              >
                <span className="font-semibold text-gray-800">{faq.q}</span>
                {openFaq === index ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
              </button>
              {openFaq === index && (
                <div className="p-5 text-gray-600 text-sm leading-relaxed border-t border-gray-100 bg-white">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Support;