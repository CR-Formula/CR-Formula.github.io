---
title: Manufacturing Files
parent: Hardware
nav_order: 6
---

# Manufacturing Files
To order the PCBs and components, three different items must be created: Gerber Files, Drill Files, and a BOM (Bill of Materials) list on DigiKey. The Gerber and Drill files give the PCB manufacturer information on how the PCB design is produced, while the BOM is used by the business team to easily add the parts needed on DigiKey.

# Gerber and Drill Files
This [JLCPCB Guide](https://jlcpcb.com/help/article/How-to-export-Altium-PCB-to-gerber-files) shows how to export the Gerber and Drill files for JLCPCB. When exporting, the settings can mostly be left default. Once the Gerber and Drill files are exported, they need to be placed in the zip file. The zip file can be uploaded to JLCPCB where the settings for the board can be selected and the board can be ordered.

# BOM List
Altium generates an ActiveBOM for each board that is designed. In order to add it to the project, got to File > New > ActiveBOM. This creates the ActiveBOM and populates it with the components in the design. Open the ActiveBOM and click on Reports > Bill of Materials in the top left menu bar. This opens a window that allows the ActiveBOM to be exported to an Excel xlsx file. The next step requires a DigiKey account. Once the Excel file is exported, open DigiKey and create a public list from a file and upload the xlsx BOM. Once this is done, there may have to be a few extra parts added manually. Open the xlsx file and any parts with blank part numbers or no manufactures have to be added to the list manually as they were not in the Altium database.

Once these steps are completed, the board is ready to be ordered. Share the zip file and the link to the DigiKey list with the team lead to get the parts ordered.