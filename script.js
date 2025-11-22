/* === ForestWatch script.js === */
/* v3.1 - Popup Completo e Clique Inteligente (Zoom vs Modal) */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, onChildAdded, onChildChanged, onValue, query, orderByChild, update } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

// --- 1. Configuração do Firebase ---
const firebaseConfig = {
    apiKey: "AIzaSyC1uaBiz6qJB-lsawhjt2twKmVfmDnDylg",
    authDomain: "banco-de-dados-3ea2f.firebaseapp.com",
    projectId: "banco-de-dados-3ea2f",
    storageBucket: "banco-de-dados-3ea2f.firebasestorage.app",
    messagingSenderId: "426130374237",
    appId: "1:426130374237:web:1d8ba4c603a3b070ee57b4",
    databaseURL: "https://banco-de-dados-3ea2f-default-rtdb.firebaseio.com"
};

// --- 2. Constantes e Inicialização ---
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const MAP_INITIAL_ZOOM = 14;
const MAP_FLYTO_ZOOM = 16;
const SENSOR_TIMEOUT_MS = 45000;

// --- 3. Mapa ---
const map = L.map('map').setView([-7.249, -39.496], MAP_INITIAL_ZOOM);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

const alertaIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

// --- 4. Referências do DOM ---
const alertList = document.getElementById('alert-list');
// Stats
const statAlertasNovos = document.getElementById('stat-alertas-novos');
const statAlertasHora = document.getElementById('stat-alertas-hora');
const statEmAnalise = document.getElementById('stat-em-analise');
const statAnalisePendentes = document.getElementById('stat-analise-pendentes');
const statResolvidosHoje = document.getElementById('stat-resolvidos-hoje');
const statResolvidosComp = document.getElementById('stat-resolvidos-comp');
const statSensoresOnline = document.getElementById('sensors-online');
const statSensoresTotal = document.getElementById('sensors-total');
const statSensoresPercent = document.getElementById('sensors-percent');
const notificationBadge = document.getElementById('notification-badge');
// Filtros
const filterTabs = document.querySelectorAll('.tabs .tab');
// Modal
const modal = document.getElementById('action-modal');
const modalSensorName = document.getElementById('modal-sensor-name');
const modalStatusBadge = document.getElementById('modal-status-badge');
const btnCloseModal = document.getElementById('close-modal');
const btnAnalise = document.getElementById('btn-analise');
const btnResolver = document.getElementById('btn-resolver');

// --- 5. Estado da Aplicação ---
const alertMarkers = {};
const todosAlertasMap = new Map(); 
let currentAlertId = null; 
let filtroAtual = 'todos'; 

// --- 6. Funções Principais ---

function atualizarContadores() {
    let total = 0, novos = 0, analise = 0, resolvidos = 0;

    for (const alerta of todosAlertasMap.values()) {
        total++;
        const status = alerta.status || 'novo';
        if (status === 'novo') novos++;
        else if (status === 'analise') analise++;
        else if (status === 'resolvido') resolvidos++;
    }

    statAlertasNovos.textContent = novos;
    statEmAnalise.textContent = analise;
    statResolvidosHoje.textContent = resolvidos;
    
    statAlertasHora.textContent = `+${novos} recentes`;
    statAnalisePendentes.textContent = `${analise} em andamento`;
    statResolvidosComp.textContent = `Total: ${resolvidos}`;
    notificationBadge.textContent = novos;

    if (document.querySelectorAll('.tabs .tab').length > 0) {
        document.querySelectorAll('.tabs .tab')[0].textContent = `Todos (${total})`;
        document.querySelectorAll('.tabs .tab')[1].textContent = `Novos (${novos})`;
        document.querySelectorAll('.tabs .tab')[2].textContent = `Em Análise (${analise})`;
        document.querySelectorAll('.tabs .tab')[3].textContent = `Resolvidos (${resolvidos})`;
    }
}

/**
 * Função que Renderiza (Cria ou Atualiza) o Card na Lista
 */
