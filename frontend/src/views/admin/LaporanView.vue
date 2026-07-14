<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <h2 class="text-xl font-bold text-gray-800">Laporan Kegiatan</h2>
        <p class="text-sm text-gray-500 mt-0.5">Kelola data laporan kegiatan</p>
      </div>
      <button @click="openAdd" class="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition shadow-sm">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Tambah Data
      </button>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-5 flex flex-wrap gap-4 items-end">
      <div>
        <label class="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Tahun</label>
        <select v-model="filter.tahun" @change="fetchData" class="border border-gray-300 rounded-xl px-3 py-2 text-sm min-w-[140px] focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none bg-white">
          <option value="">Semua Tahun</option>
          <option v-for="y in filters.tahun" :key="y" :value="y">{{ y }}</option>
        </select>
      </div>
      <div>
        <label class="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Jenis</label>
        <select v-model="filter.jenis" @change="fetchData" class="border border-gray-300 rounded-xl px-3 py-2 text-sm min-w-[160px] focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none bg-white">
          <option value="">Semua Jenis</option>
          <option v-for="j in filters.jenis" :key="j" :value="j">{{ j }}</option>
        </select>
      </div>
      
      <button @click="resetFilters" class="px-4 py-2 text-sm border border-gray-300 rounded-xl hover:bg-gray-50 transition text-gray-600 self-end">Reset</button>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead><tr class="bg-gray-50 text-left"><th class="p-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama</th><th class="p-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tahun</th><th class="p-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Jenis</th><th class="p-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">File</th><th class="p-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Aksi</th></tr></thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="loading"><td :colspan="5" class="p-12 text-center text-gray-400"><div class="animate-pulse">Memuat data...</div></td></tr>
            <tr v-else-if="data.length===0"><td :colspan="5" class="p-12 text-center text-gray-400">Belum ada data</td></tr>
            <tr v-for="row in data" :key="row.id" class="hover:bg-gray-50 transition">
              <td class="p-3.5 text-sm font-medium text-gray-800">{{ row.nama_laporan }}</td>
              <td class="p-3.5 text-sm text-gray-600">{{ row.tahun_laporan }}</td>
              <td class="p-3.5"><span class="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700 font-medium">{{ row.jenis_laporan }}</span></td>
              
              <td class="p-3.5">
                <button type="button" v-if="row.file_laporan" @click="openPreview('/laporan/' + row.id + '/download', row.file_laporan)" class="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  Lihat
                </button>
                <span v-else class="text-gray-300 text-xs">-</span>
              </td>
              <td class="p-3.5">
                <div class="flex justify-end gap-1">
                  <button @click="openEdit(row)" class="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition">Edit</button>
                  <button @click="confirmDelete(row)" class="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition">Hapus</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add Modal -->
    <Teleport to="body"><div v-if="showAdd" class="fixed inset-0 z-50 flex items-center justify-center p-4"><div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showAdd=false"></div><div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"><div class="p-6"><div class="flex items-center justify-between mb-5"><h3 class="text-lg font-bold text-gray-800">Tambah Laporan Kegiatan</h3><button @click="showAdd=false" class="text-gray-400 hover:text-gray-600"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button></div><form @submit.prevent="handleAdd" class="space-y-3"><div><label class="block text-xs font-medium text-gray-600 mb-1">Nama <span class="text-red-500">*</span></label><input v-model="form.nama_laporan" required class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"/></div><div><label class="block text-xs font-medium text-gray-600 mb-1">Tahun</label><input v-model="form.tahun_laporan" type="number" class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"/></div><div><label class="block text-xs font-medium text-gray-600 mb-1">Jenis</label><input v-model="form.jenis_laporan" class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"/></div><div><label class="block text-xs font-medium text-gray-600 mb-1">File</label><input type="file" ref="fileInput" class="w-full text-sm text-gray-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 file:border-0 hover:file:bg-blue-100"/></div><p v-if="formError" class="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{{ formError }}</p><div class="flex justify-end gap-3 pt-3"><button type="button" @click="showAdd=false" class="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition">Batal</button><button type="submit" :disabled="saving" class="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">{{ saving ? 'Menyimpan...' : 'Simpan' }}</button></div></form></div></div></div></Teleport>

    <!-- Edit Modal -->
    <Teleport to="body"><div v-if="showEdit" class="fixed inset-0 z-50 flex items-center justify-center p-4"><div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showEdit=false"></div><div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"><div class="p-6"><div class="flex items-center justify-between mb-5"><h3 class="text-lg font-bold text-gray-800">Edit Laporan Kegiatan</h3><button @click="showEdit=false" class="text-gray-400 hover:text-gray-600"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button></div><form @submit.prevent="handleEdit" class="space-y-3"><div><label class="block text-xs font-medium text-gray-600 mb-1">Nama</label><input v-model="editForm.nama_laporan" required class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"/></div><div><label class="block text-xs font-medium text-gray-600 mb-1">Tahun</label><input v-model="editForm.tahun_laporan" type="number" class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"/></div><div><label class="block text-xs font-medium text-gray-600 mb-1">Jenis</label><input v-model="editForm.jenis_laporan" class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"/></div><div><label class="block text-xs font-medium text-gray-600 mb-1">File Baru <span class="text-gray-400 font-normal">(kosongkan jika tidak diubah)</span></label><div v-if="editForm.file_laporan" class="text-xs text-green-600 mb-1 truncate">File: {{ editForm.file_laporan }}</div><input type="file" ref="editFileInput" class="w-full text-sm text-gray-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 file:border-0 hover:file:bg-blue-100"/></div><p v-if="formError" class="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{{ formError }}</p><div class="flex justify-end gap-3 pt-3"><button type="button" @click="showEdit=false" class="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition">Batal</button><button type="submit" :disabled="saving" class="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">{{ saving ? 'Menyimpan...' : 'Update' }}</button></div></form></div></div></div></Teleport>

    <ConfirmModal :show="showConfirm" message="Hapus data ini?" @close="showConfirm=false" @confirm="handleDelete" />
    <FilePreviewModal :show="previewState.show" :api-url="previewState.apiUrl" :filename="previewState.filename" @close="closePreview" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import api from '../../api/client';
