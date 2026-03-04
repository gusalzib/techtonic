<template>
  <div class="weekly-planner">
    <header class="planner-header">
      <h2>{{ $t('planner.weeklyTitle') || 'Weekly Planner' }}</h2>
      <div class="week-selector">
        <button @click="changeWeek(-1)">◀</button>
        <span>{{ currentWeekLabel }}</span>
        <button @click="changeWeek(1)">▶</button>
      </div>
      <button class="standard-btn" @click="showAddGoalModal = true">
        + {{ $t('planner.addGoal') || 'Add Weekly Goal' }}
      </button>
    </header>

    <div v-if="loading" class="loading">{{ $t('common.loading') }}...</div>

    <div v-else class="goals-grid">
      <div v-for="goal in goals" :key="goal._id" class="goal-card">
        <div class="goal-info">
          <h3>{{ goal.title }} | {{ goal.weekIdentifier }}</h3>
          <p class="goal-meta">{{ goal.subject }} | {{ goal.topic }} </p>
          <p class="goal-meta" v-if="goal.isRecurring">{{ $t('planner.goalIsRecurring') }}</p>
          <p class="goal-meta">{{ $t('planner.estimatedTimeToCompletion') }}: {{ goal.targetMinutes }} {{ $t('timer.minutes') }}</p>
        </div>

        <div class="progress-container">
          <div class="progress-labels">
            <span>{{ getGoalProgressPercent(goal._id) }}% {{ $t('planner.ofTheGoalIsDone') }}</span>
            <br>
            <span>{{ getGoalMinutesDone(goal._id) }} {{ $t('planner.outOf') }} {{ goal.targetMinutes }} {{ $t('planner.minutesAreComplete') }}</span>
          </div>
          <div class="progress-bar-bg">
            <div 
              class="progress-bar-fill done" 
              :style="{ width: getGoalProgressPercent(goal._id) + '%' }"
            ></div>
            <div 
              class="progress-bar-fill planned" 
              :style="{ width: getGoalPlannedPercent(goal._id) + '%', left: getGoalProgressPercent(goal._id) + '%' }"
            ></div>
          </div>
        </div>

        <div class="goal-sessions-list">
          <h4>{{ $t('planner.linkedSessions') || 'Planned Sessions' }}</h4>
          <div v-if="!sessionsData[goal._id]?.length" class="no-sessions">
             <em>{{ $t('planner.noSessions') || 'No sessions yet' }}</em>
          </div>
          <ul v-else>
            <li v-for="s in sessionsData[goal._id]" :key="s._id" :class="s.status">
              <span class="status-dot"></span>
              <span class="session-subject">{{ s.subject || '—' }}</span>
              <span class="session-topic">{{ s.topic || '—' }}</span>
              <span class="session-topic">{{ s.tag || '—' }}</span>
              <!-- the task description is optional and the goal card is small, so adding the task will make it look weird if the task description is long -->
              <!-- <span class="session-task">{{ s.task || '—' }}</span> -->
              <span class="session-status">{{ s.status || '—' }}</span>
              <span class="session-duration">{{ s.duration }}m</span>
            </li>
          </ul>
        </div>

        <div class="goal-actions">
          <button @click="openSpawnModal(goal)" class="spawn-btn standard-btn">
            ➕ {{ $t('planner.planSession') || 'Plan Session' }}
          </button>
          <button @click="openEditGoalModal(goal)" class="edit-icon-btn">✏️</button>
          <button @click="deleteGoal(goal._id)" class="delete-icon-btn">🗑️</button>
        </div>
      </div>
    </div>

    </div>

    <!-- CREATE NEW GOAL MODAL -->
    <transition name="fade">
        <div v-if="showAddGoalModal" class="goal-modal-overlay" @click.self="showAddGoalModal = false">
        <div class="goal-modal-content">
            <header class="goal-modal-header">
            <h3>{{ $t('planner.addGoal') || 'Create Weekly Goal' }}</h3>
            <!-- I do not need a close button for now because we already have a cancel button -->
            <!-- <button class="close-btn" @click="showAddGoalModal = false">&times;</button> -->
            </header>

            <form @submit.prevent="createGoal" class="goal-form">
            <div class="goal-form-group">
                <label>{{ $t('planner.goalTitle') || 'Goal Title' }}</label>
                <input v-model="newGoal.title" type="text" :placeholder="$t('planner.goalTitlePlaceholder')" required />
            </div>

            <div class="goal-form-row">
                <div class="goal-form-group">
                <label>{{ $t('planner.targetMinutes') || 'Target Minutes' }}</label>
                <input v-model.number="newGoal.targetMinutes" type="number" step="5" min="5" required />
                </div>
                <div class="goal-form-group">
                <label>{{ $t('planner.isRecurring') || 'Recurring' }}</label>
                <div class="toggle-switch">
                    <input type="checkbox" v-model="newGoal.isRecurring" id="recurring-check" />
                    <label for="recurring-check"></label>
                </div>
                </div>
            </div>

            <div class="goal-form-group">
                <label>{{ $t('table.subject') }}</label>
                <input v-model="newGoal.subject" type="text" list="subjectList" :placeholder="$t('timer.subjectPlaceholder')" required />

                <label>{{ $t('table.topic') }}</label>
                <input v-model="newGoal.topic" type="text" list="topicList" :placeholder="$t('timer.topicPlaceholder')" required />

                <datalist id="subjectList">
                    <option v-for="s in userSubjects" :key="s" :value="s"></option>
                </datalist>

                <datalist id="topicList">
                    <option v-for="t in userTopics" :key="t" :value="t"></option>
                </datalist>
            </div>

            <div class="goal-modal-footer">
                <button type="button" class="cancel-btn" @click="showAddGoalModal = false">
                {{ $t('buttons.cancel') }}
                </button>
                <button type="submit" class="save-btn" :disabled="submitting">
                {{ submitting ? $t('buttons.saving') : $t('buttons.save') }}
                </button>
            </div>
            </form>
        </div>
        </div>
    </transition>

    <!-- ADD SESSION MODAL -->
    <transition name="fade">
      <div v-if="showSpawnModal" class="goal-modal-overlay" @click.self="showSpawnModal = false">
        <div class="goal-modal-content">
          <h3>{{ $t('planner.planSession') }}</h3>
          <p><strong>{{ activeGoalForSpawn.title }}</strong></p>
          
          <form @submit.prevent="confirmSpawn" class="goal-form">
            <div class="goal-form-group">
              <label>{{ $t('table.task') }}</label>
              <input v-model="spawnForm.task" type="text" :placeholder="$t('timer.taskPlaceholder')" />
              
              <label>{{ $t('table.tag') }}</label>
              <input v-model="spawnForm.tag" type="text" list="tagList" :placeholder="$t('timer.tagPlaceholder')" />
                <datalist id="tagList">
                    <option v-for="tg in usertTags" :key="tg" :value="tg"></option>
                </datalist>
              
              <label>{{ $t('table.duration') }} ({{ $t('timer.minutes') }})</label>
              <input v-model.number="spawnForm.duration" type="number" min="5" />
            </div>

            <div class="goal-modal-footer">
              <button type="button" class="cancel-btn" @click="showSpawnModal = false">{{ $t('buttons.cancel') }}</button>
              <button type="submit" class="save-btn">{{ $t('buttons.add') }}</button>
            </div>
          </form>
        </div>
      </div>
    </transition>

    <!-- Edit a goal modal -->
    <transition name="fade">
        <div v-if="showEditGoalModal" class="goal-modal-overlay" @click.self="showEditGoalModal = false">
            <div class="goal-modal-content edit-mode">
                <header class="goal-modal-header">
                    <h3>{{ $t('planner.editGoal') || 'Edit Weekly Goal' }}</h3>
                </header>

                <form @submit.prevent="updateGoal" class="goal-form">
                    <div class="goal-form-group">
                        <label>{{ $t('planner.goalTitle') }}</label>
                        <input v-model="editGoalData.title" type="text" required />
                    </div>

                    <div class="goal-form-row">
                        <div class="goal-form-group">
                            <label>{{ $t('planner.targetMinutes') }}</label>
                            <input v-model.number="editGoalData.targetMinutes" type="number" step="5" min="5" required />
                        </div>
                        <div class="goal-form-group">
                            <label>{{ $t('planner.isRecurring') }}</label>
                            <div class="toggle-switch">
                                <input type="checkbox" v-model="editGoalData.isRecurring" id="edit-recurring-check" />
                                <label for="edit-recurring-check"></label>
                            </div>
                        </div>
                    </div>

                    <div class="goal-form-group">
                        <label>{{ $t('table.subject') }}</label>
                        <input v-model="editGoalData.subject" type="text" list="subjectList" required />

                        <label>{{ $t('table.topic') }}</label>
                        <input v-model="editGoalData.topic" type="text" list="topicList" required />

                        <datalist id="subjectList">
                            <option v-for="s in userSubjects" :key="s" :value="s"></option>
                        </datalist>

                        <datalist id="topicList">
                            <option v-for="t in userTopics" :key="t" :value="t"></option>
                        </datalist>
                    </div>

                    <div class="goal-modal-footer">
                        <button type="button" class="cancel-btn" @click="showEditGoalModal = false">
                            {{ $t('buttons.cancel') }}
                        </button>
                        <button type="submit" class="save-btn" :disabled="submitting">
                            {{ submitting ? $t('buttons.saving') : $t('buttons.save') }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </transition>
</template>

<script>
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';
import { useToast } from 'vue-toastification';
import { DateTime } from 'luxon'; // Recommended for week calculations
import { confirm as appConfirm } from '@/services/confirmService' // import the confirm function

export default {
  name: 'WeeklyPlanner',
  data() {
      return {
        userTopics: [],
        userSubjects: [],
        usertTags: [],
        goals: [],
        progressData: {}, // Map of goalId -> { done: X, planned: Y }
        loading: false,
        currentDate: DateTime.now(),
        showAddGoalModal: false,
        toast: null,
        newGoal: {
            title: '',
            targetMinutes: 120,
            subject: '',
            topic: '',
            isRecurring: false
        },
        sessionsData: {}, // Map of goalId -> Array of sessions
        showSpawnModal: false,
        activeGoalForSpawn: null,
        spawnForm: {
            task: '',
            tag: '',
            duration: 25
        },
        showEditGoalModal: false,
        editingGoalId: null,
        editGoalData: {
            title: '',
            targetMinutes: 0,
            subject: '',
            topic: '',
            isRecurring: false
        }
    };
  },
  computed: {
    weekIdentifier() {
      // Formats as 2026-W09
      return this.currentDate.toFormat("kkkk-'W'WW");
    },
    currentWeekLabel() {
      const start = this.currentDate.startOf('week').toLocaleString(DateTime.DATE_MED);
      const end = this.currentDate.endOf('week').toLocaleString(DateTime.DATE_MED);
      return `${start} - ${end}`;
    },

  },
  mounted() {
        this.toast = useToast();
        this.fetchWeeklyData();
        this.fetchTaxonomy(); // Load subjects for the modal
  },
    methods: {
        // Fetch subjects to help the user fill the form
        async fetchTaxonomy() {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/timoria/taxonomy`, {
            headers: { Authorization: `Bearer ${token}` }
            });
            this.userSubjects = res.data.subjects;
            this.userTopics = res.data.topics;
            this.usertTags = res.data.tags;
            
        },
        async createGoal() {
            this.submitting = true;
            const token = localStorage.getItem('token');
            
            // Attach the current week from the planner's state
            const payload = {
            ...this.newGoal,
            weekIdentifier: this.weekIdentifier 
            };

            try {
                await axios.post(`${API_BASE_URL}/goals`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                this.toast?.success(this.$t('notification.goalCreated') || "Goal Created!");
                this.showAddGoalModal = false;
                this.resetNewGoalForm();
                this.fetchWeeklyData(); // Refresh the grid
            } catch (err) {
                this.toast?.error(this.$t('notification.failedToCreateGoal') || "Failed to create goal");
            } finally {
                this.submitting = false;
            }
        },
        resetNewGoalForm() {
            this.newGoal = { title: '', targetMinutes: 120, subject: '', topic: '', isRecurring: false };
        },
        async fetchWeeklyData() {
            this.loading = true;
            const token = localStorage.getItem('token');
            try {
                // 1. Fetch Goals
                const res = await axios.get(`${API_BASE_URL}/goals/weekly?week=${this.weekIdentifier}`, {
                headers: { Authorization: `Bearer ${token}` }
                });
                this.goals = res.data;

                // 2. Fetch Progress for each goal
                for (const goal of this.goals) {
                    this.fetchProgress(goal._id);
                    this.fetchSessions(goal._id); // get all the sessions for all goals on page load
                }
            } catch (err) {
                // console.error(err);
                this.toast?.error(this.$t('notification.failedToLoadGoals') || "Failed to load goals");
            } finally {
                this.loading = false;
            }
        },
        async fetchProgress(goalId) {
            const token = localStorage.getItem('token');
            try {
                const res = await axios.get(`${API_BASE_URL}/goals/${goalId}/progress`, {
                headers: { Authorization: `Bearer ${token}` }
                });
                // Transform [{_id: 'done', totalMinutes: 50}] into { done: 50, planned: 0 }
                const stats = res.data.reduce((acc, curr) => {
                acc[curr._id] = curr.totalMinutes;
                return acc;
                }, { done: 0, planned: 0 });
                
                // this.$set(this.progressData, goalId, stats);
                this.progressData[goalId] = stats;
            } catch (err) {
                this.toast?.error(this.$t('notification.failedToLoadProgress') || "Failed to load progress");
                console.error("Progress fetch failed", err);
            }
        },
        async spawnSession(goalId) {
            const token = localStorage.getItem('token');            
            try {
                await axios.post(`${API_BASE_URL}/goals/${goalId}/spawn`, { duration: 25 }, {
                headers: { Authorization: `Bearer ${token}` }
                });
                this.toast?.success(this.$t('notification.timoriaSaved') || "Session Planned!");
                this.fetchProgress(goalId); // Refresh progress bar
            } catch (err) {
                this.toast?.error(this.$t('notification.failedToCreateTimoriaSession') || "Failed to plan session");
            }
        },
        changeWeek(direction) {
            this.currentDate = this.currentDate.plus({ weeks: direction });
            this.fetchWeeklyData();
        },
        // Helper calculations for the Progress Bar
        getGoalMinutesDone(id) {
            return this.progressData[id]?.done || 0;    
        },
        getGoalProgressPercent(id) {
            const goal = this.goals.find(g => g._id === id);
            if (!goal) return 0;
            return Math.min(Math.round((this.getGoalMinutesDone(id) / goal.targetMinutes) * 100), 100);
        },
        getGoalPlannedPercent(id) {
            const goal = this.goals.find(g => g._id === id);
            const planned = this.progressData[id]?.planned || 0;
            if (!goal) return 0;
            return Math.min(Math.round((planned / goal.targetMinutes) * 100), 100);
        },
        async deleteGoal(id) {
            // Use your existing confirmation service for consistency
            const ok = await appConfirm({
                title: this.$t('modal.confirmDeleteGoalTitle') || 'Delete Goal?',
                message: this.$t('modal.confirmDeleteGoalMessage') || 'Are you sure? This will also remove linked planned sessions.',
                confirmText: this.$t('modal.confirm') || 'Delete',
                cancelText: this.$t('modal.cancel') || 'Cancel',
            });

            if (!ok) return;

            try {
                const token = localStorage.getItem('token');
                await axios.delete(`${API_BASE_URL}/goals/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
                });

                this.toast?.success(this.$t('notification.goalDeletedSuccessfully') || 'Goal deleted');
                
                // Refresh the list to remove the card from the UI
                this.fetchWeeklyData();
            } catch (err) {
                this.toast?.error(this.$t('notification.failedToDeleteGoal') || 'Failed to delete goal');
                console.error("Delete failed:", err);
            }
        },
        // Called from the edite button on the card
        openEditGoalModal(goal) {
            this.editingGoalId = goal._id;
            // Create a fresh copy of the goal data so we don't mutate the card UI before saving
            this.editGoalData = { 
                title: goal.title,
                targetMinutes: goal.targetMinutes,
                subject: goal.subject,
                topic: goal.topic,
                isRecurring: goal.isRecurring 
            };
            this.showEditGoalModal = true;
        },

        async updateGoal() {
            this.submitting = true;
            const token = localStorage.getItem('token');
            try {
                await axios.put(`${API_BASE_URL}/goals/${this.editingGoalId}`, this.editGoalData, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                this.toast?.success(this.$t('notification.goalUpdatedSuccessfully') || "Goal updated!");
                this.showEditGoalModal = false;
                this.fetchWeeklyData(); // Refresh the grid to show new values
            } catch (err) {
                this.toast?.error(this.$t('notification.failedToUpdateGoal') || "Update failed");
            } finally {
                this.submitting = false;
            }
        },
        async fetchSessions(goalId) {
            const token = localStorage.getItem('token');
            try {
                const res = await axios.get(`${API_BASE_URL}/goals/${goalId}/sessions`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                this.sessionsData[goalId] = res.data;
            } catch (err) { console.error(err); }
        },

        openSpawnModal(goal) {
            this.activeGoalForSpawn = goal;
            this.spawnForm.task = ''; // Reset form
            this.spawnForm.tag = goal.tag || '';
            this.showSpawnModal = true;
        },

        async confirmSpawn() {
            const token = localStorage.getItem('token');
            const goalId = this.activeGoalForSpawn._id;
            try {
                await axios.post(`${API_BASE_URL}/goals/${goalId}/spawn`, this.spawnForm, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                this.toast?.success(this.$t('notification.timoriaSaved'));
                this.showSpawnModal = false;
                this.fetchProgress(goalId);
                this.fetchSessions(goalId); // Refresh the list inside the card
            } catch (err) {
                this.toast?.error(this.$t('notification.failedToCreateTimoriaSession') || "Failed to plan session");
            }
        }
  }
};
</script>
<style src="../assets/styles/main.css"></style>
