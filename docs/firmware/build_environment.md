---
title: Build Environment 
parent: Firmware
nav_order: 1
---

## Dev and Build Tools
The Firmware for this system is developed in WSL using Arm compilers and Makefiles. To get started, follow the steps below.

1. Install WSL by opening up a Powershell terminal and running the command `wsl --install -d Ubuntu`. This command will set up WSL using an Ubuntu Linux distribution. It will ask to create a username and password to complete the setup. When typing the password, no characters will appear, which is normal; just enter your password. Once installed, you can access the Ubuntu terminal by searching for Ubuntu in Windows, or it will be available in VSCode once the setup is complete.

2. Install [usbipd](https://github.com/dorssel/usbipd-win/releases) from the releases page using the .msi file.

3. Install VSCode for Windows by going to the [VSCode download page](https://code.visualstudio.com/download) and select the correct package for your system. Follow the directions in the installer.

4. Next, we will link VSCode to WSL using the [WSL Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-wsl). Navigate to the extensions tab in VSCode and search for WSL. VSCode has [detailed instructions](https://code.visualstudio.com/docs/remote/wsl) on how to set this up and how to open a remote connection to WSL.

5. Next, we will install a series of build tools that are needed to compile the firmware. Open up a WSL terminal and run the following commands:
`sudo apt update`
`sudo apt upgrade`
`sudo apt install git make gcc-arm-none-eabi gdb-multiarch stlink-tools`
Here is a short explanation of each of these tools:
    - Git: repository version control
    - Make: a tool that helps manage software project compilation and building process.
    - GCC-Arm-none-eabi: embedded Arm-specific build tools and compiler.
    - GDB-Multiarch: adds support for microcontroller debugging
    - STLink-Tools: ST-specific tools for developing and uploading embedded code
6. Finally, we are ready to clone the repository. Go to the repository that you will be working on in GitHub. There is a large green `code` button near the top; click the dropdown arrow next to it and copy the HTTPS. Open a WSL terminal, you can do this by connecting VSCode to a WSL session or just searching WSL in the windows search. Run these commands to clone the repository
    - `cd` -- Make sure you are in the Linux home directory (folder)
    - `mkdir formula` -- this will make a folder called formula
    - `cd formula` -- this changes your current directory to the new `formula` folder
    - `git clone <paste-link-from-step-6>` -- You have to press `ctrl + shift + v` to paste in the terminal; this command actually downloads the repo
    - `ls` -- You should see the contents of the git repo in your folder; this command lists the items in the current folder
7. Once you have cloned the repo, you can run the command `code ./` in the top level of the repository. This will open the repository in VSCode. Once you are in VSCode, a few notifications will appear in the bottom right corner. The only one that is crucial is installing the recommended extensions.

### JLink Setup (Only needed if using a JLink Debugger)
The Segger JLink is an alternative hardware debugger to the STLink. These steps are only needed if using this debugger and not necessary for the STLink development flow.
1. Download the Linux DEB installer for the JLink software from [their website](https://www.segger.com/downloads/jlink/). Move this file into the WSL file system through file explorer or using the `cp` or `mv` command.
2. Once the installer is in the WSL filesystem, install it using the command `sudo dpkg -i <path/to/the/.deb_installer>` (Note: If there are missing dependencies you may have to run the command `sudo apt --fix-broken install`)
3. Once installed, add `export PATH="/opt/SEGGER/JLink:$PATH"` to the end of `~/.bashrc` and source the file using `source ~/.bashrc`. This will add the JLink software to the PATH variable.
4. When starting a new debug session, make sure to select the JLink debug configuration. See the `launch.json` file in the Telem repo for an example of the configuration.

### Optional Extra Tips and Tricks
1. Add `export MAKEFLAGS="-j$(nproc)"` to the end of your `.bashrc`. This will automatically use all cores during a build with the `make` command.

Once you've completed these steps, you can start building and developing firmware. The best place to start will be the Microcontroller Reference Manual. Read through the section about the peripheral you are trying to work with.

## Building code
In order to build the code, use Make and Makefiles. Open up an Ubuntu terminal and navigate to the project directory. Next, run the command `make` in the terminal. This will build the code using the instructions in the Makefile. Make will only build files you change; if you would like to rebuild the whole project, run the command `make clean` before running `make`.

## Passing a Device to WSL
In order to use the WSL environment, you'll have to pass the target board/debugger into WSL. This involves using the usbipd tool that we installed earlier.

1. If you are on Windows, open up Powershell as an administrator and run `usbipd list`. This will list all of your current USB devices on your computer. Look for the STMircroelectronics device and note the BusID in the left column.

2. If you have never connected this board/debugger to WSL before, or if the ST Link device doesn't say Shared in the right column of the list, run the command `usbipd bind --busid <BUS_ID>` replace `<BUS_ID>` with the ID shown in the above list command. This will share the device to WSL.

3. Once the device is shared, you are able to attach it to WSL by running the command `usbipd attach --busid <BUS_ID> --wsl` again replacing `<BUS_ID>` with the ID of your device. To make sure that this command worked, you are able to open a WSL terminal and run the command `lsusb` which should now show the STMicroelectronics device.

## Uploading and Debugging the Code

# Tips
1. You can open a WSL terminal by searching for Ubuntu or WSL in windows search
2. To easily open VSCode in WSL, you can cd into your repository in WSL, then type `code ./` to open a remote connection