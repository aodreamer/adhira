<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <h2 class="text-xl font-bold text-gray-800">Manajemen User</h2>
        <p class="text-sm text-gray-500 mt-0.5">Kelola akun pengguna sistem</p>
      </div>
      <button @click="openAdd" class="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition shadow-sm">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Tambah User
      </button>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead><tr class="bg-gray-50 text-left"><th class="p-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama</th><th class="p-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</th><th class="p-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th><th class="p-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">HP</th><th class="p-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Level</th><th class="p-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th><th class="p-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Login Terakhir</th><th class="p-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Aksi</th></tr></thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="loading"><td colspan="8" class="p-12 text-center text-gray-400"><div class="animate-pulse">Memuat data...</div></td></tr>
            <tr v-else-if="users.length === 0"><td colspan="8" class="p-12 text-center text-gray-400">Belum ada data user</td></tr>
            <tr v-for="u in users" :key="u.id_user" class="hover:bg-gray-50 transition">
              <td class="p-3.5 text-sm font-medium text-gray-800">{{ u.nama }}</td>
              <td class="p-3.5 text-sm text-gray-600 font-mono">{{ u.username }}</td>
              <td class="p-3.5 text-sm text-gray-600">{{ u.email || '-' }}</td>
              <td class="p-3.5 text-sm text-gray-600">{{ u.hp || '-' }}</td>
              <td class="p-3.5"><span class="px-2 py-0.5 text-xs rounded-full font-medium" :class="u.level==='Verifikator' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'">{{ u.level }}</span></td>
              <td class="p-3.5"><span :class="u.is_active===1?'bg-green-50 text-green-700 border-green-200':'bg-red-50 text-red-700 border-red-200'" class="px-2 py-0.5 text-xs rounded-full font-medium border">{{ u.is_active===1?'Aktif':'Tidak Aktif' }}</span></td>
              <td class="p-3.5 text-sm text-gray-500">{{ formatLastLogin(u.last_login_at) }}</td>
              <td class="p-3.5">
                <div class="flex justify-end gap-1">
                  <button @click="openEdit(u)" class="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition">Edit</button>
                  <button @click="confirmDelete(u)" class="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition">Hapus</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add Modal -->
    <Teleport to="body"><div v-if="showAdd" class="fixed inset-0 z-50 flex items-center justify-center p-4"><div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showAdd=false"></div><div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"><div class="p-6"><div class="flex items-center justify-between mb-5"><h3 class="text-lg font-bold text-gray-800">Tambah User</h3><button @click="showAdd=false" class="text-gray-400 hover:text-gray-600"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button></div><form @submit.prevent="handleAdd" class="space-y-3"><div><label class="block text-xs font-medium text-gray-600 mb-1">Nama Lengkap <span class="text-red-500">*</span></label><input v-model="form.nama" required class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"/></div><div class="grid grid-cols-2 gap-3"><div><label class="block text-xs font-medium text-gray-600 mb-1">Username <span class="text-red-500">*</span></label><input v-model="form.username" required class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"/></div><div><label class="block text-xs font-medium text-gray-600 mb-1">Password <span class="text-red-500">*</span></label><input v-model="form.password" type="password" required minlength="8" title="Minimal 8 karakter, mengandung huruf dan angka" class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"/></div></div><div class="grid grid-cols-2 gap-3"><div><label class="block text-xs font-medium text-gray-600 mb-1">Email</label><input v-model="form.email" type="email" class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"/></div><div><label class="block text-xs font-medium text-gray-600 mb-1">No HP</label><input v-model="form.hp" class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"/></div></div><div><label class="block text-xs font-medium text-gray-600 mb-1">Level</label><select v-model="form.level" class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"><option>Admin</option><option>User</option></select></div><p v-if="formError" class="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{{ formError }}</p><div class="flex justify-end gap-3 pt-3"><button type="button" @click="showAdd=false" class="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition">Batal</button><button type="submit" class="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition">Simpan</button></div></form></div></div></div></Teleport>

    <!-- Edit Modal -->
    <Teleport to="body"><div v-if="showEdit" class="fixed inset-0 z-50 flex items-center justify-center p-4"><div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showEdit=false"></div><div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"><div class="p-6"><div class="flex items-center justify-between mb-5"><h3 class="text-lg font-bold text-gray-800">Edit User</h3><button @click="showEdit=false" class="text-gray-400 hover:text-gray-600"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button></div><form @submit.prevent="handleEdit" class="space-y-3"><div><label class="block text-xs font-medium text-gray-600 mb-1">Nama Lengkap</label><input v-model="editForm.nama" required class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"/></div><div class="grid grid-cols-2 gap-3"><div><label class="block text-xs font-medium text-gray-600 mb-1">Email</label><input v-model="editForm.email" type="email" class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"/></div><div><label class="block text-xs font-medium text-gray-600 mb-1">No HP</label><input v-model="editForm.hp" class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"/></div></div><div class="grid grid-cols-2 gap-3"><div><label class="block text-xs font-medium text-gray-600 mb-1">Level</label><select v-model="editForm.level" class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"><option>Admin</option><option>User</option><option>Verifikator</option></select></div><div><label class="block text-xs font-medium text-gray-600 mb-1">Status</label><select v-model="editForm.is_active" class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"><option :value="1">Aktif</option><option :value="0">Tidak Aktif</option></select></div></div><div v-if="editForm.level==='Verifikator'" class="border border-indigo-100 bg-indigo-50/50 rounded-xl p-3"><label class="block text-xs font-medium text-gray-600 mb-2">Instansi yang Boleh Diverifikasi <span class="text-red-500">*</span></label><div class="grid grid-cols-2 gap-1.5">
      <label v-for="opt in INSTANSI_OPTIONS" :key="opt" class="flex items-center gap-1.5 text-xs text-gray-700">
        <input type="checkbox" :value="opt" v-model="editForm.instansi_scope" class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
        {{ opt }}
      </label>
    </div></div><div><label class="block text-xs font-medium text-gray-600 mb-1">Password Baru <span class="text-gray-400">(kosongkan jika tidak diubah)</span></label><input v-model="editForm.password" type="password" minlength="8" title="Minimal 8 karakter, mengandung huruf dan angka" class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"/></div><p v-if="formError" class="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{{ formError }}</p><div class="flex justify-end gap-3 pt-3"><button type="button" @click="showEdit=false" class="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition">Batal</button><button type="submit" class="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition">Update</button></div></form></div></div></div></Teleport>

    <ConfirmModal :show="showConfirm" message="Hapus user ini?" @close="showConfirm=false" @confirm="handleDelete" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import api from '../../api/client';
