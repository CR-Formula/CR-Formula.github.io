---
title: Telem Mainboard
parent: Boards
nav_order: 1
---

# Telem Mainboard
This board controls all of the sensor inputs and outputs on the car, as well as performing DSP on the sensor inputs. This board has an STM32F415 Microcontroller, U-Blox Neo-M9N GPS Module, RFM95W LoRa Transceiver, MicroSD Card slot, CAN and LIN transceivers, and voltage dividers to support 5V analog sensors. The boards main purpose is to collect data from the onboard sensors, perform some data processing, and both log the data locally and send it wirelessly in real-time. This board has soft real-time requirements as none of the functions on the board are mission critical. The book *Making Sense of Squiggly Lines* (Brown, 2011) was used as a reference for collecting Telemetry and setting system frequencies.

# Hardware Selection
### STM32F415
The STM32 platform was selected based on availability, CMSIS support, and community support. This allows engineers to find many resources that relate to the platform for both hardware and software. The F4 platform also strikes a balance between complexity and feature set. The engineers initially considered an H7 based platform but that was scraped to find a solution that fit our design more closely as well as allowed for a more approachable initial design. This platform also provides many great hardware features such as RTOS support, Watchdog Timers, DMAs, and an NVIC controller.

### Neo-M9N
Some of the most helpful data when testing a vehicle can come from a GPS. It can show speed data and be used to correlate times between drivers and sectors on a course. This system would not be complete without a GPS module. When selecting the GPS module, the requirements dictate that the navigation updates at a minimum of 25Hz (Brown, 2011) and provides at least position and speed data. The Neo-M9N became and immediate choice for the application. This SOM from U-Blox provides a well documented platform that is easy to design around from both a hardware and software standpoint. U-Blox provides detailed manuals for schematics, layout, and software interfaces.

### RFM95W
For the Real-Time wireless components of the system, the team selected the RFM95W LoRa transceiver. Some previous systems that the team has used have relied on this SOM and it has produced good results. The LoRa modulation allows for long range which is great for competitions and specific testing situations and can easily be updated to provide higher bitrates when more data is needed to be transferred. The module is based on the Semtech SX1276 LoRa chipset which is used in many other LoRa devices and Semtech provides well structured documentation for the hardware and digital interfaces. 

### CAN Transceiver
In order to communicate with the CAN bus, the MCU interfaces with the TI TCAN1042 CAN Transceiver. This component was selected as it is a small package, needs very few extra components, matches the data rate requirements, and has great documentation from the manufacturer.

# Hardware Design

### Schematics
The schematic's first page is dedicated to a block diagram of how the internal devices on the board are connected. The following pages are divided up into related circuits as to be able to locate devices and circuits easily. The schematics use global net names to connect devices across sheets and allows for clean connections between devices.

### Layout
The layout for this board deals with many different signal types and challenges. This board is a 4-layer stack up with two internal ground planes to help promote signal integrity. The outer top and bottom layers are dedicated to signals, with the bottom layer also having a large 3.3v power pour. This allows for easy routing of power and ground, as well as providing clean paths for all of the signals. There are two RF traces on the board, one for the GPS and another for LoRa. Both traces are kept as short as possible and impedance matched to 50 ohms to reduce the amount of noise. The RF traces also have appropriate via shielding and the modules have via stitching based on the wavelengths of the RF signals around them. Other considerations were made in trying to keep signals close to their connectors as well as using free space to keep traces apart. Each ADC has its own voltage divider as to add support for the 5v analog sensors that are used around the vehicle. The CAN traces are also placed as a differential pair which follows the CAN spec.

# Firmware Design

### Peripheral Drivers
All of the peripheral drivers have been designed using ARM's CMSIS headers. This allows for much more readable and reusable code.

##### ADC
The ADC is configured to oversample all of the analog signals processed by the MCU. This allows for many options for software filtering such as a Kalman Filter. The ADC utilizes one of the DMA channels to optimize the data flow from peripheral to memory. This allows for simplification of the firmware, allowing the values to be read directly from the data buffer.

##### SPI
SPI communication is used to communicate with the on board LoRa transceiver. The peripheral is configured to run at 1 MHz in order to facilitate fast communication. Both `CPOL` and `CPHA` are set to `1` in order to match the requirements of the transceiver. The NSS pin is managed by the hardware in order to better manage the bus communication.