function renderizarAlerta(alerta, id) {
    const sensor_id = "Sensor Norte"; 
    const tipo_som = alerta.tipo_som_detectado || "Não id.";
    const timestamp = new Date(alerta.data_hora) || new Date();
    const confPercent = (alerta.nivel_confianca * 100).toFixed(0);
    const statusKey = alerta.status || 'novo';
    const lat = parseFloat(alerta.geoloc.split(',')[0]);
    const lng = parseFloat(alerta.geoloc.split(',')[1]);

    let statusConfig;
    switch (statusKey) {
        case 'analise': statusConfig = { class: 'analise', text: 'Em Análise', iconClass: 'orange' }; break;
        case 'resolvido': statusConfig = { class: 'resolvido', text: 'Resolvido', iconClass: 'green' }; break;
        case 'novo': default: statusConfig = { class: 'novo', text: 'Novo', iconClass: 'red' }; break;
    }

    // 1. Marcador no Mapa e Popup (CORRIGIDO: Com todas as informações)
    if (!alertMarkers[id]) {
        const newMarker = L.marker([lat, lng], { icon: alertaIcon }).addTo(map);
        alertMarkers[id] = newMarker;
    }
    
    // *** POPUP COMPLETO RESTAURADO ***
    alertMarkers[id].bindPopup(`
        <b>${sensor_id}</b><br>
        <b>Tipo:</b> ${tipo_som}<br>
        <b>Geoloc:</b> ${lat.toFixed(5)}, ${lng.toFixed(5)}<br>
        <b>Hora:</b> ${timestamp.toLocaleString()}<br>
        <b>Status:</b> ${statusConfig.text}<br>
        <b>Confiança:</b> ${confPercent}%
    `);

    // 2. Item da Lista (Cria ou Atualiza)
    let li = document.getElementById(`alert-${id}`);
    if (!li) {
        li = document.createElement('li');
        li.id = `alert-${id}`;
        li.className = 'alert-item';
        li.dataset.key = id;
        alertList.prepend(li);
    }

    li.dataset.status = statusKey;

    const icons = {
        red: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`,
        orange: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
        green: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
    };

    li.innerHTML = `
        <div class="alert-icon ${statusConfig.iconClass}" aria-hidden="true">
            ${icons[statusConfig.iconClass]}
        </div>
        <div class="alert-content">
            <div class="alert-header">
                <div>
                    <h4 class="alert-title">${sensor_id}</h4>
                    <p class="alert-location">Tipo: ${tipo_som}</p>
                </div>
                <button class="action-trigger" title="Abrir Ações">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:20px;height:20px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </button>
            </div>
            <div class="alert-meta">
                <span class="confidence"><strong>${confPercent}%</strong></span>
                <p class="timestamp">${formatarTempoRelativo(timestamp)}</p>
            </div>
            <span class="status ${statusConfig.class}">${statusConfig.text}</span>
        </div>
    `;

    // *** LÓGICA DE CLIQUE INTELIGENTE ***
    
    // 1. O card inteiro dá ZOOM no mapa
    li.onclick = (e) => {
        // Se clicou no botão da seta ou no status, NÃO dá zoom (deixa eles tratarem)
        if (e.target.closest('.action-trigger') || e.target.closest('.status')) return;
        
        const marker = alertMarkers[id];
        if (marker) {
            map.flyTo(marker.getLatLng(), MAP_FLYTO_ZOOM);
            marker.openPopup();
        }
    };

    // 2. O botão da seta abre o MODAL
    const setinha = li.querySelector('.action-trigger');
    if (setinha) {
        setinha.onclick = (e) => {
            e.stopPropagation(); // Impede o zoom do mapa
            abrirModal(id);
        };
    }
    
    // 3. O badge de status também abre o MODAL (opcional, mas útil)
    const statusBadge = li.querySelector('.status');
    if (statusBadge) {
        statusBadge.onclick = (e) => {
            e.stopPropagation();
            abrirModal(id);
        };
    }

    reaplicarFiltro();
}


// --- 7. Lógica do Modal e Ações ---

function abrirModal(id) {
    const alerta = todosAlertasMap.get(id);
    if (!alerta) return;

    currentAlertId = id;
    const statusKey = alerta.status || 'novo';

    if(modalSensorName) modalSensorName.textContent = "Sensor Norte";
    
    if(modalStatusBadge) {
        modalStatusBadge.className = `status ${statusKey}`;
        modalStatusBadge.textContent = statusKey.toUpperCase();
    }

    if(btnAnalise) btnAnalise.disabled = (statusKey === 'analise' || statusKey === 'resolvido');
    if(btnResolver) btnResolver.disabled = (statusKey === 'resolvido');

    if(modal) modal.classList.remove('hidden');
}

function fecharModal() {
    if(modal) modal.classList.add('hidden');
    currentAlertId = null;
}

if(btnCloseModal) btnCloseModal.addEventListener('click', fecharModal);

if(btnAnalise) {
    btnAnalise.addEventListener('click', () => {
        if (currentAlertId) {
            atualizarStatusFirebase(currentAlertId, 'analise');
            fecharModal();
        }
    });
}

if(btnResolver) {
    btnResolver.addEventListener('click', () => {
        if (currentAlertId) {
            atualizarStatusFirebase(currentAlertId, 'resolvido');
            fecharModal();
        }
    });
}

function atualizarStatusFirebase(id, novoStatus) {
    const alertaRef = ref(db, `alertas/${id}`);
    update(alertaRef, { status: novoStatus })
        .then(() => console.log(`Status atualizado para ${novoStatus}`))
        .catch((err) => console.error("Erro ao atualizar:", err));
}


// --- 8. Listeners do Firebase ---

const alertasRef = query(ref(db, 'alertas/'), orderByChild("data_hora"));

onChildAdded(alertasRef, (snapshot) => {
    const alerta = snapshot.val();
    if (!alerta.status) alerta.status = 'novo';
    
    todosAlertasMap.set(snapshot.key, alerta);
    renderizarAlerta(alerta, snapshot.key);
    atualizarContadores();
});

onChildChanged(alertasRef, (snapshot) => {
    const alerta = snapshot.val();
    todosAlertasMap.set(snapshot.key, alerta); 
    renderizarAlerta(alerta, snapshot.key); 
    atualizarContadores(); 
});


// --- 9. Filtros e Utilitários ---

filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const texto = tab.textContent.toLowerCase();
        if (texto.includes('novos')) filtroAtual = 'novo';
        else if (texto.includes('análise')) filtroAtual = 'analise';
        else if (texto.includes('resolvidos')) filtroAtual = 'resolvido';
        else filtroAtual = 'todos';
        
        reaplicarFiltro();
    });
});

function reaplicarFiltro() {
    const itens = document.querySelectorAll('.alert-item');
    itens.forEach(item => {
        if (filtroAtual === 'todos') {
            item.style.display = 'flex';
        } else {
            item.style.display = (item.dataset.status === filtroAtual) ? 'flex' : 'none';
        }
    });
}

const sensorStatusRef = ref(db, '/status/');
onValue(sensorStatusRef, (snapshot) => {
    if (snapshot.exists()) {
        const allSensors = snapshot.val();
        const now = new Date().getTime();
        let onlineCount = 0;
        const ids = Object.keys(allSensors);
        
        ids.forEach(id => {
            const lastSeen = new Date(allSensors[id].last_seen).getTime();
            if (now - lastSeen < SENSOR_TIMEOUT_MS) onlineCount++;
        });

        statSensoresOnline.textContent = onlineCount;
        statSensoresTotal.textContent = ids.length;
        statSensoresPercent.textContent = ids.length > 0 ? `${((onlineCount/ids.length)*100).toFixed(0)}% online` : "0%";
    }
});

function formatarTempoRelativo(timestamp) {
    const diff = new Date() - new Date(timestamp);
    const horas = Math.floor(diff / 36e5);
    if (horas < 1) return 'agora mesmo';
    if (horas < 24) return `há ${horas}h`;
    return `há ${Math.floor(horas/24)} dias`;
}

/* === CORREÇÃO DO MENU MOBILE === */
document.addEventListener('DOMContentLoaded', () => {
    const btnMenu = document.querySelector('.mobile-menu-btn');
    const menuNavegacao = document.querySelector('.nav');

    if (btnMenu && menuNavegacao) {
        // Ao clicar no botão, abre/fecha o menu
        btnMenu.addEventListener('click', (e) => {
            e.preventDefault(); // Previne comportamentos estranhos
            menuNavegacao.classList.toggle('active');
        });

        // Ao clicar em qualquer link dentro do menu, fecha o menu
        const links = menuNavegacao.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', () => {
                menuNavegacao.classList.remove('active');
            });
        });
    } else {
        console.error("Erro: Botão do menu ou Navegação não encontrados no HTML.");
    }
});