<template>
  <div class="max-w-5xl">
    <div class="mb-6 flex items-center gap-3">
      <router-link to="/verifikator/antrian" class="text-gray-400 hover:text-gray-600">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
      </router-link>
      <div>
        <h2 class="text-xl font-bold text-gray-800">Detail Verifikasi</h2>
        <p class="text-sm text-gray-500 mt-0.5">Periksa data pribadi dan berkas pengusul</p>
      </div>
    </div>

    <div v-if="loading" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-400 animate-pulse">Memuat data...</div>
    <div v-else-if="!row" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">Data tidak ditemukan atau di luar cakupan Anda</div>

    <div v-else class="space-y-6">
      <!-- Panel: Data Pribadi -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-gray-800">Data Pribadi</h3>
          <StatusBadge :status="row.verifikasi_data_status" />
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
          <div><div class="text-[11px] text-gray-400 mb-0.5">Nama</div><div class="text-gray-700">{{ row.nama }}</div></div>
          <div><div class="text-[11px] text-gray-400 mb-0.5">NIP/NRP</div><div class="text-gray-700 font-mono">{{ row.nipnrp }}</div></div>
          <div><div class="text-[11px] text-gray-400 mb-0.5">Instansi</div><div class="text-gray-700">{{ row.instansi || '-' }}</div></div>
          <div><div class="text-[11px] text-gray-400 mb-0.5">Pangkat/Golongan</div><div class="text-gray-700">{{ row.pangkat || '-' }}</div></div>
        </div>
        <div class="mb-4">
          <p class="text-[11px] font-medium text-gray-500 mb-1.5">Baris Sertifikat</p>
          <div v-if="certificateLine" class="inline-block bg-yellow-200 px-3 py-2 rounded-lg border border-yellow-300 shadow-sm">
            <span class="text-red-600 font-bold text-sm">{{ certificateLine }}</span>
          </div>
          <p v-else class="text-[11px] text-gray-400 italic">Jabatan/Unit Kerja belum diisi pengusul</p>
        </div>

        <div v-if="row.verifikasi_data_catatan" class="text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
          <span class="font-medium text-gray-600">Catatan sebelumnya:</span> <span class="text-gray-600">{{ row.verifikasi_data_catatan }}</span>
        </div>

        <VerifikasiPanel :saving="savingData" @approve="submitData('Disetujui')" @reject="(catatan) => submitData('Ditolak', catatan)" />
        <p v-if="errorData" class="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg mt-3">{{ errorData }}</p>
      </div>

      <!-- Panel: Berkas -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-gray-800">Berkas Dokumen</h3>
          <StatusBadge :status="row.verifikasi_berkas_status" />
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
          <div v-for="fc in fileColumns" :key="fc" class="border rounded-xl p-3" :class="row[fc] ? 'border-emerald-200 bg-emerald-50/40' : 'border-gray-200 bg-gray-50/50'">
            <div class="text-[11px] font-medium text-gray-700 mb-1.5">{{ labelMap[fc] }}</div>
            <button v-if="row[fc]" type="button" @click="openPreview('/verifikator/' + route.params.id + '/download/' + fc, row[fc])" class="text-[11px] text-emerald-600 hover:underline">Lihat berkas</button>
            <span v-else class="text-[11px] text-gray-400">Belum ada berkas</span>
          </div>
        </div>

        <div v-if="row.verifikasi_berkas_catatan" class="text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
          <span class="font-medium text-gray-600">Catatan sebelumnya:</span> <span class="text-gray-600">{{ row.verifikasi_berkas_catatan }}</span>
        </div>

        <VerifikasiPanel :saving="savingBerkas" @approve="submitBerkas('Disetujui')" @reject="(catatan) => submitBerkas('Ditolak', catatan)" />
        <p v-if="errorBerkas" class="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg mt-3">{{ errorBerkas }}</p>
      </div>
    </div>

    <FilePreviewModal :show="previewState.show" :api-url="previewState.apiUrl" :filename="previewState.filename" @close="closePreview" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '../../api/client';
import { buildCertificateLine } from '../../constants/certificate';
import StatusBadge from '../../components/shared/StatusBadge.vue';
import FilePreviewModal from '../../components/shared/FilePreviewModal.vue';
import VerifikasiPanel from '../../components/verifikator/VerifikasiPanel.vue';
import { useFilePreview } from '../../composables/useFilePreview';

const route = useRoute();
const { previewState, openPreview, closePreview } = useFilePreview();
const row = ref(null);
const loading = ref(true);
const savingData = ref(false);
const savingBerkas = ref(false);
const errorData = ref('');
const errorBerkas = ref('');

const fileColumns = ['file_kepka', 'file_ktp', 'file_drh', 'file_pengangkatan', 'file_keputusan_jabatan', 'file_piagam_x', 'file_piagam_xx', 'file_piagam_xxx', 'file_piagam_adibhakti', 'file_piagam_tokoh'];
const labelMap = { file_kepka: 'KEPKA', file_ktp: 'KTP', file_drh: 'DRH', file_pengangkatan: 'Pengangkatan', file_keputusan_jabatan: 'Kep. Jabatan', file_piagam_x: 'Piagam X', file_piagam_xx: 'Piagam XX', file_piagam_xxx: 'Piagam XXX', file_piagam_adibhakti: 'Adibhakti', file_piagam_tokoh: 'Tokoh' };

const certificateLine = computed(() => (row.value ? buildCertificateLine(row.value) : ''));

async function fetchData() {
  loading.value = true;
  try {
    const { data } = await api.get('/verifikator/' + route.params.id);
    row.value = data;
  } catch {
    row.value = null;
  } finally {
    loading.value = false;
  }
}

async function submitData(status, catatan) {
  errorData.value = ''; savingData.value = true;
  try {
    const { data } = await api.put('/verifikator/' + route.params.id + '/data', { status, catatan });
    row.value = data;
  } catch (err) {
    errorData.value = err.response?.data?.error || 'Gagal memverifikasi data';
  } finally { savingData.value = false; }
}

async function submitBerkas(status, catatan) {
  errorBerkas.value = ''; savingBerkas.value = true;
  try {
    const { data } = await api.put('/verifikator/' + route.params.id + '/berkas', { status, catatan });
    row.value = data;
  } catch (err) {
    errorBerkas.value = err.response?.data?.error || 'Gagal memverifikasi berkas';
  } finally { savingBerkas.value = false; }
}

onMounted(fetchData);
</script>
