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
</script>

<template>
  <main class="dashboard">
    <h1>Mein Dashboard</h1>

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
            <div class="habit-history">
            <span class="streak-count" v-if="habitStore.calculateStreak(habit) > 0">
              🔥 {{ habitStore.calculateStreak(habit) }}
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
            
            <div v-if="isDoneToday(habit)" class="status-done">
              ✅ Erledigt!
            </div>

            <div v-else>
              <button 
                v-if="habit.type === 'positive'" 
                @click="habitStore.trackHabit(habit.id, 'done')"
                class="track-btn positive"
              >
                ✅ Abhaken
              </button>
              
              <button 
                v-else-if="habit.type === 'negative'" 
                @click="habitStore.trackHabit(habit.id, 'done')"
                class="track-btn negative"
              >
                ⛔ Verzicht eintragen
              </button>
            </div>
            <button @click="renameHabit(habit)" class="edit-icon" title="Umbenennen" style="margin-right: 5px;">
              ✏️
            </button>
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
</style>