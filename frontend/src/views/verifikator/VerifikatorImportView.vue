<template>
  <div>
    <div class="mb-6">
      <h2 class="text-xl font-bold text-gray-800">Usulan Massal</h2>
      <p class="text-sm text-gray-500 mt-0.5">Unggah daftar calon penerima Dharma Persandian dari surat usulan instansi Anda</p>
    </div>

    <!-- Step: Upload -->
    <div v-if="step === 'upload'" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-2xl">
      <div class="mb-4">
        <label class="block text-xs font-medium text-gray-600 mb-1">Instansi</label>
        <select v-if="scope.length > 1" v-model="selectedInstansi" class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none bg-white">
          <option value="" disabled>Pilih instansi</option>
          <option v-for="i in scope" :key="i" :value="i">{{ i }}</option>
        </select>
        <div v-else class="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">{{ scope[0] || 'Tidak ada cakupan instansi' }}</div>
      </div>

      <div class="mb-4 bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
        <p class="text-xs text-gray-600 mb-2">Unduh template terlebih dahulu, isi daftar calon sesuai format, lalu unggah kembali di sini.</p>
        <button type="button" @click="downloadTemplate" :disabled="downloadingTemplate" class="text-xs font-medium text-indigo-700 bg-white border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition disabled:opacity-50">
          {{ downloadingTemplate ? 'Menyiapkan...' : 'Unduh Template (.xlsx)' }}
        </button>
      </div>

      <div class="mb-4">
        <label class="block text-xs font-medium text-gray-600 mb-1">File Template (.xlsx)</label>
        <input ref="fileInput" type="file" accept=".xlsx" @change="onFileChange" class="w-full text-sm border border-gray-300 rounded-xl px-3 py-2 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 file:text-xs" />
      </div>

      <p v-if="uploadError" class="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg mb-4">{{ uploadError }}</p>

      <button type="button" @click="uploadFile" :disabled="uploading || !file || !selectedInstansi" class="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50">
        {{ uploading ? 'Memproses...' : 'Upload & Pratinjau' }}
      </button>
    </div>

    <!-- Step: Preview -->
    <div v-else-if="step === 'preview'" class="space-y-4">
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-4 items-center text-xs">
        <span class="font-medium text-gray-700">Instansi: {{ batch.instansi }}</span>
        <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">{{ counts.valid }} Valid</span>
        <span class="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">{{ counts.duplicate }} Duplikat/Update</span>
        <span class="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">{{ counts.error }} Error</span>
        <span v-if="counts.error > 0" class="text-gray-400">Baris Error akan dilewati (skip) saat konfirmasi kecuali diperbaiki.</span>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[1000px]">
            <thead><tr class="bg-gray-50 text-left">
              <th class="p-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">#</th>
              <th class="p-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Nama / NIP</th>
              <th class="p-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Email</th>
              <th class="p-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Jabatan</th>
              <th class="p-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Pangkat</th>
              <th class="p-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap text-center">Status</th>
              <th class="p-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap text-right">Aksi</th>
            </tr></thead>
            <tbody class="divide-y divide-gray-100">
              <template v-for="row in batch.rows" :key="row.id">
                <tr v-if="editingRowId !== row.id" class="hover:bg-gray-50 transition text-xs align-top">
                  <td class="p-3 text-gray-400">{{ row.row_number }}</td>
                  <td class="p-3"><div class="font-medium text-gray-800">{{ row.nama }}</div><div class="text-gray-400 font-mono text-[10px]">{{ row.nipnrp }}</div></td>
                  <td class="p-3 text-gray-600">{{ row.email }}</td>
                  <td class="p-3 text-gray-600">{{ row.jabatan }}</td>
                  <td class="p-3 text-gray-600">{{ row.pangkat }}</td>
                  <td class="p-3 text-center">
                    <span class="px-2 py-0.5 text-[10px] rounded-full font-medium" :class="rowStatusClass(row.row_status)">{{ rowStatusLabel(row.row_status) }}</span>
                    <div v-if="row.errors && row.errors.length" class="text-[10px] text-red-500 mt-1">{{ row.errors.map(e => e.message).join('; ') }}</div>
                  </td>
                  <td class="p-3 text-right"><button type="button" @click="startEdit(row)" class="text-[11px] font-medium text-indigo-700 hover:underline">Edit</button></td>
                </tr>
                <tr v-else class="bg-indigo-50/40 text-xs">
                  <td class="p-3 text-gray-400 align-top">{{ row.row_number }}</td>
                  <td colspan="6" class="p-3">
                    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      <div><label class="block text-[10px] text-gray-500 mb-1">Nama</label><input v-model="editForm.nama" class="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs" /></div>
                      <div><label class="block text-[10px] text-gray-500 mb-1">NIP/NRP</label><input v-model="editForm.nipnrp" class="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs" /></div>
                      <div><label class="block text-[10px] text-gray-500 mb-1">Email</label><input v-model="editForm.email" class="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs" /></div>
                      <div><label class="block text-[10px] text-gray-500 mb-1">No HP</label><input v-model="editForm.hp" class="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs" /></div>
                      <div><label class="block text-[10px] text-gray-500 mb-1">Jabatan</label><input v-model="editForm.jabatan" class="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs" /></div>
                      <div><label class="block text-[10px] text-gray-500 mb-1">Unit Kerja</label><input v-model="editForm.unit_kerja" class="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs" /></div>
                      <div><label class="block text-[10px] text-gray-500 mb-1">Jenis Penghargaan</label><input v-model="editForm.jenis_penghargaan" class="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs" /></div>
                      <div>
                        <label class="block text-[10px] text-gray-500 mb-1">Pangkat/Golongan</label>
                        <select v-model="editForm.pangkat" class="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white">
                          <option value="" disabled>Pilih</option>
                          <option v-for="p in ALL_PANGKAT" :key="p" :value="p">{{ p }}</option>
                        </select>
                      </div>
                      <template v-if="batch.instansi === 'Pemerintah Daerah'">
                        <div>
                          <label class="block text-[10px] text-gray-500 mb-1">Tipe Pemda</label>
                          <select v-model="editForm.pemda_tipe" class="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white">
                            <option value="" disabled>Pilih</option>
                            <option value="Pemerintah Provinsi">Provinsi</option>
                            <option value="Pemerintah Kabupaten">Kabupaten</option>
                            <option value="Pemerintah Kota">Kota</option>
                          </select>
                        </div>
                        <div>
                          <label class="block text-[10px] text-gray-500 mb-1">Provinsi</label>
                          <select v-model="editForm.pemda_provinsi" class="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white">
                            <option value="" disabled>Pilih</option>
                            <option v-for="p in PROVINCES" :key="p.id" :value="p.name">{{ p.name }}</option>
                          </select>
                        </div>
                        <div v-if="editForm.pemda_tipe === 'Pemerintah Kabupaten' || editForm.pemda_tipe === 'Pemerintah Kota'">
                          <label class="block text-[10px] text-gray-500 mb-1">Kabupaten/Kota</label>
                          <select v-model="editForm.pemda_kabkota" class="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white">
                            <option value="" disabled>Pilih</option>
                            <option v-for="r in editRegencyOptions" :key="r.id" :value="r.name">{{ r.name }}</option>
                          </select>
                        </div>
                      </template>
                    </div>
                    <p v-if="editError" class="text-[11px] text-red-600 mt-2">{{ editError }}</p>
                    <div class="mt-3 flex gap-2">
                      <button type="button" @click="saveEdit(row)" :disabled="savingRow" class="px-3 py-1.5 text-[11px] font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">{{ savingRow ? 'Menyimpan...' : 'Simpan' }}</button>
                      <button type="button" @click="editingRowId = null" class="px-3 py-1.5 text-[11px] font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition">Batal</button>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>

      <p v-if="confirmError" class="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{{ confirmError }}</p>
      <div class="flex gap-3">
        <button type="button" @click="doConfirm" :disabled="confirming" class="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50">
          {{ confirming ? 'Memproses...' : 'Konfirmasi & Buat Akun' }}
        </button>
        <button type="button" @click="doDiscard" class="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition">Batalkan</button>
      </div>
    </div>

    <!-- Step: Result -->
    <div v-else-if="step === 'result'" class="space-y-4">
      <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800">
        Email otomatis belum aktif — mohon sampaikan kredensial berikut ini secara manual kepada masing-masing calon.
      </div>
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[900px]">
            <thead><tr class="bg-gray-50 text-left">
              <th class="p-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Nama</th>
              <th class="p-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Hasil</th>
              <th class="p-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Kredensial</th>
              <th class="p-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Email</th>
            </tr></thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="row in result.rows" :key="row.id" class="text-xs">
                <td class="p-3"><div class="font-medium text-gray-800">{{ row.nama }}</div><div class="text-gray-400 font-mono text-[10px]">{{ row.nipnrp }}</div></td>
                <td class="p-3"><span class="px-2 py-0.5 text-[10px] rounded-full font-medium" :class="resultStatusClass(row.result_status)">{{ row.result_status }}</span></td>
                <td class="p-3">
                  <div v-if="row.generated_username" class="font-mono text-[11px] text-gray-700">
                    <div>user: {{ row.generated_username }}</div>
                    <div class="flex items-center gap-1.5">pass: {{ row.generated_password_plain }}
                      <button type="button" @click="copyCreds(row)" class="text-indigo-600 hover:underline text-[10px]">salin</button>
                    </div>
                  </div>
                  <span v-else class="text-gray-400">-</span>
                </td>
                <td class="p-3">
                  <span v-if="row.email_status" class="px-2 py-0.5 text-[10px] rounded-full font-medium" :class="row.email_status === 'Sent' ? 'bg-emerald-100 text-emerald-700' : row.email_status === 'Failed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'">{{ row.email_status }}</span>
                  <span v-else class="text-gray-400">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <button type="button" @click="resetToUpload" class="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition">Impor Batch Baru</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import api from '../../api/client';
