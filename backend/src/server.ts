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
  isPostgresConfigured
} from './services/postgresService';
import stripeService from './services/stripeService';
import openaiService from './services/openaiService';

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

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

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

    const stripeCustomer = await stripeService.createCustomer(email, name);
    if (stripeCustomer) {
      await userService.updateUser(user.id, { stripe_customer_id: stripeCustomer.id } as any);
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
        mandateActive: user.mandate_active
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
        mandateActive: user.mandate_active
      }
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
  try {
    const user = await userService.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      tier: user.tier,
      earnings: user.earnings,
      qualityScore: user.quality_score,
      completedTasks: user.completed_tasks,
      mandateActive: user.mandate_active,
      signupDate: user.created_at
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

app.post('/api/chat', authenticateToken, async (req: any, res) => {
  try {
    const { message } = req.body;
    const user = await userService.getUserById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const response = await openaiService.chat(message, user.name, user.tier);
    res.json({ response });
  } catch (error) {
    console.error('Chat error:', error);
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

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

export default app;