import ConfirmModal from '../../components/shared/ConfirmModal.vue';
import { INSTANSI_OPTIONS } from '../../constants/rank-data';
const users = ref([]);
const loading = ref(true);
const showAdd = ref(false); const showEdit = ref(false); const showConfirm = ref(false);
const formError = ref(''); const deleteId = ref(null);
const form = reactive({ nama: '', username: '', password: '', email: '', hp: '', level: 'Admin' });
const editForm = reactive({ id_user: null, nama: '', email: '', hp: '', level: 'Admin', is_active: 1, password: '', instansi_scope: [] });

async function fetchUsers() { try { const { data } = await api.get('/users'); users.value = data; } finally { loading.value = false; } }
function formatLastLogin(value) {
  if (!value) return 'Belum pernah';
  return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}
function openAdd() { formError.value = ''; Object.assign(form, { nama: '', username: '', password: '', email: '', hp: '', level: 'Admin' }); showAdd.value = true; }
async function handleAdd() { try { formError.value = ''; await api.post('/users', form); showAdd.value = false; await fetchUsers(); } catch (err) { formError.value = err.response?.data?.error || 'Gagal'; } }
async function openEdit(u) {
  formError.value = '';
  Object.assign(editForm, { id_user: u.id_user, nama: u.nama, email: u.email, hp: u.hp, level: u.level, is_active: u.is_active, password: '', instansi_scope: [] });
  showEdit.value = true;
  if (u.level === 'Verifikator') {
    const { data } = await api.get('/users/' + u.id_user);
    editForm.instansi_scope = data.instansi_scope || [];
  }
}
async function handleEdit() { try { formError.value = ''; await api.put('/users/' + editForm.id_user, editForm); showEdit.value = false; await fetchUsers(); } catch (err) { formError.value = err.response?.data?.error || 'Gagal'; } }
function confirmDelete(u) { deleteId.value = u.id_user; showConfirm.value = true; }
async function handleDelete() { await api.delete('/users/' + deleteId.value); showConfirm.value = false; await fetchUsers(); }
onMounted(() => { fetchUsers(); });
</script>
