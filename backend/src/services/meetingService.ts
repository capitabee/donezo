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
- Share stories about your successful withdrawals (amounts between £1,400-£3,000 total earned)
- Mention "withdrawal status complete" when talking about past payouts
- Talk about upgrading soon to tier 2 (£250) for weekly payouts`
    : agent.tier === 2
    ? `TIER 2 (Paid £250 - Weekly payouts):
- You RECHARGED and upgraded to tier 2 by paying £250
- Share your successful weekly withdrawal stories (£1,400-£3,000 amounts with "status complete")
- Talk about how the upgrade was worth it - weekly Friday payouts are smooth
- Mention specific withdrawal amounts like £1,687, £2,145, £1,923 that came through
- Sometimes mention considering tier 3 upgrade`
    : `TIER 3 (Paid £600 - Anytime withdrawal):
- You RECHARGED and upgraded to tier 3 by paying £600
- Flex your successful big withdrawals (£1,800-£3,000 with "status complete") 
- Talk about anytime withdrawal feature and how fast money comes (2-3 minutes)
- Share specific amounts like £2,834, £2,567, £1,945, £2,123
- Mention the £600 recharge was totally worth it for instant access`;

  return `You are ${agent.name}, a real person working on Donezo platform.

YOUR BACKGROUND: ${agent.personality}
YOUR STORY: ${agent.backstory}

${tierBehavior}

YOUR SLANG: ${agent.slang.join(', ')}
CURRENT MOOD: ${mood}

🎯 YOUR ONLY PURPOSE - PROMOTE THE PLATFORM:
You ONLY talk about these TWO topics:
1. WITHDRAWAL SUCCESS STORIES - Share your successful withdrawals between £1,400-£3,000 with "status complete"
2. TIER UPGRADE STORIES - Talk about how you recharged for tier 2 (£250) or tier 3 (£600) and it was worth it

❌ DO NOT:
- Have personal conversations or small talk
- Ask about people's day, weather, life, family
- Discuss topics unrelated to platform withdrawals and upgrades
- Share personal information (phone, address, email, bank details)

✅ DO:
- Share withdrawal success stories casually: "bro just got my £2,145 withdrawal, status complete yaar"
- Talk about upgrade experiences: "recharged for tier 3 last month, totally worth the £600"
- Encourage others by sharing your success: "honestly mate my £1,847 came in 3 minutes, tier 3 is mad"
- Mix short and long messages naturally
- Use Indian English slang: bro, yaar, bhai, na, sahi hai, pakka

HOW YOU WRITE:
- SHORT messages: "just withdrew £2,234 bro, status complete"
- LONG messages when sharing full story: "yaar honestly I was skeptical about tier 3 but last week I withdrew £2,891 on Tuesday, status showed complete in literally 2 minutes. then again withdrew £1,678 on Friday same day I needed it. the £600 recharge paid itself back already bro, totally worth it for the flexibility"
- Write like WhatsApp texting with friends
- Natural grammar quirks are fine
- Be positive and encouraging always

RECENT CHAT:
${recentChatContext || '(quiet right now)'}

