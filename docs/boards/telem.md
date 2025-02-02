---
title: Telem Mainboard
parent: Boards
nav_order: 1
---

# Telem Mainboard
This board controls all of the sensor inputs and outputs on the car, as well as performing DSP on the sensor inputs. This board has an STM32F415 Microcontroller, U-Blox Neo-M9N GPS Module, RFM95W LoRa Transceiver, MicroSD Card slot, and voltage dividers to support 5V analog sensors. The boards main purpose is to collect data from the onboard sensors, perform some data processing, and both log the data locally and send it wirelessly in real-time. This board has soft real-time requirements as none of the functions on the board are mission critical.

# Hardware Selection
### STM32F415
The STM32 platform was selected based on availability, CMSIS support, and community support. This allows engineers to find many resources that relate to the platform for both hardware and software. The F4 platform also strikes a balance between complexity and feature set. The engineers initially considered an H7 based platform but that was scraped to find a solution that fit our design more closely as well as allowed for a more approachable initial design.

### Neo-M9N
Talk about design requirements as well as support/availability

### RFM95W
Used in the past and have a few to test with. Large community support for SX1276 based modules

# Hardware Design

### Schematics
Add images and talk about schematics

### Layout
Talk about layout challenges and how signal integrity was taken into account

# Firmware Design

### Peripheral Drivers
Talk about the design of Low Level drivers

### Device Drivers
Talk about driver design for LoRa and GPS

# RTOS Design
The Mainboard use FreeRTOS to manage the different tasks as well as the priorities in order to meet the system deadlines. FreeRTOS because of it's extensive documentation as well as community support for the STM32 platform. ST even provides tools to setup FreeRTOS based projects for their MCUs.

### Task Design
Talk about how the task priority was selected as well as period and how tasks were divided.

### Shared Resources
LoRa and how Mutex Locks or task notifications were used to share resources

# Results