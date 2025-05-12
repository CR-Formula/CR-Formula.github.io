---
title: Receiver
parent: Boards
nav_order: 2
---

# Receiver Board
This board is designed to receive wireless data from the mainboard on the car and pass it over USB to a host device running *Front-Row*. The board gets power over the USB interface from the host device and formats the incoming data into CSV format in order for the host device to log the data correctly. This board formfactor and layout allows for the whole system to fit into a flash drive like formfactor.

# Hardware Selection
### STM32F04
This MCU was selected for its small footprint, low power requirements, and on chip peripherals. The MCU provides a SPI bus for interfacing with the LoRa Transceiver, a direct USB interface for connecting with a host device, and GPIO pins to connect interrupts and control status LEDs. This MCU also has a built in 48 MHz crystal that allows for the use of the USB peripheral without the need for an external crystal circuit.

### RFM95W
For the Real-Time wireless components of the system, the team selected the RFM95W LoRa transceiver. Some previous systems that the team has used have relied on this SOM and it has produced good results. The LoRa modulation allows for long range which is great for competitions and specific testing situations and can easily be updated to provide higher bitrates when more data is needed to be transferred. The module is based on the Semtech SX1276 LoRa chipset which is used in many other LoRa devices and Semtech provides well structured documentation for the hardware and digital interfaces. 

# Hardware Design

### Schematics
The schematic's first page is dedicated to a block diagram of how the internal devices on the board are connected. The following page contains the circuits for the board. This board is small and simple enough to just need one schematic page to show the circuit. 

### Layout
The layout for this board utilizes a 4-layer stack up with two internal ground planes for signal integrity. The top and bottom layers are used for signals with the bottom layer having a large 3.3v power pour for easy access to power. The 4-layer stack up allows for 50 ohm impedance matching for the RF trace for LoRa communication. The RF trace is via shieled and the whole board has via stitching to help reduce noise for the sensitive signals. The USB traces are set as a 90 ohm differential pair. The USB traces are kept short to promote good signal integrity.

# Firmware Design

### Peripheral Drivers
All of the peripheral drivers have been designed using ARM's CMSIS headers. This allows for much more readable and reusable code.

##### SPI
SPI communication is used to communicate with the on board LoRa transceiver. The peripheral is configured to run at 1 MHz in order to facilitate fast communication. Both `CPOL` and `CPHA` are set to `1` in order to match the requirements of the transceiver. The NSS pin is managed by the hardware in order to better manage the bus communication.

##### USB
The USB Driver is configured to use be a USB device and be connected to a host computer to send data in a CSV format. This simple interface allows for the use of the USB 2.0 standard and relies on ST's included USB driver middleware for this MCU family.

### Device Drivers
The RFM95W uses the SPI bus to configure the on device registers. The driver has helper functions setup to easily read and write to registers as well as setting the transceiver mode. The driver also supports interrupts to notify the host MCU when TX/RX completed. The driver also contains functions to easily change the radio configurations, supporting settings such as setting spreading factor, bandwidth, and transmit power.

# Bare Metal Processing
This system runs completely bare metal with no RTOS. This was selected as the processing this board performs is relatively simple and consists of checking packet IDs and moving the data into the correct struct as well as sending out a periodic message over USB to the host device. This creates a low overhead environment that is fast and efficient. 

# Results
This board is an efficient and small LoRa receiver that allows for easy use by any of the engineers on the team. The simple USB interface allows for a simple connection to the incoming wireless data. Overall this board works well and meets the requirements set for it very efficiently.

## References
<p style="margin-left: 0.5in; text-indent: -0.5in;">
Brown, C. (2011). <em>Making Sense of Squiggly Lines: The Basic Analysis of Race Car Data Acquisition</em>. Christopher Brown Racing, 2011
</p>