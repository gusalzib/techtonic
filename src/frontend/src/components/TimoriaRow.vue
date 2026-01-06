<template>
  <tr>
    <td v-if="!isEditing">
    {{ formatDate(form.finishedAt) }}
    </td>

    <td v-else>
    <input type="date" v-model="formDate" />
    <input type="time" v-model="formTime" />
    </td>


    <td v-if="!isEditing">{{ form.task || '—' }}</td>
    <td v-else><input v-model="form.task" /></td>

    <td v-if="!isEditing">{{ form.duration }} min</td>
    <td v-else><input type="number" v-model.number="form.duration" /></td>

    <td v-if="!isEditing">{{ form.subject }}</td>
    <td v-else><input v-model="form.subject" /></td>

    <td v-if="!isEditing">{{ form.topic }}</td>
    <td v-else><input v-model="form.topic" /></td>

    <td v-if="!isEditing">{{ form.tag || '—' }}</td>
    <td v-else><input v-model="form.tag" /></td>

    <td v-if="!isEditing">{{ form.status }}</td>
    <td v-else>
    <!-- Use a select dropdown to limit choices -->
    <select v-model="form.status" class="status-select">
        <option value="planned">{{ $t('status.planned') || 'Planned' }}</option>
        <option value="ongoing">{{ $t('status.ongoing') || 'Ongoing' }}</option>
        <option value="done">{{ $t('status.done') || 'Done' }}</option>
    </select>
    </td>
    <td>
      <button class="summary-table-action-btn" v-if="!isEditing" @click="startEdit">✏️</button>
      <button class="summary-table-action-btn" v-else @click="save">💾</button>
      <button class="summary-table-action-btn" @click="onDeleteClick">🗑️</button>
      <button class="delete-btn" v-if="isEditing" @click="cancel">✖</button>
    </td>
  </tr>
</template>

<script>
import { useToast } from 'vue-toastification'
import axios from 'axios' // for http POST/PUT/DELETE requests
import { API_BASE_URL } from '@/config/api';
import { confirm as appConfirm } from '@/services/confirmService' // import the confirm function


export default {
    name: 'TimoriaRow',
    props: {
    rowTimoria: { type: Object, required: true }
    },

    data() {
        return {

            // backend API endpoint for Timoria CRUD operations
            url: `${API_BASE_URL}/timoria`,


            isEditing: false,
            form: { ...this.rowTimoria },


            toast: null, // will be set in mounted()


        }
    },
    computed: {
        formDate: {
            get() {
                return this.form.finishedAt?.slice(0, 10)
            },
            set(val) {
                this.updateFinishedAt(val, this.formTime)
            }
        },
        formTime: {
            get() {
                return this.form.finishedAt?.slice(11, 16)
            },
            set(val) {
                this.updateFinishedAt(this.formDate, val)
            }
        }
    },
    mounted() {

        this.toast = useToast()

    },

    methods: {
        updateFinishedAt(date, time) {
            if (!date || !time) return

            const iso = `${date}T${time}:00.000Z`
            this.form.finishedAt = iso

            // keep createdAt in sync (date only)
            const createdTime = this.form.createdAt
                ? this.form.createdAt.slice(11, 19)
                : '00:00:00'

            this.form.createdAt = `${date}T${createdTime}.000Z`
        },
        async save() {
            try {
                await axios.put(`${this.url}/${this.form._id}`, this.form)

                this.isEditing = false
                this.$emit('updated')

                this.toast?.success(
                this.$t('notification.updateSuccessful') || 'Updated successfully'
                )
            } catch (err) {
                console.error('Failed to update timoria:', err)

                this.toast?.error(
                this.$t('notification.failedUpdate') || 'Failed to update Timoria'
                )
            }
        },
        formatDate(date) {
            return date ? new Date(date).toLocaleDateString() : '—'
        },
        startEdit() {
            this.isEditing = true
        },

        cancel() {
            this.isEditing = false
            this.form = { ...this.rowTimoria } // reset changes
        },

        async onDeleteClick() {
            /**
             * This function only needs to tell its parent (TimoriaSummary) that the user wants to emit this 
             * timoria with this ID. The parent TimoriaSummary then emits this event further to its parent Timoria.vue
             * 
             * Timoria.vue is the source of truth and it is the one that should be making the delete request to the backend
             * and updates the Today's timorias table. 
             * 
             * So this function is effectively saying: “Hey parent, the user wants this timoria gone.”
             */
            this.$emit('delete', this.form._id)
        },
    }
}
</script>