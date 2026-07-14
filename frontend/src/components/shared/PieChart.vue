<template>
  <div class="relative">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { Chart, DoughnutController, ArcElement, Title, Tooltip, Legend } from 'chart.js';

Chart.register(DoughnutController, ArcElement, Title, Tooltip, Legend);

const props = defineProps({
  labels: { type: Array, default: () => [] },
  data: { type: Array, default: () => [] },
  title: { type: String, default: '' },
});

const canvas = ref(null);
let chart = null;

function createChart() {
  if (!canvas.value) return;
  if (chart) chart.destroy();
  chart = new Chart(canvas.value, {
    type: 'doughnut',
    data: {
      labels: props.labels,
      datasets: [{
        data: props.data,
        backgroundColor: ['#3b82f6','#8b5cf6','#ec4899','#f59e0b','#10b981','#06b6d4','#ef4444','#f97316','#84cc16','#6366f1','#14b8a6','#e11d48'],
        borderWidth: 2,
        borderColor: '#fff',
        hoverBorderColor: '#fff',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { padding: 12, usePointStyle: true, font: { size: 10 } } },
        title: { display: !!props.title, text: props.title, font: { size: 13, weight: 'bold' }, padding: { bottom: 12 } },
        tooltip: { backgroundColor: '#1f2937', titleFont: { size: 12 }, bodyFont: { size: 11 }, padding: 10, cornerRadius: 8 },
      },
    },
  });
}

onMounted(createChart);
watch(() => [props.labels, props.data], createChart, { deep: true });
</script>
