import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Users, Video, Phone, MoreVertical, Smile } from 'lucide-react';
import api from '../services/api';

interface Agent {
  id: string;
  name: string;
  tier: number;
  avatar: string;
  personality?: string;
  slang?: string[];
}

interface Message {
  id: string;
  senderType: 'user' | 'agent';
  senderName: string;
  senderId: string;
  content: string;
  timestamp: string;
}

interface MeetingRoomProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
}

const nameColors = [
  'text-purple-400', 'text-pink-400', 'text-green-400', 'text-blue-400',
  'text-yellow-400', 'text-cyan-400', 'text-orange-400', 'text-indigo-400',
  'text-rose-400', 'text-teal-400', 'text-lime-400', 'text-violet-400'
];

const getAgentColor = (agentId: string): string => {
  const num = parseInt(agentId.replace('agent_', '')) || 1;
  return nameColors[(num - 1) % nameColors.length];
};

const getAgentAvatar = (agents: Agent[], senderId: string): string => {
  const agent = agents.find(a => a.id === senderId);
  return agent?.avatar || '👤';
};

const getAgentTier = (agents: Agent[], senderId: string): number => {
  const agent = agents.find(a => a.id === senderId);
  return agent?.tier || 1;
};

const getTierBadge = (tier: number) => {
  if (tier === 3) return { text: 'T3', bg: 'bg-purple-500', title: 'Tier 3 - Premium' };
  if (tier === 2) return { text: 'T2', bg: 'bg-blue-500', title: 'Tier 2 - Weekly' };
  return { text: 'T1', bg: 'bg-gray-500', title: 'Tier 1 - Free' };
};

