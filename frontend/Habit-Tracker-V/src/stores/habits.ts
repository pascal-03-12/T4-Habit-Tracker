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

interface RawHabit {
  id: string;
  name: string;
  type?: string;
  entries?: Entry[];
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
        const rawData = await res.json() as RawHabit[];
        // Safety-Mapping: Verhindert Abstürze bei fehlenden daten
        habits.value = rawData.map((h) => ({
          id: h.id,
          name: h.name,
          entries: Array.isArray(h.entries) ? h.entries : [],
          type: (h.type === 'positive' || h.type === 'negative') ? (h.type as 'positive' | 'negative') : 'positive'
        }));
      }
    } catch (err) { console.error(err); }
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
        const newHabit = await res.json() as RawHabit;
        habits.value.push({
          id: newHabit.id,
          name: newHabit.name,
          type: (newHabit.type === 'negative') ? 'negative' : 'positive',
          entries: []
        });
      }
    } catch (err) { console.error(err); }
  }

  async function updateHabitName(id: string, newName: string) {
    if (!authStore.token) return;
    try {
      const res = await fetch(`/api/habits/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${authStore.token}` 
        },
        body: JSON.stringify({ name: newName })
      });

      if (res.ok) {
        const habit = habits.value.find(h => h.id === id);
        if (habit) {
          habit.name = newName;
        }
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
      const res = await fetch(`/api/habits/${habitId}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authStore.token}` },
        body: JSON.stringify({ date: today, status })
      });
      if (res.ok) {
        const newEntry = await res.json() as Entry;
        const habit = habits.value.find(h => h.id === habitId);
        if (habit) {
          if (!Array.isArray(habit.entries)) habit.entries = [];
          habit.entries.push(newEntry);
        }
      }
    } catch (err) { console.error(err); }
  }

  return { habits, fetchHabits, addHabit,updateHabitName, deleteHabit, trackHabit, getTodayString };
});