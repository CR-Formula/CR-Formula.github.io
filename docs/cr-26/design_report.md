---
title: Design Report
parent: CR-26
nav_order: 1
---

# CR-26
CR-26 Did not have a standalone design report, this page will cover the high level design of the system that was used on this car.


# Real-Time Telemetry
This is the first version of the Cyclone Racing Real Time Telemetry System. This system is built from an Arduino Uno and a Sparkfun CAN Shield, as well as an ESP-32 with a resistor voltage divider and custom antenna. All of the wireless data is processed on an ESP32 receiver and sent over a COM port to a host laptop running Telemetry Viewer. Telemetry Viewer is an open source software that takes CSV input, and graphs the data in real time. This also allows for data logging over the wireless connection. The team made some modifications to this program in order to add additional graph types and make it more usable.

# Sensor Data
The Arduino and CAN Shield allows the system to communicate with the ECU and parse CAN messages. This allows the system to process the data that the ECU has, filter for the data that we are interested in, and send the data to the ESP-32 for wireless transmission. The Arduino and ESP-32 are connected over a UART, which allows for low overhead and efficient communication. 

# Wireless
In order to communicate wirelessly, the system uses ESP-Now. This wireless protocol is a 2.4 GHz mix between WiFi and Bluetooth, made specially for ESP-32 applications. This protocol met our specifications in regards to packet size and throughput. The ESP-32 dev boards that are used have a built in PCB antenna, but this cannot be used as the boards are all mounted inside of the carbon fiber monocoque which reflects the wireless signals. To address this, the on board antenna trace is cut and a new wire antenna. The antenna is cut to length such that the exposed wire is the correct length for 2.4 GHz communication. 