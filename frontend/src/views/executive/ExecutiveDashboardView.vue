<template>
  <div class="executive-dashboard space-y-6" :aria-busy="loading">
    <motion.section :initial="{opacity:reduced?1:0,y:reduced?0:10}" :animate="{opacity:1,y:0}" :transition="{duration:reduced?0:.5}" class="executive-hero bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
        <div>
          <h1 class="text-lg font-bold text-gray-800">Penghargaan Dharma Persandian</h1>
          <p class="text-sm text-gray-500 mt-1">Ringkasan pengusul, hasil verifikasi, dan dokumen keputusan.</p>
          <div v-if="report" class="flex flex-wrap gap-3 mt-3 text-xs text-gray-500"><span class="hero-pill"><BuildingOffice2Icon class="w-3.5 h-3.5" />{{ number(summary.instansi_tercakup) }} instansi</span><span class="hero-pill"><CalendarDaysIcon class="w-3.5 h-3.5" />{{ activePeriod?.nama || report.filters.tahun || 'Seluruh periode' }}</span><span class="hero-pill"><LockClosedIcon class="w-3.5 h-3.5" />Akses ringkasan</span></div>
        </div>
        <div class="text-sm text-gray-500 xl:text-right space-y-2">
          <div class="flex items-center gap-2 xl:justify-end"><span class="h-2 w-2 rounded-full" :class="error ? 'bg-red-400' : 'bg-emerald-400'" aria-hidden="true"></span>{{ loading ? 'Memuat data…' : error ? 'Data belum tersedia' : 'Data aplikasi' }}</div>
          <p class="text-xs text-gray-400">{{ report ? 'Diperbarui ' + updatedLabel : error ? 'Muat ulang untuk memperbarui ringkasan' : 'Ringkasan sedang disiapkan' }}</p>
        </div>
      </div>
    </motion.section>

    <form @submit.prevent="load" class="executive-filters bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-wrap items-end gap-4">
      <label class="flex-1 min-w-[180px] text-xs font-semibold text-gray-600">Periode penghargaan
        <select aria-label="Periode penghargaan" v-model="filters.periode_id" class="filter-select"><option value="">Semua periode dan data lama</option><option v-for="period in periods" :key="period.id" :value="String(period.id)">{{ period.nama }}</option></select>
      </label>
      <label class="flex-1 min-w-[150px] text-xs font-semibold text-gray-600">Tahun pencatatan
        <select v-model="filters.tahun" class="filter-select"><option value="">Semua tahun</option><option v-for="year in options.tahun" :key="year" :value="String(year)">{{ year }}</option></select>
      </label>
      <label class="flex-1 min-w-[160px] text-xs font-semibold text-gray-600">Kelompok instansi
        <select v-model="filters.instansi" class="filter-select"><option value="">Semua instansi</option><option v-for="item in options.instansi" :key="item">{{ item }}</option></select>
      </label>
      <label class="flex-1 min-w-[180px] text-xs font-semibold text-gray-600">Jenis penghargaan
        <select v-model="filters.jenis" class="filter-select"><option value="">Semua jenis</option><option v-for="item in options.jenis" :key="item">{{ item }}</option></select>
      </label>
      <button type="submit" :disabled="loading" class="primary-button">Terapkan</button>
      <button type="button" @click="reset" :disabled="loading" class="text-sm text-gray-500 hover:text-gray-900 py-2">Reset</button>
    </form>

    <div class="flex flex-wrap justify-between items-center gap-3">
      <p class="text-sm text-gray-500">{{ appliedLabel }}</p>
      <div class="executive-actions flex gap-2">
        <button @click="load" :disabled="loading" class="action-button" aria-label="Perbarui data"><ArrowPathIcon class="w-4 h-4" :class="loading && 'animate-spin'" /></button>
        <button @click="downloadCsv" :disabled="!report || loading" class="action-button"><ArrowDownTrayIcon class="w-4 h-4" /> Unduh rekap</button>
        <button @click="print" :disabled="!report || loading" class="action-button"><PrinterIcon class="w-4 h-4" /><span class="hidden sm:inline">Cetak</span></button>
      </div>
    </div>

    <div v-if="error" role="alert" class="bg-red-50 text-red-800 border border-red-200 p-5 rounded-xl flex flex-wrap justify-between gap-3">
      <span>{{ error }}</span><button @click="load" class="font-semibold underline">Coba lagi</button>
    </div>
    <div v-if="loading && !report" class="grid sm:grid-cols-3 xl:grid-cols-5 gap-4" role="status"><div v-for="i in 5" :key="i" class="h-36 bg-gray-200 rounded-2xl animate-pulse"></div><span class="sr-only">Memuat dashboard</span></div>

    <template v-if="report">
      <div v-if="summary.total === 0" role="status" class="bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-blue-900">Belum ada pengusul untuk filter ini. Ubah filter untuk melihat periode atau instansi lain.</div>
      <section id="ringkasan" aria-label="Indikator utama" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <motion.article v-for="(card,i) in cards" :key="card.label" :initial="{opacity:reduced?1:0,y:reduced?0:16}" :animate="{opacity:1,y:0}" :transition="{duration:reduced?0:.45,delay:reduced?0:i*.05}" :while-hover="reduced?{}:{y:-2}" class="kpi-card bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
          <div class="flex items-center justify-between gap-2 text-gray-500 mb-3"><p class="text-sm font-medium">{{ card.label }}</p><div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" :class="card.iconBackground"><component :is="card.icon" class="w-5 h-5" :class="card.color" /></div></div>
          <p class="text-3xl font-bold tabular-nums" :class="card.color"><AnimatedNumber :value="card.value" /></p>
          <div class="h-1 rounded-full bg-gray-100 mt-4 overflow-hidden" aria-hidden="true"><motion.div :initial="{width:0}" :animate="{width:(summary.total?card.value/summary.total*100:0)+'%'}" :transition="{duration:reduced?0:.7}" class="h-full rounded-full" :style="{backgroundColor:card.barColor}"></motion.div></div>
          <p class="text-xs text-gray-500 mt-3 leading-relaxed">{{ card.description }}</p>
        </motion.article>
      </section>

      <section v-if="activePeriod" class="panel"><div class="flex flex-wrap justify-between gap-3 mb-4"><div><h2 class="section-title">{{ activePeriod.nama }}</h2><p class="section-subtitle">Progres pelaksanaan seluruh periode, berdasarkan konfirmasi Admin.</p></div><router-link :to="periodsPath+'?id='+activePeriod.id" class="text-sm text-blue-600 hover:underline">Lihat tahapan ?</router-link></div><PeriodProgress :progress="activePeriod.progress" /></section>
      <div v-else class="text-sm text-gray-500">Pilih periode untuk melihat progres pelaksanaannya. <router-link :to="periodsPath" class="text-blue-600 hover:underline">Pantau periode penghargaan ?</router-link></div>
      <IndonesiaMap id="wilayah" :rows="report.provinces || []" />

      <ExecutiveInsights id="analisis" :report="report" @focus-institution="focusInstitution" />

      <div class="grid xl:grid-cols-3 gap-6">
        <section class="panel xl:col-span-2">
          <div class="flex flex-wrap justify-between items-start gap-4 mb-4"><div><h2 class="section-title">Tren pengusul</h2><p class="section-subtitle">Menurut {{ report.trend_unit }} pencatatan, dengan status verifikasi saat ini.</p></div><div class="chart-mode flex bg-gray-100 p-1 rounded-lg"><button @click="trendMode='volume'" :aria-pressed="trendMode==='volume'" :class="trendMode==='volume'&&'bg-white shadow-sm text-gray-800'">Volume</button><button @click="trendMode='status'" :aria-pressed="trendMode==='status'" :class="trendMode==='status'&&'bg-white shadow-sm text-gray-800'">Status</button></div></div>
          <div v-if="trendRows.length" class="h-64 chart-area"><ExecutiveChart :type="trendMode==='volume'?'line':'bar'" :stacked="trendMode==='status'" :labels="trendRows.map(r => r.label)" :datasets="trendDatasets" :description="trendDescription" /></div>
          <p v-else class="h-60 flex justify-center items-center text-gray-400 text-sm">Belum ada data pencatatan</p>
          <details class="mt-4 text-xs text-gray-500"><summary class="cursor-pointer">Lihat angka tren</summary><table class="w-full mt-3"><thead><tr><th class="text-left">Periode</th><th class="text-right">Pengusul</th></tr></thead><tbody><tr v-for="row in trendRows" :key="row.periode"><td class="py-1">{{ row.label }}</td><td class="text-right">{{ row.total }}</td></tr></tbody></table></details>
          <p v-if="summary.tanggal_kosong" class="mt-3 text-xs text-amber-700">{{ number(summary.tanggal_kosong) }} pengusul tanpa tanggal pencatatan tidak ditampilkan pada tren.</p>
        </section>
        <section class="panel">
          <h2 class="section-title">Jenis penghargaan</h2><p class="section-subtitle mb-5">Komposisi jenis yang dipilih pengusul.</p>
          <div v-if="report.kinds.length" class="space-y-5">
            <div v-for="(kind, i) in report.kinds" :key="kind.jenis">
              <div class="flex justify-between gap-3 mb-2 text-sm"><span class="text-gray-600">{{ kind.jenis }}</span><span class="font-semibold tabular-nums">{{ number(kind.jumlah) }}</span></div>
              <div class="h-2 rounded-full bg-gray-100 overflow-hidden" aria-hidden="true"><div class="h-full rounded-full" :style="{width: percent(kind.jumlah, summary.total) + '%', backgroundColor: kindColors[i % kindColors.length]}"></div></div>
            </div>
          </div>
          <p v-else class="py-16 text-sm text-center text-gray-400">Belum ada data</p>
        </section>
      </div>

      <section id="rekap" ref="institutionSection" class="panel">
        <div class="flex flex-wrap justify-between items-center gap-4 mb-5"><div><h2 class="section-title">Rekap per instansi</h2><p class="section-subtitle">Diurutkan menurut jumlah pengusul yang belum lolos verifikasi.</p></div><span class="rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-600">{{ number(summary.instansi_tercakup) }} instansi tercakup</span></div>
        <div class="mb-4 flex flex-wrap items-center gap-3"><TableSearchBox v-model="institutionSearch" label="Cari dalam rekap instansi" input-type="search" placeholder="Cari instansi…" /><span class="text-xs text-gray-400">{{ institutionRows.length }} hasil</span><button v-if="institutionSearch" @click="institutionSearch=''" class="text-xs text-blue-600">Tampilkan semua</button></div>
        <div class="overflow-x-auto institution-scroll">
          <table class="institution-table responsive-table">
            <caption class="sr-only">Rekap pengusul per instansi berdasarkan filter yang diterapkan</caption>
            <thead><tr class="bg-gray-50"><th v-for="column in institutionColumns" :key="column.key"><button @click="institutionTable.toggleSort(column.key)" class="text-[10px] font-semibold text-gray-400 uppercase hover:text-gray-600">{{ column.label }}<span v-if="institutionTable.sortKey===column.key"> {{ institutionTable.sortDir==='asc'?'▲':'▼' }}</span></button></th></tr></thead>
            <tbody>
              <tr v-for="(row,index) in institutionRows" :key="row.instansi" :class="{'pagination-hidden':index<(institutionTable.page-1)*institutionTable.pageSize||index>=institutionTable.page*institutionTable.pageSize}" class="hover:bg-gray-50 transition"><td data-label="Instansi" class="text-left font-medium">{{ row.instansi }}</td><td data-label="Total" class="font-semibold">{{ number(row.total) }}</td><td data-label="Lolos verifikasi"><span class="text-green-600 font-medium">{{ number(row.sesuai) }}</span></td><td data-label="Menunggu">{{ number(row.menunggu) }}</td><td data-label="Perbaikan" :class="row.perbaikan ? 'text-red-600 font-medium' : 'text-gray-400'">{{ number(row.perbaikan) }}</td><td data-label="Draft">{{ number(row.draft) }}</td><td data-label="SK tersedia">{{ number(row.sk_tersedia) }}</td></tr>
              <tr v-if="!institutionRows.length" data-empty-row><td colspan="7" class="py-10 text-center text-gray-400">Tidak ada data untuk filter atau pencarian ini</td></tr>
            </tbody>
            <tfoot v-if="institutionRows.length" class="hidden sm:table-footer-group"><tr><th scope="row" class="text-left">Total seluruh hasil</th><td>{{ number(institutionTotals.total) }}</td><td>{{ number(institutionTotals.sesuai) }}</td><td>{{ number(institutionTotals.menunggu) }}</td><td>{{ number(institutionTotals.perbaikan) }}</td><td>{{ number(institutionTotals.draft) }}</td><td>{{ number(institutionTotals.sk_tersedia) }}</td></tr></tfoot>
          </table>
        </div>
        <p class="sm:hidden text-xs text-gray-500 py-3">Total seluruh hasil: {{ number(institutionTotals.total) }} pengusul</p>
        <TablePagination class="institution-pagination" :page="institutionTable.page" @update:page="institutionTable.goToPage" v-model:page-size="institutionTable.pageSize" :total-pages="institutionTable.totalPages" :total-items="institutionTable.totalItems" />
      </section>
      <footer class="text-xs text-gray-500 leading-relaxed border-t border-gray-200 pt-4">
        Sumber: data pengusul Adhira. Tahun menggunakan tanggal upload; jika tidak tersedia, tanggal pembuatan data digunakan. SK tersedia menunjukkan dokumen keputusan telah tercatat, tanpa pemeriksaan isi atau ketersediaan file pada penyimpanan.
      </footer>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, toRef } from 'vue';
