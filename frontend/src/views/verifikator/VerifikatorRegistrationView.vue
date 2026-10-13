<template>
  <div class="max-w-2xl">
    <div class="mb-6">
      <h2 class="text-xl font-bold text-gray-800">Registrasi Perwakilan Instansi</h2>
      <p class="text-sm text-gray-500 mt-0.5">Upload surat usulan (PDF) untuk direview Admin</p>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div class="flex items-center gap-2 mb-4">
        <span class="text-xs text-gray-500">Status:</span>
        <span class="px-2 py-0.5 text-[11px] rounded-full font-medium" :class="statusClass">{{ status.reg_status || 'Menunggu' }}</span>
      </div>

      <div v-if="status.reg_status === 'Pending'" class="text-xs bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-amber-700">
        Berkas Anda sedang direview Admin. Akses fitur Verifikator (antrian, usulan massal) akan terbuka setelah disetujui.
      </div>
      <div v-if="status.reg_status === 'Ditolak'" class="text-xs bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700">
        <span class="font-medium">Registrasi ditolak:</span> {{ status.reg_catatan || 'Tidak ada catatan.' }}
        Silakan perbaiki berkas dan upload ulang di bawah ini.
      </div>

      <form @submit.prevent="handleUpload" class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Surat Usulan (PDF) <span class="text-red-500">*</span></label>
          <div v-if="status.reg_file_surat_usulan" class="text-[11px] text-emerald-600 mb-1">
            <button type="button" @click="openPreview('/verifikator/registration/download/surat_usulan', status.reg_file_surat_usulan)" class="hover:underline">Berkas tersimpan · Lihat</button>
          </div>
          <input ref="suratInput" type="file" accept=".pdf" class="w-full text-sm border border-gray-300 rounded-xl px-3 py-2 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 file:text-xs" />
        </div>
        <p v-if="formError" class="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{{ formError }}</p>
        <p v-if="formSuccess" class="text-sm text-emerald-700 bg-emerald-50 px-4 py-2 rounded-lg">{{ formSuccess }}</p>

        <button type="submit" :disabled="saving" class="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50">
          {{ saving ? 'Mengupload...' : (status.reg_file_surat_usulan ? 'Upload Ulang' : 'Upload') }}
        </button>
      </form>
    </div>

    <FilePreviewModal :show="previewState.show" :api-url="previewState.apiUrl" :filename="previewState.filename" @close="closePreview" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import api from '../../api/client';
import { useAuthStore } from '../../stores/auth';
import { useFilePreview } from '../../composables/useFilePreview';
import FilePreviewModal from '../../components/shared/FilePreviewModal.vue';

const authStore = useAuthStore();
const { previewState, openPreview, closePreview } = useFilePreview();

const status = reactive({ reg_status: '', reg_catatan: '', reg_file_surat_usulan: '', reg_file_excel_usulan: '' });
const suratInput = ref(null);
const saving = ref(false);
const formError = ref('');
const formSuccess = ref('');

const statusClass = computed(() => ({
  Pending: 'bg-amber-100 text-amber-700',
  Disetujui: 'bg-emerald-100 text-emerald-700',
  Ditolak: 'bg-red-100 text-red-700',
}[status.reg_status] || 'bg-gray-100 text-gray-500'));

async function loadStatus() {
  try {
    const { data } = await api.get('/verifikator/registration');
    Object.assign(status, data);
  } catch { /* ignore */ }
}

async function handleUpload() {
  formError.value = ''; formSuccess.value = '';
  const suratFile = suratInput.value?.files?.[0];
  if (!status.reg_file_surat_usulan && !suratFile) { formError.value = 'Surat usulan wajib diupload'; return; }

  saving.value = true;
  try {
    const fd = new FormData();
    if (suratFile) fd.append('file_surat_usulan', suratFile);
    await api.put('/verifikator/registration', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    await loadStatus();
    await authStore.checkAuth();
    if (suratInput.value) suratInput.value.value = '';
    formSuccess.value = 'Berkas berhasil diupload dan menunggu review Admin.';
  } catch (err) {
    formError.value = err.response?.data?.error || 'Gagal upload berkas';
  } finally { saving.value = false; }
}

onMounted(loadStatus);
</script>
