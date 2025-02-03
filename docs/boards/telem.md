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

# Hardware Design

### Schematics
Add images and talk about schematics

### Layout
Talk about layout challenges and how signal integrity was taken into account

# Firmware Design

### Peripheral Drivers
All of the peripheral drivers have been designed using ARM's CMSIS headers. This allows for much more readable and reusable code.

##### ADC
Uses DMA, 16 Channel and sample rate
##### SPI
Used for LoRa, data frames and shared resource
##### I2C
Used for GPS, Bus speed and rise time issues
##### CAN
Used to communicate with ECUs and IMU board
##### SDIO
Used to log to SD Card, DMA?

### Device Drivers
Talk about driver design for LoRa and GPS

# RTOS Design
The Mainboard use FreeRTOS to manage the different tasks as well as the priorities in order to meet the system deadlines. FreeRTOS because of it's extensive documentation as well as community support for the STM32 platform. ST even provides tools to setup FreeRTOS based projects for their MCUs.

### Task Design
Talk about how the task priority was selected as well as period and how tasks were divided.

### Shared Resources
LoRa and how Mutex Locks or task notifications were used to share resources

# Results

## References
<p style="margin-left: 0.5in; text-indent: -0.5in;">
Brown, C. (2011). <em>Making Sense of Squiggly Lines: The Basic Analysis of Race Car Data Acquisition</em>. Christopher Brown Racing, 2011
</p>