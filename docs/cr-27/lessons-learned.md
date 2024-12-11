---
title: Lessons Learned
parent: CR-27
nav_order: 2
---

# Lessons Learned
CR-27 was a huge learning experience for the team. There were many mistakes made, but that meant we learned the most. Many of the things that we learned was based around the protocol usage and PCB design tips which are reflected in other wiki pages as well.

# Protocols
The Telemetry system on CR-27 attempted to add multiple sensors on an I2C bus at multiple points around the car. This would include brake temp sensors and a 9 axis IMU. The issue that arose from this was that due to the extremely long wires and extra electrical noise from the engine running, the system would not operate. This is because I2C should be used in on-board only communication. The better way to have implemented this would have been to use different sensors that support CAN or to have added CAN communication to the sensor boards. This allows for much more stable communication.

# PCB Design
This was the first year that the team attempted to design PCBs. There was a mainboard that connected all of the MCUs as well as the Arduino CAN Shield, a shift lights board, and brake temp sensors. The biggest issue with all of these boards was that none of them used ground planes. Ground Planes give the signals that are running around them a better reference point, which increases signal stability. This was a big miss as the lack of ground planes increased a lot of the signal integrity issues that we had negatively impacted almost every other part of the system. Other things learned were to make sure to read the data sheets for components. The Linear Voltage Regulators that were used on the mainboard didn't work as there was a lack of knowledge related to the input/output voltage relationship that would have been caught had we looked at the datasheet more. A lot of these issues could have been avoided if more time was spent looking at reference designs as well as consulting more online resources like YouTube videos.

# Cost Report
Make sure to look at how to report PCBs on the cost report. The team had missed the [guide posted by SAE] that covered how to report the PCBs correctly. This caused the team to lose a chunk of points in cost that should have easily been avoided.







[guide posted by SAE]: (https://www.fsaeonline.com/cdsweb/gen/DownloadDocument.aspx?DocumentID=9536ac5d-9473-4788-a018-1198afa0c0f5#%5B%7B%22num%22%3A44%2C%22gen%22%3A0%7D%2C%7B%22name%22%3A%22XYZ%22%7D%2C69%2C542%2C0%5D)