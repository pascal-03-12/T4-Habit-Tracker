<script setup lang="ts">
import { type Habit, useHabitStore } from '@/stores/habits';

const props = defineProps<{
  habit: Habit
}>();

const habitStore = useHabitStore();

const renameHabit = async () => {
  const newName = prompt("Name ändern:", props.habit.name);
  if (newName && newName.trim() !== "" && newName !== props.habit.name) {
    await habitStore.updateHabitName(props.habit.id, newName);
  }
};

const confirmDelete = async () => {
  if (confirm(`Willst du "${props.habit.name}" wirklich unwiderruflich löschen?`)) {
    await habitStore.deleteHabit(props.habit.id);
  }
};
</script>

<template>
  <li class="habit-card">
    <div class="habit-info">
      <span class="habit-name">{{ habit.name }}</span>
      <span class="badge" :class="habit.type">
        {{ habit.type === 'positive' ? 'Ziel' : 'Verzicht' }}
      </span>
    </div>

    <div class="habit-history">
      <span class="streak-count" v-if="habitStore.calculateStreak(habit) > 0">
        {{ habit.type === 'positive' ? '🔥' : '🛡️' }} {{ habitStore.calculateStreak(habit) }}
      </span>
      
      <div class="dots">
        <span 
          v-for="i in 5" 
          :key="i"
          class="dot"
          :class="{ active: habitStore.isDoneOnDate(habit, i - 1) }"
        ></span>
      </div>
    </div>

    <div class="habit-actions">
      <div v-if="habitStore.isDoneOnDate(habit, 0)" class="status-done">
        ✅
      </div>

      <div v-else>
        <button 
          v-if="habit.type === 'positive'" 
          @click="habitStore.trackHabit(habit.id, 'done')"
          class="track-btn positive"
        >
          Check
        </button>
        
        <button 
          v-else
          @click="habitStore.trackHabit(habit.id, 'done')"
          class="track-btn negative"
        >
          Widerstanden
        </button>
      </div>

      <button @click="renameHabit" class="edit-icon">✏️</button>
      <button @click="confirmDelete" class="delete-icon" title="Löschen">🗑️</button>    </div>
  </li>
</template>

<style scoped>
.habit-card {
  background: #1e1e1e;
  border: 1px solid #333;
  padding: 1rem;
  margin-bottom: 10px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #eee;
  gap: 10px;
}

@media (max-width: 600px) {
  .habit-card { flex-direction: column; align-items: flex-start; }
  .habit-actions { width: 100%; justify-content: flex-end; }
}

.habit-info { display: flex; align-items: center; gap: 10px; font-weight: bold;}
.badge { font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
.badge.positive { background-color: #1b5e20; color: #a5d6a7; border: 1px solid #2e7d32; }
.badge.negative { background-color: #b71c1c; color: #ef9a9a; border: 1px solid #c62828; }

.habit-history { display: flex; align-items: center; gap: 8px; }
.streak-count { font-size: 0.9rem; color: #ff9800; font-weight: bold; }
.dots { display: flex; gap: 3px; }
.dot { width: 8px; height: 8px; border-radius: 50%; background-color: #333; border: 1px solid #444; }
.dot.active { background-color: #4caf50; border-color: #66bb6a; box-shadow: 0 0 5px #4caf50; }

.habit-actions { display: flex; align-items: center; gap: 8px; }
.track-btn { padding: 6px 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem; color: white; }
.track-btn.positive { background-color: #2e7d32; }
.track-btn.negative { background-color: #1565c0; }
.status-done { color: #66bb6a; font-weight: bold; border: 1px solid #66bb6a; padding: 5px 10px; border-radius: 4px; }

.edit-icon, .delete-icon { background: none; border: none; cursor: pointer; font-size: 1.1rem; opacity: 0.6; }
.edit-icon:hover, .delete-icon:hover { opacity: 1; }
</style>