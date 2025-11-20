<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useHabitStore, } from '@/stores/habits';
import HabitItem from '@/components/HabitItem.vue';
import HabitCreateForm from '@/components/HabitCreateForm.vue';

const habitStore = useHabitStore();

const positiveHabits = computed(() => habitStore.habits.filter(h => h.type === 'positive'));
const negativeHabits = computed(() => habitStore.habits.filter(h => h.type === 'negative'));

onMounted(() => {
  habitStore.fetchHabits();
});

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
      <HabitCreateForm />
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

ul { list-style: none; padding: 0; }

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
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.4); 
}
</style>
