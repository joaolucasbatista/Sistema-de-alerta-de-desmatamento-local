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

const alertaIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const alertList = document.getElementById('alert-list');
const alertMarkers = {}; 

const sensorStatusList = document.getElementById('sensor-status-list');

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
        nivel_confianca: alerta.nivel_confianca || 0.7 
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
      
      const nameDiv = document.createElement('div');
      nameDiv.style.display = 'flex';
      nameDiv.style.alignItems = 'center';
      
      const dot = document.createElement('span');
      dot.className = 'status-dot';
      
      const text = document.createElement('span');
      text.textContent = sensorId.replace(/_/g, ' '); 

      nameDiv.appendChild(dot);
      nameDiv.appendChild(text);

      const statusText = document.createElement('span');
      statusText.style.fontWeight = 'normal';
      statusText.style.fontSize = '0.85rem';

      li.appendChild(nameDiv);
      li.appendChild(statusText);

      if (now - lastSeenTime < SENSOR_TIMEOUT) {
        li.className = 'sensor-online';
        statusText.textContent = 'Online';
      } else {
        li.className = 'sensor-offline';
        statusText.textContent = 'Offline';
      }

      sensorStatusList.appendChild(li);
    });
  } else {
    sensorStatusList.innerHTML = '<li>Nenhum sensor reportando.</li>';
  }
});