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
  try {
    const result = await pool.query('SELECT * FROM ai_user_memory WHERE name = $1', [name]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching AI memory:', error);
    return null;
  }
}

async function updateAIMemory(name: string, newMessage: string, importantDetail?: string): Promise<void> {
  try {
    const memory = await fetchAIMemory(name);
    if (!memory) return;

    const conversations = memory.previous_conversations || [];
    conversations.push({ content: newMessage, timestamp: new Date().toISOString() });
    if (conversations.length > 25) conversations.shift();

    if (importantDetail) {
      await pool.query(
        `UPDATE ai_user_memory 
         SET previous_conversations = $1, memory_log = memory_log || $2::jsonb, last_active = NOW() 
         WHERE name = $3`,
        [JSON.stringify(conversations), JSON.stringify([importantDetail]), name]
      );
    } else {
      await pool.query(
        `UPDATE ai_user_memory SET previous_conversations = $1, last_active = NOW() WHERE name = $2`,
        [JSON.stringify(conversations), name]
      );
    }
  } catch (error) {
    console.error('Error updating AI memory:', error);
  }
}

async function recordWithdrawal(name: string, amount: number): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    await pool.query(
      `UPDATE ai_user_memory 
       SET past_withdrawals = past_withdrawals || $1::jsonb, last_active = NOW() 
       WHERE name = $2`,
      [JSON.stringify([{ amount, date: today }]), name]
    );
  } catch (error) {
    console.error('Error recording withdrawal:', error);
  }
}

async function recordTaskCompletion(name: string, count: number): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    await pool.query(
      `UPDATE ai_user_memory 
       SET past_task_logs = past_task_logs || $1::jsonb, last_active = NOW() 
       WHERE name = $2`,
      [JSON.stringify([{ count, date: today }]), name]
    );
  } catch (error) {
    console.error('Error recording tasks:', error);
  }
}

function buildEnhancedPrompt(memory: AIMemory, mood: string, recentChatContext: string): string {
  const tierBehavior = memory.tier === 1 
    ? `TIER 1 (Free Plan - Monthly Payouts Only):
- You CANNOT withdraw until the 30th of the month
- You often talk about counting down to payday, saving up, being jealous of tier 2/3
- Mention waiting for Friday/weekend but clarify you still cant withdraw until month end
- Sometimes complain about waiting, sometimes optimistic about the build-up
- Talk about how your balance is growing but untouchable until the 30th
- Dream about upgrading to tier 2 or 3 someday`
    : memory.tier === 2
    ? `TIER 2 (£250 Plan - Weekly Payouts Every Friday):
- You get payouts every Friday, amounts like £120, £145, £180, £210, £227
- Talk about your weekly rhythm, counting down to Friday
- Mention your last Friday payout amount specifically
- Sometimes excited its almost Friday, sometimes mention using the money for bills/fun
- You upgraded from tier 1, so you know the difference
- Weekly payouts changed your life - mention this sometimes`
    : `TIER 3 (£600 Premium - Withdraw Anytime, £3000/month cap):
- You withdraw ANYTIME you want, multiple times per day if needed
- Flex your quick 2-3 minute withdrawals casually
- Mention specific amounts: £85, £120, £167, £200, £250
- Talk about instant cash for bills, shopping, nights out
- Sometimes humble brag about your earnings or withdrawal speed
- You're living the dream - anytime access to your money`;

  const recentWithdrawals = memory.past_withdrawals?.slice(-5) || [];
  const withdrawalHistory = recentWithdrawals.length > 0 
    ? recentWithdrawals.map(w => `£${w.amount} on ${w.date}`).join(', ')
    : 'none yet this week';

  const recentTasks = memory.past_task_logs?.slice(-5) || [];
  const taskHistory = recentTasks.length > 0
    ? recentTasks.map(t => `${t.count} tasks on ${t.date}`).join(', ')
    : 'building up';

  const memories = memory.memory_log?.slice(-8) || [];
  const importantMemories = memories.join(' | ') || 'nothing special yet';

  const recentMessages = memory.previous_conversations?.slice(-8) || [];
  const myRecentMessages = recentMessages.map(c => c.content).join(' | ') || 'just joined';

  return `You are ${memory.name}, a REAL HUMAN who has been using the Donezo task platform for 4 months.

${tierBehavior}

YOUR PERSONALITY: ${memory.personality_profile}
YOUR TEXTING STYLE: ${memory.typing_style}
CURRENT MOOD: ${mood}
YOUR MOOD PATTERNS: ${memory.mood_patterns?.join(', ') || 'varies'}

=== YOUR MEMORY (Reference this naturally) ===
Recent withdrawals: ${withdrawalHistory}
Recent task counts: ${taskHistory}
Things you remember: ${importantMemories}
Your recent messages (NEVER repeat these): ${myRecentMessages}

=== RECENT GROUP CHAT ===
${recentChatContext || '(quiet right now)'}

=== CRITICAL RULES ===
1. You are a NORMAL PLATFORM USER chatting in a WhatsApp group - NOT staff, NOT admin, NOT support
2. NEVER repeat any of your previous messages - check the list above
3. Write SHORT messages like real texts (1-2 sentences max)
4. Use your unique slang and personality naturally
5. Be SPECIFIC with numbers: "did 34 tasks", "withdrew £167", "waiting 12 more days"
6. Reference your MEMORY naturally - mention past withdrawals, previous conversations, things you said before
7. React to others in the chat - agree, laugh, share your experience, ask follow-ups
8. If someone asks about withdrawals, answer honestly based on YOUR tier
9. Sometimes complain, sometimes celebrate, sometimes joke, sometimes just chill
10. Talk about real stuff: tasks, earnings, food, being tired, delays, excitement
11. If you mentioned upgrading before, reference it. If you had a good payout, mention it again casually
12. Your tier affects EVERYTHING about how you talk about money - stay consistent`;
}

