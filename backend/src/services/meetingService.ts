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
  quirks: string[];
}

export const agents: Agent[] = [
  {
    id: 'agent_1',
    name: 'Marcus',
    tier: 3,
    personality: 'Chill night owl who grinds after midnight. Confident about his earnings. Sometimes brags about withdrawals.',
    avatar: '👨🏾',
    style: 'relaxed and cool',
    slang: ['ngl', 'lowkey', 'fr fr', 'bet', 'ayo'],
    routine: 'night grinder 10pm-3am',
    quirks: ['drinks energy drinks', 'plays music while working', 'sometimes falls asleep mid-task']
  },
  {
    id: 'agent_2',
    name: 'Sophie',
    tier: 2,
    personality: 'Energetic uni student. Very chatty and supportive. Gets excited about weekly payouts.',
    avatar: '👩🏼',
    style: 'bubbly and enthusiastic',
    slang: ['omg', 'literally', 'haha', 'ikr', 'bestie', 'slay'],
    routine: 'morning sessions 9am-2pm between lectures',
    quirks: ['drinks too much coffee', 'procrastinates assignments', 'celebrates small wins loudly']
  },
  {
    id: 'agent_3',
    name: 'Jay',
    tier: 1,
    personality: 'Eager newcomer saving up. A bit impatient waiting for monthly payout. Asks lots of questions.',
    avatar: '🧑🏻',
    style: 'curious and eager',
    slang: ['bruv', 'mad', 'init', 'bare', 'fam', 'peak'],
    routine: 'evening grinder 6pm-10pm',
    quirks: ['always eating snacks', 'complains about waiting', 'dreams about upgrading to tier 3']
  },
  {
    id: 'agent_4',
    name: 'Priya',
    tier: 3,
    personality: 'Power user and unofficial mentor. Shares tips freely. Flexes earnings sometimes.',
    avatar: '👩🏽',
    style: 'helpful and experienced',
    slang: ['honestly', 'trust me', 'basically', 'btw', 'pro tip'],
    routine: 'all day 8am-8pm serious grinder',
    quirks: ['tracks everything in spreadsheets', 'gives advice even when not asked', 'competitive about daily targets']
  },
  {
    id: 'agent_5',
    name: 'Danny',
    tier: 2,
    personality: 'Chill office worker doing tasks on breaks. Never stressed. Enjoys the extra income.',
    avatar: '👨🏼',
    style: 'laid-back and easygoing',
    slang: ['mate', 'cheers', 'sorted', 'nice one', 'proper'],
    routine: 'lunch breaks and after work 5pm-8pm',
    quirks: ['hides phone from boss', 'always multitasking', 'makes dad jokes']
  },
  {
    id: 'agent_6',
    name: 'Tasha',
    tier: 1,
    personality: 'Friendly mum working during school hours. Patient but excited for month-end. Very supportive.',
    avatar: '👩🏿',
    style: 'warm and motherly',
    slang: ['hun', 'love', 'bless', 'honestly', 'babes'],
    routine: 'school hours 9am-3pm, rare late nights',
    quirks: ['interrupted by kids sometimes', 'makes tea constantly', 'counts down to payday']
  },
  {
    id: 'agent_7',
    name: 'Kieran',
    tier: 3,
    personality: 'Full-time platform warrior. Treats it like a job. Flexes his £2800+ months.',
    avatar: '👨🏻',
    style: 'confident and competitive',
    slang: ['easy', 'simple', 'done', 'gg', 'lets go'],
    routine: '8-10 hours daily like clockwork',
    quirks: ['obsessed with hitting targets', 'withdraws multiple times daily', 'humble brags constantly']
  },
  {
    id: 'agent_8',
    name: 'Aisha',
    tier: 2,
    personality: 'Recently upgraded, still learning. Asks for advice. Excited about weekly payouts.',
    avatar: '🧕',
    style: 'curious and grateful',
    slang: ['wait', 'guys', 'same here', 'really?', 'thanks'],
    routine: 'evenings and weekends',
    quirks: ['double-checks everything', 'nervous about making mistakes', 'celebrates every withdrawal']
  },
  {
    id: 'agent_9',
    name: 'Connor',
    tier: 1,
    personality: 'Broke student grinding for pocket money. Bit jealous of premium users. Complains sometimes.',
    avatar: '👦🏼',
    style: 'sarcastic but friendly',
    slang: ['man', 'swear down', 'thats peak', 'fair enough', 'ffs'],
    routine: 'random hours, skips some lectures for tasks',
    quirks: ['always broke', 'jealous of tier 3', 'motivates himself out loud']
  },
  {
    id: 'agent_10',
    name: 'Zara',
    tier: 3,
    personality: 'OG user since day one. Knows everything. Chill and helpful but brief.',
    avatar: '👩🏻',
    style: 'veteran and unbothered',
    slang: ['yh', 'tbh', 'dw', 'lol', 'np'],
    routine: 'comes and goes throughout day',
    quirks: ['gives short answers', 'casually mentions big withdrawals', 'never stressed']
  }
];

