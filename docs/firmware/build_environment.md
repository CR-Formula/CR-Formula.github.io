---
title: Build Environment 
parent: Firmware
nav_order: 1
---

# Dev and Build Tools

The Firmware for this system is developed in WSL using Arm compilers and Makefiles. To get started, follow the steps below.

## Note for Mac Users

The instructions for Mac are in some ways simpler than Windows, but they will follow a different process. Skip the **WSL** and **USBIPD** instructions, and instead follow the prompts for **STM32CubeMX** and **Visual Studio Code** (using alternate instructions when provided). Generally, any instructions here that reference WSL can be ignored.

## STM32CubeMX

Install [STM32CubeMX](https://www.st.com/en/development-tools/stm32cubemx.html) either by downloading as a guest or by signing up. This tool is often helpful for setting up pins, timers, and other features of a board before actually programming the logic.

## WSL (Windows Subsystem for Linux)

Install WSL by opening up a Powershell terminal and running the command `wsl --install -d Ubuntu`. This command will set up WSL using an Ubuntu Linux distribution. It will ask to create a username and password to complete the setup. When typing the password, no characters will appear, which is normal; just enter your password. Once installed, you can access the Ubuntu terminal by searching for Ubuntu in Windows, or it will be available in VSCode once the setup is complete.

## USBIPD

Install [usbipd](https://github.com/dorssel/usbipd-win/releases) from the releases page using the `.msi` file. See the **Passing a Device to WSL** section for usage instructions.

## Visual Studio Code

Install VSCode for Windows by going to the [VSCode download page](https://code.visualstudio.com/download) and select the correct package for your system. Follow the directions in the installer.

### Visual Studio Code WSL Extension

We will link VSCode to WSL using the [WSL Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-wsl). Navigate to the extensions tab on the left in VSCode and search for WSL. VSCode has [detailed instructions](https://code.visualstudio.com/docs/remote/wsl) on how to set this up and how to open a remote connection to WSL if you need additional help.

Once installed, open a WSL VSCode window by using the `><` icon in the bottom left corner of the window and selecting `Connect to WSL`.

### Visual Studio Code Setup

Next, we will install a series of build tools that are needed to compile the firmware. Open up a WSL terminal and run the following commands:

1. `sudo apt update`

2. `sudo apt upgrade`

3. `sudo apt install git make gcc-arm-none-eabi gdb-multiarch stlink-tools`

Here is a short explanation of each of these tools:

- **Git**: repository version control
- **Make**: a tool that helps manage software project compilation and building process.
- **GCC-Arm-none-eabi**: embedded Arm-specific build tools and compiler.
- **GDB-Multiarch**: adds support for microcontroller debugging
- **STLink-Tools**: ST-specific tools for developing and uploading embedded code

Also, while you're at it, open `/home/<USERNAME>/.bashrc` in a text editor and add `export MAKEFLAGS="-j$(nproc)"` to the end of the file. This will automatically use all cores during a build with the `make` command to speed things up.

### Other Visual Studio Code Extensions

There are some other extensions to install and configure in order to improve your experience while programming.

- [C/C++](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools) - Enables IntelliSense (code highlighting) for C
- [Cortex-Debug](https://marketplace.visualstudio.com/items?itemName=marus25.cortex-debug) - Helps compile and run projects
- [Makefile Tools](https://marketplace.visualstudio.com/items?itemName=ms-vscode.makefile-tools) - Helps with IntelliSense project structure
- [Serial Monitor](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-serial-monitor) - UART/USART output

### Important: Extension Configuration

These extensions must be configured properly to ensure they understand how to compile the project. Otherwise, false errors will appear everywhere (even though the project compiles correctly).

1. Open the Command Pallete with `Ctrl + Shift + P` (or navigate to `View` > `Command Pallete...`)

2. Search for `Preferences: Open Remote Settings (JSON) (WSL: Ubuntu)`

3. Add the following two lines to the JSON:
    ```json
    {
        "C_Cpp.default.compilerPath": "/usr/bin/arm-none-eabi-gcc",
        "cortex-debug.gdbPath": "/usr/bin/gdb-multiarch",
    }
    ```

## Building Code

In order to build the code, use Make and Makefiles. In the VSCode terminal for your project, run the command `make` in the terminal. This will build the code using the instructions in the Makefile. Make will only build files you change; if you would like to rebuild the whole project, run the command `make clean` before running `make`.

## Passing a Device to WSL

In order to use the WSL environment, you'll have to pass the target board/debugger into WSL. This involves using the usbipd tool that we installed earlier.

1. If you are on Windows, open up Powershell as an administrator and run `usbipd list`. This will list all of your current USB devices on your computer. Look for the STMircroelectronics device and note the BusID in the left column.

2. If you have never connected this board/debugger to WSL before, or if the ST Link device doesn't say Shared in the right column of the list, run the command `usbipd bind --busid <BUS_ID>` replace `<BUS_ID>` with the ID shown in the above list command. This will share the device to WSL.

3. Once the device is shared, you are able to attach it to WSL by running the command `usbipd attach --busid <BUS_ID> --wsl` again replacing `<BUS_ID>` with the ID of your device. To make sure that this command worked, you are able to open a WSL terminal and run the command `lsusb` which should now show the STMicroelectronics device.

## JLink Setup (Only needed if using a JLink Debugger)

The Segger JLink is an alternative hardware debugger to the STLink. These steps are only needed if using this debugger and not necessary for the STLink development flow.

1. Download the Linux DEB installer for the JLink software from [their website](https://www.segger.com/downloads/jlink/). Move this file into the WSL file system through file explorer or using the `cp` or `mv` command.

2. Once the installer is in the WSL filesystem, install it using the command `sudo dpkg -i <path/to/the/.deb_installer>` (Note: If there are missing dependencies you may have to run the command `sudo apt --fix-broken install`)

3. Once installed, add `export PATH="/opt/SEGGER/JLink:$PATH"` to the end of `~/.bashrc` and source the file using `source ~/.bashrc`. This will add the JLink software to the PATH variable.

4. When starting a new debug session, make sure to select the JLink debug configuration. See the `launch.json` file in the Telem repo for an example of the configuration.
