<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <h2 class="text-xl font-bold text-gray-800">Berkas Penghargaan Individu</h2>
        <p class="text-sm text-gray-500 mt-0.5">Kelola data individu dan dokumen penghargaan</p>
      </div>
      <button @click="openAdd" class="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition shadow-sm">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Tambah Data
      </button>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-5 flex flex-wrap gap-4 items-end">
      <div>
        <label class="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Tahun</label>
        <select v-model="filter.tahun" @change="fetchData" class="border border-gray-300 rounded-xl px-3 py-2 text-sm min-w-[140px] focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none bg-white">
          <option value="">Semua Tahun</option>
          <option v-for="y in filters.tahun" :key="y" :value="y">{{ y }}</option>
        </select>
      </div>
      <div>
        <label class="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Jenis Penghargaan</label>
        <select v-model="filter.jenis" @change="fetchData" class="border border-gray-300 rounded-xl px-3 py-2 text-sm min-w-[180px] focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none bg-white">
          <option value="">Semua Jenis</option>
          <option v-for="j in filters.jenis" :key="j" :value="j">{{ j }}</option>
        </select>
      </div>
      <div>
        <label class="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Instansi</label>
        <select v-model="filter.instansi" @change="fetchData" class="border border-gray-300 rounded-xl px-3 py-2 text-sm min-w-[180px] focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none bg-white">
          <option value="">Semua Instansi</option>
          <option v-for="i in filters.instansi" :key="i" :value="i">{{ i }}</option>
        </select>
      </div>
      <button @click="resetFilters" class="px-4 py-2 text-sm border border-gray-300 rounded-xl hover:bg-gray-50 transition text-gray-600">Reset</button>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[2000px]">
          <thead><tr class="bg-gray-50 text-left">
            <th class="p-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Nama / NIP</th>
            <th class="p-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Instansi / Jabatan</th>
            <th class="p-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Jenis</th>
            <th class="p-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap text-center">Verif. Data</th>
            <th class="p-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap text-center">Verif. Berkas</th>
            <th class="p-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Tgl</th>
            <th class="p-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap text-center">KEPKA</th>
            <th class="p-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap text-center">KTP</th>
            <th class="p-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap text-center">DRH</th>
            <th class="p-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap text-center">Angkat</th>
            <th class="p-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap text-center">Kep-Jab</th>
            <th class="p-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap text-center">Surat Usulan</th>
            <th class="p-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap text-center">SK CPNS/PNS</th>
            <th class="p-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap text-center">Piagam</th>
            <th class="p-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap text-right">Aksi</th>
          </tr></thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="loading"><td :colspan="15" class="p-12 text-center text-gray-400"><div class="animate-pulse">Memuat data...</div></td></tr>
            <tr v-else-if="data.length === 0"><td :colspan="15" class="p-12 text-center text-gray-400">Belum ada data</td></tr>
            <template v-for="row in data" :key="row.id">
            <tr class="hover:bg-gray-50 transition text-xs">
              <td class="p-2.5 whitespace-nowrap"><div class="font-medium text-gray-800">{{ row.nama }}</div><div class="text-gray-400 font-mono text-[10px]">{{ row.nipnrp }}</div></td>
              <td class="p-2.5 whitespace-nowrap"><div class="text-gray-700">{{ row.instansi || '-' }}</div><div class="text-gray-400 text-[10px]">{{ certPreview(row) || '-' }} / {{ row.pangkat || '-' }}</div></td>
              <td class="p-2.5 whitespace-nowrap"><span class="px-1.5 py-0.5 text-[10px] rounded-full bg-blue-50 text-blue-700 font-medium">{{ row.jenis_penghargaan || '-' }}</span></td>
              <td class="p-2.5 text-center"><StatusBadge :status="row.verifikasi_data_status" /></td>
              <td class="p-2.5 text-center"><StatusBadge :status="row.verifikasi_berkas_status" /></td>
              <td class="p-2.5 whitespace-nowrap text-gray-600">{{ row.tgl_penghargaan || '-' }}</td>
              <td class="p-2.5 text-center"><button type="button" v-if="row.file_kepka" @click="openPreview('/individu/' + row.id + '/download/file_kepka', row.file_kepka)" class="text-blue-600 hover:text-blue-800 text-[10px] font-medium">Lihat</button><span v-else class="text-gray-300 text-xs">-</span></td>
              <td class="p-2.5 text-center"><button type="button" v-if="row.file_ktp" @click="openPreview('/individu/' + row.id + '/download/file_ktp', row.file_ktp)" class="text-blue-600 hover:text-blue-800 text-[10px] font-medium">Lihat</button><span v-else class="text-gray-300 text-xs">-</span></td>
              <td class="p-2.5 text-center"><button type="button" v-if="row.file_drh" @click="openPreview('/individu/' + row.id + '/download/file_drh', row.file_drh)" class="text-blue-600 hover:text-blue-800 text-[10px] font-medium">Lihat</button><span v-else class="text-gray-300 text-xs">-</span></td>
              <td class="p-2.5 text-center"><button type="button" v-if="row.file_pengangkatan" @click="openPreview('/individu/' + row.id + '/download/file_pengangkatan', row.file_pengangkatan)" class="text-blue-600 hover:text-blue-800 text-[10px] font-medium">Lihat</button><span v-else class="text-gray-300 text-xs">-</span></td>
              <td class="p-2.5 text-center"><button type="button" v-if="row.file_keputusan_jabatan" @click="openPreview('/individu/' + row.id + '/download/file_keputusan_jabatan', row.file_keputusan_jabatan)" class="text-blue-600 hover:text-blue-800 text-[10px] font-medium">Lihat</button><span v-else class="text-gray-300 text-xs">-</span></td>
              <td class="p-2.5 text-center"><button type="button" v-if="row.file_surat_usulan" @click="openPreview('/individu/' + row.id + '/download/file_surat_usulan', row.file_surat_usulan)" class="text-blue-600 hover:text-blue-800 text-[10px] font-medium">Lihat</button><span v-else class="text-gray-300 text-xs">-</span></td>
              <td class="p-2.5 text-center"><button type="button" v-if="row.file_sk_cpns_pns" @click="openPreview('/individu/' + row.id + '/download/file_sk_cpns_pns', row.file_sk_cpns_pns)" class="text-blue-600 hover:text-blue-800 text-[10px] font-medium">Lihat</button><span v-else class="text-gray-300 text-xs">-</span></td>
              <td class="p-2.5 text-center"><button type="button" v-if="row.file_piagam_penghargaan" @click="openPreview('/individu/' + row.id + '/download/file_piagam_penghargaan', row.file_piagam_penghargaan)" class="text-blue-600 hover:text-blue-800 text-[10px] font-medium">Lihat</button><span v-else class="text-gray-300 text-xs">-</span></td>
              <td class="p-2.5 whitespace-nowrap text-right">
                <button @click="toggleVerify(row)" class="px-2 py-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition mr-0.5">Verifikasi</button>
                <button @click="openEdit(row)" class="px-2 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition mr-0.5">Edit</button>
                <button @click="confirmDelete(row)" class="px-2 py-1 text-[11px] font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition">Hapus</button>
              </td>
            </tr>
            <tr v-if="verifyingId === row.id" class="bg-indigo-50/40 text-xs">
              <td colspan="15" class="p-4">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <div class="flex items-center justify-between mb-2"><span class="font-semibold text-gray-700">Verifikasi Data Pribadi</span><StatusBadge :status="row.verifikasi_data_status" /></div>
                    <p v-if="row.verifikasi_data_catatan" class="text-[11px] bg-gray-50 border border-gray-200 rounded-lg p-2 mb-2">{{ row.verifikasi_data_catatan }}</p>
                    <VerifikasiPanel :saving="verifySaving" @approve="submitVerify(row, 'data', 'Disetujui')" @reject="(catatan) => submitVerify(row, 'data', 'Ditolak', catatan)" />
                  </div>
                  <div>
                    <div class="flex items-center justify-between mb-2"><span class="font-semibold text-gray-700">Verifikasi Berkas</span><StatusBadge :status="row.verifikasi_berkas_status" /></div>
                    <p v-if="row.verifikasi_berkas_catatan" class="text-[11px] bg-gray-50 border border-gray-200 rounded-lg p-2 mb-2">{{ row.verifikasi_berkas_catatan }}</p>
                    <VerifikasiPanel :saving="verifySaving" @approve="submitVerify(row, 'berkas', 'Disetujui')" @reject="(catatan) => submitVerify(row, 'berkas', 'Ditolak', catatan)" />
                  </div>
                </div>
                <p v-if="verifyError" class="text-[11px] text-red-600 mt-2">{{ verifyError }}</p>
              </td>
            </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body"><div v-if="showAdd" class="fixed inset-0 z-50 flex items-center justify-center p-4"><div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showAdd=false"></div><div class="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"><div class="p-6"><div class="flex items-center justify-between mb-5"><h3 class="text-lg font-bold text-gray-800">Tambah Data Individu</h3><button @click="showAdd=false" class="text-gray-400 hover:text-gray-600"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button></div><form @submit.prevent="handleAdd" class="space-y-4"><div class="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label class="block text-xs font-medium text-gray-600 mb-1">Nama <span class="text-red-500">*</span></label><input v-model="form.nama" required class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"/></div><div><label class="block text-xs font-medium text-gray-600 mb-1">NIP/NRP <span class="text-red-500">*</span></label><input v-model="form.nipnrp" required class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"/></div><div><label class="block text-xs font-medium text-gray-600 mb-1">Instansi</label><input v-model="form.instansi" class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"/></div><div><label class="block text-xs font-medium text-gray-600 mb-1">Jabatan</label><input v-model="form.jabatan" class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"/></div><div><label class="block text-xs font-medium text-gray-600 mb-1">Unit Kerja</label><input v-model="form.unit_kerja" class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"/></div><div class="sm:col-span-2"><p class="text-[11px] font-medium text-gray-500 mb-1.5">Pratinjau baris sertifikat</p><div v-if="certPreview(form)" class="inline-block bg-yellow-200 px-3 py-2 rounded-lg border border-yellow-300 shadow-sm"><span class="text-red-600 font-bold text-sm">{{ certPreview(form) }}</span></div><p v-else class="text-[11px] text-gray-400 italic">Isi Jabatan dan Unit Kerja untuk melihat pratinjau</p></div><div><label class="block text-xs font-medium text-gray-600 mb-1">Pangkat</label><input v-model="form.pangkat" class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"/></div><div><label class="block text-xs font-medium text-gray-600 mb-1">Jenis Penghargaan</label><input v-model="form.jenis_penghargaan" class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"/></div><div><label class="block text-xs font-medium text-gray-600 mb-1">Tgl Penghargaan <span class="text-red-500">*</span></label><input v-model="form.tgl_penghargaan" type="date" required class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"/></div></div><div class="border-t border-gray-100 pt-4"><h4 class="text-sm font-semibold text-gray-700 mb-3">Riwayat Kepegawaian</h4><div class="grid grid-cols-2 sm:grid-cols-4 gap-3"><div><label class="block text-[11px] font-medium text-gray-500 mb-1">TMT CPNS/PNS</label><input v-model="form.tgl_tmt_cpns_pns" type="date" class="w-full border border-gray-300 rounded-xl px-2.5 py-2 text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"/></div><div><label class="block text-[11px] font-medium text-gray-500 mb-1">Masa Kerja Kumulatif (th/bln)</label><div class="flex gap-1.5"><input v-model.number="form.masa_kerja_kumulatif_tahun" type="number" min="0" class="w-full border border-gray-300 rounded-xl px-2 py-2 text-xs"/><input v-model.number="form.masa_kerja_kumulatif_bulan" type="number" min="0" max="11" class="w-full border border-gray-300 rounded-xl px-2 py-2 text-xs"/></div></div><div><label class="block text-[11px] font-medium text-gray-500 mb-1">Masa Kerja Pengurangan (th/bln)</label><div class="flex gap-1.5"><input v-model.number="form.masa_kerja_pengurangan_tahun" type="number" min="0" class="w-full border border-gray-300 rounded-xl px-2 py-2 text-xs"/><input v-model.number="form.masa_kerja_pengurangan_bulan" type="number" min="0" max="11" class="w-full border border-gray-300 rounded-xl px-2 py-2 text-xs"/></div></div><div><label class="block text-[11px] font-medium text-gray-500 mb-1">Masa Kerja Persandian (otomatis)</label><div class="w-full border border-gray-200 bg-gray-50 rounded-xl px-2.5 py-2 text-xs text-gray-600">{{ masaKerja(form).tahun }} th {{ masaKerja(form).bulan }} bln</div></div></div></div><div class="border-t border-gray-100 pt-4"><h4 class="text-sm font-semibold text-gray-700 mb-3">Upload Dokumen</h4><div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3"><div v-for="doc in ALL_DOCS" :key="doc.col"><label class="block text-[11px] font-medium text-gray-500 mb-1 truncate" :title="doc.label">{{ doc.label }}<span v-if="REQUIRED_COLS.has(doc.col)" class="text-red-500"> *</span></label><input type="file" :ref="el => addRefs[doc.col] = el" class="w-full text-xs text-gray-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 file:border-0 hover:file:bg-blue-100"/><input v-if="doc.titleCol" v-model="form[doc.titleCol]" type="text" placeholder="Judul berkas" class="w-full mt-1 border border-gray-200 rounded-lg px-2 py-1 text-[10px]"/></div></div></div><p v-if="formError" class="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{{ formError }}</p><div class="flex justify-end gap-3 pt-3"><button type="button" @click="showAdd=false" class="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition">Batal</button><button type="submit" :disabled="saving" class="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">{{ saving ? 'Menyimpan...' : 'Simpan' }}</button></div></form></div></div></div></Teleport>

    <Teleport to="body"><div v-if="showEdit" class="fixed inset-0 z-50 flex items-center justify-center p-4"><div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showEdit=false"></div><div class="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"><div class="p-6"><div class="flex items-center justify-between mb-5"><h3 class="text-lg font-bold text-gray-800">Edit Data Individu</h3><button @click="showEdit=false" class="text-gray-400 hover:text-gray-600"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button></div><form @submit.prevent="handleEdit" class="space-y-4"><div class="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label class="block text-xs font-medium text-gray-600 mb-1">Nama</label><input v-model="editForm.nama" required class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"/></div><div><label class="block text-xs font-medium text-gray-600 mb-1">NIP/NRP</label><input v-model="editForm.nipnrp" required class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"/></div><div class="col-span-2 grid grid-cols-2 sm:grid-cols-2 gap-4"><div><label class="block text-xs font-medium text-gray-600 mb-1">Instansi</label><input v-model="editForm.instansi" class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"/></div><div><label class="block text-xs font-medium text-gray-600 mb-1">Jabatan</label><input v-model="editForm.jabatan" class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"/></div><div><label class="block text-xs font-medium text-gray-600 mb-1">Unit Kerja</label><input v-model="editForm.unit_kerja" class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"/></div><div class="col-span-2"><p class="text-[11px] font-medium text-gray-500 mb-1.5">Pratinjau baris sertifikat</p><div v-if="certPreview(editForm)" class="inline-block bg-yellow-200 px-3 py-2 rounded-lg border border-yellow-300 shadow-sm"><span class="text-red-600 font-bold text-sm">{{ certPreview(editForm) }}</span></div><p v-else class="text-[11px] text-gray-400 italic">Isi Jabatan dan Unit Kerja untuk melihat pratinjau</p></div><div><label class="block text-xs font-medium text-gray-600 mb-1">Pangkat</label><input v-model="editForm.pangkat" class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"/></div><div><label class="block text-xs font-medium text-gray-600 mb-1">Jenis Penghargaan</label><input v-model="editForm.jenis_penghargaan" class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"/></div><div><label class="block text-xs font-medium text-gray-600 mb-1">Tgl Penghargaan</label><input v-model="editForm.tgl_penghargaan" type="date" required class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"/></div></div></div><div class="border-t border-gray-100 pt-4"><h4 class="text-sm font-semibold text-gray-700 mb-3">Riwayat Kepegawaian</h4><div class="grid grid-cols-2 sm:grid-cols-4 gap-3"><div><label class="block text-[11px] font-medium text-gray-500 mb-1">TMT CPNS/PNS</label><input v-model="editForm.tgl_tmt_cpns_pns" type="date" class="w-full border border-gray-300 rounded-xl px-2.5 py-2 text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"/></div><div><label class="block text-[11px] font-medium text-gray-500 mb-1">Masa Kerja Kumulatif (th/bln)</label><div class="flex gap-1.5"><input v-model.number="editForm.masa_kerja_kumulatif_tahun" type="number" min="0" class="w-full border border-gray-300 rounded-xl px-2 py-2 text-xs"/><input v-model.number="editForm.masa_kerja_kumulatif_bulan" type="number" min="0" max="11" class="w-full border border-gray-300 rounded-xl px-2 py-2 text-xs"/></div></div><div><label class="block text-[11px] font-medium text-gray-500 mb-1">Masa Kerja Pengurangan (th/bln)</label><div class="flex gap-1.5"><input v-model.number="editForm.masa_kerja_pengurangan_tahun" type="number" min="0" class="w-full border border-gray-300 rounded-xl px-2 py-2 text-xs"/><input v-model.number="editForm.masa_kerja_pengurangan_bulan" type="number" min="0" max="11" class="w-full border border-gray-300 rounded-xl px-2 py-2 text-xs"/></div></div><div><label class="block text-[11px] font-medium text-gray-500 mb-1">Masa Kerja Persandian (otomatis)</label><div class="w-full border border-gray-200 bg-gray-50 rounded-xl px-2.5 py-2 text-xs text-gray-600">{{ masaKerja(editForm).tahun }} th {{ masaKerja(editForm).bulan }} bln</div></div></div></div><div class="border-t border-gray-100 pt-4"><h4 class="text-sm font-semibold text-gray-700 mb-3">Upload Dokumen Baru <span class="text-xs text-gray-400 font-normal">(kosongkan jika tidak diubah)</span></h4><div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3"><div v-for="doc in ALL_DOCS" :key="'e'+doc.col"><label class="block text-[11px] font-medium text-gray-500 mb-1 truncate" :title="doc.label">{{ doc.label }}<span v-if="REQUIRED_COLS.has(doc.col)" class="text-red-500"> *</span></label><div v-if="editForm[doc.col]" class="text-[10px] text-green-600 mb-1 truncate max-w-[120px]">{{ editForm[doc.col] }}</div><input type="file" :ref="el => editRefs[doc.col] = el" class="w-full text-xs text-gray-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 file:border-0 hover:file:bg-blue-100"/><input v-if="doc.titleCol" v-model="editForm[doc.titleCol]" type="text" placeholder="Judul berkas" class="w-full mt-1 border border-gray-200 rounded-lg px-2 py-1 text-[10px]"/></div></div></div><p v-if="formError" class="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{{ formError }}</p><div class="flex justify-end gap-3 pt-3"><button type="button" @click="showEdit=false" class="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition">Batal</button><button type="submit" :disabled="saving" class="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">{{ saving ? 'Menyimpan...' : 'Update' }}</button></div></form></div></div></div></Teleport>

    <ConfirmModal :show="showConfirm" message="Hapus data ini? Semua file terkait akan dihapus." @close="showConfirm=false" @confirm="handleDelete" />
    <FilePreviewModal :show="previewState.show" :api-url="previewState.apiUrl" :filename="previewState.filename" @close="closePreview" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import api from '../../api/client';
