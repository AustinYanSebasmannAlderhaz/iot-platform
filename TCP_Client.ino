#include <WiFi.h>
#include <Wire.h>
#include <WiFiUdp.h>
#include <NTPClient.h>

#define SHT40_I2C_ADDR 0x44
#define CMD_MEASURE_HIGH_PREC 0xFD

const char* ssid = "iPhone of Austin";
const char* password = "fps114514YAN";
const char* host = "172.20.10.6";
const uint16_t port = 4000;

WiFiClient client;
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 8 * 3600); // 台灣時區 UTC+8

unsigned long lastSampleTime = 0;
const unsigned long interval = 1000;  // 每秒取樣一次

void setup() {
  Serial.begin(115200);
  while (!Serial);

  Wire.begin();
  connectToWiFi();
  timeClient.begin();
  timeClient.update();
  connectToServer();
}

void loop() {
  unsigned long now = millis();

  if (now - lastSampleTime >= interval) {
    lastSampleTime += interval;

    float tempC, humidity;
    if (!timeClient.update()) {
      timeClient.forceUpdate();
    }

    if (readSHT40(tempC, humidity)) {
      char timestamp[16];
      snprintf(timestamp, sizeof(timestamp), "[%s]", timeClient.getFormattedTime().c_str());

      char buffer[128];
      snprintf(buffer, sizeof(buffer), "%s Temp:%.2f Humidity:%.2f", timestamp, tempC, humidity);
      Serial.println(buffer);

      if (client.connected()) {
        client.println(buffer);
      } else {
        Serial.println("[TCP] Reconnecting...");
        connectToServer();
      }
    } else {
      Serial.println("TempC:0  Humidity:0");
    }
  }
}

void connectToWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin((char*)ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected.");
}

void connectToServer() {
  if (!client.connect(host, port)) {
    Serial.println("[TCP] Connection failed.");
  } else {
    Serial.println("[TCP] Connected to server.");
  }
}

bool readSHT40(float &tempC, float &humidity) {
  Wire.beginTransmission(SHT40_I2C_ADDR);
  Wire.write(CMD_MEASURE_HIGH_PREC);
  if (Wire.endTransmission() != 0) return false;

  delay(10);
  Wire.requestFrom(SHT40_I2C_ADDR, 6);
  if (Wire.available() != 6) return false;

  uint8_t t_msb = Wire.read();
  uint8_t t_lsb = Wire.read();
  Wire.read(); // CRC
  uint8_t h_msb = Wire.read();
  uint8_t h_lsb = Wire.read();
  Wire.read(); // CRC

  uint16_t t_ticks = (t_msb << 8) | t_lsb;
  uint16_t h_ticks = (h_msb << 8) | h_lsb;

  tempC = -45.0 + 175.0 * ((float)t_ticks / 65535.0);
  humidity = -6.0 + 125.0 * ((float)h_ticks / 65535.0);

  if (humidity > 100.0) humidity = 100.0;
  if (humidity < 0.0) humidity = 0.0;

  return true;
}
