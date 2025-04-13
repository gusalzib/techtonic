<template>
  <div class="timer-container">
    <h1>{{ $t('timer.title') }}</h1>

    <div id="timerDisplay">{{ formattedTime }}</div>

    <div>
      <input v-model.number="duration" type="number" class="timer-input" :placeholder="$t('timer.minutesPlaceholder')" />
      <input v-model="subject" type="text" class="timer-input" :placeholder="$t('timer.subjectPlaceholder')" />
      <input v-model="topic" type="text" class="timer-input" :placeholder="$t('timer.topicPlaceholder')" />
      <input v-model="tag" type="text" class="timer-input" :placeholder="$t('timer.tagPlaceholder')" />
      <input v-model="task" type="text" class="timer-input" :placeholder="$t('timer.taskPlaceholder')" />
    </div>

    <div>
      <button class="timer-btn" @click="startTimer">{{ $t('buttons.start') }}</button>
      <button class="timer-btn" @click="pauseTimer">{{ $t('buttons.pause') }}</button>
      <button class="timer-btn" @click="resetTimer">{{ $t('buttons.reset') }}</button>
    </div>
  </div>
</template>

<script>
import dingSound from '@/assets/audio/ding.mp3'

export default {
  data() {
    return {
      duration: 25, // in minutes
      remaining: 0,
      interval: null,
      isRunning: false,
      startTime: null,

      // Timoria fields
      subject: '',
      topic: '',
      tag: '',
        task: '',
      url: 'http://localhost:5000/api/timoria',
    }
  },
  computed: {
    formattedTime() {
      const mins = Math.floor(this.remaining / 60)
      const secs = this.remaining % 60
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    }
  },
  methods: {
    startTimer() {
        if (!this.duration || !this.subject || !this.topic) {
            alert('Subject, topic, and duration are required')
            return
        }

        if (!this.isRunning) {
            const now = Date.now()
            this.startTime = this.startTime || now
            this.endTime = this.startTime + this.duration * 60 * 1000
            this.remaining = this.duration * 60 // set remaining time
            this.tick()
            this.interval = setInterval(this.tick, 1000)
            this.isRunning = true
        }
    },
    pauseTimer() {
      clearInterval(this.interval)
      this.isRunning = false
    },
    resetTimer() {
      clearInterval(this.interval)
      this.remaining = 0
      this.startTime = null
      this.isRunning = false
    },
    tick() {
      const now = Date.now()
      const diff = Math.round((this.endTime - now) / 1000)
      this.remaining = diff > 0 ? diff : 0

      if (this.remaining <= 0) {
        this.completeTimoria()
        this.resetTimer()
      }
    },
      async completeTimoria() {
          console.log('Timer complete! Sending to backend...')

      try {
        await fetch(`${this.url}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            subject: this.subject,
            topic: this.topic,
            tag: this.tag,
            task: this.task,
            duration: this.duration
          })
        })

        this.playSound()
        if (Notification.permission === 'granted') {
          new Notification('Timoria Complete!')
        }
      } catch (err) {
        console.error('Failed to save Timoria:', err)
      }
    },
    playSound() {
      const audio = new Audio(dingSound)
      audio.play()
    }
  },
  mounted() {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission()
    }
  },
  beforeUnmount() {
    clearInterval(this.interval)
  }
}
</script>
