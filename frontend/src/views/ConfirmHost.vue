<template>
    <teleport to="body">
        <div v-if="state.open" class="modal-overlay">
            <div class="modal">
                <h3 class="modal-title">{{ state.title }}</h3>
                <p class="modal-message" v-if="state.message">{{ state.message }}</p>
                <div class="modal-actions">
                    <button class="btn btn-secondary" @click="cancelConfirm">
                        {{ state.cancelText }}
                    </button>
                    <button class="btn btn-primary" @click="acceptConfirm">
                        {{ state.confirmText }}
                    </button>
                </div>

            </div>

        </div>
    </teleport>
</template>


<script setup>
import { confirmState as state, acceptConfirm, cancelConfirm } from '@/services/confirmService'; 

</script>

<style scoped>

</style>