<template>

  <!-- In-page header to switch views -->
  <header class="timoria-view-switcher">
    <button
      :class="['view-tab', { active: activeView === 'timer' }]"
      @click="activeView = 'timer'"
    >
      ⏱ {{ $t('views.timer') || 'Timer' }}
    </button>
    <button
      :class="['view-tab', { active: activeView === 'summary' }]"
      @click="activeView = 'summary'"
    >
      📊 {{ $t('views.summary') || 'Summary' }}
    </button>
  </header>


<div v-show="activeView === 'timer'">
<!-- Timer Section -->
<Timer :timoria="activeTimoria" :key="activeTimoria?._id" 
    :break-duration-minutes="breakDurationMinutes"
    @completed="handleCompletedTimoria" 
    @cancelTimer="handleCancelTimer"
    @update:timoria="updateTimoria"
    @updatePlannedTimorias="handleUpdatePlannedTimorias"
    @finishTimer="handleFinishTimer"
    @updateTodaysTimorias="handleUpdateTodaysTimorias"
    @break-finished="handleBreakFinished"
    />

      <div class="break-settings">
        <label>
          💤 {{ $t('table.breakLength') }}:
          <input
            id="break-length-input"
            type="number"
            min="1"
            max="60"
            v-model.number="breakDurationMinutes"
          />
        </label>
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
        <th>{{ $t('table.finishedAt') }}</th>    
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
            <div>{{ transformDate(timoria.finishedAt)[0] }}</div>
            <br>
            <!-- transform date returns a time string that looks something like this 08:05:52.795Z. getHourMinute cleans that up and displays in the HH:MM format-->
            <div>{{ transformDate(timoria.finishedAt)[1] }}</div>
        </td>



        <td>
        <button class="timoria-actions-btn" @click="createTimoriaCopy(timoria)">🗍 {{ $t('buttons.copy') || 'Copy' }}</button> 
        <button class="timoria-actions-btn" v-if="editIndex !== index" @click="enableEdit(index, timoria)">
            ✏️ {{ $t('buttons.edit') || 'Edit' }}
        </button>
        <button class="timoria-actions-btn" v-else @click="saveEdit(timoria._id)">💾 {{ $t('buttons.save') || 'Save' }}</button>
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
    <!-- Add a separating line between buttons and the rest of text -->
    <hr> 
    <div class="card-actions">
        
        <button class="delete-btn" @click="deleteTimoria(timoria._id)">
        {{ $t('buttons.delete') }}
        </button>
        <button class="save-btn" @click="createTimoriaCopy(timoria)">🗍 {{ $t('buttons.copy') || 'Copy' }}</button> 
        <button v-if="editIndex !== index" class="save-btn" @click="enableEdit(index, timoria)">
        {{ $t('buttons.edit') }}
        </button>
        <button v-else class="save-btn" @click="saveEdit(timoria._id)">
        {{ $t('buttons.save') }}
        </button>
    </div>



    </div>
    <p class="total-time">
    🧮 {{ $t('todayPomos.total') }}: {{ totalTodayDuration }}
    | {{ $t('todayPomos.numberOfTodaysTimorias') }}: {{ numberOfTodaysTimorias }}
    | {{ $t('todayPomos.averageDurationPerTodaysTimorias') }}: {{ averageDurationPerTodaysTimorias }}
    </p>
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
  <h2>{{ $t('planned.title') }} <i v-tooltip="$t('tooltip.form.structure')" class="bi bi-exclamation-circle"></i></h2>

  <form novalidate>
    
    <input v-model.number="duration" type="number" class="timer-input" :placeholder="$t('timer.minutesPlaceholder')" required/>

    <!-- ----------------------------------- SUBJECT MOBILE SELECT VIEW  ------------------------------------->
    <!-- if the user is logged in from a mobile then we display a select tag  -->
    <template v-if="isMobile">
    <div class="autocomplete-wrapper">
        <input
        v-tooltip="$t('tooltip.form.subject')"
        v-model="subject"
        type="text"
        class="timer-input"
        :placeholder="$t('timer.subjectPlaceholder')"
        required
        @focus="onSubjectFocus"
        @input="showSubjectDropdown = true"
        @blur="onSubjectBlur"
        autocomplete="off"
        />

        <ul
        v-if="showSubjectDropdown && filteredSubjects.length"
        class="autocomplete-list"
        >
        <li
            v-for="s in filteredSubjects"
            :key="s"
            @mousedown.prevent="selectSubject(s)"
        >
            {{ s }}
        </li>
        </ul>
    </div>
    </template>

     <!-- ----------------------------------- SUBJECT DESKTOP DATALIST VIEW  ------------------------------------->
    <!-- else we display a datalist tag-->
     <template v-else>
        <input v-tooltip="$t('tooltip.form.subject')" v-model="subject" type="text" class="timer-input" list="subjectList" :placeholder="$t('timer.subjectPlaceholder')" required/>
        <datalist id="subjectList">
            <!-- 's' stands for subject. this is to avoid mixing up with the word subject that appears in the line before in v-model -->
            <option v-for="s in userSubjects" :key="s" :value="s"></option>
        </datalist>
     </template>

      <!-- ----------------------------------- TOPIC MOBILE SELECT VIEW  ------------------------------------->
     <template v-if="isMobile">
        <div class="autocomplete-wrapper">
            <input
            v-tooltip="$t('tooltip.form.topic')"
            v-model="topic"
            type="text"
            class="timer-input"
            :placeholder="$t('timer.topicPlaceholder')"
            required
            @focus="onTopicFocus"
            @input="showTopicDropdown = true"
            @blur="onTopicBlur"
            autocomplete="off"
            />

            <ul
            v-if="showTopicDropdown && filteredTopics.length"
            class="autocomplete-list"
            >
            <li
                v-for="t in filteredTopics"
                :key="t"
                @mousedown.prevent="selectTopic(t)"
            >
                {{ t }}
            </li>
            </ul>
        </div>
     </template>

     <!-- ----------------------------------- TOPIC DESKTOP DATALIST VIEW  ------------------------------------->
     <template v-else>
        <input v-tooltip="$t('tooltip.form.topic')" v-model="topic" type="text" class="timer-input" list="topicList" :placeholder="$t('timer.topicPlaceholder')" required/>
        <datalist id="topicList">
            <option v-for="t in userTopics" :key="t" :value="t"></option>
        </datalist>
     </template>

     <!-- ----------------------------------- TAG MOBILE SELECT VIEW  ------------------------------------->
     <template v-if="isMobile">
        <div class="autocomplete-wrapper">
            <input
            v-tooltip="$t('tooltip.form.tag')"
            v-model="tag"
            type="text"
            class="timer-input"
            :placeholder="$t('timer.tagPlaceholder')"
            required
            @focus="onTagFocus"
            @input="showTagDropdown = true"
            @blur="onTagBlur"
            autocomplete="off"
            />

            <ul
            v-if="showTagDropdown && filteredTags.length"
            class="autocomplete-list"
            >
            <li
                v-for="tag in filteredTags"
                :key="tag"
                @mousedown.prevent="selectTag(tag)"
            >
                {{ tag }}
            </li>
            </ul>
        </div>
     </template>
     <!-- ----------------------------------- TAG DESKTOP DATALIST VIEW  ------------------------------------->
      <template v-else>
        <input v-tooltip="$t('tooltip.form.tag')" v-model="tag" type="text" class="timer-input" list="tagList" :placeholder="$t('timer.tagPlaceholder')" />
        <datalist id="tagList">
            <option v-for="tg in userTags" :key="tg" :value="tg"></option>
        </datalist>
      </template>


    <input v-tooltip="$t('tooltip.form.task')" v-model="task" type="text" class="timer-input" :placeholder="$t('timer.taskPlaceholder')" />
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
        <span class="timoria-duration">{{ transformDate(timoria.createdAt)[0] }} - {{ transformDate(timoria.createdAt)[1] }}</span>
        </div>
        <div class="timoria-actions">
        <button class="start-btn" @click="startTimoria(timoria)">
        {{ $t('buttons.start') }}
        </button>
        <button class="start-btn" @click="createTimoriaCopy(timoria)">🗍 {{ $t('buttons.copy') || 'Copy' }}</button> 
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



