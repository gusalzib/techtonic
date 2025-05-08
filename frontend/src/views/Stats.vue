<template>
  <div class="stats-container">
    <header class="stats-header">
      <h1>{{ $t('stats.title') }}</h1>
      <div class="date-range-filter">
        <input type="date" v-model="filters.startDate" />
        <input type="date" v-model="filters.endDate" />
        <button @click="fetchStatistics">{{ $t('buttons.apply') }}</button>
      </div>
    </header>

    <div class="summary-overview">
      <div class="total-timorias">
        <p>{{ $t('stats.totalTimorias') }}: {{ stats.totalTimorias }}</p>
        <p>{{ $t('stats.totalCompletedTimorias') }}: {{ stats.totalCompletedTimorias }}</p>
        <p>{{ $t('stats.totalTimeSpent') }}: {{ stats.totalTimeSpent.toFixed(2) }} {{ $t('hours') }}</p>
        <p>{{ $t('stats.totalTopics') }}: {{ stats.totalTopics }} </p>
        <p>{{ $t('stats.totalSubjects') }}: {{ stats.totalSubjects }} </p>
        <p>{{ $t('stats.averageDuration') }}: {{ stats.averageDuration }} {{ $t('minutes') }}</p>
      </div>

      <div class="status-breakdown">
        <p>{{ $t('stats.statusBreakdown') }}:</p>
        <div class="chart-controls">
          <label>{{ $t('stats.chartType') }}</label>
          <select v-model="selectedStatusChartType">
            <option value="Pie">Pie</option>
            <option value="Bar">Bar</option>
            <option value="Line">Line</option>
          </select>
        </div>
        <div class="chart-container">
          <component
            :is="getChartComponent(selectedStatusChartType)"
            v-if="hasStatusData"
            :data="statusChartData"
            :options="chartOptions"
          />
          <div v-else class="no-data">{{ $t('stats.noData') }}</div>
        </div>
      </div>
    </div>

    <div class="stats-details">
      <div class="time-by-subject">
        <p>{{ $t('stats.timeSpentBySubject') }}</p>
        <div class="chart-controls">
          <label>{{ $t('stats.chartType') }}</label>
          <select v-model="selectedSubjectChartType">
            <option value="Pie">Pie</option>
            <option value="Bar">Bar</option>
            <option value="Line">Line</option>
          </select>
        </div>
        <div class="chart-container">
          <component
            :is="getChartComponent(selectedSubjectChartType)"
            v-if="hasSubjectData"
            :data="subjectChartData"
            :options="chartOptions"
          />
          <div v-else class="no-data">{{ $t('stats.noData') }}</div>
        </div>
      </div>

      <div class="stats-detail">
          <div class="heatmap-section">
            <p>{{ $t('stats.heatmapTitle') }}</p>
            <div class="chart-container">
              <canvas ref="heatmapCanvas"></canvas>
            </div>
          </div>
      </div>

    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, computed } from 'vue';
import axios from 'axios';
import { useToast } from 'vue-toastification';
import { Pie, Bar, Line } from 'vue-chartjs';
import { 
  Chart as ChartJS, 
  ArcElement, Tooltip, Legend, 
  CategoryScale, LinearScale, 
  BarElement, PointElement, LineElement
} from 'chart.js';
import { MatrixController, MatrixElement } from 'chartjs-chart-matrix';
import { nextTick } from 'vue';

ChartJS.register(
  ArcElement, Tooltip, Legend, 
  CategoryScale, LinearScale, 
  BarElement, PointElement, LineElement, MatrixElement,
  MatrixController
);

