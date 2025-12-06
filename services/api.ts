const API_BASE_URL = '/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('donezoToken');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('donezoToken', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('donezoToken');
  }

  getToken() {
    return this.token || localStorage.getItem('donezoToken');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  async signup(email: string, password: string, name: string, referralCode?: string) {
    const data = await this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, referralCode }),
    });
    this.setToken(data.token);
    return data;
  }

  async signin(email: string, password: string) {
    const data = await this.request('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async acceptTerms() {
    return this.request('/onboarding/accept-terms', { method: 'POST' });
  }

  async completeOnboarding() {
    return this.request('/onboarding/complete', { method: 'POST' });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async createMandateSession() {
    return this.request('/billing/mandate/session', { method: 'POST' });
  }

  async getReferralInfo() {
    return this.request('/referral/info');
  }

  async getReferralStats() {
    return this.request('/referral/stats');
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async getTasks() {
    return this.request('/tasks');
  }

  async startTask(taskId: string) {
    return this.request(`/tasks/${taskId}/start`, { method: 'POST' });
  }

  async submitTask(taskId: string, timeSpent: number) {
    return this.request(`/tasks/${taskId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ timeSpent }),
    });
  }

  async completeTask(taskId: string, timeSpent: number) {
    return this.submitTask(taskId, timeSpent);
  }

  async failTask(taskId: string) {
    return this.request(`/tasks/${taskId}/fail`, { method: 'POST' });
  }

  async setupMandate() {
    return this.request('/billing/mandate/setup', { method: 'POST' });
  }

  async confirmMandate(paymentMethodId: string) {
    return this.request('/billing/mandate/confirm', {
      method: 'POST',
      body: JSON.stringify({ paymentMethodId }),
    });
  }

  async getMandateStatus() {
    return this.request('/billing/mandate/status');
  }

  async setupBankAccount() {
    return this.request('/billing/bank-account/setup', { method: 'POST' });
  }

  async confirmBankAccount(paymentMethodId: string, financialConnectionsAccountId: string) {
    return this.request('/billing/bank-account/confirm', {
      method: 'POST',
      body: JSON.stringify({ paymentMethodId, financialConnectionsAccountId }),
    });
  }

  async getEarnings() {
    return this.request('/earnings');
  }

  async getEarningsActivity() {
    return this.request('/earnings/activity');
  }

  async chat(message: string) {
    return this.request('/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async getChatHistory() {
    return this.request('/chat/history');
  }

  async upgrade(tier: 'Professional' | 'Expert') {
    return this.request('/upgrade', {
      method: 'POST',
      body: JSON.stringify({ tier }),
    });
  }

  async getStripeConfig() {
    return this.request('/stripe/config');
  }

  async adminLogin(email: string, password: string) {
    const data = await this.request('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('donezoAdminToken', data.token);
    return data;
  }

  private getAdminToken() {
    return localStorage.getItem('donezoAdminToken');
  }

  private async adminRequest(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getAdminToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  async getAdminUsers() {
    return this.adminRequest('/admin/users');
  }

  async getAdminStats() {
    return this.adminRequest('/admin/stats');
  }

  async getAdminTasks() {
    return this.adminRequest('/admin/tasks');
  }

  async createAdminTask(task: {
    platform: string;
    category: string;
    title: string;
    url: string;
    payout: number;
    targetUsers: 'all' | string[];
  }) {
    return this.adminRequest('/admin/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async deleteAdminTask(taskId: string) {
    return this.adminRequest(`/admin/tasks/${taskId}`, { method: 'DELETE' });
  }

  async adminUpgradeUser(userId: string, tier: 'Professional' | 'Expert') {
    return this.adminRequest(`/admin/users/${userId}/upgrade`, {
      method: 'POST',
      body: JSON.stringify({ tier }),
    });
  }

  async adminChargeUser(userId: string, amount: number, reason: string) {
    return this.adminRequest(`/admin/users/${userId}/charge`, {
      method: 'POST',
      body: JSON.stringify({ amount, reason }),
    });
  }

  async getAdminUserBalance(userId: string) {
    return this.adminRequest(`/admin/users/${userId}/balance`);
  }

  async sendBroadcast(type: string, title: string, content: string, targetUsers?: string) {
    return this.adminRequest('/admin/broadcast', {
      method: 'POST',
      body: JSON.stringify({ type, title, content, targetUsers }),
    });
  }

  async getApiKeys() {
    return this.adminRequest('/admin/api-keys');
  }

  async updateApiKey(keyName: string, keyValue: string) {
    return this.adminRequest(`/admin/api-keys/${keyName}`, {
      method: 'PUT',
      body: JSON.stringify({ keyValue }),
    });
  }

  // TrueLayer UK Bank Connection
  async getTrueLayerAuthUrl(isOnboarding: boolean = false) {
    return this.request(`/truelayer/auth-url?isOnboarding=${isOnboarding}`);
  }

  async completeTrueLayerCallback(code: string, state: string) {
    return this.request('/truelayer/callback', {
      method: 'POST',
      body: JSON.stringify({ code, state }),
    });
  }

  async getTrueLayerStatus() {
    return this.request('/truelayer/status');
  }

  async disconnectTrueLayer() {
    return this.request('/truelayer/disconnect', { method: 'DELETE' });
  }

  async getAdminUserTrueLayerBalance(userId: string) {
    return this.adminRequest(`/admin/users/${userId}/truelayer-balance`);
  }

  async syncAllBankBalances() {
    return this.adminRequest('/admin/sync-all-balances', { method: 'POST' });
  }
}

export const api = new ApiService();
export default api;
