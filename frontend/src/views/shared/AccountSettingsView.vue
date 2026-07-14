<template>
  <div class="space-y-6">
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 class="text-sm font-semibold text-gray-800 mb-4">Profil Saya</h3>
      <form @submit.prevent="handleProfileSave" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Nama Lengkap</label>
            <input v-model="profileForm.nama" required minlength="3" class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Username</label>
            <input :value="authStore.user?.username" disabled class="w-full border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-500" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input v-model="profileForm.email" type="email" class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">No HP</label>
            <input v-model="profileForm.hp" class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none" />
          </div>
        </div>

        <template v-if="authStore.user?.level === 'User'">
          <div class="border-t border-gray-100 pt-4">
            <div v-if="profileForm.verifikasi_data_status === 'Ditolak'" class="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <h4 class="text-sm font-semibold text-red-800 flex items-center gap-1.5">
                <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
                Data Pribadi Ditolak Verifikator
              </h4>
              <p class="text-xs text-red-700 mt-1">{{ profileForm.verifikasi_data_catatan || 'Tidak ada catatan.' }}</p>
              <p class="text-xs text-red-700 mt-1">Silakan perbaiki data di bawah ini, lalu klik <strong>Simpan Profil</strong> untuk mengajukannya kembali.</p>
            </div>
            <h4 class="text-xs font-semibold text-gray-700 mb-3">Data Kepegawaian</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">NIP/NRP</label>
                <input :value="profileForm.nipnrp || '-'" disabled class="w-full border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-500" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Jabatan</label>
                <input v-model="profileForm.jabatan" placeholder="mis. Kasi Sandi" class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Unit Kerja</label>
                <input v-model="profileForm.unit_kerja" placeholder="mis. Diskomlek Kolinlamil" class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Instansi</label>
                <select v-model="profileForm.instansi" class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none bg-white">
                  <option value="" disabled>Pilih instansi</option>
                  <option v-for="opt in INSTANSI_OPTIONS" :key="opt" :value="opt">{{ opt }}</option>
                </select>
              </div>
              <div class="sm:col-span-2 lg:col-span-4 -mt-1">
                <p class="text-[11px] font-medium text-gray-500 mb-1.5">Pratinjau baris sertifikat</p>
                <div v-if="certificatePreview" class="inline-block bg-yellow-200 px-3 py-2 rounded-lg border border-yellow-300 shadow-sm">
                  <span class="text-red-600 font-bold text-sm">{{ certificatePreview }}</span>
                </div>
                <p v-else class="text-[11px] text-gray-400 italic">Isi Jabatan dan Unit Kerja untuk melihat pratinjau</p>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Pangkat/Golongan</label>
                <select v-model="profileForm.pangkat" class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none bg-white">
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

            <div v-if="profileForm.instansi === 'Pemerintah Daerah'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-dashed border-gray-200">
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Jenis Pemerintah Daerah</label>
                <select v-model="profileForm.pemda_tipe" class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none bg-white">
                  <option value="" disabled>Pilih jenis</option>
                  <option value="Pemerintah Provinsi">Pemerintah Provinsi (Pemprov)</option>
                  <option value="Pemerintah Kabupaten">Pemerintah Kabupaten (Pemkab)</option>
                  <option value="Pemerintah Kota">Pemerintah Kota (Pemkot)</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Provinsi</label>
                <select v-model="profileForm.pemda_provinsi" :disabled="!profileForm.pemda_tipe" class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none bg-white disabled:bg-gray-100 disabled:text-gray-400">
                  <option value="" disabled>{{ profileForm.pemda_tipe ? 'Pilih provinsi' : 'Pilih jenis dahulu' }}</option>
                  <option v-for="p in PROVINCES" :key="p.id" :value="p.name">{{ p.name }}</option>
                </select>
              </div>
              <div v-if="profileForm.pemda_tipe === 'Pemerintah Kabupaten' || profileForm.pemda_tipe === 'Pemerintah Kota'">
                <label class="block text-xs font-medium text-gray-600 mb-1">{{ profileForm.pemda_tipe === 'Pemerintah Kota' ? 'Kota' : 'Kabupaten' }}</label>
                <select v-model="profileForm.pemda_kabkota" :disabled="!profileForm.pemda_provinsi" class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none bg-white disabled:bg-gray-100 disabled:text-gray-400">
                  <option value="" disabled>{{ profileForm.pemda_provinsi ? 'Pilih ' + (profileForm.pemda_tipe === 'Pemerintah Kota' ? 'kota' : 'kabupaten') : 'Pilih provinsi dahulu' }}</option>
                  <option v-for="r in filteredRegencies" :key="r.id" :value="r.name">{{ r.name }}</option>
                </select>
              </div>
            </div>

            <p class="text-[11px] text-gray-400 mt-2">Data ini akan tampil di halaman Upload Berkas Usulan.</p>
          </div>
        </template>

        <p v-if="profileError" class="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{{ profileError }}</p>
        <p v-if="profileSuccess" class="text-sm text-emerald-700 bg-emerald-50 px-4 py-2 rounded-lg">{{ profileSuccess }}</p>
        <button type="submit" :disabled="profileLoading" class="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
          {{ profileLoading ? 'Menyimpan...' : 'Simpan Profil' }}
        </button>
      </form>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 class="text-sm font-semibold text-gray-800 mb-4">Ubah Password</h3>
      <form @submit.prevent="handlePasswordChange" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Password Saat Ini</label>
            <input v-model="passwordForm.currentPassword" type="password" required class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Password Baru</label>
            <input v-model="passwordForm.newPassword" type="password" required minlength="8" class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none" />
            <p class="text-[11px] text-gray-400 mt-1">Minimal 8 karakter, huruf dan angka</p>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Konfirmasi Password Baru</label>
            <input v-model="passwordForm.confirmPassword" type="password" required minlength="8" class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none" />
            <p v-if="passwordForm.confirmPassword && passwordForm.confirmPassword !== passwordForm.newPassword" class="text-[11px] text-red-500 mt-1">Password tidak sama</p>
          </div>
        </div>
        <p v-if="passwordError" class="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{{ passwordError }}</p>
        <p v-if="passwordSuccess" class="text-sm text-emerald-700 bg-emerald-50 px-4 py-2 rounded-lg">{{ passwordSuccess }}</p>
        <button type="submit" :disabled="passwordLoading" class="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
          {{ passwordLoading ? 'Menyimpan...' : 'Ubah Password' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch, onMounted } from 'vue';
import api from '../../api/client';
import { useAuthStore } from '../../stores/auth';
import {
  INSTANSI_OPTIONS, PANGKAT_TNI_AD, PANGKAT_TNI_AU, PANGKAT_TNI_AL, PANGKAT_POLRI, PANGKAT_PNS,
} from '../../constants/rank-data';
import { PROVINCES, REGENCIES } from '../../constants/wilayah';
import { buildCertificateLine } from '../../constants/certificate';

const authStore = useAuthStore();

const profileForm = reactive({
  nama: '', email: '', hp: '', nipnrp: '', instansi: '', jabatan: '', unit_kerja: '', pangkat: '',
  pemda_tipe: '', pemda_provinsi: '', pemda_kabkota: '',
  verifikasi_data_status: '', verifikasi_data_catatan: '',
});
const profileError = ref(''); const profileSuccess = ref(''); const profileLoading = ref(false);

const certificatePreview = computed(() => buildCertificateLine(profileForm));

const filteredRegencies = computed(() => {
  const type = profileForm.pemda_tipe === 'Pemerintah Kota' ? 'Kota' : 'Kabupaten';
  return REGENCIES.filter((r) => r.provinceName === profileForm.pemda_provinsi && r.type === type);
});

let loading = false;
watch(() => profileForm.instansi, () => {
  if (loading) return;
  if (profileForm.instansi !== 'Pemerintah Daerah') {
    profileForm.pemda_tipe = ''; profileForm.pemda_provinsi = ''; profileForm.pemda_kabkota = '';
  }
});
watch(() => profileForm.pemda_tipe, () => {
  if (loading) return;
  profileForm.pemda_kabkota = '';
});
watch(() => profileForm.pemda_provinsi, () => {
  if (loading) return;
  profileForm.pemda_kabkota = '';
});

const passwordForm = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' });
const passwordError = ref(''); const passwordSuccess = ref(''); const passwordLoading = ref(false);

async function loadProfile() {
  loading = true;
  try {
    const { data } = await api.get('/user/self/profile');
    profileForm.nama = data.nama || '';
    profileForm.email = data.email || '';
    profileForm.hp = data.hp || '';
    profileForm.nipnrp = data.nipnrp || '';
    profileForm.instansi = data.instansi || '';
    profileForm.jabatan = data.jabatan || '';
    profileForm.unit_kerja = data.unit_kerja || '';
    profileForm.pangkat = data.pangkat || '';
    profileForm.pemda_tipe = data.pemda_tipe || '';
    profileForm.pemda_provinsi = data.pemda_provinsi || '';
    profileForm.pemda_kabkota = data.pemda_kabkota || '';
    profileForm.verifikasi_data_status = data.verifikasi_data_status || '';
    profileForm.verifikasi_data_catatan = data.verifikasi_data_catatan || '';
  } catch {
    // fall back to what's already in the auth store
    profileForm.nama = authStore.user?.nama || '';
  } finally {
    loading = false;
  }
}

async function handleProfileSave() {
  profileError.value = ''; profileSuccess.value = ''; profileLoading.value = true;
  const wasRejected = profileForm.verifikasi_data_status === 'Ditolak';
  try {
    const payload = { nama: profileForm.nama, email: profileForm.email, hp: profileForm.hp };
    if (authStore.user?.level === 'User') {
      payload.instansi = profileForm.instansi;
      payload.jabatan = profileForm.jabatan;
      payload.unit_kerja = profileForm.unit_kerja;
      payload.pangkat = profileForm.pangkat;
      const isPemda = profileForm.instansi === 'Pemerintah Daerah';
      payload.pemda_tipe = isPemda ? profileForm.pemda_tipe : '';
      payload.pemda_provinsi = isPemda ? profileForm.pemda_provinsi : '';
      payload.pemda_kabkota = isPemda && profileForm.pemda_tipe !== 'Pemerintah Provinsi' ? profileForm.pemda_kabkota : '';
    }
    const { data } = await api.put('/user/self/profile', payload);
    authStore.user = { ...authStore.user, nama: data.nama };
    localStorage.setItem('user', JSON.stringify(authStore.user));
    await loadProfile();
    profileSuccess.value = wasRejected && profileForm.verifikasi_data_status !== 'Ditolak'
      ? 'Profil berhasil disimpan dan diajukan ulang untuk verifikasi.'
      : 'Profil berhasil disimpan';
  } catch (err) {
    profileError.value = err.response?.data?.error || 'Gagal menyimpan profil';
  } finally { profileLoading.value = false; }
}

async function handlePasswordChange() {
  passwordError.value = ''; passwordSuccess.value = '';
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = 'Konfirmasi password tidak sama';
    return;
  }
  passwordLoading.value = true;
  try {
    await api.put('/user/self/password', {
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
      confirmPassword: passwordForm.confirmPassword,
    });
    passwordSuccess.value = 'Password berhasil diubah';
    passwordForm.currentPassword = ''; passwordForm.newPassword = ''; passwordForm.confirmPassword = '';
  } catch (err) {
    passwordError.value = err.response?.data?.error || 'Gagal mengubah password';
  } finally { passwordLoading.value = false; }
}

onMounted(loadProfile);
</script>
