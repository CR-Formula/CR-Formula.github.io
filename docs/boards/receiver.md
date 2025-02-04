---
title: Receiver
parent: Boards
nav_order: 2
---

# Receiver Board
This board is designed to receive wireless data from the mainboard on the car and pass it over USB to a host device running *Front-Row*. The board gets power over the USB interface from the host device and formats the incoming data into CSV format in order for the host device to log the data correctly. This board formfactor and layout allows for the whole system to fit into a flash drive like formfactor.

# Hardware Selection
### STM32F04
This MCU was selected for its small footprint, low power requirements, and on chip peripherals. The MCU provides a SPI bus for interfacing with the LoRa Transceiver, a direct USB interface for connecting with a host device, and GPIO pins to connect interrupts and control status LEDs.

### RFM95W
The RFM95W is used for receiving LoRa packets.

# Hardware Design

### Schematics
Add images and talk about schematics

### Layout
Talk about layout challenges and how signal integrity was taken into account

# Firmware Design

### Peripheral Drivers
All of the peripheral drivers have been designed using ARM's CMSIS headers. This allows for much more readable and reusable code.

##### SPI

##### USB

### Device Drivers
LoRa

### ISR Design

# Results

## References
<p style="margin-left: 0.5in; text-indent: -0.5in;">
Brown, C. (2011). <em>Making Sense of Squiggly Lines: The Basic Analysis of Race Car Data Acquisition</em>. Christopher Brown Racing, 2011
</p>