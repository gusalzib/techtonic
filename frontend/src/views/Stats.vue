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
import { ref, onMounted, watch, computed } from 'vue'; //ref, computed, onMounted, watch, nextTick → Vue Composition API functions for reactive data, lifecycle hooks, and DOM updates.
import axios from 'axios'; //axios → for HTTP requests to fetch statistics from backend.
import { useToast } from 'vue-toastification'; //useToast → provides toast notifications for user feedback.
import { Pie, Bar, Line } from 'vue-chartjs'; //Pie, Bar, Line → chart components from vue-chartjs.

//ChartJS and related elements → core Chart.js components and plugins.
import { 
  Chart as ChartJS, 
  ArcElement, Tooltip, Legend, 
  CategoryScale, LinearScale, 
  BarElement, PointElement, LineElement
} from 'chart.js';
import { MatrixController, MatrixElement } from 'chartjs-chart-matrix'; //MatrixController & MatrixElement → needed for rendering a heatmap (matrix chart).
import { nextTick } from 'vue';


//Registers Chart.js components globally so charts (pie/bar/line/matrix) can be rendered.
//This ensures Chart.js knows how to draw all elements we will use.
ChartJS.register(
  ArcElement, Tooltip, Legend, 
  CategoryScale, LinearScale, 
  BarElement, PointElement, LineElement, MatrixElement,
  MatrixController
);