const MeetingRoom: React.FC<MeetingRoomProps> = ({ isOpen, onClose, userName }) => {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoMessageIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      joinMeeting();
    } else {
      if (autoMessageIntervalRef.current) {
        clearInterval(autoMessageIntervalRef.current);
        autoMessageIntervalRef.current = null;
      }
    }

    return () => {
      if (autoMessageIntervalRef.current) {
        clearInterval(autoMessageIntervalRef.current);
      }
    };
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (roomId && isOpen) {
      const startAutoMessages = () => {
        if (autoMessageIntervalRef.current) {
          clearInterval(autoMessageIntervalRef.current);
        }
        
        const randomInterval = () => 8000 + Math.random() * 12000;
        
        const scheduleNext = () => {
          autoMessageIntervalRef.current = setTimeout(async () => {
            try {
              const response = await api.getMeetingAutoMessage(roomId);
              if (response.message) {
                setMessages(prev => [...prev, response.message]);
              }
            } catch (error) {
              console.error('Auto message error:', error);
            }
            scheduleNext();
          }, randomInterval());
        };
        
        scheduleNext();
      };
      
      const initialDelay = setTimeout(() => {
        startAutoMessages();
      }, 5000);
      
      return () => {
        clearTimeout(initialDelay);
        if (autoMessageIntervalRef.current) {
          clearInterval(autoMessageIntervalRef.current);
        }
      };
    }
  }, [roomId, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const joinMeeting = async () => {
    setLoading(true);
    try {
      const response = await api.joinMeeting();
      setRoomId(response.roomId);
      setAgents(response.agents);
      setMessages(response.messages);
    } catch (error) {
      console.error('Failed to join meeting:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !roomId) return;
    
    const messageContent = inputMessage;
    setInputMessage('');
    
    // Immediately show user's message on screen
    const userMessage: Message = {
      id: `temp_${Date.now()}`,
      senderType: 'user',
      senderName: userName,
      senderId: 'user',
      content: messageContent,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Then get AI replies in background (they come after delay from server)
    try {
      const response = await api.sendMeetingMessage(roomId, messageContent);
      // Replace temp message with real one and add agent responses
      setMessages(prev => {
        const withoutTemp = prev.filter(m => m.id !== userMessage.id);
        return [...withoutTemp, response.userMessage, ...response.agentResponses];
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl h-[85vh] bg-[#0b141a] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header - WhatsApp Style */}
        <div className="bg-[#202c33] px-4 py-3 flex items-center gap-3">
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          
          <div className="flex -space-x-2">
            {agents.slice(0, 4).map((agent, i) => (
              <div key={agent.id} className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-sm border-2 border-[#202c33]">
                {agent.avatar || '👤'}
              </div>
            ))}
            {agents.length > 4 && (
              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-xs text-white border-2 border-[#202c33]">
                +{agents.length - 4}
              </div>
            )}
          </div>
          
          <div className="flex-1 ml-2">
            <h3 className="text-white font-semibold text-sm">Team Meeting Room</h3>
            <p className="text-gray-400 text-xs flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              {agents.length + 1} participants online
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowParticipants(!showParticipants)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Users size={20} />
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              <Video size={20} />
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              <Phone size={20} />
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Participants Panel */}
        {showParticipants && (
          <div className="bg-[#111b21] border-b border-gray-700 px-4 py-3 max-h-48 overflow-y-auto">
            <p className="text-gray-400 text-xs uppercase font-semibold mb-2">Platform Users ({agents.length + 1} online)</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs">👤</span>
                <span className="text-white">{userName} (You)</span>
              </div>
              {agents.map(agent => {
                const badge = getTierBadge(agent.tier);
                return (
                  <div key={agent.id} className="flex items-center gap-2 text-sm">
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-xs">
                      {agent.avatar}
                    </span>
                    <span className="text-gray-300 truncate">{agent.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${badge.bg} text-white font-bold`} title={badge.title}>
                      {badge.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div 
          className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 800 800'%3E%3Cg fill='none' stroke='%23111b21' stroke-width='1'%3E%3Cpath d='M769 229L1037 260.9M927 880L731 737 702 818M735 624L606 625 602 658'/%3E%3Cpath d='M615 477L602 514 583 530'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundColor: '#0b141a'
          }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-400 text-center">
                <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p>Joining meeting room...</p>
              </div>
            </div>
          ) : (
            <>
              {/* System Message */}
              <div className="flex justify-center">
                <div className="bg-[#182229] text-gray-400 text-xs px-3 py-1 rounded-lg">
                  Welcome to Donezo Users Group Chat
                </div>
              </div>

              {messages.map((message, index) => {
                const tier = getAgentTier(agents, message.senderId);
                const badge = getTierBadge(tier);
                
                return (
                  <div
                    key={message.id || index}
                    className={`flex ${message.senderType === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-lg px-3 py-2 shadow-sm ${
                        message.senderType === 'user'
                          ? 'bg-[#005c4b] text-white rounded-tr-none'
                          : 'bg-[#202c33] text-white rounded-tl-none'
                      }`}
                    >
                      {message.senderType === 'agent' && (
                        <div className={`text-xs font-semibold mb-1 flex items-center gap-1.5 ${getAgentColor(message.senderId)}`}>
                          {getAgentAvatar(agents, message.senderId)} {message.senderName}
                          <span className={`text-[8px] px-1 py-0.5 rounded ${badge.bg} text-white`}>
                            {badge.text}
                          </span>
                        </div>
                      )}
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <div className="text-right mt-1">
                        <span className="text-[10px] text-gray-400">{formatTime(message.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area - WhatsApp Style */}
        <div className="bg-[#202c33] px-4 py-3 flex items-center gap-3">
          <button className="text-gray-400 hover:text-white transition-colors">
            <Smile size={24} />
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={loading}
              className="w-full bg-[#2a3942] text-white rounded-lg px-4 py-2.5 text-sm placeholder-gray-400 focus:outline-none disabled:opacity-50"
            />
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || loading}
            className="w-10 h-10 bg-[#00a884] rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#00bf97] transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;
