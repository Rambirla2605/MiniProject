// ════════════════════════════════════════════════════════════════
//  II ECE B IoT Sensor Node  —  PZEM-004T + ESP32
//  Sends real-time V, I, P, PF, Hz to Render-hosted Digital Twin
// ════════════════════════════════════════════════════════════════

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <PZEM004Tv30.h>

// ── ① Change these three values only ────────────────────────────
const char* WIFI_SSID  = "YOUR_WIFI_NAME";
const char* WIFI_PASS  = "YOUR_WIFI_PASSWORD";
const char* SERVER_URL = "https://miniproject-jgox.onrender.com/api/classroom/II-ECE-B/sensor-data";
// ────────────────────────────────────────────────────────────────

// PZEM-004T connected to ESP32 UART2 (RX=GPIO16, TX=GPIO17)
PZEM004Tv30 pzem(Serial2, 16, 17);

unsigned long lastSent = 0;
const unsigned long INTERVAL = 3000; // send every 3 seconds

// ── WiFi connect helper ──────────────────────────────────────────
void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Connecting to WiFi");
  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 30) {
    delay(500);
    Serial.print(".");
    tries++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi OK — " + WiFi.localIP().toString());
  } else {
    Serial.println("\n❌ WiFi failed — will retry");
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("\n=== II ECE B Sensor Node ===");
  connectWiFi();
}

void loop() {
  // Auto-reconnect if WiFi drops
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi lost — reconnecting...");
    connectWiFi();
    return;
  }

  if (millis() - lastSent >= INTERVAL) {
    lastSent = millis();

    // ── Read PZEM sensor ────────────────────────────────────────
    float voltage     = pzem.voltage();
    float current     = pzem.current();
    float powerW      = pzem.power();          // Watts
    float powerFactor = pzem.pf();
    float frequency   = pzem.frequency();

    // If sensor not responding, skip this cycle
    if (isnan(voltage) || isnan(current)) {
      Serial.println("⚠️ Sensor read error — check wiring");
      return;
    }

    float powerKW = powerW / 1000.0;

    Serial.printf("[SENSOR] V=%.1fV  I=%.2fA  P=%.3fkW  PF=%.2f  Hz=%.2f\n",
                  voltage, current, powerKW, powerFactor, frequency);

    // ── Build JSON payload ───────────────────────────────────────
    StaticJsonDocument<256> doc;
    doc["voltage"]      = round(voltage * 10) / 10.0;
    doc["current"]      = round(current * 100) / 100.0;
    doc["power"]        = round(powerKW * 1000) / 1000.0;
    doc["power_factor"] = round(powerFactor * 100) / 100.0;
    doc["frequency"]    = round(frequency * 100) / 100.0;

    String payload;
    serializeJson(doc, payload);

    // ── POST to Render backend via HTTPS ─────────────────────────
    WiFiClientSecure client;
    client.setInsecure(); // skip SSL cert check (fine for this project)

    HTTPClient https;
    https.begin(client, SERVER_URL);
    https.addHeader("Content-Type", "application/json");
    https.setTimeout(8000); // 8s timeout (Render free tier can be slow)

    int code = https.POST(payload);

    if (code == 200) {
      Serial.println("✅ Sent! Website updated to LIVE mode.");
    } else if (code == -1) {
      Serial.println("❌ Connection failed (Render sleeping? try again)");
    } else {
      Serial.println("⚠️ HTTP " + String(code));
    }

    https.end();
  }
}
