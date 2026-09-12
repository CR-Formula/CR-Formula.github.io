---
title: Dev Board Tutorial
parent: Firmware
nav_order: 3
---

# Development Board Tutorial

This is a quick tutorial showing how to get the **NUCLEO-F091RC** dev board configured and running.

## Prerequisites

You will need to install and configure the development tools before getting started (this may take a while). Instructions can be found on the [Build Environment](https://cr-formula.github.io/docs/firmware/build_environment.html) page.

## Setting Up the Project

Once everything is installed, open **STM32CubeMX** and click the `Access To Board Selector` button. In the top left search bar, look for the `NUCLEO-F091RC` board, and then double-click it in the Boards List. Select `Yes` when asked if you would like to initialize peripherals with defaults.

When the new project opens, you should now see the chip with pins highlighted in various colors. Typically, this is where you would manually configure everything for the board, but the development boards configure everything for you – how kind of them!

Anyways, it is time to save the project. While you can save it in the Windows file system, it may be more convenient to save it in WSL; otherwise, you will need to copy the generated project to WSL later anyways. To save the project from CubeMX:

- Navigate to `File` > `Save Project As...`
- In the Folder Name section, type `\\wsl.localhost\Ubuntu\home\<USERNAME>\Repositories\DevBoardTest`
    - The first time you do this, you will be navigating blind because the WSL folder structure is somewhat hidden. In the future, you should be able to navigate the menu to add new projects to the `Repositories` folder.

After saving the project, go to the `Project Manager` tab and change the Toolchain/IDE from `EWARM` to `Makefile`. Save the project again with `Ctrl + S`, then click `Generate Code` in the top right corner. The project should now be fully set up and ready to load into VSCode.

## Loading the Project in VSCode

Open **Visual Studio Code** and connect it to WSL by using the `><` icon in the bottom left corner of the window and selecting `Connect to WSL`. Once connected to WSL, open the project by navigating to `File` > `Open Folder` and then navigating to the folder where you saved the project. Click `OK` to open the project.

In order to compile and run programs later, we need launch instructions. Open the Explorer tab (first option on the left), right-click on an empty space in the explorer, select `New Folder...`, and name the folder `.vscode`. Inside, add a new file named `launch.json`, and paste the following inside:

<details markdown="1">
<summary>launch.json</summary>

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "ST-Link Debug",
            "cwd": "${workspaceFolder}",
            "preLaunchCommands": ["make -j8"],
            "executable": "${workspaceFolder}/build/${workspaceRootFolderName}.elf",
            "request": "launch",
            "type": "cortex-debug",
            "servertype": "stutil",
            "interface": "swd"
        },
        {
            "name": "ST-Link Attach",
            "cwd": "${workspaceFolder}",
            "executable": "${workspaceFolder}/build/${workspaceRootFolderName}.elf",
            "request": "attach",
            "type": "cortex-debug",
            "servertype": "stutil",
            "interface": "swd"
        },
    ]
}
```

</details>

## Programming the Development Board

Now, you will want to navigate to `Core/Src/main.c` in the Explorer tab; this is the entry point of the program. Scroll down to line 101 – this is inside of a while loop, which will run continuously after the board is initialized.

This is also a good time to connect your development board if you haven't already, and pass it to WSL (using **powershell**). If this is your first time connecting this device, you will need to run all three of the following commands; otherwise, only run the last command.

1. `usbipd list` - find the BUSID of the **ST-Link Debug** device
2. `usbipd bind --busid <BUSID>` - use the BUSID from step 1
3. `usbipd attach --busid <BUSID> --wsl` - need to run *each time* you reconnect the device

There are three main components/features of the board that we will use for this example: the **blue button**, the **green LED**, and **USART** (serial console).

### GPIO Pins

GPIO pins, such as the input from the button and output to the LED, are able to be read from and written to:

```cpp
// Read button input
GPIO_PinState buttonInput = HAL_GPIO_ReadPin(B1_GPIO_Port, B1_Pin);

// Write to LED
HAL_GPIO_WritePin(LD2_GPIO_Port, LD2_Pin, GPIO_PIN_SET);   // On
HAL_GPIO_WritePin(LD2_GPIO_Port, LD2_Pin, GPIO_PIN_RESET); // Off
```

### Delays

Code can be paused for a set amount of time:

```cpp
// Delay for 100 milliseconds
HAL_Delay(100);
```

### USART

Data can be sent to the Serial Monitor to be displayed to users:

```cpp
// Set up a string to send
uint8_t message[] = "Hello World!";

