<template>
  <section class="timoria-summary">
    <header class="summary-header">
      <h2>{{ $t('summary.title') || 'Timoria Summary' }}</h2>
      <p>{{ $t('summary.description') || 'Browse all your past Timorias' }}</p>
    </header>
    <!--
      PERIOD CONTROLS

      This block contains:
      1) Month navigation (previous / next month)
      2) Custom date range controls (start / end date inputs)

      The idea:
      - By default, the component shows data for a single month.
      - User can override that by specifying a custom date range.
    -->
    <!-- Period controls -->
    <div class="summary-filters">

       <!--
        MONTH NAVIGATION

        This is only meaningful when we are NOT in custom range mode.
        The component code itself ignores clicks when a custom range is active.

        `formattedPeriodLabel` is a computed property that:
        - Shows "YYYY-MM" when using month mode
        - Shows "YYYY-MM-DD → YYYY-MM-DD" when a custom range is active
      -->
      <div class="month-navigation">
        <!-- Go to previous month (if not in custom range mode) -->
        <button @click="goToPreviousMonth" v-tooltip="$t('tooltip.summary.prevMonth')">« {{ $t('summary.prevMonth') || 'Previous month' }} </button>

        <!-- Shows either a month label (e.g. "November 2025") or the custom range text -->
        <span class="current-period">
          {{ formattedPeriodLabel }}
        </span>

         <!-- Go to next month (if not in custom range mode) -->
        <button @click="goToNextMonth" v-tooltip="$t('tooltip.summary.nextMonth')">{{ $t('summary.nextMonth') || 'Next month' }} »</button>
      </div>


      <!--
        CUSTOM RANGE

        Two <input type="date"> bound via v-model to:
        - customStartDate
        - customEndDate

        When user clicks "Apply range", we:
        - Validate both dates exist
        - Switch into "custom range" mode implicitly (because isCustomRangeActive becomes true)
        - Re-fetch data using those dates

        When user clicks "Clear range", we:
        - Clear both dates
        - Return back to monthly mode (because isCustomRangeActive becomes false)
        - Re-fetch data for the current month
      -->
      <div class="custom-range">
        <label  v-tooltip="$t('tooltip.summary.startDate')">
          {{ $t('summary.startDate') || 'Start date' }}
           <!--
            v-model on a date input gives us a string in YYYY-MM-DD format.
            This is perfect for sending to the backend as a date filter.
          -->
          <input type="date" v-model="customStartDate">
        </label>
        <label  v-tooltip="$t('tooltip.summary.endDate')">
          {{ $t('summary.endDate') || 'End date' }}
          <input type="date" v-model="customEndDate">
        </label>

        <!-- Apply the selected custom range (triggers a fetch with those dates) -->
        <button @click="applyCustomRange" v-tooltip="$t('tooltip.summary.applyRange')">
          {{ $t('summary.applyRange') || 'Apply range' }}
        </button>

        <!--
          Show "Clear range" only when both dates are set.
          isCustomRangeActive is a computed property that returns true when
          customStartDate AND customEndDate are non-empty.
        -->
        <button @click="clearCustomRange" v-if="isCustomRangeActive" v-tooltip="$t('tooltip.summary.clearRange')">
          {{ $t('summary.clearRange') || 'Clear range' }}
        </button>
      </div>
    </div>

    <!--
      SUMMARY TABLE

      We only render the table if there is at least one Timoria entry:
      - controlled by v-if="timorias.length"

      Otherwise, we show a "No data" message (see <p v-else> further down).

      Purpose of the table:
      - List all fetched Timorias for the current page and period/range
      - Columns: date, task, duration, subject, topic, tag, status
    -->    
      <table class="summary-table" v-if="timorias.length">
      <thead>
        <tr>
          <th>{{ $t('table.date') || 'Date' }}</th>
          <th>{{ $t('table.time') || 'Time' }}</th>
          <th>{{ $t('table.task') }}</th>
          <th>{{ $t('table.duration') }}</th>
          <th>{{ $t('table.subject') }}</th>
          <th>{{ $t('table.topic') }}</th>
          <th>{{ $t('table.tag') }}</th>
          <th>{{ $t('table.status') || 'Status' }}</th>
        </tr>
      </thead>
      <tbody>
        <!--
          v-for to iterate over each Timoria entry.

          :key="t._id" is important for Vue's reactivity and performance.
          It lets Vue track which row corresponds to which data item.
        -->
        <tr v-for="t in timorias" :key="t._id">
          <!--
            Format createdAt into a human-readable date string using formatDate().
            If createdAt is missing or invalid, we show "—".
          -->
          <td>{{ formatDate(t.createdAt) }}</td>
          <td>
              <!-- transform date returns a time string that looks something like this 08:05:52.795Z. getHourMinute cleans that up and displays in the HH:MM format-->
              <div>{{ transformDate(t.finishedAt)[1] }}</div>
          </td>
          <!--
            Show task if present, else fallback to "—" so the column doesn't look empty.
          -->
          <td>{{ t.task || '—' }}</td>
          <td>{{ this.formatDuration(t.duration) }}</td>
          <td>{{ t.subject }}</td>
          <td>{{ t.topic }}</td>
          <td>{{ t.tag || '—' }}</td>
          <td>{{ t.status }}</td>
        </tr>
      </tbody>
    </table>

    <!--
      NO DATA MESSAGE

      This is shown only when timorias.length === 0.
      It gives feedback to the user that no data was found for the chosen period or range.
    -->
    <p v-else class="no-data">
      {{ $t('summary.noData') || 'No Timorias found for this period.' }}
    </p>

    <!--
      PAGINATION CONTROLS

      Displayed only if there are at least 2 pages: totalPages > 1

      Behavior:
      - "Previous" button disabled when you are on page 1.
      - "Next" button disabled when you are on the last page.
      - Clicking a button calls changePage() which:
          * updates `page`
          * re-fetches data from the backend
    -->    
    <div class="pagination" v-if="totalPages > 1">
      <button
        :disabled="page === 1"
        @click="changePage(page - 1)"
      >
        {{ $t('summary.prevPage') || 'Previous' }}
      </button>

      <!-- Informational label showing current page and total pages -->
      <span>
        {{ $t('summary.page') || 'Page' }} {{ page }} / {{ totalPages }}
      </span>

      <button
        :disabled="page === totalPages"
        @click="changePage(page + 1)"
      >
        {{ $t('summary.nextPage') || 'Next' }}
      </button>
    </div>
  </section>
