import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

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
const SENSOR_TIMEOUT_MS = 60000; 

const map = L.map('sensors-map').setView([-7.28, -39.40], 11);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let markers = {}; 

const statusRef = ref(db, 'status');

onValue(statusRef, (snapshot) => {
    const dados = snapshot.val();
    const listaContainer = document.getElementById('sensors-list-container');
    
    let total = 0;
    let online = 0;
    let offline = 0;
    let atencao = 0;

    listaContainer.innerHTML = '';

    if (dados) {
        const sensores = Object.keys(dados);
        total = sensores.length;

        sensores.forEach(idSensor => {
            const info = dados[idSensor];
            
            const lastSeen = new Date(info.last_seen).getTime();
            const now = new Date().getTime();
            const diffSeconds = (now - lastSeen) / 1000;
            
            let statusClass = 'offline';
            let statusText = 'OFFLINE';
            let isOnline = false;

            if (diffSeconds < 60) {
                statusClass = 'online';
                statusText = 'ONLINE';
                online++;
                isOnline = true;
            } else {
                offline++;
            }

            const card = document.createElement('div');
            card.className = `sensor-card ${statusClass}`; 
            card.innerHTML = `
                <div class="sensor-info">
                    <h4>${info.nome || idSensor}</h4>
                    <p class="sensor-id">ID: ${idSensor}</p>
                    <p class="last-seen"><i class="bi bi-clock"></i> Visto: ${info.last_seen.split('T')[1]}</p>
                </div>
                <div class="sensor-status">
                    <span class="status-badge ${statusClass}">${statusText}</span>
                    <span class="battery-level"><i class="bi bi-battery-full"></i> ${info.bateria || '100%'}</span>
                </div>
            `;
            listaContainer.appendChild(card);

            let lat, lng;
            if(idSensor.includes('01')) { lat = -7.249; lng = -39.496; } 
            if(idSensor.includes('02')) { lat = -7.365; lng = -39.295; }

            if (lat && lng) {
                const iconColor = isOnline ? 'green' : 'red';
                const customIcon = L.icon({
                    iconUrl: 'assets/icon-localização.webp',
                    iconSize: [64, 64], 
                    iconAnchor: [32, 64],
                    popupAnchor: [0, -64]
                });

                if (markers[idSensor]) {
                    markers[idSensor].setLatLng([lat, lng]); 
                    markers[idSensor].setIcon(customIcon);
                    markers[idSensor].setPopupContent(`<b>${info.nome}</b><br>Status: ${statusText}`);
                } else {
                    const marker = L.marker([lat, lng], {icon: customIcon}).addTo(map)
                        .bindPopup(`<b>${info.nome}</b><br>Status: ${statusText}`);
                    markers[idSensor] = marker;
                }
            }
        });
    }

    if(document.getElementById('count-total')) document.getElementById('count-total').innerText = total;
    if(document.getElementById('count-online')) document.getElementById('count-online').innerText = online;
    if(document.getElementById('count-offline')) document.getElementById('count-offline').innerText = offline;

    if(document.getElementById('summary-online')) document.getElementById('summary-online').innerText = online;
    if(document.getElementById('summary-offline')) document.getElementById('summary-offline').innerText = offline;
    if(document.getElementById('summary-atencao')) document.getElementById('summary-atencao').innerText = atencao;
});