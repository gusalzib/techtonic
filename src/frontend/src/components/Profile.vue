<template>
    <div class="profile" id="edit-profile" v-if="activeSection === 'profile'">
        <h3>{{ $t('profile.editProfile') }}</h3>

            <label>{{ $t('labels.timezone') }} <i v-tooltip="$t('tooltip.timezoneTooltip')" class="bi bi-exclamation-circle"></i></label>
            
            <select v-model="form.timezone" id="timezone-select">
                <option value="" disabled>{{ $t('labels.selectTimezone') }}</option>
                <option :value="tz.id" v-for="tz in timezones" :key="tz.id">
                    {{ tz.name }}
                </option>
            </select>
            <!-- <input v-model="form.timezone" type="text" id="timezone" required/> -->
            <br>
            <label>{{ $t('labels.username') }}</label>
            <input v-model="form.username" type="text" id="name" required/>
            <br>
            <label>{{ $t('labels.email') }}</label>
            <input v-model="form.email" type="email" id="email" required/>
            <br>
            <label>{{ $t('labels.password') }}</label>
            <input v-model="form.password" type="password" id="password" required/>
            <div class="show-password-box">
                <label>{{ $t('labels.ShowPassword') }}</label>
                <input id="checkbox" type="checkbox" v-on:click="toggle()">
            </div>

            <hr>
            <br>
            <label>{{ $t('labels.role') }}: <em>{{ form.role }}</em></label>
            <br>
            <label>{{ $t('labels.accountCreatedAt') }}: <em>{{ form.createdAt }}</em></label>
            <br>
            <label>{{ $t('labels.currentTimezone') }}: <em>{{ form.timezone }}</em></label>

            <GenerateReportButton />
            <button id="update-button" class="submit-button" v-on:click="updateUserInfo()" type="button">{{ $t('profile.updateInfo') }}</button>
    </div>
</template>

<script>
import axios from 'axios';
import { useToast } from 'vue-toastification';
import { DateTime, Settings, Info } from 'luxon';
import { useUserStore } from '@/stores/userStore';
import { API_BASE_URL } from '@/config/api';
import GenerateReportButton from './GenerateReportButton.vue';

export default {
    name: 'Profile',
    components: {
        GenerateReportButton
    },
    data() {
        return {
            form: {
                email: '',
                password: '',
                username: '',
                role: '',
                createdAt: '',
                timezone: ''
            },
            timezones: [],
            url: `${API_BASE_URL}/users`,
            toast: null, // declare a toast variable to be used with toastification library for notifications
            timeout: 2000, 
            activeSection: 'profile', //this controls which section in visible to the user at any time. I set it to the profile page as default


        }
    },
    mounted() {
        this.toast = useToast(); // initiate a toast variable
        this.getUserInfo() // we get the user info as soon as the page is loaded
        this.populateTimezones();
    },
    methods: {
        async getUserInfo() {

            try {

                //get info of the logged in user using their ID
                const response = await axios.get(
                    `${this.url}/profile`,
                    {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    }
                )
                // if server returns 200, then we populate the form data
                if (response.status === 200) {
                    this.form = response.data.user;

                    // triming the the date string to get only the date without the timestamp that follows
                    let temp = this.form.createdAt.split('T')
                    this.form.createdAt = temp[0]

                }
            } catch (error) {
                // if status is 401 then the request was not authorized meaning that it is likely that the user session is expired
                if (error.response?.status === 401) {
                    this.toast && this.toast.error(this.$t('notification.sessionExpired') || 'User session expired')

                    // automatically send the user to login page
                    setTimeout(() => {
                        this.$router.push('/login')
                    }, this.timeout)
                } else {
                    console.log(error.message);
                    
                    // we show a localized notification and if we fail to get that, we have the fallback english string
                    this.toast && this.toast.error(this.$t('notification.failedToLoadUserInfo') || 'Failed to load user data')

                }

            }

        },
        populateTimezones() {

            let allZoneIds = [];

            // Try to get all supported timezones from the browser
            if (typeof Intl !== 'undefined' && Intl.supportedValuesOf) {
                try {
                allZoneIds = Intl.supportedValuesOf('timeZone');
                } catch (e) {
                console.error('Intl.supportedValuesOf(timeZone) failed:', e);
                }
            }

            // Fallback if the environment doesn’t support that API
            if (!allZoneIds || allZoneIds.length === 0) {
                console.error('Could not get list of timezones, using minimal fallback.');
                allZoneIds = [
                'Europe/Stockholm',
                'Europe/London',
                'America/New_York',
                'Asia/Tokyo',
                ];
            }

            // Map into the structured array with nice labels
            this.timezones = allZoneIds
                .map(zoneId => {
                const dt = DateTime.now().setZone(zoneId);
                const offset = dt.toFormat('ZZZZ'); // e.g. GMT+1
                const displayLabel = `(${offset}) ${zoneId}`;
                return {
                    id: zoneId,
                    name: displayLabel,
                    offset: dt.offset,
                };
                })
                .sort((a, b) => a.offset - b.offset);

            // Set default to current browser timezone if nothing chosen yet
            if (!this.form.timezone) {
                this.form.timezone = DateTime.local().zoneName;
            }

        },
        async updateUserInfo() {
            try {

                // put request to update the user info if the user makes any changes
                const response = await axios.put(
                `${this.url}/profile`,
                this.form,
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }
                );

                if (response.status === 200) {

                    // refresh the user info displayed 
                    this.getUserInfo()
                    
                    // Update the user store so UI reacts immediately
                    const userStore = useUserStore();
                    // if backend returns user with timezone, prefer that
                    const updatedUser = response.data.user || this.form;
                    userStore.timezone = updatedUser.timezone || userStore.timezone;
                    

                    // display notification
                    this.toast && this.toast.success(this.$t('notification.updateSuccessful') || 'Updated successfully');

                }


            } catch (error) {
                // we may detect upon a put request that the session is xpired
                if (error.response?.status === 401) {

                    this.toast && this.toast.error(this.$t('notification.sessionExpired') || 'User session expired')

                    // automatically send the user to login page
                    setTimeout(() => {
                        this.$router.push('/login')
                    }, this.timeout)
                } else {
                    console.log(error);
                    
                    // else we have a server error and we display a generic error message
                    this.toast && this.toast.error(this.$t('notification.somethingWentWrong') || 'Something went wrong')

                }

            }
        },
        toggle() {
            // allow user to show the password in the password filed
            let temp = document.getElementById("password")

            if (temp.type === "password") {
                temp.type = "text";

            } else {
                temp.type = "password";
            }
            }
        },

    }
</script>