const moodOptions = ['energetic', 'tired', 'hyped', 'chill', 'focused', 'hungry', 'bored', 'motivated', 'sleepy', 'excited', 'grateful', 'impatient', 'relaxed', 'productive'];

const conversationStarters = [
  'share your current task progress with specific numbers',
  'talk about your withdrawal experience based on your tier',
  'mention something you ate or drank while working',
  'make a casual observation about the time of day',
  'reference something from your memory or past conversations',
  'react to what someone else said in the chat',
  'complain about something minor (wifi, boring video, tired)',
  'celebrate a small win or milestone',
  'ask others how their day is going',
  'share a quick tip or hack you discovered',
  'mention your daily or weekly goal',
  'talk about what you are doing right now',
  'flex your earnings or withdrawal casually',
  'express excitement or frustration naturally',
  'mention weekend plans or life stuff briefly'
];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function detectMentionedAgents(message: string): Agent[] {
  const lowerMessage = message.toLowerCase();
  return agents.filter(agent => lowerMessage.includes(agent.name.toLowerCase()));
}

function detectWithdrawalQuestion(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes('withdraw') || lower.includes('payout') || lower.includes('paid') || 
         lower.includes('money') || lower.includes('cash') || lower.includes('earnings');
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
     FROM meeting_messages WHERE room_id = $1 ORDER BY created_at ASC LIMIT $2`,
    [roomId, limit]
  );
  return result.rows;
}

export async function saveMessage(
  roomId: string, senderType: 'user' | 'agent', senderName: string, senderId: string, content: string
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
  const mood = getRandomElement(moodOptions);
  const topic = getRandomElement(conversationStarters);
  
  const recentMessages = await getMeetingMessages(roomId, 15);
  const context = recentMessages.slice(-8).map(m => `${m.sender_name}: ${m.content}`).join('\n');
  
  const hour = new Date().getHours();
  const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const dateOfMonth = new Date().getDate();
  const timeContext = hour < 6 ? 'late night' : hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';
  
  const tier1Amounts = [0]; // cant withdraw
  const tier2Amounts = [115, 127, 145, 168, 182, 195, 210, 227, 243];
  const tier3Amounts = [67, 85, 95, 120, 145, 167, 185, 200, 225, 250, 280];
  
  const possibleWithdrawal = randomAgent.tier === 1 ? 0 : 
    randomAgent.tier === 2 ? tier2Amounts[Math.floor(Math.random() * tier2Amounts.length)] :
    tier3Amounts[Math.floor(Math.random() * tier3Amounts.length)];
  
  const randomTasks = Math.floor(Math.random() * 55) + 12;
  const daysUntilPayday = 30 - dateOfMonth;

  const prompt = memory ? buildEnhancedPrompt(memory, mood, context) : 
    `You are ${randomAgent.name}, a tier ${randomAgent.tier} user on a task platform. Be casual and brief.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: prompt },
        {
          role: 'user',
          content: `Current time: ${timeContext} on ${dayOfWeek}
Date: ${dateOfMonth}th of the month (${daysUntilPayday} days until month end)
Your mood: ${mood}

Topic suggestion: ${topic}

Numbers you can use:
- Tasks done today: ${randomTasks}
- Possible withdrawal amount: £${possibleWithdrawal}
- Days until payday (tier 1): ${daysUntilPayday}
- Is it Friday: ${dayOfWeek === 'Friday' ? 'YES! Tier 2 payday!' : 'No'}

Generate ONE short, casual, human message. Reference your memory if relevant. NEVER repeat your previous messages. Be yourself.`
        }
      ],
      max_tokens: 60,
      temperature: 1.1,
    });

    const messageContent = completion.choices[0]?.message?.content?.trim();
    if (!messageContent) throw new Error('Empty response');

    if (messageContent.includes('withdrew') || messageContent.includes('withdrawal')) {
      await recordWithdrawal(randomAgent.name, possibleWithdrawal);
    }
    if (messageContent.includes('task')) {
      await recordTaskCompletion(randomAgent.name, randomTasks);
    }

    await updateAIMemory(randomAgent.name, messageContent);
    return saveMessage(roomId, 'agent', randomAgent.name, randomAgent.id, messageContent);
  } catch (error) {
    console.error('OpenAI error:', error);
    throw error;
  }
}

