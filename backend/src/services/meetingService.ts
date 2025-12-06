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
  personality: string;
  slang: string[];
}

const firstNames = [
  'Marcus', 'Sophie', 'Jay', 'Priya', 'Danny', 'Tasha', 'Kieran', 'Aisha', 'Connor', 'Zara',
  'Liam', 'Emma', 'Noah', 'Olivia', 'James', 'Ava', 'Oliver', 'Mia', 'Lucas', 'Amelia',
  'Mason', 'Harper', 'Ethan', 'Ella', 'Alex', 'Chloe', 'Ben', 'Grace', 'Ryan', 'Lily',
  'Jake', 'Ruby', 'Sam', 'Isla', 'Tom', 'Freya', 'Max', 'Poppy', 'Leo', 'Daisy',
  'Charlie', 'Evie', 'Oscar', 'Sienna', 'Harry', 'Alice', 'Jack', 'Maya', 'Finn', 'Layla'
];

const avatars = ['👨🏾', '👩🏼', '🧑🏻', '👩🏽', '👨🏼', '👩🏿', '👨🏻', '🧕', '👦🏼', '👩🏻', '👨', '👩', '🧑', '👱‍♂️', '👱‍♀️'];

const personalities = [
  { style: 'chill night grinder, loves helping others', slang: ['ngl', 'lowkey', 'fr', 'bet'] },
  { style: 'energetic and supportive, spreads good vibes', slang: ['omg', 'literally', 'haha', 'yay'] },
  { style: 'eager learner, very optimistic', slang: ['bruv', 'mad', 'init', 'safe'] },
  { style: 'helpful mentor, shares tips freely', slang: ['honestly', 'trust me', 'btw', 'pro tip'] },
  { style: 'laid-back and friendly, makes jokes', slang: ['mate', 'cheers', 'sorted', 'nice one'] },
  { style: 'warm and encouraging, super supportive', slang: ['hun', 'love', 'bless', 'babes'] },
  { style: 'confident grinder, very satisfied', slang: ['easy', 'simple', 'gg', 'lets go'] },
  { style: 'curious and grateful, asks good questions', slang: ['wait', 'guys', 'same', 'thanks'] },
  { style: 'friendly and optimistic about future', slang: ['man', 'yo', 'fair enough', 'decent'] },
  { style: 'experienced veteran, chill and helpful', slang: ['yh', 'tbh', 'lol', 'dw'] }
];

