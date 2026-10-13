<template>
  <div class="min-h-screen flex bg-gradient-to-br from-blue-900 via-blue-800 to-gray-900">
    <div class="hidden lg:flex lg:w-1/2 items-center justify-center p-12">
      <div class="text-white max-w-md">
        <div class="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>
        </div>
        <h1 class="text-4xl font-bold mb-1 tracking-wide">ADHIRA</h1>
        <p class="text-blue-200 text-base mb-3">Aplikasi Digital Penghargaan Dharma Persandian</p>
      </div>
    </div>
    <div class="w-full lg:w-1/2 flex items-center justify-center p-6">
      <div class="bg-white/95 backdrop-blur shadow-2xl rounded-2xl p-8 w-full max-w-sm">
        <div class="text-center mb-6">
          <div class="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          </div>
          <h2 class="text-xl font-bold text-gray-800">Login</h2>
          <p class="text-sm text-gray-500 mt-1">Masuk ke sistem ADHIRA</p>
        </div>
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <div class="relative">
              <svg class="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              <input v-model="form.username" type="text" required class="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Username" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div class="relative">
              <svg class="w-5 h-5 absolute left-3 top-2.5 text-gray-400 z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              <PasswordInput v-model="form.password" required placeholder="Password" class="pl-10" focus-class="focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
          <p v-if="error" class="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg flex items-center gap-2">
            <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
            {{ error }}
          </p>
          <button type="submit" :disabled="loading" class="w-full bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed">
            {{ loading ? 'Memproses...' : 'Masuk' }}
          </button>
          <p class="text-center text-xs text-gray-500">
            <router-link to="/register-verifikator" class="text-blue-600 hover:underline font-medium">Daftar sebagai Perwakilan Instansi</router-link>
          </p>
      </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import PasswordInput from '../../components/shared/PasswordInput.vue';
const router = useRouter();
const authStore = useAuthStore();
const form = ref({ username: '', password: '' });
const error = ref('');
const loading = ref(false);
async function handleLogin() {
  error.value = ''; loading.value = true;
  try {
    const { user } = await authStore.login(form.value.username, form.value.password);
    const home = { Admin: '/admin', Verifikator: '/verifikator' }[user.level] || '/user';
    await router.push(home);
  } catch (err) {
    console.error('Login error:', err);
    error.value = err.response?.data?.error || 'Login gagal';
  } finally { loading.value = false; }
}
</script>
