import { defineStore } from 'pinia';
import { ref } from 'vue';
import router from '../router';

export const useUiStore = defineStore('ui', () => {
  const mobileMenuOpen = ref(false);
  const sidebarCollapsed = ref(localStorage.getItem('sidebarCollapsed') === '1');

  function toggleMobileMenu() { mobileMenuOpen.value = !mobileMenuOpen.value; }
  function closeMobileMenu() { mobileMenuOpen.value = false; }
  function toggleSidebarCollapsed() {
    sidebarCollapsed.value = !sidebarCollapsed.value;
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed.value ? '1' : '0');
  }

  router.afterEach(() => { mobileMenuOpen.value = false; });

  return { mobileMenuOpen, toggleMobileMenu, closeMobileMenu, sidebarCollapsed, toggleSidebarCollapsed };
});
