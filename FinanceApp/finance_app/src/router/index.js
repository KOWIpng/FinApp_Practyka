import { createRouter, createWebHistory } from 'vue-router'
//import Register from '../components/Register.vue'
import Login from '../components/Login.vue'
import FinanceApp from '@/components/FinanceApp.vue';

const routes = [
    // {
    //     path: '/register',
    //     name: 'register',
    //     component: Register
    // },
    {
        path: '/login',
        name: 'login',
        component: Login
    },
    {
        
        path: '/', 
        name: 'finance',
        component: FinanceApp,
        meta: { requiresAuth: true }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// для перевірки авторизації
router.beforeEach((to, from, next) => {
    if (to.meta.requiresAuth) {
        const token = localStorage.getItem('token');
        if (!token) {
            // Якщо токена немає кидаємj на логін
            next({ name: 'login' }); 
        } else {
            next();
        }
    } else {
        next();
    }
})

export default router