<template>
  <div class="space-y-6">
    <div v-if="loading" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-400 animate-pulse">Memuat data...</div>
    <div v-else-if="profile" class="space-y-6">
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-start gap-4">
          <div class="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <span class="text-emerald-700 font-bold text-xl">{{ initials }}</span>
          </div>
          <div class="flex-1">
            <h2 class="text-xl font-bold text-gray-800">{{ profile.nama }}</h2>
            <div class="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div><span class="text-gray-400">NIP/NRP:</span> <span class="text-gray-700 font-mono">{{ profile.nipnrp || '-' }}</span></div>
              <div><span class="text-gray-400">Pangkat:</span> <span class="text-gray-700">{{ profile.pangkat || '-' }}</span></div>
              <div><span class="text-gray-400">Instansi:</span> <span class="text-gray-700">{{ profile.instansi || '-' }}</span></div>
              <div><span class="text-gray-400">Jabatan:</span> <span class="text-gray-700">{{ profile.jabatan || '-' }}</span></div>
              <div><span class="text-gray-400">Status:</span> <span class="px-2 py-0.5 text-xs rounded-full font-medium" :class="statusClass">{{ profile.jenis_penghargaan || 'Belum diusulkan' }}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 class="text-sm font-semibold text-gray-800 mb-4">Status Verifikasi</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50">
            <span class="text-sm text-gray-600">Data Pribadi</span>
            <StatusBadge :status="profile.verifikasi_data_status" />
          </div>
          <div class="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50">
            <span class="text-sm text-gray-600">Berkas</span>
            <StatusBadge :status="profile.verifikasi_berkas_status" />
          </div>
        </div>
        <div v-if="profile.verifikasi_data_status === 'Ditolak' && profile.verifikasi_data_catatan" class="mt-3 text-xs bg-red-50 border border-red-200 rounded-lg p-3 text-red-700">
          <span class="font-medium">Data pribadi ditolak:</span> {{ profile.verifikasi_data_catatan }} — silakan perbaiki di Profil Saya.
        </div>
        <div v-if="profile.verifikasi_berkas_status === 'Ditolak' && profile.verifikasi_berkas_catatan" class="mt-3 text-xs bg-red-50 border border-red-200 rounded-lg p-3 text-red-700">
          <span class="font-medium">Berkas ditolak:</span> {{ profile.verifikasi_berkas_catatan }} — silakan upload ulang di Upload Berkas.
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 class="text-sm font-semibold text-gray-800 mb-4">Status Berkas</h3>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div v-for="doc in APPLICANT_DOCS" :key="doc.col" class="text-center p-3 rounded-xl border" :class="profile[doc.col] ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'">
            <div class="text-[10px] text-gray-400 mb-1 truncate" :title="doc.label">{{ doc.label }}</div>
            <div v-if="profile[doc.col]" class="text-emerald-600 text-xs font-medium">Terupload</div>
            <div v-else class="text-gray-300 text-xs">Belum</div>
          </div>
        </div>
      </div>

      <router-link to="/user/usulan" class="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-xl text-sm font-medium hover:bg-emerald-700 transition shadow-sm">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
        Upload Berkas Usulan
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../../api/client';
import { useAuthStore } from '../../stores/auth';
import StatusBadge from '../../components/shared/StatusBadge.vue';
import { APPLICANT_DOCS } from '../../constants/documents';
const authStore = useAuthStore();
const profile = ref(null);
const loading = ref(true);
const initials = computed(() => (profile.value?.nama || 'A').split(' ').map(s=>s[0]).join('').substring(0,2).toUpperCase());
const statusClass = computed(() => {
  const s = profile.value?.jenis_penghargaan;
  if (!s || s==='Sedang Diajukan') return 'bg-yellow-100 text-yellow-700';
  return 'bg-emerald-100 text-emerald-700';
});

onMounted(async () => {
  try {
    const { data } = await api.get('/user/self/profile');
    profile.value = data;
  } catch {} finally { loading.value = false; }
});
</script>
