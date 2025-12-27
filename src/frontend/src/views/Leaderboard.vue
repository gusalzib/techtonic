<template>
  <header class="leaderboard-view-switcher">
    <button
      :class="['view-tab', { active: activeLeaderboardView === 'completed' }]"
      @click="activeLeaderboardView = 'completed'"
    >
      🏆 {{ $t('leaderboard.completed') || 'Completed Timorias' }}
    </button>

    <button
      :class="['view-tab', { active: activeLeaderboardView === 'hours' }]"
      @click="activeLeaderboardView = 'hours'"
    >
      ⏱ {{ $t('leaderboard.hours') || 'Productivity Hours' }}
    </button>

    <button
      :class="['view-tab', { active: activeLeaderboardView === 'streaks' }]"
      @click="activeLeaderboardView = 'streaks'"
    >
      🔥 {{ $t('leaderboard.streaks') || 'Streaks' }}
    </button>
  </header>

  <div class="leaderboard">
    <h2>Leaderboard</h2>
    <table>
      <thead>
        <tr>
          <th>{{ $t('leaderboard.rank') }}</th>
          <th>{{ $t('leaderboard.user') }}</th>
          <th>{{ columnLabel }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(user, index) in leaderboard" :key="user._id">
          <td>{{ index + 1 }}</td>
          <td>{{ user.username }}</td>
          <td>{{ user[columnField] }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { useToast } from 'vue-toastification';
import { API_BASE_URL } from '@/config/api';

export default {
  name: 'Leaderboard',
  data() {
    return {
      activeLeaderboardView: 'completed',
      leaderboard: [],
      toast: null,
      url: `${API_BASE_URL}/leaderboard`,
    };
  },
  watch: {
    activeLeaderboardView(newView) {
      this.fetchLeaderboard(newView);
    }
  },
  computed: {
    columnLabel() {
      switch (this.activeLeaderboardView) {
        case 'hours': return this.$t('leaderboard.hours') || 'Productivity Hours';
        case 'streaks': return this.$t('leaderboard.streaks') || 'Streaks';
        default: return this.$t('leaderboard.completed') || 'Completed Timorias';
      }
    },
    columnField() {
      switch (this.activeLeaderboardView) {
        case 'hours': return 'totalHours';
        case 'streaks': return 'streak';
        default: return 'totalTimorias';
      }
    }
  },
  mounted() {
    this.toast = useToast();
    this.fetchLeaderboard();
  },
  methods: {
    async fetchLeaderboard(view = this.activeLeaderboardView) {
      try {
        const response = await fetch(`${this.url}?type=${view}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        });
        if (!response.ok) throw new Error('Network response was not ok');
        this.leaderboard = await response.json();
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        this.toast?.error(
          this.$t('notification.failedToLoadLeaderboard') || 'Failed to load leaderboard'
        );
      }
    }
  }
};
</script>
