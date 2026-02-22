<template>
  <div class="form-container">
    <form @submit.prevent="handleSubmit" class="budget-form">
      <h3>{{ $t('budget.addTransaction') || 'Add Transaction' }}</h3>

      <div class="form-group">
        <label>{{ $t('budget.type') || 'Type' }}</label>
        <div class="radio-group">
          <input class="transaction-form-input" type="radio" v-model="transaction.type" value="expense" id="exp" />
          <label for="exp">{{ $t('budget.expense') || 'Expense' }}</label>
          <input class="transaction-form-input" type="radio" v-model="transaction.type" value="income" id="inc" />
          <label for="inc">{{ $t('budget.income') || 'Income' }}</label>
        </div>
      </div>

      <div class="form-group">
        <label>{{ $t('budget.category') || 'Category' }}</label>
        <select v-model="transaction.category_id" required>
          <option value="" disabled>{{ $t('budget.selectCategory') || 'Select a category' }}</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">
            {{ cat.name }}
          </option>
        </select>
      </div>

      <input class="transaction-form-input" type="number" v-model="transaction.amount" placeholder="0.00" step="0.01" required />
      <input class="transaction-form-input" type="text" v-model="transaction.receiver" :placeholder="$t('budget.receiverPlaceholder') || 'Receiver (e.g., Lidl)'" required />
      <input class="transaction-form-input" type="text" v-model="transaction.description" :placeholder="$t('budget.descriptionPlaceholder') || 'Description (Optional)'" />
      <input class="transaction-form-input" type="date" v-model="transaction.payment_date" required />

      <div class="form-group checkbox">
        <input class="budget-checkbox" type="checkbox" v-model="transaction.recurring" id="rec" />
        <label for="rec">{{ $t('budget.recurring') || 'Recurring Transaction' }}</label>
      </div>

      <button class="standard-btn" type="submit" :disabled="loading">
        {{ loading ? $t('buttons.saving') : $t('buttons.save') }}
      </button>
    </form>
  </div>
</template>

<script>
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';
import { useToast } from 'vue-toastification';

export default {
  name: 'AddTransaction',
  data() {
    return {
      categories: [],
      loading: false,
      url: `${API_BASE_URL}/budget`,
      transaction: {
        amount: null,
        description: '',
        receiver: '',
        type: 'expense',
        category_id: '',
        payment_date: new Date().toISOString().split('T')[0],
        recurring: false
      },
      toast: null
    };
  },
  mounted() {
    this.toast = useToast();
    this.fetchCategories();
  },
  methods: {
    async fetchCategories() {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${this.url}/categories`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        this.categories = response.data;
      } catch (err) {
        this.toast?.error(this.$t('notification.failedToLoadCategories') || 'Failed to load categories');
      }
    },
    async handleSubmit() {
      this.loading = true;
      try {
        const token = localStorage.getItem('token');
        await axios.post(`${this.url}/transactions/create`, this.transaction, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        this.toast?.success(this.$t('notification.transactionAdded') || 'Transaction added successfully');
        
        // 1. Reset the form locally
        this.resetForm();

        // 2. Emit "saved" to the parent
        // IMPORTANT: Go to the parent file and ensure @saved="doSomething" 
        // does NOT contain a router.push() if you want to stay on this page.
        this.$emit('saved');

      } catch (err) {
        this.toast?.error(this.$t('notification.failedToAddTransaction') || 'Failed to add transaction');
      } finally {
        this.loading = false;
      }
    },
    resetForm() {
      this.transaction = {
        amount: null,
        description: '',
        receiver: '',
        type: 'expense',
        category_id: '',
        payment_date: new Date().toISOString().split('T')[0],
        recurring: false
      };
    }
  }
};
</script>

<style scoped src="../assets/styles/main.css"></style>

<style scoped>
/* .form-group { display: flex; flex-direction: column; }
.radio-group { display: flex; gap: 10px; }
.checkbox { flex-direction: row; gap: 5px; } */
</style>