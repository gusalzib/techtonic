<template>
  <div class="reports-container">
    <h2 class="reports-title">{{ $t('reports.yourReports') }}</h2>

    <div v-if="loading" class="reports-loading">
      {{ $t('reports.loadingReports') }}
    </div>

    <div v-else-if="this.reports.length === 0" class="reports-empty">
      {{ $t('reports.noReportsYet') }}
    </div>

    <div class="reports-grid">
      <div
        v-for="report in this.reports"
        :key="report._id"
        class="report-card"
        @click="openReport(report)"
      >

      <button
        class="report-delete-btn"
        @click.stop="deleteReport(report._id)"
        title="Delete report"
      >
        🗑
      </button>

        <h4>{{ $t('reports.weeklyReport') }}</h4>

        <p class="report-date">
          {{ $t('reports.dateCreated') }}: {{ formatDate(report.createdAt) }}
        </p>

        <p class="report-meta">
          {{ $t('reports.week') }}: {{ formatPeriod(report.periodStart, report.periodEnd) }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { API_BASE_URL } from '@/config/api'
import { confirm as appConfirm } from '@/services/confirmService' // import the confirm function

export default {
  name: 'ReportsGrid',

  data() {
    return {
        reports: [],
        loading: false,
        url: `${API_BASE_URL}/reports`,
        token: '',
    }
  },

    async mounted() {
    this.token = localStorage.getItem('token')
    this.fetchReports()
  },

  methods: {
    async fetchReports() {
      try {
        this.loading = true
          const res = await axios.get(`${this.url}`, {
              headers: {
                Authorization: `Bearer ${this.token}`
            }
        })
        this.reports = res.data
      } catch (err) {
        console.error('Failed to load reports', err)
      } finally {
        this.loading = false
      }
    },

    async openReport(report) {
      try {
        const res = await axios.get(`${API_BASE_URL}/reports/${report._id}/signedUrl`, {
          headers: { Authorization: `Bearer ${this.token}` }
        })
        window.open(res.data.signedUrl, '_blank')
      } catch (err) {
        console.error('Failed to open report', err)
      }
    },
    async deleteReport(reportId) {
        const ok = await appConfirm({
            title: this.$t('modal.confirmDeleteReportTitle') || 'Delete Report?',
            message: this.$t('modal.confirmDeleteReportMessage') || 'Delete Report?',
            confirmText: this.$t('modal.confirm') || 'Delete Timoria?',
            cancelText: this.$t('modal.cancel') || 'Cancel',

        })
        if (!ok) return

      try {
        await axios.delete(`${API_BASE_URL}/reports/${reportId}`, {
          headers: { Authorization: `Bearer ${this.token}` }
        })

        // Optimistic UI update
        this.reports = this.reports.filter(r => r._id !== reportId)
      } catch (err) {
        console.error('Failed to delete report', err)
        alert('Failed to delete report')
      }
    },

    formatDate(date) {
      return new Date(date).toLocaleDateString()
    },

    formatPeriod(start, end) {
      return `${this.formatDate(start)} – ${this.formatDate(end)}`
    }
  }
}
</script>

<style scoped>

</style>
