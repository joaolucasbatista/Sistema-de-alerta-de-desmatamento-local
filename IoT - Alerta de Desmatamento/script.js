import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, onChildAdded, onValue } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

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

const map = L.map('map').setView([-7.249, -39.496], 14);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

const alertaIconUrl = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iY3JpbXNvbiI+PHBhdGggZD0iTTEyIDJDOC4xMyAyIDUgNS4xMyA1IDljMCA1LjI1IDcgMTMgNyAxM3M3LTcuNzUgNy0xM2MwLTMuODctMy4xMy03LTctN3ptMCAxMS41Yy0xLjM4IDAtMi41LTEuMTItMi41LTIuNVMxMC42MiA4IDEyIDhzMi41IDEuMTIgMi41IDIuNS0xLjEyIDIuNS0yLjUgMi41eiIvPjwvc3ZnPg==';

const alertaIcon = L.icon({
  iconUrl: alertaIconUrl,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -28]
});

const alertList = document.getElementById('alert-list');
const alertMarkers = {}; 

const sensorStatusList = document.getElementById('sensor-status-list');

function exibirAlerta(alerta, id) { 
  const { sensor_id, timestamp, coordenadas, nivel_confianca } = alerta;

  const newMarker = L.marker([coordenadas.latitude, coordenadas.longitude], { icon: alertaIcon })
    .addTo(map)
    .bindPopup(`
      <b>🚨 Sensor:</b> ${sensor_id}<br>
      <b>Confiança:</b> ${(nivel_confianca * 100).toFixed(1)}%<br>
      <b>Hora:</b> ${new Date(timestamp).toLocaleString()}
    `);

  alertMarkers[id] = newMarker; 

  const agora = new Date();
  const diffHoras = Math.floor((agora - new Date(timestamp)) / (1000 * 60 * 60));
  let tempoTexto = diffHoras < 1 ? 'agora mesmo'
    : diffHoras < 24 ? `há ${diffHoras}h`
    : `há ${Math.floor(diffHoras / 24)} dias`;

  let confClass = 'conf-high';
  if (nivel_confianca < 0.85) confClass = 'conf-medium';
  if (nivel_confianca < 0.7) confClass = 'conf-low';

  const li = document.createElement('li');
  li.dataset.key = id; 
  li.innerHTML = `
    <div class="alert-info">
      <span class="alert-sensor">${sensor_id}</span>
      <span class="alert-time">${tempoTexto}</span>
    </div>
    <span class="alert-confidence ${confClass}">
      ${(nivel_confianca * 100).toFixed(0)}%
    </span>
  `;
  alertList.prepend(li);
}

const alertasRef = ref(db, 'alertas/');
onChildAdded(alertasRef, (snapshot) => {
    
    const alerta = snapshot.val();
    const alertaId = snapshot.key; 
    
    const alertaFormatado = {
        sensor_id: "Motosserra",
        timestamp: new Date(alerta.data_hora) || new Date(),
        coordenadas: {
            latitude: parseFloat(alerta.geoloc.split(',')[0]),
            longitude: parseFloat(alerta.geoloc.split(',')[1])
        },
        nivel_confianca: 0.95
    };
    
    exibirAlerta(alertaFormatado, alertaId);
});

alertList.addEventListener('click', (e) => {
  const itemClicado = e.target.closest('li');
  
  if (itemClicado) {
    const id = itemClicado.dataset.key;
    const marker = alertMarkers[id];
    
    if (marker) {
      map.flyTo(marker.getLatLng(), 16);
      marker.openPopup();
    }
  }
});

const SENSOR_TIMEOUT = 45000; 
const sensorStatusRef = ref(db, '/status/');

onValue(sensorStatusRef, (snapshot) => {
  sensorStatusList.innerHTML = '';
  
  if (snapshot.exists()) {
    const allSensors = snapshot.val();
    const now = new Date().getTime();

    Object.keys(allSensors).forEach(sensorId => {
      const status = allSensors[sensorId];
      const lastSeenTime = new Date(status.last_seen).getTime();

      const li = document.createElement('li');
      const dot = document.createElement('span');
      dot.className = 'status-dot';
      
      const text = document.createElement('span');
      text.textContent = sensorId.replace(/_/g, ' '); 

      li.appendChild(dot);
      li.appendChild(text);

      if (now - lastSeenTime < SENSOR_TIMEOUT) {
        li.className = 'sensor-online';
      } else {
        li.className = 'sensor-offline';
      }

      sensorStatusList.appendChild(li);
    });
  } else {
    sensorStatusList.innerHTML = '<li>Nenhum sensor reportando.</li>';
  }
});