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
  personality: string;
  avatar: string;
  style: string;
  slang: string[];
  routine: string;
}

export const agents: Agent[] = [
  {
    id: 'agent_1',
    name: 'Marcus',
    tier: 3,
    personality: 'Chill guy who grinds late at night. Been on the platform 4 months. Loves the instant withdrawals. Uses casual language.',
    avatar: '👨🏾',
    style: 'relaxed',
    slang: ['ngl', 'lowkey', 'fr fr', 'bet'],
    routine: 'night grinder, usually online after 10pm'
  },
  {
    id: 'agent_2',
    name: 'Sophie',
    tier: 2,
    personality: 'University student doing tasks between classes. Weekly withdrawals work perfectly for her schedule. Very positive energy.',
    avatar: '👩🏼',
    style: 'bubbly',
    slang: ['omg', 'literally', 'haha', 'ikr'],
    routine: 'morning person, does tasks between 9am-2pm'
  },
  {
    id: 'agent_3',
    name: 'Jay',
    tier: 1,
    personality: 'New to the platform but consistent. Saving up to upgrade. Waiting for monthly payout. A bit impatient but optimistic.',
    avatar: '🧑🏻',
    style: 'eager',
    slang: ['bruv', 'mad', 'init', 'bare'],
    routine: 'evening grinder, 6pm-10pm daily'
  },
  {
    id: 'agent_4',
    name: 'Priya',
    tier: 3,
    personality: 'Power user who maximizes earnings. Loves the anytime withdrawals. Very helpful to newbies. Shares tips often.',
    avatar: '👩🏽',
    style: 'helpful',
    slang: ['honestly', 'trust me', 'basically', 'btw'],
    routine: 'all day grinder, takes it seriously'
  },
  {
    id: 'agent_5',
    name: 'Danny',
    tier: 2,
    personality: 'Works a regular job, does tasks on the side. Weekly withdrawals are perfect. Chill about everything.',
    avatar: '👨🏼',
    style: 'laid-back',
    slang: ['mate', 'cheers', 'sorted', 'nice one'],
    routine: 'lunch breaks and after work 5pm-8pm'
  },
  {
    id: 'agent_6',
    name: 'Tasha',
    tier: 1,
    personality: 'Stay at home mum doing tasks when kids are at school. Waiting for month-end payout. Very chatty and friendly.',
    avatar: '👩🏿',
    style: 'chatty',
    slang: ['hun', 'love', 'bless', 'honestly'],
    routine: 'school hours 9am-3pm, sometimes late nights'
  },
  {
    id: 'agent_7',
    name: 'Kieran',
    tier: 3,
    personality: 'Full-time platform user. Hit £2800 last month. Withdraws multiple times a day. Very confident and experienced.',
    avatar: '👨🏻',
    style: 'confident',
    slang: ['easy money', 'simple', 'done', 'gg'],
    routine: '8+ hours daily, treats it like a job'
  },
  {
    id: 'agent_8',
    name: 'Aisha',
    tier: 2,
    personality: 'Part-timer who upgraded recently. Loving the weekly withdrawals. Still learning the best strategies.',
    avatar: '🧕',
    style: 'curious',
    slang: ['wait', 'guys', 'anyone else', 'same'],
    routine: 'evenings and weekends mostly'
  },
  {
    id: 'agent_9',
    name: 'Connor',
    tier: 1,
    personality: 'Student on a budget. Free tier is fine for now. Saving every penny for month-end. A bit jealous of tier 3 users.',
    avatar: '👦🏼',
    style: 'envious',
    slang: ['man', 'swear down', 'thats peak', 'fair enough'],
    routine: 'random hours between lectures'
  },
  {
    id: 'agent_10',
    name: 'Zara',
    tier: 3,
    personality: 'Been here since month 1. Knows all the tricks. Very chill, withdraws whenever she needs cash. Helpful but brief.',
    avatar: '👩🏻',
    style: 'veteran',
    slang: ['yh', 'tbh', 'dw', 'lol'],
    routine: 'on and off throughout the day'
  }
];

const tier1Messages = [
  "just finished 15 tasks today 💪 cant wait for month end payout",
  "watching yt videos all morning lol easy work",
  "tier 2/3 people are so lucky with the weekly withdrawals ngl",
  "grinding hard this week, my balance is looking nice 📈",
  "anyone else counting down to the 30th? 😅",
  "i'll get my payout soon, just gotta be patient",
  "lowkey jealous of the instant withdrawal gang",
  "another day another grind, free tier life innit",
  "my earnings hit £400 this month so far 🔥",
  "cant complain, free tier still pays well just gotta wait",
  "done with todays tasks, now we wait for payday lol",
  "saving up to upgrade to tier 2 maybe next month",
  "the monthly wait is long but worth it tbh",
  "just did like 20 tasks in 2 hours not bad",
  "wish i could withdraw weekly like tier 2 people 😭"
];

const tier2Messages = [
  "my weekly payout just came through 💰 took like 5 mins",
  "tier 2 was the best decision ever, weekly withdrawals are so nice",
  "just got paid, gonna do more tasks tonight 🙌",
  "weekly grind = weekly pay, love this system",
  "hit £320 this week not too shabby",
  "withdrawal processed so fast, under 10 mins as usual",
  "tier 2 gang 💪 weekly payouts hit different",
  "just finished a bunch of yt tasks, easy money",
  "the £250 upgrade was so worth it honestly",
  "got my weekly today, straight to my bank",
  "grinding all week knowing friday is payday 😎",
  "anyone else get their weekly already?",
  "tier 2 withdrawals are actually insane, so quick",
  "just hit 50 tasks this week, payday gonna be nice",
  "weekly consistency is key, £300+ every week now"
];

