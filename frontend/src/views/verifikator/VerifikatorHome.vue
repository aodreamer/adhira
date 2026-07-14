<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-xl font-bold text-gray-800">Beranda Verifikator</h2>
      <p class="text-sm text-gray-500 mt-0.5">Ringkasan status verifikasi untuk instansi yang menjadi tanggung jawab Anda</p>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Cakupan Instansi Anda</div>
      <div v-if="scope.length" class="flex flex-wrap gap-2">
        <span v-for="i in scope" :key="i" class="px-2.5 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full">{{ i }}</span>
      </div>
      <p v-else class="text-sm text-gray-400">Belum ada instansi yang ditugaskan ke Anda. Hubungi Admin.</p>
    </div>

    <div v-if="loading" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-400 animate-pulse">Memuat data...</div>
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 class="text-sm font-semibold text-gray-800 mb-4">Verifikasi Data Pribadi</h3>
        <div class="grid grid-cols-3 gap-3">
          <div class="text-center p-3 rounded-xl bg-yellow-50">
            <div class="text-2xl font-bold text-yellow-700">{{ stats.data.Menunggu || 0 }}</div>
            <div class="text-[11px] text-yellow-600 mt-0.5">Menunggu</div>
          </div>
          <div class="text-center p-3 rounded-xl bg-emerald-50">
            <div class="text-2xl font-bold text-emerald-700">{{ stats.data.Disetujui || 0 }}</div>
            <div class="text-[11px] text-emerald-600 mt-0.5">Disetujui</div>
          </div>
          <div class="text-center p-3 rounded-xl bg-red-50">
            <div class="text-2xl font-bold text-red-700">{{ stats.data.Ditolak || 0 }}</div>
            <div class="text-[11px] text-red-600 mt-0.5">Ditolak</div>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 class="text-sm font-semibold text-gray-800 mb-4">Verifikasi Berkas</h3>
        <div class="grid grid-cols-3 gap-3">
          <div class="text-center p-3 rounded-xl bg-yellow-50">
            <div class="text-2xl font-bold text-yellow-700">{{ stats.berkas.Menunggu || 0 }}</div>
            <div class="text-[11px] text-yellow-600 mt-0.5">Menunggu</div>
          </div>
          <div class="text-center p-3 rounded-xl bg-emerald-50">
            <div class="text-2xl font-bold text-emerald-700">{{ stats.berkas.Disetujui || 0 }}</div>
            <div class="text-[11px] text-emerald-600 mt-0.5">Disetujui</div>
          </div>
          <div class="text-center p-3 rounded-xl bg-red-50">
            <div class="text-2xl font-bold text-red-700">{{ stats.berkas.Ditolak || 0 }}</div>
            <div class="text-[11px] text-red-600 mt-0.5">Ditolak</div>
          </div>
        </div>
      </div>
    </div>

    <router-link to="/verifikator/antrian" class="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl text-sm font-medium hover:bg-indigo-700 transition shadow-sm">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
      Buka Antrian Verifikasi
    </router-link>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import api from '../../api/client';

const loading = ref(true);
const scope = ref([]);
const stats = reactive({ data: {}, berkas: {} });

onMounted(async () => {
  try {
    const [scopeRes, statsRes] = await Promise.all([
      api.get('/verifikator/scope'),
      api.get('/verifikator/stats'),
    ]);
    scope.value = scopeRes.data.instansi || [];
    Object.assign(stats, statsRes.data);
  } catch {} finally { loading.value = false; }
});
</script>
