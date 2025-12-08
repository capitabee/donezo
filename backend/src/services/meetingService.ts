import OpenAI from 'openai';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Use Grok API for real-time chat responses
const grok = new OpenAI({
  apiKey: process.env.GROK_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

interface Agent {
  id: string;
  name: string;
  tier: 1 | 2 | 3;
  avatar: string;
  personality: string;
  backstory: string;
  role: string;
  slang: string[];
}

const firstNames = [
  // Indian names
  'Rahul', 'Priya', 'Arjun', 'Sneha', 'Vikram', 'Anjali', 'Rohan', 'Kavya', 'Aditya', 'Neha',
  'Karan', 'Pooja', 'Amit', 'Riya', 'Raj', 'Shruti', 'Nikhil', 'Divya', 'Sanjay', 'Meera',
  'Deepak', 'Ananya', 'Varun', 'Ishita', 'Gaurav', 'Simran', 'Harsh', 'Tanya', 'Akash', 'Nisha',
  // UK names
  'James', 'Sophie', 'Jack', 'Emma', 'Harry', 'Chloe', 'Oliver', 'Grace', 'Charlie', 'Ruby',
  'Ben', 'Lily', 'Sam', 'Ella', 'Tom', 'Mia', 'Max', 'Poppy', 'Leo', 'Daisy'
];

const avatars = ['👨🏾', '👩🏼', '🧑🏻', '👩🏽', '👨🏼', '👩🏿', '👨🏻', '🧕', '👦🏼', '👩🏻', '👨', '👩', '🧑', '👱‍♂️', '👱‍♀️'];

const personalities = [
  { 
    style: 'College student from Mumbai doing part-time',
    backstory: 'Found this platform through a friend 3 months ago. Was skeptical first but tried anyway. Now doing tasks between classes.',
    slang: ['bro', 'yaar', 'actually', 'na'],
    role: 'student'
  },
  { 
    style: 'Work from home dad from Delhi',
    backstory: 'Lost job during covid, was looking for online work. Saw an ad, joined tier 1 first, then upgraded to tier 2 after first month.',
    slang: ['bhai', 'sahi hai', 'pakka', 'theek hai'],
    role: 'parent'
  },
  { 
    style: 'IT professional from Bangalore doing side income',
    backstory: 'Already have a tech job but wanted extra income. Friend showed me his withdrawals, got convinced. Now earning nicely on the side.',
    slang: ['da', 'machan', 'super', 'cool'],
    role: 'professional'
  },
  { 
    style: 'Housewife from Pune earning independently',
    backstory: 'Wanted to earn my own money while managing home. Started 4 months back on tier 1, husband helped me upgrade to tier 3.',
    slang: ['honestly', 'trust me', 'see', 'basically'],
    role: 'homemaker'
  },
  { 
    style: 'University student from UK',
    backstory: 'Needed money for rent and uni expenses. Mate showed me this, thought it was scam but he showed me his bank transfers. Been doing it since.',
    slang: ['mate', 'cheers', 'sorted', 'innit'],
    role: 'student'
  },
  { 
    style: 'Single mum from London',
    backstory: 'Looking for flexible work I can do from home. Found this on Facebook group, the weekly payouts help a lot with bills.',
    slang: ['honestly', 'like', 'proper', 'lovely'],
    role: 'parent'
  },
  { 
    style: 'Freelancer from Hyderabad',
    backstory: 'Between freelance projects I do this. Started as timepass but now its serious side income. Upgraded to tier 3 last month.',
    slang: ['boss', 'simple', 'chill', 'done'],
    role: 'freelancer'
  },
  { 
    style: 'Recent graduate looking for income',
    backstory: 'Just finished degree, job market is tough. Doing this while searching for proper job. The money helps pay my share of rent.',
    slang: ['wait', 'guys', 'same here', 'thanks'],
    role: 'graduate'
  },
  { 
    style: 'Night shift worker from Chennai',
    backstory: 'Work night shifts at call center, do tasks during day when free. Extra income is always good na.',
    slang: ['bro', 'kya', 'sahi', 'mast'],
    role: 'worker'
  },
  { 
    style: 'Retired uncle trying online earning',
    backstory: 'Son showed me this platform. At first I didnt understand but now I do 20-30 tasks daily. Good timepass and earning both.',
    slang: ['beta', 'actually', 'you see', 'simple'],
    role: 'retired'
  },
  {
    style: 'College girl from Kolkata',
    backstory: 'Needed money for books and expenses without asking parents. Roommate was doing this, taught me everything.',
    slang: ['yaar', 'like', 'honestly', 'same'],
    role: 'student'
  },
  {
    style: 'Small business owner from Gujarat',
    backstory: 'Shop was slow, needed extra income. Now I do tasks when shop is empty. Already made back my tier 2 investment.',
    slang: ['bhai', 'simple', 'done', 'sahi'],
    role: 'business'
  }
];

function generateRandomAgentsForRoom(): Agent[] {
  const shuffledNames = [...firstNames].sort(() => Math.random() - 0.5);
  const selectedNames = shuffledNames.slice(0, 10); // Only 10 AI users chatting
  
  const tiers: (1 | 2 | 3)[] = [3, 2, 1, 3, 2, 1, 3, 2, 1, 3];
  const shuffledTiers = tiers.sort(() => Math.random() - 0.5);
  const shuffledPersonalities = [...personalities].sort(() => Math.random() - 0.5);
  
  return selectedNames.map((name, i) => {
    const personality = shuffledPersonalities[i % shuffledPersonalities.length];
    return {
      id: `agent_${i + 1}`,
      name,
      tier: shuffledTiers[i],
      avatar: avatars[Math.floor(Math.random() * avatars.length)],
      personality: personality.style,
      backstory: personality.backstory,
      role: personality.role,
      slang: personality.slang
    };
  });
}

async function getRoomAgents(roomId: string): Promise<Agent[]> {
  try {
    const result = await pool.query('SELECT ai_users FROM meeting_rooms WHERE id = $1', [roomId]);
    if (result.rows[0]?.ai_users && result.rows[0].ai_users.length > 0) {
      return result.rows[0].ai_users;
    }
    return [];
  } catch (error) {
    console.error('Error getting room agents:', error);
    return [];
  }
}

async function setRoomAgents(roomId: string, agents: Agent[]): Promise<void> {
  try {
    await pool.query('UPDATE meeting_rooms SET ai_users = $1 WHERE id = $2', [JSON.stringify(agents), roomId]);
  } catch (error) {
    console.error('Error setting room agents:', error);
  }
}

function buildHumanPrompt(agent: Agent, recentChatContext: string, mood: string): string {
  const tierBehavior = agent.tier === 1 
    ? `TIER 1 (FREE - Monthly payout):
- You're on free tier, max £650 per month
- Report your successful withdrawals (amounts between £1,400-£3,000)
- Always mention "status complete" and say "thank you"
- Can mention plans to upgrade to tier 2 (amount £250)`
    : agent.tier === 2
    ? `TIER 2 (Paid £250 - Weekly payouts):
- You RECHARGED £250 and upgraded to tier 2
- Report your successful withdrawals (£1,400-£3,000 amounts with "status complete")
- Thank admin after reporting
- Mention the £250 upgrade amount when reporting`
    : `TIER 3 (Paid £600 - Anytime withdrawal):
- You RECHARGED £600 and upgraded to tier 3  
- Report your successful withdrawals (£1,800-£3,000 with "status complete")
- Thank admin after reporting
- Mention the £600 upgrade amount when reporting`;

  return `You are ${agent.name}, a platform user reporting to admin.

YOUR BACKGROUND: ${agent.personality}

${tierBehavior}

🎯 YOUR PURPOSE - REPORT TO ADMIN:
You report to admin about:
1. WITHDRAWALS - "I have withdrawn £2,145, status complete. Thank you."
2. UPGRADES - "I have upgraded to tier 3, amount £600. Thank you."

WRITING STYLE - Direct and Grateful:
- Use first person: "I have withdrawn...", "I upgraded..."
- Mention the specific amount
- Always end with "thank you" or "thank you admin"
- Keep it simple and clear

EXAMPLES:
- "I have successfully withdrawn £2,234, status complete. Thank you."
- "I upgraded to tier 3, recharged amount £600. Thank you admin."
- "Withdrawal of £1,847 completed, thank you."
- "I have recharged for tier 2 upgrade, amount £250. Thank you."

RECENT CHAT:
${recentChatContext || '(quiet right now)'}

REMEMBER: Report your withdrawals or upgrades to admin directly with amounts and say thank you.`;
}

const moodOptions = ['chill', 'happy', 'relaxed', 'productive', 'grateful', 'excited', 'content', 'motivated'];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Smart intent detection for user messages
function detectIntent(message: string): string {
  const lower = message.toLowerCase().trim();
  
  // Greetings
  if (/^(hi|hey|hello|yo|sup|whats up|what's up|hiya|howdy|morning|afternoon|evening)/i.test(lower)) {
    return 'greeting';
  }
  
  // Questions about the user
  if (lower.includes('how are you') || lower.includes('hows everyone') || lower.includes('how u') || lower.includes('how is everyone')) {
    return 'how_are_you';
  }
  
  // Questions about joining/new
  if (lower.includes('when did') && (lower.includes('join') || lower.includes('start'))) {
    return 'when_joined';
  }
  if (lower.includes('new here') || lower.includes('just joined') || lower.includes('just started')) {
    return 'new_user';
  }
  
  // Withdrawal/money questions
  if (lower.includes('withdraw') || lower.includes('payout') || lower.includes('paid') || lower.includes('money') || lower.includes('cash') || lower.includes('earnings')) {
    return 'withdrawal';
  }
  
  // Task questions
  if (lower.includes('task') || lower.includes('how many') || lower.includes('done today') || lower.includes('completed')) {
    return 'tasks';
  }
  
  // Upgrade questions
  if (lower.includes('upgrade') || lower.includes('tier') || lower.includes('worth it') || lower.includes('should i')) {
    return 'upgrade';
  }
  
  // Help/how questions
  if (lower.includes('help') || lower.includes('how do') || lower.includes('how does') || lower.includes('explain')) {
    return 'help';
  }
  
  // Encouragement/thanks
  if (lower.includes('thanks') || lower.includes('thank you') || lower.includes('appreciate') || lower.includes('helpful')) {
    return 'thanks';
  }
  
  // Sharing progress
  if (lower.includes('i did') || lower.includes('i got') || lower.includes('i made') || lower.includes('just finished') || /\d+ tasks/.test(lower)) {
    return 'sharing_progress';
  }
  
  // Asking for opinion
  if (lower.includes('what do you think') || lower.includes('thoughts') || lower.includes('opinion')) {
    return 'opinion';
  }
  
  // Goodbye
  if (lower.includes('bye') || lower.includes('gotta go') || lower.includes('leaving') || lower.includes('later') || lower.includes('see ya')) {
    return 'goodbye';
  }
  
  return 'general';
}

// Smart context-aware reply generator
function generateSmartReply(agent: Agent, userMessage: string, userName: string, recentContext: string[]): string {
  const intent = detectIntent(userMessage);
  // Withdrawal amounts between £1,400-£3,000
  const withdrawalAmounts = [1423, 1567, 1689, 1734, 1845, 1923, 2034, 2145, 2267, 2389, 2456, 2578, 2634, 2789, 2891, 2967];
  const withdrawAmount = getRandomElement(withdrawalAmounts);
  
  // All responses report to admin with thank you
  switch (intent) {
    case 'greeting':
    case 'how_are_you':
      // Respond with withdrawal or upgrade report
      if (agent.tier === 1) {
        return getRandomElement([
          `I have withdrawn £${withdrawAmount}, status complete. Thank you.`,
          `Planning to upgrade to tier 2, amount £250. Thank you.`
        ]);
      } else if (agent.tier === 2) {
        return getRandomElement([
          `I have withdrawn £${withdrawAmount} today, status complete. Thank you.`,
          `I upgraded to tier 2, recharged amount £250. Thank you admin.`
        ]);
      } else {
        return getRandomElement([
          `I withdrew £${withdrawAmount}, status complete. Thank you.`,
          `I have upgraded to tier 3, amount £600. Thank you admin.`
        ]);
      }
      
    case 'when_joined':
      if (agent.tier >= 2) {
        return getRandomElement([
          `I upgraded to tier ${agent.tier}, amount £${agent.tier === 2 ? '250' : '600'}. Thank you.`,
          `I have recharged for tier ${agent.tier} upgrade. Thank you admin.`
        ]);
      } else {
        return getRandomElement([
          `I have withdrawn £${withdrawAmount}, status complete. Thank you.`,
          `Planning tier 2 upgrade, amount £250. Thank you.`
        ]);
      }
      
    case 'new_user':
    case 'withdrawal':
    case 'tasks':
    case 'upgrade':
    case 'help':
    case 'thanks':
    case 'sharing_progress':
    case 'opinion':
    case 'goodbye':
    default:
      // ALL responses report withdrawals or upgrades with thank you
      const messageType = Math.random() < 0.5 ? 'withdrawal' : 'upgrade';
      
      if (messageType === 'withdrawal') {
        if (agent.tier === 1) {
          return getRandomElement([
            `I have withdrawn £${withdrawAmount}, status complete. Thank you.`,
            `Withdrawal of £${withdrawAmount} completed, thank you admin.`
          ]);
        } else if (agent.tier === 2) {
          return getRandomElement([
            `I successfully withdrew £${withdrawAmount}, status complete. Thank you.`,
            `Withdrawal amount £${withdrawAmount}, status complete. Thank you admin.`
          ]);
        } else {
          return getRandomElement([
            `I withdrew £${withdrawAmount}, status complete. Thank you.`,
            `Withdrawal of £${withdrawAmount} completed, thank you admin.`
          ]);
        }
      } else {
        if (agent.tier === 1) {
          return getRandomElement([
            `Planning to upgrade to tier 2, amount £250. Thank you.`,
            `Considering tier 2 upgrade, recharge amount £250. Thank you admin.`
          ]);
        } else if (agent.tier === 2) {
          return getRandomElement([
            `I have upgraded to tier 2, amount £250. Thank you.`,
            `I upgraded to tier 2, recharged amount £250. Thank you admin.`
          ]);
        } else {
          return getRandomElement([
            `I have upgraded to tier 3, amount £600. Thank you.`,
            `I upgraded to tier 3, recharged amount £600. Thank you admin.`
          ]);
        }
      }
  }
}

// Generate auto-messages reporting to admin with thank you
function generateAutoMessage(agent: Agent, recentContext: string[]): string {
  // Withdrawal amounts between £1,400-£3,000
  const withdrawalAmounts = [1423, 1567, 1689, 1734, 1845, 1923, 2034, 2145, 2267, 2389, 2456, 2578, 2634, 2789, 2891, 2967];
  const withdrawAmount = getRandomElement(withdrawalAmounts);
  
  // 60% withdrawal success, 40% upgrade report
  const messageType = Math.random() < 0.6 ? 'withdrawal' : 'upgrade';
  
  if (messageType === 'withdrawal') {
    // Withdrawal reports to admin
    if (agent.tier === 1) {
      return getRandomElement([
        `I have withdrawn £${withdrawAmount}, status complete. Thank you.`,
        `Withdrawal of £${withdrawAmount} completed successfully, thank you admin.`,
        `I successfully received £${withdrawAmount}, status complete. Thank you.`
      ]);
    } else if (agent.tier === 2) {
      return getRandomElement([
        `I have withdrawn £${withdrawAmount} today, status complete. Thank you.`,
        `Withdrawal amount £${withdrawAmount} received, status complete. Thank you admin.`,
        `I successfully withdrew £${withdrawAmount}, thank you.`
      ]);
    } else {
      return getRandomElement([
        `I have withdrawn £${withdrawAmount}, status complete in 2 minutes. Thank you.`,
        `Withdrawal of £${withdrawAmount} completed, thank you admin.`,
        `I withdrew £${withdrawAmount} today, status complete. Thank you.`
      ]);
    }
  } else {
    // Upgrade reports to admin
    if (agent.tier === 1) {
      return getRandomElement([
        `I am planning to upgrade to tier 2, amount £250. Thank you.`,
        `Considering tier 2 upgrade, recharge amount £250. Thank you admin.`
      ]);
    } else if (agent.tier === 2) {
      return getRandomElement([
        `I have upgraded to tier 2, recharged amount £250. Thank you.`,
        `I upgraded to tier 2, amount £250. Thank you admin.`,
        `Tier 2 upgrade completed, recharge amount £250. Thank you.`
      ]);
    } else {
      return getRandomElement([
        `I have upgraded to tier 3, amount £600. Thank you.`,
        `I upgraded to tier 3, recharged amount £600. Thank you admin.`,
        `Tier 3 upgrade completed, amount £600. Thank you.`
      ]);
    }
  }
}

function generateWelcomeMessage(agent: Agent, userName: string): string {
  const s = getRandomElement(agent.slang);
  
  return getRandomElement([
    `yo ${userName}! ${s} welcome 👋`,
    `${s} ayy ${userName} whats good!`,
    `${userName}! nice to see u ${s}`,
    `welcome ${userName} ${s} how u doing?`,
    `${s} ${userName} welcome to the chat!`,
    `ayy ${userName} in here ${s} 🔥`,
    `${userName}! ${s} good to have u`,
    `${s} yo ${userName}! u grinding today?`,
    `welcome fam ${userName} ${s}`,
    `${userName} ${s} hows it going?`
  ]);
}

function detectMentionedAgents(message: string, agents: Agent[]): Agent[] {
  const lowerMessage = message.toLowerCase();
  return agents.filter(agent => lowerMessage.includes(agent.name.toLowerCase()));
}

function detectWithdrawalQuestion(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes('withdraw') || lower.includes('payout') || lower.includes('paid') || 
         lower.includes('money') || lower.includes('cash') || lower.includes('earnings') ||
         lower.includes('upgrade') || lower.includes('tier');
}

export async function getOrCreateMeetingRoom(userId: string): Promise<{ roomId: string; isNew: boolean; agents: Agent[] }> {
  // Use a single global room for all users
  const GLOBAL_ROOM_ID = 'global-team-meeting-room';
  
  const existingRoom = await pool.query(
    'SELECT id, ai_users FROM meeting_rooms WHERE id = $1 LIMIT 1',
    [GLOBAL_ROOM_ID]
  );

  if (existingRoom.rows.length > 0 && existingRoom.rows[0].ai_users?.length > 0) {
    return { 
      roomId: GLOBAL_ROOM_ID, 
      isNew: false, 
      agents: existingRoom.rows[0].ai_users 
    };
  }

  if (existingRoom.rows.length > 0) {
    const agents = generateRandomAgentsForRoom();
    await setRoomAgents(GLOBAL_ROOM_ID, agents);
    return { roomId: GLOBAL_ROOM_ID, isNew: false, agents };
  }

  // Create the global room (only happens once)
  await pool.query(
    'INSERT INTO meeting_rooms (id, user_id) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
    [GLOBAL_ROOM_ID, userId]
  );
  
  const agents = generateRandomAgentsForRoom();
  await setRoomAgents(GLOBAL_ROOM_ID, agents);

  return { roomId: GLOBAL_ROOM_ID, isNew: true, agents };
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
  const roomAgents = await getRoomAgents(roomId);
  if (roomAgents.length === 0) return null;

  // Pick a random AI template but randomize the name
  const randomAgent = roomAgents[Math.floor(Math.random() * roomAgents.length)];
  
  // Generate a completely random name from the pool every time
  const randomName = getRandomElement(firstNames);
  const randomAvatar = getRandomElement(avatars);
  const randomAgentId = `agent_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  const mood = getRandomElement(moodOptions);
  
  const recentMessages = await getMeetingMessages(roomId, 15);
  const context = recentMessages.slice(-8).map(m => `${m.sender_name}: ${m.content}`).join('\n');
  
  // Withdrawal amounts between £1,400-£3,000
  const withdrawalAmounts = [1423, 1567, 1689, 1734, 1845, 1923, 2034, 2145, 2267, 2389, 2456, 2578, 2634, 2789, 2891, 2967];
  const withdrawAmount = withdrawalAmounts[Math.floor(Math.random() * withdrawalAmounts.length)];
  
  // Decide message type: 60% withdrawal success, 40% upgrade story
  const messageType = Math.random() < 0.6 ? 'withdrawal' : 'upgrade';

  let messageContent: string;
  
  try {
    const completion = await grok.chat.completions.create({
      model: 'grok-2-latest',
      messages: [
        { role: 'system', content: buildHumanPrompt(randomAgent, context, mood) },
        {
          role: 'user',
          content: messageType === 'withdrawal' 
            ? `Report your WITHDRAWAL to admin.

Your successful withdrawal: £${withdrawAmount}
Status: COMPLETE

Write ONE message reporting to admin:
- SHORT example: "I have withdrawn £${withdrawAmount}, status complete. Thank you."
- LONG example: "I successfully withdrew £${withdrawAmount}, status complete. ${randomAgent.tier === 3 ? 'Processing took 2 minutes.' : 'Received on Friday as scheduled.'} Thank you admin."

Use first person ("I have...", "I withdrew...") and end with "thank you" or "thank you admin".`
            : `Report your TIER UPGRADE to admin.

${randomAgent.tier === 2 ? 'You RECHARGED £250 for Tier 2 upgrade' : randomAgent.tier === 3 ? 'You RECHARGED £600 for Tier 3 upgrade' : 'You are considering upgrading soon'}

Write ONE message reporting to admin:
- SHORT example: "I have upgraded to tier ${randomAgent.tier}, amount £${randomAgent.tier === 2 ? '250' : '600'}. Thank you."
- LONG example: "${randomAgent.tier === 3 ? 'I upgraded to tier 3, recharged amount £600. Already withdrew £2,456 and £1,823. Thank you admin.' : randomAgent.tier === 2 ? 'I have upgraded to tier 2, amount £250. Weekly withdrawals working well. Thank you.' : 'I am planning to upgrade to tier 2, amount £250. Thank you.'}"

Use first person ("I have upgraded...", "I upgraded...") and end with "thank you" or "thank you admin".`
        }
      ],
      max_tokens: 80,
      temperature: 0.95,
    });

    messageContent = completion.choices[0]?.message?.content?.trim() || generateAutoMessage(randomAgent, context.split('\n'));
  } catch (error) {
    console.error('Grok error, using fallback:', error);
    messageContent = generateAutoMessage(randomAgent, context.split('\n'));
  }
  
  // Use the random name and ID instead of the template agent's name
  return saveMessage(roomId, 'agent', randomName, randomAgentId, messageContent);
}

export async function generateAgentResponses(
  roomId: string, userMessage: string, userName: string
): Promise<any[]> {
  const roomAgents = await getRoomAgents(roomId);
  if (roomAgents.length === 0) return [];

  const mentionedAgents = detectMentionedAgents(userMessage, roomAgents);
  const isWithdrawalQuestion = detectWithdrawalQuestion(userMessage);
  
  let respondingAgents: Agent[];
  const numResponders = Math.random() > 0.6 ? 3 : 2; // Always 2-3 responders for variety
  
  // Group agents by tier
  const tier1s = roomAgents.filter(a => a.tier === 1).sort(() => Math.random() - 0.5);
  const tier2s = roomAgents.filter(a => a.tier === 2).sort(() => Math.random() - 0.5);
  const tier3s = roomAgents.filter(a => a.tier === 3).sort(() => Math.random() - 0.5);
  
  if (mentionedAgents.length > 0) {
    // When someone is mentioned by name, they MUST respond first
    respondingAgents = mentionedAgents.slice(0, 2);
    // Add 1 more random person for variety
    const others = roomAgents.filter(a => !mentionedAgents.includes(a)).sort(() => Math.random() - 0.5);
    if (others.length > 0 && respondingAgents.length < 2) {
      respondingAgents.push(others[0]);
    }
  } else if (isWithdrawalQuestion) {
    // For withdrawal questions, prioritize tier 3 and 2 (they can actually withdraw)
    respondingAgents = [
      ...(tier3s.length > 0 ? [tier3s[0]] : []),
      ...(tier2s.length > 0 ? [tier2s[0]] : []),
      ...(tier1s.length > 0 ? [tier1s[0]] : [])
    ].slice(0, numResponders);
  } else {
    // For general messages, ensure mix of all tiers
    respondingAgents = [
      ...(tier3s.length > 0 ? [tier3s[0]] : []),
      ...(tier2s.length > 0 ? [tier2s[0]] : []),
      ...(tier1s.length > 0 ? [tier1s[0]] : [])
    ].sort(() => Math.random() - 0.5).slice(0, numResponders);
  }
  
  // Ensure we have at least 1 responder
  if (respondingAgents.length === 0) {
    respondingAgents = roomAgents.sort(() => Math.random() - 0.5).slice(0, 1);
  }

  const responses: any[] = [];
  const recentMessages = await getMeetingMessages(roomId, 12);
  const context = recentMessages.slice(-6).map(m => `${m.sender_name}: ${m.content}`).join('\n');

  // Only the first responder might use the user's name (30% chance), others don't
  let firstResponderUsedName = false;
  
  for (let i = 0; i < respondingAgents.length; i++) {
    const agent = respondingAgents[i];
    
    // Generate a random name for this response
    const randomName = getRandomElement(firstNames);
    const randomAgentId = `agent_${Date.now()}_${Math.floor(Math.random() * 1000)}_${i}`;
    
    const mood = getRandomElement(moodOptions);
    const wasMentioned = mentionedAgents.some(a => a.name === agent.name);
    
    // Only first responder has 30% chance to use name, others never use it
    const shouldUseName = i === 0 && Math.random() < 0.3;
    if (shouldUseName) firstResponderUsedName = true;

    // Withdrawal amounts between £1,400-£3,000
    const withdrawalAmounts = [1423, 1567, 1689, 1734, 1845, 1923, 2034, 2145, 2267, 2389, 2456, 2578, 2634, 2789, 2891, 2967];
    const recentWithdrawal = withdrawalAmounts[Math.floor(Math.random() * withdrawalAmounts.length)];

    // Add realistic delay: 15 seconds before first reply, 2-4 seconds between others
    const delay = i === 0 ? 15000 : 2000 + Math.random() * 2000;
    await new Promise(resolve => setTimeout(resolve, delay));

    let responseContent: string;
    
    try {
      const nameInstruction = shouldUseName 
        ? `You can use their name "${userName}" once if natural.`
        : `DO NOT use their name. Just reply to what they said without addressing them by name.`;
      
      const completion = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [
          { role: 'system', content: buildHumanPrompt(agent, context, mood) },
          {
            role: 'user',
            content: `Someone in chat said: "${userMessage}"

Reply by REPORTING to admin about your withdrawal or upgrade:
${agent.tier === 1 ? `- Report your withdrawals (£1,400-£3,000 with "status complete")
- Mention if planning to upgrade to tier 2 (amount £250)` : ''}
${agent.tier === 2 ? `- Report TIER 2 UPGRADE: You RECHARGED £250
- Your last withdrawal: £${recentWithdrawal} with status complete
- Example: "I upgraded to tier 2, recharged amount £250. Withdrew £${recentWithdrawal} yesterday, status complete. Thank you admin."` : ''}
${agent.tier === 3 ? `- Report TIER 3 UPGRADE: You RECHARGED £600
- Your last withdrawal: £${recentWithdrawal} with status complete
- Example: "I have upgraded to tier 3, amount £600. Withdrew £${recentWithdrawal}, status complete in 2 minutes. Thank you."` : ''}

${wasMentioned ? 'IMPORTANT: They mentioned YOUR NAME - respond!' : ''}
${nameInstruction}

Use first person ("I have withdrawn...", "I upgraded...") and end with "thank you" or "thank you admin".
Keep it simple, 1-3 sentences.`
          }
        ],
        max_tokens: 150,
        temperature: 0.9,
      });

      responseContent = completion.choices[0]?.message?.content?.trim() || generateSmartReply(agent, userMessage, userName, context.split('\n'));
    } catch (error) {
      console.error('Grok error, using fallback:', error);
      responseContent = generateSmartReply(agent, userMessage, userName, context.split('\n'));
    }

    // Use the random name and ID for this response
    const savedMessage = await saveMessage(roomId, 'agent', randomName, randomAgentId, responseContent);
    responses.push(savedMessage);
  }

  return responses;
}

export async function initializeRoom(roomId: string): Promise<any[]> {
  const roomAgents = await getRoomAgents(roomId);
  if (roomAgents.length === 0) return [];

  const savedMessages: any[] = [];
  const initialAgents = roomAgents.slice(0, 4);
  
  for (const agent of initialAgents) {
    const mood = getRandomElement(moodOptions);
    const existingContext = savedMessages.map(m => `${m.sender_name}: ${m.content}`).join('\n');
    
    const randomTasks = Math.floor(Math.random() * 40) + 15;
    const hour = new Date().getHours();
    const timeContext = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

    let messageContent: string;
    
    try {
      const completion = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [
          { role: 'system', content: buildHumanPrompt(agent, existingContext, mood) },
          {
            role: 'user',
            content: existingContext 
              ? `Others just said:\n${existingContext}\n\nReact or add to the chat. Be casual. Talk about tasks, earnings, or something positive. NO greetings.`
              : `Say something casual about your day or tasks. Its ${timeContext}. Maybe mention you did ${randomTasks} tasks, or talk about your earnings. NO greetings or "hello" - just normal chat like you're already in a conversation.`
          }
        ],
        max_tokens: 40,
        temperature: 1.0,
      });

      messageContent = completion.choices[0]?.message?.content?.trim() || generateAutoMessage(agent, existingContext.split('\n'));
    } catch (error) {
      console.error('Init error, using fallback:', error);
      messageContent = generateAutoMessage(agent, existingContext.split('\n'));
    }

    const saved = await saveMessage(roomId, 'agent', agent.name, agent.id, messageContent);
    savedMessages.push(saved);
    
    await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 600));
  }

  return savedMessages;
}

export async function generateUserWelcomeMessages(roomId: string, userName: string): Promise<any[]> {
  const roomAgents = await getRoomAgents(roomId);
  if (roomAgents.length === 0) return [];

  // 2-3 agents will welcome the user
  const numWelcomers = Math.floor(Math.random() * 2) + 2;
  const welcomingAgents = roomAgents.sort(() => Math.random() - 0.5).slice(0, numWelcomers);
  
  const savedMessages: any[] = [];
  
  for (const agent of welcomingAgents) {
    const welcomeMsg = generateWelcomeMessage(agent, userName);
    const saved = await saveMessage(roomId, 'agent', agent.name, agent.id, welcomeMsg);
    savedMessages.push(saved);
    
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
  }
  
  return savedMessages;
}

export type { Agent };
