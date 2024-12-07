---
title: Build Environment 
parent: Software
nav_order: 1
---

## Dev and Build Tools
Front-Row is the core software you will be developing on.
A primary tool you will need to start developing is `git`.
NodeJS is another tool utilized and this installs the NodeJS runner which allows us to compile and run JavaScript code which in turn also allows us to develop with TypeScript. NodeJS also includes npm, a project package manager. Not all of our development is front-end though, for our backend development we will utilize Java.

### Installing `git`
Git allows a team of any size to cleanly collaborate on projects with source control. Creating branches allows multiple people to work in the same environment then merge their code into the `master` version of the project which should always be CI passing and functional. 

1. Go to the following [link](https://git-scm.com/downloads) and download `git` for your specific OS.

2. Follow the steps of the install wizard and proceed once complete

3. Opening a new command terminal run the following:

```
git -v
```
You should expect an output similar to the following: `git version x.xx.x`

### Install `NodeJS`
NodeJS will allow you to develop and run front-end applications while in the processing of writing code. It also gives us NPM which will allow us to easily add packages which impliment prebuilt components to ease the process of developing our own software.

1. Go to the following [link](https://nodejs.org/en/download/prebuilt-installer) and download NodeJS. Make sure to select your current OS and the latest version of NodeJS should do just fine.

2. Follow the steps of the install wizard (all default settings should do just fine) and proceed once complete.

3. Opening a new command terminal and run the following:

```
$ node -v
```
You should expect an output similar to the following: `v21.x.x`

In the same terminal run the following if you have the expected output: 

```
$ npm -v
```
You should expect an output similar to the following: `8.x.x`

### Installing `Java`

1. To utilize Java in the easiest way possible download [IntelliJ](https://www.jetbrains.com/idea/download/?section=windows). Cloning a repo and initializing it within IntelliJ as an existing project will import all settings.

    1a. You may need to create a license to do so create a JetBrains account with your `{netid}@iastate.edu` email and you should be given a free license. If you already have an account you can add your student email to it.

### Installing a Project

1. To ensure your ready for development head to the repository of the project you will be working on clone it:

```
$ git clone https://github.com/CR-Formula/{repository}.git
```

2. From here follow the steps outlined in the specific repository's Readme for any specific project requirements.

# Tips
1. Stack overflow is your best friend. If you encounter an issue it has been reached before and there is an answer. 

2. Development should be a clean process. If something looks ugly it probably isn't optimized or the best way of doing something.