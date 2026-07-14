<template>
  <div>
    <div class="mb-6">
      <h2 class="text-xl font-bold text-gray-800">Upload Berkas Usulan</h2>
      <p class="text-sm text-gray-500 mt-0.5">Lengkapi dokumen persyaratan untuk usulan penghargaan</p>
    </div>

    <!-- Data diri: read-only, sumbernya dari Profil Saya -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-semibold text-gray-800">Data Diri Pengusul</h3>
        <router-link to="/user/account" class="text-xs text-blue-600 hover:underline font-medium inline-flex items-center gap-1">
          Ubah di Profil Saya
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </router-link>
      </div>
      <div class="flex flex-wrap items-center gap-4 mb-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500">Verifikasi Data Pribadi:</span>
          <StatusBadge :status="identity.verifikasi_data_status" />
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500">Verifikasi Berkas:</span>
          <StatusBadge :status="identity.verifikasi_berkas_status" />
        </div>
      </div>
      <div v-if="identity.verifikasi_data_status === 'Ditolak'" class="text-xs bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700">
        <span class="font-medium">Data pribadi ditolak:</span> {{ identity.verifikasi_data_catatan || 'Tidak ada catatan.' }}
        Silakan perbaiki di <router-link to="/user/account" class="underline font-medium">Profil Saya</router-link>, lalu simpan untuk mengajukannya kembali.
      </div>
      <div v-if="identity.verifikasi_berkas_status === 'Ditolak'" class="text-xs bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700">
        <span class="font-medium">Berkas ditolak:</span> {{ identity.verifikasi_berkas_catatan || 'Tidak ada catatan.' }}
        Silakan ganti berkas yang bermasalah di bawah, lalu klik "Simpan Berkas" untuk mengajukannya kembali.
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <div class="text-[11px] text-gray-400 mb-0.5">NIP/NRP</div>
          <div class="text-gray-700 font-mono">{{ identity.nipnrp || '-' }}</div>
        </div>
        <div>
          <div class="text-[11px] text-gray-400 mb-0.5">Instansi</div>
          <div class="text-gray-700">{{ identity.instansi || '-' }}</div>
        </div>
        <div>
          <div class="text-[11px] text-gray-400 mb-0.5">Pangkat/Golongan</div>
          <div class="text-gray-700">{{ identity.pangkat || '-' }}</div>
        </div>
        <div v-if="identity.instansi === 'Pemerintah Daerah'">
          <div class="text-[11px] text-gray-400 mb-0.5">Wilayah Pemda</div>
          <div class="text-gray-700">{{ pemdaWilayah }}</div>
        </div>
      </div>

      <div class="mt-4">
        <p class="text-[11px] font-medium text-gray-500 mb-1.5">Pratinjau baris sertifikat</p>
        <div v-if="certificateLine" class="inline-block bg-yellow-200 px-3 py-2 rounded-lg border border-yellow-300 shadow-sm">
          <span class="text-red-600 font-bold text-sm">{{ certificateLine }}</span>
        </div>
        <p v-else class="text-[11px] text-gray-400 italic">Lengkapi Jabatan dan Unit Kerja di Profil Saya untuk melihat pratinjau</p>
      </div>

      <p class="text-[11px] text-gray-400 mt-3 flex items-center gap-1">
        <svg class="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
        Data pribadi tidak dapat diubah dari halaman ini — gunakan halaman Profil Saya.
      </p>
    </div>

    <!-- Profil belum lengkap: blokir form upload -->
    <div v-if="!loadingProfile && !profileComplete" class="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-3">
      <svg class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.72-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
      <div>
        <h3 class="text-sm font-semibold text-amber-800">Profil Anda Belum Lengkap</h3>
        <p class="text-xs text-amber-700 mt-1">Lengkapi data berikut di halaman Profil Saya sebelum dapat mengupload berkas usulan:</p>
        <ul class="text-xs text-amber-700 mt-2 list-disc list-inside space-y-0.5">
          <li v-for="f in missingFields" :key="f">{{ f }}</li>
        </ul>
        <router-link to="/user/account" class="inline-flex items-center gap-1 mt-3 text-sm font-medium text-amber-800 hover:underline">
          Lengkapi Profil Saya
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </router-link>
      </div>
    </div>

    <div v-else-if="!loadingProfile" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <form @submit.prevent="handleUpload" class="space-y-6">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Jenis Penghargaan yang Diusulkan</label>
          <select v-model="form.jenis_penghargaan" class="w-full sm:w-80 border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none bg-white">
            <option value="">Pilih jenis...</option>
            <option value="10 Tahun">Dharma Persandian 10 Tahun</option>
            <option value="20 Tahun">Dharma Persandian 20 Tahun</option>
            <option value="30 Tahun">Dharma Persandian 30 Tahun</option>
          </select>
        </div>

        <div class="border-t border-gray-100 pt-5">
          <div class="flex items-center justify-between mb-1">
            <h4 class="text-sm font-semibold text-gray-700">Dokumen Pendukung</h4>
            <span class="text-[11px] text-gray-400">{{ uploadedCount }}/{{ fileColumns.length }} berkas tersimpan</span>
          </div>
          <p class="text-xs text-gray-400 mb-4">Format PDF, DOC, DOCX, PNG, atau JPG — maksimal 2MB per berkas.</p>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
            <div
              v-for="fc in fileColumns"
              :key="fc"
              class="border rounded-xl p-3 transition"
              :class="selectedFiles[fc] ? 'border-blue-200 bg-blue-50/40' : existing[fc] ? 'border-emerald-200 bg-emerald-50/40' : 'border-gray-200 bg-gray-50/50'"
            >
              <div class="flex items-start gap-2.5">
                <div
                  class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  :class="selectedFiles[fc] ? 'bg-blue-100 text-blue-600' : existing[fc] ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-xs font-medium text-gray-700 truncate">{{ labelMap[fc] }}</div>
                  <div class="text-[11px] mt-0.5 truncate">
                    <span v-if="selectedFiles[fc]" class="text-blue-600">{{ selectedFiles[fc].name }} · {{ formatSize(selectedFiles[fc].size) }}</span>
                    <button v-else-if="existing[fc]" type="button" @click="openPreview('/user/self/usulan/download/' + fc, existing[fc])" class="text-emerald-600 hover:underline">
                      Berkas tersimpan · Lihat
                    </button>
                    <span v-else class="text-gray-400">Belum ada berkas</span>
                  </div>
                </div>
              </div>
              <p v-if="fileErrors[fc]" class="text-[11px] text-red-500 mt-2">{{ fileErrors[fc] }}</p>
              <div class="mt-2.5 flex items-center gap-2">
                <label class="flex-1 cursor-pointer text-center text-[11px] font-medium py-1.5 rounded-lg bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 transition">
                  {{ existing[fc] || selectedFiles[fc] ? 'Ganti Berkas' : 'Pilih Berkas' }}
                  <input type="file" class="hidden" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" @change="onFileChange(fc, $event)" />
                </label>
                <button v-if="selectedFiles[fc]" type="button" @click="clearFile(fc)" class="text-[11px] text-red-500 hover:underline flex-shrink-0">
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>

        <p v-if="formError" class="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{{ formError }}</p>
        <p v-if="formSuccess" class="text-sm text-emerald-700 bg-emerald-50 px-4 py-2 rounded-lg">{{ formSuccess }}</p>

        <div class="flex justify-end pt-3 border-t border-gray-100">
          <button type="submit" :disabled="saving" class="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50 shadow-sm">
            {{ saving ? 'Mengupload...' : 'Simpan Berkas' }}
          </button>
        </div>
      </form>
    </div>

    <FilePreviewModal :show="previewState.show" :api-url="previewState.apiUrl" :filename="previewState.filename" @close="closePreview" />
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue';
import api from '../../api/client';
import { buildCertificateLine } from '../../constants/certificate';
import { useFilePreview } from '../../composables/useFilePreview';
import StatusBadge from '../../components/shared/StatusBadge.vue';
import FilePreviewModal from '../../components/shared/FilePreviewModal.vue';

