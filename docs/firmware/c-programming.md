---
title: C Programming 
parent: Firmware
nav_order: 2
---

# C Programming Guide
This section will cover C specific programming tools that are used extensively in Embedded code. This will mainly be for things that are used in the codebase but not covered very much by normal course work or not covered until much later classes. This should be a good resource for members who are much newer to programing or members who are confused about some of the syntax in the code base.

# Variables
In embedded systems, variables should be defined in the [Extended Integral Types](https://www.geeksforgeeks.org/extended-integral-types-choosing-correct-integer-size-cc/) format, `uint8_t`, as opposed to just using the `int` type. This is because when using `uint8_t`, it is much more descriptive as to what data is being stored in the variable and is very beneficial for writing low level code. The variables types are:
- `uintN_t` - Unsigned N-bit Integer, N is a number from 8-64
- `intN_t` - Singed 16-bit Integer, N is a number from 8-64

# Preprocessor
The [C Preprocessor](https://www.geeksforgeeks.org/cc-preprocessors/) is a very powerful tool that can be used to make code more efficient and more readable by compiling constant values and hardcoding them in your executable file. The simplest thing in the preprocessor is macros. Macros are constant values that can be defined in your code, generally in header `.h` files. To define a macro, you use `#define macro`. You can give it a value or you can leave it blank and the value will be *True*. This can be used along with `#ifdef` and `#ifndef` to compile certain parts of the code only when certain macros are available or to only include header files if they have not already been included. The preprocessor is also able to define functions and perform conditionals, however these are not really used as much.

# Pointers
[Pointers](https://www.geeksforgeeks.org/c-pointers/) are variables that store where a variable is in memory, as opposed to the value of the variable. This is very useful when trying to pass large memory structures to a function. You are instead able to pass a pointer to the first value of the structure, and the length. This allows the program to instead just read the values from memory. This is much more efficient than passing all of the data back and forth. In order to declare a pointer, an `*` is put after the variable type: `uint8_t*`. You can get the memory address of a variable by using `&Var_Name`. When used to pass a variable to a function, the function looks like `void funct(uint8_t* ptr)` and the call to the function would be `func(&myVar)`. 

# Structs
[Structs](https://www.geeksforgeeks.org/structures-c/), or structures, are the basic C data structure. They are used to group variables together in memory and make referencing data sets much easier. They are also very helpful for representing data packets such as CAN frames. The data in a struct does not have to be of the same time. Structs can also be used to represent hardware in the form of handlers which contain pointers to hardware registers. An example of a struct is:
```
typedef struct {
    uint16_t id; // 11-bit ID
    uint8_t dlc; // Data Length Code
    CAN_RTR rtr; // Remote Transmission Request
    uint8_t data[8]; // Data Bytes
} CAN_Frame;
```

# Enums
In C, [Enums](https://www.geeksforgeeks.org/enumeration-enum-c/), or enumeration, can be thought of as custom variables. These variables are normally created to make code more readable and can be used to easily represent errors and system states. The Enum assigns each value a constant that is used by the compiler. One of the best uses for enums is as return types from functions. An example of an Enum is: 
```
typedef enum {
    CAN_OK,
    CAN_TX_Req,
    CAN_Error,
    CAN_Mailbox_Error,
    CAN_Fifo_Error
} CAN_Status;
```
This enum represents the return error for a CAN function. This is much more descriptive than just using integer values to represent different errors.