import ConfirmModal from '../../components/shared/ConfirmModal.vue';
import FilePreviewModal from '../../components/shared/FilePreviewModal.vue';
import { useFilePreview } from '../../composables/useFilePreview';
const { previewState, openPreview, closePreview } = useFilePreview();

const data = ref([]);
const filters = ref({ tahun: [], jenis: [] });
const filter = reactive({ tahun: '', jenis: '' });
const loading = ref(true);
const showAdd = ref(false); const showEdit = ref(false); const showConfirm = ref(false);
const formError = ref(''); const saving = ref(false); const deleteId = ref(null);
const fileInput = ref(null); const editFileInput = ref(null);

const form = reactive({ nama_laporan: '', tahun_laporan: '', jenis_laporan: '' });
const editForm = reactive({ id: null, nama_laporan: '', tahun_laporan: '', jenis_laporan: '', file_laporan: '' });

async function fetchData() {
  try {
    const params = {};
    if (filter.tahun) params.tahun = filter.tahun;
    if (filter.jenis) params.jenis = filter.jenis;

    const { data: d } = await api.get('/laporan', { params });
    data.value = d;
  } finally { loading.value = false; }
}

async function fetchFilters() { const { data: d } = await api.get('/laporan/filters'); filters.value = d; }

function resetFilters() { filter.tahun = ''; filter.jenis = '';  fetchData(); }

function openAdd() { formError.value = ''; Object.assign(form, { nama_laporan: '', tahun_laporan: '', jenis_laporan: '' }); showAdd.value = true; }

async function handleAdd() {
  saving.value = true; formError.value = '';
  try {
    const fd = new FormData();
    for (const [k,v] of Object.entries(form)) if (v) fd.append(k, v);
    if (fileInput.value?.files?.[0]) fd.append('file_laporan', fileInput.value.files[0]);
    await api.post('/laporan', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    showAdd.value = false; loading.value = true; await fetchData();
  } catch (err) { formError.value = err.response?.data?.error || 'Gagal'; }
  finally { saving.value = false; }
}

function openEdit(row) { formError.value = ''; Object.assign(editForm, row); editForm.id = row.id; editFileInput.value = null; showEdit.value = true; }

async function handleEdit() {
  saving.value = true; formError.value = '';
  try {
    const fd = new FormData();
    const skip = ['id', 'file_laporan'];
    for (const [k,v] of Object.entries(editForm)) { if (!skip.includes(k) && v) fd.append(k, v); }
    if (editFileInput.value?.files?.[0]) fd.append('file_laporan', editFileInput.value.files[0]);
    await api.put('/laporan/' + editForm.id, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    showEdit.value = false; loading.value = true; await fetchData();
  } catch (err) { formError.value = err.response?.data?.error || 'Gagal'; }
  finally { saving.value = false; }
}

function confirmDelete(row) { deleteId.value = row.id; showConfirm.value = true; }

async function handleDelete() { await api.delete('/laporan/' + deleteId.value); showConfirm.value = false; loading.value = true; await fetchData(); }

onMounted(() => { fetchData(); fetchFilters(); });
</script>
