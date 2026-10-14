<template>
  <section aria-labelledby="period-overview-title" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
    <div class="flex flex-wrap items-start justify-between gap-3 mb-5">
      <div><h2 id="period-overview-title" class="text-sm font-semibold text-gray-800">Progres periode penghargaan</h2><p class="text-xs text-gray-500 mt-1.5 leading-relaxed">{{ activeId?'Periode sesuai filter yang diterapkan.':'Ringkasan periode, dengan periode aktif ditampilkan lebih dahulu.' }} Progres tahap dikonfirmasi oleh Admin.</p></div>
      <router-link :to="periodsPath" class="text-sm text-blue-600 hover:underline">Lihat semua periode</router-link>
    </div>
    <div v-if="visiblePeriods.length" class="grid gap-4" :class="visiblePeriods.length>1?'md:grid-cols-2 xl:grid-cols-3':''">
      <article v-for="period in visiblePeriods" :key="period.id" :aria-label="period.nama" class="border border-gray-100 rounded-xl p-4 min-w-0">
        <div class="flex flex-wrap justify-between items-start gap-2"><h3 class="text-sm font-semibold text-gray-800 break-words">{{ period.nama }}</h3><span class="text-xs px-2.5 py-1 rounded-full" :class="period.status==='Aktif'?'bg-blue-50 text-blue-700':period.status==='Selesai'?'bg-green-50 text-green-700':'bg-gray-100 text-gray-600'">{{ period.status }}</span></div>
        <p class="text-xs text-gray-500 mt-2 mb-4">{{ date(period.start_date) }} – {{ date(period.end_date) }}</p>
        <PeriodProgress :progress="period.progress" :label="'Progres '+period.nama" />
        <ol class="grid grid-cols-8 gap-1.5 mt-4" aria-label="Status delapan tahap periode"><li v-for="stage in period.stages" :key="stage.kode" class="h-1.5 rounded-full" :class="stage.status==='Selesai'?'bg-green-500':stage.status==='Berjalan'?'bg-blue-500':stage.status==='Tidak diperlukan'?'bg-gray-100':'bg-gray-300'" :title="stage.label+': '+stage.status"><span class="sr-only">{{ stage.label }}: {{ stage.status }}</span></li></ol>
        <p class="text-xs text-gray-600 mt-3 leading-relaxed">{{ currentStage(period) }}</p>
        <p v-if="period.progress.terlambat" class="text-xs text-red-600 mt-2">{{ period.progress.terlambat }} tahap melewati jadwal penyelesaian</p>
        <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-3"><span>{{ number(period.applicants.total) }} pengusul terkait</span><span>{{ number(period.applicants.lolos) }} lolos verifikasi</span></div>
        <div class="flex flex-wrap justify-between items-center gap-3 mt-4 pt-3 border-t border-gray-100">
          <router-link :to="periodsPath+'?id='+period.id" class="text-xs text-blue-600 hover:underline">Lihat tahapan</router-link>
          <button v-if="Number(activeId)!==period.id" @click="$emit('select-period',period.id)" :disabled="loading" class="text-xs text-blue-600 hover:underline disabled:opacity-40">Gunakan filter periode</button>
        </div>
      </article>
    </div>
    <p v-else class="text-sm text-gray-500 py-3">{{ activeId?'Periode yang dipilih tidak tersedia. Ubah filter periode untuk melihat ringkasan lainnya.':'Belum ada periode penghargaan. Administrator dapat menambahkannya melalui menu Periode Penghargaan.' }}</p>
    <p v-if="visiblePeriods.length" class="text-xs text-gray-400 mt-4 leading-relaxed">Progres dan jumlah pengusul pada kartu mencakup seluruh periode. Filter tahun pencatatan, instansi, dan jenis penghargaan berlaku pada indikator serta grafik pengusul di bawah.</p>
  </section>
</template>
<script setup>
import {computed} from 'vue';
import PeriodProgress from '../shared/PeriodProgress.vue';
const props=defineProps({periods:{type:Array,default:()=>[]},activeId:{type:[String,Number],default:null},periodsPath:{type:String,required:true},loading:Boolean});
defineEmits(['select-period']);
const visiblePeriods=computed(()=>props.activeId?props.periods.filter(p=>p.id===Number(props.activeId)):[...props.periods].sort((a,b)=>({Aktif:0,Persiapan:1,Selesai:2}[a.status]-{Aktif:0,Persiapan:1,Selesai:2}[b.status])||b.start_date.localeCompare(a.start_date)||b.id-a.id).slice(0,3));
const date=v=>new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeZone:'UTC'}).format(new Date(v+'T00:00:00Z'));
const number=v=>new Intl.NumberFormat('id-ID').format(v||0);
function currentStage(period){const running=period.stages.filter(s=>s.status==='Berjalan');if(running.length)return 'Sedang berjalan: '+running.map(s=>s.label).join(', ');const next=period.stages.find(s=>s.status==='Belum dimulai');return next?'Tahap berikutnya: '+next.label:'Seluruh tahap yang diperlukan telah selesai';}
</script>
