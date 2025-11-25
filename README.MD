<div align="center">

# 🌳 SADEL - Sistema de Alerta de Desmatamento Local 🔥

**Projeto acadêmico de monitoramento ambiental para a Chapada do Araripe.**

Desenvolvido por alunos de Análise e Desenvolvimento de Sistemas da UniFAP. O objetivo é um sistema de monitoramento e alerta de desmatamento e queimadas em tempo real.

---

### 🛠️ Tecnologias Utilizadas

**Hardware & IoT**<br>
![ESP32](https://img.shields.io/badge/ESP32-E7332E?style=for-the-badge&logo=espressif&logoColor=white)
![Arduino](https://img.shields.io/badge/Arduino_(C++)-00979D?style=for-the-badge&logo=arduino&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Wokwi](https://img.shields.io/badge/Wokwi-434A54?style=for-the-badge&logo=wokwi&logoColor=white)

**Frontend & Dashboard**<br>
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

</div>

---

## ✨ Funcionalidades Principais

O sistema foi projetado para identificar riscos ambientais usando sensores simulados:

* 🔊 **Detecção de Som:** O protótipo usa um sensor (simulado por um potenciômetro) para identificar padrões sonoros que sugerem o uso de motosserras.
* 🔥 **Detecção de Queimadas:** Um segundo sensor monitora a fumaça e o gás no ambiente, ativando um alerta imediato em caso de risco de incêndio.
* ☁️ **Alerta em Tempo Real:** Ao detectar um risco, o sistema envia um pacote de alerta imediatamente para o banco de dados na nuvem (Firebase).
* 💓 **Monitoramento de Status:** Os sensores enviam um "sinal de vida" (heartbeat) a cada 30 segundos para confirmar que estão online.
* 🖥️ **Dashboard de Visualização:** Uma interface web consome os dados do Firebase e exibe os alertas recebidos visualmente.

---

## 📸 Galeria do Projeto

Abaixo estão algumas capturas de tela do funcionamento do sistema SADEL.

### Visão da Dashboard Web
*Interface onde os alertas de incêndio e desmatamento são mostrados em tempo real.*

<div align="center">
  <img src="assets/Prints/Dashboard-print.png" alt="Screenshot da Dashboard SADEL" width="800px">
</div>

<div align="center">
  <img src="assets/Prints/relatórios-print.png" alt="Screenshot da aba relatórios SADEL" width="800px">
</div>

<div align="center">
  <img src="assets/Prints/sensores-print.png" alt="Screenshot da aba sensores SADEL" width="800px">
</div>

### Simulação no Wokwi (IoT)
*O circuito ESP32 simulado, mostrando os sensores de gás e som.*

<div align="center">
  <img src="assets/Prints/wokwi-print.png" alt="Circuito Wokwi SADEL" width="800px">
</div>

---

## 📂 Estrutura do Repositório

O projeto está organizado nas seguintes pastas:

* ` /dashboard/ ` - Contém os arquivos do frontend web (HTML, CSS, JS) para exibir os alertas.
* ` /sensor_norte/ ` - Projeto PlatformIO do **Sensor 1 (Crato)**. Inclui código-fonte (`src/main.cpp`) e diagrama.
* ` /sensor_sul/ ` - Projeto PlatformIO do **Sensor 2 (Barbalha)**. Inclui código-fonte (`src/main.cpp`) e diagrama.

---

## ⚠️ Aviso de Configuração Importante

Para que o projeto funcione, você **DEVE** fornecer suas próprias credenciais. Os arquivos de código foram enviados sem dados sensíveis por segurança.

1.  **Firmware (C++/Sensores):** Você precisará criar o arquivo `secrets.h` nas pastas de cada sensor e inserir suas credenciais de Firebase e Wi-Fi.
2.  **Dashboard (JS):** Você precisará substituir os placeholders (`SUA_API_KEY_AQUI`, etc.) nos arquivos JavaScript dentro da pasta `/dashboard/`.

---

## 👥 Autores

Projeto desenvolvido em colaboração por:

* **João Lucas Batista**
    * [LinkedIn](https://www.linkedin.com/in/jo%C3%A3olucasdev/)
    * [GitHub](https://github.com/joaolucasbatista)

    * **Evandio de Souza Filho**
    * [LinkedIn](https://www.linkedin.com/in/evandio-de-souza/)
    * [GitHub](https://github.com/evandiopds)

<div align="center">
  <br>
  <img src="https://img.shields.io/badge/Desenvolvido%20na-UniFAP-blue?style=flat-square" alt="UniFAP Badge">
</div>