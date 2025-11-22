/* === auth-guard.js === */
/* Gerencia Autenticação e Menu Mobile Globalmente */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyC1uaBiz6qJB-lsawhjt2twKmVfmDnDylg",
    authDomain: "banco-de-dados-3ea2f.firebaseapp.com",
    projectId: "banco-de-dados-3ea2f",
    storageBucket: "banco-de-dados-3ea2f.firebasestorage.app",
    messagingSenderId: "426130374237",
    appId: "1:426130374237:web:1d8ba4c603a3b070ee57b4",
    databaseURL: "https://banco-de-dados-3ea2f-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// --- 1. Lógica do Menu Mobile (Executa assim que o DOM carrega) ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("Inicializando Menu Mobile...");
    
    const btnMobile = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav');

    if (btnMobile && navMenu) {
        // Remove clones de event listeners antigos
        const newBtn = btnMobile.cloneNode(true);
        btnMobile.parentNode.replaceChild(newBtn, btnMobile);

        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Menu clicado!"); // Debug
            navMenu.classList.toggle('active');
        });

        // Fecha ao clicar nos links
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        });
    } else {
        console.warn("Menu Mobile: Botão ou Nav não encontrados nesta página.");
    }
});

// --- 2. Lógica de Usuário e Auth ---
const userElements = {
    name: document.querySelector('.user-name'),
    dropdownName: document.querySelector('.dropdown-user-name'),
    email: document.getElementById('user-email-display'),
    mobileName: document.querySelector('.mobile-user-name'),
    mobileEmail: document.querySelector('.mobile-user-email'),
    avatars: document.querySelectorAll('.avatar')
};

onAuthStateChanged(auth, (user) => {
    // Se não tem usuário, simula um (Modo Prototipagem)
    const currentUser = user || { 
        email: "agente.silva@forestwatch.gov.br", 
        displayName: "Agente Silva" 
    };

    // Formata nome
    const rawName = currentUser.email.split('@')[0];
    const formattedName = rawName.split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    const initials = formattedName.substring(0, 2).toUpperCase();

    // Atualiza UI com segurança (verifica se elemento existe antes de preencher)
    if (userElements.name) userElements.name.textContent = formattedName;
    if (userElements.dropdownName) userElements.dropdownName.textContent = formattedName;
    if (userElements.email) userElements.email.textContent = currentUser.email;
    if (userElements.mobileName) userElements.mobileName.textContent = formattedName;
    if (userElements.mobileEmail) userElements.mobileEmail.textContent = currentUser.email;
    
    userElements.avatars.forEach(av => av.textContent = initials);
});

// --- 3. Dropdown Desktop ---
const userMenuBtn = document.getElementById('user-menu-btn');
const userDropdown = document.getElementById('user-dropdown');

if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('hidden');
    });
    document.addEventListener('click', (e) => {
        if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
            userDropdown.classList.add('hidden');
        }
    });
}

// --- 4. Logout ---
window.fazerLogout = () => {
    signOut(auth).then(() => window.location.reload()).catch(console.error);
};

const btnsLogout = document.querySelectorAll('#btn-logout, #btn-logout-mobile');
btnsLogout.forEach(btn => {
    if(btn) btn.addEventListener('click', (e) => { e.preventDefault(); window.fazerLogout(); });
});