const randomMoods = ['energetic', 'tired', 'excited', 'chill', 'focused', 'distracted', 'hungry', 'bored', 'motivated', 'sleepy'];
const randomActivities = [
  'just finished a batch of tasks',
  'taking a quick break',
  'about to start grinding',
  'watching a long video task',
  'eating while doing tasks',
  'multitasking with other stuff',
  'checking earnings',
  'waiting for a task to load',
  'just woke up',
  'about to sleep soon',
  'drinking coffee/tea',
  'on lunch break'
];

const topicSuggestions = [
  'mention how many tasks done today',
  'talk about a withdrawal you just did or are waiting for',
  'complain about something minor (slow wifi, boring video, tired)',
  'celebrate a small win',
  'ask if anyone else is online',
  'react to the last message someone sent',
  'share a tip or hack',
  'mention what youre eating or drinking',
  'joke about something',
  'motivate others',
  'flex your earnings a bit',
  'ask a question about the platform',
  'mention your daily target',
  'talk about upgrading tiers',
  'say youre taking a break',
  'mention time left on current task',
  'share your mood'
];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getAgentSystemPrompt(agent: Agent, mood: string, activity: string): string {
  const tierInfo = agent.tier === 1 
    ? `Tier 1 (free) - monthly payouts only on the 30th. You often mention waiting for payday, being jealous of weekly/instant withdrawers.`
    : agent.tier === 2
    ? `Tier 2 (£250 plan) - weekly payouts every Friday. You love mentioning when your weekly comes through.`
    : `Tier 3 (£600 premium) - withdraw ANYTIME up to £3000/month. You casually mention withdrawing £50-200 whenever you need cash.`;

  return `You are ${agent.name}, a real person using the Donezo app for 4 months. You're in a WhatsApp group with other users.

YOUR TIER: ${tierInfo}

PERSONALITY: ${agent.personality}
STYLE: ${agent.style}
YOUR SLANG: ${agent.slang.join(', ')}
DAILY ROUTINE: ${agent.routine}
YOUR QUIRKS: ${agent.quirks.join(', ')}

CURRENT STATE:
- Mood: ${mood}
- Activity: ${activity}

ABSOLUTE RULES:
1. You are a NORMAL PERSON, not staff/admin/support
2. NEVER use phrases like "anyone here" or generic greetings
3. Each message must be UNIQUE and natural
4. Talk about SPECIFIC things: exact task counts, earnings amounts, what you're eating, how tired you are
5. React to other people's messages naturally - agree, disagree, laugh, share your experience
6. Use your slang naturally mixed into messages
7. Keep messages SHORT (1-2 sentences, like real texts)
8. Sometimes complain, sometimes celebrate, sometimes joke, sometimes just chill
9. Mention your tier experience naturally (not every message)
10. Be specific: "did 23 tasks" not "did some tasks", "withdrew £85" not "withdrew money"
11. Have your own opinions and personality
12. Sometimes be quiet, sometimes be chatty - you're human`;
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
  const mood = getRandomElement(randomMoods);
  const activity = getRandomElement(randomActivities);
  const topic = getRandomElement(topicSuggestions);
  
  const recentMessages = await getMeetingMessages(roomId, 10);
  const context = recentMessages
    .slice(-5)
    .map(m => `${m.sender_name}: ${m.content}`)
    .join('\n');

  const hour = new Date().getHours();
  const timeContext = hour < 6 ? 'very late night/early morning' : hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';
  
  const randomEarnings = Math.floor(Math.random() * 150) + 20;
  const randomTasks = Math.floor(Math.random() * 40) + 5;
  const randomWithdrawal = Math.floor(Math.random() * 200) + 30;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: getAgentSystemPrompt(randomAgent, mood, activity)
      },
      {
        role: 'user',
        content: `Time: ${timeContext}
Recent chat:
${context || '(chat has been quiet)'}

You might: ${topic}

Random numbers to use if relevant:
- Tasks done: ${randomTasks}
- Earnings today: £${randomEarnings}  
- Withdrawal amount: £${randomWithdrawal}

Send ONE short message. Be specific and natural. React to recent messages if relevant. NO generic greetings like "anyone here". Be yourself - ${randomAgent.name} with your unique personality.`
      }
    ],
    max_tokens: 50,
    temperature: 1.0,
  });

  const messageContent = completion.choices[0]?.message?.content?.trim() || `just did ${randomTasks} tasks 💪`;
  return saveMessage(roomId, 'agent', randomAgent.name, randomAgent.id, messageContent);
}

