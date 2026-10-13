<template>
  <section class="indonesia-map rounded-2xl border border-slate-200 bg-white overflow-hidden" aria-labelledby="indonesia-map-title">
    <div class="p-5 sm:p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
      <div><h2 id="indonesia-map-title" class="text-base font-semibold text-slate-800">Sebaran pengusul di Indonesia</h2><p class="text-xs text-slate-500 mt-1.5">Jumlah pengusul berdasarkan provinsi yang tercatat.</p></div>
      <div class="flex items-center gap-2 text-xs"><span class="rounded-full bg-blue-50 text-blue-800 px-3 py-1.5">{{ number(mappedTotal) }} terpetakan</span><span class="rounded-full bg-slate-100 text-slate-600 px-3 py-1.5">{{ number(mapData.unmapped.total) }} belum terpetakan</span></div>
    </div>
    <div class="grid lg:grid-cols-[minmax(0,1fr)_290px]">
      <div class="min-w-0 bg-[#f5f8fb] relative">
        <div class="map-controls absolute top-3 right-3 z-10 flex gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
          <button @click="zoom = Math.min(12, zoom + 1)" :disabled="zoom === 12" class="control-button" aria-label="Perbesar peta"><PlusIcon class="h-4 w-4" /></button>
          <button @click="zoom = Math.max(1, zoom - 1)" :disabled="zoom === 1" class="control-button" aria-label="Perkecil peta"><MinusIcon class="h-4 w-4" /></button>
          <button @click="zoom = 1" class="control-button" aria-label="Reset pembesaran peta"><ArrowsPointingOutIcon class="h-4 w-4" /></button>
        </div>
        <div v-if="hoveredRegion" class="absolute left-3 top-3 bg-white/95 rounded-lg border border-slate-200 px-3 py-2 text-xs shadow-sm pointer-events-none z-10">
          <p class="font-semibold text-slate-800">{{ hoveredRegion.name }}</p><p class="mt-1 text-slate-500">{{ number(hoveredRegion.total) }} pengusul tercatat</p>
        </div>
        <svg :viewBox="viewBox" role="group" class="block w-full aspect-[1060/440] mt-12 mb-2" aria-label="Peta Indonesia dengan 38 provinsi. Pilih provinsi untuk melihat ringkasan." @mouseleave="hovered = ''">
          <g aria-hidden="true" stroke="#e6edf4" stroke-width="1" stroke-dasharray="3 7">
            <path d="M0,164H1060 M220,0V440 M440,0V440 M660,0V440 M880,0V440" />
          </g>
          <path v-for="region in mapData.regions" :key="region.code" :d="region.d" fill-rule="evenodd"
            :fill="fill(region.total)" :stroke="selected === region.code ? '#be923f' : '#ffffff'"
            :stroke-width="selected === region.code ? 2.5 : 0.8" vector-effect="non-scaling-stroke"
            role="button" tabindex="0" :aria-label="region.name + ': ' + number(region.total) + ' pengusul tercatat'"
            :aria-pressed="selected === region.code" class="province-shape"
            @mouseenter="hovered = region.code" @focus="hovered = region.code" @blur="hovered = ''"
            @click="selectRegion(region.code)" @keydown.enter.prevent="selectRegion(region.code)" @keydown.space.prevent="selectRegion(region.code)">
            <title>{{ region.name }}: {{ number(region.total) }} pengusul tercatat</title>
          </path>
        </svg>
        <div class="px-5 pb-5 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
          <div class="flex items-center gap-2"><span class="inline-block w-3 h-3 bg-[#dce4eb] border border-white"></span><span>0 tercatat</span><span class="ml-2">Jumlah pengusul</span><span class="inline-flex"><i v-for="color in palette" :key="color" class="w-5 h-3" :style="{backgroundColor:color}"></i></span><span>{{ maximum ? '1–' + number(maximum) : '0' }}</span></div>
          <a :href="geometry.sourceUrl" target="_blank" rel="noopener noreferrer" class="underline hover:text-slate-800">Batas provinsi: BIG</a>
        </div>
      </div>
      <div class="p-5 border-t lg:border-t-0 lg:border-l border-slate-200" role="complementary" aria-label="Ringkasan provinsi">
        <label class="text-xs font-semibold text-slate-600 block">Pilih provinsi
          <select v-model="selected" @change="selectRegion(selected)" class="block w-full mt-2 rounded-lg border-slate-200 text-sm font-normal focus:ring-blue-500 focus:border-blue-500"><option value="">Semua provinsi</option><option v-for="region in alphabeticalRegions" :key="region.code" :value="region.code">{{ region.name }}</option></select>
        </label>
        <div v-if="selectedRegion" class="mt-6">
          <p class="text-xs text-slate-500 mb-2">Ringkasan provinsi</p><h3 class="font-semibold text-slate-800 mb-5">{{ selectedRegion.name }}</h3>
          <dl class="space-y-3 text-sm">
            <div v-for="metric in detailMetrics" :key="metric.key" class="flex justify-between gap-3"><dt class="text-slate-500">{{ metric.label }}</dt><dd class="font-semibold tabular-nums" :class="metric.color">{{ number(selectedRegion[metric.key]) }}</dd></div>
          </dl>
          <p v-if="!selectedRegion.total" class="text-xs text-slate-500 mt-5 leading-relaxed">Belum ada pengusul yang tercatat pada provinsi ini dalam filter yang diterapkan.</p>
          <button @click="selected = ''; zoom = 1" class="text-xs text-blue-700 mt-5 hover:underline">Lihat semua provinsi</button>
        </div>
        <div v-else class="mt-6">
          <h3 class="text-sm font-semibold text-slate-800 mb-4">Provinsi dengan pengusul terbanyak</h3>
          <div v-if="topRegions.length" class="space-y-3"><button v-for="region in topRegions" :key="region.code" @click="selectRegion(region.code)" class="w-full flex justify-between gap-4 text-sm text-left hover:text-blue-700"><span class="text-slate-600">{{ region.name }}</span><span class="font-semibold tabular-nums">{{ number(region.total) }}</span></button></div>
          <p v-else class="text-xs text-slate-500 leading-relaxed">Belum ada data provinsi yang dapat dipetakan untuk filter ini.</p>
          <p class="text-xs text-slate-400 mt-5 leading-relaxed">Pilih wilayah pada peta atau daftar untuk melihat hasil verifikasi.</p>
        </div>
      </div>
    </div>
    <div class="px-5 sm:px-6 py-4 border-t border-slate-100 text-xs text-slate-500 leading-relaxed">
      Sebaran mengikuti data provinsi pada profil Pemerintah Daerah. Pengusul tanpa data provinsi tidak ditempatkan pada peta.
      <p v-if="mapData.unmatchedNames.length" class="mt-1 text-amber-700">Nama provinsi belum dikenali: {{ mapData.unmatchedNames.join(', ') }}.</p>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import { PlusIcon, MinusIcon, ArrowsPointingOutIcon } from '@heroicons/vue/24/outline';
