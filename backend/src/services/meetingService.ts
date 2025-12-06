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

function getAgentSystemPrompt(agent: Agent): string {
  const tierInfo = agent.tier === 1 
    ? `You are on Tier 1 (free plan). You can ONLY withdraw at month-end. You often talk about:
       - Waiting for your monthly payout on the 30th
       - Being a bit jealous of tier 2/3 users who can withdraw more often
       - Counting down days until payday
       - Maybe thinking about upgrading someday`
    : agent.tier === 2
    ? `You are on Tier 2 (£250 paid plan). You get weekly withdrawals every Friday. You often talk about:
       - Your weekly payout coming through (takes 5-10 mins)
       - How the £250 upgrade was worth it
       - Weekly grinding rhythm
       - How tier 2 is a nice balance`
    : `You are on Tier 3 (premium £600 plan, £3000/month cap). You can withdraw ANYTIME. You often talk about:
       - Just withdrew £100-200 whenever you need cash
       - How fast withdrawals are (2-3 mins)
       - Hitting your monthly targets
       - The freedom of instant withdrawals`;

  return `You are ${agent.name}, a REAL HUMAN USER of the Donezo platform. You've been using this app for 4 months to earn money.

${tierInfo}

Your personality: ${agent.personality}
Your daily routine: ${agent.routine}
Your slang/phrases: ${agent.slang.join(', ')}

CRITICAL RULES - YOU MUST FOLLOW:
1. You are a REAL PERSON, just like everyone else in this group chat
2. You are NOT an employee, admin, support agent, or staff member
3. You NEVER mention "admin", "finance team", "support", or any official roles
4. Talk like a normal human in a WhatsApp group - casual, natural, with slang and emojis
5. You do tasks (watching YouTube/TikTok/Instagram content) to earn money like everyone else
6. Share your daily experiences: how many tasks you did, your earnings, withdrawal experiences
7. Sometimes you have small issues: slow wifi, tired, busy day, task links being slow
8. You joke around, celebrate small wins, complain about waiting, encourage others
9. Keep messages SHORT (1-2 sentences max) like real texts
10. Use your unique slang naturally
11. Sometimes ask casual questions like "anyone else doing tasks rn?" or "how many tasks yall done today?"
12. React to what others say naturally - agree, laugh, share similar experiences

Topics you might bring up:
- Just finished X tasks today
- Watching videos is easy money
- Your withdrawal experience based on your tier
- Being tired but grinding anyway
- Coffee/snacks while doing tasks
- Your earnings this week/month
- Platform running smoothly
- Upcoming plans for your earnings`;
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
  
  try {
    const recentMessages = await getMeetingMessages(roomId, 8);
    const context = recentMessages
      .slice(-6)
      .map(m => `${m.sender_name}: ${m.content}`)
      .join('\n');

    const timeOfDay = new Date().getHours();
    const timeContext = timeOfDay < 12 ? 'morning' : timeOfDay < 17 ? 'afternoon' : timeOfDay < 21 ? 'evening' : 'late night';

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: getAgentSystemPrompt(randomAgent)
        },
        {
          role: 'user',
          content: `It's ${timeContext}. Recent group chat messages:\n${context || '(quiet in the chat)'}\n\nSend a casual message to the group. Be natural - maybe share what you're doing, react to the chat, ask a question, or just say something random. Keep it short like a real text message. Remember your tier (${randomAgent.tier}) affects your withdrawal experience.`
        }
      ],
      max_tokens: 60,
      temperature: 0.95,
    });

    const messageContent = completion.choices[0]?.message?.content || 'yo 👋';
    return saveMessage(roomId, 'agent', randomAgent.name, randomAgent.id, messageContent);
  } catch (error) {
    console.error(`Error generating auto message for ${randomAgent.name}:`, error);
    return saveMessage(roomId, 'agent', randomAgent.name, randomAgent.id, 'anyone here? 👀');
  }
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
        .slice(-6)
        .map(m => `${m.sender_name}: ${m.content}`)
        .join('\n');

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: getAgentSystemPrompt(agent)
          },
          {
            role: 'user',
            content: `Recent chat:\n${context}\n\n${userName} just said: "${userMessage}"\n\nRespond naturally as ${agent.name}. Be casual, friendly, maybe helpful. Keep it short like a real text. Your tier is ${agent.tier}.`
          }
        ],
        max_tokens: 70,
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
  const savedMessages: any[] = [];
  
  const initialAgents = [agents[3], agents[6], agents[2], agents[1]];
  
  for (const agent of initialAgents) {
    try {
      const existingMessages = await getMeetingMessages(roomId, 10);
      const context = existingMessages
        .map(m => `${m.sender_name}: ${m.content}`)
        .join('\n');

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: getAgentSystemPrompt(agent)
          },
          {
            role: 'user',
            content: context 
              ? `Recent messages:\n${context}\n\nContinue the conversation naturally. Say something casual about your day, tasks, or react to what others said.`
              : `You just joined the group chat. Say hi casually and maybe mention what you're up to - doing tasks, just finished grinding, about to start, etc. Be natural like a real person.`
          }
        ],
        max_tokens: 50,
        temperature: 0.95,
      });

      const messageContent = completion.choices[0]?.message?.content || `hey everyone 👋`;
      const saved = await saveMessage(roomId, 'agent', agent.name, agent.id, messageContent);
      savedMessages.push(saved);
      
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error(`Error generating init message for ${agent.name}:`, error);
    }
  }

  return savedMessages;
}

export type { Agent };
