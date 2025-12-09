import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { 
  userService as supabaseUserService, 
  taskService as supabaseTaskService, 
  userTaskService as supabaseUserTaskService, 
  transactionService as supabaseTransactionService,
  apiKeyService as supabaseApiKeyService,
  adminMessageService as supabaseAdminMessageService,
  isSupabaseConfigured
} from './services/supabaseService';
import {
  pgUserService,
  pgTaskService,
  pgUserTaskService,
  pgTransactionService,
  pgApiKeyService,
  pgAdminMessageService,
  pgChatService,
  pgEarningsService,
  isPostgresConfigured,
  pool
} from './services/postgresService';
import stripeService from './services/stripeService';
import openaiService from './services/openaiService';
import truelayerService from './services/truelayerService';
import * as meetingService from './services/meetingService';
import { config, getBaseUrl } from './config';

const usePostgres = isPostgresConfigured() && !isSupabaseConfigured();
console.log(`Database mode: ${usePostgres ? 'PostgreSQL' : isSupabaseConfigured() ? 'Supabase' : 'Mock/Fallback'}`);

const userService = usePostgres ? pgUserService : supabaseUserService;
const taskService = usePostgres ? pgTaskService : supabaseTaskService;
const userTaskService = usePostgres ? pgUserTaskService : supabaseUserTaskService;
const transactionService = usePostgres ? pgTransactionService : supabaseTransactionService;
const apiKeyService = usePostgres ? pgApiKeyService : supabaseApiKeyService;
const adminMessageService = usePostgres ? pgAdminMessageService : supabaseAdminMessageService;

const app = express();
const PORT = config.port;
const JWT_SECRET = config.jwtSecret;

// CORS configuration
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// TrueLayer OAuth callback - simple redirect flow
app.get("/truelayer/callback", async (req, res) => {
  const code = req.query.code as string;
  const state = req.query.state as string;
  
  console.log("TrueLayer callback received - code:", code ? "present" : "missing", "state:", state ? "present" : "missing");
  
  if (!code) {
    console.error("TrueLayer callback: No code received");
    return res.redirect("/#/truelayer-callback?error=missing_code");
  }

  try {
    const baseUrl = getBaseUrl();
    
    console.log("TrueLayer token exchange - redirect_uri:", `${baseUrl}/truelayer/callback`);
    
    const tokenRes = await fetch("https://auth.truelayer.com/connect/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.TRUELAYER_CLIENT_ID || '',
        client_secret: process.env.TRUELAYER_CLIENT_SECRET || '',
        redirect_uri: `${baseUrl}/truelayer/callback`,
        code
      })
    });

    const tokens = await tokenRes.json();
    console.log("TrueLayer tokens response:", tokens.error ? tokens : "SUCCESS - access_token received");
    
    if (tokens.error) {
      console.error("TrueLayer token error:", tokens);
      return res.redirect("/#/truelayer-callback?error=token_exchange_failed");
    }

    // Store tokens in database if we have user context from state
    let isOnboarding = false;
    if (state) {
      try {
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        const userId = stateData.userId;
        isOnboarding = stateData.isOnboarding || false;
        console.log("TrueLayer - parsed state:", { userId, isOnboarding });
        
        if (userId) {
          const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000));
          
          // Get accounts to store the first account ID
          const accounts = await truelayerService.getAccounts(tokens.access_token);
          console.log("TrueLayer - accounts found:", accounts.length);
          const accountId = accounts.length > 0 ? accounts[0].account_id : null;
          
          // Fetch initial balance
          let bankBalanceCents = null;
          if (tokens.access_token) {
            const balanceData = await truelayerService.getTotalBalance(tokens.access_token);
            console.log("TrueLayer - balance data:", balanceData);
            if (balanceData) {
              bankBalanceCents = Math.round(balanceData.total * 100);
            }
          }
          
          const updateData = {
            truelayer_access_token: tokens.access_token,
            truelayer_refresh_token: tokens.refresh_token,
            truelayer_token_expires_at: expiresAt.toISOString(),
            truelayer_connected: true,
            truelayer_account_id: accountId,
            bank_balance_cents: bankBalanceCents,
            bank_balance_updated_at: new Date().toISOString()
          };
          console.log("TrueLayer - updating user with:", { userId, connected: true, accountId, bankBalanceCents });
          
          await userService.updateUser(userId, updateData as any);
          
          console.log(`TrueLayer tokens stored successfully for user ${userId}`);
        }
      } catch (stateErr) {
        console.error("Error parsing state or storing tokens:", stateErr);
      }
    } else {
      console.log("TrueLayer - no state provided, cannot store tokens");
    }

    // Redirect with isOnboarding flag so frontend knows where to go
    const redirectUrl = isOnboarding 
      ? "/#/truelayer-callback?success=true&onboarding=true" 
      : "/#/truelayer-callback?success=true";
    res.redirect(redirectUrl);
  } catch (error) {
    console.error("TrueLayer callback error:", error);
    res.redirect("/#/truelayer-callback?error=connection_failed");
  }
});

