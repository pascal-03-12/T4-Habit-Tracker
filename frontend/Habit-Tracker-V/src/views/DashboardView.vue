<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useHabitStore, type Habit } from '@/stores/habits';

const habitStore = useHabitStore();
const newHabitName = ref('');
const newHabitType = ref<'positive' | 'negative'>('positive');

onMounted(() => {
  habitStore.fetchHabits();
});

const createHabit = async () => {
  if (!newHabitName.value) return;
  await habitStore.addHabit(newHabitName.value, newHabitType.value);
  newHabitName.value = '';
};

const isDoneToday = (habit: Habit) => {
  const today = habitStore.getTodayString();
  return habit.entries && habit.entries.some((e) => e.date === today);
};
</script>

<template>
  <main class="dashboard">
    <h1>Mein Dashboard</h1>

    <section class="create-habit">
      <h3>Neues Habit erstellen</h3>
      <form @submit.prevent="createHabit" class="habit-form">
        <input 
          v-model="newHabitName" 
          placeholder="z.B. Lesen, Joggen..." 
          required
        />
        <select v-model="newHabitType">
          <option value="positive">Positiv (Tun)</option>
          <option value="negative">Negativ (Lassen)</option>
        </select>
        <button type="submit">Hinzufügen</button>
      </form>
    </section>

    <section class="habit-list">
      <h3>Meine Habits für heute ({{ habitStore.getTodayString() }})</h3>
      
      <div v-if="habitStore.habits.length === 0" class="empty-state">
        Keine Habits. Erstelle eins!
      </div>

      <ul v-else>
        <li v-for="habit in habitStore.habits" :key="habit.id" class="habit-card">
          
          <div class="habit-info">
            <span class="habit-name">{{ habit.name }}</span>
            <span class="badge" :class="habit.type">
              {{ habit.type === 'positive' ? 'Ziel' : 'Verzicht' }}
            </span>
          </div>

          <div class="habit-actions">
            
            <div v-if="isDoneToday(habit)" class="status-done">
              ✅ Erledigt für heute!
            </div>

            <div v-else>
              <button 
                v-if="habit.type === 'positive'" 
                @click="habitStore.trackHabit(habit.id, 'done')"
                class="track-btn positive"
              >
                Erledigt!
              </button>
              
              <button 
                v-else 
                @click="habitStore.trackHabit(habit.id, 'done')"
                class="track-btn negative"
              >
                Geschafft (Verzicht)!
              </button>
            </div>

            <button @click="habitStore.deleteHabit(habit.id)" class="delete-icon" title="Löschen">
              🗑️
            </button>
          </div>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.dashboard { max-width: 800px; margin: 0 auto; padding: 1rem; }
.habit-form { display: flex; gap: 10px; margin-bottom: 2rem; }
input { flex-grow: 1; padding: 8px; }
select, button { padding: 8px; }

ul { list-style: none; padding: 0; }
.habit-card {
  background: #222;
  border: 1px solid #444;
  padding: 1rem;
  margin-bottom: 10px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #eee;
}

.habit-info { display: flex; align-items: center; gap: 10px; flex: 1; }
.badge { font-size: 0.8rem; padding: 4px 8px; border-radius: 4px; font-weight: bold; }
.badge.positive { background-color: #2e7d32; color: white; }
.badge.negative { background-color: #c62828; color: white; }

.habit-actions { display: flex; align-items: center; gap: 15px; }

.track-btn {
  border: none;
  color: white;
  cursor: pointer;
  font-weight: bold;
  border-radius: 4px;
}
.track-btn.positive { background-color: #2e7d32; } 
.track-btn.positive:hover { background-color: #1b5e20; }

.track-btn.negative { background-color: #1976d2; } 
.track-btn.negative:hover { background-color: #0d47a1; }

.status-done {
  color: #4caf50;
  font-weight: bold;
}

.delete-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0;
  opacity: 0.5;
}
.delete-icon:hover { opacity: 1; }
</style>