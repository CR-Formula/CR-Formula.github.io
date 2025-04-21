---
title: Debugging
parent: Firmware
nav_order: 3
---

## Setting up the hardware
When uploading and debugging code, the test board needs to be powered on using an external power source and a DC power supply as well as connected to the host device (device used to build and upload code). In order to connect to the board, the use of an STLink debugger is required. This device allows the `.elf` file that is generated when using the `make` command to be upload to the board as well as starting a debug session that allows to set breakpoints and step through the running code one line at a time. The STLink connects to the test board using the gray SWD ribbon cable and the host machine using a micro USB cable. 

## Configuring MCU Options (STM32F04x based boards)
Some of the STM32F04x based boards require an extra one time step before uploading and debugging code. This is because the boot option for the board gets set in software as opposed to using the hardware boot0 pin. 
1. In order to update the boot location, [download the STM32CubeProgrammer](https://www.st.com/en/development-tools/stm32cubeprog.html). 

2. Connect the board to the debugger, power on the board, and launch the program. The debugger will need to be attached to Windows instead of WSL so no need to pass it through with `usbipd`. 

3. Once the program launches, select the ST-Link from the drop down menu in the top right corner and then click the green connect button next to it. The settings under ST-LINK configuration should now be populated. 

4. Select the `OB` option on the far left column. This stands for Option Bytes and is where some of the persistent global system settings can be found. 

5. Select the `User Configuration` drop down and scroll down to find `nBOOT0` and `nBOOT1` options. Make sure that `nBOOT0` is checked and `nBOOT1` is unchecked. 

6. Scroll down a bit further and find the `BOOL_SEL` option and make sure that is unchecked as well. Once completed, the board can be flashed using the normal workflow. 

NOTE: This should only have to be done one time per board as these settings are persistent across flashes and resets.

## Uploading and Debugging Code
To debug and upload code, we use the Cortex-Debug extension which should have been installed during the build environment setup. This extension uses 2 configuration files in the `.vscode` folder: `settings.json` and `launch.json`. Basic versions of these files are provided in the repository and can be modified if needed but should work out of the box. You must build the code using the `make` command at least once before you attempt to use the Cortex-Debug configuration.
- `settings.json` has 3 important keys: `cortex-debug.armToolchainPath`, `cortex-debug.gdbPath`, and `cortex-debug.stutilPath`. All of these file paths are universal in WSL/Ubuntu and should be the same if you setup your dev environment by following the directions above.
- `launch.json` configures the debugging profile for Cortex-Debug. The default values in this file should also work well apart from two: `svdFile` and `device`. `svdFile` is the path to an SVD file for the microcontroller that you are using and SVD file tells the debugger what peripherals are at what memory addresses and allows for easier debugging. The device will need to match the microcontroller on whichever board you are debugging.

1. Once these files are configured, go to the run and debug window on the left column in VSCode (Looks like a play button with a bug) and you should see an option called Cortex Debug. With the Cortex Debug option selected, press the green play button.

2. This will create a debug menu at the top of the screen to control the debug session which gives you options such as step over, step into, and step out as well as reset and end session.

3. At the bottom of the left column, there is also a `xPeripherials` option. These are the register values of the device you are debugging and are very useful to find issues.

4. Finally, you are able to set breakpoints by clicking the red dot next to the line number you want to place the breakpoint at. This will stop the code while it is running so that you can look at the register values.