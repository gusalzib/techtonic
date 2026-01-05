<template>
  <button
    class="generate-report-btn"
    :disabled="loading"
    @click="generateReport"
  >
    {{ loading ? 'Generating…' : 'Generate Weekly Report' }}
  </button>
</template>

<script>
import { useToast } from 'vue-toastification'
import { API_BASE_URL } from '@/config/api';

export default {
  name: 'GenerateReportButton',

  data() {
    return {
        loading: false,
        toast: null,
        url: `${API_BASE_URL}/reports/generate`,
    }
  },

  mounted() {
    this.toast = useToast()
  },

  methods: {
    async generateReport() {
      this.loading = true

      try {
        const res = await fetch(`${this.url}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        })

        if (!res.ok) {
          throw new Error('Failed to generate report')
        }

        const report = await res.json()

        this.toast.success(this.$t('notification.weeklyReportGeneratedSuccessfully'))

        // optional: open report in new tab
        // if (report.fileUrl) {
        //   window.open(report.fileUrl, '_blank')
        // }

      } catch (err) {
        console.error(err)
        this.toast.error(this.$t('notification.failedToGenerateWeeklyReports'))
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.generate-report-btn {
  padding: 10px 16px;
  border-radius: 8px;
  background: var(--standard-btn);
  color: white;
  font-weight: 600;
  border: none;
}

.generate-report-btn:hover:not(:disabled) {
  background: var(--standard-btn-hover);
  cursor: pointer;
}

.generate-report-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
