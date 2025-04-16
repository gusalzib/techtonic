<template>
  <div class="timer-container">
    <h1>{{ $t('timer.title') }}</h1>

    <div id="timerDisplay">{{ formattedTime }}</div>

    <!-- <div>
      <input v-model.number="duration" type="number" class="timer-input" :placeholder="$t('timer.minutesPlaceholder')" />
      <input v-model="subject" type="text" class="timer-input" :placeholder="$t('timer.subjectPlaceholder')" />
      <input v-model="topic" type="text" class="timer-input" :placeholder="$t('timer.topicPlaceholder')" />
      <input v-model="tag" type="text" class="timer-input" :placeholder="$t('timer.tagPlaceholder')" />
      <input v-model="task" type="text" class="timer-input" :placeholder="$t('timer.taskPlaceholder')" />
    </div> -->
    <div>
    <p><strong>{{ $t('table.subject') }}:</strong> {{ this.localTimoria?.subject || 'N/A' }}</p>
    <p><strong>{{ $t('table.topic') }}:</strong> {{ this.localTimoria?.topic || 'N/A' }}</p>
    <p v-if="localTimoria?.tag"><strong>{{ $t('table.tag') }}:</strong> {{ localTimoria.tag }}</p>
    <p v-if="localTimoria?.task"><strong>{{ $t('table.task') }}:</strong> {{ localTimoria.task }}</p>
    <!-- <p>Debugging timoria: {{ timoria }}</p> -->
    </div>

    <div>
      <button class="timer-btn" @click="startTimer">{{ $t('buttons.start') }}</button>
      <button class="timer-btn" @click="pauseTimer">{{ $t('buttons.pause') }}</button>
      <button class="timer-btn" @click="resetTimer">{{ $t('buttons.reset') }}</button>
      <button class="timer-btn" @click="cancelTimer">{{ $t('buttons.cancel') }}</button>
      <button class="timer-btn" @click="finishTimer">{{ $t('buttons.finish') }}</button>
      <button class="timer-btn" @click="pushNotification">{{ $t('buttons.notify') }}</button>
    </div>
  </div>
</template>

<script>
import dingSound from '@/assets/audio/ding.mp3'

