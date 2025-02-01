---
title: RML Board
parent: Hardware
nav_order: 6
---

# Altium headaches
In my opinion, the hardest part of altium is when altium doesn't have the footprint or model for the component you want, so you have to import it. It's not that it's hard, it's just time consuming and sometimes what you want doesn't get imported in because computers are stupid.



# Board Overview
In general the board works by checking for a specific voltage range, once that voltage range is met a flashing LED turns on.

# Board Specifics
- **Voltage Divider**: Divides down our max high voltage of 600v to 60v per the rule set. 
- **Comparator**: Takes in the high voltage and compares it to a reference voltage. When the compared high voltage is higher than the reference voltage the comparator turns on and sends voltage to an optocupler.
- **Optocupler**: Takes in the voltage from the comparator, a reference voltage and inverts it. Meaning, when the comparator is high "ON" the optocupler is low "OFF". This signal goes to the NMOS.
- **NMOS**: Flips the voltage from the optocupler back to the original signal of the comparator and sends a signal through to an oscillator.
- **Oscillator**: It is taking the DC signal form the NMOS and oscillating it to ON and OFF. It send this signal to a P-Channel MOSFET (PMOS).
- **PMOS**: The PMOS takes the signal from the ocsillator and upregulates the current for the LED that it will be supplying, because the oscillator does not put out enough current. This signal gets sent to the LED.
- **Reference Voltage**: The reference voltage is supplied through the GLV system and is sent through a DC DC converter, this is ensure that we get 12v to the components and to isolate the two voltages. 