const { previewState, openPreview, closePreview } = useFilePreview();

const identity = reactive({
  email: '', hp: '', nipnrp: '', instansi: '', jabatan: '', unit_kerja: '', pangkat: '',
  pemda_tipe: '', pemda_provinsi: '', pemda_kabkota: '',
  verifikasi_data_status: '', verifikasi_data_catatan: '', verifikasi_berkas_status: '', verifikasi_berkas_catatan: '',
});
const pemdaWilayah = computed(() => [identity.pemda_tipe, identity.pemda_kabkota || identity.pemda_provinsi].filter(Boolean).join(' — ') || '-');
const certificateLine = computed(() => buildCertificateLine(identity));
const loadingProfile = ref(true);
const form = reactive({ jenis_penghargaan: '' });
const existing = reactive({});
const selectedFiles = reactive({});
const fileErrors = reactive({});
const formError = ref(''); const formSuccess = ref(''); const saving = ref(false);

const missingFields = computed(() => {
  const missing = [];
  if (!identity.email) missing.push('Email');
  if (!identity.hp) missing.push('No HP');
  if (!identity.instansi) missing.push('Instansi');
  if (!identity.jabatan) missing.push('Jabatan');
  if (!identity.unit_kerja) missing.push('Unit Kerja');
  if (!identity.pangkat) missing.push('Pangkat/Golongan');
  if (identity.instansi === 'Pemerintah Daerah') {
    if (!identity.pemda_tipe) missing.push('Jenis Pemerintah Daerah');
    if (!identity.pemda_provinsi) missing.push('Provinsi');
    if (identity.pemda_tipe && identity.pemda_tipe !== 'Pemerintah Provinsi' && !identity.pemda_kabkota) missing.push('Kabupaten/Kota');
  }
  return missing;
});
const profileComplete = computed(() => missingFields.value.length === 0);

