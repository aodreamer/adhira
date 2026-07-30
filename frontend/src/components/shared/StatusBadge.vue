<template>
  <span class="px-2 py-0.5 text-[10px] rounded-full font-medium" :class="classMap[status] || 'bg-gray-100 text-gray-500'">
    {{ status || 'Menunggu' }}
  </span>
</template>

<script setup>
defineProps({ status: String });
const classMap = {
  Menunggu: 'bg-yellow-100 text-yellow-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  Disetujui: 'bg-emerald-100 text-emerald-700',
  Ditolak: 'bg-red-100 text-red-700',
};
</script>
