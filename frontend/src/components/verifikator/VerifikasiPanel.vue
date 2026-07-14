<template>
  <div class="flex flex-col sm:flex-row gap-3 items-start border-t border-gray-100 pt-4">
    <div class="flex-1 w-full">
      <textarea
        v-model="catatan"
        placeholder="Catatan (wajib diisi jika menolak)"
        rows="2"
        class="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
      ></textarea>
      <p v-if="showCatatanError" class="text-[11px] text-red-500 mt-1">Catatan wajib diisi saat menolak</p>
    </div>
    <div class="flex gap-2 flex-shrink-0">
      <button type="button" @click="handleApprove" :disabled="saving" class="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50">
        Setujui
      </button>
      <button type="button" @click="handleReject" :disabled="saving" class="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition disabled:opacity-50">
        Tolak
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
defineProps({ saving: Boolean });
const emit = defineEmits(['approve', 'reject']);
const catatan = ref('');
const showCatatanError = ref(false);

function handleApprove() {
  showCatatanError.value = false;
  emit('approve');
}
function handleReject() {
  if (!catatan.value.trim()) { showCatatanError.value = true; return; }
  showCatatanError.value = false;
  emit('reject', catatan.value.trim());
}
</script>
