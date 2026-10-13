<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="text-center">
      <h1 class="text-6xl font-bold text-gray-300 mb-4">403</h1>
      <p class="text-lg text-gray-600 mb-6">Akses Ditolak</p>
      <router-link :to="home" class="text-blue-600 hover:underline">Kembali ke Beranda</router-link>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '../../stores/auth';
const auth = useAuthStore();
const home = computed(() => ({Admin:'/admin',User:'/user',Verifikator:'/verifikator',Pimpinan:'/pimpinan'}[auth.user?.level] || '/login'));
</script>