export default {
  components: {
    PieChart: Pie, //Declares local vue components for charts. so we can use <PieChart>, <BarChart>, <LineChart> in the template.
    BarChart: Bar,
    LineChart: Line,
  },

  setup() {
    const toast = useToast(); //setup() function: main entry point for Composition API logic. toast is a helper to show success/error messages.


    /*
     * Reactive object to hold all statistics fetched from the backend.
     * Default values initialized to 0 or empty arrays/objects.
     */
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


    /*
     * Holds filtering criteria for the statistics query (date range, subject, status, tag).
     * v-model in template binds inputs to this reactive object.
     */
    const filters = ref({
      startDate: '',
      endDate: '',
      subject: '',
      status: '',
      tag: '',
    });

    /**
     * Reactive variables for dropdown selection of chart type.
     * Determines which chart component is rendered dynamically.
     */
    const selectedStatusChartType = ref('Pie');
    const selectedSubjectChartType = ref('Bar');
    const selectedCompletionChartType = ref('Line');


    /**
     * computed properties for conditional rendering:
     * hasStatusData → checks if any status count > 0.
     * hasSubjectData → checks if timeBySubject array has data.
     * hasCompletionData → checks if completionRate is > 0.
     */
    const hasStatusData = computed(() => 
      Object.values(stats.value.statusBreakdown).some(value => value > 0)
    );

    const hasSubjectData = computed(() => 
      stats.value.timeBySubject.length > 0
    );

    const hasCompletionData = computed(() => 
      stats.value.completionRate > 0
    );


    /**
     * fetchStatistics is an async function to fetch data from backend.
     * Sends filters as query parameters and includes an auth token.
     * On success:
     *  Updates stats.
     *  Shows a success toast.
     *  Calls renderHeatmap to update the heatmap.
     * 
     * On failure → shows error toast.
     */
    const fetchStatistics = async () => {
      // console.log('pressed');
      try {
        const response = await axios.get('http://localhost:5000/api/timoria/statistics', {
          params: filters.value,
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('token')}` 
          }
        });
        stats.value = response.data;
        toast.success('Statistics updated');
        // console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
        
        // console.log('Data received for heatmap:', stats.value.timeSpentPerDay);

        renderHeatmap(stats.value.timeSpentPerDay || []);

        // console.log('Canvas Reference:', heatmapCanvas.value);
      } catch (error) {
        toast.error('Failed to load statistics');
      }
    };

    /**
     * Reference to <canvas> element in template for heatmap rendering.
     * Will be used by Chart.js to draw the matrix chart.
     */
    const heatmapCanvas = ref(null);


    /**############################################################### PROCESS YEARLY DATA ################################################################## */
    /**
     * 
     * @param dailyData 
     * Converts raw daily data into structured monthly data for the last 12 months.
     * Initializes all months to have empty days object.
     * Fills in days with actual hours if available.
     * Returns array with most recent month first.
     */
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
          monthIndex: date.getMonth(),
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
      /**XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX */


      /**############################################################### RENDER HEAT MAP ################################################################## */

      /**
       * 
       * @param data 
       * Main function to draw the heatmap chart.
       * Uses MatrixController type to create a day × month grid.
       * Colors each cell according to the number of hours spent (heatmap intensity).
       * Recreates the chart if one exists already to prevent duplicates.
       * Tooltips show readable day/month + hours info.
       * 
       * data is expected to be an array of objects representing daily time spent, typically from stats.value.timeSpentPerDay
       * Purpose: render a matrix/heatmap chart showing hours spent per day across the last 12 months.
       */
    const renderHeatmap = (data) => {

      /*Checks if the heatmapCanvas reference exists.
        If the <canvas> element is not yet rendered or not accessible, exit early to avoid errors.*/
      if (!heatmapCanvas.value) return;


      /**
       * Retrieves the 2D rendering context of the canvas.
       * The Chart.js library requires this context to draw the chart.
       * Exit early if ctx is unavailable (extra safety check).
       */
      const ctx = heatmapCanvas.value.getContext('2d');
      if (!ctx) return;


      /**
       * If a heatmap chart already exists in window.heatmapChart, destroy it.
       * Prevents overlaying multiple charts on the same canvas when re-rendering.
       * window.heatmapChart acts as a global reference to the current chart instance.
       */
      if (window.heatmapChart) {
        window.heatmapChart.destroy();
      }


      /**
       * Calls processYearlyData to convert raw daily entries into structured monthly data:
       *  Groups by month/year.
       *  Fills empty days with 0.
       *  Returns array of months, each with a days object mapping day → hours.
       * 
       * data || [] ensures an empty array is passed if data is null or undefined.
       * Logs processed data for debugging.
       */
      const months = processYearlyData(data || []);
      console.log('Processed months:', months);


      // Default colors for heatmap. Defines color levels for the heatmap intensity.
      const colors = ['#e0e0e0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];

      // Prepare chart data (day of month vs month)
      // const chartData = months.flatMap(month => {
      //   return Object.entries(month.days).map(([day, hours]) => ({
      //     x: parseInt(day),
      //     y: `${month.month} ${month.year}`,
      //     v: hours,
      //     day: parseInt(day)
      //   }));
      // });
      // Prepare chart data (day of month vs month)

      
      const chartData = months.flatMap(month => {
        const daysData = [];

        // Iterate through all days of the month (1 to 31)
        for (let day = 1; day <= 31; day++) {
          const hours = month.days[day] ?? 0; // Assign 0 if no data for the day
          daysData.push({
            x: day,
            y: `${month.month} ${month.year}`,
            v: hours,
            day
          });
        }

        return daysData;
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
                color: '#1a8c0e', 
                stepSize: 1,
                font: { size: 9 }
              },
              grid: { display: false }
            },
            y: {
              type: 'category',
              labels: months.map(m => `${m.month} ${m.year}`),
              offset: true,
              grid: { display: false },
              ticks: {
                color: '#1a8c0e', 
              }
            }
          },
          plugins: {
            legend: {
              display: false,
              labels: {
                color: '#1a8c0e', 
              }
              
            },
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

    /**XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX */


    /**############################################################### ON MOUNTED ################################################################## */

    /**
     * Lifecycle hook: runs after component mounts.
     * Uses nextTick to ensure DOM (canvas) is rendered before accessing it.
     * Calls fetchStatistics to load initial data.
     */
    onMounted(() => {

      nextTick(() => {
        console.log('Canvas Reference after DOM render:', heatmapCanvas.value);
        fetchStatistics();
      });

    });

    /**XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX */


    /**############################################################### GET CHART COMPONENT ################################################################## */

    /**
     * 
     * @param type 
     * Helper to return the correct chart component dynamically based on user selection.
     */
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

    /**XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX */

    /**############################################################### GET RANDOM COLOR ################################################################## */

    /**
     * Generates a semi-transparent random color (used in subject charts to differentiate bars/slices).
     */
    const getRandomColor = () => {
      const r = Math.floor(Math.random() * 256);
      const g = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      return `rgba(${r}, ${g}, ${b}, 0.9)`;  // 0.9 for slight transparency
    };

    /**XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX */


    /**
     * Exposes reactive data, methods, and computed properties to template.
     */
    return {
      // -----------------------------
      // Reactive state exposed to <template>
      // -----------------------------

      stats,   // Entire statistics payload fetched from the API; template reads from this.
      filters, // Current filter values (bound via v-model in the template) that are sent to the API.

      // Chart-type selectors bound to the dropdowns; used to decide which chart component to render.
      selectedStatusChartType,
      selectedSubjectChartType,
      selectedCompletionChartType,

      // Helper that maps a string ('Pie' | 'Bar' | 'Line') to an actual vue-chartjs component.
      getChartComponent,

      // <canvas> ref for the heatmap (Chart.js matrix) so we can render into it.
      heatmapCanvas,

      // Triggers an API call, updates `stats`, and re-renders the heatmap.
      fetchStatistics,

      // Computed properties for conditional rendering of charts based on data availability.
      // Guard booleans used by v-if in the template to show charts or "no data" messages.
      hasStatusData,
      hasSubjectData,
      hasCompletionData,

      /**
      * ============================
      * Chart data (COMPUTED)
      * ============================
      * These computed properties transform the raw `stats` into the exact data
      * structures expected by Chart.js. Because they’re `computed`, they re-run
      * only when their dependencies change (i.e., when `stats` changes), which:
      *   - Keeps your charts in sync with API responses automatically
      *   - Avoids unnecessary recalculation/rerendering
      *   - Prepares chart data and options for status, subject, and completion charts.
      *   - computed properties ensure charts automatically update when stats changes.
      */

      // ---- STATUS BREAKDOWN (Planned / Ongoing / Completed) ----
      statusChartData: computed(() => ({
        // Labels for the legend / axes, depending on chart type.
        labels: ['Planned', 'Ongoing', 'Completed'],
        // Chart.js always expects an array of datasets even if there's only one.
        datasets: [{
          // The numeric values in the same order as `labels`.
          data: [
            stats.value.statusBreakdown.planned,
            stats.value.statusBreakdown.ongoing,
            stats.value.statusBreakdown.done,
          ],
          // Colors for each segment/bar/point in the same order as the labels.
          // (These are stable, so the colors won’t shuffle between renders.)
          backgroundColor: ['#FFCE56', '#36A2EB', '#4BC0C0'],
        }],
      })),

      // ---- TIME BY SUBJECT (e.g., "Math", "Biology") ----
      subjectChartData: computed(() => {
        // This is expected to be something like:
        // [{ subject: 'Math', hours: 12.5 }, { subject: 'Biology', hours: 4 }, ...]
      const subjects = stats.value.timeBySubject;
      
        return {
        // X-axis / legend labels come from each subject name.
          labels: subjects.map(s => s.subject),
        
          datasets: [{
          // A dataset label shown in legends and tooltips.
            label: 'Hours spent',
            // Y-axis values, aligned by index with `labels`.
            data: subjects.map(s => s.hours),

            // Give each subject its own color. Note:
            // This calls getRandomColor() on each computed re-evaluation.
            // If the source array order changes, colors may appear to shuffle.
            // To keep colors stable, you could memoize by subject name.
            backgroundColor: subjects.map(() => getRandomColor()),  // Generate random color for each subject
          }]
      };
    }),

    // ---- COMPLETION RATE (Single value, percentage) ----
      completionChartData: computed(() => ({
      // Single-label x-axis (or category) because we plot just one bar/point.
      labels: ['Completion Rate'],
      datasets: [{
        label: 'Completion %',
        // Wrap in array because Chart.js expects an array; value is a % number.
        data: [stats.value.completionRate],
        backgroundColor: '#4BC0C0',
      }],
      })),
    
      /**
       * Base options applied to all vue-chartjs charts (Pie/Bar/Line) rendered via <component>.
       * - responsive: resizes with container
       * - maintainAspectRatio: false allows the chart to fill the container’s height (useful in your fixed-height .chart-container)
       *
       * You can further extend/override per-chart options if needed by passing new objects.
       */
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
  /* color: #888; */
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
