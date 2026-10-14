<template>
  <div>
    <div class="flex justify-between gap-3 text-sm mb-2"><span class="text-gray-600">{{ progress.selesai }} dari {{ progress.total }} tahap selesai</span><strong class="text-blue-600 tabular-nums">{{ progress.persen }}%</strong></div>
    <div role="progressbar" :aria-label="label" :aria-valuenow="progress.persen" aria-valuemin="0" aria-valuemax="100" class="h-2.5 rounded-full bg-gray-100 overflow-hidden"><div class="h-full rounded-full bg-blue-600 transition-all duration-500 motion-reduce:transition-none" :style="{width:progress.persen+'%'}"></div></div>
  </div>
</template>
<script setup>
defineProps({progress:{type:Object,required:true},label:{type:String,default:'Progres pelaksanaan periode'}});
</script>
