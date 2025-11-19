import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from './auth';

export interface Entry {
  habitId: string;
  date: string;
  status: 'done' | 'failed';
}

export interface Habit {
  id: string;
  name: string;
  type: 'positive' | 'negative';
  entries: Entry[]; 
}

export const useHabitStore = defineStore('habits', () => {
  const habits = ref<Habit[]>([]);
  const authStore = useAuthStore();

  const getTodayString = () => new Date().toISOString().split('T')[0];

  async function fetchHabits() {
    if (!authStore.token) return;
    try {
      const res = await fetch('/api/habits', {
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      });
      if (res.ok) {
        habits.value = await res.json();
      }
    } catch (err) {
      console.error("Fehler beim Laden", err);
    }
  }

  async function addHabit(name: string, type: 'positive' | 'negative') {
    if (!authStore.token) return;
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authStore.token}` },
        body: JSON.stringify({ name, type })
      });
      if (res.ok) {
        const newHabit = await res.json();
        newHabit.entries = []; 
        habits.value.push(newHabit);
      }
    } catch (err) { console.error(err); }
  }

  async function deleteHabit(id: string) {
    if (!authStore.token) return;
    try {
      const res = await fetch(`/api/habits/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      });
      if (res.ok) {
        habits.value = habits.value.filter(h => h.id !== id);
      }
    } catch (err) { console.error(err); }
  }

  async function trackHabit(habitId: string, status: 'done' | 'failed') {
    if (!authStore.token) return;

    const today = getTodayString();

    try {
      const res = await fetch(`http://localhost:8000/api/habits/${habitId}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authStore.token}` },
        body: JSON.stringify({ date: today, status })
      });

      if (res.ok) {
        const newEntry = await res.json();
        
        const habit = habits.value.find(h => h.id === habitId);
        if (habit) {
          if (!habit.entries) habit.entries = [];
          habit.entries.push(newEntry);
        }
      }
    } catch (err) { console.error("Tracking Fehler", err); }
  }

  return { habits, fetchHabits, addHabit, deleteHabit, trackHabit, getTodayString };
});