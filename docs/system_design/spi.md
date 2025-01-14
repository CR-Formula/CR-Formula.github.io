---
title: SPI
parent: System Design
nav_order: 3
---


# SPI (Serial Peripheral Interface)

## Overview
SPI (pronounced "spy") is a widely used synchronous serial communication protocol, designed for high-speed data exchange between a master device and one or more slave devices.

## Key Features

### Four-Wire Protocol
- **MISO**: Master In Slave Out.
- **MOSI**: Master Out Slave In.
- **SCLK**: Serial Clock.
- **CS**: Chip Select (used to select a specific slave device).
- Operates in **full-duplex** mode, allowing simultaneous data transmission and reception.

### Bus Protocol
- Uses the **CS pin** to select the desired slave device.
    - Pulls the pin low to select a slave
- Capable of attaching multiple slave devices, where **each device requires a unique CS pin**.
- **Polarity** and **Phase** of the signals can be configured by the host

### Architecture
- **Single master** configuration:
  - Only one device can control the communication bus at a time.
  - All communication is initiated by the master device.

### Speed and Performance
- Supports a maximum speed of approximately **8 Mbps**.
- Master defines speeds of data transfer

### Applications
- Primarily used for **on-board communication** between components.
- Commonly used for communication with peripherals like the **LoRa Module**.

## Benefits
- High-speed and efficient data transfer.
- Simple hardware interface requiring minimal wires.
- Suitable for short-distance communication within a single board.

## Drawbacks
- Need an additional wire for each device
- Can be sensitive to noise