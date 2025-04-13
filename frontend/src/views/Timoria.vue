<template>
<!-- Timer Section -->
 <!-- <p>Active language: {{ $i18n.locale }}</p>
<p style="color: red">Lang Check: {{ $i18n.locale }} / {{ $t('example.task') }}</p> -->

<div class="timer-container">
  <h1>{{ $t('timer.title') }}</h1>

  <div id="timerDisplay">{{ $t('timer.defaultTime') }}</div>

  <div>
    <input v-model.number="duration" type="number" class="timer-input" :placeholder="$t('timer.minutesPlaceholder')" required/>
    <input v-model="subject" type="text" class="timer-input" :placeholder="$t('timer.subjectPlaceholder')" required/>
    <input v-model="topic" type="text" class="timer-input" :placeholder="$t('timer.topicPlaceholder')" required/>
    <input v-model="tag" type="text" class="timer-input" :placeholder="$t('timer.tagPlaceholder')" />
    <input v-model="task" type="text" class="timer-input" :placeholder="$t('timer.taskPlaceholder')" />
  </div>

  <div>
    <button class="timer-btn">{{ $t('buttons.start') }}</button>
    <button class="timer-btn">{{ $t('buttons.pause') }}</button>
    <button class="timer-btn">{{ $t('buttons.reset') }}</button>
    <button type="submit" id="" class="timer-btn">{{ $t('buttons.finish') }}</button>
  </div>
</div>

<!-- Today’s Pomodoros Section -->
<section class="today-pomos">
  <h2>{{ $t('todayPomos.title') }}</h2>
  <p>{{ $t('todayPomos.summary') }}</p>

  <table>
    <thead>
      <tr>
        <th>{{ $t('table.task') }}</th>
        <th>{{ $t('table.duration') }}</th>
        <th>{{ $t('table.subject') }}</th>
        <th>{{ $t('table.topic') }}</th>
        <th>{{ $t('table.tag') }}</th>
      </tr>
    </thead>
    <tbody>
      <!-- Example row -->
      <tr>
        <td>{{ $t('example.task') }}</td>
        <td>{{ $t('example.duration') }}</td>
        <td>{{ $t('example.subject') }}</td>
        <td>{{ $t('example.topic') }}</td>
        <td>{{ $t('example.tag') }}</td>
      </tr>
    </tbody>
  </table>

  <!-- Mobile card layout -->
  <div class="pomo-card">
    <div class="pomo-card-content">
      <div class="pomo-card-item">
        <strong>{{ $t('table.task') }}:</strong> <span>{{ $t('example.task') }}</span>
      </div>
      <div class="pomo-card-item">
        <strong>{{ $t('table.duration') }}:</strong> <span>{{ $t('example.duration') }}</span>
      </div>
      <div class="pomo-card-item">
        <strong>{{ $t('table.subject') }}:</strong> <span>{{ $t('example.subject') }}</span>
      </div>
      <div class="pomo-card-item">
        <strong>{{ $t('table.topic') }}:</strong> <span>{{ $t('example.topic') }}</span>
      </div>
      <div class="pomo-card-item">
        <strong>{{ $t('table.tag') }}:</strong> <span>{{ $t('example.tag') }}</span>
      </div>
    </div>
    <div class="card-actions">
      <button class="delete-btn">{{ $t('buttons.delete') }}</button>
      <button class="save-btn">{{ $t('buttons.save') }}</button>
    </div>
  </div>
</section>

