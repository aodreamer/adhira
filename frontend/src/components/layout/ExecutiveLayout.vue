<template>
  <div class="min-h-screen bg-[#f4f6fa] text-slate-800">
    <header class="executive-navigation bg-white border-b border-slate-200">
      <div class="max-w-[1600px] mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-4">
        <router-link to="/pimpinan" class="flex items-center gap-3">
          <div class="bg-[#142a48] p-2.5 rounded-xl text-white"><ChartBarIcon class="w-6 h-6" /></div>
          <div><div class="font-bold tracking-[0.12em] text-lg">ADHIRA</div><div class="text-xs text-slate-500">Akses Pimpinan</div></div>
        </router-link>
        <nav aria-label="Menu pimpinan" class="flex items-center gap-3 sm:gap-6 text-sm">
          <router-link to="/pimpinan" class="hidden sm:block hover:text-blue-700" exact-active-class="font-semibold text-blue-700">Dashboard</router-link>
          <router-link to="/pimpinan/account" class="hover:text-blue-700">Profil Saya</router-link>
          <span class="hidden md:block border-l pl-5 text-slate-500">{{ auth.user?.nama }}</span>
          <button @click="logout" class="text-slate-500 hover:text-red-700" aria-label="Keluar"><ArrowRightOnRectangleIcon class="h-5 w-5" /></button>
        </nav>
      </div>
    </header>
    <main class="max-w-[1600px] mx-auto p-4 sm:p-8"><router-view /></main>
  </div>
</template>

<script setup>
import { ChartBarIcon, ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
const auth = useAuthStore();
const router = useRouter();
function logout() { auth.logout(); router.push('/login'); }
</script>