export default {
  components: {
    PieChart: Pie,
    BarChart: Bar,
    LineChart: Line,
  },

  setup() {
    const toast = useToast();

    const stats = ref({
      totalTimorias: 0,
      totalTimeSpent: 0,
      totalTopics: 0,
      totalSubjects: 0,
      totalCompletedTimorias: 0,
      statusBreakdown: { planned: 0, ongoing: 0, done: 0 },
      timeBySubject: [],
      completionRate: 0,
      averageDuration: 0,
      timeSpentPerDay: 0,
    });

    const filters = ref({
      startDate: '',
      endDate: '',
      subject: '',
      status: '',
      tag: '',
    });

    const selectedStatusChartType = ref('Pie');
    const selectedSubjectChartType = ref('Bar');
    const selectedCompletionChartType = ref('Line');

    const hasStatusData = computed(() => 
      Object.values(stats.value.statusBreakdown).some(value => value > 0)
    );

    const hasSubjectData = computed(() => 
      stats.value.timeBySubject.length > 0
    );

    const hasCompletionData = computed(() => 
      stats.value.completionRate > 0
    );

    const fetchStatistics = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/timoria/statistics', {
          params: filters.value,
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('token')}` 
          }
        });
        stats.value = response.data;
        toast.success('Statistics updated');
        console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
        
        console.log('Data received for heatmap:', stats.value.timeSpentPerDay);

        renderHeatmap(stats.value.timeSpentPerDay || []);

        console.log('Canvas Reference:', heatmapCanvas.value);
      } catch (error) {
        toast.error('Failed to load statistics');
      }
    };
    const heatmapCanvas = ref(null);



const processYearlyData = (dailyData) => {
  if (!dailyData || !dailyData.length) return [];
  
  // Get date range for past 12 months
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(endDate.getMonth() - 11);
  
  // Initialize all months
  const monthsData = [];
  for (let i = 0; i < 12; i++) {
    const date = new Date(startDate);
    date.setMonth(startDate.getMonth() + i);
    const monthYear = `${date.getFullYear()}-${date.getMonth()}`;
    monthsData.push({
      month: date.toLocaleString('default', { month: 'short' }),
      year: date.getFullYear(),
      days: {}
    });
  }

  // Fill with actual data
  dailyData.forEach(entry => {
    const date = new Date(entry.date);
    const monthYear = `${date.getFullYear()}-${date.getMonth()}`;
    const day = date.getDate();
    
    const monthData = monthsData.find(m => 
      `${m.year}-${new Date(`${m.year}-${m.month}-1`).getMonth()}` === monthYear
    );
    
    if (monthData) {
      monthData.days[day] = entry.hours;
    }
  });

  return monthsData.reverse(); // Show recent months first
};


const renderHeatmap = (data) => {
  if (!heatmapCanvas.value) return;

  const ctx = heatmapCanvas.value.getContext('2d');
  if (!ctx) return;

  if (window.heatmapChart) {
    window.heatmapChart.destroy();
  }

  const months = processYearlyData(data || []);
  console.log('Processed months:', months);

  // Prepare chart data (day of month vs month)
  const chartData = months.flatMap(month => {
    return Object.entries(month.days).map(([day, hours]) => ({
      x: parseInt(day),
      y: `${month.month} ${month.year}`,
      v: hours,
      day: parseInt(day)
    }));
  });

  window.heatmapChart = new ChartJS(ctx, {
    type: 'matrix',
    data: {
      datasets: [{
        label: 'Time Spent',
        data: chartData,
        backgroundColor: (ctx) => {
          const value = ctx.raw?.v || 0;
          const level = Math.min(Math.floor(value), 4);
          return ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'][level];
        },
        width: 15,
        height: 15,
        borderWidth: 1,
        borderColor: '#f6f8fa'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          min: 1,
          max: 31,
          ticks: {
            stepSize: 1,
            font: { size: 9 }
          },
          grid: { display: false }
        },
        y: {
          type: 'category',
          labels: months.map(m => `${m.month} ${m.year}`),
          offset: true,
          grid: { display: false }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              return `${ctx.raw.y} - Day ${ctx.raw.x}: ${ctx.raw.v} hours`;
            }
          }
        }
      }
    }
  });
};
    

    onMounted(() => {
      nextTick(() => {
        console.log('Canvas Reference after DOM render:', heatmapCanvas.value);
        fetchStatistics();
      });
    });

    const getChartComponent = (type) => {
      switch (type) {
        case 'Pie':
          return Pie;
        case 'Bar':
          return Bar;
        case 'Line':
          return Line;
        default:
          return Pie;
      }
    };

    return {
      stats,
      filters,
      selectedStatusChartType,
      selectedSubjectChartType,
      selectedCompletionChartType,
      getChartComponent,
      heatmapCanvas,

      hasStatusData,
      hasSubjectData,
      hasCompletionData,

      statusChartData: computed(() => ({
        labels: ['Planned', 'Ongoing', 'Completed'],
        datasets: [{
          data: [
            stats.value.statusBreakdown.planned,
            stats.value.statusBreakdown.ongoing,
            stats.value.statusBreakdown.done,
          ],
          backgroundColor: ['#FFCE56', '#36A2EB', '#4BC0C0'],
        }],
      })),

      subjectChartData: computed(() => ({
        labels: stats.value.timeBySubject.map(s => s.subject),
        datasets: [{
          label: 'Hours spent',
          data: stats.value.timeBySubject.map(s => s.hours),
          backgroundColor: '#FF6384',
        }],
      })),

      completionChartData: computed(() => ({
        labels: ['Completion Rate'],
        datasets: [{
          label: 'Completion %',
          data: [stats.value.completionRate],
          backgroundColor: '#4BC0C0',
        }],
      })),

      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
      },
    };
  },
};
</script>

<style scoped>
.stats-container {
  padding: 1rem;
}
.chart-container {
  height: 300px;
  margin: 1rem 0;
}
.chart-controls {
  margin-bottom: 1rem;
}
.no-data {
  color: #888;
  font-size: 1rem;
  text-align: center;
}
.heatmap-section {
  max-width: 100%;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif; /* GitHub's font */
}



canvas {
  border-radius: 3px; /* GitHub's subtle rounding */
}

</style>
