import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Paperclip, Mic, MoreVertical, Phone, Video, Check, CheckCheck } from 'lucide-react';
import { User } from '../types';

interface ChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

const ChatOverlay = ({ isOpen, onClose, user }: ChatOverlayProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hi ${user.name.split(' ')[0]}! I'm Sarah, your dedicated Team Leader. Welcome to the team! 👋`,
      sender: 'agent',
      timestamp: '09:41 AM',
      status: 'read'
    },
    {
      id: '2',
      text: 'If you have any questions about tasks or payments, feel free to ask me here.',
      sender: 'agent',
      timestamp: '09:41 AM',
      status: 'read'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    // Simulate Agent Typing & Response
    setTimeout(() => setIsTyping(true), 1000);
    setTimeout(() => {
      setIsTyping(false);
      const responses = [
        "That's a great question! Let me check that for you.",
        "Sure thing. Your payment mandate is active, so you're all set.",
        "Have you checked the instructions in the task description?",
        "I'll escalate this to the tech team immediately.",
        "Keep up the good work! Your quality score is looking great."
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: randomResponse,
        sender: 'agent',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'read'
      };
      setMessages(prev => [...prev, agentMessage]);
    }, 3500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed bottom-6 right-6 w-[380px] h-[600px] bg-white rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-100 transition-all duration-300 transform ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
      
      {/* Header */}
      <div className="bg-primary-700 p-4 flex items-center justify-between text-white shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center overflow-hidden">
               <img src="https://picsum.photos/200/200?random=50" alt="Agent" className="w-full h-full object-cover" />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-primary-700 rounded-full"></div>
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight">Sarah Jenkins</h3>
            <p className="text-[10px] text-primary-100 opacity-90">Team Leader • Online</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-white/80 hover:text-white transition-colors"><Video size={18} /></button>
          <button className="text-white/80 hover:text-white transition-colors"><Phone size={18} /></button>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors"><X size={20} /></button>
        </div>
      </div>

      {/* Messages Body */}
      <div className="flex-1 chat-bg overflow-y-auto p-4 space-y-4 no-scrollbar">
        
        {/* Date Separator */}
        <div className="flex justify-center my-4">
          <span className="bg-gray-200 text-gray-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">Today</span>
        </div>

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`
                max-w-[80%] px-4 py-2 rounded-2xl relative shadow-sm text-sm leading-relaxed
                ${msg.sender === 'user' 
                  ? 'bg-primary-600 text-white rounded-tr-sm' 
                  : 'bg-white text-gray-800 rounded-tl-sm border border-gray-100'}
              `}
            >
              {msg.text}
              <div className={`text-[9px] mt-1 flex items-center justify-end gap-1 ${msg.sender === 'user' ? 'text-primary-100' : 'text-gray-400'}`}>
                {msg.timestamp}
                {msg.sender === 'user' && <CheckCheck size={12} />}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce-slow" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce-slow" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce-slow" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white p-3 border-t border-gray-100 flex items-center gap-2">
        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
          <Paperclip size={20} />
        </button>
        <div className="flex-1 relative">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..." 
            className="w-full bg-gray-100 text-gray-800 text-sm px-4 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-100 focus:bg-white transition-all"
          />
        </div>
        {inputText.trim() ? (
          <button 
            onClick={handleSend}
            className="p-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/30 transform hover:scale-105 active:scale-95"
          >
            <Send size={18} fill="currentColor" />
          </button>
        ) : (
          <button className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <Mic size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatOverlay;