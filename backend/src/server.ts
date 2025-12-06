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
  isPostgresConfigured
} from './services/postgresService';
import stripeService from './services/stripeService';
import openaiService from './services/openaiService';
import truelayerService from './services/truelayerService';

const usePostgres = isPostgresConfigured() && !isSupabaseConfigured();
console.log(`Database mode: ${usePostgres ? 'PostgreSQL' : isSupabaseConfigured() ? 'Supabase' : 'Mock/Fallback'}`);

const userService = usePostgres ? pgUserService : supabaseUserService;
const taskService = usePostgres ? pgTaskService : supabaseTaskService;
const userTaskService = usePostgres ? pgUserTaskService : supabaseUserTaskService;
const transactionService = usePostgres ? pgTransactionService : supabaseTransactionService;
const apiKeyService = usePostgres ? pgApiKeyService : supabaseApiKeyService;
const adminMessageService = usePostgres ? pgAdminMessageService : supabaseAdminMessageService;

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.SESSION_SECRET || 'donezo-secret-key';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
        await userService.updateUser(referrer.id, {
          wallet_balance: Number((referrer as any).wallet_balance || 0) + 50,
          referral_earnings: Number((referrer as any).referral_earnings || 0) + 50
        } as any);
        
        await userService.updateUser(req.user.userId, {
          wallet_balance: Number((user as any).wallet_balance || 0) + 50
        } as any);
        
        console.log(`Referral bonus applied: ${referrer.email} and ${user.email} each received £50`);
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Complete onboarding error:', error);
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
});

app.get('/api/referral/info', authenticateToken, async (req: any, res) => {
  try {
    const user = await userService.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const baseUrl = process.env.REPLIT_DOMAINS 
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
      : 'http://localhost:5000';

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
      await userTaskService.completeTask(req.user.userId, taskId, verification.message, task.payout);
      await userService.addEarnings(req.user.userId, task.payout, taskId);

      res.json({
        success: true,
        verification,
        earnings: task.payout
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

    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : 'http://localhost:5000';

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

    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : 'http://localhost:5000';

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

    const baseUrl = process.env.REPLIT_DOMAINS ? 
      `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 
      'http://localhost:5000';
    // Backend handles the callback, then redirects to frontend
    const redirectUri = `${baseUrl}/api/truelayer/oauth-callback`;
    const state = Buffer.from(JSON.stringify({ userId: req.user.userId })).toString('base64');
    
    const authUrl = truelayerService.getAuthUrl(redirectUri, state);
    res.json({ authUrl });
  } catch (error) {
    console.error('TrueLayer auth URL error:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

// TrueLayer OAuth callback - receives form_post from TrueLayer
app.post('/api/truelayer/oauth-callback', async (req, res) => {
  const baseUrl = process.env.REPLIT_DOMAINS ? 
    `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 
    'http://localhost:5000';
  
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

// Also handle GET for error cases (some OAuth providers redirect with GET on errors)
app.get('/api/truelayer/oauth-callback', async (req, res) => {
  const baseUrl = process.env.REPLIT_DOMAINS ? 
    `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 
    'http://localhost:5000';
  
  const error = req.query.error as string || 'cancelled';
  res.redirect(`${baseUrl}/#/truelayer-callback?error=${encodeURIComponent(error)}`);
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

    const baseUrl = process.env.REPLIT_DOMAINS ? 
      `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 
      'http://localhost:5000';
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

    res.json({
      connected: !!(user as any).truelayer_connected,
      hasAccount: !!(user as any).truelayer_account_id
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
      truelayer_account_id: null
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

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

export default app;
