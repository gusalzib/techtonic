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
import breakOver from '@/assets/audio/break_over.mp3'

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
      hasBreakFinished: false,
      timerType: 'timoria', // or 'break'

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
        
        if (newVal && newVal.duration) {
          this.localTimoria = newVal
          this.startTime = null
          this.remaining = newVal.duration * 60

          // we need to check if the parent (Timoria.vue) is sending a timoria or a break because the timer behaviour would change based on that
          const isBreak = newVal.subject === 'Break' && newVal.topic === 'Break';
          this.startTimer(isBreak ? 'break' : 'timoria');
        }
      },
      immediate: true
    }  
  },
  mounted() {
      /*
      The mounted() block:
      1. Requests notification permission.

      2. Tries to recover the timer state from localStorage if there's an active timer.
      */
    // Request permission for notifications
    if (Notification.permission !== 'granted') {
        Notification.requestPermission();
    }

    // Check if there's any saved activeTimoria in localStorage
    const saved = localStorage.getItem('activeTimoria');
    // console.log('Retrieved activeTimoria from localStorage:', saved); // Log to check what's retrieved
    
    if (saved) {
        try {
          const { timoria, startTime, endTime, timerType } = JSON.parse(saved);
          this.timerType = timerType || 'timoria'; // fallback just in case
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
            const finishedTimoria = timoria;
            this.localTimoria = timoria;

            if (timerType === 'timoria') {
              this.completeTimoria();
            } else if (timerType === 'break') {
              this.pushBreakNotification();
              this.$emit('break-finished', finishedTimoria);
              this.resetTimer();
            }
        }
        } catch (error) {
          console.error('Error parsing activeTimoria from localStorage:', error);
        }
      } else {
          console.log('No activeTimoria found in localStorage');
      }
    },

  methods: {
    startTimer(type = 'timoria') {
      this.timerType = type; // avoiding mixing the timoria and break logic
      
      if (type === 'break') {
        this.hasBreakFinished = false;
        this.localTimoria = this.localTimoria || {}; // in case it is null
      } else {
        if (!this.localTimoria || !this.localTimoria.subject || !this.localTimoria.topic || !this.localTimoria.duration) {
            alert('A valid Timoria is required to start the timer.')
            return
        }
      }

      
      this.hasCompleted = false; // ✅ reset before starting again
      
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
              endTime: this.endTime,
              timerType: this.timerType,   /* storing the timer type in the localstorage to identify what timer was running after a potential //page reload */
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


        const finishedTimoria = this.localTimoria; // <--- capture the task info before it's cleared


        if (this.timerType === 'timoria') {
          if (!this.hasCompleted) {
            this.completeTimoria();
          }
        }
        if (this.timerType === 'break') {
          setTimeout(() => {
            if (!this.hasBreakFinished) {
              this.hasBreakFinished = true;
              this.pushBreakNotification();  // Notify the user break is over
              this.$emit('break-finished', finishedTimoria);
              this.resetTimer();
              
            }
          }, 100);
        }
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
            status: 'done',
            finishedAt: new Date().toISOString(), //override the date field to reflect the actual completion time
          })
        })

        this.playTimoriaSound()

        // notify parent that timoria is done 
        this.$emit('updateTodaysTimorias');
        // Clean up saved timer
        localStorage.removeItem('activeTimoria');

        this.startTimer('break');

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
  },



  beforeUnmount() {
    clearInterval(this.interval)
  }
}

</script>