<!-- Planned Timorias Section -->
<section class="planned-timorias">
  <h2>{{ $t('planned.title') }}</h2>

  <form>
    <input v-model.number="duration" type="number" class="timer-input" :placeholder="$t('timer.minutesPlaceholder')" required/>
    <input v-model="subject" type="text" class="timer-input" :placeholder="$t('timer.subjectPlaceholder')" required/>
    <input v-model="topic" type="text" class="timer-input" :placeholder="$t('timer.topicPlaceholder')" required/>
    <input v-model="tag" type="text" class="timer-input" :placeholder="$t('timer.tagPlaceholder')" />
    <input v-model="task" type="text" class="timer-input" :placeholder="$t('timer.taskPlaceholder')" />
    <button type="button" id="addPlannedTimoriaBtn" @click="createTimoria">{{ $t('buttons.add') }}</button>
  </form>

    <ul id="plannedTimoriasList">
    <li :id="`timoria-${timoria._id}`" v-for="(timoria, index) in plannedTimorias" :key="index">
        <div class="timoria-info">
        <span class="timoria-topic">{{ timoria.subject }}</span>
        <span class="timoria-topic">{{ timoria.topic }}</span>
        <span class="timoria-topic">{{ timoria.tag || '—' }}</span>
        <span class="timoria-topic">{{ timoria.task || '—' }}</span>
        <span class="timoria-duration">{{ timoria.duration }} min</span>
        </div>
        <div class="timoria-actions">
        <button class="start-btn">{{ $t('buttons.start') }}</button>
        <button class="delete-btn" @click="deleteTimoria(timoria._id)">{{ $t('buttons.delete') }}</button>
        </div>
    </li>
    </ul>
<button v-if="undoStack.length"  class="save-btn"  @click="undoDelete"  style="margin-top: 10px;">Undo Delete</button>
</section>

<!-- Autocomplete Suggestions -->
<div class="autocomplete-suggestions">
  <div class="suggestion-item">{{ $t('suggestions.learnVue') }}</div>
  <div class="suggestion-item">{{ $t('suggestions.fixBugs') }}</div>
</div>


</template>


<script>
// @ is an alias to /src
import axios from 'axios'

export default {
    name: 'Timoria',
    data() {
        return {
            subject: '',
            topic: '',
            tag: '',
            task: '',
            duration: null,
            url: 'http://localhost:5000/api/timoria',
            plannedTimorias: [],
            undoStack: []
        }
  },
  components: {
    
    },
  mounted() {
    console.log('Locale:', this.$i18n.locale)
    console.log('t(timer.title):', this.$t('timer.title'))
    console.log('Available messages:', this.$i18n.messages)
    this.getTimorias()
    }, 
    methods: {
        async createTimoria() {
            try {
                const payload = {
                    subject: this.subject,
                    topic: this.topic,
                    tag: this.tag,
                    task: this.task,
                    duration: this.duration,
                }

                const response = await axios.post(`${this.url}`, payload);
                alert('Timoria saved successfully');
                console.log('Saved: ', response.data);

                // reset form
                this.subject = '';
                this.topic = '';
                this.tag = '';
                this.task = '';
                this.duration = '';

                this.getTimorias() // update the list right after adding the Timoria
            } catch (error) {
                console.log('Error: ', error.message);
                alert('Failed to save Timoria.');
                
            }
        },
        async getTimorias() {
            try {
                const response = await fetch(`${this.url}`);
                const data = await response.json()

                this.plannedTimorias = data;
            } catch (error) {
                console.error('Failed to fetch Timorias:', error)
                alert('Failed to get planned Timorias.')
            }
        },
        async deleteTimoria(id) {
            // confirm deletion 
            const confirmed = confirm('Are you sure you want to delete this item?')
            if (!confirmed) return

            // Find the timoria you're about to delete. this is useful for the undo feature. we need to get the element before deleting it
            const toDelete = this.plannedTimorias.find(t => t._id === id) 

            try {
                await fetch(`${this.url}/${id}`, {
                method: 'DELETE'
                })
                this.plannedTimorias = this.plannedTimorias.filter(t => t._id !== id)

                // Push the deleted timoria to undoStack. this where we are going to get it from in case we need ti undo
                this.undoStack.push(toDelete)

                this.getTimorias() // update the list right after deleting the Timoria
            } catch (err) {
                console.error('Error deleting timoria:', err)
            }
            
            
        },

        async undoDelete() {
            const lastDeleted = this.undoStack.pop()
            if (lastDeleted) {
                try {
                    const res = await axios.post(`${this.url}`, lastDeleted)
                    this.plannedTimorias.unshift(res.data)
                    this.getTimorias() // update the list right after undoing the Timoria
                } catch (err) {
                    console.error('Error restoring timoria:', err)
                }
            }
        }

    },


}
</script>
<style src="../assets/styles/main.css"></style>