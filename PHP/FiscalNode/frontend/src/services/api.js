const API_BASE_URL = '/api';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Budget endpoints
  async getBudgets() {
    return this.request('/budgets');
  }

  async getBudget(id) {
    return this.request(`/budgets/${id}`);
  }

  async createBudget(budget) {
    return this.request('/budgets', {
      method: 'POST',
      body: budget,
    });
  }

  // Transaction endpoints
  async createTransaction(transaction) {
    return this.request('/transactions', {
      method: 'POST',
      body: transaction,
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Database setup endpoints
  async checkDatabaseStatus() {
    return this.request('/setup/check');
  }

  async initializeDatabase() {
    return this.request('/setup/database', {
      method: 'POST',
    });
  }
}

export default new ApiService();

