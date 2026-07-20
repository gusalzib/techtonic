import { defineStore } from 'pinia'
import { API_BASE_URL } from '@/config/api';

export const useUserStore = defineStore('user', {
// State holds reactive values for the user
  state: () => ({
    isLoggedIn: false,
    isAdmin: false,
    isRegular: false,
    isPaid: false,
    username: '',
    timezone: '',
    userId: null
  }),
  // Actions are like methods: async functions that update the state
  actions: {
    /**
     * Check the current user's status using the token in localStorage
     */
    async checkUserStatus() {
      const token = localStorage.getItem('token');
      if (!token) {
        this.isLoggedIn = false;
        return;
      }

      const response = await fetch(`${API_BASE_URL}/users/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        this.isLoggedIn = false;
        return;
      }

    // Update state based on response
      const data = await response.json();
      
      this.isLoggedIn = data.isLoggedIn;
      this.isAdmin = data.isAdmin;
      this.isRegular = data.isRegular;
      this.isPaid = data.isPaid;
      this.username = data.username;
      this.timezone   = data.timezone || this.timezone || 'Europe/Stockholm';
      this.userId = data.userId;
    },
    /**
     * Clear local user state and remove token
     */
    logout() {
      localStorage.removeItem('token');
      this.resetState();
    },

    /**
     * Helper to reset all auth-related state variables
     */
    resetState() {
      this.isLoggedIn = false;
      this.isAdmin = false;
      this.isRegular = false;
      this.isPaid = false;
      this.username = '';
      this.timezone   = '';
      this.userId = null;
    }
  
  }
})
