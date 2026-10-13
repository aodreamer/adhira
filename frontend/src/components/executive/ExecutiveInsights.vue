<template>
  <div class="space-y-6">
    <div class="grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-6">
      <motion.section class="insight-panel" :initial="enter" :animate="{opacity:1,y:0}" :transition="transition">
        <div class="panel-heading"><div><h2>Status verifikasi</h2></div><CheckBadgeIcon class="h-5 w-5 text-emerald-600" /></div>
        <div class="relative h-56 mt-3">
          <ExecutiveChart v-if="report.summary.total" type="doughnut" :labels="stages.map(s=>s.label)" :datasets="[{data:stages.map(s=>s.count),backgroundColor:stages.map(s=>s.color),borderWidth:3,borderColor:'#fff',hoverOffset:5}]" :legend="false" :description="stages.map(s=>s.label+': '+s.count).join(', ')" />
          <div v-else class="h-full flex justify-center items-center"><div class="w-44 h-44 rounded-full border-[16px] border-gray-100"></div></div>
          <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><span class="text-4xl font-semibold tracking-tight text-[#142a48]">{{ rate }}<span class="text-xl">%</span></span><span class="text-xs text-gray-500 mt-2">lolos verifikasi</span></div>
        </div>
        <div class="space-y-2.5 mt-2"><div v-for="stage in stages" :key="stage.key" class="flex justify-between gap-4 text-xs"><span class="flex items-center gap-2 text-gray-500"><i class="w-2.5 h-2.5 rounded-full" :style="{backgroundColor:stage.color}"></i>{{ stage.label }}</span><strong class="text-gray-700 tabular-nums">{{ number(stage.count) }}</strong></div></div>
        <p class="panel-note">Lolos verifikasi bukan penetapan penghargaan.</p>
      </motion.section>
      <motion.section class="insight-panel" :initial="enter" :animate="{opacity:1,y:0}" :transition="{...transition,delay:reduced?0:.08}">
        <div class="panel-heading"><div><h2>Prioritas koordinasi instansi</h2></div><span class="rounded-full bg-rose-50 text-rose-700 px-3 py-1.5 text-xs font-semibold">{{ number(attentionTotal) }} pengusul</span></div>
        <p class="text-xs text-gray-500 mt-2">Perbaikan dan pengusul menunggu ≥30 hari sejak pencatatan.</p>
        <div v-if="priorities.length" class="space-y-4 mt-6">
          <button v-for="(row,i) in priorities.slice(0,6)" :key="row.instansi" @click="$emit('focus-institution',row.instansi)" class="priority-item text-left w-full group">
            <div class="flex justify-between gap-3 text-xs mb-2"><span class="flex gap-2 text-gray-600"><span class="text-gray-400 tabular-nums">{{ String(i+1).padStart(2,'0') }}</span><span class="group-hover:text-blue-700">{{ row.instansi }}</span></span><strong class="text-gray-800 tabular-nums">{{ number(row.attention) }}</strong></div>
            <div class="flex h-2 rounded-full bg-gray-100 overflow-hidden" aria-hidden="true"><motion.div :initial="{width:0}" :animate="{width:row.perbaikan/priorityMax*100+'%'}" :transition="transition" class="bg-[#c46d75]"></motion.div><motion.div :initial="{width:0}" :animate="{width:row.menunggu_30_hari/priorityMax*100+'%'}" :transition="transition" class="bg-[#c59b51]"></motion.div></div>
          </button>
        </div>
        <div v-else class="min-h-52 flex items-center justify-center text-sm text-gray-400 text-center">Tidak ada perbaikan atau pengusul menunggu ≥30 hari pada filter ini.</div>
        <div class="flex flex-wrap gap-4 text-[11px] text-gray-500 mt-5"><span class="flex items-center gap-1.5"><i class="w-2 h-2 rounded-full bg-[#c46d75]"></i>Perbaikan</span><span class="flex items-center gap-1.5"><i class="w-2 h-2 rounded-full bg-[#c59b51]"></i>Menunggu ≥30 hari</span></div>
        <p class="panel-note">Klik instansi untuk melihat rekapnya. Angka 30 hari adalah ambang perhatian, bukan SLA.</p>
      </motion.section>
    </div>
    <div class="grid xl:grid-cols-2 gap-6">
      <motion.section class="insight-panel" :initial="enter" :animate="{opacity:1,y:0}" :transition="transition">
        <div class="panel-heading"><div><h2>Pengusul yang masih menunggu</h2></div><ClockIcon class="h-5 w-5 text-amber-600" /></div>
        <p class="text-xs text-gray-500 mt-2">{{ number(report.summary.menunggu) }} pengusul belum selesai diverifikasi.</p>
        <div class="h-60 mt-4"><ExecutiveChart :labels="age.bins.map(b=>b.label)" :datasets="[{label:'Pengusul menunggu',data:age.bins.map(b=>b.jumlah),backgroundColor:['#90adc6','#7598b7','#547ba0','#c59b51','#c46d75'],borderRadius:5,maxBarThickness:30}]" horizontal :legend="false" :description="age.bins.map(b=>b.label+': '+b.jumlah).join(', ')" /></div>
        <div class="flex justify-between text-xs p-3 bg-amber-50 rounded-lg mt-3"><span class="text-amber-800">≥30 hari sejak pencatatan</span><strong class="text-amber-900">{{ number(report.summary.menunggu_30_hari) }}</strong></div>
        <p v-if="age.unknown||age.future" class="text-xs text-amber-700 mt-3">Tidak masuk grafik usia: {{ number(age.unknown) }} tanpa tanggal, {{ number(age.future) }} dengan tanggal masa depan.</p>
        <details class="text-xs text-gray-500 mt-4"><summary class="cursor-pointer">Lihat angka usia pencatatan</summary><div v-for="bin in age.bins" :key="bin.key" class="flex justify-between py-1"><span>{{ bin.label }}</span><span>{{ bin.jumlah }}</span></div></details>
        <p class="panel-note">Mengukur usia sejak pencatatan, bukan durasi antrean atau lama pemeriksaan oleh PIC.</p>
      </motion.section>
      <motion.section class="insight-panel" :initial="enter" :animate="{opacity:1,y:0}" :transition="{...transition,delay:reduced?0:.08}">
        <div class="panel-heading"><div><h2>Verifikasi data dan berkas</h2></div><Squares2X2Icon class="h-5 w-5 text-blue-600" /></div>
        <p class="text-xs text-gray-500 mt-2">Data dan berkas memiliki keputusan yang terpisah.</p>
        <div class="overflow-x-auto mt-5"><table class="matrix-table w-full text-xs"><caption class="sr-only">Jumlah pengusul pada kombinasi hasil verifikasi data dan berkas</caption><thead><tr><th class="text-left text-gray-400 font-normal">Data ↓ / Berkas →</th><th v-for="state in matrix.states" :key="state" class="text-gray-500 font-medium">{{ state }}</th></tr></thead><tbody><tr v-for="state in matrix.states" :key="state"><th scope="row" class="text-left text-gray-500 font-medium">{{ state }}</th><td v-for="column in matrix.states" :key="column"><button @click="selectedCell={data:state,berkas:column}" :aria-label="state+' data, '+column+' berkas: '+cellCount(state,column)+' pengusul'" :aria-pressed="selectedCell?.data===state&&selectedCell?.berkas===column" class="w-full rounded-xl p-4 text-base tabular-nums font-semibold transition hover:ring-2 hover:ring-blue-300 focus-visible:ring-2 focus-visible:ring-blue-500" :style="cellStyle(state,column)">{{ number(cellCount(state,column)) }}</button></td></tr></tbody></table></div>
        <p class="text-xs text-gray-500 mt-4 min-h-10">{{ selectedCell ? `Data ${selectedCell.data.toLowerCase()}, berkas ${selectedCell.berkas.toLowerCase()}: ${number(cellCount(selectedCell.data,selectedCell.berkas))} pengusul.` : 'Pilih kotak untuk membaca kombinasi status.' }}</p>
        <div class="rounded-xl bg-emerald-50 px-4 py-3 flex justify-between gap-3 text-xs mt-2"><span class="text-emerald-800">Lolos verifikasi, SK belum tercatat</span><strong class="text-emerald-900">{{ number(report.summary.sesuai_tanpa_sk) }}</strong></div>
        <p class="panel-note">SK belum tercatat tidak berarti keputusan wajib segera diterbitkan.</p>
      </motion.section>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { motion,useReducedMotion } from 'motion-v';
