<template>
  <div class="stats-view">
    <div class="budget-chart-container">
      <h3>{{ $t('budget.monthlyOverview') || 'Monthly Overview' }}</h3>
      <Bar v-if="loaded" :data="chartData" :options="chartOptions" />
    </div>

    <div class="summary-cards">
      <div class="card">{{ $t('budget.totalIncome') || 'Total Income' }}: {{ stats.income }}</div>
      <div class="card">{{ $t('budget.totalExpenses') || 'Total Expenses' }}: {{ stats.expense }}</div>
      <div class="card balance">{{ $t('budget.net') || 'Net' }}: {{ stats.income - stats.expense }}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th>{{ $t('table.date') || 'Date' }}</th>
          <th>{{ $t('budget.receiver') || 'Receiver' }}</th>
          <th>{{ $t('budget.amount') || 'Amount' }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="t in transactions" :key="t._id" :class="t.type">
          <td>{{ formatDate(t.payment_date) }}</td>
          <td>{{ t.receiver }}</td>
          <td>{{ t.type === 'expense' ? '-' : '+' }}{{ t.amount }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';
import { useToast } from 'vue-toastification';

// Chart.js Imports
import { Bar } from 'vue-chartjs';
import { 
  Chart as ChartJS, 
  Title, 
  Tooltip, 
  Legend, 
  BarElement, 
  CategoryScale, 
  LinearScale 
} from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

export default {
  name: 'BudgetStatistics',
  components: {
    Bar
  },
  data() {
    return {
      transactions: [],
      loaded: false,
      url: `${API_BASE_URL}/budget`,
      toast: null,
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
      }
    };
  },
  computed: {
    // Calculates summary totals
    stats() {
      return this.transactions.reduce((acc, curr) => {
        acc[curr.type] += curr.amount;
        return acc;
      }, { income: 0, expense: 0 });
    },

    // Groups transactions by Month (Chronological)
    chartData() {
      const monthlyData = {};

      this.transactions.forEach(t => {
        const date = new Date(t.payment_date);
        if (isNaN(date.getTime())) return; // Safety check

        const year = date.getFullYear();
        const month = date.getMonth();
        const key = `${year}-${String(month + 1).padStart(2, '0')}`;

        if (!monthlyData[key]) {
          monthlyData[key] = {
            income: 0,
            expense: 0,
            label: date.toLocaleString('default', { month: 'short', year: '2-digit' })
          };
        }
        
        const amount = Number(t.amount) || 0;
        monthlyData[key][t.type] += amount;
      });

      const sortedKeys = Object.keys(monthlyData).sort();

      return {
        labels: sortedKeys.map(k => monthlyData[k].label),
        datasets: [
          {
            label: this.$t('budget.income') || 'Income',
            backgroundColor: '#4ade80',
            data: sortedKeys.map(k => monthlyData[k].income)
          },
          {
            label: this.$t('budget.expenses') || 'Expenses',
            backgroundColor: '#f87171',
            data: sortedKeys.map(k => monthlyData[k].expense)
          }
        ]
      };
    }
  },
  mounted() {
    this.toast = useToast();
    this.fetchData();
  },
  methods: {
    async fetchData() {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${this.url}/transactions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // If your table showed March 2023 before, we ensure data is sorted 
        // oldest to newest for the chart logic to work perfectly.
        this.transactions = res.data;
        this.loaded = true;
      } catch (error) {
        console.error("Loading Transactions Failed", error);
        this.toast?.error(this.$t('notification.loadingTransactionFailed') || 'Loading Transaction Failed');
      }
    },
    formatDate(d) {
      return new Date(d).toLocaleDateString();
    }
  }
};
</script>

<style scoped>
/* Scoped to avoid bleeding styles into other components */

.summary-cards { display: flex; gap: 20px; margin-bottom: 20px; font-weight: bold; }

</style>