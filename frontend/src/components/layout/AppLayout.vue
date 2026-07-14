<template>
  <div class="min-h-screen bg-gray-50">
    <Sidebar />
    <div class="transition-all duration-200" :class="uiStore.sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'">
      <Topbar />
      <main class="p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import Sidebar from './Sidebar.vue';
import Topbar from './Topbar.vue';
import { useUiStore } from '../../stores/ui';
const uiStore = useUiStore();
</script>