// Send the message
HAL_UART_Transmit(&huart2, message, sizeof(message), HAL_MAX_DELAY);
```

## Preface to the Examples

The following sections provide some different examples of simple ways to interact with the development board. As you implement the examples, try to change things around and see what happens. You won't break the board by writing code, so have fun and experiment!

Also, whatever you do, please **do not copy and paste the code examples**! Try to write them by hand, and try to predict what each line of code is going to do. The same goes for any AI-generated code development you do, now or in the future. The goal is to learn how to solve problems on your own.

## Example 1: Blinking LED

A simple way to test the functionality of the board is to blink the LED on and off. Let's do that!

In `main.c` at line 101, write the following four lines of code inside the user code comments:

```cpp
/* Infinite loop */
while (1)
{
  /* USER CODE BEGIN WHILE */
  HAL_GPIO_WritePin(LD2_GPIO_Port, LD2_Pin, GPIO_PIN_SET);
  HAL_Delay(500);
  HAL_GPIO_WritePin(LD2_GPIO_Port, LD2_Pin, GPIO_PIN_RESET);
  HAL_Delay(500);
  /* USER CODE END WHILE */
}
```

Run the program by pressing `F5` (or by clicking the green play button in the Run and Debug tab). The green LED in the middle of the board should start slowly blinking. Now, stop the debugging session by clicking the red stop button at the top of the window. Notice the LED will keep blinking even after stopping, since the program is still running internally on the board.

Try adjusting the values for the delays and re-running the program, and see what happens to the LED.

## Example 2: Button Input

Let's use the blue button on the board to control the LED. When the button is pressed, the light should turn on, and when it is released, the light should turn back off.

Rewrite the code inside the while loop to accomplish this:

```cpp
/* Infinite loop */
while (1)
{
  /* USER CODE BEGIN WHILE */
  GPIO_PinState buttonInput = HAL_GPIO_ReadPin(B1_GPIO_Port, B1_Pin);
  
  if (buttonInput == GPIO_PIN_SET) {
    HAL_GPIO_WritePin(LD2_GPIO_Port, LD2_Pin, GPIO_PIN_SET);
  }
  else {
    HAL_GPIO_WritePin(LD2_GPIO_Port, LD2_Pin, GPIO_PIN_RESET);
  }
  /* USER CODE END WHILE */
}
```

Run the code and test the blue button.

### Result

Do you notice a problem? The LED starts *on*, and turns *off* when the button is pressed! This is actually common for many buttons, and we can account for the "inverted" behavior of the button in the code. Try to implement this on your own.

<details markdown="1">
<summary>Solution</summary>

```cpp
/* Infinite loop */
while (1)
{
  /* USER CODE BEGIN WHILE */
  GPIO_PinState buttonInput = HAL_GPIO_ReadPin(B1_GPIO_Port, B1_Pin);
  
  if (buttonInput == GPIO_PIN_RESET) { // Change from "SET" to "RESET"
    HAL_GPIO_WritePin(LD2_GPIO_Port, LD2_Pin, GPIO_PIN_SET);
  }
  else {
    HAL_GPIO_WritePin(LD2_GPIO_Port, LD2_Pin, GPIO_PIN_RESET);
  }
  /* USER CODE END WHILE */
}
```

*Alternatively, you can change both LED outputs instead of changing the button condition.*

</details>

### More Concise Version

There is also a more convenient way to work with the `GPIO_PinState` type. Because `GPIO_PIN_RESET` is `0` and `GPIO_PIN_SET` is `1`, you can use the `!` (not) operator to invert its value (`!0 = 1` and `!1 = 0`). As a bonus challenge, try to rewrite the code with only one button read and one LED write.

<details markdown="1">
<summary>Solution</summary>

```cpp
/* Infinite loop */
while (1)
{
  /* USER CODE BEGIN WHILE */
  GPIO_PinState buttonInput = HAL_GPIO_ReadPin(B1_GPIO_Port, B1_Pin);
  HAL_GPIO_WritePin(LD2_GPIO_Port, LD2_Pin, !buttonInput);
  /* USER CODE END WHILE */
}
```

</details>

## Example 3: Hello World!

Usually, "Hello World!" is the first thing you try to implement as a programmer, but we'll save it for the last guided example instead. This example will use the Serial Monitor, so select that tab at the bottom of the screen (or go to `View` > `Open View...` > `Serial Monitor`) and click `Start Monitoring`.

Change the while loop to implement the following code:

```cpp
/* Infinite loop */
while (1)
{
  /* USER CODE BEGIN WHILE */
  uint8_t message[] = "Hello World!";
  HAL_UART_Transmit(&huart2, message, sizeof(message), HAL_MAX_DELAY);
  HAL_Delay(1000);
  /* USER CODE END WHILE */
}
```

Run the code. You should see the message print once per second in the Serial Monitor.

Feel free to play around with the message being sent. You can also manually enter the size as an integer to see what happens.

## Exercises

### Controlled Blink

Try to combine Example 1 and Example 2 to make an LED that only blinks when you hold the button.

### Cookie Clicker

Combine Example 2 and Example 3 to make a game that prints something when you press the button. As an added challenge, you can research the `snprintf()` function (add `#include <stdio.h>` to line 26) and try to print the player's score!
