/* === auth-guard.js (MODO LIVRE) === */
/* Controla apenas a interface (Menu Mobile, Dropdown) sem pedir senha */

document.addEventListener('DOMContentLoaded', () => {
    console.log("Modo de acesso livre ativado.");
    
    // 1. SIMULAÇÃO DE USUÁRIO LOGADO
    // Como não tem login, vamos "fingir" que o Agente Silva entrou
    const usuarioSimulado = {
        nome: "Agente Silva",
        email: "agente.silva@forestwatch.gov.br",
        iniciais: "AS"
    };

    atualizarInterfaceUsuario(usuarioSimulado);
    configurarMenus();
});

function atualizarInterfaceUsuario(user) {
    // Referências da UI (Desktop e Mobile)
    const userNameDisplay = document.querySelector('.user-name');
    const dropdownNameDisplay = document.querySelector('.dropdown-user-name');
    const userEmailDisplay = document.getElementById('user-email-display');
    
    // Mobile
    const mobileNameDisplay = document.querySelector('.mobile-user-name');
    const mobileEmailDisplay = document.querySelector('.mobile-user-email');
    
    // Avatares
    const avatarDisplays = document.querySelectorAll('.avatar'); 

    // Preenche os textos na tela
    if (userNameDisplay) userNameDisplay.textContent = user.nome;
    if (dropdownNameDisplay) dropdownNameDisplay.textContent = user.nome;
    if (userEmailDisplay) userEmailDisplay.textContent = user.email;

    if (mobileNameDisplay) mobileNameDisplay.textContent = user.nome;
    if (mobileEmailDisplay) mobileEmailDisplay.textContent = user.email;

    // Preenche as bolinhas (Avatares)
    avatarDisplays.forEach(av => av.textContent = user.iniciais);
}

function configurarMenus() {
    // --- LÓGICA DO MENU DROPDOWN (Desktop) ---
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

    // --- LÓGICA DO MENU MOBILE (Celular) ---
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav');

    if (mobileBtn && navMenu) {
        // Abrir/Fechar ao clicar no botão
        mobileBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        // Fechar automaticamente ao clicar em qualquer link
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        });
    }

    // --- BOTÃO SAIR (Apenas recarrega a página ou vai pro Google) ---
    const btnLogout = document.getElementById('btn-logout');
    const btnLogoutMobile = document.getElementById('btn-logout-mobile');

    const funcaoSair = (e) => {
        e.preventDefault();
        alert("Você saiu do sistema (Simulação).");
        // Opcional: window.location.href = 'https://google.com';
    };

    if (btnLogout) btnLogout.addEventListener('click', funcaoSair);
    if (btnLogoutMobile) btnLogoutMobile.addEventListener('click', funcaoSair);
}