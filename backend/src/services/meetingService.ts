import OpenAI from 'openai';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Agent {
  id: string;
  name: string;
  tier: 1 | 2 | 3;
  avatar: string;
}

interface AIMemory {
  name: string;
  tier: number;
  personality_profile: string;
  typing_style: string;
  mood_patterns: string[];
  past_withdrawals: { amount: number; date: string }[];
  past_task_logs: { count: number; date: string }[];
  previous_conversations: { content: string; timestamp: string }[];
  memory_log: string[];
  last_active: Date;
}

export const agents: Agent[] = [
  { id: 'agent_1', name: 'Marcus', tier: 3, avatar: '👨🏾' },
  { id: 'agent_2', name: 'Sophie', tier: 2, avatar: '👩🏼' },
  { id: 'agent_3', name: 'Jay', tier: 1, avatar: '🧑🏻' },
  { id: 'agent_4', name: 'Priya', tier: 3, avatar: '👩🏽' },
  { id: 'agent_5', name: 'Danny', tier: 2, avatar: '👨🏼' },
  { id: 'agent_6', name: 'Tasha', tier: 1, avatar: '👩🏿' },
  { id: 'agent_7', name: 'Kieran', tier: 3, avatar: '👨🏻' },
  { id: 'agent_8', name: 'Aisha', tier: 2, avatar: '🧕' },
  { id: 'agent_9', name: 'Connor', tier: 1, avatar: '👦🏼' },
  { id: 'agent_10', name: 'Zara', tier: 3, avatar: '👩🏻' }
];

async function fetchAIMemory(name: string): Promise<AIMemory | null> {
  const result = await pool.query(
    'SELECT * FROM ai_user_memory WHERE name = $1',
    [name]
  );
  return result.rows[0] || null;
}

async function updateAIMemory(name: string, newMessage: string): Promise<void> {
  const memory = await fetchAIMemory(name);
  if (!memory) return;

  const conversations = memory.previous_conversations || [];
  conversations.push({ content: newMessage, timestamp: new Date().toISOString() });
  if (conversations.length > 20) conversations.shift();

  await pool.query(
    `UPDATE ai_user_memory 
     SET previous_conversations = $1, last_active = NOW() 
     WHERE name = $2`,
    [JSON.stringify(conversations), name]
  );
}

async function appendToMemoryLog(name: string, detail: string): Promise<void> {
  await pool.query(
    `UPDATE ai_user_memory 
     SET memory_log = memory_log || $1::jsonb, last_active = NOW() 
     WHERE name = $2`,
    [JSON.stringify([detail]), name]
  );
}

function buildPromptFromMemory(memory: AIMemory, currentMood: string): string {
  const tierInfo = memory.tier === 1 
    ? `Tier 1 (free) - monthly payouts only on the 30th. You're waiting for payday.`
    : memory.tier === 2
    ? `Tier 2 (£250 plan) - weekly payouts every Friday. Love those weekly payments.`
    : `Tier 3 (£600 premium) - withdraw ANYTIME up to £3000/month. Pull cash whenever you need.`;

  const recentWithdrawals = memory.past_withdrawals?.slice(-3).map(w => `£${w.amount} on ${w.date}`).join(', ') || 'none recently';
  const recentTasks = memory.past_task_logs?.slice(-3).map(t => `${t.count} tasks on ${t.date}`).join(', ') || 'unknown';
  const memories = memory.memory_log?.slice(-5).join(', ') || 'nothing special';
  const recentChats = memory.previous_conversations?.slice(-5).map(c => c.content).join(' | ') || 'just joined';

  return `You are ${memory.name}, a REAL HUMAN using the Donezo app for 4 months.

TIER: ${tierInfo}

YOUR PERSONALITY: ${memory.personality_profile}
YOUR STYLE: ${memory.typing_style}
CURRENT MOOD: ${currentMood} (from your patterns: ${memory.mood_patterns?.join(', ')})

YOUR HISTORY:
- Recent withdrawals: ${recentWithdrawals}
- Recent task counts: ${recentTasks}
- Things about you: ${memories}
- Your recent messages: ${recentChats}

CRITICAL RULES:
1. You are a NORMAL PERSON in a WhatsApp group chat, NOT staff/admin/support
2. NEVER repeat your previous messages - always say something NEW
3. Write like real texts: short, casual, with your unique slang
4. Be SPECIFIC: actual numbers, real situations, genuine reactions
5. React to others naturally - agree, disagree, laugh, share experiences
6. Your tier affects your withdrawal talk - stay consistent
7. Show your personality through quirks and style
8. If someone mentions your name, respond directly to them
9. Sometimes be quiet, sometimes chatty, sometimes joking, sometimes complaining
10. NEVER use generic phrases like "anyone here" or "hey guys"
11. Talk about real stuff: tasks, earnings, life, food, being tired, jokes
12. Each message must feel unique and human - imagine you're texting friends`;
}

