---
title: I2C
parent: System Design
nav_order: 3
---

# I²C (Inter-Integrated Circuit)

## Overview
I²C (pronounced eye-squared-see) is a widely used two-wire communication protocol for connecting multiple devices in embedded systems. It is commonly used for communication between microcontrollers and peripherals such as sensors, displays, and other integrated circuits.

## Key Features

### Two-Wire Protocol
- **SDA**: Serial Data.
- **SCL**: Serial Clock.
- One wire is dedicated to data, and the other to the clock, operating in **half-duplex** mode.

### Bus Protocol
- Uses **7-bit IDs** to address devices on the bus.
- Supports the attachment of multiple devices to the same bus.

### Multi-Master Capability
- Multiple devices can act as masters, allowing for flexible communication control.

### Acknowledgment Mechanism
- Each device acknowledges communication using **ACK** (Acknowledgment) or **NAK** (Not Acknowledged) signals.

### Speed and Performance
- Operates at speeds ranging from **100 kbps** to **3.4 Mbps**.
- Longer wires need lower speeds

### Applications
- Commonly used for **on-board communication** between devices.
- Frequently employed for communication with components like **GPS modules**.

### Considerations
- Sensitive to noise, requiring proper design and signal integrity measures.

## Benefits
- Minimal wiring for efficient communication.
- Allows multiple devices to share the same bus.
- Simple and low-cost implementation for short-range communication.
