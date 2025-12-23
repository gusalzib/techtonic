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
      <button v-tooltip="$t('tooltip.buttons.start')" class="timer-btn" @click="startTimer">{{ $t('buttons.start') }}</button>
      <button v-tooltip="$t('tooltip.buttons.pause')" class="timer-btn" v-if="!this.isPaused" @click="pauseTimer">{{ $t('buttons.pause') }}</button>
      <button class="timer-btn" v-if="this.isPaused" @click="resumeTimer">{{ $t('buttons.resume') }}</button>
      <button v-tooltip="$t('tooltip.buttons.reset')" class="timer-btn" @click="resetTimer">{{ $t('buttons.reset') }}</button>
      <button v-tooltip="$t('tooltip.buttons.cancel')" class="timer-btn" @click="cancelTimer">{{ $t('buttons.cancel') }}</button>
      <button v-tooltip="$t('tooltip.buttons.finish')" class="timer-btn" @click="manualFinishTimer">{{ $t('buttons.finish') }}</button>
      <button v-tooltip="$t('tooltip.buttons.oneMoreMinute')" class="timer-btn" @click="extendTimer(60)">{{ $t('buttons.oneMoreMinute') || '+1 min' }}</button>
      <button v-tooltip="$t('tooltip.buttons.fiveMoreMinutes')" class="timer-btn" @click="extendTimer(300)">{{ $t('buttons.fiveMoreMinutes') || '+5 min' }}</button>
      <button class="timer-btn" @click="pushNotification">{{ $t('buttons.notify') }}</button>
    </div>
  </div>
</template>