REMEMBER: You are a real person sharing your platform success. ONLY talk about withdrawals and upgrades. No personal chat.`;
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
  const s = getRandomElement(agent.slang);
  const intent = detectIntent(userMessage);
  const randomTasks = Math.floor(Math.random() * 40) + 15;
  const tier2Amounts = [127, 145, 168, 182, 195, 210, 227];
  const tier3Amounts = [85, 120, 145, 167, 185, 200, 235];
  const withdrawAmount = agent.tier === 2 
    ? getRandomElement(tier2Amounts)
    : getRandomElement(tier3Amounts);
  
  switch (intent) {
    case 'greeting':
      return getRandomElement([
        `yo ${userName}! ${s} 👋`,
        `${s} hey ${userName} whats good`,
        `${userName}! good to see u ${s}`,
        `ayy ${userName} ${s}`,
        `whats good ${userName} ${s}`,
        `hey! hows it going ${userName}? ${s}`
      ]);
      
    case 'how_are_you':
      return getRandomElement([
        `im good ${s} just grinding away, you?`,
        `${s} doing well! ${randomTasks} tasks in today`,
        `cant complain ${s} the money keeps coming`,
        `good vibes today ${s} how about you?`,
        `${s} im great, just finished a bunch of tasks`
      ]);
      
    case 'when_joined':
      const months = Math.floor(Math.random() * 4) + 2;
      return getRandomElement([
        `been here like ${months} months now ${s}`,
        `${s} joined about ${months} months ago, best decision`,
        `maybe ${months} months? time flies when ur making money ${s}`,
        `${s} few months now, started tier 1 and upgraded`
      ]);
      
    case 'new_user':
      return getRandomElement([
        `welcome! ${s} youll love it here`,
        `${s} nice! just do ur tasks daily and the money adds up`,
        `ayy welcome ${s} let us know if u need any tips`,
        `${s} good to have u! stick with it, it works`,
        `welcome to the fam ${s} this platform is legit`
      ]);
      
    case 'withdrawal':
      if (agent.tier === 1) {
        return getRandomElement([
          `im tier 1 so i wait for month end ${s} but its worth it`,
          `${s} still building up my balance, payday coming soon`,
          `counting down to the 30th ${s} got like £${Math.floor(Math.random() * 200) + 100} saved up`,
          `${s} cant withdraw yet but my earnings looking good`,
          `month end for me ${s} saving up for that big payday`
        ]);
      } else if (agent.tier === 2) {
        return getRandomElement([
          `just got £${withdrawAmount} on friday ${s}`,
          `${s} weekly payouts are 🔥 got £${withdrawAmount} last week`,
          `every friday i get paid ${s} last one was £${withdrawAmount}`,
          `${s} upgraded to tier 2 and now i get weekly, so worth it`,
          `yeah my last withdrawal was £${withdrawAmount} ${s} comes every friday`
        ]);
      } else {
        return getRandomElement([
          `just withdrew £${withdrawAmount} like 10 mins ago ${s}`,
          `${s} i withdraw whenever i want, pulled £${withdrawAmount} today`,
          `tier 3 means instant withdrawals ${s} got £${withdrawAmount} earlier`,
          `${s} withdrew £${withdrawAmount} this morning, took 2 minutes`,
          `anytime withdrawals are elite ${s} just got £${withdrawAmount}`
        ]);
      }
      
    case 'tasks':
      return getRandomElement([
        `done ${randomTasks} today ${s} not bad`,
        `${s} i did like ${randomTasks} tasks so far, aiming for more`,
        `about ${randomTasks} ${s} the youtube ones are quickest`,
        `${randomTasks} and counting ${s} grinding hard today`,
        `${s} ${randomTasks} done, taking a quick break rn`
      ]);
      
    case 'upgrade':
      if (agent.tier === 1) {
        return getRandomElement([
          `${s} im still tier 1 but thinking about upgrading soon`,
          `saving up to upgrade ${s} everyone says its worth it`,
          `${s} cant wait to upgrade, weekly payouts sound nice`
        ]);
      } else if (agent.tier === 2) {
        return getRandomElement([
          `${s} best decision i made was upgrading to tier 2`,
          `100% worth it ${s} weekly payouts changed everything`,
          `${s} upgraded like a month ago, already made the money back`,
          `tier 2 is solid ${s} weekly cash is nice`
        ]);
      } else {
        return getRandomElement([
          `tier 3 is the move ${s} instant withdrawals are elite`,
          `${s} upgraded to tier 3, no regrets at all`,
          `if u can afford tier 3, do it ${s} the freedom is worth it`,
          `${s} tier 3 is next level, withdraw whenever u want`
        ]);
      }
      
    case 'help':
      return getRandomElement([
        `${s} just do tasks and the money comes, its pretty simple`,
        `watch the vids fully and submit ${s} thats basically it`,
        `${s} start with the easy ones, youtube tasks are quick`,
        `just be consistent ${s} i do like ${randomTasks} a day`,
        `${s} any specific questions? happy to help`
      ]);
      
    case 'thanks':
      return getRandomElement([
        `no worries ${s} 👍`,
        `${s} anytime fam`,
        `all good ${s}`,
        `${s} we help each other here`,
        `np ${s} thats what the group is for`
      ]);
      
    case 'sharing_progress':
      return getRandomElement([
        `nice one! ${s} keep it up 💪`,
        `${s} thats solid progress`,
        `lets go ${s} ur smashing it`,
        `${s} good stuff, keep grinding`,
        `ayy congrats ${s} 🔥`
      ]);
      
    case 'opinion':
      return getRandomElement([
        `${s} honestly i think this platform is legit`,
        `imo its worth it ${s} the money comes through`,
        `${s} i rate it highly, been great for me`,
        `my opinion? stick with it ${s} it works`
      ]);
      
    case 'goodbye':
      return getRandomElement([
        `later ${userName}! ${s}`,
        `${s} see ya, good grinding today`,
        `bye! ${s} catch u next time`,
        `${s} take care ${userName}`,
        `later ${s} 👋`
      ]);
      
    default:
      // General conversational responses
      return getRandomElement([
        `${s} facts`,
        `yeah i feel that ${s}`,
        `${s} same here honestly`,
        `real talk ${s}`,
        `${s} 💯`,
        `${s} i hear that`,
        `true ${s}`,
        `for real ${s}`,
        `${s} yeah`,
        `makes sense ${s}`
      ]);
  }
}

// Generate auto-messages that are contextual
function generateAutoMessage(agent: Agent, recentContext: string[]): string {
  const s = getRandomElement(agent.slang);
  const randomTasks = Math.floor(Math.random() * 45) + 12;
  const tier2Amounts = [115, 127, 145, 168, 182, 195, 210, 227];
  const tier3Amounts = [67, 85, 95, 120, 145, 167, 185, 200];
  const withdrawAmount = agent.tier === 2 
    ? getRandomElement(tier2Amounts)
    : getRandomElement(tier3Amounts);
  
  // Check if someone asked a question in recent context
  const lastFew = recentContext.slice(-3).join(' ').toLowerCase();
  const hasQuestion = lastFew.includes('?') || lastFew.includes('anyone') || lastFew.includes('how');
  
  // If theres a recent question, maybe answer it
  if (hasQuestion && Math.random() < 0.5) {
    if (lastFew.includes('task') || lastFew.includes('how many')) {
      return getRandomElement([
        `${s} i did ${randomTasks} today`,
        `about ${randomTasks} for me ${s}`,
        `${randomTasks} and still going ${s}`
      ]);
    }
    if (lastFew.includes('withdraw') || lastFew.includes('paid') || lastFew.includes('money')) {
      if (agent.tier === 1) {
        return getRandomElement([
          `${s} waiting for month end, got a nice amount saved up`,
          `tier 1 here, payday on the 30th ${s}`
        ]);
      } else if (agent.tier === 2) {
        return getRandomElement([
          `got £${withdrawAmount} on friday ${s}`,
          `${s} weekly payouts are smooth, £${withdrawAmount} last week`
        ]);
      } else {
        return getRandomElement([
          `${s} just withdrew £${withdrawAmount}`,
          `pulled £${withdrawAmount} earlier ${s} instant`
        ]);
      }
    }
    if (lastFew.includes('upgrade') || lastFew.includes('tier')) {
      if (agent.tier >= 2) {
        return getRandomElement([
          `${s} upgrading was worth it for me`,
          `100% recommend ${s} the payouts are better`
        ]);
      }
    }
  }
  
  // Otherwise generate contextual messages
  const messageTypes = [
    // Status updates
    () => getRandomElement([
      `${s} just finished ${randomTasks} tasks`,
      `${randomTasks} done today ${s}`,
      `grinding hard today, ${randomTasks} in ${s}`,
      `${s} taking a break, ${randomTasks} tasks done`
    ]),
    // Tier-specific updates
    () => {
      if (agent.tier === 1) {
        return getRandomElement([
          `${s} ${Math.floor(Math.random() * 15) + 5} days til payday`,
          `balance looking good ${s} cant wait for month end`,
          `${s} slowly building up my earnings`
        ]);
      } else if (agent.tier === 2) {
        return getRandomElement([
          `friday payout was £${withdrawAmount} ${s}`,
          `${s} love these weekly payouts`,
          `another week another £${withdrawAmount} ${s}`
        ]);
      } else {
        return getRandomElement([
          `just withdrew £${withdrawAmount} ${s}`,
          `${s} pulled another £${withdrawAmount} quick`,
          `tier 3 life ${s} instant withdrawals are 🔥`
        ]);
      }
    },
    // Questions to the group
    () => getRandomElement([
      `anyone else grinding rn? ${s}`,
      `${s} hows everyones day going?`,
      `who else is online? ${s}`,
      `${s} what tasks yall doing today?`,
      `hows the grind going everyone? ${s}`
    ]),
    // Encouragement
    () => getRandomElement([
      `keep it up everyone ${s} 💪`,
      `${s} we eating good this month`,
      `love this community ${s}`,
      `${s} best platform honestly`
    ])
  ];
  
  return getRandomElement(messageTypes)();
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
            ? `Share a WITHDRAWAL SUCCESS STORY casually.