</div>
<!-- ref="summaryTable" im the <TimoriaSummary> tag. This gives the parent a direct handle to the child component.
    It allows me to tell the child directly to refresh when I delete a timoria here -->
<div v-if="activeView === 'summary'">
    <TimoriaSummary
        ref="summaryTable"
        @delete-timoria="deleteTimoria"
    />
</div>

    <p class="about-copyright">
    {{ $t('about.footer.copyright') }}
    </p>
</template>


<script>
// @ is an alias to /src
import axios from 'axios' // for http POST/PUT/DELETE requests
import Timer from '../components/Timer' // timer component that runs countdowns
import TimoriaSummary from '../components/TimoriaSummary';
import dingSound from '@/assets/audio/ding.mp3' // sound to play when timoria ends
import { confirm as appConfirm } from '@/services/confirmService' // import the confirm function
import { useToast } from 'vue-toastification'
import { useUserStore } from '@/stores/userStore';
import { DateTime } from 'luxon';
import { transformDateWithTimezone } from '@/utils/datetime';
import { API_BASE_URL } from '@/config/api';

export default {
    name: 'Timoria',
    /**
     * --------------------------------------------------------
     *                  DATA SECTION
     * --------------------------------------------------------
     * Holds all reactive state variables for this page/view
     * Vue automatically makes these reactive and binds them to the template
     */
    data() {
        return {
            // fields bound to the form inputs for creating a new Timoria (study sessions)
            subject: '',
            topic: '',
            tag: '',
            task: '',
            duration: null,
            breakDurationMinutes: 5, // default 5 minutes

            activeView: 'timer',

            // backend API endpoint for Timoria CRUD operations
            url: `${API_BASE_URL}/timoria`,

            // arrays holding current Timorias in different categories
            plannedTimorias: [],
            todayTimorias: [],
            undoStack: [],

            // inline editing state
            editIndex: null,
            editForm: {
                subject: '',
                topic: '',
                tag: '',
                task: '',
                duration: '',
            },

            // timer control state
            activeTimoria: null,
            activeBreak: false,

            // placeholders for currently updated Timoria (used when syncing updates)
            timoria: {
                subject: '',
                topic: '',
                tag: '',
                task: '',
                duration: '',
            },

            toast: null, // will be set in mounted()

            // dropdown & type-ahead lists 
            userSubjects: [],
            userTopics: [],
            userTags: [],

            isMobile: false, // assuming the user is logged it from a desktop first
            showSubjectDropdown: false,
            showTopicDropdown: false,
            showTagDropdown: false,

        }
    },
    watch: {
        breakDurationMinutes(val) {
            localStorage.setItem('breakDuration', val);
        }
    },
    /**
     * --------------------------------------------------------
     *                        COMPONENTS
     * --------------------------------------------------------
     * Registers the imported Timer component for local use
     * 
     */
    components: {
        Timer,
        TimoriaSummary
    },
    /**
     * --------------------------------------------------------
     *                      COMPUTED PROPERTIES 
     * --------------------------------------------------------
     * Computed properties are reactive values derived from data
     * They automatically update/re-calculate when their dependencies change
     */
    computed: {
        totalTodayDuration() {
            const totalMinutes = this.todayTimorias.reduce((sum, t) => sum + Number(t.duration || 0), 0)
            const hours = Math.floor(totalMinutes / 60)
            const minutes = totalMinutes % 60
            return `${hours} ${this.$t('timer.hours')} ${minutes} ${this.$t('timer.minutes')}`
        },
        numberOfTodaysTimorias() {
            const totalCount = this.todayTimorias.length
            return totalCount
        },
        averageDurationPerTodaysTimorias() {
            if (this.todayTimorias.length === 0) {
                return `0 ${this.$t('timer.hours')} 0 ${this.$t('timer.minutes')}`
            }
            const totalMinutes = this.todayTimorias.reduce((sum, t) => sum + Number(t.duration || 0), 0)
            const average = totalMinutes / this.todayTimorias.length
            const hours = Math.floor(average / 60)
            const minutes = average % 60
            return `${hours} ${this.$t('timer.hours')} ${minutes.toFixed(1)} ${this.$t('timer.minutes')}`
        },
        filteredSubjects() {
            if (!this.subject) return this.userSubjects;
            const term = this.subject.toLowerCase();
            return this.userSubjects.filter(s =>
            s.toLowerCase().includes(term)
            );
        },
        filteredTopics() {
            if (!this.topic) return this.userTopics;
            const term = this.topic.toLowerCase();
            return this.userTopics.filter(t =>
            t.toLowerCase().includes(term)
            );
        },
        filteredTags() {
            if (!this.tag) return this.userTags;
            const term = this.tag.toLowerCase();
            return this.userTags.filter(tag =>
            tag.toLowerCase().includes(term)
            );
        }
    },

    /**
     * --------------------------------------------------------
     *                        LIFECYCLE HOOKS
     * --------------------------------------------------------
     * Vue lifecycle hooks allow you to run code at specific stages
     * of the component's lifecycle (creation, mounting, updating, etc.)
     * When the component mounts, fetch the initial data from the server
     */
    mounted() {
        const token = localStorage.getItem('token');
        if (!token) {
            this.$router.push('/login');
            return;
        }


        this.getPlannedTimorias()
        this.getTodaysTimorias()

        this.toast = useToast()

        this.getDistinctLists();

        /* The datalist html tag is not supported by many mobile browsers so we need to identify whether the user is 
            logged in from a mobile phone in order to display a select tag instead of datalists */
        // Super simple mobile detection – good enough for this UX choice
        this.isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    },
    /**
     * --------------------------------------------------------
     *                        METHODS
     * --------------------------------------------------------
     * Methods are functions that can be called from the template
     * or other parts of the component to perform actions
     */
    methods: {

        /**
         * --------------------------------------------------------------------------------
         *                              MOBILE SELECT FUNCTIONS
         * --------------------------------------------------------------------------------
         * I ran into the problem where the datalist did not work on mobile view simply
         * because datalists are not supported on mobile. So I had create two views. I kept 
         * the datalists for desktop and implemented dynamic select blocks for mobile. 
         * However, to populate these blocks dynamically while keeping the option of free 
         * text, I needed a bunch of helper functions. 
         * 
         * One function for when the user makes the selection: selectSubject(option). It closes the dropdown
         * Another to open the dropdown when the select blcok is clicked/touched onSubjectFocus()
         * Then onSubjectBlur() to allow some timeout before closing to allow the selection to be captured
         * 
         * @param option 
        */
        // SUBJECT SELECTION FUNCTIONS
        selectSubject(option) {
            this.subject = option;
            this.showSubjectDropdown = false;
        },
        onSubjectFocus() {
            this.showSubjectDropdown = true;
        },
        onSubjectBlur() {
            // tiny timeout so click can register before hiding
            setTimeout(() => {
            this.showSubjectDropdown = false;
            }, 150);
        },
        // TOPIC SELECTION FUNCTIONS
        selectTopic(option) {
            this.topic = option;
            this.showTopicDropdown = false;
        },
        onTopicFocus() {
            this.showTopicDropdown = true;
        },
        onTopicBlur() {
            // tiny timeout so click can register before hiding
            setTimeout(() => {
            this.showTopicDropdown = false;
            }, 150);
        },
        // TAG SELECTION FUNCTIONS
        selectTag(option) {
            this.tag = option;
            this.showTagDropdown = false;
        },
        onTagFocus() {
            this.showTagDropdown = true;
        },
        onTagBlur() {
            // tiny timeout so click can register before hiding
            setTimeout(() => {
            this.showTagDropdown = false;
            }, 150);
        },



        transformDate(date) {
            // if no date, return empty strings
            if (!date) {
                return ['_', '_']
            }

            const userStore = useUserStore();
            const userTz = userStore.timezone || 'Europe/Stockholm'            

            // this part works but I refactored this code to { transformDateWithTimezone } from '@/utils/datetime'
            // const dt = typeof date === 'string'
            //     ? DateTime.fromISO(date, { zone: 'utc' }).setZone(userTz)
            //     : DateTime.fromJSDate(date).setZone(userTz);

            // const day  = dt.toFormat('yyyy-LL-dd'); // 2025-12-01
            // const time = dt.toFormat('HH:mm');      // 17:52


            return transformDateWithTimezone(date, userTz);
        },
        getHourMinute(timeString) {
            if (!timeString) {
                return '';
            }

            const [hours, minutes] = timeString.split(':');

            return `${hours}:${minutes}`
        },
        // create a new Timoria (study session) by sending a POST request to the backend
        async createTimoria() {
            try {
                const payload = {
                    subject: this.subject,
                    topic: this.topic,
                    tag: this.tag,
                    task: this.task,
                    duration: this.duration,
                    status: 'planned' 
                }
                const token = localStorage.getItem('token');
                const response = await axios.post(`${this.url}`, payload, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                // the alert is not needed for when timoria is created successfully
                // we can replace it with a toast notification 
                // alert('Timoria saved successfully');
                // console.log('Saved: ', response.data);
                /**
                 * If this.$toast is defined, then call success().
                 * If it’s undefined or null, just do nothing.
                 * 
                 * The ? is a safety net to avoid runtime errors in case
                 * the toast plugin isn’t properly installed or available.
                 */  
                this.toast && this.toast.success(this.$t('notification.timoriaSaved') || 'Timoria saved successfully')

                // reset form and refresh the planned Timorias list
                this.subject = '';
                this.topic = '';
                this.tag = '';
                this.task = '';
                this.duration = '';

                this.getPlannedTimorias() // update the list right after adding the Timoria

            } catch (error) {

                this.toast && this.toast.error(this.$t('notification.timoriaSaveFailed') || 'Failed to save Timoria.');
                //console.log('Error: ', error.message);
                // alert('Failed to save Timoria.');

            }
        },

        async createTimoriaCopy(timoria) {
            try {
                const payload = {
                    subject: timoria.subject,
                    topic: timoria.topic,
                    tag: timoria.tag,
                    task: timoria.task,
                    duration: timoria.duration,
                    status: 'planned' 
                }
                const token = localStorage.getItem('token');
                const response = await axios.post(`${this.url}`, payload, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                this.toast && this.toast.success(this.$t('notification.timoriaSaved') || 'Timoria saved successfully')

                // reset form and refresh the planned Timorias list
                this.subject = '';
                this.topic = '';
                this.tag = '';
                this.task = '';
                this.duration = '';

                this.getPlannedTimorias() // update the list right after adding the Timoria

            } catch (error) {

                this.toast && this.toast.error(this.$t('notification.timoriaSaveFailed') || 'Failed to save Timoria.');
            }

            
        },

        // get all planned Timorias from the backend
        async getPlannedTimorias() {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${this.url}?status=planned`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })

                const data = await response.json()

                this.plannedTimorias = data;
            } catch (error) {
                // console.error('Failed to fetch Timorias:', error)
                // alert('Failed to get planned Timorias.')
                this.toast && this.toast.error(this.$t('notification.failedPlannedTimoria') || 'Failed to get planned Timorias.');

            }
        },

        // delete a Timoria by its ID (either planned or today's). Adds to undo stack for recovery
        async deleteTimoria(id) {            
            /**
             * Replacing the alert with a more user-friendly modal notification
             * using the ConfirmHost component and confirmStore.
             * This provides a better UX by avoiding disruptive alert pop-ups.
             */
            const ok = await appConfirm({
                title: this.$t('modal.confirmDeleteTitle') || 'Delete Timoria?',
                message: this.$t('modal.confirmDeleteMessage') || 'Delete Timoria?',
                confirmText: this.$t('modal.confirm') || 'Delete Timoria?',
                cancelText: this.$t('modal.cancel') || 'Cancel',

            })
            if (!ok) return


            // Find the timoria you're about to delete. this is useful for the undo feature. we need to get the element before deleting it
            const toDelete = this.plannedTimorias.find(t => t._id === id) || this.todayTimorias.find(t => t._id === id)

            try {
                await fetch(`${this.url}/${id}`, {
                    method: 'DELETE'
                })
                this.plannedTimorias = this.plannedTimorias.filter(t => t._id !== id)

                // Push the deleted timoria to undoStack. this where we are going to get it from in case we need ti undo
                this.undoStack.push(toDelete)

                this.getPlannedTimorias() // update the list right after deleting the Timoria
                this.getTodaysTimorias() // update the list or today's timorias right after deleting a  Timoria

                // we trigger the child fetchTimorias logic so that it updates its UI after a deletion event
                if (this.$refs.summaryTable) {
                    this.$refs.summaryTable.fetchTimorias();
                }
                // notify the user that the deletion was successfull
                this.toast && this.toast.success(this.$t('notification.deletedSuccessfully') || 'Timoria deleted successfully');

            } catch (err) {

                this.toast && this.toast.error(this.$t('notification.failedDelete') || 'Failed to delete Timoria.');
                //console.error('Error deleting timoria:', err)
            }


        },

        // restore the last deleted Timoria (undo delete)
        async undoDelete() {
            const lastDeleted = this.undoStack.pop()
            if (lastDeleted) {
                try {
                    const token = localStorage.getItem('token');
                    const res = await axios.post(`${this.url}`, lastDeleted, {
                        headers: token ? { Authorization: `Bearer ${token}` } : {}
                    });
                    this.plannedTimorias.unshift(res.data)
                    this.getPlannedTimorias() // update the list right after undoing the Timoria
                    this.getTodaysTimorias() // update the list or today's timorias right after undoing a  Timoria
                } catch (err) {

                    this.toast && this.toast.error(this.$t('notification.failedToUndo') || 'Failed to undo action.');
                    //console.error('Error restoring timoria:', err)
                }
            }
        },

        // get today's Timorias from the backend (for the summary table)
        async getTodaysTimorias() {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${this.url}/today`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });
                if (!res.ok) throw new Error('HTTP ' + res.status);
                const data = await res.json()
                this.todayTimorias = data
            } catch (err) {
                this.toast && this.toast.error(this.$t('notification.failedTodayTimorias') || 'Failed to fetch today\'s timorias.');
                //console.error('Failed to fetch today\'s timorias:', err)
            }
        },

        // enable inline editing for a specific Timoria
        enableEdit(index, timoria) {
            this.editIndex = index
            this.editForm = { ...timoria } // populate form with existing data, so that the user can then change this data if they want to

        },

        // save the edited Timoria by sending a PUT request to the backend
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
                this.toast && this.toast.error(this.$t('notification.failedUpdate') || 'Failed to update Timoria.');
                //console.error('Update failed:', err)
            }
        },
        // start a Timoria (study session) by setting it as active and updating its status in the backend
        async startTimoria(timoria) {
            /**
             * The timer does NOT know that a timoria has been started because of localStorage
             * The timer knows because Vue reactivity propagates activeTimoria from the parent to the child as a prop.
             * LocalStorage is persistence, not communication.
             */
            this.activeTimoria = { ...timoria }


            try {
                //  mark it as 'ongoing' in the DB
                const response = await fetch(`${this.url}/${timoria._id}`, {
                    method: 'PUT',
                    headers: { 
                    'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: 'ongoing' })
                }) 

                if (!response.ok) {
                    throw new Error('Failed to start Timoria.') // this will be caught in the catch block below
                }
            } catch(err) {
                this.toast && this.toast.error(this.$t('notification.startFailed') || 'Failed to start Timoria.')
            }

            this.getPlannedTimorias()
        },

        // handle event from timer when a Timoria is completed. This for when the user
        // clicks on the Finish button while the timer is running
        handleCompletedTimoria(id) {
            this.activeTimoria = null
            // start a break right after the timer finishes
            this.startBreak()
            this.getPlannedTimorias()
            this.getTodaysTimorias()
        },

        // cancel current timer -- reset active Timoria and refresh planned list
        handleCancelTimer() {
            // Reset the active Timoria or update UI as necessary
            this.activeTimoria = null;
            this.activeBreak = false;
            // Wait for Vue to update the DOM
            this.$nextTick(() => {
                // Now, fetch the latest planned timorias from the server
                this.getPlannedTimorias();
            });
        },

        // finish timer normally and start break 
        handleFinishTimer() {
            // Reset the active Timoria or update UI as necessary
            this.activeTimoria = null;

            this.activeBreak = false;
            // start a break right after the timer finishes
            this.startBreak();
            // Wait for Vue to update the DOM
            this.$nextTick(() => {
                // Now, fetch the latest planned timorias from the server
                this.getPlannedTimorias();
            });
        },

        // receive updated Timoria from child Timer component
        updateTimoria(updatedTimoria) {
            //console.log('Updated Timoria received in parent:', updatedTimoria);

            this.timoria = updatedTimoria;

        },

        // refresh planned Timorias list when notified by child Timer component
        handleUpdatePlannedTimorias() {
            this.getPlannedTimorias();
        },

        // refresh today's Timorias list when notified by child Timer component
        handleUpdateTodaysTimorias() {
            this.getTodaysTimorias();
        },

        // start a break period after completing a Timoria
        startBreak() {
            // const breakDuration = 10;  // in minutes, set to 1 for testing purposes
            if (!this.activeBreak) {
                this.activeBreak = true;
                this.activeTimoria = {
                    subject: 'Break',
                    topic: 'Break',
                    tag: 'Break',
                    task: 'Take a short break',
                    duration: this.breakDurationMinutes,
                    _id: 'break',
                    type: 'break'
                }
            }


            
            //console.log('Break started:', this.activeTimoria);
        },

        // Called when the break timer finishes. Triggers browser notification and sound
        handleBreakFinished() {
            this.activeBreak = false;
            // Push browser notification
            if ("Notification" in window) {
                if (Notification.permission === "granted") {
                    new Notification("⏰ Break's over!", {
                        body: "Time to get back to your Timoria!",
                        icon: "/favicon.png" // Optional icon path
                    });
                } else if (Notification.permission !== "denied") {
                    Notification.requestPermission().then(permission => {
                        if (permission === "granted") {
                            new Notification("⏰ Break's over!", {
                                body: "Time to get back to your Timoria!",
                                icon: "/favicon.png"
                            });
                        }
                    });
                }
            }

            // Play notification sound
            // this.playTimoriaSound();


            // Optionally, update state or reset break status here
            // this.isOnBreak = false;
        },

        // play a sound notification when a Timoria or break ends
        playTimoriaSound() {
            const audio = new Audio(dingSound)
            audio.play()
        },
        async getDistinctLists() {

        try {
            const token = localStorage.getItem('token'); // because the path requires authentication
            const response = await axios.get(`${this.url}/taxonomy`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            if (response.status === 200) {
                    
                    this.userSubjects = response.data.subjects;
                    this.userTopics = response.data.topics;
                    this.userTags = response.data.tags;
                    
                } else {
                    this.toast && this.toast.error(this.$t('notification.failedUserListsLoading') || 'Failed to load user lists.')
                }
            } catch (error) {
                this.toast && this.toast.error(this.$t('notification.failedUserListsLoading') || 'Failed to load user lists.')
            }
        }
    },
    getSubjects() {
        document.getElementById("subject").classList.toggle("show");

        window.onclick = function (event) {
            if (!event.target.matches('.subject-dropdown')) {
                var dropdowns = document.getElementsByClassName("subject-dropdown");
                var i; 

                for (i = 0; i < dropdowns.length; i++) {
                    const openDropdown = dropdowns[i];

                    if (openDropdown.classList.contains('show')) {
                        openDropdown.classList.remove('show')
                    }
                    
                }
            }
        }

    },

}
    
</script>
<style src="../assets/styles/main.css"></style>