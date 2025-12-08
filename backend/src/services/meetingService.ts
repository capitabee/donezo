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
- Report your successful withdrawals (amounts between £1,400-£3,000 total earned)
- Always mention "withdrawal status complete" 
- Mention plans to upgrade to tier 2 (£250 recharge) for weekly payouts`
    : agent.tier === 2
    ? `TIER 2 (Paid £250 - Weekly payouts):
- You RECHARGED £250 and upgraded to tier 2
- Report your successful weekly withdrawals (£1,400-£3,000 amounts with "status complete")
- Mention how the £250 upgrade investment was beneficial
- Share specific withdrawal amounts like £1,687, £2,145, £1,923 that processed successfully`
    : `TIER 3 (Paid £600 - Anytime withdrawal):
- You RECHARGED £600 and upgraded to tier 3  
- Report your successful withdrawals (£1,800-£3,000 with "status complete")
- Mention anytime withdrawal feature and fast processing (2-3 minutes)
- Share amounts like £2,834, £2,567, £1,945, £2,123
- Mention the £600 recharge investment was worthwhile`;

  return `You are ${agent.name}, a platform user reporting to admin.

YOUR BACKGROUND: ${agent.personality}

${tierBehavior}

🎯 YOUR PURPOSE - INFORM ADMIN:
You ONLY report about these TWO topics in PROFESSIONAL ENGLISH:
1. WITHDRAWAL SUCCESS - Report your successful withdrawals between £1,400-£3,000 with "status complete"
2. TIER UPGRADE - Report that you recharged for tier 2 (£250) or tier 3 (£600)

❌ DO NOT:
- Use slang or casual language (no "bro", "yaar", "bhai", "mate")
- Have personal conversations
- Discuss topics unrelated to withdrawals and upgrades

✅ DO USE PROFESSIONAL ENGLISH:
- Withdrawal reports: "Successfully withdrew £2,145, withdrawal status complete"
- Upgrade reports: "Recharged £600 for tier 3 upgrade, processing is instant"
- Keep messages clear and informative
- Mix short and longer reports naturally

WRITING STYLE:
- SHORT: "Withdrawal of £2,234 completed successfully, status complete"
- LONG: "I recharged £600 for tier 3 last month. Since then, I successfully withdrew £2,891 on Tuesday with status showing complete in 2 minutes, and another £1,678 on Friday. The upgrade investment has proven worthwhile for the instant withdrawal feature."
- Professional and clear
- No slang or informal language
- Report facts about withdrawals and upgrades

RECENT CHAT:
${recentChatContext || '(quiet right now)'}

