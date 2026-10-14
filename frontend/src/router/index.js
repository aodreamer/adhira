import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/auth/LoginView.vue'),
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/auth/RegisterView.vue'),
  },
  {
    path: '/register-verifikator',
    name: 'RegisterVerifikator',
    component: () => import('../views/auth/RegisterVerifikatorView.vue'),
  },
  {
    path: '/forbidden',
    name: 'Forbidden',
    component: () => import('../views/errors/ForbiddenView.vue'),
  },
  {
    path: '/admin',
    component: () => import('../components/layout/AppLayout.vue'),
    meta: { requiresAuth: true, role: 'Admin' },
    children: [
      { path: '', name: 'Dashboard', component: () => import('../views/admin/DashboardView.vue') },
      { path: 'executive', name: 'AdminExecutiveDashboard', component: () => import('../views/executive/ExecutiveDashboardView.vue') },
      { path: 'periods', name: 'AdminPeriods', component: () => import('../views/shared/PeriodsView.vue') },
      { path: 'users', name: 'ManUser', component: () => import('../views/admin/ManUserView.vue') },
      { path: 'individu', name: 'Individu', component: () => import('../views/admin/IndividuView.vue') },
      { path: 'pemberitahuan', name: 'Pemberitahuan', component: () => import('../views/admin/PemberitahuanView.vue') },
      { path: 'laporan', name: 'Laporan', component: () => import('../views/admin/LaporanView.vue') },
      { path: 'usulan', name: 'Usulan', component: () => import('../views/admin/UsulanView.vue') },
      { path: 'distribusi', name: 'Distribusi', component: () => import('../views/admin/DistribusiView.vue') },
      { path: 'verifikator-registrations', name: 'AdminVerifikatorRegistrations', component: () => import('../views/admin/AdminVerifikatorRegistrationView.vue') },
      { path: 'verifikator-codes', name: 'AdminVerifikatorCodes', component: () => import('../views/admin/AdminVerifikatorCodeView.vue') },
      { path: 'account', name: 'AdminAccount', component: () => import('../views/shared/AccountSettingsView.vue') },
    ],
  },
  {
    path: '/pimpinan',
    component: () => import('../components/layout/AppLayout.vue'),
    meta: { requiresAuth: true, role: 'Pimpinan' },
    children: [
      { path: '', name: 'ExecutiveDashboard', component: () => import('../views/executive/ExecutiveDashboardView.vue') },
      { path: 'periods', name: 'PimpinanPeriods', component: () => import('../views/shared/PeriodsView.vue') },
      { path: 'account', name: 'PimpinanAccount', component: () => import('../views/shared/AccountSettingsView.vue') },
    ],
  },
  {
    path: '/user',
    component: () => import('../components/layout/UserLayout.vue'),
    meta: { requiresAuth: true, role: 'User' },
    children: [
      { path: '', name: 'UserHome', component: () => import('../views/user/UserHome.vue') },
      { path: 'usulan', name: 'UserUsulan', component: () => import('../views/user/UserUsulan.vue') },
      { path: 'account', name: 'UserAccount', component: () => import('../views/shared/AccountSettingsView.vue') },
    ],
  },
  {
    path: '/verifikator',
    component: () => import('../components/layout/VerifikatorLayout.vue'),
    meta: { requiresAuth: true, role: 'Verifikator' },
    children: [
      { path: '', name: 'VerifikatorHome', component: () => import('../views/verifikator/VerifikatorHome.vue') },
      { path: 'antrian', name: 'VerifikatorQueue', component: () => import('../views/verifikator/VerifikatorQueueView.vue') },
      { path: 'antrian/:id', name: 'VerifikatorDetail', component: () => import('../views/verifikator/VerifikatorDetailView.vue') },
      { path: 'usulan-massal', name: 'VerifikatorImport', component: () => import('../views/verifikator/VerifikatorImportView.vue') },
      { path: 'registrasi', name: 'VerifikatorRegistrasi', component: () => import('../views/verifikator/VerifikatorRegistrationView.vue') },
      { path: 'account', name: 'VerifikatorAccount', component: () => import('../views/shared/AccountSettingsView.vue') },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/login' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Bulk-imported accounts get a random generated password shown to (and
// manually distributed by) a Dewan Penghargaan member, so it must be
// rotated before the account can do anything else.
const ROLE_BASE_PATH = { Admin: '/admin', User: '/user', Verifikator: '/verifikator', Pimpinan: '/pimpinan' };

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  if (to.meta.requiresAuth && !authStore.isAuthenticated) return next('/login');
  if (to.meta.role && authStore.user?.level !== to.meta.role) return next('/forbidden');
  if (to.meta.requiresAuth && authStore.user?.must_change_password && !to.name?.endsWith('Account')) {
    return next((ROLE_BASE_PATH[authStore.user.level] || '/login') + '/account');
  }
  // Akun Verifikator hasil registrasi mandiri (reg_status Pending/Ditolak)
  // hanya boleh mengakses halaman registrasi (upload berkas) & profil
  // sampai Admin menyetujui.
  if (
    authStore.user?.level === 'Verifikator' &&
    authStore.user?.reg_status &&
    authStore.user.reg_status !== 'Disetujui' &&
    to.name !== 'VerifikatorRegistrasi' &&
    !to.name?.endsWith('Account')
  ) {
    return next('/verifikator/registrasi');
  }
  next();
});

export default router;