import { motion,useReducedMotion } from 'motion-v';
import { UsersIcon, CheckCircleIcon, ClockIcon, DocumentCheckIcon, ExclamationTriangleIcon, ArrowPathIcon, ArrowDownTrayIcon, PrinterIcon, BuildingOffice2Icon,CalendarDaysIcon,LockClosedIcon,MagnifyingGlassIcon } from '@heroicons/vue/24/outline';
import api from '../../api/client';
import {useRoute} from 'vue-router';
import {useAuthStore} from '../../stores/auth';
import PeriodProgress from '../../components/shared/PeriodProgress.vue';
import ExecutiveChart from '../../components/executive/ExecutiveChart.vue';
import ExecutiveInsights from '../../components/executive/ExecutiveInsights.vue';
import AnimatedNumber from '../../components/executive/AnimatedNumber.vue';
import IndonesiaMap from '../../components/executive/IndonesiaMap.vue';
import { waitingAge } from '../../utils/executive-insights';
import TableSearchBox from '../../components/shared/TableSearchBox.vue';
import TablePagination from '../../components/shared/TablePagination.vue';
import { useTable } from '../../composables/useTable';

const route=useRoute(),auth=useAuthStore();
const periods=ref([]);
const periodsPath=computed(()=>auth.user?.level==='Admin'?'/admin/periods':'/pimpinan/periods');
const filters = reactive({ tahun: '', instansi: '', jenis: '', periode_id: /^\d+$/.test(String(route.query.periode_id||''))?String(route.query.periode_id):'' });
const activePeriod=computed(()=>periods.value.find(p=>p.id===Number(report.value?.filters.periode_id)));
const options = reactive({ tahun: [], instansi: [], jenis: [] });
const report = ref(null);
const loading = ref(false);
const error = ref('');
const reduced=useReducedMotion();
const trendMode=ref('volume');
const institutionSection=ref(null);
const institutionColumns=[['instansi','Instansi'],['total','Total'],['sesuai','Lolos verifikasi'],['menunggu','Menunggu'],['perbaikan','Perbaikan'],['draft','Draft'],['sk_tersedia','SK tersedia']].map(([key,label])=>({key,label}));
const institutionSource=computed(()=>report.value?.institutions||[]);
const institutionTable=reactive(useTable(institutionSource,{columns:institutionColumns,searchFields:['instansi']}));
const institutionSearch=toRef(institutionTable,'search');
const institutionRows=computed(()=>institutionTable.filteredRows);
const institutionTotals=computed(()=>institutionRows.value.reduce((totals,row)=>{for(const key of Object.keys(totals))totals[key]+=row[key]||0;return totals;},{total:0,sesuai:0,menunggu:0,perbaikan:0,draft:0,sk_tersedia:0}));
async function focusInstitution(name){institutionSearch.value=name;await nextTick();institutionSection.value?.scrollIntoView({behavior:reduced.value?'instant':'smooth',block:'start'});}
const summary = computed(() => report.value?.summary || {});
const number = value => new Intl.NumberFormat('id-ID').format(value || 0);
const percent = (value, total) => total ? Math.round(value / total * 100) : 0;
const updatedLabel = computed(() => new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(report.value.updated_at)));
const appliedLabel = computed(() => {
  if (!report.value) return 'Semua tahun · Semua instansi · Semua jenis';
  const f = report.value.filters;
  return [periods.value.find(p=>p.id===Number(f.periode_id))?.nama || 'Semua periode',f.tahun || 'Semua tahun', f.instansi || 'Semua instansi', f.jenis || 'Semua jenis'].join(' · ');
});
const cards = computed(() => [
  { label: 'Total pengusul', value: summary.value.total, icon: UsersIcon, color: 'text-[#142a48]', barColor:'#142a48', description: `${number(summary.value.instansi_tercakup)} instansi tercakup`, featured: true },
  { label: 'Lolos verifikasi', value: summary.value.sesuai, icon: CheckCircleIcon, color: 'text-emerald-700', barColor:'#248777', description: 'Data dan berkas disetujui' },
  { label: 'Menunggu verifikasi', value: summary.value.menunggu, icon: ClockIcon, color: 'text-amber-700', barColor:'#c59b51', description: 'Pemeriksaan data atau berkas' },
  { label: 'Perlu perbaikan', value: summary.value.perbaikan, icon: ExclamationTriangleIcon, color: 'text-red-700', barColor:'#c46d75', description: 'Data atau berkas ditolak' },
  { label: 'SK tersedia', value: summary.value.sk_tersedia, icon: DocumentCheckIcon, color: 'text-[#142a48]', barColor:'#608bae', description: 'Dokumen keputusan tercatat' },
].map((card,i)=>({...card,iconBackground:['bg-blue-100','bg-green-100','bg-amber-100','bg-red-100','bg-blue-100'][i]})));
const kindColors = ['#142a48', '#547ba0', '#c19646', '#94a3b8'];
const trendRows = computed(() => {
  if (!report.value) return [];
  const rows = report.value.trend;
  const currentYear=Number(report.value.as_of_date?.slice(0,4));
  const currentMonth=Number(report.value.as_of_date?.slice(5,7));
  const months=Number(report.value.filters.tahun)===currentYear?Math.max(currentMonth,...rows.map(row=>Number(row.periode.slice(5,7)))):12;
  if (report.value.filters.tahun) return Array.from({length:months}, (_,i) => {
    const periode = `${report.value.filters.tahun}-${String(i+1).padStart(2,'0')}`;
    return { periode,total:0,sesuai:0,menunggu:0,perbaikan:0,draft:0,...rows.find(r=>r.periode===periode),label:['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'][i] };
  });
  return rows.map(row => ({...row, label: row.periode}));
});
const trendDatasets = computed(() => trendMode.value==='volume'?[
  {label:'Pengusul',data:trendRows.value.map(r=>r.total),borderColor:'#547ba0',backgroundColor:'#547ba014',fill:true,tension:.3,borderWidth:2.5,pointRadius:3,pointHoverRadius:5},
  {label:'Lolos verifikasi saat ini',data:trendRows.value.map(r=>r.sesuai||0),borderColor:'#248777',backgroundColor:'#248777',tension:.3,borderWidth:2,pointRadius:3,fill:false},
]:[['draft','Draft','#9aaabd'],['menunggu','Menunggu','#608bae'],['perbaikan','Perbaikan','#c46d75'],['sesuai','Lolos verifikasi','#248777']].map(([key,label,color])=>({label,data:trendRows.value.map(r=>r[key]||0),backgroundColor:color,borderRadius:3,maxBarThickness:38})));
const trendDescription = computed(() => trendRows.value.map(r => `${r.label}: ${r.total} pengusul`).join(', '));

