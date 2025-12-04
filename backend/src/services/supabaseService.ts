import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
};

const isConfigured = isValidUrl(supabaseUrl) && supabaseAnonKey.length > 10;

let supabase: SupabaseClient | null = null;
let supabaseAdmin: SupabaseClient | null = null;

if (isConfigured) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
} else {
  console.log('Supabase not configured - using fallback mode');
}

export const getSupabase = () => supabase;
export const getSupabaseAdmin = () => supabaseAdmin;
export const isSupabaseConfigured = () => isConfigured;

export interface DBUser {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  tier: 'Basic' | 'Professional' | 'Expert';
  earnings: number;
  quality_score: number;
  completed_tasks: number;
  mandate_active: boolean;
  stripe_customer_id?: string;
  payment_method_id?: string;
  created_at: string;
  updated_at: string;
}

export interface DBTask {
  id: string;
  platform: 'YouTube' | 'TikTok' | 'Instagram';
  category: 'Day' | 'Night';
  title: string;
  url: string;
  payout: number;
  target_users: string;
  published_by: string;
  created_at: string;
}

export interface DBUserTask {
  id: string;
  user_id: string;
  task_id: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Failed';
  started_at?: string;
  completed_at?: string;
  ai_verification_result?: string;
  earnings_credited: number;
}

export interface DBTransaction {
  id: string;
  user_id: string;
  task_id?: string;
  type: 'task_earning' | 'upgrade_payment' | 'payout' | 'charge';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  stripe_payment_intent_id?: string;
  created_at: string;
}

export interface DBApiKey {
  id: string;
  key_name: string;
  key_value: string;
  is_active: boolean;
  updated_at: string;
  updated_by: string;
}

export interface DBAdminMessage {
  id: string;
  type: 'promotional' | 'general' | 'alert';
  title: string;
  content: string;
  target_users: string;
  created_at: string;
}

const mockUsers: DBUser[] = [];
const mockTasks: DBTask[] = [];
const mockUserTasks: DBUserTask[] = [];
const mockTransactions: DBTransaction[] = [];
const mockApiKeys: DBApiKey[] = [];
const mockAdminMessages: DBAdminMessage[] = [];

