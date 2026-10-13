<template>
  <div>
    <div class="mb-6">
      <h2 class="text-xl font-bold text-gray-800">Antrian Verifikasi</h2>
      <p class="text-sm text-gray-500 mt-0.5">Data pengusul dari instansi yang menjadi cakupan Anda</p>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-5 flex flex-wrap gap-4 items-end">
      <div>
        <label class="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Instansi</label>
        <select v-model="filter.instansi" @change="fetchData" class="border border-gray-300 rounded-xl px-3 py-2 text-sm min-w-[160px] focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none bg-white">
          <option value="">Semua Instansi (cakupan Anda)</option>
          <option v-for="i in scope" :key="i" :value="i">{{ i }}</option>
        </select>
      </div>
      <div>
        <label class="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Status Data</label>
        <select v-model="filter.statusData" @change="fetchData" class="border border-gray-300 rounded-xl px-3 py-2 text-sm min-w-[140px] focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none bg-white">
          <option value="">Semua Status</option>
          <option value="Menunggu">Menunggu</option>
          <option value="Disetujui">Disetujui</option>
          <option value="Ditolak">Ditolak</option>
        </select>
      </div>
      <div>
        <label class="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Status Berkas</label>
        <select v-model="filter.statusBerkas" @change="fetchData" class="border border-gray-300 rounded-xl px-3 py-2 text-sm min-w-[140px] focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none bg-white">
          <option value="">Semua Status</option>
          <option value="Menunggu">Menunggu</option>
          <option value="Disetujui">Disetujui</option>
          <option value="Ditolak">Ditolak</option>
        </select>
      </div>
      <button @click="resetFilters" class="px-4 py-2 text-sm border border-gray-300 rounded-xl hover:bg-gray-50 transition text-gray-600">Reset</button>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="p-4 border-b border-gray-100">
        <TableSearchBox v-model="table.search" />
      </div>
      <div class="overflow-x-auto">
        <table class="responsive-table">
          <thead><tr class="bg-gray-50 text-left">
            <th v-for="col in columns" :key="col.key" class="p-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap" :class="[col.sortable && 'cursor-pointer hover:text-gray-600', col.headerClass]" @click="col.sortable && table.toggleSort(col.key)">
              {{ col.label }}
              <span v-if="col.sortable && table.sortKey === col.key">{{ table.sortDir === 'asc' ? '▲' : '▼' }}</span>
            </th>
          </tr></thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="loading" data-empty-row><td :colspan="columns.length" class="p-12 text-center text-gray-400"><div class="animate-pulse">Memuat data...</div></td></tr>
            <tr v-else-if="table.pageRows.length === 0" data-empty-row><td :colspan="columns.length" class="p-12 text-center text-gray-400">Belum ada data</td></tr>
            <tr v-for="row in table.pageRows" :key="row.id" class="hover:bg-gray-50 transition text-xs">
              <td data-label="Nama / NIP" class="p-3 whitespace-nowrap"><div class="font-medium text-gray-800">{{ row.nama }}</div><div class="text-gray-400 font-mono text-[10px]">{{ row.nipnrp }}</div></td>
              <td data-label="Instansi" class="p-3 whitespace-nowrap text-gray-700">{{ row.instansi || '-' }}</td>
              <td data-label="Jenis" class="p-3 whitespace-nowrap"><span class="px-1.5 py-0.5 text-[10px] rounded-full bg-indigo-50 text-indigo-700 font-medium">{{ row.jenis_penghargaan || '-' }}</span></td>
              <td data-label="Status Data" class="p-3 text-center"><StatusBadge :status="row.verifikasi_data_status" /></td>
              <td data-label="Status Berkas" class="p-3 text-center"><StatusBadge :status="row.verifikasi_berkas_status" /></td>
              <td data-label="Aksi" class="p-3 whitespace-nowrap text-right">
                <router-link :to="'/verifikator/antrian/' + row.id" class="px-3 py-1.5 text-[11px] font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition">Periksa</router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <TablePagination :page="table.page" @update:page="table.goToPage" v-model:page-size="table.pageSize" :total-pages="table.totalPages" :total-items="table.totalItems" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import api from '../../api/client';
import StatusBadge from '../../components/shared/StatusBadge.vue';
import TableSearchBox from '../../components/shared/TableSearchBox.vue';
import TablePagination from '../../components/shared/TablePagination.vue';
import { useTable } from '../../composables/useTable';

const data = ref([]);
const scope = ref([]);
const filter = reactive({ instansi: '', statusData: '', statusBerkas: '' });
const loading = ref(true);

// Semantic order for status sorting, mirroring IndividuView.vue's pattern, so
// StatusBadge columns sort by review progress rather than badge text.
const STATUS_ORDER = { Menunggu: 0, Pending: 0, Ditolak: 1, Disetujui: 2 };
const statusSortValue = (status) => STATUS_ORDER[status] ?? 0;

const columns = [
  { key: 'nama', label: 'Nama / NIP', sortable: true, sortValue: (r) => r.nama || '' },
  { key: 'instansi', label: 'Instansi', sortable: true },
  { key: 'jenis_penghargaan', label: 'Jenis', sortable: true },
  { key: 'verifikasi_data_status', label: 'Status Data', sortable: true, headerClass: 'text-center', sortValue: (r) => statusSortValue(r.verifikasi_data_status) },
  { key: 'verifikasi_berkas_status', label: 'Status Berkas', sortable: true, headerClass: 'text-center', sortValue: (r) => statusSortValue(r.verifikasi_berkas_status) },
  { key: 'aksi', label: 'Aksi', sortable: false, headerClass: 'text-right' },
];
const table = reactive(useTable(data, { columns }));

async function fetchData() {
  loading.value = true;
  try {
    const params = {};
    if (filter.instansi) params.instansi = filter.instansi;
    if (filter.statusData) params.statusData = filter.statusData;
    if (filter.statusBerkas) params.statusBerkas = filter.statusBerkas;
    const { data: d } = await api.get('/verifikator/queue', { params });
    data.value = d;
  } finally { loading.value = false; }
}

function resetFilters() { filter.instansi = ''; filter.statusData = ''; filter.statusBerkas = ''; fetchData(); }

onMounted(async () => {
  try {
    const { data: s } = await api.get('/verifikator/scope');
    scope.value = s.instansi || [];
  } catch {}
  fetchData();
});
</script>