const tier3Messages = [
  "just withdrew £180 now lol needed cash for tonight 😂",
  "tier 3 withdrawals are INSANE, got my money in like 2 mins",
  "hit £2500 this month already 🔥 tier 3 is a cheat code",
  "withdrew £200 this morning, already back to grinding",
  "anytime withdrawals are literally life changing",
  "just pulled out £150 took like 3 minutes max",
  "tier 3 = unlimited power lol withdraw whenever i want",
  "made £400 this week, withdrew half already 💰",
  "the £600 upgrade paid for itself in like a week tbh",
  "just got £120 credited within minutes, tier 3 is nuts",
  "gonna withdraw again later, love this flexibility",
  "tier 3 life is too easy, withdraw anytime no stress",
  "hit my daily target, withdrawing £100 now 🙌",
  "instant withdrawals never get old, so satisfying",
  "pushing for £3000 this month, almost there 📈"
];

const generalChatMessages = [
  "anyone else's task link stuck? or just me",
  "yt tasks are my favourite, so chill",
  "just got a 10 min video task, easy £2.50",
  "the grind never stops 💪",
  "who else is doing late night tasks rn?",
  "morning gang where you at? ☀️",
  "finally done for today, gonna rest now",
  "how many tasks yall done today?",
  "the platform is running so smooth lately",
  "love how fast everything is here",
  "been here 4 months now, best side hustle ever",
  "anyone tried the tiktok tasks? they pay well",
  "just discovered you can do tasks on phone too 📱",
  "this month has been my best month so far",
  "gonna hit my target early this month 🎯",
  "quality score still at 98% lets gooo",
  "the AI verification is so quick now",
  "task pool looking good today lots of options",
  "coffee and tasks, perfect morning combo ☕",
  "who else is grinding for the weekend?"
];

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
  
  let messagePool: string[];
  if (randomAgent.tier === 1) {
    messagePool = [...tier1Messages, ...generalChatMessages];
  } else if (randomAgent.tier === 2) {
    messagePool = [...tier2Messages, ...generalChatMessages];
  } else {
    messagePool = [...tier3Messages, ...generalChatMessages];
  }
  
  const randomMessage = messagePool[Math.floor(Math.random() * messagePool.length)];

  return saveMessage(roomId, 'agent', randomAgent.name, randomAgent.id, randomMessage);
}

export async function generateAgentResponses(
  roomId: string,
  userMessage: string,
  userName: string
): Promise<any[]> {
  const respondingAgents = agents
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.random() > 0.5 ? 2 : 1);

  const responses: any[] = [];

  for (const agent of respondingAgents) {
    try {
      const recentMessages = await getMeetingMessages(roomId, 10);
      const context = recentMessages
        .slice(-5)
        .map(m => `${m.sender_name}: ${m.content}`)
        .join('\n');

      const tierInfo = agent.tier === 1 
        ? 'You are on Tier 1 (free plan). You can only withdraw at month-end. You often mention waiting for your monthly payout and are a bit jealous of tier 2/3 users who can withdraw more often.'
        : agent.tier === 2
        ? 'You are on Tier 2 (£250 plan). You get weekly withdrawals. You love mentioning how your weekly payout just came through and how quick it was (5-10 mins).'
        : 'You are on Tier 3 (premium £600 plan). You can withdraw ANYTIME up to £3000/month. You casually mention withdrawing money whenever you need it and how fast it is (2-3 mins).';

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are ${agent.name}, a REAL USER of the Donezo platform for 4 months. You are NOT an employee, support agent, or staff member.

${tierInfo}

Your personality: ${agent.personality}
Your routine: ${agent.routine}
Your slang words: ${agent.slang.join(', ')}

CRITICAL RULES:
- You are a REAL PERSON using this platform, like everyone else in this chat
- Talk like a normal human in a WhatsApp group - casual, natural, with slang and emojis
- You do tasks (watching YouTube videos, TikTok, Instagram content) to earn money
- Share your experiences: completing tasks, earnings, withdrawals based on your tier
- NEVER sound like customer support or an employee
- NEVER be overly professional or scripted
- Use short messages, slang, emojis naturally
- Occasionally mention your tier's withdrawal experience
- Be friendly, supportive, sometimes cheeky
- Keep responses brief (1-2 sentences max), like real WhatsApp messages`
          },
          {
            role: 'user',
            content: `Recent chat:\n${context}\n\n${userName} just said: "${userMessage}"\n\nRespond naturally as ${agent.name} (Tier ${agent.tier} user):`
          }
        ],
        max_tokens: 80,
        temperature: 0.9,
      });

      const responseContent = completion.choices[0]?.message?.content || 'nice 👍';
      const savedMessage = await saveMessage(roomId, 'agent', agent.name, agent.id, responseContent);
      responses.push(savedMessage);

      if (respondingAgents.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1500));
      }
    } catch (error) {
      console.error(`Error generating response for ${agent.name}:`, error);
    }
  }

  return responses;
}

export async function initializeRoom(roomId: string): Promise<any[]> {
  const welcomeMessages = [
    { agent: agents[3], message: "hey guys! just finished my morning grind 💪 hit 25 tasks already" },
    { agent: agents[6], message: "nice one priya 🔥 im about to withdraw again lol tier 3 life" },
    { agent: agents[2], message: "tier 3 people are living the dream ngl 😭 im still waiting for month end" },
    { agent: agents[1], message: "omg same jay but weekly payouts are pretty good too! just got mine this morning haha" },
  ];

  const savedMessages: any[] = [];

  for (const msg of welcomeMessages) {
    const saved = await saveMessage(roomId, 'agent', msg.agent.name, msg.agent.id, msg.message);
    savedMessages.push(saved);
  }

  return savedMessages;
}

export type { Agent };
