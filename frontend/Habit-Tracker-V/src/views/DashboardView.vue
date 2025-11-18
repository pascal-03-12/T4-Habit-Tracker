<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useHabitStore } from '@/stores/habits';

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
</script>

<template>
  <main class="dashboard">
    <h1>Mein Dashboard</h1>

    <section class="create-habit">
      <h3>Neues Habit erstellen</h3>
      <form @submit.prevent="createHabit" class="habit-form">
        <input 
          v-model="newHabitName" 
          placeholder="z.B. Lesen, Joggen, Rauchen aufhören..." 
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
      <h3>Meine Habits</h3>
      
      <div v-if="habitStore.habits.length === 0" class="empty-state">
        Noch keine Habits angelegt. Leg los!
      </div>

      <ul v-else>
        <li v-for="habit in habitStore.habits" :key="habit.id" class="habit-card">
          <div class="habit-info">
            <span class="habit-name">{{ habit.name }}</span>
            <span class="badge" :class="habit.type">
              {{ habit.type === 'positive' ? 'Ziel' : 'Verzicht' }}
            </span>
          </div>
          
          <button @click="habitStore.deleteHabit(habit.id)" class="delete-btn">
            Löschen
          </button>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.dashboard {
  max-width: 600px;
  margin: 0 auto;
  padding: 1rem;
}

.habit-form {
  display: flex;
  gap: 10px;
  margin-bottom: 2rem;
}
input {
  flex-grow: 1;
  padding: 8px;
}
select, button {
  padding: 8px;
}

ul {
  list-style: none;
  padding: 0;
}
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

.badge {
  font-size: 0.8rem;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: bold;
}
.badge.positive {
  background-color: #2e7d32; 
  color: white;
}
.badge.negative {
  background-color: #c62828; 
  color: white;
}

.habit-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.delete-btn {
  background-color: #c62828;
  color: white;
  border: none;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.delete-btn:hover {
  background-color: #b71c1c;
}
</style>