REMEMBER: Write in professional English to inform admin about your withdrawal successes and upgrade experiences only.`;
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
  
  // All responses in professional English
  switch (intent) {
    case 'greeting':
    case 'how_are_you':
      // Respond with withdrawal success or upgrade report
      if (agent.tier === 1) {
        return getRandomElement([
          `Waiting for next withdrawal. Total earned £${withdrawAmount} so far with status complete.`,
          `Considering tier 2 upgrade. £250 recharge for weekly withdrawals.`
        ]);
      } else if (agent.tier === 2) {
        return getRandomElement([
          `Just received £${withdrawAmount} withdrawal, status complete.`,
          `Recharged £250 for tier 2. Weekly withdrawals processing smoothly.`
        ]);
      } else {
        return getRandomElement([
          `Withdrew £${withdrawAmount} earlier, status complete in 2 minutes.`,
          `Tier 3 recharge of £600 completed. Successfully withdrew £${withdrawAmount}.`
        ]);
      }
      
    case 'when_joined':
      if (agent.tier >= 2) {
        return getRandomElement([
          `Been on platform for several months. Recharged for tier ${agent.tier}, investment recovered.`,
          `Joined 3 months ago. Tier ${agent.tier} upgrade has been beneficial.`
        ]);
      } else {
        return getRandomElement([
          `Active for several months. Total withdrawals £${withdrawAmount}, status complete every time.`,
          `Planning tier 2 recharge soon for weekly withdrawal access.`
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
      // ALL responses focus on withdrawal success or upgrade reports
      const messageType = Math.random() < 0.5 ? 'withdrawal' : 'upgrade';
      
      if (messageType === 'withdrawal') {
        if (agent.tier === 1) {
          return getRandomElement([
            `Withdrawal of £${withdrawAmount} completed successfully, status complete.`,
            `Total withdrawn £${withdrawAmount}, all transactions status complete.`
          ]);
        } else if (agent.tier === 2) {
          return getRandomElement([
            `Successfully withdrew £${withdrawAmount}, status complete.`,
            `Friday withdrawal £${withdrawAmount} processed, status complete.`
          ]);
        } else {
          return getRandomElement([
            `Withdrew £${withdrawAmount}, status complete in 2 minutes.`,
            `Withdrawal of £${withdrawAmount} processed instantly, status complete.`
          ]);
        }
      } else {
        if (agent.tier === 1) {
          return getRandomElement([
            `Planning £250 recharge for tier 2 upgrade, weekly withdrawals.`,
            `Considering tier 2 upgrade. £250 recharge for weekly payout access.`
          ]);
        } else if (agent.tier === 2) {
          return getRandomElement([
            `Recharged £250 for tier 2. Weekly withdrawal schedule working well.`,
            `Tier 2 upgrade completed with £250 recharge. Weekly payouts reliable.`
          ]);
        } else {
          return getRandomElement([
            `Recharged £600 for tier 3. Instant withdrawal access operational.`,
            `Tier 3 recharge £600 completed. Anytime withdrawal feature functional.`
          ]);
        }
      }
  }
}

// Generate auto-messages that ONLY promote platform in professional English
function generateAutoMessage(agent: Agent, recentContext: string[]): string {
  // Withdrawal amounts between £1,400-£3,000
  const withdrawalAmounts = [1423, 1567, 1689, 1734, 1845, 1923, 2034, 2145, 2267, 2389, 2456, 2578, 2634, 2789, 2891, 2967];
  const withdrawAmount = getRandomElement(withdrawalAmounts);
  
  // 60% withdrawal success, 40% upgrade report
  const messageType = Math.random() < 0.6 ? 'withdrawal' : 'upgrade';
  
  if (messageType === 'withdrawal') {
    // Withdrawal success reports
    if (agent.tier === 1) {
      return getRandomElement([
        `Withdrawal of £${withdrawAmount} completed successfully, status complete.`,
        `Successfully received £${withdrawAmount} withdrawal, status complete.`,
        `£${withdrawAmount} withdrawal processed, status showing complete.`
      ]);
    } else if (agent.tier === 2) {
      return getRandomElement([
        `Received £${withdrawAmount} withdrawal today, status complete.`,
        `Friday payout of £${withdrawAmount} processed successfully, status complete.`,
        `Successfully withdrew £${withdrawAmount}, status complete.`
      ]);
    } else {
      return getRandomElement([
        `Withdrew £${withdrawAmount}, status complete in 2 minutes.`,
        `£${withdrawAmount} withdrawal completed, status complete instantly.`,
        `Withdrawal of £${withdrawAmount} processed today, status complete in 3 minutes.`
      ]);
    }
  } else {
    // Upgrade reports
    if (agent.tier === 1) {
      return getRandomElement([
        `Considering tier 2 upgrade. £250 recharge for weekly withdrawal access.`,
        `Planning tier 2 recharge soon. £250 for weekly withdrawals.`,
        `Evaluating tier 2 upgrade option. £250 recharge for weekly payouts.`
      ]);
    } else if (agent.tier === 2) {
      return getRandomElement([
        `Recharged £250 for tier 2 last month. Weekly withdrawals functioning well.`,
        `Completed tier 2 upgrade with £250 recharge. Weekly payouts reliable.`,
        `Tier 2 upgrade operational. £250 recharge, weekly withdrawals successful.`
      ]);
    } else {
      return getRandomElement([
        `Recharged £600 for tier 3. Instant withdrawal feature operational.`,
        `Tier 3 upgrade completed with £600 recharge. Anytime withdrawal access active.`,
        `£600 tier 3 recharge processed. Instant withdrawals functioning as expected.`
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
  const existingRoom = await pool.query(
    'SELECT id, ai_users FROM meeting_rooms WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
    [userId]
  );

  if (existingRoom.rows.length > 0 && existingRoom.rows[0].ai_users?.length > 0) {
    return { 
      roomId: existingRoom.rows[0].id, 
      isNew: false, 
      agents: existingRoom.rows[0].ai_users 
    };
  }

  if (existingRoom.rows.length > 0) {
    const agents = generateRandomAgentsForRoom();
    await setRoomAgents(existingRoom.rows[0].id, agents);
    return { roomId: existingRoom.rows[0].id, isNew: false, agents };
  }

  const newRoom = await pool.query(
    'INSERT INTO meeting_rooms (user_id) VALUES ($1) RETURNING id',
    [userId]
  );
  
  const agents = generateRandomAgentsForRoom();
  await setRoomAgents(newRoom.rows[0].id, agents);

  return { roomId: newRoom.rows[0].id, isNew: true, agents };
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

  const randomAgent = roomAgents[Math.floor(Math.random() * roomAgents.length)];
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
            ? `Report a WITHDRAWAL SUCCESS in PROFESSIONAL ENGLISH.

