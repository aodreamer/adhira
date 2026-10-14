<template>
  <header class="bg-white shadow-sm h-16 flex items-center justify-between px-6 sticky top-0 z-30">
    <div class="flex items-center gap-3">
      <button @click="toggleMobileMenu" aria-label="Buka menu" class="lg:hidden text-gray-500">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
      <h1 class="text-lg font-bold text-gray-800">{{ pageTitle }}</h1>
    </div>
    <div class="flex items-center gap-4">
      <span class="text-xs text-gray-400 hidden sm:block">{{ today }}</span>
      <div class="flex items-center gap-2 pl-4 border-l border-gray-200">
        <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <span class="text-blue-700 font-semibold text-xs">{{ initials }}</span>
        </div>
        <span class="text-sm font-medium text-gray-700 hidden sm:block">{{ authStore.user?.nama }}</span>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { useUiStore } from '../../stores/ui';
const route = useRoute();
const authStore = useAuthStore();
const uiStore = useUiStore();
const pageTitle = computed(() => {
  const t = { Dashboard:'Beranda',ManUser:'Manajemen User',Individu:'Berkas Individu',Pemberitahuan:'Surat Pemberitahuan',Laporan:'Laporan Kegiatan',Usulan:'Usulan Penghargaan',Distribusi:'Distribusi',AdminVerifikatorRegistrations:'Persetujuan Verifikator',AdminAccount:'Profil Saya' };
  if (['AdminExecutiveDashboard','ExecutiveDashboard'].includes(route.name)) return 'Executive Dashboard';
  if (['AdminPeriods','PimpinanPeriods'].includes(route.name)) return 'Periode Penghargaan';
  if (route.name === 'PimpinanAccount') return 'Profil Saya';
  return t[route.name] || 'ADHIRA';
});
const today = computed(() => {
  const m = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agust','Sep','Okt','Nov','Des'];
  const d = new Date();
  return d.getDate() + ' ' + m[d.getMonth()] + ' ' + d.getFullYear();
});
const initials = computed(() => (authStore.user?.nama || 'A').split(' ').map(s=>s[0]).join('').substring(0,2).toUpperCase());
function toggleMobileMenu() { uiStore.toggleMobileMenu(); }
</script>
