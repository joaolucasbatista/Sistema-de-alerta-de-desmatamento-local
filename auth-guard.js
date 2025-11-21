/* === auth-guard.js === */
/* Protege páginas e atualiza a interface do usuário (Nome, Email, Avatar) */

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

// --- LÓGICA DE UI DO USUÁRIO ---

// Referências aos elementos da tela (Nome, Email, Avatar)
const userNameDisplay = document.querySelector('.user-name'); // Nome no topo
const dropdownNameDisplay = document.querySelector('.dropdown-user-name'); // Nome no menu
const userEmailDisplay = document.getElementById('user-email-display'); // Email no menu
const avatarDisplay = document.querySelector('.avatar'); // Bolinha com iniciais

// VERIFICAÇÃO DE SEGURANÇA E ATUALIZAÇÃO DE DADOS
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Usuário autenticado:", user.email);

        // 1. Atualiza o E-mail
        if (userEmailDisplay) userEmailDisplay.textContent = user.email;

        // 2. Gera um Nome Bonito baseado no e-mail
        // Ex: "joao.lucas@..." vira "Joao Lucas"
        const rawName = user.email.split('@')[0];
        const formattedName = rawName
            .split('.') // Separa por pontos (se houver)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1)) // Maiúscula na 1ª letra
            .join(' '); // Junta com espaço

        // Atualiza os nomes na tela
        if (userNameDisplay) userNameDisplay.textContent = formattedName;
        if (dropdownNameDisplay) dropdownNameDisplay.textContent = formattedName;

        // 3. Atualiza as Iniciais do Avatar
        // Pega a primeira letra de cada nome gerado (máximo 2 letras)
        const initials = formattedName
            .split(' ')
            .map(n => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
        
        if (avatarDisplay) avatarDisplay.textContent = initials;

    } else {
        // Usuário NÃO está logado. FORA!
        // Evita loop de redirecionamento se já estiver no login
        if (!window.location.href.includes('login.html')) {
            console.warn("Acesso negado. Redirecionando...");
            window.location.href = 'login.html';
        }
    }
});

// --- LÓGICA DO MENU DROPDOWN ---

const userMenuBtn = document.getElementById('user-menu-btn');
const userDropdown = document.getElementById('user-dropdown');
const btnLogout = document.getElementById('btn-logout');

// Toggle (Abrir/Fechar)
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

// Função Global de Logout
window.fazerLogout = () => {
    signOut(auth).then(() => {
        window.location.href = 'login.html';
    }).catch((error) => {
        console.error("Erro ao sair", error);
    });
};

// Ação de Logout no botão do menu
if (btnLogout) {
    btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        window.fazerLogout();
    });
}