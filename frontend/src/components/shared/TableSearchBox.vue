<template>
  <div class="relative w-full sm:w-64">
    <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
    <input
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :type="inputType"
      :placeholder="placeholder"
      :aria-label="label"
      class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
    />
  </div>
</template>

<script setup>
defineProps({ modelValue:{type:String,default:''},placeholder:{type:String,default:'Cari...'},label:{type:String,default:'Cari data'},inputType:{type:String,default:'text'} });
defineEmits(['update:modelValue']);
</script>
