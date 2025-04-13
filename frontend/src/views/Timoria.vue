<template>
<!-- Timer Section -->
 <!-- <p>Active language: {{ $i18n.locale }}</p>
<p style="color: red">Lang Check: {{ $i18n.locale }} / {{ $t('example.task') }}</p> -->

  <Timer />

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
        <th>{{ $t('table.actions') }}</th>
      </tr>
    </thead>

    <tbody>
    <tr v-for="(timoria, index) in todayTimorias" :key="timoria._id">
        <td v-if="editIndex !== index">{{ timoria.task || '—' }}</td>
        <td v-else><input v-model="editForm.task" /></td>

        <td v-if="editIndex !== index">{{ timoria.duration }} min</td>
        <td v-else><input v-model="editForm.duration" type="number" /></td>

        <td v-if="editIndex !== index">{{ timoria.subject }}</td>
        <td v-else><input v-model="editForm.subject" /></td>

        <td v-if="editIndex !== index">{{ timoria.topic }}</td>
        <td v-else><input v-model="editForm.topic" /></td>

        <td v-if="editIndex !== index">{{ timoria.tag || '—' }}</td>
        <td v-else><input v-model="editForm.tag" /></td>

        <td>
        <button v-if="editIndex !== index" @click="enableEdit(index, timoria)">
            ✏️ {{ $t('buttons.edit') || 'Edit' }}
        </button>
        <button v-else @click="saveEdit(timoria._id)">💾 {{ $t('buttons.save') || 'Save' }}</button>
        <button class="delete-btn" @click="deleteTimoria(timoria._id)">{{ $t('buttons.delete') }}</button>
        </td>
    </tr>
    
    </tbody>


  </table>

<!-- Mobile card layout -->
<div class="pomo-card" v-for="(timoria, index) in todayTimorias" :key="'card-' + timoria._id">
  <div class="pomo-card-content">
    <div class="pomo-card-item">
      <strong>{{ $t('table.task') }}:</strong>
      <span v-if="editIndex !== index">{{ timoria.task || '—' }}</span>
      <input v-else v-model="editForm.task" />
    </div>

    <div class="pomo-card-item">
      <strong>{{ $t('table.duration') }}:</strong>
      <span v-if="editIndex !== index">{{ timoria.duration }} min</span>
      <input v-else v-model="editForm.duration" type="number" />
    </div>

    <div class="pomo-card-item">
      <strong>{{ $t('table.subject') }}:</strong>
      <span v-if="editIndex !== index">{{ timoria.subject }}</span>
      <input v-else v-model="editForm.subject" />
    </div>

    <div class="pomo-card-item">
      <strong>{{ $t('table.topic') }}:</strong>
      <span v-if="editIndex !== index">{{ timoria.topic }}</span>
      <input v-else v-model="editForm.topic" />
    </div>

    <div class="pomo-card-item">
      <strong>{{ $t('table.tag') }}:</strong>
      <span v-if="editIndex !== index">{{ timoria.tag || '—' }}</span>
      <input v-else v-model="editForm.tag" />
    </div>
  </div>

  <div class="card-actions">
    <button class="delete-btn" @click="deleteTimoria(timoria._id)">
      {{ $t('buttons.delete') }}
    </button>

    <button v-if="editIndex !== index" class="save-btn" @click="enableEdit(index, timoria)">
      {{ $t('buttons.edit') }}
    </button>
    <button v-else class="save-btn" @click="saveEdit(timoria._id)">
      {{ $t('buttons.save') }}
    </button>
  </div>


</div>

<!-- UNDO BUTTON BLOCK -->
 <!-- When deleting a timoria, we add it to the undoStack. 
  Then if the stack length is bigger than 0, the undo button become visible -->
<transition name="slide-fade">
  <button
    v-if="undoStack.length"
    class="undo-btn"
    @click="undoDelete"
  >
    {{ $t('buttons.undo') || 'Undo Delete' }}
  </button>
</transition>

    
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
    <!-- UNDO BUTTON BLOCK -->
    <transition name="slide-fade">
    <button
        v-if="undoStack.length"
        class="undo-btn"
        @click="undoDelete"
    >
        {{ $t('buttons.undo') || 'Undo Delete' }}
    </button>
    </transition>

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
import Timer from '../components/Timer'

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
            todayTimorias: [],
            undoStack: [],
            editIndex: null,
            editForm: {
                subject: '',
                topic: '',
                tag: '',
                task: '',
                duration: '',
            }
        }
    },
    components: {
        Timer
    },
    mounted() {
        console.log('Locale:', this.$i18n.locale)
        console.log('t(timer.title):', this.$t('timer.title'))
        console.log('Available messages:', this.$i18n.messages)
        this.getTimorias()
        this.getTodaysTimorias()
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
                this.getTodaysTimorias() // update the list or today's timorias right after deleting a  Timoria
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
                    this.getTodaysTimorias() // update the list or today's timorias right after undoing a  Timoria
                } catch (err) {
                    console.error('Error restoring timoria:', err)
                }
            }
        },
        async getTodaysTimorias() {
            try {
                const res = await fetch(`${this.url}`)
                const data = await res.json()
                this.todayTimorias = data
            } catch (err) {
                console.error('Failed to fetch today\'s timorias:', err)
            }
        },

        enableEdit(index, timoria) {
            this.editIndex = index
            this.editForm = { ...timoria }

        },

        async saveEdit(id) {
            try {
                const res = await fetch(`${this.url}/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.editForm)
                })

                const updated = await res.json()
                this.todayTimorias.splice(this.editIndex, 1, updated)
                this.editIndex = null
            } catch (err) {
                console.error('Update failed:', err)
            }
        },

    }
}
</script>
<style src="../assets/styles/main.css"></style>