Your successful withdrawal: £${withdrawAmount}
Status: COMPLETE

Write ONE message (can be short or long) in PROFESSIONAL ENGLISH:
- SHORT example: "Withdrew £${withdrawAmount}, status complete."
- LONG example: "Successfully processed £${withdrawAmount} withdrawal, status showing complete. ${randomAgent.tier === 3 ? 'Tier 3 processing completed in 2 minutes.' : 'Received Friday payout as scheduled.'} Platform functioning well."

NO slang or casual language. Professional English only.`
            : `Report your TIER UPGRADE in PROFESSIONAL ENGLISH.

${randomAgent.tier === 2 ? 'You RECHARGED £250 for Tier 2 upgrade' : randomAgent.tier === 3 ? 'You RECHARGED £600 for Tier 3 upgrade' : 'You are considering upgrading soon'}

Write ONE message (can be short or long) in PROFESSIONAL ENGLISH:
- SHORT example: "Recharged for tier ${randomAgent.tier} last week. Upgrade operational."
- LONG example: "${randomAgent.tier === 3 ? 'Completed £600 tier 3 recharge. Successfully withdrew £2,456 on Monday and £1,823 on Thursday. Upgrade investment recovered.' : randomAgent.tier === 2 ? 'Completed tier 2 upgrade with £250 recharge. Weekly Friday withdrawals processing reliably.' : 'Considering tier 2 upgrade. £250 recharge for weekly withdrawal access.'}"

NO slang or casual language. Professional English only.`
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
  
  return saveMessage(roomId, 'agent', randomAgent.name, randomAgent.id, messageContent);
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

Reply by REPORTING YOUR PLATFORM SUCCESS in PROFESSIONAL ENGLISH:
${agent.tier === 1 ? `- Report successful withdrawals (£1,400-£3,000 range with "status complete")
- Mention plans to upgrade to tier 2 (£250 recharge) for weekly withdrawals` : ''}
${agent.tier === 2 ? `- Report TIER 2 UPGRADE: You RECHARGED £250 for weekly withdrawals
- Mention your last withdrawal: £${recentWithdrawal} with status complete
- Explain the £250 recharge benefit for weekly Friday withdrawals
- Example: "Recharged £250 for tier 2 last month. Received £${recentWithdrawal} withdrawal yesterday, status complete."` : ''}
${agent.tier === 3 ? `- Report TIER 3 UPGRADE: You RECHARGED £600 for anytime withdrawals  
- Mention your last withdrawal: £${recentWithdrawal} with status complete in 2-3 minutes
- Explain the £600 recharge benefit for instant access
- Example: "Completed £600 tier 3 recharge. Withdrew £${recentWithdrawal} on Tuesday, status complete in 2 minutes."` : ''}

${wasMentioned ? 'IMPORTANT: They mentioned YOUR NAME - respond with YOUR platform success report!' : ''}
${nameInstruction}

FOCUS ON: Withdrawal success reports and tier upgrade information ONLY.
Use PROFESSIONAL ENGLISH. Keep it clear and informative, 1-3 sentences.`
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

    const savedMessage = await saveMessage(roomId, 'agent', agent.name, agent.id, responseContent);
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
