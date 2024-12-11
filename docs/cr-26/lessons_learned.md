---
title: Lessons Learned
parent: CR-26
nav_order: 2
---

# Lessons Learned
This was the first year of the current Electrical subsystem and that came with many learning opportunities. The biggest issues with this system was caused by mounting and the custom antennas that were soldered onto the ESP32.

# Mounting
This version of the Telemetry system's mounting was a 3D printed box that the Arduino was mounted into, with the ESP32 and voltage divider just floating in the box above it. The box was then zip-tied to the front roll hoop. This worked for the limited amount of time that CR-26 was run, but is extremely susceptible to vibrations. The best fix for this is to mount all of the separate devices to a PCB, which provides solid contacts and a board that is more easily mountable.

# Antenna
For CR-26, the ESP32s that were used just had basic PCB antennas which we could not use due to them being mounted in the carbon fiber chassis. The solution to this was to cut the on board trace and solder on an appropriate length of wire to act as an antenna. All but one board that we did this to ultimately failed. The team believes this was due to drawing too much current for the larger antenna. The better way to solve this problem would be to source ESP32s that have u.Fl or SMA connectors and run the antennas that way.