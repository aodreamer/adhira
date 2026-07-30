<template>
  <div v-if="uiStore.mobileMenuOpen" class="fixed inset-0 z-[35] bg-black/50 lg:hidden" @click="uiStore.closeMobileMenu()"></div>
  <aside
    class="fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-gray-300 flex flex-col transition-all duration-200 ease-in-out lg:translate-x-0"
    :class="[uiStore.mobileMenuOpen ? 'translate-x-0' : '-translate-x-full', uiStore.sidebarCollapsed ? 'lg:w-20' : 'lg:w-64']"
  >
    <button
      type="button"
      @click="uiStore.toggleSidebarCollapsed()"
      class="hidden lg:flex absolute top-20 -right-3 z-50 w-6 h-6 rounded-full bg-gray-800 border border-gray-700 shadow items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition"
      :title="uiStore.sidebarCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'"
    >
      <svg class="w-3.5 h-3.5 transition-transform" :class="uiStore.sidebarCollapsed ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg>
    </button>
    <div class="flex items-center gap-3 h-20 px-5 border-b border-gray-800" :class="uiStore.sidebarCollapsed ? 'lg:justify-center lg:px-0' : ''">
      <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>
      </div>
      <div class="leading-tight min-w-0" :class="uiStore.sidebarCollapsed ? 'lg:hidden' : ''">
        <div class="text-white font-bold text-base tracking-wide">ADHIRA</div>
        <div class="text-[9px] text-gray-400">Aplikasi Digital Penghargaan Dharma Persandian</div>
      </div>
      <button @click="uiStore.closeMobileMenu()" class="ml-auto lg:hidden text-gray-400 hover:text-white">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
    <nav class="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-1">
      <router-link to="/admin" :title="uiStore.sidebarCollapsed ? 'Beranda' : ''" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-gray-800 hover:text-white transition" :class="uiStore.sidebarCollapsed ? 'lg:justify-center lg:px-2' : ''" active-class="bg-gray-800 text-white font-medium">
        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
        <span :class="uiStore.sidebarCollapsed ? 'lg:hidden' : ''">Beranda</span>
      </router-link>
      <router-link to="/admin/users" :title="uiStore.sidebarCollapsed ? 'Manajemen User' : ''" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-gray-800 hover:text-white transition" :class="uiStore.sidebarCollapsed ? 'lg:justify-center lg:px-2' : ''" active-class="bg-gray-800 text-white font-medium">
        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
        <span :class="uiStore.sidebarCollapsed ? 'lg:hidden' : ''">Manajemen User</span>
      </router-link>
      <router-link to="/admin/individu" :title="uiStore.sidebarCollapsed ? 'Berkas Individu' : ''" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-gray-800 hover:text-white transition" :class="uiStore.sidebarCollapsed ? 'lg:justify-center lg:px-2' : ''" active-class="bg-gray-800 text-white font-medium">
        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        <span :class="uiStore.sidebarCollapsed ? 'lg:hidden' : ''">Berkas Individu</span>
      </router-link>
      <div class="px-3 pt-4 pb-1" :class="uiStore.sidebarCollapsed ? 'lg:hidden' : ''">
        <span class="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Berkas Dokumentasi</span>
      </div>
      <div class="mx-2 my-2 border-t border-gray-800" :class="uiStore.sidebarCollapsed ? 'hidden lg:block' : 'hidden'"></div>
      <router-link to="/admin/pemberitahuan" :title="uiStore.sidebarCollapsed ? 'Surat Pemberitahuan' : ''" class="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm hover:bg-gray-800 hover:text-white transition" :class="uiStore.sidebarCollapsed ? 'lg:justify-center lg:px-2' : 'pl-[38px]'" active-class="bg-gray-800 text-white font-medium">
        <span class="flex-shrink-0">📋</span><span :class="uiStore.sidebarCollapsed ? 'lg:hidden' : ''">Surat Pemberitahuan</span>
      </router-link>
      <router-link to="/admin/usulan" :title="uiStore.sidebarCollapsed ? 'Usulan Penghargaan' : ''" class="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm hover:bg-gray-800 hover:text-white transition" :class="uiStore.sidebarCollapsed ? 'lg:justify-center lg:px-2' : 'pl-[38px]'" active-class="bg-gray-800 text-white font-medium">
        <span class="flex-shrink-0">📤</span><span :class="uiStore.sidebarCollapsed ? 'lg:hidden' : ''">Usulan Penghargaan</span>
      </router-link>
      <router-link to="/admin/distribusi" :title="uiStore.sidebarCollapsed ? 'Form Serah Terima' : ''" class="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm hover:bg-gray-800 hover:text-white transition" :class="uiStore.sidebarCollapsed ? 'lg:justify-center lg:px-2' : 'pl-[38px]'" active-class="bg-gray-800 text-white font-medium">
        <span class="flex-shrink-0">📦</span><span :class="uiStore.sidebarCollapsed ? 'lg:hidden' : ''">Form Serah Terima</span>
      </router-link>
      <router-link to="/admin/laporan" :title="uiStore.sidebarCollapsed ? 'Laporan Kegiatan' : ''" class="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm hover:bg-gray-800 hover:text-white transition" :class="uiStore.sidebarCollapsed ? 'lg:justify-center lg:px-2' : 'pl-[38px]'" active-class="bg-gray-800 text-white font-medium">
        <span class="flex-shrink-0">📊</span><span :class="uiStore.sidebarCollapsed ? 'lg:hidden' : ''">Laporan Kegiatan</span>
      </router-link>
      <router-link to="/admin/verifikator-registrations" :title="uiStore.sidebarCollapsed ? 'Persetujuan Verifikator' : ''" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-gray-800 hover:text-white transition" :class="uiStore.sidebarCollapsed ? 'lg:justify-center lg:px-2' : ''" active-class="bg-gray-800 text-white font-medium">
        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <span :class="uiStore.sidebarCollapsed ? 'lg:hidden' : ''">Persetujuan Verifikator</span>
      </router-link>
      <router-link to="/admin/verifikator-codes" :title="uiStore.sidebarCollapsed ? 'Kode Pendaftaran Verifikator' : ''" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-gray-800 hover:text-white transition" :class="uiStore.sidebarCollapsed ? 'lg:justify-center lg:px-2' : ''" active-class="bg-gray-800 text-white font-medium">
        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 11-12 0 6 6 0 0112 0zM3 21l2.5-2.5M6 18l2.121-2.121"/></svg>
        <span :class="uiStore.sidebarCollapsed ? 'lg:hidden' : ''">Kode Pendaftaran</span>
      </router-link>
    </nav>
    <div class="p-3 border-t border-gray-800 space-y-1">
      <router-link to="/admin/account" :title="uiStore.sidebarCollapsed ? 'Profil Saya' : ''" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-gray-800 hover:text-white transition" :class="uiStore.sidebarCollapsed ? 'lg:justify-center lg:px-2' : ''" active-class="bg-gray-800 text-white font-medium">
        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.23.6.77 1 1.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
        <span :class="uiStore.sidebarCollapsed ? 'lg:hidden' : ''">Profil Saya</span>
      </router-link>
      <button @click="handleLogout" :title="uiStore.sidebarCollapsed ? 'Logout' : ''" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 transition" :class="uiStore.sidebarCollapsed ? 'lg:justify-center lg:px-2' : ''">
        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
        <span :class="uiStore.sidebarCollapsed ? 'lg:hidden' : ''">Logout</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { useUiStore } from '../../stores/ui';
const router = useRouter();
const authStore = useAuthStore();
const uiStore = useUiStore();
function handleLogout() { authStore.logout(); router.push('/login'); }
</script>
