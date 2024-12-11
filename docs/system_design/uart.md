---
title: UART
parent: System Design
nav_order: 1
---


# UART (Universal Asynchronous Receiver-Transmitter)

## Overview
UART (pronounced you-art) is a widely used serial communication protocol for simple and efficient point-to-point data transfer between two devices. It is commonly employed in embedded systems and electronics.

## Key Features

### Two-Wire Protocol
- Uses one line for transmission (**TX**) and one line for reception (**RX**), enabling **full-duplex** communication.

### Point-to-Point Communication
- Designed for direct communication between two devices.
- **Not expandable** to multiple devices.
    - Need two new wires and another UART peripheral

### Frame Structure
- Includes **start**, **stop**, and optional **parity bits** for error detection.
    - Can be configured by the MCU

### Speed and Performance
- **Baud rate** determines the transmission speed.
- General use speed is around **100 kbps**.
- Some devices support speeds up to **10 Mbps**.
    - Higher speeds used for different protocols

### Applications
- Supports **short runs off-board** communication.
- Commonly used for communication with devices like the **Nextion Display**.

### Considerations
- Simple setup but limited to point-to-point connections.
- Transmission quality is affected by noise and line length.

## Benefits
- Easy to implement with minimal wiring.
- Reliable for short-distance, low-speed communication.
