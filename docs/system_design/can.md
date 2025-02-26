---
title: CAN
parent: System Design
nav_order: 5
---

# CAN (Controller Area Network)

## Overview
CAN (pronounced "can") is a robust communication protocol commonly used in automotive and industrial applications. It enables efficient communication between various Electronic Control Units (ECUs) within a system.

## Key Features

### Two-Wire Protocol
- Utilizes **CAN high** and **CAN low** wires.
- Operates in **half-duplex** mode.
- Uses twisted pair wires

### Differential Bus Protocol
- Each message has a unique 11-bit **ID**.
    - Each node filters for messages based on IDs
- Supports attachment of multiple nodes or endpoints.
  - Each node is attached to the same pair of wires.
- **Differential signaling** ensures:
  - High and low signals are the inverse of each other and add to 5v.
  - Enhanced **signal integrity** in noisy environments.

### Expandability and Architecture
- Easily expandable with support for **multiple nodes**.
- Operates as a **multi-master** system, allowing multiple controllers to initiate communication.

### Speed and Performance
- **CAN 2.0** supports a maximum speed of **1 Mbps**.

### Applications
- Commonly used for **off-board communication**.
- Facilitates communication between **Electronic Control Units (ECUs)** in vehicles.

## Benefits
- High reliability in challenging environments.
- Efficient and scalable design for complex networks.
