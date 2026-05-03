<template>
  <div class="timer-container">
    <h1>{{ $t('timer.title') }}</h1>

    <div id="timerDisplay">{{ formattedTime }}</div>


    <div>
    <p><strong>{{ $t('table.subject') }}:</strong> {{ this.localTimoria?.subject || 'N/A' }}</p>
    <p><strong>{{ $t('table.topic') }}:</strong> {{ this.localTimoria?.topic || 'N/A' }}</p>
    <p v-if="localTimoria?.tag"><strong>{{ $t('table.tag') }}:</strong> {{ localTimoria.tag }}</p>
    <p v-if="localTimoria?.task"><strong>{{ $t('table.task') }}:</strong> {{ localTimoria.task }}</p>
    <!-- <p>Debugging timoria: {{ timoria }}</p> -->
    </div>

    <div>
      <button v-tooltip="$t('tooltip.buttons.start')" class="timer-btn" @click="startTimer">{{ $t('buttons.start') }}</button>
      <button v-tooltip="$t('tooltip.buttons.pause')" class="timer-btn" v-if="!this.isPaused" @click="pauseTimer">{{ $t('buttons.pause') }}</button>
      <button class="timer-btn" v-if="this.isPaused" @click="resumeTimer">{{ $t('buttons.resume') }}</button>
      <button v-tooltip="$t('tooltip.buttons.reset')" class="timer-btn" @click="resetTimer">{{ $t('buttons.reset') }}</button>
      <button v-tooltip="$t('tooltip.buttons.cancel')" class="timer-btn" @click="cancelTimer">{{ $t('buttons.cancel') }}</button>
      <button v-tooltip="$t('tooltip.buttons.finish')" class="timer-btn" @click="manualFinishTimer">{{ $t('buttons.finish') }}</button>
      <button v-tooltip="$t('tooltip.buttons.oneMoreMinute')" class="timer-btn" @click="extendTimer(60)">{{ $t('buttons.oneMoreMinute') || '+1 min' }}</button>
      <button v-tooltip="$t('tooltip.buttons.fiveMoreMinutes')" class="timer-btn" @click="extendTimer(300)">{{ $t('buttons.fiveMoreMinutes') || '+5 min' }}</button>

      <!-- notification debug button -->
      <!-- <button class="timer-btn" @click="pushNotification">{{ $t('buttons.notify') }}</button> -->
    </div>
  </div>
</template>

<script>
import dingSound from '@/assets/audio/ding.mp3'
import breakOver from '@/assets/audio/break_over.mp3'
import { useToast } from 'vue-toastification'
import { API_BASE_URL } from '@/config/api';

// helper function. Not in the methods section to avoid reactivity issues 
function createTimerState({ id, plannedMs, type }) {
  return {
    id,
    type, // 'timoria' | 'break'
    plannedMs,

    startedAt: Date.now(),
    pausedAt: null,
    totalPausedMs: 0,

    finished: false
  }
}


