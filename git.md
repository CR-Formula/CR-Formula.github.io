---
title: Git
layout: home
nav_order: 3
---

# Git
Git is an open source version control software that allows for multiple engineers and developers to contribute to the same codebase at the same time. This is used by both the firmware and software teams to manage their codebases. It is also used extensively in industry and is very helpful to be familiar with. This page will go through basic installation and some of the key things to know in order to contribute to projects using Git.

# Installing Git
The build environment sections both have instructions that include installing Git. In order to just install git, you can follow the [git install instructions]. If there are any prompts that ask for settings, they can be left to default

# Cloning a Repo
Cloning with git is copying the code from a site like GitHub. To clone a repo, go to the repository's page on GitHub and click the green `<> Code` button. Copy the HTTPS link, this will be used to tell Git where to get the code from. Next, open a terminal (PowerShell or WSL) and navigate to where you want to clone the repository using `cd`. Finally, run the command `git clone <link to the repo> <folder name>`. If you want to clone to a new folder, enter that in the `<folder name>` or you can leave it blank and it will be the name of the repo.

# Commit and Push Code

# Submodules
Git submodules are Git repositories that are imported into other Git repositories.



[git install instructions]: (https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)