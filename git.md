---
title: Git
layout: home
nav_order: 3
---

# Git
Git is an open source version control software that allows for multiple engineers and developers to contribute to the same codebase at the same time. This is used by both the firmware and software teams to manage their codebases. It is also used extensively in industry and is very helpful to be familiar with. This page will go through basic installation and some of the key things to know in order to contribute to projects using Git. The [Git Reference Manual] is a very good resource for learning about Git features, this Wiki page provides a quick overview of important features used on the team.

# Installing Git
The build environment sections both have instructions that include installing Git. In order to just install git, you can follow the [git install instructions]. If there are any prompts that ask for settings, they can be left to default

# Cloning a Repo
Cloning with git is copying the code from a site like GitHub. To clone a repo, go to the repository's page on GitHub and click the green `<> Code` button. Copy the HTTPS link, this will be used to tell Git where to get the code from. Next, open a terminal (PowerShell or WSL) and navigate to where you want to clone the repository using `cd`. Finally, run the command `git clone <link to the repo> <folder name>`. If you want to clone to a new folder, enter that in the `<folder name>` or you can leave it blank and it will be the name of the repo.

# Commit and Push Code
A commit is a set of changes that have been made. The first step to creating a commit, is to add your files. This can be done by running `git add <path to the file>`. You can add all of your changes using `git add .`.  This will stage the changes in the commit. Once all the changes have been added, run `git commit -m <Commit Message>` and replace `<Commit Message>` with a descriptive title of what changes you made. A good commit message is important as it helps track when changes were made and go back find commits. Once `git commit` has run, the commit is stored on the local branch and will not show up in the repo on GitHub. The final step is pushing the commit to the remote branch, which can be done by running `git push`.

# Branches
When using Git, the code is managed in different branches. These branches are mostly used for engineers to push their changes without affecting the main code. The code on the branch `main` is the most up to date, fully functional version of the code. Engineers then make branches for each of the features that they are implementing. This allows them to push changes and debug code without breaking main. In order to switch branches, run the command `git checkout <name of branch>`. In order to list the branches that have been checked out in the past, run `git branch`. Finally, branches can be created by running the command `git branch <name of branch>`. This command will create the new branch from whatever branch is currently checked out.

# Submodules
Git submodules are Git repositories that are imported into other Git repositories. These are very useful when code is shared between multiple boards or platforms. For example, Git Submodules are used in the Charger Control, IMU, and Receiver repos. This is because they all use the same MCU, and thus have the same peripheral drivers. Device drivers that are used on multiple board platforms can also be made into submodules in order to easily include them. Git has a [wiki entry](https://git-scm.com/book/en/v2/Git-Tools-Submodules) that covers submodules and how to use them. The first time you checkout a repo with a submodule, run the command `git submodule update --init --recursive`. This will initialize the submodules in the repo. In order to update the submodule to the newest version, run the command `git submodule update --recursive --remote`.


[Git Reference Manual]: (https://git-scm.com/docs)
[git install instructions]: (https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)