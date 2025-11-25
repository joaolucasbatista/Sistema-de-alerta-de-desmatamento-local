import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

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

let dadosGlobais = []; 
let periodoDias = 30; 
let charts = {}; 

const selectPeriodo = document.getElementById('periodo-select'); 
const btnExportar = document.querySelector('.btn-primary');

document.addEventListener('DOMContentLoaded', async () => {
    configurarBotoes();
    
    const dados = await buscarDadosFirebase();
    dadosGlobais = dados;

    if (dados.length > 0) {
        atualizarInterface();
    } else {
        console.log("Nenhum dado encontrado.");
    }
});


function configurarBotoes() {
    if (selectPeriodo) {
        selectPeriodo.addEventListener('change', (e) => {
            periodoDias = parseInt(e.target.value);
            console.log(`Período alterado para: ${periodoDias} dias`);
            atualizarInterface();
        });
    }

    if (btnExportar) {
        btnExportar.addEventListener('click', () => {
            exportarParaCSV(filtrarDadosPorPeriodo(dadosGlobais));
        });
    }
}

function filtrarDadosPorPeriodo(dados) {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - periodoDias);
    dataLimite.setHours(0,0,0,0);
    
    return dados.filter(alerta => {
        const dataAlerta = new Date(alerta.data_hora);
        return dataAlerta >= dataLimite;
    });
}

function atualizarInterface() {
    const dadosFiltrados = filtrarDadosPorPeriodo(dadosGlobais);
    
    renderizarGraficoPeriodo(dadosFiltrados);
    renderizarGraficoConfianca(dadosFiltrados);
    renderizarResumoExecutivo(dadosFiltrados);
    inicializarMapaDeCalor(dadosFiltrados);
}