import { CheckBadgeIcon,ClockIcon,Squares2X2Icon } from '@heroicons/vue/24/outline';
import ExecutiveChart from './ExecutiveChart.vue';
import { STAGES,waitingAge,rankInstitutions,verificationMatrix } from '../../utils/executive-insights';
const props=defineProps({report:{type:Object,required:true}});defineEmits(['focus-institution']);
const reduced=useReducedMotion();
const enter=computed(()=>({opacity:reduced.value?1:0,y:reduced.value?0:12}));
const transition=computed(()=>({duration:reduced.value?0:.45,ease:[.22,1,.36,1]}));
const number=n=>new Intl.NumberFormat('id-ID').format(n||0);
const stages=computed(()=>STAGES.map(s=>({...s,count:props.report.stages.find(row=>row.tahap===s.key)?.jumlah||0})));
const rate=computed(()=>props.report.summary.total?Math.round(props.report.summary.sesuai/props.report.summary.total*100):0);
const age=computed(()=>waitingAge(props.report.waiting_age));
const priorities=computed(()=>rankInstitutions(props.report.institutions));
const priorityMax=computed(()=>Math.max(1,...priorities.value.map(r=>r.attention)));
const attentionTotal=computed(()=>(props.report.summary.perbaikan||0)+(props.report.summary.menunggu_30_hari||0));
const matrix=computed(()=>verificationMatrix(props.report.verification_matrix));const selectedCell=ref(null);
function cellCount(data,berkas){return matrix.value.cells.find(c=>c.data===data&&c.berkas===berkas)?.jumlah||0;}
function cellStyle(data,berkas){
  const value=cellCount(data,berkas); const max=Math.max(1,...matrix.value.cells.map(c=>c.jumlah));
  const color=data==='Disetujui'&&berkas==='Disetujui'?[36,135,119]:data==='Ditolak'||berkas==='Ditolak'?[196,109,117]:[84,123,160];
  return {backgroundColor:value?`rgba(${color.join(',')},${.08+value/max*.24})`:'#f5f7fa',color:value?'#142a48':'#94a3b8'};
}
</script>

<style scoped>
.insight-panel { @apply min-w-0 bg-white rounded-2xl shadow-sm border border-gray-100 p-5; }
.panel-heading { @apply flex items-center justify-between gap-4; }
.panel-heading h2 { @apply text-sm font-semibold text-gray-800; }
.eyebrow { @apply text-[10px] font-semibold tracking-[0.16em] text-gray-400 mb-1.5; }
.panel-note { @apply text-[11px] text-gray-500 border-t border-gray-100 pt-3 mt-5 leading-relaxed; }
.matrix-table td,.matrix-table th { @apply p-1.5; }
@media print { .insight-panel { opacity:1!important;transform:none!important;break-inside:avoid; } }
</style>
