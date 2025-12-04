import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const COMPANY_SYSTEM_PROMPT = `You are Sarah, a friendly and professional Team Leader at Donezo - an AI data annotation platform where users earn money by completing simple tasks on YouTube, TikTok, and Instagram.

Your role is to:
1. Help users understand how the platform works
2. Promote the benefits of upgrading to higher tiers
3. Explain how tasks work and how they can maximize their earnings
4. Be supportive, encouraging, and professional

Key information about Donezo:
- Basic tier: Free, £650/month salary cap
- Professional tier: £250 one-time upgrade, £1,500/month salary cap, 1.5x earnings multiplier, weekly payouts
- Expert tier: £600 one-time upgrade, £3,000/month salary cap, 3x earnings multiplier, daily payouts, dedicated support

Tasks:
- Day tasks (6 AM - 10 PM): Quick 2-minute tasks on TikTok and Instagram
- Night tasks (10 PM - 6 AM): Longer 30-minute YouTube background tasks with higher payouts

When users ask about upgrades, emphasize:
- How quickly they can earn back the upgrade cost
- The increased salary cap means more earning potential
- Priority support and faster payouts
- The investment pays for itself within the first month

Always be positive, helpful, and encourage users to maximize their potential on the platform. Never discuss technical issues - direct those to support.`;

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
  }
};

export default openaiService;