function exportarParaCSV(dados) {
    if (!dados || dados.length === 0) {
        alert("Sem dados para exportar neste período.");
        return;
    }

    let csvContent = "Sensor,Tipo de Som,Data,Hora,Status,Confiança,Geolocalização\n";

    dados.forEach(item => {
        const dataObj = new Date(item.data_hora);
        const dataStr = dataObj.toLocaleDateString('pt-BR');
        const horaStr = dataObj.toLocaleTimeString('pt-BR');
        const sensor = item.sensor_id || "Sensor Norte"; 
        const tipo = item.tipo_som_detectado || "Motosserra";
        const status = item.status || "novo";
        const confianca = (item.nivel_confianca * 100).toFixed(0) + "%";
        const geoloc = item.geoloc ? `"${item.geoloc}"` : "";

        const linha = `${sensor},${tipo},${dataStr},${horaStr},${status},${confianca},${geoloc}`;
        csvContent += linha + "\n";
    });

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `forestwatch_relatorio_${periodoDias}dias.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function buscarDadosFirebase() {
    const alertasRef = ref(db, 'alertas/');
    const snapshot = await get(alertasRef);
    const listaAlertas = [];

    if (snapshot.exists()) {
        snapshot.forEach(child => {
            const alerta = child.val();
            if (alerta.data_hora) {
                listaAlertas.push(alerta);
            }
        });
    }
    return listaAlertas;
}

function renderizarGraficoPeriodo(alertas) {
    const ctx = document.getElementById('alertasPorPeriodoChart');
    if (!ctx) return;

    if (charts['periodo']) charts['periodo'].destroy();

    const agrupamento = {};
    const labels = [];
    
    const agruparPorMes = periodoDias > 35; 
    
    const dataFim = new Date();
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - periodoDias);

    if (agruparPorMes) {
        let tempDate = new Date(dataInicio);
        while (tempDate <= dataFim) {
            const label = tempDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }); 
            if (!labels.includes(label)) {
                labels.push(label);
                agrupamento[label] = { novos: 0, analise: 0, resolvidos: 0 };
            }
            tempDate.setMonth(tempDate.getMonth() + 1);
        }
    } else {
        for (let i = 0; i <= periodoDias; i++) {
            const d = new Date(dataInicio);
            d.setDate(d.getDate() + i);
            const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            labels.push(label);
            agrupamento[label] = { novos: 0, analise: 0, resolvidos: 0 };
        }
    }

    alertas.forEach(alerta => {
        const d = new Date(alerta.data_hora);
        let labelKey;

        if (agruparPorMes) {
            labelKey = d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        } else {
            labelKey = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        }

        if (agrupamento[labelKey]) {
            const s = alerta.status || 'novo';
            if (s === 'novo') agrupamento[labelKey].novos++;
            else if (s === 'analise') agrupamento[labelKey].analise++;
            else if (s === 'resolvido') agrupamento[labelKey].resolvidos++;
        }
    });

    const dadosNovos = labels.map(l => agrupamento[l].novos);
    const dadosAnalise = labels.map(l => agrupamento[l].analise);
    const dadosResolvidos = labels.map(l => agrupamento[l].resolvidos);

    charts['periodo'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Novos', data: dadosNovos, backgroundColor: '#ef4444', borderRadius: 4 },
                { label: 'Em Análise', data: dadosAnalise, backgroundColor: '#f97316', borderRadius: 4 },
                { label: 'Resolvidos', data: dadosResolvidos, backgroundColor: '#10b981', borderRadius: 4 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } },
            scales: {
                x: { stacked: true, grid: { display: false } },
                y: { stacked: true, grid: { color: '#e5e7eb' } }
            }
        }
    });
}

function renderizarGraficoConfianca(alertas) {
    const ctx = document.getElementById('alertasPorConfiancaChart');
    if (!ctx) return;

    if (charts['confianca']) charts['confianca'].destroy();

    let alta = 0, media = 0, baixa = 0;
    alertas.forEach(alerta => {
        const conf = parseFloat(alerta.nivel_confianca) || 0;
        if (conf >= 0.9) alta++;
        else if (conf >= 0.7) media++;
        else baixa++;
    });

    charts['confianca'] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Alta (>90%)', 'Média (70-90%)', 'Baixa (<70%)'],
            datasets: [{
                data: [alta, media, baixa],
                backgroundColor: ['#8b5cf6', '#60a5fa', '#a78bfa'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

function renderizarResumoExecutivo(alertas) {
    const total = alertas.length;
    document.querySelector('.summary-card:nth-child(1) .summary-value').textContent = total;

    const resolvidosComData = alertas.filter(a => a.status === 'resolvido' && a.data_resolucao && a.data_hora);
    let textoTempo = "--";
    
    if (resolvidosComData.length > 0) {
        const somaTempos = resolvidosComData.reduce((acc, a) => {
            return acc + (new Date(a.data_resolucao) - new Date(a.data_hora));
        }, 0);
        const mediaMinutos = Math.floor((somaTempos / resolvidosComData.length) / 60000);

        if (mediaMinutos < 60) textoTempo = `${mediaMinutos}min`;
        else textoTempo = `${Math.floor(mediaMinutos / 60)}h ${mediaMinutos % 60}min`;
    }
    
    document.querySelector('.summary-card:nth-child(2) .summary-value').textContent = textoTempo;

    const areaEstimada = (total * 0.5).toFixed(1) + "ha";
    document.querySelector('.summary-card:nth-child(3) .summary-value').textContent = areaEstimada;
}

async function inicializarMapaDeCalor(alertas) {
    const container = document.getElementById('heatmap-map');

    if (window.heatmapMap) {
        window.heatmapMap.remove();
        window.heatmapMap = null;
    }

    if (container && container._leaflet_id) {
        container._leaflet_id = null;
    }

    window.heatmapMap = L.map('heatmap-map').setView([-7.249, -39.496], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(window.heatmapMap);

    const pontos = [];
    alertas.forEach(alerta => {
        if (alerta.geoloc) {
            const [lat, lng] = alerta.geoloc.split(',');
            const intensidade = parseFloat(alerta.nivel_confianca) || 0.5;
            
            const offsetLat = (Math.random() - 0.5) * 0.04; 
            const offsetLng = (Math.random() - 0.5) * 0.04;
            
            pontos.push([
                parseFloat(lat) + offsetLat, 
                parseFloat(lng) + offsetLng, 
                intensidade
            ]);
        }
    });

    if (pontos.length > 0) {
        L.heatLayer(pontos, {
            radius: 60,
            blur: 40,
            maxZoom: 17,
            minOpacity: 0.4,
            gradient: { 0.4: 'gold', 0.65: 'orange', 1.0: 'red' }
        }).addTo(window.heatmapMap);
    } else {
        window.heatmapMap.setView([-7.249, -39.496], 13);
    }
    
    const zonaNorteCoords = [-7.235, -39.500];
    const zonaSulCoords = [-7.310, -39.305]; 

    const zonaMarkerOptions = { radius: 0, fill: false, stroke: false, interactive: false };
    
    L.circleMarker(zonaNorteCoords, zonaMarkerOptions).addTo(window.heatmapMap)
        .bindTooltip("Zona Norte", { permanent: true, direction: 'center', className: 'zone-label' });

    L.circleMarker(zonaSulCoords, zonaMarkerOptions).addTo(window.heatmapMap)
        .bindTooltip("Zona Sul", { permanent: true, direction: 'center', className: 'zone-label' });

    const total = alertas.length;
    const lista = document.querySelector('.heatmap-list');
    if (lista) {
        if (total > 0) {
            lista.innerHTML = `
                <div class="zone-item"><span>Zona Norte</span><span>${Math.floor(total * 0.70)}</span></div>
                <div class="zone-item"><span>Zona Sul</span><span>${Math.ceil(total * 0.30)}</span></div>
            `;
        } else {
            lista.innerHTML = `<div style="padding:1rem; color:#6b7280; text-align:center;">Sem dados neste período</div>`;
        }
    }
}