import { PANGKAT_TNI_AD, PANGKAT_TNI_AU, PANGKAT_TNI_AL, PANGKAT_POLRI, PANGKAT_PNS } from '../../constants/rank-data';
import { PROVINCES, REGENCIES } from '../../constants/wilayah';

const ALL_PANGKAT = [...new Set([...PANGKAT_TNI_AD, ...PANGKAT_TNI_AU, ...PANGKAT_TNI_AL, ...PANGKAT_POLRI, ...PANGKAT_PNS])];

const step = ref('upload');
const scope = ref([]);
const selectedInstansi = ref('');
const fileInput = ref(null);
const file = ref(null);
const uploading = ref(false);
const uploadError = ref('');
const downloadingTemplate = ref(false);

const batch = ref(null);
const editingRowId = ref(null);
const editForm = reactive({ nama: '', nipnrp: '', email: '', hp: '', jabatan: '', unit_kerja: '', pangkat: '', jenis_penghargaan: '', pemda_tipe: '', pemda_provinsi: '', pemda_kabkota: '' });
const editError = ref('');
const savingRow = ref(false);
const confirming = ref(false);
const confirmError = ref('');
const result = ref(null);

const counts = computed(() => {
  const rows = batch.value?.rows || [];
  return {
    valid: rows.filter((r) => r.row_status === 'Valid').length,
    duplicate: rows.filter((r) => r.row_status === 'DuplicateUpdate').length,
    error: rows.filter((r) => r.row_status === 'Error').length,
  };
});

