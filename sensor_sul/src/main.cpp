#include <Arduino.h>
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include "time.h"
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"
#include "secrets.h" 

#define ID_SENSOR 2 

String DEVICE_ID;
String DEVICE_NAME; 
String GEO_LOC;    

#define FIREBASE_HOST FIREBASE_HOST_REAL
#define FIREBASE_AUTH FIREBASE_AUTH_REAL
#define WIFI_SSID WIFI_SSID_REAL
#define WIFI_PASSWORD WIFI_PASSWORD_REAL

#define PINO_POT_SOM    34  
#define PINO_POT_FUMACA 35  
#define PINO_BUZZER     18  
#define PINO_LED        2   

#define THRESHOLD_SOM    3500 
#define THRESHOLD_FUMACA 2500 
#define HEARTBEAT_TIME   30000 

unsigned long lastHeartbeatTime = 0;
bool alertaSomAtivo = false;
bool alertaFogoAtivo = false;

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

void configurarIdentidade() {
  if (ID_SENSOR == 1) {
    DEVICE_ID = "sensor_chapada_01";
    DEVICE_NAME = "Sensor Norte - Crato";
    GEO_LOC = "-7.249, -39.496";
  } else {
    DEVICE_ID = "sensor_chapada_02";
    DEVICE_NAME = "Sensor Sul - Barbalha";
    GEO_LOC = "-7.365, -39.295";
  }
  Serial.print(">>> IDENTIDADE CARREGADA: ");
  Serial.println(DEVICE_NAME);
}

void setup() {
  Serial.begin(115200);
  configurarIdentidade();

  pinMode(PINO_POT_SOM, INPUT);
  pinMode(PINO_POT_FUMACA, INPUT);
  pinMode(PINO_BUZZER, OUTPUT);
  pinMode(PINO_LED, OUTPUT);

  Serial.print("Conectando ao Wi-Fi: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println("\nConectado! IP: ");
  Serial.println(WiFi.localIP());

  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  configTime(-3 * 3600, 0, "pool.ntp.org");
  Serial.println("Relógio sincronizado.");

  char timeString[20];
  struct tm timeinfo;
  if(getLocalTime(&timeinfo)){
    strftime(timeString, sizeof(timeString), "%Y-%m-%dT%H:%M:%S", &timeinfo);
    
    FirebaseJson statusJson;
    statusJson.set("last_seen", timeString);
    statusJson.set("nome", DEVICE_NAME); 
    statusJson.set("bateria", "55%"); // Configuração de bateria do Sensor Sul
    
    String path = "/status/"; 
    path += DEVICE_ID;
    
    if(Firebase.RTDB.setJSON(&fbdo, path, &statusJson)){
       Serial.print(">>> Primeiro Heartbeat enviado para: ");
       Serial.println(path); 
    }
  }
  lastHeartbeatTime = millis();
}

void somHelicoptero() {
  tone(PINO_BUZZER, 80); 
  delay(15);
  noTone(PINO_BUZZER);   
  delay(35);
}

void somSirene() {
  for (int freq = 500; freq < 1200; freq += 20) {
    tone(PINO_BUZZER, freq); delay(2); 
  }
  for (int freq = 1200; freq > 500; freq -= 20) {
    tone(PINO_BUZZER, freq); delay(2); 
  }
}

void enviarAlerta(const char* tipo, const char* timeString, float confianca) {
  Serial.println("--- ALERTA ---");
  Serial.print("Origem: ");
  Serial.println(DEVICE_NAME); 

  FirebaseJson json;
  json.set("sensor_id", DEVICE_ID);     
  json.set("nome_sensor", DEVICE_NAME); 
  json.set("tipo_som_detectado", tipo); 
  json.set("geoloc", GEO_LOC);          
  json.set("data_hora", timeString); 
  json.set("nivel_confianca", confianca);
  json.set("status", "novo"); 

  if (Firebase.RTDB.pushJSON(&fbdo, "/alertas", &json)) {
    Serial.println(">> Sucesso: Enviado para a nuvem!");
  } else {
    Serial.printf(">> Erro: %s\n", fbdo.errorReason().c_str());
  }
  Serial.println("--------------");
}

void loop() {
  char timeString[20] = "ERRO_NTP";
  struct tm timeinfo;
  if(getLocalTime(&timeinfo)){
    strftime(timeString, sizeof(timeString), "%Y-%m-%dT%H:%M:%S", &timeinfo);
  }

  if (millis() - lastHeartbeatTime > HEARTBEAT_TIME) {
    lastHeartbeatTime = millis();
    FirebaseJson statusJson;
    statusJson.set("last_seen", timeString);
    statusJson.set("nome", DEVICE_NAME);
    statusJson.set("bateria", "55%"); // Configuração de bateria do Sensor Sul
    
    String path = "/status/";
    path += DEVICE_ID;
    
    Firebase.RTDB.setJSON(&fbdo, path, &statusJson);
    Serial.print("Heartbeat enviado de: ");
    Serial.println(DEVICE_NAME);
  }

  int valorSom = analogRead(PINO_POT_SOM);
  int valorFumaca = analogRead(PINO_POT_FUMACA);

  if (valorSom > THRESHOLD_SOM) {
    if (!alertaSomAtivo) {
      alertaSomAtivo = true;
      digitalWrite(PINO_LED, HIGH); 
      float conf = map(valorSom, THRESHOLD_SOM, 4095, 70, 99) / 100.0;
      enviarAlerta("Motosserra", timeString, conf);
    }
    somHelicoptero(); 
  } else {
    alertaSomAtivo = false;
  }

  if (valorFumaca > THRESHOLD_FUMACA) {
    if (!alertaFogoAtivo) {
      alertaFogoAtivo = true;
      digitalWrite(PINO_LED, HIGH); 
      float conf = map(valorFumaca, THRESHOLD_FUMACA, 4095, 80, 100) / 100.0;
      enviarAlerta("Queimada Detectada", timeString, conf);
    }
    somSirene(); 
  } else {
    alertaFogoAtivo = false;
  }

  if (!alertaSomAtivo && !alertaFogoAtivo) {
    digitalWrite(PINO_LED, LOW);
    noTone(PINO_BUZZER);
  }
  
  delay(50); 
}