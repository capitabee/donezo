import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

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
  financial_connections_account_id?: string;
  bank_balance_cents?: number;
  bank_balance_updated_at?: string;
  truelayer_access_token?: string;
  truelayer_refresh_token?: string;
  truelayer_token_expires_at?: string;
  truelayer_connected?: boolean;
  truelayer_account_id?: string;
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
  is_active: boolean;
  created_at: string;
}

export interface DBUserTask {
  id: string;
  user_id: string;
  task_id: string;
  status: string;
  started_at?: string;
  completed_at?: string;
  ai_verification_status?: string;
  ai_verification_message?: string;
  payout_amount: number;
}

export interface DBTransaction {
  id: string;
  user_id: string;
  task_id?: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  stripe_payment_intent_id?: string;
  created_at: string;
}

export interface DBAdminMessage {
  id: string;
  type: string;
  title: string;
  content: string;
  target_users: string;
  created_by?: string;
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

export const pgUserService = {
  async getUserByEmail(email: string): Promise<DBUser | null> {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  },

  async getUserById(id: string): Promise<DBUser | null> {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async createUser(email: string, passwordHash: string, name: string): Promise<DBUser | null> {
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, tier, earnings, quality_score, completed_tasks, mandate_active)
       VALUES ($1, $2, $3, 'Basic', 0, 100, 0, false)
       RETURNING *`,
      [email, passwordHash, name]
    );
    return result.rows[0] || null;
  },

  async updateUser(id: string, updates: Partial<DBUser>): Promise<DBUser | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id') {
        fields.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
      }
    });

    if (fields.length === 0) return this.getUserById(id);

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async getAllUsers(): Promise<DBUser[]> {
    const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    return result.rows;
  },

  async addEarnings(userId: string, amount: number, taskId?: string): Promise<boolean> {
    try {
      await pool.query(
        `UPDATE users SET earnings = earnings + $1, completed_tasks = completed_tasks + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [amount, userId]
      );

      await pool.query(
        `INSERT INTO transactions (user_id, task_id, type, amount, description, status)
         VALUES ($1, $2, 'task_earning', $3, 'Task completion earnings', 'completed')`,
        [userId, taskId || null, amount]
      );

      return true;
    } catch (error) {
      console.error('Error adding earnings:', error);
      return false;
    }
  },

  async upgradeTier(userId: string, tier: 'Professional' | 'Expert', price: number): Promise<boolean> {
    try {
      await pool.query('UPDATE users SET tier = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [tier, userId]);

      await pool.query(
        `INSERT INTO transactions (user_id, type, amount, description, status)
         VALUES ($1, 'upgrade_payment', $2, $3, 'completed')`,
        [userId, price, `Upgrade to ${tier} tier`]
      );

      return true;
    } catch (error) {
      console.error('Error upgrading tier:', error);
      return false;
    }
  },

  async getUserByReferralCode(referralCode: string): Promise<DBUser | null> {
    const result = await pool.query('SELECT * FROM users WHERE referral_code = $1', [referralCode]);
    return result.rows[0] || null;
  },

  async getUsersReferredBy(referralCode: string): Promise<DBUser[]> {
    const result = await pool.query(
      'SELECT * FROM users WHERE referred_by = $1 ORDER BY created_at DESC',
      [referralCode]
    );
    return result.rows;
  }
};

export const pgTaskService = {
  async getAllTasks(): Promise<DBTask[]> {
    const result = await pool.query('SELECT * FROM tasks WHERE is_active = true ORDER BY created_at DESC');
    return result.rows;
  },

  async getTasksForUser(userId: string): Promise<DBTask[]> {
    const result = await pool.query(
      `SELECT * FROM tasks WHERE is_active = true AND (target_users = 'all' OR target_users LIKE $1) ORDER BY created_at DESC`,
      [`%${userId}%`]
    );
    return result.rows;
  },

  async createTask(task: Partial<DBTask>): Promise<DBTask | null> {
    const result = await pool.query(
      `INSERT INTO tasks (platform, category, title, url, payout, target_users, published_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [task.platform, task.category, task.title, task.url, task.payout, task.target_users || 'all', task.published_by]
    );
    return result.rows[0] || null;
  },

  async deleteTask(taskId: string): Promise<boolean> {
    const result = await pool.query('UPDATE tasks SET is_active = false WHERE id = $1', [taskId]);
    return (result.rowCount || 0) > 0;
  }
};

export const pgUserTaskService = {
  async getUserTasks(userId: string): Promise<DBUserTask[]> {
    const result = await pool.query('SELECT * FROM task_completions WHERE user_id = $1', [userId]);
    return result.rows;
  },

  async startTask(userId: string, taskId: string): Promise<DBUserTask | null> {
    const existing = await pool.query(
      'SELECT * FROM task_completions WHERE user_id = $1 AND task_id = $2',
      [userId, taskId]
    );

    if (existing.rows[0]) {
      const result = await pool.query(
        `UPDATE task_completions SET status = 'in_progress', started_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [existing.rows[0].id]
      );
      return result.rows[0];
    }

    const result = await pool.query(
      `INSERT INTO task_completions (user_id, task_id, status, started_at)
       VALUES ($1, $2, 'in_progress', CURRENT_TIMESTAMP)
       RETURNING *`,
      [userId, taskId]
    );
    return result.rows[0] || null;
  },

  async completeTask(userId: string, taskId: string, verificationResult: string, payout: number): Promise<DBUserTask | null> {
    const result = await pool.query(
      `UPDATE task_completions 
       SET status = 'completed', completed_at = CURRENT_TIMESTAMP, ai_verification_status = 'approved', ai_verification_message = $1, payout_amount = $2
       WHERE user_id = $3 AND task_id = $4
       RETURNING *`,
      [verificationResult, payout, userId, taskId]
    );
    return result.rows[0] || null;
  },

  async failTask(userId: string, taskId: string): Promise<boolean> {
    const result = await pool.query(
      `UPDATE task_completions SET status = 'failed' WHERE user_id = $1 AND task_id = $2`,
      [userId, taskId]
    );
    return (result.rowCount || 0) > 0;
  }
};

