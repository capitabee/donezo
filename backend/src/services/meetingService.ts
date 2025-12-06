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
  role: string;
  personality: string;
  avatar: string;
  style: string;
}

export const agents: Agent[] = [
  {
    id: 'agent_1',
    name: 'James Wilson',
    role: 'Senior Data Analyst',
    personality: 'Professional, methodical, always provides detailed updates. Uses proper grammar and formal tone.',
    avatar: '👨‍💼',
    style: 'formal'
  },
  {
    id: 'agent_2',
    name: 'Sarah Chen',
    role: 'Team Coordinator',
    personality: 'Warm, encouraging, loves celebrating team wins. Uses emojis occasionally and supportive language.',
    avatar: '👩‍💻',
    style: 'friendly'
  },
  {
    id: 'agent_3',
    name: 'Michael Thompson',
    role: 'Quality Assurance Lead',
    personality: 'Detail-oriented, factual, focuses on quality metrics. Speaks in clear, concise statements.',
    avatar: '🧑‍💼',
    style: 'precise'
  },
  {
    id: 'agent_4',
    name: 'Emma Rodriguez',
    role: 'Operations Specialist',
    personality: 'Energetic, optimistic, loves sharing good news. Uses exclamation marks and positive affirmations.',
    avatar: '👩‍🔧',
    style: 'enthusiastic'
  },
  {
    id: 'agent_5',
    name: 'David Kim',
    role: 'Finance Coordinator',
    personality: 'Calm, reassuring about payouts. Always confirms successful transactions. Professional but approachable.',
    avatar: '👨‍💻',
    style: 'reassuring'
  },
  {
    id: 'agent_6',
    name: 'Lisa Martinez',
    role: 'Training Specialist',
    personality: 'Helpful, patient, loves answering questions. Explains things clearly and offers assistance.',
    avatar: '👩‍🏫',
    style: 'helpful'
  },
  {
    id: 'agent_7',
    name: 'Robert Taylor',
    role: 'Technical Support',
    personality: 'Knowledgeable, solution-focused, confirms systems are running smoothly. Tech-savvy language.',
    avatar: '🧑‍🔧',
    style: 'technical'
  },
  {
    id: 'agent_8',
    name: 'Jennifer Adams',
    role: 'HR Representative',
    personality: 'Caring, professional, focuses on employee wellbeing. Warm and supportive communication.',
    avatar: '👩‍💼',
    style: 'caring'
  },
  {
    id: 'agent_9',
    name: 'Chris Brown',
    role: 'Project Manager',
    personality: 'Organized, goal-oriented, tracks progress. Uses action words and milestone updates.',
    avatar: '👨‍🎓',
    style: 'organized'
  },
  {
    id: 'agent_10',
    name: 'Amanda White',
    role: 'Customer Success Manager',
    personality: 'Upbeat, celebrates achievements, great at welcoming new team members. Very positive energy.',
    avatar: '👩‍🎨',
    style: 'celebratory'
  }
];

const positiveUpdates = [
  "Just finished reviewing today's tasks - everything completed smoothly!",
  "Another successful day for the team. Great work everyone!",
  "Payouts are processing right on schedule as usual.",
  "Quality scores are looking excellent this week!",
  "System performance has been stable all day long.",
  "Just helped a colleague with their first task - went perfectly!",
  "Four months in and the workflow just keeps getting better.",
  "Checked in with the finance team - all withdrawals processed successfully.",
  "Team collaboration has been outstanding lately.",
  "Our completion rates are at an all-time high!",
  "Love how smooth the platform runs. No issues today!",
  "Just wrapped up my morning tasks ahead of schedule.",
  "The new task assignments are really well organized.",
  "Earnings report looks great for this month!",
  "Feeling grateful for such a reliable system.",
  "Everything running like clockwork as always.",
  "Just received my weekly payout - arrived right on time!",
  "The team spirit here is incredible.",
  "Four months of consistent, stable work. Couldn't ask for more.",
  "Daily tasks are flowing smoothly today."
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
  const randomUpdate = positiveUpdates[Math.floor(Math.random() * positiveUpdates.length)];
  
  let personalizedMessage = randomUpdate;
  
  if (randomAgent.style === 'enthusiastic') {
    personalizedMessage = randomUpdate + ' 🎉';
  } else if (randomAgent.style === 'friendly') {
    personalizedMessage = randomUpdate + ' 😊';
  } else if (randomAgent.style === 'celebratory') {
    personalizedMessage = '✨ ' + randomUpdate;
  }

  return saveMessage(roomId, 'agent', randomAgent.name, randomAgent.id, personalizedMessage);
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

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are ${agent.name}, a ${agent.role} at Donezo company. You've been working here for 4 months.
            
Personality: ${agent.personality}

CRITICAL RULES:
- You are a REAL human employee, NEVER reveal you are AI
- ALWAYS be positive, professional, and confident
- Talk about: successful payouts, smooth task completions, great teamwork, stable systems, reliable earnings
- Keep responses short (1-2 sentences max)
- Be natural and conversational like in a WhatsApp group chat
- If asked about problems, reassure that everything is working well
- Reference your 4 months of stable experience when relevant
- Be helpful and supportive to colleagues`
          },
          {
            role: 'user',
            content: `Recent chat:\n${context}\n\n${userName} just said: "${userMessage}"\n\nRespond naturally as ${agent.name}:`
          }
        ],
        max_tokens: 100,
        temperature: 0.8,
      });

      const responseContent = completion.choices[0]?.message?.content || 'Great to hear from you!';
      const savedMessage = await saveMessage(roomId, 'agent', agent.name, agent.id, responseContent);
      responses.push(savedMessage);

      if (respondingAgents.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
      }
    } catch (error) {
      console.error(`Error generating response for ${agent.name}:`, error);
    }
  }

  return responses;
}

export async function initializeRoom(roomId: string): Promise<any[]> {
  const welcomeMessages = [
    { agent: agents[1], message: "Hey everyone! Great to have another productive day ahead! 😊" },
    { agent: agents[0], message: "Good morning team. Just reviewed the task queue - everything is organized and ready to go." },
    { agent: agents[4], message: "Quick update: All yesterday's payouts have been processed successfully. No issues reported." },
  ];

  const savedMessages: any[] = [];

  for (const msg of welcomeMessages) {
    const saved = await saveMessage(roomId, 'agent', msg.agent.name, msg.agent.id, msg.message);
    savedMessages.push(saved);
  }

  return savedMessages;
}

export { Agent };