export async function generateAgentResponses(
  roomId: string, userMessage: string, userName: string
): Promise<any[]> {
  const mentionedAgents = detectMentionedAgents(userMessage);
  const isWithdrawalQuestion = detectWithdrawalQuestion(userMessage);
  
  let respondingAgents: Agent[];
  
  if (mentionedAgents.length > 0) {
    respondingAgents = mentionedAgents.slice(0, 2);
  } else if (isWithdrawalQuestion) {
    const tier3Agent = agents.filter(a => a.tier === 3).sort(() => Math.random() - 0.5)[0];
    const otherAgent = agents.filter(a => a.tier !== 3).sort(() => Math.random() - 0.5)[0];
    respondingAgents = [tier3Agent, otherAgent].filter(Boolean).slice(0, 2);
  } else {
    respondingAgents = agents.sort(() => Math.random() - 0.5).slice(0, Math.random() > 0.5 ? 2 : 1);
  }

  const responses: any[] = [];
  const recentMessages = await getMeetingMessages(roomId, 12);
  const context = recentMessages.slice(-6).map(m => `${m.sender_name}: ${m.content}`).join('\n');

  for (const agent of respondingAgents) {
    const memory = await fetchAIMemory(agent.name);
    const mood = getRandomElement(moodOptions);
    const wasMentioned = mentionedAgents.some(a => a.name === agent.name);

    const prompt = memory ? buildEnhancedPrompt(memory, mood, context) :
      `You are ${agent.name}, a tier ${agent.tier} user replying in a group chat. Be casual.`;

    const tier2Amounts = [127, 145, 168, 182, 195, 210, 227];
    const tier3Amounts = [85, 120, 145, 167, 185, 200, 250];
    const recentWithdrawal = agent.tier === 2 
      ? tier2Amounts[Math.floor(Math.random() * tier2Amounts.length)]
      : tier3Amounts[Math.floor(Math.random() * tier3Amounts.length)];

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: prompt },
          {
            role: 'user',
            content: `${userName} just said: "${userMessage}"

${wasMentioned ? 'THEY MENTIONED YOUR NAME - respond directly to them!' : ''}
${isWithdrawalQuestion ? `Answer about withdrawals based on your tier. Your recent withdrawal: £${agent.tier > 1 ? recentWithdrawal : 0}` : ''}

Reply naturally as ${agent.name}. Keep it short like a real text. Reference your memory if relevant.`
          }
        ],
        max_tokens: 60,
        temperature: 0.95,
      });

      const responseContent = completion.choices[0]?.message?.content?.trim();
      if (!responseContent) continue;

      await updateAIMemory(agent.name, responseContent);
      const savedMessage = await saveMessage(roomId, 'agent', agent.name, agent.id, responseContent);
      responses.push(savedMessage);

      if (respondingAgents.indexOf(agent) < respondingAgents.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 2500));
      }
    } catch (error) {
      console.error('OpenAI error for', agent.name, error);
    }
  }

  return responses;
}

export async function initializeRoom(roomId: string): Promise<any[]> {
  const savedMessages: any[] = [];
  const initialAgents = [agents[3], agents[6], agents[2], agents[1]];
  
  for (const agent of initialAgents) {
    const memory = await fetchAIMemory(agent.name);
    const mood = getRandomElement(moodOptions);
    const existingContext = savedMessages.map(m => `${m.sender_name}: ${m.content}`).join('\n');
    
    const randomTasks = Math.floor(Math.random() * 45) + 15;
    const hour = new Date().getHours();
    const timeContext = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

    const prompt = memory ? buildEnhancedPrompt(memory, mood, existingContext) :
      `You are ${agent.name}, joining a group chat. Be casual and specific.`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: prompt },
          {
            role: 'user',
            content: existingContext 
              ? `Others just said:\n${existingContext}\n\nReact naturally. Maybe did ${randomTasks} tasks. Its ${timeContext}.`
              : `Start chatting. Share what youre up to this ${timeContext}. Did ${randomTasks} tasks maybe. No generic greetings.`
          }
        ],
        max_tokens: 50,
        temperature: 1.0,
      });

      const messageContent = completion.choices[0]?.message?.content?.trim();
      if (!messageContent) continue;

      await updateAIMemory(agent.name, messageContent);
      const saved = await saveMessage(roomId, 'agent', agent.name, agent.id, messageContent);
      savedMessages.push(saved);
      
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));
    } catch (error) {
      console.error('Init error:', error);
    }
  }

  return savedMessages;
}

export type { Agent };
