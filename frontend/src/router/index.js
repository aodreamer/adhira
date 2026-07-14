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
      { path: 'users', name: 'ManUser', component: () => import('../views/admin/ManUserView.vue') },
      { path: 'individu', name: 'Individu', component: () => import('../views/admin/IndividuView.vue') },
      { path: 'pemberitahuan', name: 'Pemberitahuan', component: () => import('../views/admin/PemberitahuanView.vue') },
      { path: 'laporan', name: 'Laporan', component: () => import('../views/admin/LaporanView.vue') },
      { path: 'usulan', name: 'Usulan', component: () => import('../views/admin/UsulanView.vue') },
      { path: 'distribusi', name: 'Distribusi', component: () => import('../views/admin/DistribusiView.vue') },
      { path: 'account', name: 'AdminAccount', component: () => import('../views/shared/AccountSettingsView.vue') },
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
      { path: 'account', name: 'VerifikatorAccount', component: () => import('../views/shared/AccountSettingsView.vue') },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/login' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  if (to.meta.requiresAuth && !authStore.isAuthenticated) return next('/login');
  if (to.meta.role && authStore.user?.level !== to.meta.role) return next('/forbidden');
  next();
});

export default router;
