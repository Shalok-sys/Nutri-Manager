from picamera2 import Picamera2
import numpy as np
import tensorflow as tf
import cv2
from bluepy import btle
import time
from collections import Counter
import time
import firebase_admin
from firebase_admin import credentials
from firebase_admin import db
from datetime import datetime


food_array = [
  "Burger", "Butter Naan", "Tea", "Chapati", "Chole Bhature", 
  "Dal Makhani", "Dhokla", "Fried Rice", "Idli", "Jalebi", 
  "Kaathi Rolls", "Kadai Paneer", "Kulfi", "Masala Dosa", 
  "Momos", "Paani Puri", "Pakode", "Pav Bhaji", "Pizza", "Samosa"
]

def send_data(class_val, wt):
    # Get the current time
    current_time = datetime.now()

    # Format the time as a string
    formatted_time = current_time.strftime("%Y-%m-%d %H:%M:%S")

    print("Current time:", formatted_time)
    ref = db.reference('/meals/' + '/'+formatted_time)# Data to be sent to Firebase
    data = {
        'food': food_array[class_val],
        'weight': wt,
        
    }# Sending data to Firebase
    ref.set(data)
    print('Data sent to Firebase successfully!')

sensor = 0
picam2 = None
classified_food = 20

def connect_and_read_ble(device_mac, sensor_characteristic_uuid, class_characteristic_uuid):
    global sensor, mode, classified_food
    load_threshold = 1
    weight_detected = False
    try:
        print(f"Connecting to {device_mac}...")
        device = btle.Peripheral(device_mac, btle.ADDR_TYPE_PUBLIC)
        print(f"Reading characteristics {sensor_characteristic_uuid}, {class_characteristic_uuid}")
       
        while True:
            sensor_characteristic = device.getCharacteristics(uuid=sensor_characteristic_uuid)[0]
            val = sensor_characteristic.read()
            sensor = int.from_bytes(val, byteorder='big', signed=True)
            print(f"Sensor signal: {sensor}")

            class_characteristic = device.getCharacteristics(uuid=class_characteristic_uuid)[0]

            if sensor > load_threshold and not weight_detected:
                weight_detected = True
                print(f"Weight Detected: {sensor}")
                classified_food = start_inference_loop(model_path="class_model_optm.tflite",max_predictions=50,cam=picam2)
                integer_val = classified_food
                bytes_val = int(integer_val).to_bytes(1, 'big')
                print(f"Writing {integer_val} to the characteristic...")
                class_characteristic.write(bytes_val, withResponse=True)
                send_data(integer_val, sensor)
            elif sensor < load_threshold and weight_detected:
                weight_detected = False
                
            integer_val = classified_food
            bytes_val = int(integer_val).to_bytes(1, 'big')
            print(f"Writing {integer_val} to the characteristic...")
            class_characteristic.write(bytes_val, withResponse=True)
            time.sleep(0.5)
            read_value = class_characteristic.read()
            print(f"Identified class (read): {read_value}")
            num = int.from_bytes(read_value, byteorder='big')
            print(f"Identified class as integer: {num}")
   
    except btle.BTLEException as e:
        print(f"Failed to write or read characteristic: {e}")
    except Exception as e:
        print(f"Failed to connect or read from {device_mac}: {str(e)}")
        device.disconnect()
        print("Disconnected")
    except KeyboardInterrupt:
        print("Disconnecting...")
        device.disconnect()
        print("Disconnected")

def load_model(model_path="class_model_optm.tflite"):
    interpreter = tf.lite.Interpreter(model_path=model_path)
    interpreter.allocate_tensors()
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    return interpreter, input_details, output_details

def preprocess_image(image):
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGRA2RGB)
    image_resized = cv2.resize(image_rgb, (224, 224))
    image_array = np.array(image_resized, dtype=np.float32) / 255.0
    input_array = np.expand_dims(image_array, axis=0)
    return input_array

def start_camera():
    try:
        time.sleep(1)
        picam2 = Picamera2()
        picam2.start()
        print("Camera initialized successfully.")
        return picam2
    except Exception as e:
        print(f"Error initializing the camera: {e}")
        return None

def run_inference(interpreter, input_details, output_details, frame):
    input_array = preprocess_image(frame)
    interpreter.set_tensor(input_details[0]['index'], input_array)
    interpreter.invoke()
    output = interpreter.get_tensor(output_details[0]['index'])
    predicted_class = np.argmax(output)
    return predicted_class

def start_inference_loop(model_path="class_model_optm.tflite", max_predictions=50, cam=None):
    global classified_food
    interpreter, input_details, output_details = load_model(model_path)
    predictions = []

    while len(predictions) < max_predictions:
        frame = cam.capture_array()
        if frame is None:
            print("Failed to grab frame")
            break

        predicted_class = run_inference(interpreter, input_details, output_details, frame)
        predictions.append(predicted_class)
       
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGRA2RGB)
        cv2.imshow('Camera Feed', frame_rgb)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    most_common_class, count = Counter(predictions).most_common(1)[0]
    print(f"Most frequent predicted class after {max_predictions} predictions: {most_common_class} (Predicted {count} times)")

    classified_food = most_common_class

    return most_common_class

if _name_ == "_main_":
    device_mac_address = "E0:5A:1B:7A:12:52"
    sensor_characteristic_uuid = "2A58"
    class_characteristic_uuid = "2A59"

    picam2 = start_camera()

    # Path to your Firebase credentials JSON file
    cred = credentials.Certificate('') Initialize the app with a service account, granting admin privileges
    firebase_admin.initialize_app(cred, {
        'databaseURL': ''
    })# Reference to your Firebase database

    while True:
        try: 
            connect_and_read_ble(device_mac_address, sensor_characteristic_uuid, class_characteristic_uuid)
            break;
        except KeyboardInterrupt:
            print("Exiting loop...")
            picam2.stop()
            cv2.destroyAllWindows()
            break;