const editRegencyOptions = computed(() => {
  const type = editForm.pemda_tipe === 'Pemerintah Kota' ? 'Kota' : 'Kabupaten';
  return REGENCIES.filter((r) => r.provinceName === editForm.pemda_provinsi && r.type === type);
});

function rowStatusLabel(status) {
  return { Valid: 'Valid', Error: 'Error', DuplicateUpdate: 'Duplikat/Update' }[status] || status;
}
function rowStatusClass(status) {
  return { Valid: 'bg-emerald-100 text-emerald-700', Error: 'bg-red-100 text-red-700', DuplicateUpdate: 'bg-blue-100 text-blue-700' }[status] || 'bg-gray-100 text-gray-500';
}
function resultStatusClass(status) {
  return {
    Created: 'bg-emerald-100 text-emerald-700', Updated: 'bg-blue-100 text-blue-700',
    Skipped: 'bg-gray-100 text-gray-500', Failed: 'bg-red-100 text-red-700',
  }[status] || 'bg-gray-100 text-gray-500';
}

async function downloadTemplate() {
  downloadingTemplate.value = true;
  try {
    const res = await api.get('/verifikator/import/template', { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url; a.download = 'template-usulan-dharma-persandian.xlsx';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  } catch {
    uploadError.value = 'Gagal mengunduh template';
  } finally { downloadingTemplate.value = false; }
}

function onFileChange(e) { file.value = e.target.files[0] || null; }

async function uploadFile() {
  uploadError.value = ''; uploading.value = true;
  try {
    const fd = new FormData();
    fd.append('file', file.value);
    fd.append('instansi', selectedInstansi.value);
    const { data } = await api.post('/verifikator/import/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    batch.value = data;
    step.value = 'preview';
  } catch (err) {
    uploadError.value = err.response?.data?.error || 'Gagal memproses file';
  } finally { uploading.value = false; }
}

function startEdit(row) {
  editingRowId.value = row.id;
  editError.value = '';
  Object.assign(editForm, {
    nama: row.nama || '', nipnrp: row.nipnrp || '', email: row.email || '', hp: row.hp || '',
    jabatan: row.jabatan || '', unit_kerja: row.unit_kerja || '', pangkat: row.pangkat || '',
    jenis_penghargaan: row.jenis_penghargaan || '',
    pemda_tipe: row.pemda_tipe || '', pemda_provinsi: row.pemda_provinsi || '', pemda_kabkota: row.pemda_kabkota || '',
  });
}

async function saveEdit(row) {
  editError.value = ''; savingRow.value = true;
  try {
    const { data } = await api.put('/verifikator/import/batches/' + batch.value.id + '/rows/' + row.id, { ...editForm });
    const idx = batch.value.rows.findIndex((r) => r.id === row.id);
    if (idx !== -1) batch.value.rows[idx] = data;
    editingRowId.value = null;
  } catch (err) {
    editError.value = err.response?.data?.error || 'Gagal menyimpan baris';
  } finally { savingRow.value = false; }
}

async function doConfirm() {
  confirmError.value = ''; confirming.value = true;
  try {
    const { data } = await api.post('/verifikator/import/batches/' + batch.value.id + '/confirm');
    result.value = data;
    step.value = 'result';
  } catch (err) {
    confirmError.value = err.response?.data?.error || 'Gagal mengonfirmasi batch';
  } finally { confirming.value = false; }
}

async function doDiscard() {
  try {
    await api.delete('/verifikator/import/batches/' + batch.value.id);
  } catch { /* ignore, resetting the view regardless */ }
  resetToUpload();
}

function resetToUpload() {
  step.value = 'upload';
  batch.value = null; result.value = null; file.value = null;
  if (fileInput.value) fileInput.value.value = '';
  editingRowId.value = null;
  uploadError.value = ''; confirmError.value = '';
}

function copyCreds(row) {
  const text = `Username: ${row.generated_username}\nPassword: ${row.generated_password_plain}`;
  navigator.clipboard?.writeText(text);
}

onMounted(async () => {
  try {
    const { data } = await api.get('/verifikator/scope');
    scope.value = data.instansi || [];
    if (scope.value.length === 1) selectedInstansi.value = scope.value[0];
  } catch { /* leave scope empty */ }
});
</script>