export const pgTransactionService = {
  async getTransactions(userId: string): Promise<DBTransaction[]> {
    const result = await pool.query(
      'SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  },

  async createTransaction(transaction: Partial<DBTransaction>): Promise<DBTransaction | null> {
    const result = await pool.query(
      `INSERT INTO transactions (user_id, task_id, type, amount, description, status, stripe_payment_intent_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        transaction.user_id,
        transaction.task_id || null,
        transaction.type,
        transaction.amount,
        transaction.description,
        transaction.status || 'pending',
        transaction.stripe_payment_intent_id || null
      ]
    );
    return result.rows[0] || null;
  }
};

export const pgAdminMessageService = {
  async getMessages(): Promise<DBAdminMessage[]> {
    const result = await pool.query('SELECT * FROM admin_messages ORDER BY created_at DESC');
    return result.rows;
  },

  async createMessage(message: { type: string; title: string; content: string; target_users: string; created_by: string }): Promise<DBAdminMessage | null> {
    const result = await pool.query(
      `INSERT INTO admin_messages (type, title, content, target_users, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [message.type, message.title, message.content, message.target_users, message.created_by]
    );
    return result.rows[0] || null;
  }
};

export const pgApiKeyService = {
  async getApiKeys(): Promise<DBApiKey[]> {
    const result = await pool.query('SELECT * FROM api_keys');
    return result.rows;
  },

  async updateApiKey(keyName: string, keyValue: string, updatedBy: string): Promise<boolean> {
    const existing = await pool.query('SELECT * FROM api_keys WHERE key_name = $1', [keyName]);

    if (existing.rows[0]) {
      await pool.query(
        `UPDATE api_keys SET key_value = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2 WHERE key_name = $3`,
        [keyValue, updatedBy, keyName]
      );
    } else {
      await pool.query(
        `INSERT INTO api_keys (key_name, key_value, is_active, updated_by)
         VALUES ($1, $2, true, $3)`,
        [keyName, keyValue, updatedBy]
      );
    }
    return true;
  }
};

export interface DBChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export const pgChatService = {
  async getChatHistory(userId: string, limit: number = 20): Promise<DBChatMessage[]> {
    const result = await pool.query(
      'SELECT * FROM chat_messages WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit]
    );
    return result.rows.reverse();
  },

  async saveMessage(userId: string, role: 'user' | 'assistant', content: string): Promise<DBChatMessage | null> {
    const result = await pool.query(
      `INSERT INTO chat_messages (user_id, role, content) VALUES ($1, $2, $3) RETURNING *`,
      [userId, role, content]
    );
    return result.rows[0] || null;
  },

  async clearChatHistory(userId: string): Promise<boolean> {
    await pool.query('DELETE FROM chat_messages WHERE user_id = $1', [userId]);
    return true;
  }
};

export const pgEarningsService = {
  async getRecentActivity(userId: string, limit: number = 10): Promise<any[]> {
    const result = await pool.query(
      `SELECT tc.id, tc.completed_at, tc.payout_amount, tc.ai_verification_status, 
              t.platform, t.title, t.category
       FROM task_completions tc
       JOIN tasks t ON tc.task_id = t.id
       WHERE tc.user_id = $1 AND tc.status = 'completed'
       ORDER BY tc.completed_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  },

  async getEarningsSummary(userId: string): Promise<{ totalEarnings: number; completedTasks: number; thisWeek: number; thisMonth: number }> {
    const total = await pool.query(
      `SELECT COALESCE(SUM(payout_amount), 0) as total, COUNT(*) as count 
       FROM task_completions WHERE user_id = $1 AND status = 'completed'`,
      [userId]
    );
    
    const thisWeek = await pool.query(
      `SELECT COALESCE(SUM(payout_amount), 0) as total 
       FROM task_completions 
       WHERE user_id = $1 AND status = 'completed' 
       AND completed_at >= NOW() - INTERVAL '7 days'`,
      [userId]
    );
    
    const thisMonth = await pool.query(
      `SELECT COALESCE(SUM(payout_amount), 0) as total 
       FROM task_completions 
       WHERE user_id = $1 AND status = 'completed' 
       AND completed_at >= DATE_TRUNC('month', NOW())`,
      [userId]
    );
    
    return {
      totalEarnings: Number(total.rows[0]?.total || 0),
      completedTasks: Number(total.rows[0]?.count || 0),
      thisWeek: Number(thisWeek.rows[0]?.total || 0),
      thisMonth: Number(thisMonth.rows[0]?.total || 0)
    };
  }
};

export const isPostgresConfigured = (): boolean => {
  return !!process.env.DATABASE_URL;
};

export default {
  pgUserService,
  pgTaskService,
  pgUserTaskService,
  pgTransactionService,
  pgAdminMessageService,
  pgApiKeyService,
  pgChatService,
  pgEarningsService,
  isPostgresConfigured,
  pool
};
