<template>
  <div class="min-h-screen flex bg-gradient-to-br from-emerald-900 via-teal-800 to-gray-900">
    <div class="hidden lg:flex lg:w-1/3 items-center justify-center p-12">
      <div class="text-white max-w-sm">
        <div class="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
        </div>
        <h1 class="text-3xl font-bold mb-3">Pendaftaran</h1>
        <p class="text-emerald-200 text-base">Daftarkan diri Anda sebagai calon penerima Penghargaan Dharma Persandian</p>
      </div>
    </div>
    <div class="w-full lg:w-2/3 flex items-center justify-center p-6">
      <div class="bg-white/95 backdrop-blur shadow-2xl rounded-2xl p-8 w-full max-w-2xl">
        <div class="text-center mb-6">
          <h2 class="text-xl font-bold text-gray-800">Form Registrasi</h2>
          <p class="text-sm text-gray-500 mt-1">Lengkapi data diri untuk mendaftar</p>
        </div>
        <form @submit.prevent="handleRegister" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label class="block text-xs font-medium text-gray-600 mb-1">Nama Lengkap <span class="text-red-500">*</span></label><input v-model="form.nama" required class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none" /></div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Instansi <span class="text-red-500">*</span></label>
              <select v-model="form.instansi" required class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none bg-white">
                <option value="" disabled>Pilih instansi</option>
                <option v-for="opt in INSTANSI_OPTIONS" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <div><label class="block text-xs font-medium text-gray-600 mb-1">NIP/NRP <span class="text-red-500">*</span></label><input v-model="form.nipnrp" required class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none" /></div>
            <div><label class="block text-xs font-medium text-gray-600 mb-1">Username <span class="text-red-500">*</span></label><input v-model="form.username" required minlength="3" maxlength="50" pattern="[a-zA-Z0-9._-]+" title="Huruf, angka, titik, garis bawah, atau strip" class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none" /></div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Password <span class="text-red-500">*</span></label>
              <input v-model="form.password" type="password" required minlength="8" class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none" />
              <p class="text-[11px] text-gray-400 mt-1">Minimal 8 karakter, mengandung huruf dan angka</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Konfirmasi Password <span class="text-red-500">*</span></label>
              <input v-model="form.confirmPassword" type="password" required minlength="8" class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none" />
              <p v-if="form.confirmPassword && form.confirmPassword !== form.password" class="text-[11px] text-red-500 mt-1">Password tidak sama</p>
            </div>
            <div><label class="block text-xs font-medium text-gray-600 mb-1">Email <span class="text-red-500">*</span></label><input v-model="form.email" type="email" required class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none" /></div>
            <div><label class="block text-xs font-medium text-gray-600 mb-1">No HP <span class="text-red-500">*</span></label><input v-model="form.hp" required class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none" /></div>
            <div><label class="block text-xs font-medium text-gray-600 mb-1">Jabatan <span class="text-red-500">*</span></label><input v-model="form.jabatan" required class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none" /></div>
            <div><label class="block text-xs font-medium text-gray-600 mb-1">Unit Kerja <span class="text-red-500">*</span></label><input v-model="form.unit_kerja" required class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none" /></div>
            <div class="sm:col-span-2">
              <label class="block text-xs font-medium text-gray-600 mb-1">Pangkat/Golongan <span class="text-red-500">*</span></label>
              <select v-model="form.pangkat" required class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none bg-white">
                <option value="" disabled>Pilih pangkat/golongan</option>
                <optgroup label="TNI Angkatan Darat">
                  <option v-for="opt in PANGKAT_TNI_AD" :key="'ad-' + opt" :value="opt">{{ opt }}</option>
                </optgroup>
                <optgroup label="TNI Angkatan Udara">
                  <option v-for="opt in PANGKAT_TNI_AU" :key="'au-' + opt" :value="opt">{{ opt }}</option>
                </optgroup>
                <optgroup label="TNI Angkatan Laut">
                  <option v-for="opt in PANGKAT_TNI_AL" :key="'al-' + opt" :value="opt">{{ opt }}</option>
                </optgroup>
                <optgroup label="Polri">
                  <option v-for="opt in PANGKAT_POLRI" :key="'polri-' + opt" :value="opt">{{ opt }}</option>
                </optgroup>
                <optgroup label="PNS / Golongan">
                  <option v-for="opt in PANGKAT_PNS" :key="'pns-' + opt" :value="opt">{{ opt }}</option>
                </optgroup>
              </select>
            </div>
          </div>
          <p v-if="error" class="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg flex items-center gap-2">
            <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
            {{ error }}
          </p>
          <p v-if="success" class="text-sm text-emerald-700 bg-emerald-50 px-4 py-2 rounded-lg flex items-center gap-2">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
            {{ success }}
            <router-link to="/login" class="ml-2 font-medium underline">Login sekarang</router-link>
          </p>
          <button type="submit" :disabled="loading" class="w-full bg-emerald-600 text-white py-2.5 rounded-xl font-medium hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-200 transition disabled:opacity-50">
            {{ loading ? 'Memproses...' : 'Daftar' }}
          </button>
          <p class="text-center text-sm text-gray-500">Sudah punya akun? <router-link to="/login" class="text-emerald-600 hover:underline font-medium">Login</router-link></p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import api from '../../api/client';
import {
  INSTANSI_OPTIONS, PANGKAT_TNI_AD, PANGKAT_TNI_AU, PANGKAT_TNI_AL, PANGKAT_POLRI, PANGKAT_PNS,
} from '../../constants/rank-data';

// NIP/NRP satu field saja (tidak dibedakan per instansi -- bisa saja ASN
// bertugas di lingkungan Polri/TNI atau sebaliknya). Golongan/pangkat juga
// sengaja ditampilkan semua (tidak difilter per instansi).
const form = ref({ nama: '', nipnrp: '', username: '', password: '', confirmPassword: '', email: '', hp: '', instansi: '', jabatan: '', unit_kerja: '', pangkat: '' });
const error = ref(''); const success = ref(''); const loading = ref(false);

async function handleRegister() {
  error.value = ''; success.value = '';
  if (form.value.password !== form.value.confirmPassword) {
    error.value = 'Konfirmasi password tidak sama';
    return;
  }
  loading.value = true;
  try {
    const { data } = await api.post('/auth/register', form.value);
    success.value = data.message;
  } catch (err) {
    error.value = err.response?.data?.error || 'Registrasi gagal';
  } finally { loading.value = false; }
}
</script>
