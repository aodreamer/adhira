<template>
  <div class="executive-dashboard space-y-6" :aria-busy="loading">
    <section class="executive-hero rounded-2xl px-6 py-7 sm:px-8 bg-[#142a48] text-white">
      <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
        <div>
          <p class="text-xs font-semibold tracking-[0.2em] text-[#e2bc76] mb-3">EXECUTIVE DASHBOARD</p>
          <h1 class="text-2xl sm:text-3xl font-semibold tracking-tight">Penghargaan Dharma Persandian</h1>
          <p class="text-sm text-slate-300 mt-3">Ringkasan pengusul, hasil verifikasi, dan dokumen keputusan.</p>
        </div>
        <div class="text-sm xl:text-right space-y-2">
          <div class="flex items-center gap-2 xl:justify-end"><span class="h-2 w-2 rounded-full" :class="error ? 'bg-red-400' : 'bg-emerald-400'" aria-hidden="true"></span>{{ loading ? 'Memuat data…' : error ? 'Data belum tersedia' : 'Data aplikasi' }}</div>
          <p class="text-xs text-slate-300">{{ report ? 'Diperbarui ' + updatedLabel : error ? 'Muat ulang untuk memperbarui ringkasan' : 'Ringkasan sedang disiapkan' }}</p>
        </div>
      </div>
    </section>

    <form @submit.prevent="load" class="executive-filters bg-white border border-slate-200 rounded-2xl p-5 flex flex-wrap items-end gap-4">
      <label class="flex-1 min-w-[150px] text-xs font-semibold text-slate-600">Tahun pencatatan
        <select v-model="filters.tahun" class="filter-select"><option value="">Semua tahun</option><option v-for="year in options.tahun" :key="year" :value="String(year)">{{ year }}</option></select>
      </label>
      <label class="flex-1 min-w-[160px] text-xs font-semibold text-slate-600">Kelompok instansi
        <select v-model="filters.instansi" class="filter-select"><option value="">Semua instansi</option><option v-for="item in options.instansi" :key="item">{{ item }}</option></select>
      </label>
      <label class="flex-1 min-w-[180px] text-xs font-semibold text-slate-600">Jenis penghargaan
        <select v-model="filters.jenis" class="filter-select"><option value="">Semua jenis</option><option v-for="item in options.jenis" :key="item">{{ item }}</option></select>
      </label>
      <button type="submit" :disabled="loading" class="primary-button">Terapkan</button>
      <button type="button" @click="reset" :disabled="loading" class="text-sm text-slate-500 hover:text-slate-900 py-2">Reset</button>
    </form>

    <div class="flex flex-wrap justify-between items-center gap-3">
      <p class="text-sm text-slate-500">{{ appliedLabel }}</p>
      <div class="executive-actions flex gap-2">
        <button @click="load" :disabled="loading" class="action-button" aria-label="Perbarui data"><ArrowPathIcon class="w-4 h-4" :class="loading && 'animate-spin'" /></button>
        <button @click="downloadCsv" :disabled="!report || loading" class="action-button"><ArrowDownTrayIcon class="w-4 h-4" /> Unduh rekap</button>
        <button @click="print" :disabled="!report || loading" class="action-button"><PrinterIcon class="w-4 h-4" /><span class="hidden sm:inline">Cetak</span></button>
      </div>
    </div>

    <div v-if="error" role="alert" class="bg-red-50 text-red-800 border border-red-200 p-5 rounded-xl flex flex-wrap justify-between gap-3">
      <span>{{ error }}</span><button @click="load" class="font-semibold underline">Coba lagi</button>
    </div>
    <div v-if="loading && !report" class="grid sm:grid-cols-3 lg:grid-cols-5 gap-4" role="status"><div v-for="i in 5" :key="i" class="h-36 bg-slate-200 rounded-2xl animate-pulse"></div><span class="sr-only">Memuat dashboard</span></div>

    <template v-if="report">
      <div v-if="summary.total === 0" role="status" class="bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-blue-900">Belum ada pengusul untuk filter ini. Ubah filter untuk melihat periode atau instansi lain.</div>
      <section aria-label="Indikator utama" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <article v-for="card in cards" :key="card.label" class="kpi-card bg-white border border-slate-200 rounded-2xl p-5" :class="card.featured && 'border-t-4 border-t-[#be923f]'">
          <div class="flex items-center justify-between gap-2 text-slate-500 mb-4"><p class="text-xs font-semibold">{{ card.label }}</p><component :is="card.icon" class="w-5 h-5" /></div>
          <p class="text-3xl font-semibold tabular-nums tracking-tight" :class="card.color">{{ number(card.value) }}</p>
          <p class="text-xs text-slate-500 mt-3 leading-relaxed">{{ card.description }}</p>
        </article>
      </section>

      <div class="grid xl:grid-cols-3 gap-6">
        <section class="panel xl:col-span-2">
          <div class="flex justify-between items-start gap-3 mb-6"><div><h2 class="section-title">Status verifikasi</h2><p class="section-subtitle">Setiap pengusul dihitung pada satu status.</p></div><span class="text-sm font-semibold text-emerald-700">{{ percent(summary.sesuai, summary.total) }}% sesuai</span></div>
          <div class="flex h-4 overflow-hidden rounded-full bg-slate-100 mb-6" aria-hidden="true"><div v-for="stage in stages" :key="stage.key" :style="{ width: (summary.total ? stage.count / summary.total * 100 : 0) + '%', backgroundColor: stage.color }"></div></div>
          <div class="grid sm:grid-cols-2 gap-x-8 gap-y-4">
            <div v-for="stage in stages" :key="stage.key" class="flex items-center justify-between gap-3 text-sm">
              <span class="flex items-center gap-2 text-slate-600"><span class="w-2.5 h-2.5 rounded-full flex-shrink-0" :style="{backgroundColor: stage.color}" aria-hidden="true"></span>{{ stage.label }}</span>
              <span class="font-semibold tabular-nums">{{ number(stage.count) }} <span class="text-xs font-normal text-slate-400 ml-1">{{ percent(stage.count, summary.total) }}%</span></span>
            </div>
          </div>
          <p class="text-xs text-slate-500 mt-6 border-t border-slate-100 pt-4">Lolos verifikasi berarti data dan berkas disetujui. Penetapan penghargaan tetap mengacu pada keputusan yang diterbitkan.</p>
        </section>
        <section class="panel bg-[#fbfaf7]">
          <div class="flex items-center gap-2 mb-2"><ExclamationTriangleIcon class="w-5 h-5 text-amber-700" /><h2 class="section-title">Perlu perhatian</h2></div>
          <p class="section-subtitle mb-5">Ringkasan untuk tindak lanjut koordinasi.</p>
          <div class="space-y-4">
            <div class="attention-row"><span>Data atau berkas perlu perbaikan</span><strong class="text-red-700">{{ number(summary.perbaikan) }}</strong></div>
            <div class="attention-row"><span>Menunggu ≥30 hari sejak pencatatan</span><strong class="text-amber-700">{{ number(summary.menunggu_30_hari) }}</strong></div>
            <div class="attention-row"><span>Instansi belum diisi</span><strong>{{ number(summary.instansi_kosong) }}</strong></div>
          </div>
          <p class="text-xs text-slate-500 mt-5 leading-relaxed">Usia pencatatan digunakan untuk pemantauan. Angka 30 hari merupakan ambang perhatian, bukan SLA.</p>
        </section>
      </div>

      <div class="grid xl:grid-cols-3 gap-6">
        <section class="panel xl:col-span-2">
          <div class="flex justify-between items-start gap-4 mb-4"><div><h2 class="section-title">Tren pengusul</h2><p class="section-subtitle">Jumlah pengusul menurut {{ report.trend_unit }} pencatatan.</p></div><span class="text-xs text-slate-500 whitespace-nowrap">{{ number(summary.total - summary.tanggal_kosong) }} tercatat</span></div>
          <div v-if="trendRows.length" class="h-60 chart-area" role="img" :aria-label="trendDescription"><BarChart :labels="trendRows.map(r => r.label)" :datasets="trendDatasets" y-label="Jumlah pengusul" /></div>
          <p v-else class="h-60 flex justify-center items-center text-slate-400 text-sm">Belum ada data pencatatan</p>
          <details class="mt-4 text-xs text-slate-500"><summary class="cursor-pointer">Lihat angka tren</summary><table class="w-full mt-3"><thead><tr><th class="text-left">Periode</th><th class="text-right">Pengusul</th></tr></thead><tbody><tr v-for="row in trendRows" :key="row.periode"><td class="py-1">{{ row.label }}</td><td class="text-right">{{ row.total }}</td></tr></tbody></table></details>
          <p v-if="summary.tanggal_kosong" class="mt-3 text-xs text-amber-700">{{ number(summary.tanggal_kosong) }} pengusul tanpa tanggal pencatatan tidak ditampilkan pada tren.</p>
        </section>
        <section class="panel">
          <h2 class="section-title">Jenis penghargaan</h2><p class="section-subtitle mb-5">Komposisi jenis yang dipilih pengusul.</p>
          <div v-if="report.kinds.length" class="space-y-5">
            <div v-for="(kind, i) in report.kinds" :key="kind.jenis">
              <div class="flex justify-between gap-3 mb-2 text-sm"><span class="text-slate-600">{{ kind.jenis }}</span><span class="font-semibold tabular-nums">{{ number(kind.jumlah) }}</span></div>
              <div class="h-2 rounded-full bg-slate-100 overflow-hidden" aria-hidden="true"><div class="h-full rounded-full" :style="{width: percent(kind.jumlah, summary.total) + '%', backgroundColor: kindColors[i % kindColors.length]}"></div></div>
            </div>
          </div>
          <p v-else class="py-16 text-sm text-center text-slate-400">Belum ada data</p>
        </section>
      </div>

      <section class="panel">
        <div class="flex flex-wrap justify-between items-center gap-4 mb-5"><div><h2 class="section-title">Rekap per instansi</h2><p class="section-subtitle">Diurutkan menurut jumlah pengusul yang belum lolos verifikasi.</p></div><span class="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600">{{ number(summary.instansi_tercakup) }} instansi tercakup</span></div>
        <div class="overflow-x-auto">
          <table class="institution-table w-full text-sm">
            <caption class="sr-only">Rekap pengusul per instansi berdasarkan filter yang diterapkan</caption>
            <thead><tr><th class="text-left">Instansi</th><th>Total</th><th>Lolos verifikasi</th><th>Menunggu</th><th>Perbaikan</th><th>Draft</th><th>SK tersedia</th></tr></thead>
            <tbody>
              <tr v-for="row in report.institutions" :key="row.instansi"><th scope="row" class="text-left font-medium min-w-[210px]">{{ row.instansi }}</th><td class="font-semibold">{{ number(row.total) }}</td><td><span class="text-emerald-700 font-medium">{{ number(row.sesuai) }}</span><div class="w-20 h-1 bg-slate-100 rounded-full mt-1 mx-auto" aria-hidden="true"><div class="h-1 bg-emerald-500 rounded-full" :style="{width: percent(row.sesuai, row.total) + '%'}"></div></div></td><td>{{ number(row.menunggu) }}</td><td :class="row.perbaikan ? 'text-red-700 font-medium' : 'text-slate-400'">{{ number(row.perbaikan) }}</td><td>{{ number(row.draft) }}</td><td>{{ number(row.sk_tersedia) }}</td></tr>
              <tr v-if="!report.institutions.length"><td colspan="7" class="py-10 text-center text-slate-400">Tidak ada data untuk filter ini</td></tr>
            </tbody>
            <tfoot v-if="report.institutions.length"><tr><th scope="row" class="text-left">Total</th><td>{{ number(summary.total) }}</td><td>{{ number(summary.sesuai) }}</td><td>{{ number(summary.menunggu) }}</td><td>{{ number(summary.perbaikan) }}</td><td>{{ number(summary.draft) }}</td><td>{{ number(summary.sk_tersedia) }}</td></tr></tfoot>
          </table>
        </div>
      </section>
      <footer class="text-xs text-slate-500 leading-relaxed border-t border-slate-200 pt-4">
        Sumber: data pengusul Adhira. Tahun menggunakan tanggal upload; jika tidak tersedia, tanggal pembuatan data digunakan. SK tersedia menunjukkan dokumen keputusan telah tercatat, tanpa pemeriksaan isi atau ketersediaan file pada penyimpanan.
      </footer>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { UsersIcon, CheckCircleIcon, ClockIcon, DocumentCheckIcon, ExclamationTriangleIcon, ArrowPathIcon, ArrowDownTrayIcon, PrinterIcon } from '@heroicons/vue/24/outline';