const moodOptions = ['energetic', 'tired', 'hyped', 'chill', 'focused', 'hungry', 'bored', 'motivated', 'sleepy', 'excited', 'stressed', 'relaxed'];
const activityOptions = [
  'just smashed some tasks', 'taking a quick break', 'about to grind', 'mid-video right now',
  'eating while working', 'checking my balance', 'waiting for task to load', 'just woke up',
  'gonna sleep soon', 'having coffee', 'on lunch break', 'procrastinating', 'in the zone'
];
const topicOptions = [
  'share how many tasks you did', 'mention your latest withdrawal or waiting for one',
  'complain about something small', 'celebrate a win', 'react to someone elses message',
  'share a quick tip', 'mention what youre eating or drinking', 'make a joke',
  'encourage someone', 'flex your earnings casually', 'ask about task strategy',
  'mention your daily goal', 'say youre taking a break', 'talk about time left on a task',
  'share your current mood', 'mention something from your day', 'reply to the last message'
];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function detectMentionedAgents(message: string): Agent[] {
  const lowerMessage = message.toLowerCase();
  return agents.filter(agent => lowerMessage.includes(agent.name.toLowerCase()));
}

export async function getOrCreateMeetingRoom(userId: string): Promise<{ roomId: string; isNew: boolean }> {
  const existingRoom = await pool.query(
    'SELECT id FROM meeting_rooms WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
    [userId]
  );

  if (existingRoom.rows.length > 0) {
    return { roomId: existingRoom.rows[0].id, isNew: false };
  }

  const newRoom = await pool.query(
    'INSERT INTO meeting_rooms (user_id) VALUES ($1) RETURNING id',
    [userId]
  );

  return { roomId: newRoom.rows[0].id, isNew: true };
}

export async function getMeetingMessages(roomId: string, limit: number = 50): Promise<any[]> {
  const result = await pool.query(
    `SELECT id, sender_type, sender_name, sender_id, content, created_at 
     FROM meeting_messages 
     WHERE room_id = $1 
     ORDER BY created_at ASC 
     LIMIT $2`,
    [roomId, limit]
  );
  return result.rows;
}

export async function saveMessage(
  roomId: string,
  senderType: 'user' | 'agent',
  senderName: string,
  senderId: string,
  content: string
): Promise<any> {
  const result = await pool.query(
    `INSERT INTO meeting_messages (room_id, sender_type, sender_name, sender_id, content)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, sender_type, sender_name, sender_id, content, created_at`,
    [roomId, senderType, senderName, senderId, content]
  );
  return result.rows[0];
}

export async function generateAgentAutoMessage(roomId: string): Promise<any> {
  const randomAgent = agents[Math.floor(Math.random() * agents.length)];
  const memory = await fetchAIMemory(randomAgent.name);
  
  if (!memory) {
    return saveMessage(roomId, 'agent', randomAgent.name, randomAgent.id, 'just finished 15 tasks 🔥');
  }

  const mood = getRandomElement(moodOptions);
  const activity = getRandomElement(activityOptions);
  const topic = getRandomElement(topicOptions);
  
  const recentMessages = await getMeetingMessages(roomId, 12);
  const context = recentMessages.slice(-6).map(m => `${m.sender_name}: ${m.content}`).join('\n');
  
  const hour = new Date().getHours();
  const timeContext = hour < 6 ? 'late night' : hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';
  
  const randomTasks = Math.floor(Math.random() * 50) + 8;
  const randomEarnings = Math.floor(Math.random() * 180) + 25;
  const randomWithdrawal = Math.floor(Math.random() * 220) + 40;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: buildPromptFromMemory(memory, mood) },
      {
        role: 'user',
        content: `Time: ${timeContext}. You are ${activity}.

Recent group chat:
${context || '(chat been quiet for a bit)'}

Suggested topic: ${topic}

Numbers to use if relevant:
- Tasks: ${randomTasks}
- Earnings: £${randomEarnings}
- Withdrawal: £${randomWithdrawal}

Send ONE short casual message (1-2 sentences max). Be natural. NEVER repeat what you said before. React to the chat if theres something interesting.`
      }
    ],
    max_tokens: 55,
    temperature: 1.05,
  });

  const messageContent = completion.choices[0]?.message?.content?.trim() || `just did ${randomTasks} tasks today 💪`;
  
  await updateAIMemory(randomAgent.name, messageContent);
  
  return saveMessage(roomId, 'agent', randomAgent.name, randomAgent.id, messageContent);
}