import ConfirmModal from '../../components/shared/ConfirmModal.vue';
import StatusBadge from '../../components/shared/StatusBadge.vue';
import FilePreviewModal from '../../components/shared/FilePreviewModal.vue';
import { buildCertificateLine } from '../../constants/certificate';
import { useFilePreview } from '../../composables/useFilePreview';
import { ALL_DOCS, REQUIRED_DOCS } from '../../constants/documents';
import { computeMasaKerjaPersandian } from '../../constants/masa-kerja';
import VerifikasiPanel from '../../components/verifikator/VerifikasiPanel.vue';

const { previewState, openPreview, closePreview } = useFilePreview();

const data = ref([]);
const filters = ref({ tahun: [], jenis: [], instansi: [] });
const filter = reactive({ tahun: '', jenis: '', instansi: '' });
const loading = ref(true);
const showAdd = ref(false); const showEdit = ref(false); const showConfirm = ref(false);
const formError = ref(''); const saving = ref(false); const deleteId = ref(null);
const addRefs = {}; const editRefs = {};

const fileColumns = ALL_DOCS.map((d) => d.col);
const REQUIRED_COLS = new Set(REQUIRED_DOCS.map((d) => d.col));

const textFields = [
  'nama','nipnrp','instansi','jabatan','unit_kerja','pangkat','jenis_penghargaan','tgl_penghargaan',
  'tgl_tmt_cpns_pns','masa_kerja_kumulatif_tahun','masa_kerja_kumulatif_bulan','masa_kerja_pengurangan_tahun','masa_kerja_pengurangan_bulan',
  'judul_surat_usulan','judul_sk_cpns_pns','judul_pengangkatan','judul_keputusan_jabatan','judul_piagam_penghargaan',
];
const emptyForm = Object.fromEntries(textFields.map(k=>[k,'']));
const form = reactive({...emptyForm});
const editForm = reactive({id:null,...Object.fromEntries(fileColumns.map(k=>[k,''])),...emptyForm});
function masaKerja(obj) { return computeMasaKerjaPersandian(obj); }