import api from '../../api/client';
import BarChart from '../../components/shared/BarChart.vue';

const filters = reactive({ tahun: '', instansi: '', jenis: '' });
const options = reactive({ tahun: [], instansi: [], jenis: [] });
const report = ref(null);
const loading = ref(false);
const error = ref('');
const summary = computed(() => report.value?.summary || {});
const number = value => new Intl.NumberFormat('id-ID').format(value || 0);
const percent = (value, total) => total ? Math.round(value / total * 100) : 0;
const updatedLabel = computed(() => new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(report.value.updated_at)));
const appliedLabel = computed(() => {
  if (!report.value) return 'Semua tahun · Semua instansi · Semua jenis';
  const f = report.value.filters;
  return [f.tahun || 'Semua tahun', f.instansi || 'Semua instansi', f.jenis || 'Semua jenis'].join(' · ');
});
const cards = computed(() => [
  { label: 'Total pengusul', value: summary.value.total, icon: UsersIcon, color: 'text-[#142a48]', description: `${number(summary.value.instansi_tercakup)} instansi tercakup`, featured: true },
  { label: 'Lolos verifikasi', value: summary.value.sesuai, icon: CheckCircleIcon, color: 'text-emerald-700', description: 'Data dan berkas disetujui' },
  { label: 'Menunggu verifikasi', value: summary.value.menunggu, icon: ClockIcon, color: 'text-amber-700', description: 'Pemeriksaan data atau berkas' },
  { label: 'Perlu perbaikan', value: summary.value.perbaikan, icon: ExclamationTriangleIcon, color: 'text-red-700', description: 'Data atau berkas ditolak' },
  { label: 'SK tersedia', value: summary.value.sk_tersedia, icon: DocumentCheckIcon, color: 'text-[#142a48]', description: 'Dokumen keputusan tercatat' },
]);
const stageDefinitions = [
  {key:'draft',label:'Jenis belum ditetapkan',color:'#94a3b8'},
  {key:'verifikasi_data',label:'Menunggu verifikasi data',color:'#c19646'},
  {key:'verifikasi_berkas',label:'Menunggu verifikasi berkas',color:'#547ba0'},
  {key:'perbaikan',label:'Perlu perbaikan',color:'#be6464'},
  {key:'sesuai',label:'Lolos verifikasi',color:'#278477'},
];
const stages = computed(() => stageDefinitions.map(stage => ({...stage, count: report.value.stages.find(r => r.tahap === stage.key)?.jumlah || 0})));
const kindColors = ['#142a48', '#547ba0', '#c19646', '#94a3b8'];
const trendRows = computed(() => {
  if (!report.value) return [];
  const rows = report.value.trend;
  if (report.value.filters.tahun) return Array.from({length:12}, (_,i) => {
    const periode = `${report.value.filters.tahun}-${String(i+1).padStart(2,'0')}`;
    return { periode, total: rows.find(r => r.periode === periode)?.total || 0, label: ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'][i] };
  });
  return rows.map(row => ({...row, label: row.periode}));
});
const trendDatasets = computed(() => [{ label: 'Pengusul', data: trendRows.value.map(r => r.total), backgroundColor: '#547ba0', borderRadius: 5, maxBarThickness: 44 }]);
const trendDescription = computed(() => trendRows.value.map(r => `${r.label}: ${r.total} pengusul`).join(', '));

async function load() {
  if (loading.value) return;
  loading.value = true; error.value = '';
  const params = Object.fromEntries(Object.entries(filters).filter(([,v]) => v !== ''));
  try {
    const { data } = await api.get('/executive-dashboard', { params });
    report.value = data;
    Object.assign(options, data.options);
  } catch (err) {
    error.value = err.response?.data?.error || 'Data dashboard belum dapat dimuat. Periksa koneksi dan coba lagi.';
    report.value = null;
  } finally { loading.value = false; }
}
function reset() { Object.assign(filters, {tahun:'',instansi:'',jenis:''}); load(); }
function print() { window.print(); }
function csvCell(value) {
  // Prevent spreadsheet formulas in institution labels supplied through forms/imports.
  let text = String(value ?? '');
  if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"','""') + '"';
}
function downloadCsv() {
  const r = report.value;
  const rows = [
    ['Rekap Pengusul Adhira'], ['Filter', appliedLabel.value], ['Diperbarui', updatedLabel.value],
    ['Instansi','Total pengusul','Lolos verifikasi','Menunggu verifikasi','Perlu perbaikan','Draft','SK tersedia'],
    ...r.institutions.map(i => [i.instansi,i.total,i.sesuai,i.menunggu,i.perbaikan,i.draft,i.sk_tersedia]),
    ['Total',r.summary.total,r.summary.sesuai,r.summary.menunggu,r.summary.perbaikan,r.summary.draft,r.summary.sk_tersedia],
  ];
  const blob = new Blob(['\uFEFF' + rows.map(row => row.map(csvCell).join(';')).join('\r\n')], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `rekap-adhira-${r.filters.tahun || 'semua-tahun'}.csv`; a.click(); URL.revokeObjectURL(url);
}
onMounted(load);
</script>

<style scoped>
.filter-select { @apply block w-full mt-2 rounded-lg border-slate-200 text-sm font-normal text-slate-800 focus:border-blue-500 focus:ring-blue-500; }
.primary-button { @apply px-5 py-2.5 bg-[#142a48] rounded-lg text-white text-sm font-medium hover:bg-[#203e64] disabled:opacity-50; }
.action-button { @apply inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40; }
.panel { @apply min-w-0 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6; }
.section-title { @apply font-semibold text-base text-slate-800; }
.section-subtitle { @apply text-xs text-slate-500 mt-1.5 leading-relaxed; }
.attention-row { @apply flex justify-between items-center gap-5 text-sm text-slate-600 pb-3 border-b border-slate-200; }
.attention-row strong { @apply text-lg tabular-nums; }
.institution-table thead { @apply text-xs text-slate-500 bg-slate-50; }
.institution-table th, .institution-table td { @apply px-4 py-3 text-center; }
.institution-table th:first-child { @apply text-left; }
.institution-table tbody tr { @apply border-b border-slate-100; }
.institution-table tfoot { @apply bg-slate-50 font-semibold; }
.chart-area :deep(> div) { height: 100%; }
</style>