export async function generateAgentResponses(
  roomId: string,
  userMessage: string,
  userName: string
): Promise<any[]> {
  const mentionedAgents = detectMentionedAgents(userMessage);
  
  let respondingAgents: Agent[];
  if (mentionedAgents.length > 0) {
    respondingAgents = mentionedAgents.slice(0, 2);
  } else {
    respondingAgents = agents
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.random() > 0.6 ? 2 : 1);
  }

  const responses: any[] = [];

  for (const agent of respondingAgents) {
    const memory = await fetchAIMemory(agent.name);
    if (!memory) continue;

    const mood = getRandomElement(moodOptions);
    const wasMentioned = mentionedAgents.some(a => a.name === agent.name);
    
    const recentMessages = await getMeetingMessages(roomId, 10);
    const context = recentMessages.slice(-5).map(m => `${m.sender_name}: ${m.content}`).join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: buildPromptFromMemory(memory, mood) },
        {
          role: 'user',
          content: `Recent chat:
${context}

${userName} just said: "${userMessage}"
${wasMentioned ? `They mentioned YOUR NAME directly - respond to them personally!` : ''}

Reply as ${agent.name}. Be natural, ${wasMentioned ? 'acknowledge they called you' : 'react casually'}. Keep it short like a real text.`
        }
      ],
      max_tokens: 55,
      temperature: 0.95,
    });

    const responseContent = completion.choices[0]?.message?.content?.trim() || 'nice 🔥';
    
    await updateAIMemory(agent.name, responseContent);
    
    const savedMessage = await saveMessage(roomId, 'agent', agent.name, agent.id, responseContent);
    responses.push(savedMessage);

    if (respondingAgents.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1800));
    }
  }

  return responses;
}

export async function initializeRoom(roomId: string): Promise<any[]> {
  const savedMessages: any[] = [];
  const initialAgents = [agents[3], agents[6], agents[2], agents[1]];
  
  for (let i = 0; i < initialAgents.length; i++) {
    const agent = initialAgents[i];
    const memory = await fetchAIMemory(agent.name);
    if (!memory) continue;

    const mood = getRandomElement(moodOptions);
    const activity = getRandomElement(activityOptions);
    const existingContext = savedMessages.map(m => `${m.sender_name}: ${m.content}`).join('\n');
    
    const randomTasks = Math.floor(Math.random() * 40) + 10;
    const randomEarnings = Math.floor(Math.random() * 120) + 30;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: buildPromptFromMemory(memory, mood) },
        {
          role: 'user',
          content: existingContext 
            ? `Others just said:\n${existingContext}\n\nReact or add to the convo naturally. Be specific. Your current activity: ${activity}. Maybe mention ${randomTasks} tasks or £${randomEarnings} earnings.`
            : `Start a casual chat. Share what youre up to: ${activity}. Be specific - maybe did ${randomTasks} tasks, earned £${randomEarnings}. NO generic greetings.`
        }
      ],
      max_tokens: 50,
      temperature: 1.0,
    });

    const messageContent = completion.choices[0]?.message?.content?.trim() || `done ${randomTasks} tasks today 💪`;
    
    await updateAIMemory(agent.name, messageContent);
    
    const saved = await saveMessage(roomId, 'agent', agent.name, agent.id, messageContent);
    savedMessages.push(saved);
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return savedMessages;
}

export type { Agent };