async function load() {
  if (loading.value) return;
  loading.value = true; error.value = '';
  const params = Object.fromEntries(Object.entries(filters).filter(([,v]) => v !== ''));
  try {
    const [{data},{data:periodData}]=await Promise.all([api.get('/executive-dashboard',{params}),api.get('/periods')]);
    periods.value=periodData;
    report.value = data;
    institutionSearch.value = '';
    Object.assign(options, data.options);
  } catch (err) {
    error.value = err.response?.data?.error || 'Data dashboard belum dapat dimuat. Periksa koneksi dan coba lagi.';
    report.value = null;
  } finally { loading.value = false; }
}
function reset() { Object.assign(filters, {tahun:'',instansi:'',jenis:'',periode_id:''}); load(); }
function print() { window.print(); }
function csvCell(value) {
  // Prevent spreadsheet formulas in institution labels supplied through forms/imports.
  let text = String(value ?? '');
  if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"','""') + '"';
}
function downloadCsv() {
  const r = report.value;
  const age=waitingAge(r.waiting_age);
  const rows = [
    ['Rekap Pengusul Adhira'], ['Filter', appliedLabel.value], ['Diperbarui', updatedLabel.value],
    ['Pencarian instansi',institutionSearch.value||'Seluruh instansi'],
    ['Instansi','Total pengusul','Lolos verifikasi','Menunggu verifikasi','Perlu perbaikan','Draft','SK tersedia'],
    ...institutionRows.value.map(i => [i.instansi,i.total,i.sesuai,i.menunggu,i.perbaikan,i.draft,i.sk_tersedia]),
    ['Total hasil rekap',...['total','sesuai','menunggu','perbaikan','draft','sk_tersedia'].map(key=>institutionTotals.value[key])],
    [],['Panel analisis','Seluruh pengusul sesuai filter global'],
    ['Usia pencatatan pengusul menunggu','Jumlah'],...age.bins.map(row=>[row.label,row.jumlah]),['Tanggal tidak tersedia',age.unknown],['Tanggal masa depan',age.future],
    [],['Status verifikasi data','Status verifikasi berkas','Jumlah'],...(r.verification_matrix||[]).map(row=>[row.status_data,row.status_berkas,row.jumlah]),
    [],['Periode pencatatan','Pengusul','Lolos verifikasi saat ini','Menunggu','Perbaikan','Draft'],...r.trend.map(row=>[row.periode,row.total,row.sesuai,row.menunggu,row.perbaikan,row.draft]),
    [],['Provinsi yang dicatat','Pengusul','Lolos verifikasi','Menunggu','Perbaikan'],...(r.provinces||[]).map(row=>[row.provinsi||'Belum terpetakan (wilayah belum dikenali)',row.total,row.sesuai,row.menunggu,row.perbaikan]),
  ];
  const blob = new Blob(['\uFEFF' + rows.map(row => row.map(csvCell).join(';')).join('\r\n')], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `rekap-adhira-${r.filters.tahun || 'semua-tahun'}.csv`; a.click(); URL.revokeObjectURL(url);
}
onMounted(load);
</script>

<style scoped>
.hero-pill { @apply inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5; }
.chart-eyebrow { @apply text-[10px] font-semibold tracking-[0.16em] text-gray-400 mb-1.5; }
.chart-mode button { @apply rounded-md px-3 py-1.5 text-xs text-gray-500 transition; }
#ringkasan,#wilayah,#analisis,#rekap { scroll-margin-top:100px; }
.filter-select { @apply block w-full mt-2 rounded-xl border-gray-300 text-sm font-normal text-gray-800 focus:border-blue-500 focus:ring-blue-100; }
.primary-button { @apply px-5 py-2.5 bg-blue-600 rounded-xl text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50; }
.action-button { @apply inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40; }
.panel { @apply min-w-0 bg-white shadow-sm border border-gray-100 rounded-2xl p-5; }
.section-title { @apply font-semibold text-sm text-gray-800; }
.section-subtitle { @apply text-xs text-gray-500 mt-1.5 leading-relaxed; }
.attention-row { @apply flex justify-between items-center gap-5 text-sm text-gray-600 pb-3 border-b border-gray-200; }
.attention-row strong { @apply text-lg tabular-nums; }
.institution-table thead { @apply text-xs text-gray-500 bg-gray-50; }
.institution-table th, .institution-table td { @apply p-2.5 text-xs text-center; }
.institution-table td:first-child { @apply text-left; }
.institution-table tr.pagination-hidden {display:none;}
.institution-table th:first-child { @apply text-left; }
.institution-table tbody tr { @apply border-b border-gray-100; }
.institution-table tfoot { @apply bg-gray-50 font-semibold; }
.chart-area :deep(> div) { height: 100%; }
@media print { .executive-hero,.kpi-card {opacity:1!important;transform:none!important;} .institution-scroll {overflow:visible;} .chart-mode,.institution-pagination {display:none;} .institution-table tr.pagination-hidden {display:table-row!important;} .institution-table tfoot {display:table-footer-group!important;} }
@media (prefers-reduced-motion:reduce) { .executive-dashboard :deep(*) {animation:none!important;transition:none!important;scroll-behavior:auto!important;} }
</style>
