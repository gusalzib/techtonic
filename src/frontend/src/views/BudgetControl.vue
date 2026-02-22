<template>
  <div class="budget-container">
    <nav class="tab-bar">
      <button 
        :class="{ active: currentTab === 'add' }" 
        @click="currentTab = 'add'"
      >
        {{ $t('budget.addTransaction') || 'Add Transaction' }}
      </button>
      <button 
        :class="{ active: currentTab === 'stats' }" 
        @click="currentTab = 'stats'"
      >
        {{ $t('budget.budgetStatistics') || 'Statistics' }}
      </button>
    </nav>

    <hr />

    <div class="content">
      <keep-alive>
        <component 
          :is="currentTab === 'add' ? 'TransactionForm' : 'BudgetStatistics'" 
          @saved="handleSaved"
        />
      </keep-alive>
    </div>
  </div>
</template>

<script>
import TransactionForm from '../components/TransactionForm.vue';
import BudgetStatistics from '../components/BudgetStatistics.vue';
import { API_BASE_URL } from '@/config/api';


export default {
    name: 'BudgetControl',
    
    /**
     * COMPONENTS
     */
    components: {
        TransactionForm,
        BudgetStatistics
    },

    /**
     * DATA SECTION
     */
    data() {
        return {
            // This controls which component is visible
            currentTab: 'add', 
            // Shared state can go here if needed later
            lastUpdate: null,
            url: `${API_BASE_URL}`,
        }
    },

    /**
     * METHODS
     */
    methods: {
        /**
         * Triggered when TransactionForm emits @saved
         * Switches the view to statistics so the user can see the new data
         */
        handleSaved() {
            // this.currentTab = 'stats';
            this.lastUpdate = Date.now();
        }
    },

    /**
     * COMPUTED PROPERTIES 
     */
    computed: {
        // Example: logic to show a notification if data was recently added
        isRecentlyUpdated() {
            return this.lastUpdate !== null;
        }
    }
}
</script>

<style scoped>
.budget-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.tab-bar { 
  display: flex; 
  gap: 10px; 
  margin-bottom: 20px; 
}

button { 
  padding: 10px 20px; 
  cursor: pointer; 
  border: 1px solid #ddd; 
  background-color: #f9f9f9;
  transition: all 0.3s ease;
}

button:hover {
  background-color: #eee;
}

.active { 
  background-color: #42b983; 
  color: white; 
  border: 1px solid #42b983;
  border-radius: 4px; 
  font-weight: bold;
}

.content {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
}
</style>