---
title: C Programming 
parent: Firmware
nav_order: 2
---

# C Programming Guide
This section will cover C specific programming tools that are used extensivly in Embedded code. This will mainly be for things that are used in the codebase but not covered very much by normal course work or not covered until much later classes. This should be a good resource for members who are much newer to programing or members who are confused about some of the syntax in the code base.

# Variables
In embedded systems, variables should be defined in the [Extended Integral Types] format, `uint8_t`, as opposed to just using the `int` type. This is because when using `uint8_t`, it is much more descriptive as to what data is being stored in the variable and is very beneficial for writing low level code. The variables types are:
- `uintN_t` - Unsigned N-bit Integer, N is a number from 8-64
- `intN_t` - Singed 16-bit Integer, N is a number from 8-64

# Pointers
[Pointers] are variables that store where a variable is in memory, as opposed to the value of the variable. This is very useful when trying to pass large memory structures to a function. You are instead able to pass a pointer to the first value of the structure, and the length. This allows the program to instead just read the values from memory. This is much more effecient than passing all of the data back and forth. In order to declare a pointer, an `*` is put after the variable type: `uint8_t*`. You can get the memory address of a variable by using `&Var_Name`. When used to pass a variable to a function, the function looks like `void funct(uint8_t* ptr)` and the call to the function would be `func(&myVar)`. 

# Structs
Structs are the basic C data structure. They are used to group variables together in memory and make referencing data sets much easier. They are also very helpful for represting data packets such as CAN frames.

# Enums
In C, Enums can be thought of as custom variables. These variables are normally created to make code more readable and can be used to easily represent errors and system states.



[Extended Integral Types]: (https://www.geeksforgeeks.org/extended-integral-types-choosing-correct-integer-size-cc/)
[Pointers]: (https://www.geeksforgeeks.org/c-pointers/)