const verifyingId = ref(null);
const verifySaving = ref(false);
const verifyError = ref('');
function toggleVerify(row) {
  verifyingId.value = verifyingId.value === row.id ? null : row.id;
  verifyError.value = '';
}
async function submitVerify(row, kind, status, catatan) {
  verifyError.value = ''; verifySaving.value = true;
  try {
    const { data: updated } = await api.put('/individu/' + row.id + '/verifikasi-' + kind, { status, catatan });
    Object.assign(row, updated);
  } catch (err) {
    verifyError.value = err.response?.data?.error || 'Gagal memverifikasi';
  } finally { verifySaving.value = false; }
}

async function fetchData() {
  try {
    const params = {};
    if (filter.tahun) params.tahun = filter.tahun;
    if (filter.jenis) params.jenis = filter.jenis;
    if (filter.instansi) params.instansi = filter.instansi;
    const { data: d } = await api.get('/individu', { params });
    data.value = d;
  } finally { loading.value = false; }
}

async function fetchFilters() { const { data: d } = await api.get('/individu/filters'); filters.value = d; }
function certPreview(row) { return buildCertificateLine(row); }
function resetFilters() { filter.tahun = ''; filter.jenis = ''; filter.instansi = ''; fetchData(); }
function openAdd() { formError.value = ''; Object.assign(form, {...emptyForm}); showAdd.value = true; }

