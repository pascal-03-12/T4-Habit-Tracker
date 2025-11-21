<script setup lang="ts">
import { ref } from 'vue';
import { useHabitStore } from '@/stores/habits';

// --- Store Initialisierung ---
const habitStore = useHabitStore();

// --- Reactive State ---
const name = ref('');
const type = ref<'positive' | 'negative'>('positive');

// --- Logik (Habit erstellen) ---
const submitHabit = async () => {
  if (!name.value.trim()) return;
  await habitStore.addHabit(name.value, type.value);
  name.value = '';
  type.value = 'positive';
};
</script>

<template>
  <form @submit.prevent="submitHabit" class="habit-form">
    <input 
      v-model="name" 
      placeholder="Neues Habit (z.B. Joggen)" 
      required
      class="habit-input"
    />
    
    <div class="type-selector">
      <label class="radio-label positive">
        <input type="radio" value="positive" v-model="type" />
        Ziel
      </label>
      <label class="radio-label negative">
        <input type="radio" value="negative" v-model="type" />
        Verzicht
      </label>
    </div>

    <button type="submit" class="add-btn">Hinzufügen</button>
  </form>
</template>

<style scoped>
.habit-form { 
  display: flex; 
  flex-direction: column; 
  gap: 10px; 
  background: #222;
  padding: 15px; 
  border-radius: 8px;
  margin-bottom: 2rem; 
}

@media (min-width: 600px) {
  .habit-form { flex-direction: row; align-items: center; }
}

.habit-input { 
  flex-grow: 1;
  padding: 10px; 
  border-radius: 4px; 
  border: 1px solid #555; 
  background: #333; 
  color: white; 
}

.type-selector { display: flex; gap: 15px; }

.radio-label { display: flex; align-items: center; gap: 5px; cursor: pointer; font-size: 0.9rem; }
.radio-label.positive { color: #81c784; }
.radio-label.negative { color: #e57373; }

.add-btn { 
  padding: 10px 20px; 
  background: #eee; 
  color: #333; 
  border: none; 
  border-radius: 4px; 
  cursor: pointer; 
  font-weight: bold;
}
.add-btn:hover { background: white; }
</style>