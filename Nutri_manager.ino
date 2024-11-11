#include <ArduinoBLE.h>
#include "HX711.h"
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2); // Adjust 0x27 if your LCD I2C address is 


// HX711 pin configuration
#define DOUT  2
#define CLK   3

// BLE service and characteristic UUIDs
#define LOAD_THRESHOLD 1
HX711 scale;
float calibration_factor = 802.46;
float weight = 0;
float container_wt = 88.25;
bool weightDetected = false;

// BLE service and characteristics
BLEService commService("180A");
BLEByteCharacteristic sensorCharacteristic("2A58", BLERead | BLEWrite);
BLEByteCharacteristic classsCharacteristic("2A59", BLERead | BLEWrite);

// Allowed central MAC addresses
const String allowedMACs[] = {"2c:cf:67:69:35:eb"};
int16_t class_val = 20; // To show that the 20 value signifies no food class

struct Food {
    String name;
    float calories_per_gram;
};

Food foods[] = {
    {"Burger", 2.74},         // 2.74 kcal/g
    {"Butter_Naan", 3.10},    // 3.10 kcal/g
    {"Tea", 0.20},            // 0.20 kcal/g
    {"Chapati", 1.68},        // 1.68 kcal/g
    {"Chole_Bhature", 3.48},  // 3.48 kcal/g
    {"Dal_Makhani", 1.60},    // 1.60 kcal/g
    {"Dhokla", 1.25},         // 1.25 kcal/g
    {"Fried_Rice", 1.60},     // 1.60 kcal/g
    {"Idli", 1.04},           // 1.04 kcal/g
    {"Jalebi", 3.40},         // 3.40 kcal/g
    {"Kaathi_Rolls", 2.74},   // 2.74 kcal/g
    {"Kadai_Paneer", 2.22},   // 2.22 kcal/g
    {"Kulfi", 1.90},          // 1.90 kcal/g
    {"Masala_Dosa", 1.68},    // 1.68 kcal/g
    {"Momos", 1.75},          // 1.75 kcal/g
    {"Paani_Puri", 3.60},     // 3.60 kcal/g
    {"Pakode", 4.20},         // 4.20 kcal/g
    {"Pav_Bhaji", 2.85},      // 2.85 kcal/g
    {"Pizza", 2.95},          // 2.95 kcal/g
    {"Samosa", 3.00}          // 3.00 kcal/g
};


const String food_array[] = {
  "Burger", "Butter_Naan", "Tea", "Chapati", "Chole_Bhature", 
  "Dal_Makhani", "Dhokla", "Fried_Rice", "Idli", "Jalebi", 
  "Kaathi_Rolls", "Kadai_Paneer", "Kulfi", "Masala_Dosa", 
  "Momos", "Paani_Puri", "Pakode", "Pav_Bhaji", "Pizza", "Samosa"
};


float getCaloriesPerGram(String food_name) {
  calibrate_weight();
    for (int i = 0; i < sizeof(foods) / sizeof(foods[0]); i++) { // Iterate through the array
        if (foods[i].name.equals(food_name)) {  // Use .equals() for String comparison
            return foods[i].calories_per_gram * weight;
        }
    }
    return 0.0;  // Return 0 if food is not found
}

void BLE_setup() {
  if (!BLE.begin()) {
    Serial.println("Bluetooth® Low Energy failed to start!");
  }
  BLE.setLocalName("Nano 33 IoT");
  BLE.setAdvertisedService(commService);
  commService.addCharacteristic(sensorCharacteristic);
  commService.addCharacteristic(classsCharacteristic);
  BLE.addService(commService);
  BLE.advertise();
  Serial.println("BLE Peripheral setup complete.");
}

void load_setup() {
  scale.begin(DOUT, CLK);
  Serial.println("Taring the scale...");
  scale.tare();
  Serial.print("Calibration factor: ");
  Serial.println(calibration_factor);
}

void calibrate_weight() {
  delay(500);
  long rawData = scale.get_units(10);
  weight = rawData / calibration_factor - container_wt;
  Serial.print("Weight: ");
  Serial.print(weight);
  Serial.println(" g");
}

void get_weight() {
  calibrate_weight();
  if (weight > LOAD_THRESHOLD && !weightDetected) {
    weightDetected = true;
    Serial.print("Weight Detected: ");
    Serial.println(weight);
  }
  if (weight < LOAD_THRESHOLD && weightDetected) {
    weightDetected = false;
  }
}

float get_total_calories(String name,int length, float wt){
  for(int i = 0; i < length; i++){
    if (foods[i].name == name){
      return foods[i].calories_per_gram * wt;
    }
  }
}

void setup() {
  Serial.begin(9600);
  while (!Serial);
  lcd.begin();
  lcd.backlight();
  load_setup();
  BLE_setup();
  lcd.setCursor(0, 0);
  lcd.print("Food Calorie Calc");
  delay(2000);
  lcd.clear();
}

void loop() {
  BLEDevice central = BLE.central();
  if (central) {
    String centralMAC = central.address();
    Serial.print("Trying to connect central: ");
    Serial.println(centralMAC);
    bool isAllowed = false;
    for (int i = 0; i < sizeof(allowedMACs) / sizeof(allowedMACs[0]); i++) {
      if (centralMAC.equalsIgnoreCase(allowedMACs[i])) {
        isAllowed = true;
        break;
      }
    }

    if (isAllowed) {
      Serial.println("Allowed central is detected.");
      while (central.connected()) {
        get_weight();
        sensorCharacteristic.writeValue(weight);
        classsCharacteristic.readValue(&class_val, 2);
        Serial.print("Class = ");
        Serial.println((int)class_val);
          // Display the result on the LCD
          if (weightDetected && class_val < 20){
            lcd.clear();
            lcd.setCursor(0, 0);
            lcd.print(food_array[class_val]);
            lcd.print(": ");
            lcd.print(weight, 1);
            lcd.print(" g");
            lcd.setCursor(0, 1);
            lcd.print("Calories: ");
            float total_calories = get_total_calories(food_array[class_val],20, weight);
            lcd.print(total_calories);
            Serial.println(total_calories);
            delay(2000);
            lcd.clear(); 
        }
      }
      Serial.print(F("Disconnected from central: "));
      Serial.println(central.address());
      lcd.clear();
    } else {
      Serial.println("Connection rejected. Central not allowed.");
      BLE.disconnect();
    }
  }
}