</template>

<script>
import axios from 'axios';
import { useToast } from 'vue-toastification';
import { useUserStore } from '@/stores/userStore';
import { transformDateWithTimezone } from '@/utils/datetime';
export default {
  name: 'TimoriaSummary',
  data() {

    // We get today's date to initialize the default month/year for the view.
    const today = new Date();
    return {
      // Base URL for the history API endpoint.
      // In production, this might be replaced with an env variable.
      url: 'http://localhost:5000/api/timoria/history',

      // PAGINATION STATE
      // ----------------
      // Current page number (1-based indexing).
      page: 1,
      limit: 20, // Number of items per page. Backend should use the same param to limit results.
      totalPages: 1, // Total number of pages (returned by backend).

      // DATA STORAGE
      // ------------
      // Array of Timoria objects fetched from backend.
      timorias: [],

      // PERIOD STATE (MONTHLY VIEW)
      // ---------------------------
      // Currently selected year in month mode.
      currentYear: today.getFullYear(),

      // Currently selected month in month mode.
      // Note: JavaScript Date months are 0-11 (0 = January).
      currentMonth: today.getMonth(), 

      // CUSTOM RANGE STATE
      // ------------------
      // These hold plain strings in "YYYY-MM-DD" format, suitable both for:
      // - binding to <input type="date">
      // - sending directly to the backend as query params
      customStartDate: '',
      customEndDate: '',

      // Toast instance reference (from vue-toastification).
      // We attach it in mounted() so we can call this.toast.success/error(...) later.
      toast: null,
    };
  },
  computed: {
    // Returns true if a custom date range is currently active.
    //
    // Logic:
    // - Custom range is considered active when BOTH customStartDate and customEndDate
    //   have non-empty values.
    // - When active, we use these dates as effectiveStartDate / effectiveEndDate instead
    //   of the month-based values.
    isCustomRangeActive() {
      return !!(this.customStartDate && this.customEndDate);
    },

    // Human-readable label for the current period, shown between prev/next month buttons.
    //
    // Behavior:
    // - If we are in custom range mode, we show "YYYY-MM-DD → YYYY-MM-DD".
    // - Otherwise, we show a localized month name + year (e.g., "November 2025").
    formattedPeriodLabel() {
      if (this.isCustomRangeActive) {
        return `${this.customStartDate} → ${this.customEndDate}`;
      }

      // Month names, either translated via $t or with English fallbacks.
      // The order must match JS Date month indices (0 = Jan, 11 = Dec).
      const monthNames = [
        this.$t('months.jan') || 'January',
        this.$t('months.feb') || 'February',
        this.$t('months.mar') || 'March',
        this.$t('months.apr') || 'April',
        this.$t('months.may') || 'May',
        this.$t('months.jun') || 'June',
        this.$t('months.jul') || 'July',
        this.$t('months.aug') || 'August',
        this.$t('months.sep') || 'September',
        this.$t('months.oct') || 'October',
        this.$t('months.nov') || 'November',
        this.$t('months.dec') || 'December',
      ];

      // Use currentMonth as index into the monthNames array.
      return `${monthNames[this.currentMonth]} ${this.currentYear}`;
    },

    // Start date for the *current month* in YYYY-MM-DD format, used in monthly mode.
    //
    // Example:
    //   If currentYear = 2025 and currentMonth = 0 (January),
    //   then new Date(2025, 0, 1) is "2025-01-01T..." and we slice to "2025-01-01".
    monthStartDate() {
      // YYYY-MM-DD string
      const d = new Date(this.currentYear, this.currentMonth, 1);
      return d.toISOString().slice(0, 10);
    },

    // End date for the *current month* in YYYY-MM-DD format.
    //
    // Implementation detail:
    // - new Date(year, month + 1, 0) gives the last day of `month` (0-based).
    //   Example: (2025, 1, 0) => last day of January 2025.
    monthEndDate() {
      const d = new Date(this.currentYear, this.currentMonth + 1, 0); // last day
      return d.toISOString().slice(0, 10);
    },

    // Effective start date to send to the backend.
    //
    // Logic:
    // - If custom range is active, use customStartDate.
    // - Otherwise, use monthStartDate.
    effectiveStartDate() {
      return this.isCustomRangeActive ? this.customStartDate : this.monthStartDate;
    },

    // Effective end date to send to the backend.
    //
    // Similar logic as effectiveStartDate.
    effectiveEndDate() {
      return this.isCustomRangeActive ? this.customEndDate : this.monthEndDate;
    },
  },
  // Lifecycle hook that runs after the component is mounted into the DOM.
  mounted() {
    // Initialize the toast instance. useToast() must be called inside setup or lifecycle,
    // and we store the result on `this.toast` for later use.
    this.toast = useToast();

    // Immediately fetch data for the initial view (current month, page 1).
    this.fetchTimorias();
  },
  methods: {
    transformDate(date) {
        // if no date, return empty strings
        if (!date) {
            return ['_', '_']
        }

        const userStore = useUserStore();
        const userTz = userStore.timezone || 'Europe/Stockholm'            

        // this part works but I refactored this code to { transformDateWithTimezone } from '@/utils/datetime'
        // const dt = typeof date === 'string'
        //     ? DateTime.fromISO(date, { zone: 'utc' }).setZone(userTz)
        //     : DateTime.fromJSDate(date).setZone(userTz);

        // const day  = dt.toFormat('yyyy-LL-dd'); // 2025-12-01
        // const time = dt.toFormat('HH:mm');      // 17:52


        return transformDateWithTimezone(date, userTz);
    },
    // Fetch Timoria data from the backend API based on current state.
    //
    // It uses:
    // - this.page (pagination)
    // - this.limit (pagination size)
    // - this.effectiveStartDate (either month-based or custom)
    // - this.effectiveEndDate   (either month-based or custom)
    //
    // The backend is expected to:
    // - Filter entries by [startDate, endDate]
    // - Paginate according to page & limit
    // - Return `timorias` array and `totalPages` in the response.
    async fetchTimorias() {
      try {
        // Get token from localStorage to authenticate the request.
        const token = localStorage.getItem('token');

        // Query parameters sent to the backend.
        const params = {
          page: this.page,
          limit: this.limit,
          startDate: this.effectiveStartDate,
          endDate: this.effectiveEndDate,
        };
        // Perform GET request to the API.
        // The `headers` object is only populated with Authorization if token exists
        // to avoid sending an empty header.
        const res = await axios.get(this.url, {
          params,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        // Store the Timoria list. Use empty array as fallback to avoid undefined issues.
        this.timorias = res.data.timorias || [];

        // Update total pages for pagination. Fallback to 1 to avoid division by zero.
        this.totalPages = res.data.totalPages || 1;
      } catch (err) {
        // On any error (network, server error, etc.), show a toast message if possible.
        // We also use i18n with a fallback to a plain English string.
        this.toast && this.toast.error(
          this.$t('notification.failedHistory') || 'Failed to fetch timoria history.'
        );
      }
    },

    // Handle page change from the pagination controls.
    //
    // newPage is a number passed from the template, usually page - 1 or page + 1.
    // We:
    // - Guard against invalid values (less than 1 or greater than totalPages).
    // - Update this.page if valid.
    // - Call fetchTimorias() to reload data for the new page.
    changePage(newPage) {
      if (newPage < 1 || newPage > this.totalPages) return;
      this.page = newPage;
      this.fetchTimorias();
    },

    // Navigate to the previous month (monthly mode only).
    //
    // Logic:
    // - If custom range is active, we ignore the click (we don't want mixing modes).
    // - Otherwise, update currentMonth/currentYear to the previous month.
    // - Reset page to 1 (since month change is a new set of results).
    // - Fetch data for the updated month.
    goToPreviousMonth() {
      // Ignore the action if we are in custom range mode.
      if (this.isCustomRangeActive) return; 

      if (this.currentMonth === 0) {
        // If current month is January (0), then previous month is December of previous year.
        this.currentMonth = 11;
        this.currentYear -= 1;
      } else {
        // Otherwise, just go to previous month.
        this.currentMonth -= 1;
      }
      // Reset pagination to first page when changing the period.
      this.page = 1;
      this.fetchTimorias();
    },

    // Navigate to the next month (monthly mode only).
    //
    // Similar to goToPreviousMonth, but moves forward in time.
    goToNextMonth() {
      if (this.isCustomRangeActive) return;       // Ignore the action if we are in custom range mode.

      if (this.currentMonth === 11) {
        this.currentMonth = 0;         // If current month is December (11), next month is January of the next year.
        this.currentYear += 1;
      } else {
        // Otherwise, just go to next month.
        this.currentMonth += 1;
      }

      // Reset pagination on period change.
      this.page = 1;
      this.fetchTimorias();
    },

    // Apply the currently selected custom date range.
    //
    // Behavior:
    // - If either start or end date is missing, show an error toast and do nothing.
    // - If both exist:
    //     * page is reset to 1
    //     * fetchTimorias() is called
    //
    // Once both customStartDate and customEndDate are set, isCustomRangeActive
    // will be true and effectiveStartDate/effectiveEndDate will use the custom values.
    applyCustomRange() {
      if (!this.customStartDate || !this.customEndDate) {
        // Show an error message via toast if dates are incomplete.
        this.toast && this.toast.error(
          this.$t('summary.rangeError') || 'Please select both start and end dates.'
        );
        return;
      }

      // Reset to first page for a new filter.
      this.page = 1;
      // Re-fetch data with the new custom date range.
      this.fetchTimorias();
    },

    // Clear the custom date range and revert to monthly mode.
    //
    // Steps:
    // - Set customStartDate and customEndDate to empty strings.
    // - Reset page to 1.
    // - Call fetchTimorias() which will now use monthStartDate/monthEndDate
    //   because isCustomRangeActive becomes false.
    clearCustomRange() {
      this.customStartDate = '';
      this.customEndDate = '';
      this.page = 1;
      this.fetchTimorias();
    },

    // Format a given date string (e.g., createdAt from backend) into a localized,
    // human-readable string like "Nov 17, 2025".
    //
    // Steps:
    // - If dateString is falsy, return "—".
    // - Create a Date object from the input.
    // - Use toLocaleDateString with:
    //     * locale: current i18n locale (fallback 'en')
    //     * options: numeric year, short month name, numeric day
    //
    // This ensures dates are rendered consistently according to user locale.
    formatDate(dateString) {
      if (!dateString) return '—';
      const d = new Date(dateString);
      return d.toLocaleDateString(this.$i18n?.locale || 'en', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    },
    formatDuration(minutes) {
      if (minutes == null || isNaN(minutes)) return '—';

      const hrs = Math.floor(minutes / 60);
      const mins = minutes % 60;

      const parts = [];

      if (hrs > 0) {
        parts.push(`${hrs} ${hrs === 1 ? this.$t('stats.hours') : this.$t('stats.hours')}`);
      }

      if (mins > 0) {
        parts.push(`${mins} ${mins === 1 ? this.$t('stats.minutes') : this.$t('stats.minutes')}`);
      }

      // If both are zero (e.g., duration = 0)
      if (parts.length === 0) {
        parts.push(`0 ${this.$t('stats.minutes')}`);
      }

      return parts.join(' ');
    }

  },
};
</script>

<style src="../assets/styles/main.css"></style>
