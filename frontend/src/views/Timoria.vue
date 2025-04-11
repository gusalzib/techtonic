<template>
<!-- Timer Section -->
 <p>Active language: {{ $i18n.locale }}</p>
<p style="color: red">Lang Check: {{ $i18n.locale }} / {{ $t('example.task') }}</p>

<div class="timer-container">
  <h1>{{ $t('timer.title') }}</h1>

  <div id="timerDisplay">{{ $t('timer.defaultTime') }}</div>

  <div>
    <input type="number" class="timer-input" :placeholder="$t('timer.minutesPlaceholder')" />
    <input type="text" class="timer-input" :placeholder="$t('timer.taskPlaceholder')" />
  </div>

  <div>
    <button class="timer-btn">{{ $t('buttons.start') }}</button>
    <button class="timer-btn">{{ $t('buttons.pause') }}</button>
    <button class="timer-btn">{{ $t('buttons.reset') }}</button>
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
        <th>{{ $t('table.category') }}</th>
      </tr>
    </thead>
    <tbody>
      <!-- Example row -->
      <tr>
        <td>{{ $t('example.task') }}</td>
        <td>{{ $t('example.duration') }}</td>
        <td>{{ $t('example.category') }}</td>
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
        <strong>{{ $t('table.category') }}:</strong> <span>{{ $t('example.category') }}</span>
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
    <input type="text" class="timer-input" :placeholder="$t('inputs.topic')" />
    <input type="text" class="timer-input-category" :placeholder="$t('inputs.category')" />
    <input type="number" class="timer-input" :placeholder="$t('inputs.duration')" />
    <button type="button" id="addPlannedTimoriaBtn">{{ $t('buttons.add') }}</button>
  </form>

  <ul id="plannedTimoriasList">
    <li>
      <div class="timoria-info">
        <span class="timoria-topic">{{ $t('example.topic') }}</span>
        <span class="timoria-category">{{ $t('example.category') }}</span>
        <span class="timoria-duration">{{ $t('example.duration') }}</span>
      </div>
      <div class="timoria-actions">
        <button class="start-btn">{{ $t('buttons.start') }}</button>
        <button class="delete-btn">{{ $t('buttons.delete') }}</button>
      </div>
    </li>
  </ul>
</section>

<!-- Autocomplete Suggestions -->
<div class="autocomplete-suggestions">
  <div class="suggestion-item">{{ $t('suggestions.learnVue') }}</div>
  <div class="suggestion-item">{{ $t('suggestions.fixBugs') }}</div>
</div>


</template>


<script>
// @ is an alias to /src


export default {
  name: 'Timoria',
  components: {
    
    },
  mounted() {
  console.log('Locale:', this.$i18n.locale)
  console.log('t(timer.title):', this.$t('timer.title'))
  console.log('Available messages:', this.$i18n.messages)
}

}
</script>
<style src="../assets/styles/main.css"></style>