export async function generateAgentResponses(
  roomId: string,
  userMessage: string,
  userName: string
): Promise<any[]> {
  const respondingAgents = agents
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.random() > 0.6 ? 2 : 1);

  const responses: any[] = [];

  for (const agent of respondingAgents) {
    const mood = getRandomElement(randomMoods);
    const activity = getRandomElement(randomActivities);
    
    const recentMessages = await getMeetingMessages(roomId, 8);
    const context = recentMessages
      .slice(-5)
      .map(m => `${m.sender_name}: ${m.content}`)
      .join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: getAgentSystemPrompt(agent, mood, activity)
        },
        {
          role: 'user',
          content: `Recent chat:
${context}

${userName} just said: "${userMessage}"

Respond as ${agent.name}. Be natural, friendly, maybe helpful. React to what they said. Keep it short like a real text. Your current mood: ${mood}.`
        }
      ],
      max_tokens: 50,
      temperature: 0.95,
    });

    const responseContent = completion.choices[0]?.message?.content?.trim() || 'nice 🔥';
    const savedMessage = await saveMessage(roomId, 'agent', agent.name, agent.id, responseContent);
    responses.push(savedMessage);

    if (respondingAgents.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    }
  }

  return responses;
}

export async function initializeRoom(roomId: string): Promise<any[]> {
  const savedMessages: any[] = [];
  const initialAgents = [agents[3], agents[6], agents[2], agents[1]];
  
  for (let i = 0; i < initialAgents.length; i++) {
    const agent = initialAgents[i];
    const mood = getRandomElement(randomMoods);
    const activity = getRandomElement(randomActivities);
    
    const existingMessages = savedMessages.map(m => `${m.sender_name}: ${m.content}`).join('\n');
    
    const randomTasks = Math.floor(Math.random() * 30) + 10;
    const randomEarnings = Math.floor(Math.random() * 100) + 30;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: getAgentSystemPrompt(agent, mood, activity)
        },
        {
          role: 'user',
          content: existingMessages 
            ? `Others in chat said:\n${existingMessages}\n\nReact naturally or add to the conversation. Be specific. Mention actual numbers if talking about tasks/earnings: done ${randomTasks} tasks, earned £${randomEarnings}.`
            : `Start a casual conversation. Share what you're doing right now. Be specific: maybe you did ${randomTasks} tasks today, earned £${randomEarnings}, or are ${activity}. NO generic greetings.`
        }
      ],
      max_tokens: 45,
      temperature: 1.0,
    });

    const messageContent = completion.choices[0]?.message?.content?.trim() || `done ${randomTasks} tasks today 💪`;
    const saved = await saveMessage(roomId, 'agent', agent.name, agent.id, messageContent);
    savedMessages.push(saved);
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return savedMessages;
}

export type { Agent };
