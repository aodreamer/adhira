<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-gray-800">Kode Pendaftaran Verifikator</h2>
        <p class="text-sm text-gray-500 mt-0.5">Kode ini dibagikan lewat surat resmi ke instansi yang berhak mendaftarkan perwakilan (Dewan Penghargaan)</p>
      </div>
      <button @click="showForm = true" class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition">+ Buat Kode</button>
    </div>

    <div v-if="showForm" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
      <h3 class="text-sm font-semibold text-gray-700 mb-3">Kode Baru</h3>
      <form @submit.prevent="submitCreate" class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div class="sm:col-span-2">
          <label class="block text-xs font-medium text-gray-600 mb-1">Keterangan</label>
          <input v-model="newCode.keterangan" placeholder="mis. Surat Edaran No. 123/2026" class="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Kadaluarsa <span class="text-red-500">*</span></label>
          <input v-model="newCode.expired_at" type="date" required :min="minDate" class="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none" />
        </div>
        <div class="sm:col-span-3 flex items-center gap-3">
          <button type="submit" :disabled="saving" class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition disabled:opacity-50">{{ saving ? 'Menyimpan...' : 'Simpan' }}</button>
          <button type="button" @click="showForm = false" class="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">Batal</button>
          <p v-if="createError" class="text-xs text-red-600">{{ createError }}</p>
        </div>
      </form>
    </div>

    <div v-if="createdCode" class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 text-sm text-emerald-800">
      Kode berhasil dibuat: <span class="font-mono font-bold tracking-wider">{{ createdCode }}</span> — sertakan kode ini dalam surat resmi ke instansi terkait.
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[700px]">
          <thead><tr class="bg-gray-50 text-left">
            <th class="p-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Kode</th>
            <th class="p-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Keterangan</th>
            <th class="p-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Kadaluarsa</th>
            <th class="p-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap text-center">Dipakai</th>
            <th class="p-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap text-center">Status</th>
            <th class="p-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap text-right">Aksi</th>
          </tr></thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="loading"><td colspan="6" class="p-12 text-center text-gray-400"><div class="animate-pulse">Memuat data...</div></td></tr>
            <tr v-else-if="rows.length === 0"><td colspan="6" class="p-12 text-center text-gray-400">Belum ada kode pendaftaran</td></tr>
            <tr v-for="row in rows" :key="row.id" class="hover:bg-gray-50 transition text-xs">
              <td class="p-3 font-mono font-semibold tracking-wider text-gray-800">{{ row.kode }}</td>
              <td class="p-3 text-gray-600">{{ row.keterangan || '-' }}</td>
              <td class="p-3 text-gray-600">{{ formatDate(row.expired_at) }}</td>
              <td class="p-3 text-center text-gray-700">{{ row.usage_count }}</td>
              <td class="p-3 text-center">
                <span v-if="isExpired(row)" class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500">Kadaluarsa</span>
                <span v-else-if="row.is_active" class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700">Aktif</span>
                <span v-else class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-600">Nonaktif</span>
              </td>
              <td class="p-3 text-right">
                <button v-if="!isExpired(row)" @click="toggleActive(row)" class="px-2 py-1 text-[11px] font-medium rounded-lg transition" :class="row.is_active ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'">
                  {{ row.is_active ? 'Nonaktifkan' : 'Aktifkan' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../../api/client';

const rows = ref([]);
const loading = ref(true);
const showForm = ref(false);
const saving = ref(false);
const createError = ref('');
const createdCode = ref('');
const newCode = ref({ keterangan: '', expired_at: '' });

const minDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

function formatDate(d) {
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}
function isExpired(row) {
  return new Date(row.expired_at) <= new Date();
}

async function fetchData() {
  loading.value = true;
  try {
    const { data } = await api.get('/admin/verifikator-codes');
    rows.value = data;
  } finally { loading.value = false; }
}

async function submitCreate() {
  createError.value = ''; saving.value = true;
  try {
    const { data } = await api.post('/admin/verifikator-codes', newCode.value);
    createdCode.value = data.kode;
    showForm.value = false;
    newCode.value = { keterangan: '', expired_at: '' };
    await fetchData();
  } catch (err) {
    createError.value = err.response?.data?.error || 'Gagal membuat kode';
  } finally { saving.value = false; }
}

async function toggleActive(row) {
  try {
    await api.put('/admin/verifikator-codes/' + row.id, { is_active: !row.is_active });
    await fetchData();
  } catch (err) {
    alert(err.response?.data?.error || 'Gagal memperbarui kode');
  }
}

onMounted(fetchData);
</script>