export default {
  props: {
    timoria: {
      type: Object,
      required: false,
      default: null
    }
  },
  data() {
    return {
      remaining: 0,
      interval: null,
      isRunning: false,
      startTime: null,
      url: 'http://localhost:5000/api/timoria',
      localTimoria: null, // timoria in props is readonly and cannot be assigned and re-assigned so we use a local copy of it
      hasCompleted: false, // Prevent duplicate complete calls
    } 
  },
  computed: {
    formattedTime() {
      const mins = Math.floor(this.remaining / 60)
      const secs = this.remaining % 60
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    }
  },
  watch: {
    timoria: {
      handler(newVal) {
        // console.log('[WATCH] Timoria changed:', newVal)
        if (newVal && newVal.duration) {
          this.localTimoria = newVal
          this.startTime = null
          this.remaining = newVal.duration * 60
          this.startTimer()
        }
      },
      immediate: true
    }  
  },
    mounted() {
    // Request permission for notifications
    if (Notification.permission !== 'granted') {
        Notification.requestPermission();
    }

    // Check if there's any saved activeTimoria in localStorage
    const saved = localStorage.getItem('activeTimoria');
    // console.log('Retrieved activeTimoria from localStorage:', saved); // Log to check what's retrieved
    
    if (saved) {
        try {
        const { timoria, startTime, endTime } = JSON.parse(saved);
        // console.log('Parsed activeTimoria data:', timoria, startTime, endTime); // Log the parsed data

        const now = Date.now();
        const remaining = Math.floor((endTime - now) / 1000); // Calculate remaining time

        // console.log('Remaining time after refresh:', remaining); // Log the remaining time

        // If there's remaining time (the timer hasn't finished)
        if (remaining > 0) {
            // Sync localTimoria with the saved data
            this.localTimoria = { ...timoria };
            this.$emit('update:timoria', { ...timoria }); // Emit to parent (optional)

            // Set the timer state
            this.startTime = startTime;
            this.endTime = endTime;
            this.remaining = remaining;
            this.isRunning = true;

            // Start the timer interval
            this.interval = setInterval(this.tick, 1000);
        } else {
            // If the timer has finished, remove it from localStorage
            localStorage.removeItem('activeTimoria');
        }
        } catch (error) {
        console.error('Error parsing activeTimoria from localStorage:', error);
        }
    } else {
        console.log('No activeTimoria found in localStorage');
    }
    },

  methods: {
    startTimer() {
      if (!this.localTimoria || !this.localTimoria.subject || !this.localTimoria.topic || !this.localTimoria.duration) {
          alert('A valid Timoria is required to start the timer.')
          return
        }
      //Kill old intervals on startTimer() just in case
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
      if (!this.isRunning) {
          const now = Date.now()
          this.startTime = this.startTime || now
          this.endTime = this.startTime + this.localTimoria.duration * 60 * 1000
          this.remaining = this.localTimoria.duration * 60

          localStorage.setItem('activeTimoria', JSON.stringify({
              timoria: this.localTimoria,
              startTime: this.startTime,
              endTime: this.endTime
          }))

          this.tick()
          this.interval = setInterval(this.tick, 1000)
          this.isRunning = true

          this.$emit('updatePlannedTimorias');  // Update the parent component
      }
    },

    pauseTimer() {
      clearInterval(this.interval)
      this.isRunning = false
    },

    resetTimer() {
    clearInterval(this.interval);
    this.remaining = 0;
    this.startTime = null;
    this.isRunning = false;
    this.interval = null;
    this.hasCompleted = false;
    localStorage.removeItem('activeTimoria');
    },

  cancelTimer() {
    // Stop the timer if it's running
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      this.resetTimer(); 

    }

    // Send a request to update the status of the timoria from 'ongoing' to 'planned'
    if (this.localTimoria?._id) {
      const updatedTimoria = {
        ...this.localTimoria,
        status: 'planned'  // Set the status back to 'planned'
      };

      // Send the updated Timoria to the backend to save the new status
      fetch(`${this.url}/${this.localTimoria._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTimoria)
      })
      .then((response) => response.json())
      .then((data) => {
        console.log('Timoria status updated to planned:', data);
        // Emit event to update the UI in parent (Timoria.vue)
        this.$emit('updateTimoria', updatedTimoria);  // Update the parent component
        this.$emit('updatePlannedTimorias');  // Update the parent component
      })
      .catch((err) => {
        console.error('Error updating timoria status:', err);
      });
    }

    // Reset the activeTimoria to null, since it's no longer active
    this.localTimoria = null;
    this.$emit('cancelTimer');  // Notify parent that the timer was canceled
  },

    tick() {
      if (this.hasCompleted || !this.isRunning || this.interval === null) {
        return;
      }
      const now = Date.now();
      const diff = Math.round((this.endTime - now) / 1000);
      this.remaining = diff > 0 ? diff : 0;

      if (this.remaining <= 0 && !this.hasCompleted) {
          clearInterval(this.interval);
          this.interval = null;
          this.completeTimoria();
          this.resetTimer();
      }
    },

    async completeTimoria() {
      // we only want to allow completeTimoria to run once 
        if (this.hasCompleted == true) return;

        this.hasCompleted = true;
      try {
        await fetch(`${this.url}/${this.localTimoria._id}`, {
          method: 'PUT', //this hits /api/timoria/:id
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...this.localTimoria,
            status: 'done'
          })
        })

        this.playSound()
        if (Notification.permission === 'granted') {
          new Notification('Timoria Complete!')
        }

        // notify parent that timoria is done 
        this.$emit('updateTodaysTimorias');
        // Clean up saved timer
        localStorage.removeItem('activeTimoria');

        // Notify parent
        this.$emit('completed', this.localTimoria._id);
        this.pushNotification() // create a push notification when timoria ends

      } catch (err) {
        console.error('Failed to save Timoria:', err)
      }
    },

    finishTimer() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        const now = Date.now();
        const elapsedDuration = Math.floor((now - this.startTime) / 1000);  // seconds

        if (this.localTimoria?._id) {
            const updatedTimoria = {
                ...this.localTimoria,
                status: 'done',
                duration: Math.floor(elapsedDuration / 60),
            };

            fetch(`${this.url}/${this.localTimoria._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedTimoria)
            })
            .then((response) => response.json())
            .then((data) => {
                console.log('Timoria marked as completed:', data);

                // Clean up timer
                this.resetTimer();

                // Fully remove from local state
                this.localTimoria = null;

                // Emit all updates AFTER state is cleaned
                this.$emit('updateTimoria', updatedTimoria);
                this.$emit('updatePlannedTimorias');
                this.$emit('updateTodaysTimorias');
                this.$emit('finishTimer');
            })
            .catch((err) => {
                console.error('Error finishing timoria:', err);
            });
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

    playSound() {
      const audio = new Audio(dingSound)
      audio.play()
    }
  },



  beforeUnmount() {
    clearInterval(this.interval)
  }
}

</script>
