<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4">
      <div class="absolute inset-0 bg-black/60" @click="$emit('close')"></div>
      <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl h-[92vh] sm:h-[85vh] flex flex-col overflow-hidden">
        <div class="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <h3 class="text-sm font-semibold text-gray-800 truncate">{{ filename }}</h3>
          <div class="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              @click="download"
              :disabled="!objectUrl"
              class="text-xs px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition disabled:opacity-40"
            >
              Unduh
            </button>
            <button type="button" @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <div class="flex-1 relative bg-gray-100 overflow-auto">
          <div v-if="loading" class="absolute inset-0 flex items-center justify-center text-gray-400 text-sm animate-pulse">
            Memuat berkas...
          </div>

          <div v-else-if="error" class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-500 text-sm p-6 text-center">
            <p>{{ error }}</p>
          </div>

          <template v-else-if="objectUrl">
            <iframe v-if="kind === 'pdf'" :src="objectUrl" class="w-full h-full border-0" title="Pratinjau berkas"></iframe>
            <div v-else-if="kind === 'image'" class="flex items-center justify-center min-h-full p-4">
              <img :src="objectUrl" :alt="filename" class="max-w-full max-h-full object-contain" />
            </div>
            <div v-else class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-500 text-sm p-6 text-center">
              <p>Format berkas ini (Word/dokumen) tidak bisa dipratinjau langsung di browser.</p>
              <button type="button" @click="download" class="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition">
                Unduh Berkas
              </button>
            </div>
          </template>

          <p v-if="kind === 'pdf' && !loading && !error" class="absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] text-gray-400 bg-white/80 px-2 py-1 rounded">
            Pratinjau tidak muncul? Gunakan tombol Unduh di atas.
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import api from '../../api/client';

const props = defineProps({
  show: Boolean,
  apiUrl: String,
  filename: String,
});
defineEmits(['close']);

const loading = ref(false);
const error = ref('');
const objectUrl = ref('');
const blobRef = ref(null);

const kind = computed(() => {
  const name = props.filename || '';
  const ext = '.' + name.split('.').pop().toLowerCase();
  if (ext === '.pdf') return 'pdf';
  if (['.png', '.jpg', '.jpeg'].includes(ext)) return 'image';
  return 'other';
});

function revoke() {
  if (objectUrl.value) {
    URL.revokeObjectURL(objectUrl.value);
    objectUrl.value = '';
  }
  blobRef.value = null;
}

async function load() {
  revoke();
  error.value = '';
  loading.value = true;
  try {
    const res = await api.get(props.apiUrl, { responseType: 'blob' });
    blobRef.value = res.data;
    objectUrl.value = URL.createObjectURL(res.data);
  } catch {
    error.value = 'Gagal memuat berkas.';
  } finally {
    loading.value = false;
  }
}

function download() {
  if (!blobRef.value) return;
  const url = URL.createObjectURL(blobRef.value);
  const a = document.createElement('a');
  a.href = url; a.download = props.filename || 'berkas';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

watch(() => props.show, (val) => {
  if (val) load();
  else revoke();
});
</script>
