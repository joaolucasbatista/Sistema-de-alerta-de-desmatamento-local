/* === ForestWatch sensores.js === */
/* v1.1 - Com Filtros Funcionais (Online/Offline) */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

// 1. Configuração
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
const db = getDatabase(app);
const SENSOR_TIMEOUT_MS = 45000;

// 2. Mapa
const map = L.map('sensors-map').setView([-7.249, -39.496], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

const iconOnline = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});
const iconOffline = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

// Dados Simulados
const sensoresFixos = [
    { id: 'SNS-002', nome: 'Sensor Serra 02', loc: [-7.235, -39.510], bat: '92%', signal: '89%' },
    { id: 'SNS-003', nome: 'Sensor Vale 03', loc: [-7.255, -39.480], bat: '78%', signal: '95%' },
    { id: 'SNS-004', nome: 'Sensor Rio 04', loc: [-7.260, -39.505], bat: '45%', signal: '67%' },
    { id: 'SNS-005', nome: 'Sensor Mata 05', loc: [-7.240, -39.470], bat: '12%', signal: '30%' } 
];

// 3. Lógica Principal
const sensorStatusRef = ref(db, '/status/');
const listContainer = document.getElementById('sensors-list-container');
const markersLayer = L.layerGroup().addTo(map);

// Estado Global para Filtros
let sensoresAtuais = []; // Guarda a lista completa de sensores
let filtroAtual = 'todos'; // Filtro ativo

onValue(sensorStatusRef, (snapshot) => {
    // Limpa tudo antes de reconstruir
    listContainer.innerHTML = '';
    markersLayer.clearLayers();
    sensoresAtuais = []; // Reseta a lista global
    
    const dadosFirebase = snapshot.val() || {};
    const now = Date.now();
    let contagem = { total: 0, online: 0, offline: 0 };

    // A. Sensor REAL
    Object.keys(dadosFirebase).forEach(key => {
        const dados = dadosFirebase[key];
        const lastSeen = new Date(dados.last_seen).getTime();
        const isOnline = (now - lastSeen) < SENSOR_TIMEOUT_MS;
        
        const sensorReal = {
            id: 'SNS-001',
            nome: 'Sensor Chapada 01 (Wokwi)',
            loc: [-7.249, -39.496],
            bat: '87%',
            signal: '98%',
            isOnline: isOnline,
            lastSeen: dados.last_seen,
            type: 'real'
        };
        
        sensoresAtuais.push(sensorReal);
        contagem.total++;
        if (isOnline) contagem.online++; else contagem.offline++;
    });

    // B. Sensores SIMULADOS
    sensoresFixos.forEach(sensor => {
        const isOnline = sensor.id !== 'SNS-005'; 
        const sensorCompleto = {
            ...sensor,
            isOnline: isOnline,
            lastSeen: isOnline ? new Date().toISOString() : "2023-10-20T10:00:00",
            type: 'simulado'
        };
        
        sensoresAtuais.push(sensorCompleto);
        contagem.total++;
        if (isOnline) contagem.online++; else contagem.offline++;
    });

    // C. Atualiza Contadores
    document.getElementById('count-total').textContent = contagem.total;
    document.getElementById('count-online').textContent = contagem.online;
    document.getElementById('count-offline').textContent = contagem.offline;
    document.getElementById('summary-online').textContent = contagem.online;
    document.getElementById('summary-offline').textContent = contagem.offline;
    document.getElementById('summary-atencao').textContent = "0"; 

    // D. Renderiza tudo (respeitando o filtro atual)
    aplicarFiltroSensores(filtroAtual);
});

// --- 4. Lógica de Filtros (NOVO) ---

// Seleciona os botões de filtro
const filterButtons = document.querySelectorAll('.filter-pill');

filterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        // 1. Remove 'active' de todos
        filterButtons.forEach(b => b.classList.remove('active'));
        // 2. Adiciona 'active' no clicado
        e.target.closest('.filter-pill').classList.add('active'); // closest garante que pega o botão mesmo se clicar no span

        // 3. Define o filtro
        const textoBtn = e.target.closest('.filter-pill').textContent.toLowerCase();
        if (textoBtn.includes('online')) filtroAtual = 'online';
        else if (textoBtn.includes('offline')) filtroAtual = 'offline';
        else filtroAtual = 'todos';

        // 4. Aplica
        aplicarFiltroSensores(filtroAtual);
    });
});

function aplicarFiltroSensores(filtro) {
    // Limpa a tela antes de redesenhar filtrado
    listContainer.innerHTML = '';
    markersLayer.clearLayers();

    sensoresAtuais.forEach(sensor => {
        let mostrar = false;

        if (filtro === 'todos') mostrar = true;
        else if (filtro === 'online' && sensor.isOnline) mostrar = true;
        else if (filtro === 'offline' && !sensor.isOnline) mostrar = true;

        if (mostrar) {
            renderizarSensor(sensor);
        }
    });
}

function renderizarSensor(sensor) {
    // 1. Renderiza Card
    const statusClass = sensor.isOnline ? 'online' : 'offline';
    const statusText = sensor.isOnline ? 'Online' : 'Offline';
    const timeAgo = formatTimeAgo(sensor.lastSeen);
    
    const cardHTML = `
        <div class="sensor-card">
            <div class="sensor-header">
                <div class="sensor-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:18px;height:18px"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"/></svg>
                </div>
                <div class="sensor-info">
                    <h4>${sensor.nome}</h4>
                    <p>${sensor.id} • Zona Norte</p>
                </div>
                <div class="sensor-status-dot ${statusClass}">
                    <div class="dot"></div> ${statusText}
                </div>
            </div>
            <div class="sensor-stats">
                <div class="stat-item">
                    <span class="stat-label">Heartbeat</span>
                    <span class="stat-val">${timeAgo}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Sinal</span>
                    <span class="stat-val">${sensor.signal}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Bateria</span>
                    <span class="stat-val">${sensor.bat}</span>
                </div>
            </div>
        </div>
    `;
    listContainer.insertAdjacentHTML('beforeend', cardHTML);

    // 2. Renderiza Marcador no Mapa
    const icon = sensor.isOnline ? iconOnline : iconOffline;
    L.marker(sensor.loc, { icon: icon })
        .bindPopup(`<b>${sensor.nome}</b><br>Status: ${statusText}`)
        .addTo(markersLayer);
        
    // Círculo de cobertura
    L.circle(sensor.loc, {
        color: sensor.isOnline ? '#10b981' : '#ef4444',
        fillColor: sensor.isOnline ? '#10b981' : '#ef4444',
        fillOpacity: 0.1,
        radius: 800 
    }).addTo(markersLayer);
}

function formatTimeAgo(dateString) {
    const diff = Date.now() - new Date(dateString).getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s atrás`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m atrás`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h atrás`;
}