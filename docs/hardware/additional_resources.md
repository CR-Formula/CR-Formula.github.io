---
title: Additional Resources
parent: Hardware
nav_order: 7
---

# Additional Resources
This page collects outside articles, guides, and application notes that are useful for new electrical engineering students on the team. These aren't official Cyclone Racing documentation, but they're good supplementary reading for building up the background knowledge that hardware design draws on. They're organized by topic below.

## PCB Design

### **[Guide to PCB Terminology for Altium Designer](https://resources.altium.com/p/guide-to-pcb-terminology-for-altium-designer)**

A glossary-style guide, broken into sections (schematic terms, PCB terms, and more), that walks through the vocabulary you'll run into while designing PCBs in Altium. If terms like "footprint," "silkscreen," "copper pour," or "via" are unfamiliar, this is a good first stop before diving into the [PCB Design](pcb_design.md) page.

**Topics covered:**
- PCB layers and stackups
- Pads, vias, and traces
- Footprints and land patterns
- Silkscreen and copper pours/planes
- Design rules and general Altium terminology

### **[High Voltage PCB Design Guidelines and Materials](https://resources.pcb.cadence.com/blog/2024-high-voltage-pcb-design-guidelines-and-materials)**

An overview of what changes when you're laying out a PCB that carries high voltage instead of typical low-voltage digital/analog signals. Relevant for anyone working on the car's high-voltage system, since the spacing and material rules are much stricter than on a standard board.

**Topics covered:**
- Creepage and clearance distances
- Dielectric strength and PCB material selection
- Insulation coordination and spacing rules
- Thermal considerations for high-voltage boards
- Relevant industry standards

## Communication Protocols

### **[A Basic Guide to I2C](https://www.ti.com/lit/an/sbaa565/sbaa565.pdf)**

A Texas Instruments application note that introduces I2C, one of the most common protocols used to let a microcontroller talk to sensors and other small peripheral chips. It starts from the physical wiring and builds up to full read/write examples using real TI parts.

**Topics covered:**
- I2C physical layer (open-drain outputs, pull-up resistors)
- START/STOP conditions and data framing
- Reading and writing to real devices (a DAC and an ADC)
- Reserved addresses and 10-bit addressing
- Clock stretching and multi-controller arbitration
- Pull-up resistor value calculation

### **[Introduction to the Controller Area Network (CAN)](https://www.ti.com/lit/an/sloa101b/sloa101b.pdf)**

A Texas Instruments application note introducing CAN bus, the communication protocol used throughout the car for its electrical subsystems to talk to each other reliably in an electrically noisy environment. This is a must-read for understanding how the car's boards communicate.

**Topics covered:**
- The CAN standard and ISO-11898 physical layer
- Standard (11-bit) vs. Extended (29-bit) CAN identifiers
- CAN message/frame structure and arbitration
- Error checking and fault confinement
- CAN bus wiring and transceiver selection

### **[What is LoRa? A Beginner's Guide to Long-Range IoT Communication](https://medium.com/@samuelajala01/what-is-lora-a-beginners-guide-to-long-range-iot-communication-503bab08f17c)**

A beginner-friendly article explaining LoRa, a low-power wireless protocol built for sending small amounts of data over very long distances. Good background if you're curious about wireless sensor networks or telemetry outside the car's wired CAN network.

**Topics covered:**
- Chirp Spread Spectrum (CSS) modulation
- Spreading Factor and its range/speed/power tradeoffs
- Frequency bands and transmit power limits
- LoRa (the radio) vs. LoRaWAN (the protocol built on top of it)
- Gateways, network servers, and The Things Network (TTN)
- Real-world use cases and LoRa's limitations (low data rate, no delivery guarantee, small payload size)

## Power Electronics

### **[HEV/EV Traction Inverter Design Guide Using Isolated IGBT and SiC Gate Drivers](https://www.ti.com/lit/an/slua963b/slua963b.pdf)**

A Texas Instruments design guide focused on the traction inverter, the power electronics stage that drives the motor in an electric vehicle. It covers how isolated gate drivers are used to safely switch high-power IGBT and SiC transistors while protecting the system from faults. Useful reading for anyone getting into the car's high-voltage/motor control hardware.

**Topics covered:**
- HEV/EV powertrain and traction inverter system architecture
- Isolated gate driver ICs (galvanic isolation between control and power stages)
- Driving IGBT vs. SiC power transistors
- Protection features (overcurrent, desaturation detection, etc.)
- Fault monitoring and diagnostics
- Isolated bias supply design