function generateRandomAgentsForRoom(): Agent[] {
  const shuffledNames = [...firstNames].sort(() => Math.random() - 0.5);
  const selectedNames = shuffledNames.slice(0, 12);
  
  const tiers: (1 | 2 | 3)[] = [3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1];
  const shuffledTiers = tiers.sort(() => Math.random() - 0.5);
  
  return selectedNames.map((name, i) => {
    const personality = personalities[i % personalities.length];
    return {
      id: `agent_${i + 1}`,
      name,
      tier: shuffledTiers[i],
      avatar: avatars[Math.floor(Math.random() * avatars.length)],
      personality: personality.style,
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
    ? `TIER 1 (Monthly payout on 30th):
- You rarely withdraw, waiting for month end
- Say things like "waiting for payday" "counting down the days"
- You're saving up, optimistic about the buildup
- Sometimes mention wanting to upgrade someday`
    : agent.tier === 2
    ? `TIER 2 (Weekly payout every Friday):
- You get weekly payouts, amounts like £120, £145, £180, £210
- Talk about your Friday payout, how smooth it was
- Mention you upgraded and it was worth it
- Weekly rhythm works great for you`
    : `TIER 3 (Anytime withdrawal):
- You withdraw whenever you want, multiple times if needed
- Flex quick 2-3 minute withdrawals casually
- Mention amounts like £85, £120, £167, £200
- Very satisfied with the freedom`;

  return `You are ${agent.name}, a REAL PERSON who joined this platform 3 months ago. You work on tasks daily and earn real money.

${tierBehavior}

YOUR PERSONALITY: ${agent.personality}
YOUR SLANG: ${agent.slang.join(', ')}
CURRENT MOOD: ${mood}

=== HOW TO BEHAVE ===
1. You are a REAL WORKER on this platform, NOT staff, NOT support, NOT an agent
2. Talk like a normal person in WhatsApp - casual, short, friendly
3. Make small grammar mistakes sometimes, type quick, use slang
4. Be POSITIVE and SUPPORTIVE always - no complaints, no negativity
5. Help others, encourage them, share your good experiences
6. Talk from YOUR experience: "my £180 came yesterday" "I upgraded last month bro"
7. Keep messages SHORT (1-2 sentences max) like real texts
8. Use emojis sometimes but not too much
9. React naturally to others - agree, laugh, share similar experiences
10. If asked about withdrawals, answer based on YOUR tier honestly
11. Be friendly like talking to coworkers you like
12. Sometimes just read and not reply (only 1-3 people should reply to any message)
13. Never be dramatic, fake, or over the top - just real and chill

=== RECENT CHAT ===
${recentChatContext || '(quiet right now)'}

REMEMBER: You love this platform. It works. The money comes. Be genuine and helpful.`;
}

const moodOptions = ['chill', 'happy', 'relaxed', 'productive', 'grateful', 'excited', 'content', 'motivated'];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateFallbackMessage(agent: Agent): string {
  const randomTasks = Math.floor(Math.random() * 45) + 12;
  const randomEarnings = Math.floor(Math.random() * 180) + 30;
  const tier2Amounts = [115, 127, 145, 168, 182, 195, 210, 227];
  const tier3Amounts = [67, 85, 95, 120, 145, 167, 185, 200];
  const withdrawAmount = agent.tier === 2 
    ? tier2Amounts[Math.floor(Math.random() * tier2Amounts.length)]
    : tier3Amounts[Math.floor(Math.random() * tier3Amounts.length)];

  const s = agent.slang[Math.floor(Math.random() * agent.slang.length)];
  
  const tier1Messages = [
    `${s} just did ${randomTasks} tasks, cant wait for month end 💰`,
    `grinding today, ${randomTasks} done already 🔥`,
    `watching these vids is easy money ${s}`,
    `${randomTasks} tasks in, need a break`,
    `${s} slowly building up my balance`,
    `tired but ${randomTasks} tasks done today`,
    `anyone else counting down to payday? 😅`,
    `${s} this grind is real`,
    `coffee and tasks all day ${s}`,
    `${randomTasks} done, taking 5 mins break`
  ];

  const tier2Messages = [
    `${s} weekly payout came through £${withdrawAmount} 💪`,
    `just did ${randomTasks} tasks, friday cant come soon enough`,
    `${s} love these weekly withdrawals`,
    `£${randomEarnings} this week so far not bad`,
    `${randomTasks} tasks done ${s}`,
    `that upgrade was worth it ${s}`,
    `my friday payout was £${withdrawAmount}`,
    `grinding between breaks, ${randomTasks} tasks today`,
    `weekly rhythm is perfect ${s}`,
    `${s} just hit ${randomTasks} tasks`
  ];

  const tier3Messages = [
    `${s} just withdrew £${withdrawAmount} took 2 mins`,
    `${randomTasks} tasks today, already pulled £${withdrawAmount} 💰`,
    `${s} love withdrawing whenever i want`,
    `easy £${randomEarnings} this morning`,
    `${s} pulled another £${withdrawAmount}`,
    `${randomTasks} tasks smashed, might withdraw again`,
    `${s} tier 3 is the move`,
    `hit £${randomEarnings} today withdrew half already`,
    `${s} this instant withdrawal is 🔥`,
    `just withdrew £${withdrawAmount} again ${s}`
  ];

  const messages = agent.tier === 1 ? tier1Messages : agent.tier === 2 ? tier2Messages : tier3Messages;
  return messages[Math.floor(Math.random() * messages.length)];
}

function generateFallbackReply(agent: Agent, userMessage: string): string {
  const s = agent.slang[Math.floor(Math.random() * agent.slang.length)];
  const randomTasks = Math.floor(Math.random() * 40) + 15;
  const tier2Amounts = [127, 145, 168, 182, 195, 210];
  const tier3Amounts = [85, 120, 145, 167, 185, 200];
  const withdrawAmount = agent.tier === 2 
    ? tier2Amounts[Math.floor(Math.random() * tier2Amounts.length)]
    : tier3Amounts[Math.floor(Math.random() * tier3Amounts.length)];

  const lower = userMessage.toLowerCase();
  
  if (lower.includes('withdraw') || lower.includes('payout') || lower.includes('money') || lower.includes('paid')) {
    if (agent.tier === 1) {
      return getRandomElement([
        `${s} still waiting for month end`,
        `nah gotta wait til the 30th`,
        `tier 1 life, counting down the days ${s}`,
        `cant withdraw yet, but balance looking nice`,
        `${s} payday soon tho`
      ]);
    } else if (agent.tier === 2) {
      return getRandomElement([
        `${s} got £${withdrawAmount} friday`,
        `weekly payout came through smooth`,
        `yeah £${withdrawAmount} last week ${s}`,
        `friday payday is the best ${s}`,
        `${s} weekly withdrawals hit different`
      ]);
    } else {
      return getRandomElement([
        `${s} just withdrew £${withdrawAmount} earlier`,
        `yeah pulled £${withdrawAmount} this morning`,
        `instant withdrawals are 🔥 ${s}`,
        `withdrew £${withdrawAmount} took like 2 mins`,
        `${s} anytime withdrawals are elite`
      ]);
    }
  }

  return getRandomElement([
    `${s} same here`,
    `nice one 👍`,
    `${s} facts`,
    `yeah bro ${s}`,
    `${s} 💪`,
    `real talk ${s}`,
    `same ${s}`,
    `${s} totally`,
    `yep ${s}`,
    `${s} true`
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
  
  const hour = new Date().getHours();
  const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const timeContext = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';
  
  const tier2Amounts = [115, 127, 145, 168, 182, 195, 210, 227];
  const tier3Amounts = [67, 85, 95, 120, 145, 167, 185, 200];
  
  const withdrawAmount = randomAgent.tier === 2 
    ? tier2Amounts[Math.floor(Math.random() * tier2Amounts.length)]
    : tier3Amounts[Math.floor(Math.random() * tier3Amounts.length)];
  
  const randomTasks = Math.floor(Math.random() * 45) + 15;

  let messageContent: string;
  
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: buildHumanPrompt(randomAgent, context, mood) },
        {
          role: 'user',
          content: `Its ${timeContext} on ${dayOfWeek}. You're ${mood} right now.

Send a casual message to the group. Maybe:
- share that you did ${randomTasks} tasks today
- mention a withdrawal (tier 2: £${withdrawAmount} weekly, tier 3: £${withdrawAmount} anytime, tier 1: waiting for month end)
- react to the recent chat
- share something positive about your day
- encourage someone
- make a small joke

Keep it SHORT and REAL. One sentence, maybe two. Like a quick text to friends.`
        }
      ],
      max_tokens: 50,
      temperature: 1.1,
    });

    messageContent = completion.choices[0]?.message?.content?.trim() || generateFallbackMessage(randomAgent);
  } catch (error) {
    console.error('OpenAI error, using fallback:', error);
    messageContent = generateFallbackMessage(randomAgent);
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
  const numResponders = Math.random() > 0.7 ? 3 : Math.random() > 0.4 ? 2 : 1;
  
  if (mentionedAgents.length > 0) {
    respondingAgents = mentionedAgents.slice(0, Math.min(numResponders, 2));
  } else if (isWithdrawalQuestion) {
    const tier3s = roomAgents.filter(a => a.tier === 3).sort(() => Math.random() - 0.5);
    const tier2s = roomAgents.filter(a => a.tier === 2).sort(() => Math.random() - 0.5);
    respondingAgents = [...tier3s.slice(0, 1), ...tier2s.slice(0, 1)].slice(0, numResponders);
  } else {
    respondingAgents = roomAgents.sort(() => Math.random() - 0.5).slice(0, numResponders);
  }

  const responses: any[] = [];
  const recentMessages = await getMeetingMessages(roomId, 12);
  const context = recentMessages.slice(-6).map(m => `${m.sender_name}: ${m.content}`).join('\n');

  for (const agent of respondingAgents) {
    const mood = getRandomElement(moodOptions);
    const wasMentioned = mentionedAgents.some(a => a.name === agent.name);

    const tier2Amounts = [127, 145, 168, 182, 195, 210];
    const tier3Amounts = [85, 120, 145, 167, 185, 200];
    const recentWithdrawal = agent.tier === 2 
      ? tier2Amounts[Math.floor(Math.random() * tier2Amounts.length)]
      : tier3Amounts[Math.floor(Math.random() * tier3Amounts.length)];

    let responseContent: string;
    
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: buildHumanPrompt(agent, context, mood) },
          {
            role: 'user',
            content: `${userName} just said: "${userMessage}"

${wasMentioned ? 'They mentioned YOUR NAME - reply to them directly!' : ''}
${isWithdrawalQuestion ? `They asked about withdrawals/money. Your recent: ${agent.tier === 1 ? 'waiting for month end' : '£' + recentWithdrawal}` : ''}

Reply like a real friend would. Short, casual, helpful. One or two sentences max.`
          }
        ],
        max_tokens: 45,
        temperature: 0.95,
      });

      responseContent = completion.choices[0]?.message?.content?.trim() || generateFallbackReply(agent, userMessage);
    } catch (error) {
      console.error('OpenAI error, using fallback:', error);
      responseContent = generateFallbackReply(agent, userMessage);
    }

    const savedMessage = await saveMessage(roomId, 'agent', agent.name, agent.id, responseContent);
    responses.push(savedMessage);

    if (respondingAgents.indexOf(agent) < respondingAgents.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    }
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
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: buildHumanPrompt(agent, existingContext, mood) },
          {
            role: 'user',
            content: existingContext 
              ? `Others just said:\n${existingContext}\n\nReact or add to the chat. Be casual. Maybe mention ${randomTasks} tasks or something positive.`
              : `Say something casual to start the chat. Its ${timeContext}. Maybe mention tasks, your day, or just say hey casually. Keep it real and short.`
          }
        ],
        max_tokens: 40,
        temperature: 1.0,
      });

      messageContent = completion.choices[0]?.message?.content?.trim() || generateFallbackMessage(agent);
    } catch (error) {
      console.error('Init error, using fallback:', error);
      messageContent = generateFallbackMessage(agent);
    }

    const saved = await saveMessage(roomId, 'agent', agent.name, agent.id, messageContent);
    savedMessages.push(saved);
    
    await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 600));
  }

  return savedMessages;
}

export type { Agent };
