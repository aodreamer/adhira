<template>
  <div class="relative">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend, Filler } from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend, Filler);

const props = defineProps({
  labels: { type: Array, default: () => [] },
  datasets: { type: Array, default: () => [] },
  title: { type: String, default: '' },
  yLabel: { type: String, default: 'Jumlah' },
});

const canvas = ref(null);
let chart = null;

function createChart() {
  if (!canvas.value) return;
  if (chart) chart.destroy();
  chart = new Chart(canvas.value, {
    type: 'bar',
    data: { labels: props.labels, datasets: props.datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true, font: { size: 11 } } },
        title: { display: !!props.title, text: props.title, font: { size: 13, weight: 'bold' }, padding: { bottom: 16 } },
        tooltip: { backgroundColor: '#1f2937', titleFont: { size: 12 }, bodyFont: { size: 11 }, padding: 10, cornerRadius: 8 },
      },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0, font: { size: 10 } }, grid: { color: '#f3f4f6' }, title: { display: true, text: props.yLabel } },
        x: { ticks: { font: { size: 10 } }, grid: { display: false } },
      },
    },
  });
}

onMounted(createChart);
watch(() => [props.labels, props.datasets], createChart, { deep: true });
</script>