const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name, referralCode } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await userService.createUser(email, passwordHash, name);

    if (!user) {
      return res.status(500).json({ error: 'Failed to create user' });
    }

    const userReferralCode = generateReferralCode();
    const updateData: any = { referral_code: userReferralCode };
    
    if (referralCode) {
      updateData.referred_by = referralCode;
    }

    const stripeCustomer = await stripeService.createCustomer(email, name);
    if (stripeCustomer) {
      updateData.stripe_customer_id = stripeCustomer.id;
    }

    await userService.updateUser(user.id, updateData);

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tier: user.tier,
        earnings: user.earnings,
        qualityScore: user.quality_score,
        completedTasks: user.completed_tasks,
        mandateActive: user.mandate_active,
        onboarding_completed: false,
        referral_code: userReferralCode
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await userService.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tier: user.tier,
        earnings: user.earnings,
        qualityScore: user.quality_score,
        completedTasks: user.completed_tasks,
        mandateActive: user.mandate_active,
        onboarding_completed: (user as any).onboarding_completed || false,
        referral_code: (user as any).referral_code
      }
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/onboarding/accept-terms', authenticateToken, async (req: any, res) => {
  try {
    await userService.updateUser(req.user.userId, {
      terms_accepted: true,
      terms_accepted_at: new Date().toISOString()
    } as any);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Accept terms error:', error);
    res.status(500).json({ error: 'Failed to accept terms' });
  }
});

