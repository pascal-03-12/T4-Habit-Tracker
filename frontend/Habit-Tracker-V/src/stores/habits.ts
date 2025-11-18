import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from './auth';

// Definiert, wie ein Habit im Frontend aussieht (TypeScript Interface)
interface Habit {
  id: string;
  name: string;
  type: 'positive' | 'negative';
}

export const useHabitStore = defineStore('habits', () => {
  const habits = ref<Habit[]>([]);
  const authStore = useAuthStore();

  // Alle Habits vom Server laden
  async function fetchHabits() {
    if (!authStore.token) return;

    try {
      const res = await fetch('http://localhost:8000/api/habits', {
        headers: {
          'Authorization': `Bearer ${authStore.token}` 
        }
      });
      if (res.ok) {
        habits.value = await res.json();
      }
    } catch (err) {
      console.error("Fehler beim Laden der Habits", err);
    }
  }

  //Neues Habit hinzufügen
  async function addHabit(name: string, type: 'positive' | 'negative') {
    if (!authStore.token) return;

    try {
      const res = await fetch('http://localhost:8000/api/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify({ name, type })
      });

      if (res.ok) {
        const newHabit = await res.json();
        habits.value.push(newHabit);
      }
    } catch (err) {
      console.error("Fehler beim Erstellen", err);
    }
  }
  async function deleteHabit(id: string) {
    if (!authStore.token) return;

    try {
      // 1. An Server senden
      const res = await fetch(`http://localhost:8000/api/habits/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      });

      if (res.ok) {
        // 2. Aus lokaler Liste entfernen (Filter)
        // "Behalte alle Habits, deren ID NICHT die gelöschte ID ist"
        habits.value = habits.value.filter(h => h.id !== id);
      }
    } catch (err) {
      console.error("Fehler beim Löschen", err);
    }
  }
  
return { habits, fetchHabits, addHabit, deleteHabit };
});