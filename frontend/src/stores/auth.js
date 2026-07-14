import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../api/client';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));
  const token = ref(localStorage.getItem('token') || '');

  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.level === 'Admin');
  const isVerifikator = computed(() => user.value?.level === 'Verifikator');

  async function login(username, password) {
    const { data } = await api.post('/auth/login', { username, password });
    token.value = data.token;
    user.value = data.user;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }

  function logout() {
    token.value = '';
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  async function checkAuth() {
    try {
      const { data } = await api.get('/auth/me');
      user.value = data;
    } catch {
      logout();
    }
  }

  return { user, token, isAuthenticated, isAdmin, isVerifikator, login, logout, checkAuth };
});