import geometry from '../../assets/maps/indonesia-provinces.json';
import { buildProvinceMap } from '../../utils/province-map';
const props = defineProps({ rows: { type:Array, default:()=>[] } });
const selected = ref(''); const hovered = ref(''); const zoom = ref(1);
const mapData = computed(() => buildProvinceMap(geometry.provinces, props.rows));
const mappedTotal = computed(() => mapData.value.regions.reduce((sum,r) => sum+r.total,0));
const maximum = computed(() => Math.max(0, ...mapData.value.regions.map(r => r.total)));
const selectedRegion = computed(() => mapData.value.regions.find(r => r.code === selected.value));
const hoveredRegion = computed(() => mapData.value.regions.find(r => r.code === hovered.value));
const alphabeticalRegions = computed(() => [...mapData.value.regions].sort((a,b) => a.name.localeCompare(b.name,'id')));
const topRegions = computed(() => [...mapData.value.regions].filter(r=>r.total).sort((a,b)=>b.total-a.total || a.name.localeCompare(b.name,'id')).slice(0,5));
const number = value => new Intl.NumberFormat('id-ID').format(value || 0);
const palette = ['#c6d9e9','#91b2ce','#547ba0','#142a48'];
function fill(value) { return value ? palette[Math.min(3,Math.ceil(value/maximum.value*4)-1)] : '#dce4eb'; }
function selectRegion(code) {
  selected.value = code;
  const bounds = selectedRegion.value?.bounds;
  if (!bounds) { zoom.value = 1; return; }
  const width = Math.max(1, bounds[2] - bounds[0]);
  const height = Math.max(1, bounds[3] - bounds[1]);
  // Fit the entire province with room around its coastline and islands.
  zoom.value = Math.max(1.5, Math.min(12, Math.min(1060 / width, 440 / height) / 1.35));
}
const detailMetrics = [
  {key:'total',label:'Total pengusul',color:'text-slate-900'},
  {key:'sesuai',label:'Lolos verifikasi',color:'text-emerald-700'},
  {key:'menunggu',label:'Menunggu',color:'text-amber-700'},
  {key:'perbaikan',label:'Perlu perbaikan',color:'text-red-700'},
  {key:'draft',label:'Draft',color:'text-slate-600'},
  {key:'sk_tersedia',label:'SK tersedia',color:'text-slate-900'},
];
const viewBox = computed(() => {
  const width=1060/zoom.value, height=440/zoom.value;
  const bounds=selectedRegion.value?.bounds;
  const cx=bounds?(bounds[0]+bounds[2])/2:530, cy=bounds?(bounds[1]+bounds[3])/2:220;
  const x=zoom.value===1?0:cx-width/2;
  const y=zoom.value===1?0:cy-height/2;
  return `${x} ${y} ${width} ${height}`;
});
</script>

<style scoped>
.control-button { @apply p-1.5 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30; }
.province-shape { cursor:pointer; transition:fill 150ms; outline:none; }
.province-shape:hover, .province-shape:focus-visible { stroke:#be923f; stroke-width:2.5; outline:none; }
@media print { .map-controls { display:none; } }
</style>