<script>
import dingSound from '@/assets/audio/ding.mp3'
import breakOver from '@/assets/audio/break_over.mp3'
import { useToast } from 'vue-toastification'

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
      remaining: 0, // this is what the UI shows to the user
      accumulatedMs: 0, // how much time has actually passed
      plannedSeconds: 0, // original duration 
      interval: null, 
      isRunning: false, // whether ticking should happen or not
      isPaused: false, // used to control the pause/resume button display
      startTime: null, // when the current run segment started
      endTime: null, // used for the extendTimer functionality
      url: 'http://localhost:5000/api/timoria',
      localTimoria: null, // timoria in props is readonly and cannot be assigned and re-assigned so we use a local copy of it
      hasCompleted: false, // Prevent duplicate complete calls
      hasBreakFinished: false,
      timerType: 'timoria', // or 'break',
      breakDuration: 1, // the plan is to allow users to decide the duration here but for now we will use a fixed duration 

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
          // We use $nextTick to ensure the DOM and data are ready 
          // before firing the interval logic.
          this.$nextTick(() => {
            this.startTimer();
          });
        }
      },
      immediate: true
    }  
  },
  mounted() {
    this.toast = useToast();

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
        const remaining = Math.max(Math.floor((endTime - now) / 1000)); // Calculate remaining time

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
            this.interval = setInterval(() => this.tick(), 1000);
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

    startTimer() {
      /**
       * This method must: 
       * 
       * - Reset previous timer state
       * - Initialize time values
       * - Start ticking
       * - Be idempotent (safe if called twice)
       * 
       * It does not have to finish anything, talk to the backend, push notifications or handle pause/resume as it was doing before (that caused a mess)
       */

      // no timoria, no timer
      if (!this.localTimoria || !this.localTimoria.duration) {
          this.toast && this.toast.error(this.$t('notification.startFailed') || 'Failed to start Timoria.')
         return;
      }

      // is isRunning, we do not want to start again, prevent double clicks
      // or if isPaused then it is not the start button that resumes the timer, that would be the resume button
      if (this.isRunning || this.isPaused) {
        return;
      }

      // clean up any previous run
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }

      // reset state
      this.timerType = 'timoria';
      this.hasCompleted = false;
      this.accumulatedMs = 0;

      // initialize time
      this.plannedSeconds = this.localTimoria.duration * 60;
      this.remaining = this.plannedSeconds;

      const now = Date.now()
      this.startTime = now;
      this.endTime = now + this.remaining * 1000; // we multiply with 1000 because Date.now returns the number in milliseconds
      this.isRunning = true; 

      localStorage.setItem('activeTimoria', JSON.stringify({
        timoria: this.localTimoria,
        startTime: this.startTime,
        endTime: this.endTime,
        timerType: this.timerType,   /* storing the timer type in the localstorage to identify what timer was running after a potential //page reload */
        remaining: this.remaining,
        accumulatedMs: this.accumulatedMs
      }));

      // start ticking
      /**
       * setInterval syntax
       * setInterval(callback, delay)
       * Run callback every delay milliseconds until I tell you to stop
       * 
       * so conceptually: every 1000 ms → run something
       * we give it 1000 so that means: Run the callback once per second
       * this callback in our case is: ()=>{this.tick()} (this.tick() is the thing we are running each second here)
       */
      this.interval = setInterval(() => {
        this.tick()
      }, 1000);

      this.$emit('updatePlannedTimorias');  // Update the parent component

    },
    tick() {
      /**
       * this method: 
       * - Runs every second
       * - Computes how much time is left
       * - Detects when time reaches zero
       * - Does not finish anything itself
       * - Has only one exit point into finishing logic
       */

      if (!this.isRunning || this.hasCompleted) {
        return; 
       }

       // divide by 1000 to convert from ms to seconds
      const secondsLeft = Math.floor((this.endTime - Date.now()) / 1000);

      // The Math.max() static method returns the largest of the numbers given as input parameters, or -Infinity if there are no parameters.
      // the subtraction from the previous line can become negative so we use math.max so that if it goes into negative territory, we select the zero as it is greater
      this.remaining = Math.max(0, secondsLeft);

      if (this.isRunning && !this.hasCompleted) {
        // Persist state
        localStorage.setItem('activeTimoria', JSON.stringify({
          timoria: this.localTimoria,
          startTime: this.startTime,
          endTime: this.endTime,
          timerType: this.timerType,
          remaining: this.remaining,
          accumulatedMs: this.accumulatedMs
        }));
      }


      if (this.remaining === 0) {
        // this.hasCompleted = true;
        this.isRunning = false;
        clearInterval(this.interval);
        this.interval = null;

        if (this.timerType === 'timoria') {
          this.autoFinishTimer();
        }else if (this.timerType === 'break') {
          this.hasBreakFinished = true;
          this.pushBreakNotification();
          this.resetTimer();
        }
        
      }


    },
    pauseTimer() {
      /**
       * While running
       *  startTime = when the current run started
       *  endTime = absolute finish time
       *  accumulatedMs = time from previous runs (0 on first start)
       * 
       * When pausing
       *  Stop the interval
       *  Add elapsed time to accumulatedMs
       *  Clear startTime
       *  Keep remaining
       * 
       * When resuming
       *  Recalculate endTime from now + remaining
       *  Set a new startTime
       *  Restart interval
       */

       // nothing to pause if the timer is not running
       if (!this.isRunning) {
         return;
      }

      // stop ticking
      // clean up any previous run
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }

      // accumulate elapsed time
      if (this.startTime) {
        this.accumulatedMs = this.accumulatedMs + (Date.now() - this.startTime); // store the elapsed time
        this.startTime = null; // reset startTime because we paused and it should be recalculated when we resume

      }

      this.isRunning = false;
      this.isPaused = true; // used to control the pause/resume button display


    },
    resumeTimer() {
      // we cannot resume if it is running or if it is completed
      if (this.isRunning || this.hasCompleted) {
        return; 
      }

      // we cannot resume if the timoria information is missing 
      if (!this.localTimoria) {
        return;
      }

      const now = Date.now();

      this.startTime = now;
      this.endTime = now + this.remaining * 1000; // date.now gives ms so we convert to this.remaining to ms as well
      this.isRunning = true; 
      this.isPaused = false;

      this.interval = setInterval(() => {
        this.tick()
      }, 1000);


    },
    manualFinishTimer() {      
      /**
       * this method allows: 
       * - User clicks Finish
       * - Timer stops immediately
       * - Elapsed time is calculated exactly the same way autoFinishTimer
       * - Timoria is marked done
       * - No dependence on remaining === 0
       * 
       * this method does not need to reinvent the finsihing logic. We can just call the autoFinish but we calculate the accumulatedMS first 
       */

      // gurad against double execution
       if (this.hasCompleted) {
         return;
      }

      if (!this.localTimoria) {
        return;
      }

      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;

      }

      const now = Date.now()
      this.isRunning = false; 
      this.remaining = 0;

      if (this.startTime) {
        // subtract the start time from the now timestamp to get the total time spent
        this.accumulatedMs = this.accumulatedMs + (now - this.startTime);
        this.startTime = null; 
      }

      localStorage.removeItem('activeTimoria');

      this.finishTimoria();
      
    },
    autoFinishTimer() {
      // gurad against double execution
       if (this.hasCompleted) {
         return;
      }

      const now = Date.now();

      // ACCOUNT FOR THE FINAL RUN SEGMENT
      if (this.startTime) {
        this.accumulatedMs += (now - this.startTime);
        this.startTime = null;
      }

      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;

      }

      this.isRunning = false;
      this.remaining = 0;

      localStorage.removeItem('activeTimoria'); // remove after finish

      this.finishTimoria();
      
    },
    finishTimoria() {
      /**
       * this method: 
       * - Runs once
       * - Handles “time ran out” case
       * - Stops the timer
       * - Triggers side effects (sounds, backend, break, etc.)
       */
      if (this.hasCompleted) {
        return;
      } 

      this.hasCompleted = true

      
      let totalMs = this.accumulatedMs

      const minutes = Math.max(1, Math.round(totalMs / 60000))

      if (this.localTimoria?._id) {
        fetch(`${this.url}/${this.localTimoria._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...this.localTimoria,
            status: 'done',
            duration: minutes,
            finishedAt: new Date().toISOString()
          })
        }).catch(err => {
          this.toast && this.toast.error(this.$t('notification.failedToCancelTimoria') || 'Failed to cancel Timoria.');
          console.error('Failed to finish Timoria:', err)
        })
      }

      this.playTimoriaSound();
      this.pushNotification();

      localStorage.removeItem('activeTimoria'); // remove after finish

      this.toast.success(this.$t('notification.timoriaSessionFinished'))

      this.$emit('completed', this.localTimoria?._id);

      // start break
      this.startBreak()
    },
    startBreak() {
      /**
       * conceptually , the break is a timer, with a duration, it runs after the Timroia finishes with slightly different completion logic
       * A break uses the same timer engine, but different semantics
       * 
       * this method does the following: 
       * - Stop any existing timer (safety)
       * - Set a fixed duration (e.g. 5 minutes)
       * - Set timerType = 'break'
       * - Reset timing state
       * - Start ticking
       * 
       * NO backend calls and no changes to Timorias
       */

      // stop any running timers 
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;

      }

      this.timerType = 'break';
      this.hasCompleted = false;
      this.hasBreakFinished = false;

      // reset timing state
      this.accumulatedMs = 0;
      this.startTime = Date.now();

      this.remaining = this.breakDuration;
      this.endTime = this.startTime + this.breakDuration * 1000;

      this.isRunning = true; 

      // start ticking
      this.interval = setInterval(() => {
        this.tick();
      }, 1000);


    },
    resetTimer() {
      /**
       * this method will: 
       * - Stops any running timer.
       * - Resets all timer-related state.
       * - Leaves localTimoria intact (so the user could resume or start a break).
       * - Removes any interval.
       */
      // stop ticking
      if (this.interval) {
        clearInterval(this.interval)
        this.interval = null
      }

      // reset all timer state
      this.isRunning = false
      this.isPaused = false
      this.remaining = 0
      this.startTime = null
      this.endTime = null
      this.accumulatedMs = 0
      this.hasCompleted = false
      this.hasBreakFinished = false
      localStorage.removeItem('activeTimoria'); // purge localStorage of timoria data
    },
    async cancelTimer() {
      /**
       * this method: 
       * - Stops the timer immediately.
       * - Resets the timer.
       * - Sets a Timoria back to “planned” in the backend if it was ongoing.
       * - Cleans up state so the parent knows nothing is running.
       */

      // stop and reset timer
      this.resetTimer();

      // only act if wwe have a Timoria is in progress
      if (this.localTimoria && this.localTimoria._id) {
        try {
          // update backend status to 'planned'
          const response = await fetch(`${this.url}/${this.localTimoria._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'planned' })
          });

          if (!response.ok) {
            this.toast && this.toast.error(this.$t('notification.failedToCancelTimoria') || 'Failed to cancel Timoria.');
          }

          // emit event so parent can refresh planned Timorias
          this.$emit('updateTimoria', { ...this.localTimoria, status: 'planned' });
          this.$emit('updatePlannedTimorias');
          
        } catch (error) {
          console.error('Error cancelling Timoria: ', error)
          this.toast?.error(this.$t('notification.failedToCancelTimoria') || 'Failed to cancel Timoria.');
        }

        // clear local copy
        this.localTimoria = null;

        this.$emit('cancelTimer');  // Notify parent that the timer was canceled
      }
      
    },
    extendTimer(seconds) {
      this.remaining += seconds;
      this.endTime += seconds * 1000;

      // Update localStorage
      localStorage.setItem('activeTimoria', JSON.stringify({
        timoria: this.localTimoria,
        startTime: this.startTime,
        endTime: this.endTime,
        timerType: this.timerType,
        remaining: this.remaining,
        accumulatedMs: this.accumulatedMs
      }));
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

}

</script>
