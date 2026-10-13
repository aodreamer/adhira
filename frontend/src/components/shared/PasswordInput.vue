<template>
  <div class="relative">
    <input
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :type="visible ? 'text' : 'password'"
      v-bind="$attrs"
      class="w-full border border-gray-300 rounded-xl px-3 py-2.5 pr-10 text-sm focus:ring-2 outline-none password-input-no-native-toggle"
      :class="focusClass"
    />
    <button
      type="button"
      tabindex="-1"
      @click="visible = !visible"
      class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      :aria-label="visible ? 'Sembunyikan password' : 'Tampilkan password'"
    >
      <svg v-if="visible" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21m-6.121-6.879l3.242 3.243" /></svg>
      <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineOptions({ inheritAttrs: false });
defineProps({
  modelValue: { type: String, default: '' },
  focusClass: { type: String, default: 'focus:ring-blue-100 focus:border-blue-500' },
});
defineEmits(['update:modelValue']);

const visible = ref(false);
</script>
