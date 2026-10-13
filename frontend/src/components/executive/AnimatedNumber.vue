<template>
  <span><span ref="visible" aria-hidden="true" data-animated-number>{{ formatted }}</span><span class="sr-only">{{ format(value) }}</span></span>
</template>

<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { animate, useReducedMotion } from 'motion-v';
const props = defineProps({value:{type:Number,default:0}});
const reduced = useReducedMotion();
const displayed = ref(0); let controls;
const visible=ref(null);
const format = n => new Intl.NumberFormat('id-ID').format(Math.round(n || 0));
const formatted = computed(() => format(displayed.value));
function finish() { controls?.stop(); displayed.value = props.value;if(visible.value)visible.value.textContent=format(props.value); }
watch(() => [props.value,reduced.value], () => {
  controls?.stop();
  if (reduced.value) return finish();
  controls = animate(displayed.value,props.value,{duration:.75,ease:[.22,1,.36,1],onUpdate:n=>displayed.value=n});
},{immediate:true});
onMounted(() => window.addEventListener('beforeprint',finish));
onBeforeUnmount(() => {controls?.stop();window.removeEventListener('beforeprint',finish);});
</script>