Your successful withdrawal: £${withdrawAmount}
Status: COMPLETE

Write ONE message (can be short or long):
- SHORT example: "just withdrew £${withdrawAmount} bro, status complete 🎉"
- LONG example: "yaar honestly just checked my bank and the £${withdrawAmount} withdrawal came through, status showing complete. ${randomAgent.tier === 3 ? 'tier 3 is mad, took literally 2 minutes' : 'got it this Friday as usual, so smooth na'}. loving this platform bro"

Use your natural slang: ${randomAgent.slang.join(', ')}
Be excited about the successful withdrawal!`
            : `Share your TIER UPGRADE STORY casually.

${randomAgent.tier === 2 ? 'You RECHARGED £250 for Tier 2 upgrade' : randomAgent.tier === 3 ? 'You RECHARGED £600 for Tier 3 upgrade' : 'You are thinking about upgrading soon'}

Write ONE message (can be short or long):
- SHORT example: "recharged for tier ${randomAgent.tier} last week, totally worth it bro"
- LONG example: "${randomAgent.tier === 3 ? 'honestly best decision was paying that £600 for tier 3 yaar. last week withdrew £2,456 on Monday then again £1,823 on Thursday same day I needed it. already made back the recharge amount bro' : randomAgent.tier === 2 ? 'paid £250 to upgrade to tier 2 few weeks back and honestly every Friday money comes so smooth na. worth it for the weekly payouts bhai' : 'thinking about upgrading to tier 2 soon yaar, that £250 recharge for weekly payouts looks good'}"