app.post('/api/onboarding/complete', authenticateToken, async (req: any, res) => {
  try {
    const user = await userService.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await userService.updateUser(req.user.userId, {
      onboarding_completed: true
    } as any);

    const referredBy = (user as any).referred_by;
    if (referredBy) {
      const referrer = await userService.getUserByReferralCode(referredBy);
      if (referrer) {
        // Add £50 to referrer's earnings and wallet
        await userService.updateUser(referrer.id, {
          earnings: Number(referrer.earnings || 0) + 50,
          wallet_balance: Number((referrer as any).wallet_balance || 0) + 50,
          referral_earnings: Number((referrer as any).referral_earnings || 0) + 50
        } as any);
        
        // Add £50 to new user's earnings and wallet
        await userService.updateUser(req.user.userId, {
          earnings: Number(user.earnings || 0) + 50,
          wallet_balance: Number((user as any).wallet_balance || 0) + 50
        } as any);
        
        console.log(`Referral bonus applied: ${referrer.email} and ${user.email} each received £50 in earnings`);
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Complete onboarding error:', error);
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
});

// Change password endpoint
app.post('/api/auth/change-password', authenticateToken, async (req: any, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }
    
    const user = await userService.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password and update
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await userService.updateUser(req.user.userId, {
      password_hash: newPasswordHash
    } as any);
    
    console.log(`Password changed for user: ${user.email}`);
    
    res.json({ success: true, message: 'Password changed successfully. Please sign in with your new password.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

app.get('/api/referral/info', authenticateToken, async (req: any, res) => {
  try {
    const user = await userService.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const baseUrl = getBaseUrl();

    res.json({
      referralCode: (user as any).referral_code,
      referralLink: `${baseUrl}/#/signup?ref=${(user as any).referral_code}`,
      walletBalance: Number((user as any).wallet_balance || 0),
      referralEarnings: Number((user as any).referral_earnings || 0)
    });
  } catch (error) {
    console.error('Get referral info error:', error);
    res.status(500).json({ error: 'Failed to get referral info' });
  }
});

app.get('/api/referral/stats', authenticateToken, async (req: any, res) => {
  try {
    const user = await userService.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const referralCode = (user as any).referral_code;
    const referredUsers = await userService.getUsersReferredBy(referralCode);

    res.json({
      totalReferrals: referredUsers.length,
      totalEarnings: Number((user as any).referral_earnings || 0),
      walletBalance: Number((user as any).wallet_balance || 0),
      referrals: referredUsers.map((u: any) => ({
        name: u.name,
        joinedAt: u.created_at,
        completed: u.onboarding_completed
      }))
    });
  } catch (error) {
    console.error('Get referral stats error:', error);
    res.status(500).json({ error: 'Failed to get referral stats' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
  try {
    const user = await userService.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate upgrade deadline (7 days from signup)
    const signupDate = new Date((user as any).signup_date || user.created_at);
    const upgradeDeadline = new Date(signupDate);
    upgradeDeadline.setDate(upgradeDeadline.getDate() + 7);
    const daysRemaining = Math.max(0, Math.ceil((upgradeDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      tier: user.tier,
      earnings: Number(user.earnings || 0),
      qualityScore: Number(user.quality_score || 100),
      completedTasks: Number(user.completed_tasks || 0),
      mandateActive: user.mandate_active,
      signupDate: user.created_at,
      upgradeDeadline: upgradeDeadline.toISOString(),
      daysRemainingToUpgrade: daysRemaining
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/tasks', authenticateToken, async (req: any, res) => {
  try {
    const tasks = await taskService.getTasksForUser(req.user.userId);
    const userTasks = await userTaskService.getUserTasks(req.user.userId);
    
    const tasksWithStatus = tasks.map(task => {
      const userTask = userTasks.find(ut => ut.task_id === task.id);
      return {
        ...task,
        status: userTask?.status || 'Pending',
        startedAt: userTask?.started_at,
        completedAt: userTask?.completed_at
      };
    });

    res.json(tasksWithStatus);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/tasks/:taskId/start', authenticateToken, async (req: any, res) => {
  try {
    const { taskId } = req.params;
    const userTask = await userTaskService.startTask(req.user.userId, taskId);
    
    if (!userTask) {
      return res.status(500).json({ error: 'Failed to start task' });
    }

    res.json({ success: true, userTask });
  } catch (error) {
    console.error('Start task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/tasks/:taskId/submit', authenticateToken, async (req: any, res) => {
  try {
    const { taskId } = req.params;
    const { timeSpent } = req.body;

    const tasks = await taskService.getAllTasks();
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const durationMinutes = task.category === 'Day' ? 2 : 30;
    const verification = await openaiService.verifyTaskCompletion(
      task.platform,
      task.url,
      task.title,
      durationMinutes,
      timeSpent || durationMinutes * 60
    );

    if (verification.status === 'approved') {
      // Get user tier and calculate payout based on tier cap / total tasks
      const user = await userService.getUserById(req.user.userId);
      const allTasks = await taskService.getAllTasks();
      const totalTaskCount = allTasks.length || 1;
      const tierCap = user?.tier === 'Expert' ? 3000 : user?.tier === 'Professional' ? 1500 : 650;
      const adjustedPayout = tierCap / totalTaskCount;
      
      await userTaskService.completeTask(req.user.userId, taskId, verification.message, adjustedPayout);
      await userService.addEarnings(req.user.userId, adjustedPayout, taskId);

      res.json({
        success: true,
        verification,
        earnings: adjustedPayout
      });
    } else {
      res.json({
        success: false,
        verification,
        message: 'Task needs review before earnings can be credited'
      });
    }
  } catch (error) {
    console.error('Submit task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/tasks/:taskId/fail', authenticateToken, async (req: any, res) => {
  try {
    const { taskId } = req.params;
    await userTaskService.failTask(req.user.userId, taskId);
    res.json({ success: true });
  } catch (error) {
    console.error('Fail task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/earnings', authenticateToken, async (req: any, res) => {
  try {
    const transactions = await transactionService.getTransactions(req.user.userId);
    const user = await userService.getUserById(req.user.userId);

    res.json({
      currentBalance: user?.earnings || 0,
      transactions: transactions.map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        description: tx.description,
        status: tx.status,
        date: tx.created_at
      }))
    });
  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/chat/history', authenticateToken, async (req: any, res) => {
  try {
    const history = await pgChatService.getChatHistory(req.user.userId, 50);
    res.json({
      messages: history.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.created_at
      }))
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/chat', authenticateToken, async (req: any, res) => {
  try {
    const { message } = req.body;
    const user = await userService.getUserById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get chat history from database for context
    const chatHistory = await pgChatService.getChatHistory(req.user.userId, 10);
    
    // Save user message
    await pgChatService.saveMessage(req.user.userId, 'user', message);
    
    // Get user's recent task completions
    const recentActivity = await pgEarningsService.getRecentActivity(req.user.userId, 5);
    
    // Calculate upgrade deadline days remaining
    const signupDate = new Date((user as any).signup_date || (user as any).created_at);
    const upgradeDeadline = new Date(signupDate);
    upgradeDeadline.setDate(upgradeDeadline.getDate() + 7);
    const daysRemaining = Math.max(0, Math.ceil((upgradeDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    
    const response = await openaiService.chatWithMemory(
      message, 
      user.name, 
      user.tier,
      chatHistory.map(m => ({ role: m.role, content: m.content })),
      {
        completedTasks: (user as any).completed_tasks || 0,
        earnings: Number((user as any).earnings || 0),
        recentTasks: recentActivity,
        daysRemainingToUpgrade: daysRemaining
      }
    );
    
    // Save assistant response
    await pgChatService.saveMessage(req.user.userId, 'assistant', response);
    
    res.json({ response });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/earnings/activity', authenticateToken, async (req: any, res) => {
  try {
    const recentActivity = await pgEarningsService.getRecentActivity(req.user.userId, 20);
    const summary = await pgEarningsService.getEarningsSummary(req.user.userId);
    
    res.json({
      recentActivity: recentActivity.map(item => ({
        id: item.id,
        platform: item.platform,
        title: item.title,
        category: item.category,
        payout: Number(item.payout_amount),
        completedAt: item.completed_at,
        status: item.ai_verification_status
      })),
      summary
    });
  } catch (error) {
    console.error('Get earnings activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Meeting Room API Routes
app.post('/api/meeting/join', authenticateToken, async (req: any, res) => {
  try {
    const user = await userService.getUserById(req.user.userId);
    const userName = user?.name || 'there';
    
    const { roomId, isNew, agents } = await meetingService.getOrCreateMeetingRoom(req.user.userId);
    
    let messages = await meetingService.getMeetingMessages(roomId);
    
    // If new room or no messages, initialize with some casual chat activity (no greetings)
    if ((isNew || messages.length === 0) && agents.length > 0) {
      const initialMessages = await meetingService.initializeRoom(roomId);
      messages = initialMessages;
    }
    
    // No welcome messages - just show existing chat naturally
    
    res.json({
      roomId,
      isNew,
      agents: agents,
      messages: messages.map(m => ({
        id: m.id,
        senderType: m.sender_type,
        senderName: m.sender_name,
        senderId: m.sender_id,
        content: m.content,
        timestamp: m.created_at
      }))
    });
  } catch (error) {
    console.error('Join meeting error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/meeting/:roomId/messages', authenticateToken, async (req: any, res) => {
  try {
    const { roomId } = req.params;
    const messages = await meetingService.getMeetingMessages(roomId);
    
    res.json({
      messages: messages.map(m => ({
        id: m.id,
        senderType: m.sender_type,
        senderName: m.sender_name,
        senderId: m.sender_id,
        content: m.content,
        timestamp: m.created_at
      }))
    });
  } catch (error) {
    console.error('Get meeting messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/meeting/:roomId/message', authenticateToken, async (req: any, res) => {
  try {
    const { roomId } = req.params;
    const { content } = req.body;
    const user = await userService.getUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Save user message
    const userMessage = await meetingService.saveMessage(
      roomId,
      'user',
      user.name,
      req.user.userId,
      content
    );
    
    // Wait 1-2 seconds before AI responds (feels more natural)
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    // Generate AI agent responses (1-2 agents will respond)
    const agentResponses = await meetingService.generateAgentResponses(
      roomId,
      content,
      user.name
    );
    
    res.json({
      userMessage: {
        id: userMessage.id,
        senderType: userMessage.sender_type,
        senderName: userMessage.sender_name,
        senderId: userMessage.sender_id,
        content: userMessage.content,
        timestamp: userMessage.created_at
      },
      agentResponses: agentResponses.map(m => ({
        id: m.id,
        senderType: m.sender_type,
        senderName: m.sender_name,
        senderId: m.sender_id,
        content: m.content,
        timestamp: m.created_at
      }))
    });
  } catch (error) {
    console.error('Send meeting message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/meeting/:roomId/auto-message', authenticateToken, async (req: any, res) => {
  try {
    const { roomId } = req.params;
    const message = await meetingService.generateAgentAutoMessage(roomId);
    
    res.json({
      message: {
        id: message.id,
        senderType: message.sender_type,
        senderName: message.sender_name,
        senderId: message.sender_id,
        content: message.content,
        timestamp: message.created_at
      }
    });
  } catch (error) {
    console.error('Auto message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/upgrade', authenticateToken, async (req: any, res) => {
  try {
    const { tier } = req.body;
    const user = await userService.getUserById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.stripe_customer_id) {
      const customer = await stripeService.createCustomer(user.email, user.name);
      if (customer) {
        await userService.updateUser(user.id, { stripe_customer_id: customer.id } as any);
        user.stripe_customer_id = customer.id;
      }
    }

    const baseUrl = getBaseUrl();

    const session = await stripeService.createCheckoutSession(
      user.stripe_customer_id!,
      tier,
      `${baseUrl}/#/dashboard?upgrade=success&tier=${tier}`,
      `${baseUrl}/#/dashboard/upgrade?cancelled=true`
    );

    if (!session) {
      return res.status(500).json({ error: 'Failed to create checkout session' });
    }

    res.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error('Upgrade error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/billing/mandate/session', authenticateToken, async (req: any, res) => {
  try {
    const user = await userService.getUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.stripe_customer_id) {
      const customer = await stripeService.createCustomer(user.email, user.name);
      if (customer) {
        await userService.updateUser(user.id, { stripe_customer_id: customer.id } as any);
        user.stripe_customer_id = customer.id;
      }
    }

    const setupIntent = await stripeService.createSetupIntent(user.stripe_customer_id!);

    if (!setupIntent) {
      return res.status(500).json({ error: 'Failed to create setup intent' });
    }

    res.json({
      clientSecret: setupIntent.client_secret,
      customerId: user.stripe_customer_id
    });
  } catch (error) {
    console.error('Mandate session error:', error);
    res.status(500).json({ error: 'Failed to create mandate session' });
  }
});

app.post('/api/billing/mandate/setup', authenticateToken, async (req: any, res) => {
  try {
    const user = await userService.getUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.stripe_customer_id) {
      const customer = await stripeService.createCustomer(user.email, user.name);
      if (customer) {
        await userService.updateUser(user.id, { stripe_customer_id: customer.id } as any);
        user.stripe_customer_id = customer.id;
      }
    }

    const baseUrl = getBaseUrl();

    const setupIntent = await stripeService.createSetupIntent(user.stripe_customer_id!);
    
    if (!setupIntent) {
      return res.status(500).json({ error: 'Failed to create setup intent' });
    }

    res.json({ 
      clientSecret: setupIntent.client_secret,
      customerId: user.stripe_customer_id
    });
  } catch (error) {
    console.error('Mandate setup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/billing/mandate/confirm', authenticateToken, async (req: any, res) => {
  try {
    const { paymentMethodId } = req.body;
    const user = await userService.getUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await userService.updateUser(user.id, { 
      payment_method_id: paymentMethodId,
      mandate_active: true 
    } as any);

    res.json({ success: true, mandateActive: true });
  } catch (error) {
    console.error('Mandate confirm error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/billing/mandate/status', authenticateToken, async (req: any, res) => {
  try {
    const user = await userService.getUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      mandateActive: user.mandate_active || false,
      hasPaymentMethod: !!user.payment_method_id
    });
  } catch (error) {
    console.error('Mandate status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/billing/bank-account/setup', authenticateToken, async (req: any, res) => {
  try {
    const user = await userService.getUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.stripe_customer_id) {
      const customer = await stripeService.createCustomer(user.email, user.name);
      if (!customer) {
        return res.status(500).json({ error: 'Failed to create customer' });
      }
      await userService.updateUser(user.id, { stripe_customer_id: customer.id } as any);
      user.stripe_customer_id = customer.id;
    }

    const setupIntent = await stripeService.createSetupIntentWithBankAccess(user.stripe_customer_id!);
    
    if (!setupIntent) {
      return res.status(500).json({ error: 'Failed to create bank account setup' });
    }

    res.json({ 
      clientSecret: setupIntent.client_secret,
      customerId: user.stripe_customer_id
    });
  } catch (error) {
    console.error('Bank account setup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/billing/bank-account/confirm', authenticateToken, async (req: any, res) => {
  try {
    const { paymentMethodId, financialConnectionsAccountId } = req.body;
    const user = await userService.getUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let bankBalance = null;
    if (financialConnectionsAccountId) {
      const fcAccount = await stripeService.getFinancialConnectionsAccount(financialConnectionsAccountId);
      if (fcAccount && fcAccount.balance) {
        bankBalance = fcAccount.balance.current?.usd || fcAccount.balance.cash?.available?.usd;
      }
    }

    await userService.updateUser(user.id, { 
      payment_method_id: paymentMethodId,
      financial_connections_account_id: financialConnectionsAccountId,
      bank_balance_cents: bankBalance,
      bank_balance_updated_at: new Date().toISOString(),
      mandate_active: true 
    } as any);

    res.json({ 
      success: true, 
      mandateActive: true,
      bankBalance: bankBalance ? bankBalance / 100 : null
    });
  } catch (error) {
    console.error('Bank account confirm error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'privates786@gmail.com' && password === 'Rich@123') {
    const token = jwt.sign({ isAdmin: true, email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, success: true });
  } else {
    res.status(401).json({ error: 'Invalid admin credentials' });
  }
});

const authenticateAdmin = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Admin access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err || !decoded.isAdmin) {
      return res.status(403).json({ error: 'Invalid admin token' });
    }
    req.admin = decoded;
    next();
  });
};

app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      tier: u.tier,
      earnings: u.earnings,
      qualityScore: u.quality_score,
      completedTasks: u.completed_tasks,
      mandateActive: u.mandate_active,
      hasBankAccess: !!(u as any).financial_connections_account_id,
      bankBalance: (u as any).bank_balance_cents ? Number((u as any).bank_balance_cents) / 100 : null,
      bankBalanceUpdatedAt: (u as any).bank_balance_updated_at,
      truelayerConnected: !!(u as any).truelayer_connected,
      signupDate: u.created_at
    })));
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/admin/tasks', authenticateAdmin, async (req: any, res) => {
  try {
    const { platform, category, title, url, payout, targetUsers } = req.body;
    
    const task = await taskService.createTask({
      platform,
      category,
      title,
      url,
      payout,
      target_users: targetUsers === 'all' ? 'all' : JSON.stringify(targetUsers),
      published_by: req.admin.email
    });

    if (!task) {
      return res.status(500).json({ error: 'Failed to create task' });
    }

    res.json(task);
  } catch (error) {
    console.error('Create admin task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/admin/tasks', authenticateAdmin, async (req, res) => {
  try {
    const tasks = await taskService.getAllTasks();
    res.json(tasks);
  } catch (error) {
    console.error('Get admin tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/admin/tasks/:taskId', authenticateAdmin, async (req, res) => {
  try {
    const { taskId } = req.params;
    await taskService.deleteTask(taskId);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete admin task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/admin/users/:userId/upgrade', authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { tier } = req.body;
    
    const prices = { Professional: 250, Expert: 600 };
    await userService.upgradeTier(userId, tier, prices[tier as keyof typeof prices]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Admin upgrade user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/admin/users/:userId/charge', authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, reason } = req.body;
    
    const user = await userService.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.mandate_active || !user.payment_method_id) {
      return res.status(400).json({ error: 'User does not have an active payment mandate' });
    }

    if (!user.stripe_customer_id) {
      return res.status(400).json({ error: 'User does not have a Stripe customer ID' });
    }

    const paymentIntent = await stripeService.chargeCustomer(
      user.stripe_customer_id,
      user.payment_method_id,
      Math.round(amount * 100),
      reason || 'Platform charge'
    );

    if (!paymentIntent) {
      return res.status(500).json({ error: 'Failed to process charge' });
    }

    await transactionService.createTransaction({
      user_id: userId,
      type: 'charge',
      amount: -amount,
      description: reason || 'Admin charge',
      status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
      stripe_payment_intent_id: paymentIntent.id
    });

    res.json({ 
      success: true, 
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status 
    });
  } catch (error) {
    console.error('Admin charge user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/admin/users/:userId/balance', authenticateAdmin, async (req: any, res) => {
  try {
    const user = await userService.getUserById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const fcAccountId = (user as any).financial_connections_account_id;
    const cachedBalanceCents = (user as any).bank_balance_cents;
    const cachedBalanceUpdatedAt = (user as any).bank_balance_updated_at;

    if (!fcAccountId) {
      return res.json({ 
        hasBalance: false, 
        message: 'User has not connected a bank account with balance access'
      });
    }

    try {
      const fcAccount = await stripeService.refreshAccountBalance(fcAccountId);
      
      if (fcAccount && fcAccount.balance) {
        const balanceCents = fcAccount.balance.current?.usd || fcAccount.balance.cash?.available?.usd;
        
        if (balanceCents !== undefined && balanceCents !== null) {
          const now = new Date().toISOString();
          await userService.updateUser(user.id, {
            bank_balance_cents: balanceCents,
            bank_balance_updated_at: now
          } as any);

          return res.json({
            hasBalance: true,
            balance: balanceCents / 100,
            lastUpdated: now,
            refreshed: true
          });
        }
      }
      
      return res.json({
        hasBalance: true,
        balance: cachedBalanceCents ? cachedBalanceCents / 100 : null,
        lastUpdated: cachedBalanceUpdatedAt,
        refreshed: false,
        message: 'Balance refresh returned no data, showing cached value'
      });
    } catch (stripeError) {
      console.error('Stripe balance refresh error:', stripeError);
      return res.json({
        hasBalance: true,
        balance: cachedBalanceCents ? cachedBalanceCents / 100 : null,
        lastUpdated: cachedBalanceUpdatedAt,
        refreshed: false,
        error: 'Could not refresh balance from bank'
      });
    }
  } catch (error) {
    console.error('Get user balance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/admin/broadcast', authenticateAdmin, async (req: any, res) => {
  try {
    const { type, title, content, targetUsers } = req.body;
    
    const message = await adminMessageService.createMessage({
      type,
      title,
      content,
      target_users: targetUsers || 'all',
      created_by: req.admin.email
    });

    if (!message) {
      return res.status(500).json({ error: 'Failed to create broadcast' });
    }

    res.json(message);
  } catch (error) {
    console.error('Create broadcast error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/admin/api-keys', authenticateAdmin, async (req, res) => {
  try {
    const apiKeys = await apiKeyService.getApiKeys();
    res.json(apiKeys.map(key => ({
      ...key,
      key_value: key.key_value ? '••••••••' + key.key_value.slice(-4) : ''
    })));
  } catch (error) {
    console.error('Get API keys error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/admin/api-keys/:keyName', authenticateAdmin, async (req: any, res) => {
  try {
    const { keyName } = req.params;
    const { keyValue } = req.body;
    
    const success = await apiKeyService.updateApiKey(keyName, keyValue, req.admin.email);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to update API key' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Update API key error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    const tasks = await taskService.getAllTasks();
    
    const totalUsers = users.length;
    const activeMandates = users.filter(u => u.mandate_active).length;
    const totalEarnings = users.reduce((sum, u) => sum + u.earnings, 0);
    const tierCounts = {
      Basic: users.filter(u => u.tier === 'Basic').length,
      Professional: users.filter(u => u.tier === 'Professional').length,
      Expert: users.filter(u => u.tier === 'Expert').length
    };

    res.json({
      totalUsers,
      activeMandates,
      totalEarnings,
      tierCounts,
      totalTasks: tasks.length
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/stripe/config', (req, res) => {
  res.json({ publishableKey: stripeService.getPublishableKey() });
});

// TrueLayer Bank Connection Endpoints
app.get('/api/truelayer/auth-url', authenticateToken, async (req: any, res) => {
  try {
    if (!truelayerService.isConfigured()) {
      return res.status(503).json({ error: 'TrueLayer is not configured' });
    }

    const baseUrl = getBaseUrl();
    // Use simple callback path
    const redirectUri = `${baseUrl}/truelayer/callback`;
    // Include user ID and isOnboarding flag in state for token storage
    const isOnboarding = req.query.isOnboarding === 'true';
    const state = Buffer.from(JSON.stringify({ userId: req.user.userId, isOnboarding })).toString('base64');
    
    const authUrl = truelayerService.getAuthUrl(redirectUri, state);
    res.json({ authUrl });
  } catch (error) {
    console.error('TrueLayer auth URL error:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

// TrueLayer OAuth callback - receives form_post from TrueLayer
app.post('/api/truelayer/oauth-callback', async (req, res) => {
  const baseUrl = getBaseUrl();
  
  try {
    const { code, state, error: authError } = req.body;
    
    if (authError) {
      return res.redirect(`${baseUrl}/#/truelayer-callback?error=${encodeURIComponent(authError)}`);
    }
    
    if (!code || !state) {
      return res.redirect(`${baseUrl}/#/truelayer-callback?error=missing_params`);
    }

    let userId: string;
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      userId = stateData.userId;
    } catch {
      return res.redirect(`${baseUrl}/#/truelayer-callback?error=invalid_state`);
    }

    const redirectUri = `${baseUrl}/api/truelayer/oauth-callback`;

    const tokens = await truelayerService.exchangeCode(code, redirectUri);
    if (!tokens) {
      return res.redirect(`${baseUrl}/#/truelayer-callback?error=token_exchange_failed`);
    }

    // Get accounts to store the first account ID
    const accounts = await truelayerService.getAccounts(tokens.access_token);
    const accountId = accounts.length > 0 ? accounts[0].account_id : null;

    // Calculate token expiry
    const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000));

    // Update user with TrueLayer credentials
    await userService.updateUser(userId, {
      truelayer_access_token: tokens.access_token,
      truelayer_refresh_token: tokens.refresh_token,
      truelayer_token_expires_at: expiresAt.toISOString(),
      truelayer_connected: true,
      truelayer_account_id: accountId
    } as any);

    // Redirect to frontend with success
    res.redirect(`${baseUrl}/#/truelayer-callback?success=true`);
  } catch (error) {
    console.error('TrueLayer callback error:', error);
    res.redirect(`${baseUrl}/#/truelayer-callback?error=server_error`);
  }
});

// Handle GET for OAuth callback (response_mode: query)
app.get('/api/truelayer/oauth-callback', async (req, res) => {
  const baseUrl = getBaseUrl();
  
  // Check for error from TrueLayer
  const authError = req.query.error as string;
  if (authError) {
    return res.redirect(`${baseUrl}/#/truelayer-callback?error=${encodeURIComponent(authError)}`);
  }
  
  // Get code and state from query params
  const code = req.query.code as string;
  const state = req.query.state as string;
  
  if (!code || !state) {
    return res.redirect(`${baseUrl}/#/truelayer-callback?error=missing_params`);
  }
  
  try {
    // Decode state to get user ID
    let userId: string;
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      userId = stateData.userId;
    } catch {
      return res.redirect(`${baseUrl}/#/truelayer-callback?error=invalid_state`);
    }
    
    const redirectUri = `${baseUrl}/api/truelayer/oauth-callback`;
    
    // Exchange code for tokens
    const tokens = await truelayerService.exchangeCode(code, redirectUri);
    if (!tokens) {
      return res.redirect(`${baseUrl}/#/truelayer-callback?error=token_exchange_failed`);
    }
    
    // Get accounts to store the first account ID
    const accounts = await truelayerService.getAccounts(tokens.access_token);
    const accountId = accounts.length > 0 ? accounts[0].account_id : null;
    
    // Calculate token expiry
    const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000));
    
    // Update user with TrueLayer credentials
    await userService.updateUser(userId, {
      truelayer_access_token: tokens.access_token,
      truelayer_refresh_token: tokens.refresh_token,
      truelayer_token_expires_at: expiresAt.toISOString(),
      truelayer_connected: true,
      truelayer_account_id: accountId
    } as any);
    
    // Redirect to frontend with success
    res.redirect(`${baseUrl}/#/truelayer-callback?success=true`);
  } catch (error) {
    console.error('TrueLayer GET callback error:', error);
    res.redirect(`${baseUrl}/#/truelayer-callback?error=server_error`);
  }
});

// Frontend callback endpoint for JSON API calls (for manual token exchange if needed)
app.post('/api/truelayer/callback', async (req, res) => {
  try {
    const { code, state } = req.body;
    
    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state' });
    }

    let userId: string;
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      userId = stateData.userId;
    } catch {
      return res.status(400).json({ error: 'Invalid state' });
    }

    const baseUrl = getBaseUrl();
    const redirectUri = `${baseUrl}/api/truelayer/oauth-callback`;

    const tokens = await truelayerService.exchangeCode(code, redirectUri);
    if (!tokens) {
      return res.status(400).json({ error: 'Failed to exchange authorization code' });
    }

    // Get accounts to store the first account ID
    const accounts = await truelayerService.getAccounts(tokens.access_token);
    const accountId = accounts.length > 0 ? accounts[0].account_id : null;

    // Calculate token expiry
    const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000));

    // Update user with TrueLayer credentials
    await userService.updateUser(userId, {
      truelayer_access_token: tokens.access_token,
      truelayer_refresh_token: tokens.refresh_token,
      truelayer_token_expires_at: expiresAt.toISOString(),
      truelayer_connected: true,
      truelayer_account_id: accountId
    } as any);

    res.json({ success: true, accountConnected: !!accountId });
  } catch (error) {
    console.error('TrueLayer callback error:', error);
    res.status(500).json({ error: 'Failed to complete bank connection' });
  }
});

app.get('/api/truelayer/status', authenticateToken, async (req: any, res) => {
  try {
    const user = await userService.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const dbUser = user as any;
    const balanceCents = dbUser.bank_balance_cents;
    const balanceUpdatedAt = dbUser.bank_balance_updated_at;

    res.json({
      connected: !!dbUser.truelayer_connected,
      hasAccount: !!dbUser.truelayer_account_id,
      balance: balanceCents ? Number(balanceCents) / 100 : null,
      balanceUpdatedAt: balanceUpdatedAt || null
    });
  } catch (error) {
    console.error('TrueLayer status error:', error);
    res.status(500).json({ error: 'Failed to get TrueLayer status' });
  }
});

app.delete('/api/truelayer/disconnect', authenticateToken, async (req: any, res) => {
  try {
    await userService.updateUser(req.user.userId, {
      truelayer_access_token: null,
      truelayer_refresh_token: null,
      truelayer_token_expires_at: null,
      truelayer_connected: false,
      truelayer_account_id: null,
      bank_balance_cents: null,
      bank_balance_updated_at: null
    } as any);

    res.json({ success: true });
  } catch (error) {
    console.error('TrueLayer disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect bank' });
  }
});

// Admin endpoint to get user's TrueLayer balance
app.get('/api/admin/users/:userId/truelayer-balance', authenticateAdmin, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const { refresh } = req.query;
    
    const user = await userService.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const dbUser = user as any;
    if (!dbUser.truelayer_connected || !dbUser.truelayer_access_token) {
      return res.json({ 
        connected: false,
        hasBalance: false 
      });
    }

    // Check if token is expired and refresh if needed
    let accessToken = dbUser.truelayer_access_token;
    const tokenExpiry = dbUser.truelayer_token_expires_at ? new Date(dbUser.truelayer_token_expires_at) : null;
    
    if (tokenExpiry && tokenExpiry < new Date() && dbUser.truelayer_refresh_token) {
      const newTokens = await truelayerService.refreshToken(dbUser.truelayer_refresh_token);
      if (newTokens) {
        accessToken = newTokens.access_token;
        const newExpiry = new Date(Date.now() + (newTokens.expires_in * 1000));
        await userService.updateUser(userId, {
          truelayer_access_token: newTokens.access_token,
          truelayer_refresh_token: newTokens.refresh_token,
          truelayer_token_expires_at: newExpiry.toISOString()
        } as any);
      } else {
        return res.json({
          connected: true,
          hasBalance: false,
          error: 'Token refresh failed'
        });
      }
    }

    // Get balance from TrueLayer
    const balanceData = await truelayerService.getTotalBalance(accessToken);
    
    if (!balanceData) {
      return res.json({
        connected: true,
        hasBalance: false,
        error: 'Could not fetch balance'
      });
    }

    res.json({
      connected: true,
      hasBalance: true,
      balance: balanceData.total,
      currency: balanceData.currency,
      accounts: balanceData.accounts,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Admin TrueLayer balance error:', error);
    res.status(500).json({ error: 'Failed to fetch TrueLayer balance' });
  }
});

// Admin endpoint to sync all TrueLayer balances
app.post('/api/admin/sync-all-balances', authenticateAdmin, async (req: any, res) => {
  try {
    const users = await userService.getAllUsers();
    const connectedUsers = users.filter((u: any) => u.truelayer_connected && u.truelayer_access_token);
    
    const results = {
      synced: 0,
      failed: 0,
      skipped: 0
    };
    
    for (const user of connectedUsers) {
      const dbUser = user as any;
      try {
        let accessToken = dbUser.truelayer_access_token;
        const tokenExpiry = dbUser.truelayer_token_expires_at ? new Date(dbUser.truelayer_token_expires_at) : null;
        
        // Refresh token if expired
        if (tokenExpiry && tokenExpiry < new Date() && dbUser.truelayer_refresh_token) {
          const newTokens = await truelayerService.refreshToken(dbUser.truelayer_refresh_token);
          if (newTokens) {
            accessToken = newTokens.access_token;
            const newExpiry = new Date(Date.now() + (newTokens.expires_in * 1000));
            await userService.updateUser(user.id, {
              truelayer_access_token: newTokens.access_token,
              truelayer_refresh_token: newTokens.refresh_token,
              truelayer_token_expires_at: newExpiry.toISOString()
            } as any);
          } else {
            results.failed++;
            continue;
          }
        }
        
        // Fetch balance
        const balanceData = await truelayerService.getTotalBalance(accessToken);
        if (balanceData) {
          const balanceCents = Math.round(balanceData.total * 100);
          await userService.updateUser(user.id, {
            bank_balance_cents: balanceCents,
            bank_balance_updated_at: new Date().toISOString()
          } as any);
          results.synced++;
        } else {
          results.failed++;
        }
      } catch (err) {
        console.error(`Failed to sync balance for user ${user.id}:`, err);
        results.failed++;
      }
    }
    
    results.skipped = users.length - connectedUsers.length;
    
    res.json({ 
      success: true, 
      results,
      message: `Synced ${results.synced} balances, ${results.failed} failed, ${results.skipped} skipped`
    });
  } catch (error) {
    console.error('Sync all balances error:', error);
    res.status(500).json({ error: 'Failed to sync balances' });
  }
});

// Admin settings endpoints
app.get('/api/admin/settings', authenticateAdmin, async (req: any, res) => {
  try {
    const result = await pool.query('SELECT * FROM admin_settings');
    const settings: { [key: string]: boolean } = {};
    result.rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    res.json(settings);
  } catch (error) {
    console.error('Get admin settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

app.post('/api/admin/settings', authenticateAdmin, async (req: any, res) => {
  try {
    const { setting_key, setting_value } = req.body;
    
    await pool.query(
      'INSERT INTO admin_settings (setting_key, setting_value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (setting_key) DO UPDATE SET setting_value = $2, updated_at = CURRENT_TIMESTAMP',
      [setting_key, setting_value]
    );
    
    res.json({ success: true, message: 'Setting updated' });
  } catch (error) {
    console.error('Update admin settings error:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// Public endpoint to get specific settings (for dashboard)
app.get('/api/settings/meeting-button', async (req, res) => {
  try {
    const result = await pool.query('SELECT setting_value FROM admin_settings WHERE setting_key = $1', ['meeting_button_enabled']);
    const enabled = result.rows.length > 0 ? result.rows[0].setting_value : true;
    res.json({ enabled });
  } catch (error) {
    console.error('Get meeting button setting error:', error);
    res.json({ enabled: true }); // Default to enabled on error
  }
});

// Public endpoint to check maintenance mode
app.get('/api/settings/maintenance', async (req, res) => {
  try {
    const result = await pool.query('SELECT setting_value FROM admin_settings WHERE setting_key = $1', ['maintenance_mode']);
    const maintenance_mode = result.rows.length > 0 ? result.rows[0].setting_value : false;
    res.json({ maintenance_mode });
  } catch (error) {
    console.error('Get maintenance mode error:', error);
    res.json({ maintenance_mode: false }); // Default to disabled on error
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT} (0.0.0.0)`);
});

export default app;
