<template>
  <div>
    <div class="mb-6">
      <h2 class="text-xl font-bold text-gray-800">Persetujuan Verifikator</h2>
      <p class="text-sm text-gray-500 mt-0.5">Review registrasi mandiri perwakilan instansi (Dewan Penghargaan)</p>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[900px]">
          <thead><tr class="bg-gray-50 text-left">
            <th class="p-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Nama / Username</th>
            <th class="p-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">NIP/NRP / Pangkat</th>
            <th class="p-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Jabatan / Unit Kerja</th>
            <th class="p-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Instansi</th>
            <th class="p-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Kontak</th>
            <th class="p-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Berkas</th>
            <th class="p-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap text-center">Status</th>
            <th class="p-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap text-right">Aksi</th>
          </tr></thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="loading"><td colspan="8" class="p-12 text-center text-gray-400"><div class="animate-pulse">Memuat data...</div></td></tr>
            <tr v-else-if="rows.length === 0"><td colspan="8" class="p-12 text-center text-gray-400">Belum ada registrasi</td></tr>
            <template v-for="row in rows" :key="row.id_user">
              <tr class="hover:bg-gray-50 transition text-xs align-top">
                <td class="p-3"><div class="font-medium text-gray-800">{{ row.nama }}</div><div class="text-gray-400 text-[10px]">{{ row.username }}</div></td>
                <td class="p-3"><div class="text-gray-700 font-mono text-[11px]">{{ row.reg_nipnrp || '-' }}</div><div class="text-gray-400 text-[10px]">{{ row.reg_pangkat || '-' }}</div></td>
                <td class="p-3"><div class="text-gray-700 text-[11px]">{{ row.reg_jabatan || '-' }}</div><div class="text-gray-400 text-[10px]">{{ row.reg_unit_kerja || '-' }}</div></td>
                <td class="p-3 text-gray-700">{{ row.instansi || '-' }}</td>
                <td class="p-3 text-gray-600">{{ row.email }}<div class="text-gray-400 text-[10px]">{{ row.hp }}</div></td>
                <td class="p-3">
                  <button type="button" v-if="row.reg_file_surat_usulan" @click="openPreview('/admin/verifikator-registrations/' + row.id_user + '/download/surat_usulan', row.reg_file_surat_usulan)" class="block text-indigo-600 hover:underline text-[11px]">Surat Usulan</button>
                  <button type="button" v-if="row.reg_file_excel_usulan" @click="openPreview('/admin/verifikator-registrations/' + row.id_user + '/download/excel_usulan', row.reg_file_excel_usulan)" class="block text-indigo-600 hover:underline text-[11px]">Excel Usulan</button>
                  <span v-if="!row.reg_file_surat_usulan && !row.reg_file_excel_usulan" class="text-gray-300">Belum ada berkas</span>
                </td>
                <td class="p-3 text-center"><StatusBadge :status="row.reg_status" /></td>
                <td class="p-3 text-right">
                  <button v-if="row.reg_status !== 'Disetujui'" @click="openReview(row)" class="px-2 py-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition">Review</button>
                </td>
              </tr>
              <tr v-if="reviewingId === row.id_user" class="bg-indigo-50/40 text-xs">
                <td colspan="8" class="p-4">
                  <div v-if="row.reg_catatan" class="text-[11px] bg-gray-50 border border-gray-200 rounded-lg p-2 mb-3"><span class="font-medium text-gray-600">Catatan sebelumnya:</span> {{ row.reg_catatan }}</div>
                  <VerifikasiPanel :saving="saving" @approve="submitReview(row, 'Disetujui')" @reject="(catatan) => submitReview(row, 'Ditolak', catatan)" />
                  <p v-if="reviewError" class="text-[11px] text-red-600 mt-2">{{ reviewError }}</p>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <FilePreviewModal :show="previewState.show" :api-url="previewState.apiUrl" :filename="previewState.filename" @close="closePreview" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../../api/client';
import StatusBadge from '../../components/shared/StatusBadge.vue';
import FilePreviewModal from '../../components/shared/FilePreviewModal.vue';
import VerifikasiPanel from '../../components/verifikator/VerifikasiPanel.vue';
import { useFilePreview } from '../../composables/useFilePreview';

const { previewState, openPreview, closePreview } = useFilePreview();
const rows = ref([]);
const loading = ref(true);
const reviewingId = ref(null);
const saving = ref(false);
const reviewError = ref('');

async function fetchData() {
  loading.value = true;
  try {
    const { data } = await api.get('/admin/verifikator-registrations');
    rows.value = data;
  } finally { loading.value = false; }
}

function openReview(row) { reviewingId.value = row.id_user; reviewError.value = ''; }

async function submitReview(row, status, catatan) {
  reviewError.value = ''; saving.value = true;
  try {
    await api.put('/admin/verifikator-registrations/' + row.id_user, { status, catatan });
    reviewingId.value = null;
    await fetchData();
  } catch (err) {
    reviewError.value = err.response?.data?.error || 'Gagal memproses registrasi';
  } finally { saving.value = false; }
}

onMounted(fetchData);
</script>
