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

const MAP_INITIAL_ZOOM = 14;
const MAP_FLYTO_ZOOM = 16;
const SENSOR_TIMEOUT_MS = 45000;
const CONFIDENCE_HIGH_THRESHOLD = 0.85;
const CONFIDENCE_MEDIUM_THRESHOLD = 0.7;

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const map = L.map('map').setView([-7.249, -39.496], MAP_INITIAL_ZOOM);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

const alertaIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const alertList = document.getElementById('alert-list');
const sensorStatusList = document.getElementById('sensor-status-list');

const alertMarkers = {};

function exibirAlerta(alerta, id) {
  const { sensor_id, timestamp, coordenadas, nivel_confianca } = alerta;

  const newMarker = L.marker([coordenadas.latitude, coordenadas.longitude], { icon: alertaIcon })
    .addTo(map)
    .bindPopup(`
      <b>Sensor:</b> ${sensor_id}<br>
      <b>Confiança:</b> ${(nivel_confianca * 100).toFixed(1)}%<br>
      <b>Hora:</b> ${new Date(timestamp).toLocaleString()}
    `);

  alertMarkers[id] = newMarker;

  const tempoTexto = formatarTempoRelativo(timestamp);
  const confClass = getClasseConfianca(nivel_confianca);

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

function formatarTempoRelativo(timestamp) {
  const agora = new Date();
  const diffMs = agora - new Date(timestamp);
  const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHoras < 1) return 'agora mesmo';
  if (diffHoras < 24) return `há ${diffHoras}h`;
  return `há ${Math.floor(diffHoras / 24)} dias`;
}

function getClasseConfianca(nivel) {
  if (nivel >= CONFIDENCE_HIGH_THRESHOLD) return 'conf-high';
  if (nivel >= CONFIDENCE_MEDIUM_THRESHOLD) return 'conf-medium';
  return 'conf-low';
}

function atualizarStatusSensores(allSensors) {
  sensorStatusList.innerHTML = '';
  const now = new Date().getTime();

  Object.keys(allSensors).forEach(sensorId => {
    const status = allSensors[sensorId];
    const lastSeenTime = new Date(status.last_seen).getTime();

    const li = document.createElement('li');
    
    const isOnline = (now - lastSeenTime < SENSOR_TIMEOUT_MS);
    const statusClass = isOnline ? 'sensor-online' : 'sensor-offline';
    const statusText = isOnline ? 'Online' : 'Offline';

    li.className = statusClass;
    
    li.innerHTML = `
      <div style="display: flex; align-items: center;">
        <span class="status-dot"></span>
        <span>${sensorId.replace(/_/g, ' ')}</span>
      </div>
      <span style="font-weight: normal; font-size: 0.85rem;">
        ${statusText}
      </span>
    `;

    sensorStatusList.appendChild(li);
  });
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
    nivel_confianca: alerta.nivel_confianca || 0.7
  };

  exibirAlerta(alertaFormatado, alertaId);
});

const sensorStatusRef = ref(db, '/status/');
onValue(sensorStatusRef, (snapshot) => {
  if (snapshot.exists()) {
    atualizarStatusSensores(snapshot.val());
  } else {
    sensorStatusList.innerHTML = '<li>Nenhum sensor reportando.</li>';
  }
});

alertList.addEventListener('click', (e) => {
  const itemClicado = e.target.closest('li');

  if (itemClicado) {
    const id = itemClicado.dataset.key;
    const marker = alertMarkers[id];

    if (marker) {
      map.flyTo(marker.getLatLng(), MAP_FLYTO_ZOOM);
      marker.openPopup();
    }
  }
});