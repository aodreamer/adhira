<template>
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
    <div>
      <template v-if="totalItems > 0">
        Menampilkan {{ start }} - {{ end }} dari {{ totalItems }} baris
      </template>
      <template v-else>Tidak ada data</template>
    </div>
    <div class="flex items-center gap-2">
      <select
        :value="pageSize"
        @change="$emit('update:pageSize', Number($event.target.value))"
        class="border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
      >
        <option v-for="n in pageSizeOptions" :key="n" :value="n">{{ n }} / halaman</option>
      </select>
      <button
        type="button"
        :disabled="page <= 1"
        @click="$emit('update:page', page - 1)"
        class="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
      >Sebelumnya</button>
      <span class="text-xs text-gray-400 whitespace-nowrap">Hal. {{ page }} / {{ totalPages }}</span>
      <button
        type="button"
        :disabled="page >= totalPages"
        @click="$emit('update:page', page + 1)"
        class="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
      >Berikutnya</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  totalItems: { type: Number, required: true },
  pageSize: { type: Number, required: true },
  pageSizeOptions: { type: Array, default: () => [10, 25, 50, 100] },
});
defineEmits(['update:page', 'update:pageSize']);

const start = computed(() => (props.totalItems === 0 ? 0 : (props.page - 1) * props.pageSize + 1));
const end = computed(() => Math.min(props.page * props.pageSize, props.totalItems));
</script>
