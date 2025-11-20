<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useHabitStore, type Habit } from '@/stores/habits';
import HabitItem from './HabitItem.vue';

const habitStore = useHabitStore();
const newHabitName = ref('');
const newHabitType = ref<'positive' | 'negative'>('positive');

const positiveHabits = computed(() => habitStore.habits.filter(h => h.type === 'positive'));
const negativeHabits = computed(() => habitStore.habits.filter(h => h.type === 'negative'));

onMounted(() => {
  habitStore.fetchHabits();
});

const createHabit = async () => {
  if (!newHabitName.value) return;
  await habitStore.addHabit(newHabitName.value, newHabitType.value);
  newHabitName.value = '';
  newHabitType.value = 'positive';
};

// FIX: Diese Funktion ist jetzt sicher gegen Abstürze
const isDoneToday = (habit: Habit) => {
  if (!habit || !habit.entries || !Array.isArray(habit.entries)) return false;
  const today = habitStore.getTodayString();
  return habit.entries.some((e) => e.date === today);
};

const renameHabit = async (habit: Habit) => {
  const newName = prompt("Neuer Name für das Habit:", habit.name);
  if (newName && newName.trim() !== "" && newName !== habit.name) {
    await habitStore.updateHabitName(habit.id, newName);
  }
};
const dailyProgress = computed(() => {
  if (habitStore.habits.length === 0) return 0;
  const doneCount = habitStore.habits.filter(h => habitStore.isDoneOnDate(h, 0)).length;
  return Math.round((doneCount / habitStore.habits.length) * 100);
});
</script>

<template>
  <main class="dashboard">
    <h1>Mein Dashboard</h1>
    <div class="progress-section" v-if="habitStore.habits.length > 0">
      <div class="progress-info">
        <span>Tageserfolg</span>
        <span class="percent-text">{{ dailyProgress }}%</span>
      </div>
      
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" :style="{ width: dailyProgress + '%' }"></div>
      </div>
    </div>

    <section class="create-habit">
      <h3>Neues Habit erstellen</h3>
      <form @submit.prevent="createHabit" class="habit-form">
        <input 
          v-model="newHabitName" 
          placeholder="Habit Name (z.B. Lesen)" 
          required
        />
        
        <div class="type-selector">
          <label class="radio-label positive">
            <input type="radio" value="positive" v-model="newHabitType" />
            Ziel (Tun)
          </label>
          <label class="radio-label negative">
            <input type="radio" value="negative" v-model="newHabitType" />
            Verzicht (Lassen)
          </label>
        </div>

        <button type="submit" class="add-btn">Hinzufügen</button>
      </form>
    </section>

    <section class="habit-list">
      <h3>Übersicht für {{ habitStore.getTodayString() }}</h3>
      
      <div v-if="habitStore.habits.length === 0" class="empty-state">
        Keine Habits vorhanden.
      </div>

      <div v-else class="dashboard-grid">
        <div class="column positive-column" v-if="positiveHabits.length > 0">
          <h4>Ziele</h4>
          <ul>
            <HabitItem 
              v-for="habit in positiveHabits" 
              :key="habit.id" 
              :habit="habit" 
            />
          </ul>
        </div>

        <div class="column negative-column" v-if="negativeHabits.length > 0">
          <h4>Verzicht</h4>
          <ul>
            <HabitItem 
              v-for="habit in negativeHabits" 
              :key="habit.id" 
              :habit="habit" 
            />
          </ul>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.dashboard { max-width: 800px; margin: 0 auto; padding: 1rem; }

.habit-form { 
  display: flex; 
  flex-direction: column; 
  gap: 10px; 
  margin-bottom: 2rem; 
  background: #222; 
  padding: 15px; 
  border-radius: 8px;
}

@media (min-width: 600px) {
  .habit-form { flex-direction: row; align-items: center; }
}

input[type="text"] { flex-grow: 1; padding: 10px; border-radius: 4px; border: 1px solid #555; background: #333; color: white; }

.type-selector { display: flex; gap: 15px; }
.radio-label { display: flex; align-items: center; gap: 5px; cursor: pointer; font-size: 0.9rem; }
.radio-label.positive { color: #81c784; }
.radio-label.negative { color: #e57373; }

.add-btn { padding: 10px 20px; background: #eee; color: #333; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
.add-btn:hover { background: white; }

ul { list-style: none; padding: 0; }
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
}

.habit-info { display: flex; flex-direction: column; gap: 5px; }
@media (min-width: 600px) {.habit-info { flex-direction: row; align-items: center; gap: 15px; }}
.badge { font-size: 0.75rem; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
.badge.positive { background-color: #1b5e20; color: #a5d6a7; border: 1px solid #2e7d32; }
.badge.negative { background-color: #b71c1c; color: #ef9a9a; border: 1px solid #c62828; }
.habit-actions { display: flex; align-items: center; gap: 10px; }
.track-btn { padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem; color: white; }
.track-btn.positive { background-color: #2e7d32; }
.track-btn.negative { background-color: #1565c0; }
.status-done { color: #66bb6a; font-weight: bold; border: 1px solid #66bb6a; padding: 5px 10px; border-radius: 4px; }
.delete-icon { background: none; border: none; cursor: pointer; font-size: 1.2rem; opacity: 0.7; }
.delete-icon:hover { opacity: 1; }
.edit-icon {background: none;border: none;cursor: pointer;font-size: 1.2rem;opacity: 0.7;transition: opacity 0.2s;}
.edit-icon:hover { opacity: 1;}

.habit-card {
  gap: 10px; 
}

.habit-history {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

@media (min-width: 600px) {
  .habit-history {
    flex-direction: row;
    gap: 10px;
  }
}

.streak-count {
  font-size: 0.9rem;
  color: #ff9800;
  font-weight: bold;
}

.dots {
  display: flex;
  gap: 4px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #333;
  border: 1px solid #444;
}

.dot.active {
  background-color: #4caf50;
  border-color: #66bb6a;
  box-shadow: 0 0 5px #4caf50;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

@media (min-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }
}

.column h4 {
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 2px solid #333;
  text-transform: uppercase;
  font-size: 0.85rem;
}

.positive-column h4 { color: #81c784; border-color: #1b5e20; }
.negative-column h4 { color: #e57373; border-color: #b71c1c; }
.empty-state { text-align: center; color: #777; margin-top: 20px; }
.progress-section {
  background-color: #2a2a2a;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px; 
  border: 1px solid #333;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-weight: bold;
  color: #ddd;
  font-size: 0.9rem;
}

.percent-text {
  color: #4caf50; 
}

.progress-bar-bg {
  width: 100%;
  height: 12px;
  background-color: #444;
  border-radius: 6px;
  overflow: hidden; 
}

.progress-bar-fill {
  height: 100%;
  background-color: #4caf50;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1); 
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.4); }
</style>