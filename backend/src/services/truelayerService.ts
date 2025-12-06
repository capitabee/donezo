import axios from 'axios';

const TRUELAYER_CLIENT_ID = process.env.TRUELAYER_CLIENT_ID || '';
const TRUELAYER_CLIENT_SECRET = process.env.TRUELAYER_CLIENT_SECRET || '';

// Production URLs for live Open Banking
const AUTH_URL = 'https://auth.truelayer.com';
const API_URL = 'https://api.truelayer.com';

export interface TrueLayerTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface TrueLayerAccount {
  account_id: string;
  account_type: string;
  display_name: string;
  currency: string;
  provider: {
    display_name: string;
    provider_id: string;
  };
}

export interface TrueLayerBalance {
  currency: string;
  available: number;
  current: number;
  overdraft?: number;
  update_timestamp: string;
}

export const truelayerService = {
  getAuthUrl(redirectUri: string, state?: string): string {
    const scopes = ['info', 'accounts', 'balance', 'transactions'];
    const params: Record<string, string> = {
      response_type: 'code',
      client_id: TRUELAYER_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: scopes.join(' '),
      providers: 'uk-ob-all'
    };
    
    if (state) {
      params.state = state;
    }
    
    console.log('TrueLayer Auth URL params:', {
      client_id: TRUELAYER_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: scopes.join(' '),
      providers: 'uk-ob-all',
      hasState: !!state
    });
    
    return `${AUTH_URL}/?${new URLSearchParams(params).toString()}`;
  },

  async exchangeCode(code: string, redirectUri: string): Promise<TrueLayerTokens | null> {
    try {
      const response = await axios.post(
        `${AUTH_URL}/connect/token`,
        new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: TRUELAYER_CLIENT_ID,
          client_secret: TRUELAYER_CLIENT_SECRET,
          redirect_uri: redirectUri,
          code: code
        }).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      );

      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_in: response.data.expires_in
      };
    } catch (error: any) {
      console.error('TrueLayer token exchange error:', error.response?.data || error.message);
      return null;
    }
  },

  async refreshToken(refreshToken: string): Promise<TrueLayerTokens | null> {
    try {
      const response = await axios.post(
        `${AUTH_URL}/connect/token`,
        new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: TRUELAYER_CLIENT_ID,
          client_secret: TRUELAYER_CLIENT_SECRET,
          refresh_token: refreshToken
        }).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      );

      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_in: response.data.expires_in
      };
    } catch (error: any) {
      console.error('TrueLayer token refresh error:', error.response?.data || error.message);
      return null;
    }
  },

  async getAccounts(accessToken: string): Promise<TrueLayerAccount[]> {
    try {
      const response = await axios.get(
        `${API_URL}/data/v1/accounts`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );

      return response.data.results || [];
    } catch (error: any) {
      console.error('TrueLayer get accounts error:', error.response?.data || error.message);
      return [];
    }
  },

  async getAccountBalance(accessToken: string, accountId: string): Promise<TrueLayerBalance | null> {
    try {
      const response = await axios.get(
        `${API_URL}/data/v1/accounts/${accountId}/balance`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );

      const results = response.data.results;
      if (results && results.length > 0) {
        return results[0];
      }
      return null;
    } catch (error: any) {
      console.error('TrueLayer get balance error:', error.response?.data || error.message);
      return null;
    }
  },

  async getAllBalances(accessToken: string): Promise<{ accountId: string; balance: TrueLayerBalance }[]> {
    try {
      const accounts = await this.getAccounts(accessToken);
      const balances: { accountId: string; balance: TrueLayerBalance }[] = [];

      for (const account of accounts) {
        const balance = await this.getAccountBalance(accessToken, account.account_id);
        if (balance) {
          balances.push({ accountId: account.account_id, balance });
        }
      }

      return balances;
    } catch (error: any) {
      console.error('TrueLayer get all balances error:', error.message);
      return [];
    }
  },

  async getTotalBalance(accessToken: string): Promise<{ total: number; currency: string; accounts: number } | null> {
    try {
      const balances = await this.getAllBalances(accessToken);
      
      if (balances.length === 0) {
        return null;
      }

      const total = balances.reduce((sum, b) => sum + (b.balance.available || b.balance.current || 0), 0);
      const currency = balances[0]?.balance.currency || 'GBP';

      return {
        total,
        currency,
        accounts: balances.length
      };
    } catch (error: any) {
      console.error('TrueLayer get total balance error:', error.message);
      return null;
    }
  },

  isConfigured(): boolean {
    return !!(TRUELAYER_CLIENT_ID && TRUELAYER_CLIENT_SECRET);
  }
};

export default truelayerService;