async function handleAdd() {
  saving.value = true; formError.value = '';
  try {
    const fd = new FormData();
    for (const k of textFields) if (form[k]) fd.append(k, form[k]);
    for (const k of fileColumns) { const el = addRefs[k]; if (el?.files?.[0]) fd.append(k, el.files[0]); }
    await api.post('/individu', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    showAdd.value = false; loading.value = true; await fetchData();
  } catch (err) { formError.value = err.response?.data?.error || 'Gagal menyimpan'; }
  finally { saving.value = false; }
}

function openEdit(row) {
  formError.value = '';
  const init = {id:row.id,...Object.fromEntries(textFields.map(k=>[k,row[k]||''])),...Object.fromEntries(fileColumns.map(k=>[k,row[k]||'']))};
  Object.assign(editForm, init);
  showEdit.value = true;
}

async function handleEdit() {
  saving.value = true; formError.value = '';
  try {
    const fd = new FormData();
    for (const k of textFields) if (editForm[k]) fd.append(k, editForm[k]);
    for (const k of fileColumns) { const el = editRefs[k]; if (el?.files?.[0]) fd.append(k, el.files[0]); }
    await api.put('/individu/' + editForm.id, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    showEdit.value = false; loading.value = true; await fetchData();
  } catch (err) { formError.value = err.response?.data?.error || 'Gagal update'; }
  finally { saving.value = false; }
}

function confirmDelete(row) { deleteId.value = row.id; showConfirm.value = true; }
async function handleDelete() { await api.delete('/individu/' + deleteId.value); showConfirm.value = false; loading.value = true; await fetchData(); }
onMounted(() => { fetchData(); fetchFilters(); });
</script>
