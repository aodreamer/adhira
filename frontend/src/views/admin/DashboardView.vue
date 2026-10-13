<template>
  <div class="space-y-6">
    <!-- Stat Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm text-gray-500 font-medium">User Bulan Ini</span>
          <div class="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
          </div>
        </div>
        <div class="text-3xl font-bold text-gray-800">{{ stats?.user_bulan_ini || 0 }}</div>
      </div>
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm text-gray-500 font-medium">Total User</span>
          <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
          </div>
        </div>
        <div class="text-3xl font-bold text-gray-800">{{ stats?.total_user || 0 }}</div>
      </div>
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm text-gray-500 font-medium">User Aktif</span>
          <div class="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
        </div>
        <div class="text-3xl font-bold text-green-600">{{ stats?.user_aktif || 0 }}</div>
      </div>
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm text-gray-500 font-medium">User Tidak Aktif</span>
          <div class="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 11-12.728 0 9 9 0 0112.728 0z"/></svg>
          </div>
        </div>
        <div class="text-3xl font-bold text-red-600">{{ stats?.user_tak_aktif || 0 }}</div>
      </div>
    </div>

    <!-- Document Overview + Recent Individu -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 class="text-sm font-semibold text-gray-800 mb-4">Total Dokumen</h3>
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-blue-50 rounded-xl p-3 text-center"><div class="text-2xl font-bold text-blue-700">{{ stats?.total_individu || 0 }}</div><div class="text-[10px] text-blue-500 font-medium mt-0.5">Individu</div></div>
          <div class="bg-purple-50 rounded-xl p-3 text-center"><div class="text-2xl font-bold text-purple-700">{{ stats?.total_pemberitahuan || 0 }}</div><div class="text-[10px] text-purple-500 font-medium mt-0.5">Pemberitahuan</div></div>
          <div class="bg-amber-50 rounded-xl p-3 text-center"><div class="text-2xl font-bold text-amber-700">{{ stats?.total_laporan || 0 }}</div><div class="text-[10px] text-amber-500 font-medium mt-0.5">Laporan</div></div>
          <div class="bg-emerald-50 rounded-xl p-3 text-center"><div class="text-2xl font-bold text-emerald-700">{{ stats?.total_usulan || 0 }}</div><div class="text-[10px] text-emerald-500 font-medium mt-0.5">Usulan</div></div>
        </div>
      </div>

      <div class="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-800">Individu Terbaru</h3>
          <router-link to="/admin/individu" class="text-xs text-blue-600 hover:underline">Lihat semua</router-link>
        </div>
        <div class="px-5 pt-4">
          <TableSearchBox v-model="table.search" />
        </div>
        <div class="overflow-x-auto">
          <table class="responsive-table">
            <thead><tr class="bg-gray-50 text-left">
              <th v-for="col in columns" :key="col.key" class="p-3 text-[10px] font-semibold text-gray-400 uppercase" :class="[col.sortable && 'cursor-pointer hover:text-gray-600', col.headerClass]" @click="col.sortable && table.toggleSort(col.key)">
                {{ col.label }}
                <span v-if="col.sortable && table.sortKey === col.key">{{ table.sortDir === 'asc' ? '▲' : '▼' }}</span>
              </th>
            </tr></thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-if="loading" data-empty-row><td :colspan="columns.length" class="p-8 text-center text-gray-400"><div class="animate-pulse">Memuat...</div></td></tr>
              <tr v-else-if="table.pageRows.length === 0" data-empty-row><td :colspan="columns.length" class="p-8 text-center text-gray-400">Belum ada data</td></tr>
              <tr v-for="row in table.pageRows" :key="row.id" class="hover:bg-gray-50 transition text-xs">
                <td data-label="Nama" class="p-2.5"><span class="font-medium text-gray-800">{{ row.nama }}</span></td>
                <td data-label="Instansi" class="p-2.5 text-gray-500">{{ row.instansi || '-' }}</td>
                <td data-label="Jenis" class="p-2.5">
                  <span v-if="row.jenis_penghargaan" class="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-medium">{{ row.jenis_penghargaan }}</span>
                  <span v-else class="text-gray-400">-</span>
                </td>
                <td data-label="Tanggal" class="p-2.5 text-gray-500">{{ row.tgl_penghargaan || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <TablePagination :page="table.page" @update:page="table.goToPage" v-model:page-size="table.pageSize" :total-pages="table.totalPages" :total-items="table.totalItems" />
      </div>
    </div>

    <!-- Bar Chart: Penghargaan per Tahun -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <h3 class="text-sm font-semibold text-gray-800 mb-2">Penghargaan per Tahun</h3>
      <div class="h-64">
        <BarChart :labels="chartTahunLabels" :datasets="[chartTahunDataset]" y-label="Jumlah Penghargaan" />
      </div>
    </div>

    <!-- Doughnut + Instansi -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 class="text-sm font-semibold text-gray-800 mb-2">Berdasarkan Jenis Penghargaan</h3>
        <div class="h-72">
          <PieChart v-if="chartJenisLabels.length" :labels="chartJenisLabels" :data="chartJenisData" />
          <p v-else class="text-gray-400 text-sm p-8 text-center">Belum ada data</p>
        </div>
      </div>
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 class="text-sm font-semibold text-gray-800 mb-2">10 Instansi Terbanyak</h3>
        <div class="h-72">
          <BarChart v-if="chartInstansiLabels.length" :labels="chartInstansiLabels" :datasets="[chartInstansiDataset]" y-label="Jumlah" />
          <p v-else class="text-gray-400 text-sm p-8 text-center">Belum ada data</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import api from '../../api/client';
import BarChart from '../../components/shared/BarChart.vue';
import PieChart from '../../components/shared/PieChart.vue';
import TableSearchBox from '../../components/shared/TableSearchBox.vue';
import TablePagination from '../../components/shared/TablePagination.vue';
import { useTable } from '../../composables/useTable';

const loading = ref(true);
const stats = ref(null);
const penghargaanPerTahun = ref([]);
const penghargaanPerJenis = ref([]);
const penghargaanPerInstansi = ref([]);
const recentIndividu = ref([]);

const columns = [
  { key: 'nama', label: 'Nama', sortable: true },
  { key: 'instansi', label: 'Instansi', sortable: true },
  { key: 'jenis_penghargaan', label: 'Jenis', sortable: true },
  { key: 'tgl_penghargaan', label: 'Tanggal', sortable: true },
];
const table = reactive(useTable(recentIndividu, { columns }));

const chartTahunLabels = computed(() => penghargaanPerTahun.value.map(d => d.tahun));
const chartTahunDataset = computed(() => ({
  label: 'Penghargaan',
  data: penghargaanPerTahun.value.map(d => parseInt(d.jumlah)),
  backgroundColor: '#3b82f6',
  borderRadius: 6,
  maxBarThickness: 40,
}));

const chartJenisLabels = computed(() => penghargaanPerJenis.value.map(d => d.jenis));
const chartJenisData = computed(() => penghargaanPerJenis.value.map(d => parseInt(d.jumlah)));

const chartInstansiLabels = computed(() => penghargaanPerInstansi.value.map(d => d.instansi));
const chartInstansiDataset = computed(() => ({
  label: 'Jumlah',
  data: penghargaanPerInstansi.value.map(d => parseInt(d.jumlah)),
  backgroundColor: '#3b82f6',
  borderRadius: 4,
  maxBarThickness: 24,
}));

onMounted(async () => {
  try {
    const { data } = await api.get('/dashboard');
    stats.value = data.stats;
    penghargaanPerTahun.value = data.penghargaanPerTahun || [];
    penghargaanPerJenis.value = data.penghargaanPerJenis || [];
    penghargaanPerInstansi.value = data.penghargaanPerInstansi || [];
    recentIndividu.value = data.recentIndividu || [];
  } catch (err) {
    console.error('Dashboard fetch error:', err);
  } finally {
    loading.value = false;
  }
});
</script>
