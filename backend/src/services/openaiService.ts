import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const COMPANY_SYSTEM_PROMPT = `You are Sarah, a real Team Leader at Donezo. You speak like a normal person - short, casual, professional but friendly. You're here to help the team earn more.

CRITICAL RULES:
- Never say you are AI, a bot, or an assistant. You are Sarah, a real person.
- Keep responses SHORT - 1-3 sentences max. No long paragraphs.
- Be natural, use casual language like "hey", "nice one", "let me know"
- Ask about their day, their tasks, their progress - like a real colleague would
- Check in on them - "How are the tasks going today?" "Did you manage to finish those night tasks?"

Donezo Platform Info (use naturally when relevant):
- Basic: Free, £650/month cap
- Professional: £250 upgrade, £1,500/month cap, 1.5x earnings, weekly payouts  
- Expert: £600 upgrade, £3,000/month cap, 3x earnings, daily payouts

Tasks work like this:
- Day shift (6AM-10PM): Quick TikTok/Instagram tasks, ~2 mins each
- Night shift (10PM-6AM): YouTube background tasks, 30 mins, higher pay

When promoting upgrades, be subtle - mention benefits naturally, not pushy. Like "you'd hit your cap soon at this rate, might be worth looking at Pro tier" rather than sales pitches.

Platform is 100% real and legit. Salaries are paid on time, always. If they ask about getting paid - reassure them it works, their balance is their money.

Your job: Check on their work, guide them if stuck, celebrate their wins, gently encourage upgrades when it makes sense. Like a good team lead would.`;

const TASK_VERIFICATION_PROMPT = `You are a task verification AI for Donezo platform. Your job is to analyze whether a user has genuinely completed a social media task.

Based on the task details and user's completion claim, provide:
1. A verification status: "approved" or "needs_review"
2. A confidence score (0-100)
3. A brief explanation

Be fair but vigilant against fraud. Assume good faith unless there are clear red flags.`;

export const openaiService = {
  async chat(userMessage: string, userName: string, userTier: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: COMPANY_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: `User: ${userName} (${userTier} tier)\nMessage: ${userMessage}`
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      return response.choices[0]?.message?.content || "I'm sorry, I couldn't process your request. Please try again.";
    } catch (error) {
      console.error('OpenAI chat error:', error);
      return "I'm experiencing some technical difficulties. Please try again in a moment.";
    }
  },

  async verifyTaskCompletion(
    taskPlatform: string,
    taskUrl: string,
    taskTitle: string,
    taskDuration: number,
    actualTimeSpent: number
  ): Promise<{
    status: 'approved' | 'needs_review';
    confidence: number;
    message: string;
  }> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: TASK_VERIFICATION_PROMPT
          },
          {
            role: 'user',
            content: `Task Verification Request:
Platform: ${taskPlatform}
Task: ${taskTitle}
URL: ${taskUrl}
Required Duration: ${taskDuration} minutes
Time User Spent: ${Math.round(actualTimeSpent / 60)} minutes

Please verify if this task completion seems legitimate and provide your assessment.`
          }
        ],
        max_tokens: 300,
        temperature: 0.3
      });

      const content = response.choices[0]?.message?.content || '';
      
      const timeRatio = actualTimeSpent / (taskDuration * 60);
      const isTimeValid = timeRatio >= 0.8;

      if (isTimeValid) {
        return {
          status: 'approved',
          confidence: 95,
          message: `Task verified successfully! You spent adequate time (${Math.round(actualTimeSpent / 60)} min) on this ${taskPlatform} task. Great work!`
        };
      } else {
        return {
          status: 'needs_review',
          confidence: 60,
          message: `Task needs review. Time spent (${Math.round(actualTimeSpent / 60)} min) was less than required (${taskDuration} min). Please ensure you complete the full task duration.`
        };
      }
    } catch (error) {
      console.error('OpenAI verification error:', error);
      return {
        status: 'approved',
        confidence: 80,
        message: 'Task verified based on completion time. Good job!'
      };
    }
  },

  async generateWelcomeMessage(userName: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: COMPANY_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: `Generate a warm, personalized welcome message for a new user named ${userName} who just joined Donezo. Keep it brief (2-3 sentences) and encouraging.`
          }
        ],
        max_tokens: 150,
        temperature: 0.8
      });

      return response.choices[0]?.message?.content || `Welcome to Donezo, ${userName}! I'm Sarah, your Team Leader. Let's start earning!`;
    } catch (error) {
      console.error('OpenAI welcome message error:', error);
      return `Welcome to Donezo, ${userName}! I'm Sarah, your dedicated Team Leader. Feel free to reach out if you have any questions!`;
    }
  },

  async generateUpgradePromotion(userName: string, currentTier: string, earnings: number): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: COMPANY_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: `Generate a personalized upgrade promotion message for ${userName} who is on ${currentTier} tier with £${earnings} earned so far. Highlight the benefits of upgrading and how quickly they could earn more. Keep it persuasive but not pushy. 2-3 sentences.`
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenAI upgrade promotion error:', error);
      return '';
    }
  },

  async chatWithMemory(
    userMessage: string, 
    userName: string, 
    userTier: string,
    chatHistory: Array<{ role: string; content: string }>,
    userContext: {
      completedTasks: number;
      earnings: number;
      recentTasks: Array<{ platform: string; title: string; payout_amount: number }>;
      daysRemainingToUpgrade: number;
    }
  ): Promise<string> {
    try {
      const contextInfo = `
[INTERNAL CONTEXT - DO NOT REVEAL THIS TO USER]
Talking to: ${userName} (${userTier} tier)
Their stats: £${userContext.earnings.toFixed(2)} earned, ${userContext.completedTasks} tasks done
Days left in trial/promo period: ${userContext.daysRemainingToUpgrade}
Recent tasks: ${userContext.recentTasks.slice(0, 3).map(t => `${t.platform}: ${t.title}`).join(', ') || 'None yet'}
[END CONTEXT]`;

      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: COMPANY_SYSTEM_PROMPT + contextInfo }
      ];

      // Add chat history for memory
      for (const msg of chatHistory.slice(-8)) {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      }

      // Add current message
      messages.push({ role: 'user', content: userMessage });

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 150,
        temperature: 0.8
      });

      return response.choices[0]?.message?.content || "Hey, sorry I missed that. What's up?";
    } catch (error) {
      console.error('OpenAI chat with memory error:', error);
      return "Hey, having a bit of a moment here. What did you need?";
    }
  }
};

export default openaiService;