export const userService = {
  async getUserByEmail(email: string): Promise<DBUser | null> {
    if (!isConfigured) {
      return mockUsers.find(u => u.email === email) || null;
    }
    
    const { data, error } = await supabase!.from('users').select('*').eq('email', email).single();
    if (error || !data) return null;
    return data;
  },

  async getUserById(id: string): Promise<DBUser | null> {
    if (!isConfigured) {
      return mockUsers.find(u => u.id === id) || null;
    }
    
    const { data, error } = await supabase!.from('users').select('*').eq('id', id).single();
    if (error || !data) return null;
    return data;
  },

  async createUser(email: string, passwordHash: string, name: string): Promise<DBUser | null> {
    if (!isConfigured) {
      const newUser: DBUser = {
        id: `user_${Date.now()}`,
        email,
        password_hash: passwordHash,
        name,
        tier: 'Basic',
        earnings: 0,
        quality_score: 100,
        completed_tasks: 0,
        mandate_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockUsers.push(newUser);
      return newUser;
    }
    
    const { data, error } = await supabase!.from('users').insert({
      email,
      password_hash: passwordHash,
      name,
      tier: 'Basic',
      earnings: 0,
      quality_score: 100,
      completed_tasks: 0,
      mandate_active: false
    }).select().single();
    
    if (error || !data) return null;
    return data;
  },

  async updateUser(id: string, updates: Partial<DBUser>): Promise<DBUser | null> {
    if (!isConfigured) {
      const idx = mockUsers.findIndex(u => u.id === id);
      if (idx === -1) return null;
      mockUsers[idx] = { ...mockUsers[idx], ...updates, updated_at: new Date().toISOString() };
      return mockUsers[idx];
    }
    
    const { data, error } = await supabase!.from('users').update(updates).eq('id', id).select().single();
    if (error || !data) return null;
    return data;
  },

  async getAllUsers(): Promise<DBUser[]> {
    if (!isConfigured) {
      return mockUsers;
    }
    
    const { data, error } = await supabaseAdmin!.from('users').select('*');
    if (error || !data) return [];
    return data;
  },

  async addEarnings(userId: string, amount: number, taskId?: string): Promise<boolean> {
    if (!isConfigured) {
      const user = mockUsers.find(u => u.id === userId);
      if (!user) return false;
      user.earnings += amount;
      user.completed_tasks += 1;
      
      const tx: DBTransaction = {
        id: `tx_${Date.now()}`,
        user_id: userId,
        task_id: taskId,
        type: 'task_earning',
        amount,
        description: 'Task completion earnings',
        status: 'completed',
        created_at: new Date().toISOString()
      };
      mockTransactions.push(tx);
      return true;
    }
    
    const { error } = await supabase!.from('users')
      .update({ 
        earnings: supabase!.rpc('increment', { x: amount }),
        completed_tasks: supabase!.rpc('increment', { x: 1 })
      })
      .eq('id', userId);

    if (error) return false;

    await supabase!.from('transactions').insert({
      user_id: userId,
      task_id: taskId,
      type: 'task_earning',
      amount,
      description: 'Task completion earnings',
      status: 'completed'
    });

    return true;
  },

  async upgradeTier(userId: string, tier: 'Professional' | 'Expert', price: number): Promise<boolean> {
    if (!isConfigured) {
      const user = mockUsers.find(u => u.id === userId);
      if (!user) return false;
      user.tier = tier;
      return true;
    }
    
    const { error } = await supabase!.from('users').update({ tier }).eq('id', userId);
    if (error) return false;

    await supabase!.from('transactions').insert({
      user_id: userId,
      type: 'upgrade_payment',
      amount: price,
      description: `Upgrade to ${tier} tier`,
      status: 'completed'
    });

    return true;
  }
};

export const taskService = {
  async getAllTasks(): Promise<DBTask[]> {
    if (!isConfigured) {
      return mockTasks;
    }
    
    const { data, error } = await supabase!.from('tasks').select('*').eq('is_active', true);
    if (error || !data) return [];
    return data;
  },

  async getTasksForUser(userId: string): Promise<DBTask[]> {
    if (!isConfigured) {
      return mockTasks.filter(t => t.target_users === 'all' || t.target_users.includes(userId));
    }
    
    const { data, error } = await supabase!
      .from('tasks')
      .select('*')
      .eq('is_active', true)
      .or(`target_users.eq.all,target_users.cs.{${userId}}`);
    
    if (error || !data) return [];
    return data;
  },

  async createTask(task: Partial<DBTask>): Promise<DBTask | null> {
    if (!isConfigured) {
      const newTask: DBTask = {
        id: `task_${Date.now()}`,
        platform: task.platform || 'TikTok',
        category: task.category || 'Day',
        title: task.title || '',
        url: task.url || '',
        payout: task.payout || 0.20,
        target_users: task.target_users || 'all',
        published_by: task.published_by || 'admin',
        created_at: new Date().toISOString()
      };
      mockTasks.push(newTask);
      return newTask;
    }
    
    const { data, error } = await supabase!.from('tasks').insert(task).select().single();
    if (error || !data) return null;
    return data;
  },

  async deleteTask(taskId: string): Promise<boolean> {
    if (!isConfigured) {
      const idx = mockTasks.findIndex(t => t.id === taskId);
      if (idx === -1) return false;
      mockTasks.splice(idx, 1);
      return true;
    }
    
    const { error } = await supabase!.from('tasks').update({ is_active: false }).eq('id', taskId);
    return !error;
  }
};

export const userTaskService = {
  async getUserTasks(userId: string): Promise<DBUserTask[]> {
    if (!isConfigured) {
      return mockUserTasks.filter(ut => ut.user_id === userId);
    }
    
    const { data, error } = await supabase!.from('task_completions').select('*').eq('user_id', userId);
    if (error || !data) return [];
    return data;
  },

  async startTask(userId: string, taskId: string): Promise<DBUserTask | null> {
    if (!isConfigured) {
      const existingIdx = mockUserTasks.findIndex(ut => ut.user_id === userId && ut.task_id === taskId);
      if (existingIdx !== -1) {
        mockUserTasks[existingIdx].status = 'In Progress';
        mockUserTasks[existingIdx].started_at = new Date().toISOString();
        return mockUserTasks[existingIdx];
      }
      
      const newUserTask: DBUserTask = {
        id: `ut_${Date.now()}`,
        user_id: userId,
        task_id: taskId,
        status: 'In Progress',
        started_at: new Date().toISOString(),
        earnings_credited: 0
      };
      mockUserTasks.push(newUserTask);
      return newUserTask;
    }
    
    const { data: existing } = await supabase!
      .from('task_completions')
      .select('*')
      .eq('user_id', userId)
      .eq('task_id', taskId)
      .single();

    if (existing) {
      const { data, error } = await supabase!
        .from('task_completions')
        .update({ status: 'in_progress', started_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
      if (error || !data) return null;
      return data;
    }

    const { data, error } = await supabase!.from('task_completions').insert({
      user_id: userId,
      task_id: taskId,
      status: 'in_progress',
      started_at: new Date().toISOString()
    }).select().single();

    if (error || !data) return null;
    return data;
  },

  async completeTask(userId: string, taskId: string, verificationResult: string, payout: number): Promise<DBUserTask | null> {
    if (!isConfigured) {
      const ut = mockUserTasks.find(u => u.user_id === userId && u.task_id === taskId);
      if (!ut) return null;
      ut.status = 'Completed';
      ut.completed_at = new Date().toISOString();
      ut.ai_verification_result = verificationResult;
      ut.earnings_credited = payout;
      return ut;
    }
    
    const { data, error } = await supabase!
      .from('task_completions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        ai_verification_status: 'approved',
        payout_amount: payout
      })
      .eq('user_id', userId)
      .eq('task_id', taskId)
      .select()
      .single();

    if (error || !data) return null;
    return data;
  },

  async failTask(userId: string, taskId: string): Promise<boolean> {
    if (!isConfigured) {
      const ut = mockUserTasks.find(u => u.user_id === userId && u.task_id === taskId);
      if (!ut) return false;
      ut.status = 'Failed';
      return true;
    }
    
    const { error } = await supabase!
      .from('task_completions')
      .update({ status: 'failed' })
      .eq('user_id', userId)
      .eq('task_id', taskId);

    return !error;
  }
};

export const transactionService = {
  async getTransactions(userId: string): Promise<DBTransaction[]> {
    if (!isConfigured) {
      return mockTransactions.filter(t => t.user_id === userId);
    }
    
    const { data, error } = await supabase!
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    return data;
  },

  async createTransaction(transaction: Partial<DBTransaction>): Promise<DBTransaction | null> {
    if (!isConfigured) {
      const newTx: DBTransaction = {
        id: `tx_${Date.now()}`,
        user_id: transaction.user_id || '',
        task_id: transaction.task_id,
        type: transaction.type || 'task_earning',
        amount: transaction.amount || 0,
        description: transaction.description || '',
        status: transaction.status || 'completed',
        created_at: new Date().toISOString()
      };
      mockTransactions.push(newTx);
      return newTx;
    }
    
    const { data, error } = await supabase!.from('transactions').insert(transaction).select().single();
    if (error || !data) return null;
    return data;
  }
};

export const apiKeyService = {
  async getApiKeys(): Promise<DBApiKey[]> {
    if (!isConfigured) {
      return mockApiKeys;
    }
    
    const { data, error } = await supabaseAdmin!.from('api_keys').select('*');
    if (error || !data) return [];
    return data;
  },

  async updateApiKey(keyName: string, keyValue: string, updatedBy: string): Promise<boolean> {
    if (!isConfigured) {
      const existingIdx = mockApiKeys.findIndex(k => k.key_name === keyName);
      if (existingIdx !== -1) {
        mockApiKeys[existingIdx].key_value = keyValue;
        mockApiKeys[existingIdx].updated_at = new Date().toISOString();
        mockApiKeys[existingIdx].updated_by = updatedBy;
      } else {
        mockApiKeys.push({
          id: `key_${Date.now()}`,
          key_name: keyName,
          key_value: keyValue,
          is_active: true,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy
        });
      }
      return true;
    }
    
    const { data: existing } = await supabaseAdmin!
      .from('api_keys')
      .select('*')
      .eq('key_name', keyName)
      .single();

    if (existing) {
      const { error } = await supabaseAdmin!
        .from('api_keys')
        .update({
          key_value: keyValue,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy
        })
        .eq('id', existing.id);
      return !error;
    }

    const { error } = await supabaseAdmin!.from('api_keys').insert({
      key_name: keyName,
      key_value: keyValue,
      is_active: true,
      updated_by: updatedBy
    });

    return !error;
  }
};

export const adminMessageService = {
  async getMessages(): Promise<DBAdminMessage[]> {
    if (!isConfigured) {
      return mockAdminMessages;
    }
    
    const { data, error } = await supabase!
      .from('admin_messages')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    return data;
  },

  async createMessage(message: { type: string; title: string; content: string; target_users: string; created_by: string }): Promise<DBAdminMessage | null> {
    if (!isConfigured) {
      const newMsg: DBAdminMessage = {
        id: `msg_${Date.now()}`,
        type: message.type as 'promotional' | 'general' | 'alert',
        title: message.title,
        content: message.content,
        target_users: message.target_users,
        created_at: new Date().toISOString()
      };
      mockAdminMessages.push(newMsg);
      return newMsg;
    }
    
    const { data, error } = await supabase!.from('admin_messages').insert({
      type: message.type,
      title: message.title,
      content: message.content,
      target_users: message.target_users
    }).select().single();

    if (error || !data) return null;
    return data;
  }
};

export default {
  userService,
  taskService,
  userTaskService,
  transactionService,
  apiKeyService,
  adminMessageService,
  isSupabaseConfigured,
  getSupabase,
  getSupabaseAdmin
};
