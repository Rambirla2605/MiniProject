# ESP32 IoT Sensor Node for Classroom II ECE B

This folder contains the firmware for the ESP32 microcontroller to measure real AC electrical parameters (Voltage, Current, Power, Power Factor, Frequency) from Classroom II ECE B and stream them to the Digital Twin backend.

## Hardware Wiring (PZEM-004T v3.0)
- **PZEM TX** -> ESP32 **GPIO 16 (RX2)**
- **PZEM RX** -> ESP32 **GPIO 17 (TX2)**
- **PZEM GND** -> ESP32 **GND**
- **PZEM 5V** -> ESP32 **VIN (5V)**
- **Current Transformer (CT)**: Clamp around single live conductor of II ECE B load feed.

## Setup Instructions
1. Open `esp32_pzem004t/esp32_pzem004t.ino` in Arduino IDE.
2. Install required libraries from Library Manager:
   - `PZEM004Tv30`
   - `ArduinoJson` (by Benoit Blanchon)
3. Set your WiFi credentials and your deployed Render URL:
   ```cpp
   const char* WIFI_SSID  = "YOUR_WIFI_NAME";
   const char* WIFI_PASS  = "YOUR_WIFI_PASSWORD";
   const char* SERVER_URL = "https://<your-render-app>.onrender.com/api/classroom/II-ECE-B/sensor-data";
   ```
4. Select Board: **ESP32 Dev Module** and click **Upload**.
5. When running, the Digital Twin interface will automatically detect real hardware and update live readings.
