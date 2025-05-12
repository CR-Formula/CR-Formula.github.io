---
title: IMU
parent: Boards
nav_order: 3
---

# IMU Board

# Hardware Selection
### STM32F04
This MCU was selected for its small footprint, low power requirements, and on chip peripherals. The MCU provides a SPI bus for interfacing with the LoRa Transceiver, a direct USB interface for connecting with a host device, and GPIO pins to connect interrupts and control status LEDs. This MCU also has a built in 48 MHz crystal that allows for the use of the USB peripheral without the need for an external crystal circuit.

### CAN Transceiver
In order to communicate with the CAN bus, the MCU interfaces with the TI TCAN1042 CAN Transceiver. This component was selected as it is a small package, needs very few extra components, matches the data rate requirements, and has great documentation from the manufacturer.

# Hardware Design

### Schematics
Add images and talk about schematics

### Layout
Talk about layout challenges and how signal integrity was taken into account

# Firmware Design

### Peripheral Drivers
All of the peripheral drivers have been designed using ARM's CMSIS headers. This allows for much more readable and reusable code.

##### CAN

##### I2C

#### Timers

### Device Drivers
IMU

### ISR Design

# Results

## References
<p style="margin-left: 0.5in; text-indent: -0.5in;">
Brown, C. (2011). <em>Making Sense of Squiggly Lines: The Basic Analysis of Race Car Data Acquisition</em>. Christopher Brown Racing, 2011
</p>