##### I2C
The I2C peripheral is configured to be compatible with the GPS Module. It is configured to operate in master mode at a bus speed of 400 kHz and utilizes the external pull-up resistors.

##### CAN
The STM32 bxCAN peripheral utilizes the hardware filter to allow for efficient message processing in hardware. The driver is also setup to support RX Interrupts that can be passed to the RTOS task to avoid polling for new messages.

### Device Drivers
The mainboard has two main device drivers that it relies on, one for the Neo-M9N GPS and another for the LoRa RFM95W. Both of these devices get configured at startup and support their respective packet standards.

#### Neo-M9N Driver
The Neo-M9N uses the I2C peripheral to communicate with the device. The driver uses the VALSET UBX message standard to first configure the device to run at 25Hz, enable the Active Antenna that is supported by the hardware, and disable the unused NMEA messages. The driver also has a handful of helper functions to allow easy access to things like `getAvailableBytes`, `calcChecksum`, and `checkACK` to better manage UBX communication.

#### RFM95W Driver
The RFM95W uses the SPI bus to configure the on device registers. The driver has helper functions setup to easily read and write to registers as well as setting the transceiver mode. The driver also supports interrupts to notify the host MCU when TX/RX completed. The driver also contains functions to easily change the radio configurations, supporting settings such as setting spreading factor, bandwidth, and transmit power.

# RTOS Selection
The Mainboard use FreeRTOS to manage the different tasks as well as the priorities in order to meet the system deadlines. FreeRTOS is used because of it's extensive documentation as well as community support for the STM32 platform. ST even provides tools to setup FreeRTOS based projects for their MCUs.

## Task Design
Each task was assigned a priority based on the length of it's period (Shorter Period = Higher Priority). This helps avoid missing deadlines for important tasks. The periods for each task are based on the sampling rates for the signals that they collect. The signal polling rates are based on the sample rates laid out in *Making Sense of Squiggly Lines* (Brown, 2011).

### Status LED Task
The Status LED task is a very simple 1Hz task that blinks the status LED on the board. This allows users to quickly observe the status of the hardware without needing debuggers. This task also helps manage the watchdog timer to make sure the system has not gotten stuck in any of the other tasks.

### CAN_Task
The CAN task is sporadic task that is triggered based on the RX interrupt from the CAN peripheral. Once the interrupt is received, the task uses FreeRTOS Queues to transfer the incoming data packet to the task to be processed. The Task checks the payload based on the message ID and processes the data that the system needs and moves it to the respective data structs.

### GPS_Task
The GPS task is a periodic task that runs at a set 25 Hz. The task also manages booting and configuring the GPS module by enabling the device then waiting for it to start up. Once the device is booted, the task checks for the GPS lock to be valid. Once the lock is valid, The task will process the GNSS data and place it into the correct data structures for other tasks to use.

### ADC_Task
The ADC task is setup to periodically process data at a rate of 100Hz. This task handles the processing of the ADC data with limited use of decimation and allows for the use of Kalman filters in order to help filter the sensitive data.

### LoRa Tasks
Each LoRa task is setup to manage different packets based on the periodic rate of that packet. This allows for optimization of the limited data rate provided by LoRa. The LoRa Tasks rely on the use of a mutex lock to signal the other tasks when the packet has been completed.

### Collect Stats
The collect stats task is a selectively compiled period task that allows for monitoring of task states using the FreeRTOS built in task timers. This task is used during development to make sure that tasks are not missing deadlines or consuming more processor time than required.

# Results
This system is by far the most complex that Cyclone Racing as ever designed. This lead to many learning opportunities as well as lots of design time and mistakes. Overall the system works well and consistently, but has room for improvement in terms of long term reliability as well as some additional features such as local logging and more interrupt based communication as opposed to polling for signals. This board is a huge milestone for the team and has allowed for significantly more advanced data collection than previous systems.

## References
<p style="margin-left: 0.5in; text-indent: -0.5in;">
Brown, C. (2011). <em>Making Sense of Squiggly Lines: The Basic Analysis of Race Car Data Acquisition</em>. Christopher Brown Racing, 2011
</p>