const fileColumns = ['file_kepka', 'file_ktp', 'file_drh', 'file_pengangkatan', 'file_keputusan_jabatan', 'file_piagam_x', 'file_piagam_xx', 'file_piagam_xxx', 'file_piagam_adibhakti', 'file_piagam_tokoh'];
const labelMap = { file_kepka: 'KEPKA', file_ktp: 'KTP', file_drh: 'DRH', file_pengangkatan: 'Pengangkatan', file_keputusan_jabatan: 'Kep. Jabatan', file_piagam_x: 'Piagam X', file_piagam_xx: 'Piagam XX', file_piagam_xxx: 'Piagam XXX', file_piagam_adibhakti: 'Adibhakti', file_piagam_tokoh: 'Tokoh' };
const ALLOWED_EXT = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'];
const MAX_SIZE = 2 * 1024 * 1024;

const uploadedCount = computed(() => fileColumns.filter(fc => existing[fc] || selectedFiles[fc]).length);

function formatSize(bytes) {
  return bytes < 1024 * 1024 ? (bytes / 1024).toFixed(0) + ' KB' : (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function onFileChange(fc, event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  fileErrors[fc] = '';
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) {
    fileErrors[fc] = 'Format tidak didukung';
    return;
  }
  if (file.size > MAX_SIZE) {
    fileErrors[fc] = 'Ukuran melebihi 2MB';
    return;
  }
  selectedFiles[fc] = file;
}

function clearFile(fc) {
  delete selectedFiles[fc];
  fileErrors[fc] = '';
}

async function loadProfile() {
  try {
    const { data } = await api.get('/user/self/profile');
    if (!data) return;
    identity.email = data.email || '';
    identity.hp = data.hp || '';
    identity.nipnrp = data.nipnrp || '';
    identity.instansi = data.instansi || '';
    identity.jabatan = data.jabatan || '';
    identity.unit_kerja = data.unit_kerja || '';
    identity.pangkat = data.pangkat || '';
    identity.pemda_tipe = data.pemda_tipe || '';
    identity.pemda_provinsi = data.pemda_provinsi || '';
    identity.pemda_kabkota = data.pemda_kabkota || '';
    identity.verifikasi_data_status = data.verifikasi_data_status || '';
    identity.verifikasi_data_catatan = data.verifikasi_data_catatan || '';
    identity.verifikasi_berkas_status = data.verifikasi_berkas_status || '';
    identity.verifikasi_berkas_catatan = data.verifikasi_berkas_catatan || '';
    form.jenis_penghargaan = data.jenis_penghargaan || '';
    fileColumns.forEach(fc => { existing[fc] = data[fc] || ''; });
  } finally {
    loadingProfile.value = false;
  }
}

onMounted(() => { loadProfile().catch(() => {}); });

async function handleUpload() {
  saving.value = true; formError.value = ''; formSuccess.value = '';
  const wasRejected = identity.verifikasi_berkas_status === 'Ditolak';
  const hadNewFiles = Object.keys(selectedFiles).length > 0;
  try {
    const fd = new FormData();
    fd.append('nipnrp', identity.nipnrp);
    if (form.jenis_penghargaan) fd.append('jenis_penghargaan', form.jenis_penghargaan);
    for (const [fc, file] of Object.entries(selectedFiles)) fd.append(fc, file);

    await api.put('/user/self/usulan', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    for (const fc of Object.keys(selectedFiles)) delete selectedFiles[fc];
    await loadProfile();
    formSuccess.value = wasRejected && hadNewFiles && identity.verifikasi_berkas_status !== 'Ditolak'
      ? 'Berkas berhasil diupload dan diajukan ulang untuk verifikasi.'
      : 'Berkas berhasil diupload!';
  } catch (err) {
    formError.value = err.response?.data?.error || 'Gagal upload';
  } finally { saving.value = false; }
}
</script>