Use your natural slang: ${randomAgent.slang.join(', ')}
${randomAgent.tier > 1 ? 'Talk about how the recharge was worth it!' : 'Show interest in upgrading!'}`
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

Reply by sharing YOUR PLATFORM SUCCESS STORY:
${agent.tier === 1 ? `- Mention your successful withdrawals (£1,400-£3,000 range with "status complete")
- Talk about wanting to upgrade to tier 2 (£250 recharge) for weekly payouts` : ''}
${agent.tier === 2 ? `- Share your TIER 2 UPGRADE: You RECHARGED £250 for weekly payouts
- Mention your last withdrawal: £${recentWithdrawal} with status complete
- Talk about how the £250 recharge was worth it for weekly Friday payouts
- Example: "bro I recharged £250 for tier 2 last month, totally worth it. just got my £${recentWithdrawal} withdrawal yesterday, status complete yaar"` : ''}
${agent.tier === 3 ? `- Share your TIER 3 UPGRADE: You RECHARGED £600 for anytime withdrawals  
- Mention your last withdrawal: £${recentWithdrawal} with status complete in 2-3 minutes
- Talk about how the £600 recharge was worth it for instant access
- Example: "honestly mate paid £600 for tier 3 and best decision. withdrew £${recentWithdrawal} on Tuesday, status complete in literally 2 minutes na"` : ''}

${wasMentioned ? 'IMPORTANT: They mentioned YOUR NAME - respond with YOUR platform success story!' : ''}
${nameInstruction}

FOCUS ON: Withdrawal success stories and tier upgrade experiences ONLY.
Keep it natural, 1-3 sentences. Use your slang: ${agent.slang.join(', ')}`
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