export default {
  props: {
    timoria: {
      type: Object,
      required: false,
      default: null
    },
    breakDurationMinutes: {
      type: Number,
      required: true
    }
  }, 
  data() {
    return {

      timerState: null,   // SINGLE source of truth
      interval: null,    // UI ticking only

      nowTs: Date.now(), // UI heartbeat

      url: `${API_BASE_URL}/timoria`,
      localTimoria: null, // timoria in props is readonly and cannot be assigned and re-assigned so we use a local copy of it
      hasBreakFinished: false,
      timerType: 'timoria', // or 'break',
      // breakDuration: 1, // the plan is to allow users to decide the duration here but for now we will use a fixed duration 
      wakeLockSentinel: null,
    } 
  },
  computed: {
    isPaused() {
      return !!this.timerState?.pausedAt
    },
    formattedTime() {
      // dependency for reactivity
      this.nowTs

      const seconds = Math.floor(this.getRemainingMs() / 1000)
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60

      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    }
  },
  watch: {
    timoria: {
      handler(newVal) {

        if (!newVal) return

        if (newVal.duration && newVal._id) {
          this.localTimoria = newVal

          // only start if nothing is already running
          if (!this.timerState) {
            this.$nextTick(() => {
              this.startTimer()
            })
          }
        }
      },
      immediate: true,
      deep: true
    }
  },
  async mounted() {
    this.toast = useToast();

    const saved = localStorage.getItem('activeTimoria')
    if (!saved) return

    this.timerState = JSON.parse(saved)
    this.timerType = this.timerState.type

    if (!this.timerState.finished && this.getRemainingMs() === 0) {
      this.finishTimoriaOnce()
    } else {
      this.startUiTicking()
    }

    const token = localStorage.getItem('token')

    // Phase 3: Visibility Change Sync
    document.addEventListener('visibilitychange', this.handleVisibilityChange)

    // Phase 4: Push Notifications (Subscribe only if permission is already granted)
    if (Notification.permission === 'granted') {
      this.$nextTick(() => {
        this.subscribeToPushNotifications()
      })
    }

    // RE-ACQUIRE DEFENSES ON REFRESH (Wake Lock)
    this.$nextTick(() => {
      if (this.timerState && !this.timerState.pausedAt && !this.timerState.finished) {
        this.requestWakeLock();
      }
    })
    /**
     * Explicitly handle Break vs. Timoria
     * What happens without this check?
     * The issue was that when a break is active and I do a refresh, the app tries to GET the timoria/break url
     * This caused a 500 server error because the server is not expecting a timoria/break, it is expecting a timoria/:id 
     * Here I am explicitly checking if the type is break, because if it is, then we have all the info here and we 
     * do not need to GET anything from the backend
     */
    if (this.timerState?.id === 'break' || this.timerState?.type === 'break') {
      // If it's a break, we don't need the database. 
      // We just set the local UI data manually.
      this.localTimoria = {
        subject: 'Break',
        topic: 'Break',
        tag: 'Break',
        task: 'Take a short break'
      };
    }else if (this.timerState?.type === 'timoria' && !this.localTimoria) {
      try {
        const res = await fetch(`${this.url}/${this.timerState.id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        if (res.ok) {
          this.localTimoria = await res.json()
        }
      } catch (e) {
        console.warn('Failed to restore timoria from backend')
      }
    }
  },
  methods: {
    handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        if (!this.timerState) return;

        // Force an immediate recalculation of time
        if (!this.timerState.pausedAt) {
          this.nowTs = Date.now();
        }
        
        // If the timer ran out while in the background, finish it immediately
        if (this.getRemainingMs() === 0 && !this.timerState.finished) {
          this.finishTimoriaOnce();
        }

        // Re-acquire the wake lock because the browser releases it when the tab is hidden
        if (!this.timerState.pausedAt && !this.timerState.finished) {
          // Small delay to ensure browser is ready for new lock request
          setTimeout(() => this.requestWakeLock(), 200);
        }
      }
    },
    async requestWakeLock() {
      if (!('wakeLock' in navigator)) return;
      
      try {
        // Only request if we don't have an active one
        if (this.wakeLockSentinel && !this.wakeLockSentinel.released) {
          return;
        }

        this.wakeLockSentinel = await navigator.wakeLock.request('screen');
        console.log('🔔 Wake Lock is active');
        
        // Handle unexpected releases
        this.wakeLockSentinel.addEventListener('release', () => {
          console.log('⚠️ Wake Lock was released');
          this.wakeLockSentinel = null;
        });
      } catch (err) {
        console.error(`❌ Wake Lock error: ${err.name}, ${err.message}`);
        // If it failed, try once more after a short delay
        if (document.visibilityState === 'visible') {
          setTimeout(() => this.requestWakeLock(), 1000);
        }
      }
    },
    async releaseWakeLock() {
      if (this.wakeLockSentinel !== null) {
        try {
          await this.wakeLockSentinel.release();
          this.wakeLockSentinel = null;
          console.log('Wake Lock has been released');
        } catch (err) {
          console.error(`Wake Lock release error: ${err.name}, ${err.message}`);
        }
      }
    },

    /**
     * -------------------------------------------------------------------------------------------------
     *                                                NEW METHODS
     * -------------------------------------------------------------------------------------------------
     */
    getElapsedMs() {
      if (!this.timerState) return 0

      const now = Date.now()
      const activeUntil = this.timerState.pausedAt ?? now

      return (
        activeUntil -
        this.timerState.startedAt -
        this.timerState.totalPausedMs
      )
    },

    getRemainingMs() {
      if (!this.timerState) return 0

      return Math.max(
        0,
        this.timerState.plannedMs - this.getElapsedMs()
      )
    },
    startTimer() {
      if (!this.localTimoria?._id) return

      // Phase 4: Request permission on user gesture if not already granted
      if (Notification.permission === 'default') {
        this.requestNotificationPermission();
      }

      this.timerType = 'timoria'

      this.timerState = createTimerState({
        id: this.localTimoria._id,
        plannedMs: this.localTimoria.duration * 60 * 1000,
        type: 'timoria'
      })

      localStorage.setItem('activeTimoria', JSON.stringify(this.timerState))
      this.startUiTicking()
      this.requestWakeLock()
      
      // Phase 4: Schedule Backend Notification
      this.scheduleBackendNotification('timoria', this.timerState.plannedMs)
    },
    pauseTimer() {
      if (!this.timerState || this.timerState.pausedAt) return

      this.timerState.pausedAt = Date.now()
      localStorage.setItem('activeTimoria', JSON.stringify(this.timerState))
      this.releaseWakeLock()
      // Phase 4: Cancel Backend Notification on pause
      this.cancelBackendNotification()
    },
    resumeTimer() {
      if (!this.timerState || !this.timerState.pausedAt) return;


      this.timerState.totalPausedMs += Date.now() - this.timerState.pausedAt
      this.timerState.pausedAt = null

      localStorage.setItem('activeTimoria', JSON.stringify(this.timerState))
      this.requestWakeLock()

      // Phase 4: Re-schedule on resume
      const remainingMs = this.getRemainingMs()
      this.scheduleBackendNotification(this.timerState.type, remainingMs)
    },


    async finishTimoriaOnce() {
      if (!this.timerState || this.timerState.finished) return

      this.timerState.finished = true
      localStorage.setItem('activeTimoria', JSON.stringify(this.timerState))
      this.releaseWakeLock()
      
      // Phase 4: Cancel Backend Notification
      this.cancelBackendNotification()

      if (this.timerState.type === 'timoria') {
        await this.finishTimoriaBackend()
        // Add a small delay to ensure UI is ready for break
        // setTimeout(() => {
        //   this.startBreak()
        //   this.$forceUpdate();
        // }, 1000)
        this.$emit('completed', this.localTimoria?._id)
      } else {
        this.finishBreakOnce()
      }
    },

    async finishTimoriaBackend() {
      const elapsedMs = this.getElapsedMs()
      // Cap at plannedMs to avoid recording "overtime" if user was away
      /**
       * plannedMs is dynamic and is updated every timer the user clicks the extendTimer buttons. 
       * If you look at the extendTimer method (around line 509), you'll see this:
       *  extendTimer(seconds) {
       *    if (!this.timerState) return;
       *    // This line is the key!
       *    this.timerState.plannedMs += seconds * 1000; 
       *    // ...
}
       */
      const effectiveMs = Math.min(elapsedMs, this.timerState.plannedMs)
      const minutes = Math.max(1, Math.round(effectiveMs / 60000))

      try {
        await fetch(`${this.url}/${this.localTimoria._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...this.localTimoria,
            status: 'done',
            duration: minutes,
            finishedAt: new Date().toISOString()
          })
        })
      } catch (err) {
        console.error('Failed to finish Timoria:', err)
        this.toast?.error(
          this.$t('notification.failedToCancelTimoria') ||
          'Failed to finish Timoria.'
        )
      }

      localStorage.removeItem('activeTimoria')

      this.playTimoriaSound()
      this.pushNotification()
      this.toast.success(this.$t('notification.timoriaSessionFinished'))

      this.$emit('completed', this.localTimoria?._id)
    },

    manualFinishTimer() {
      this.finishTimoriaOnce();
    },

    resetTimer() {
      if (this.interval) {
        clearInterval(this.interval)
        this.interval = null
      }

      this.timerState = null
      localStorage.removeItem('activeTimoria')
      this.releaseWakeLock()
      
      // Phase 4: Cancel Backend Notification
      this.cancelBackendNotification()
    },

    async cancelTimer() {
      const timoriaId = this.timerState?.id

      this.resetTimer()

      if (!timoriaId || timoriaId === 'break') {
        this.localTimoria = null;
        return;
      }

      try {
        const response = await fetch(`${this.url}/${timoriaId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'planned' })
        })

        if (!response.ok) throw new Error('Cancel failed')

        this.$emit('updatePlannedTimorias')
        this.$emit('cancelTimer')
      } catch (err) {
        console.error(err)
        this.toast?.error(
          this.$t('notification.failedToCancelTimoria') ||
          'Failed to cancel Timoria.'
        )
      }

      this.localTimoria = null
    },
  logTimerState() {
    console.log('Current Timer State:', {
      type: this.timerType,
      remainingMs: this.getRemainingMs(),
      formattedTime: this.formattedTime,
      localTimoria: this.localTimoria,
      hasBreakFinished: this.hasBreakFinished
    })
  },
    startBreak() {
      // Phase 4: Request permission on user gesture if not already granted
      if (Notification.permission === 'default') {
        this.requestNotificationPermission();
      }

      // stop any UI ticking
      if (this.interval) {
        clearInterval(this.interval)
        this.interval = null
      }

      this.localTimoria = {
        subject: 'Break',
        topic: 'Break',
        tag: 'Break',
        task: 'Take a short break'
      }

      this.timerType = 'break'

      this.timerState = createTimerState({
        id: 'break',
        plannedMs: this.breakDurationMinutes * 60 * 1000,
        type: 'break',
        breakDurationMinutes: this.breakDurationMinutes
      })

      localStorage.setItem('activeTimoria', JSON.stringify(this.timerState));

      this.nowTs = Date.now();

      this.$nextTick(() => {
        this.logTimerState();
        this.startUiTicking();
        this.requestWakeLock();
        
        // Phase 4: Schedule Backend Notification for break
        this.scheduleBackendNotification('break', this.timerState.plannedMs)
      });
      
    },

    finishBreakOnce() {
      if (!this.timerState || this.timerState.type !== 'break') return

      localStorage.removeItem('activeTimoria')
      this.timerState = null

      this.playBreakSound()
      this.pushBreakNotification()

      this.hasBreakFinished = true
      this.$emit('break-finished')
    },

    startUiTicking() {
      // HARD GUARD: only one interval ever
      if (this.interval) {
        clearInterval(this.interval)
        this.interval = null
      }

      const tick = () => {
        if (!this.timerState) {
          clearInterval(this.interval)
          this.interval = null
          return
        }

        // wake Vue up
        if (!this.timerState.pausedAt) {
          this.nowTs = Date.now()
        }

        if (this.timerState.pausedAt) return

        const remainingMs = this.getRemainingMs()

        if (remainingMs === 0) {
          clearInterval(this.interval)
          this.interval = null
          this.finishTimoriaOnce()
        }
      }


      // Run once immediately to handle refresh-at-zero
      tick()

      // UI refresh cadence (not authoritative time)
      this.interval = setInterval(tick, 1000)
    }, 

    extendTimer(seconds) {
      if (!this.timerState) return;

        // Add the requested seconds to the plannedMs
        this.timerState.plannedMs += seconds * 1000;

        // Persist to localStorage so refresh doesn’t lose it
        localStorage.setItem('activeTimoria', JSON.stringify(this.timerState));

        // give user feedback
        this.toast?.success(`${seconds / 60} ${this.$t('timer.minutesAdded') || 'minutes added'}`);

        // Phase 4: Update Backend Notification
        if (!this.timerState.pausedAt) {
          const remainingMs = this.getRemainingMs()
          this.scheduleBackendNotification(this.timerState.type, remainingMs)
        }
    },
    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission !== 'granted') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              console.log('🔔 Notification permission granted.')
            } else {
              console.log('❌ Notification permission denied.')
            }
          })
        }
      },

    pushNotification() {
      if (Notification.permission === 'granted') {
        new Notification('✅ Timoria Complete!', {
          body: 'Take a short break or start a new one!',
          icon: '/favicon.ico' // optional: app icon
        })
      }

    },
    pushBreakNotification() {
      this.playBreakSound();
      if (Notification.permission === 'granted') {
        new Notification('⏰ Break is over!', {
          body: 'Time to get back to your Timoria!',
          icon: '/favicon.ico' // Optional icon
        });
      }
    },

    playTimoriaSound() {
      // the ding sound is played when the timoria is finished. This sound is different from when a break is finished
      const audio = new Audio(dingSound)
      audio.play()
    },
    playBreakSound() {
      // the ding sound is played when the timoria is finished. This sound is different from when a break is finished
      const audio = new Audio(breakOver)
      audio.play()
    },
    
    /**
     * -------------------------------------------------------------------------------------------------
     *                             PHASE 4: PUSH NOTIFICATION HELPERS
     * -------------------------------------------------------------------------------------------------
     */
    async subscribeToPushNotifications() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push messaging is not supported');
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array('BPWNQY5LP-tc3kb6km-p3sOzv5O4KdWwJdiXsEmdqKYtU2lI1cdTpuCkk3mmxvBtNh3AJgDWbCR6bH2sICqT3ZQ')
        });

        const token = localStorage.getItem('token');
        await fetch(`${API_BASE_URL}/notifications/subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ subscription })
        });
        console.log('User is subscribed to Push Notifications');
      } catch (err) {
        console.error('Failed to subscribe to push notifications:', err);
      }
    },

    async scheduleBackendNotification(type, durationMs) {
      try {
        const token = localStorage.getItem('token');
        const finishTime = new Date(Date.now() + durationMs).toISOString();
        const payload = {
          title: type === 'timoria' ? '✅ Timoria Complete!' : '⏰ Break is over!',
          body: type === 'timoria' ? 'Take a short break or start a new one!' : 'Time to get back to your Timoria!'
        };

        await fetch(`${API_BASE_URL}/notifications/schedule`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ type, finishTime, payload })
        });
      } catch (err) {
        console.error('Failed to schedule backend notification:', err);
      }
    },

    async cancelBackendNotification() {
      try {
        const token = localStorage.getItem('token');
        await fetch(`${API_BASE_URL}/notifications/cancel`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (err) {
        console.error('Failed to cancel backend notification:', err);
      }
    },

    urlBase64ToUint8Array(base64String) {
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);

      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    }
  },
  beforeUnmount() {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)

    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }
}

</script>
