---
title: Interactive PCB Learning Module
nav_order: 5.5
---

# Interactive PCB Learning Module
{: .no_toc }

The **PCB Explorer** is an interactive 3D model of a small 4-layer circuit board, made for people designing their first PCB. Click any trace, via, pad, plane, label or component to learn what it's called and why it's there. You can also take a guided tour, compare good and bad layout techniques, search the glossary, and pull the layers apart or slice through the board.

This page explains how to use it online, how to download it and run it on your own computer (with or without internet), and how to fix common problems.

<details open markdown="block">
  <summary>Contents</summary>
  {: .text-delta }
- TOC
{:toc}
</details>

---

## Option 1: Use it online (no download)

The easiest way is to open it in your browser:

**[Open the PCB Explorer →]({{ '/pcb-explorer/' | relative_url }})**

You can also open it from the **PCB Explorer** link at the bottom of the left sidebar on any wiki page.

---

## What you need

| | Requirement |
|---|---|
| **Browser** | A recent desktop version of Chrome, Edge, Firefox or Safari. Phones and tablets work, but a mouse makes the 3D controls much easier. |
| **Graphics** | WebGL must be enabled (it is by default in all modern browsers). Any laptop from the last ~8 years is fine. |
| **To run it locally** | [Git](https://git-scm.com/downloads) (optional) and **one** of: [Python 3](https://www.python.org/downloads/), [Node.js](https://nodejs.org/), or [VS Code](https://code.visualstudio.com/) with the *Live Server* extension. |
| **Internet** | Needed by default, because the 3D library (three.js) loads from a CDN. See [running fully offline](#option-3-run-fully-offline) to remove this. |

The module is just static files (HTML and JavaScript). There is nothing to install or compile.

---

## Option 2: Download and run it locally

### Step 1: Download the files

The program lives in the [`pcb-explorer`](https://github.com/CR-Formula/CR-Formula.github.io/tree/main/pcb-explorer) folder of the wiki repository. It contains four files:

| File | Contents |
|------|----------|
| `index.html` | The page layout and styles |
| `app.js` | Camera controls, clicking/highlighting and the sidebar |
| `board.js` | The board design and the code that builds the 3D model |
| `content.js` | All the text: glossary terms, techniques and tour steps |

Pick **one** way to download them.

**A. Clone the whole wiki with Git** (recommended if you want to make changes):

```bash
git clone https://github.com/CR-Formula/CR-Formula.github.io.git
cd CR-Formula.github.io
```

**B. Download only the `pcb-explorer` folder with Git** (sparse checkout):

```bash
git clone --depth 1 --filter=blob:none --sparse https://github.com/CR-Formula/CR-Formula.github.io.git
cd CR-Formula.github.io
git sparse-checkout set pcb-explorer
```

**C. Download a ZIP (no Git needed):**

1. Go to the [repository on GitHub](https://github.com/CR-Formula/CR-Formula.github.io).
2. Click the green **Code** button, then **Download ZIP**.
3. Unzip it anywhere. The program is in the `pcb-explorer` folder inside.

### Step 2: Start a local web server

{: .warning }
> Double-clicking `index.html` **will not work**: you'll get a blank grey area where the 3D board should be. Browsers block JavaScript modules on pages opened straight from a file (`file://`), so the folder has to be served by a small local web server. Any of the options below works.

Open a terminal **in the folder that contains `pcb-explorer`**. That's the repository folder for options A, B and C. Then run one of these:

**Python** (pre-installed on macOS and most Linux; on Windows install it from [python.org](https://www.python.org/downloads/)):

```bash
python3 -m http.server 8000
```

On Windows, use `py -m http.server 8000` (or `python -m http.server 8000`).

**Node.js:**

```bash
npx http-server -p 8000
```

The first time, it will ask to install `http-server`. Type `y`.

**VS Code:** install the **Live Server** extension, open the repository folder, right-click `pcb-explorer/index.html` and choose **Open with Live Server**. It opens the page for you, so you can skip step 3.

### Step 3: Open it in your browser

Go to:

```
http://localhost:8000/pcb-explorer/
```

The 3D board should appear within a few seconds. Leave the terminal open while you use it. Press **Ctrl + C** in the terminal to stop the server when you're done.

{: .note }
> If you only downloaded the `pcb-explorer` folder by itself (not inside the repository), start the server *inside* that folder and open `http://localhost:8000/` instead. The "← CR Formula Wiki" and "PCB Design guide" links in the page header won't work in that case, but everything else will.

---

## Option 3: Run fully offline

By default the page downloads the three.js 3D library from `cdn.jsdelivr.net` each time it loads. To use the module with no internet connection, for example at a competition or in a lab, download a copy of three.js once and point the page at it.

**1. Download three.js version 0.160.0 into `pcb-explorer/vendor/three`.** This needs [Node.js](https://nodejs.org/) for the download step only. Run these from inside the `pcb-explorer` folder:

```bash
mkdir vendor
npm pack three@0.160.0
tar -xzf three-0.160.0.tgz -C vendor
```

Then rename the extracted folder and delete the archive:

macOS / Linux:

```bash
mv vendor/package vendor/three
rm three-0.160.0.tgz
```

Windows (PowerShell):

```powershell
Rename-Item vendor\package three
Remove-Item three-0.160.0.tgz
```

Without Node.js, you can download the release ZIP for **r160** from the [three.js releases page](https://github.com/mrdoob/three.js/releases/tag/r160) instead, unzip it, and rename the folder to `vendor/three`. It must contain `build/three.module.js` and `examples/jsm/`.

**2. Edit `pcb-explorer/index.html`.** Find the `importmap` block near the top and replace the two CDN URLs with the local paths:

```html
<script type="importmap">
{
  "imports": {
    "three": "./vendor/three/build/three.module.js",
    "three/addons/": "./vendor/three/examples/jsm/"
  }
}
</script>
```

**3. Start a local server and open the page** exactly as in [Option 2, steps 2–3](#step-2-start-a-local-web-server). It now works with no internet connection.

{: .warning }
> Use version **0.160.0** exactly. Other versions of three.js may not work with this code. Don't commit the `vendor` folder back to the repository: it's about 30 MB and the live site uses the CDN.

---

## How to use it

| Action | Mouse / trackpad | Touch screen |
|--------|------------------|--------------|
| Rotate the board | Left-drag | One-finger drag |
| Zoom | Scroll wheel / pinch | Pinch |
| Pan (move sideways) | Right-drag (or Shift + drag) | Two-finger drag |
| Learn about something | Click it | Tap it |
| Close the info panel | **Esc** or the × button | × button |

The sidebar has four tabs:

- **Learn**: a 13-step guided tour of how a PCB is built. Start here if you're new.
- **Techniques**: design techniques with a good/bad switch, e.g. decoupling capacitor placement, return current paths, thermal reliefs, trace corners, and a trace-width calculator.
- **Glossary**: about 60 PCB terms in plain language. Terms tagged **3D** highlight on the board when clicked.
- **Layers**: show or hide each layer, pull the stackup apart, or turn on the cross-section view.

The toolbar at the top right switches between the 3D, Top, Bottom and Edge views. The **Explode layers** slider at the bottom separates the layers.

You can link someone straight to a term by adding its name after `#` in the address, e.g. [`/pcb-explorer/#thermal-relief`]({{ '/pcb-explorer/#thermal-relief' | relative_url }}) or [`/pcb-explorer/#via`]({{ '/pcb-explorer/#via' | relative_url }}).

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Grey/empty area where the board should be, after double-clicking `index.html` | You opened it as a file. Use a local server ([Option 2, step 2](#step-2-start-a-local-web-server)). |
| Empty area even when using a server | You're probably offline, or a network/firewall blocks `cdn.jsdelivr.net`. Connect to the internet or set up [offline mode](#option-3-run-fully-offline). Press **F12** and check the *Console* tab for errors. |
| "Your browser could not start WebGL" | Update your browser and graphics drivers. In Chrome or Edge, make sure *Settings → System → Use graphics acceleration when available* is on. |
| `python3` / `python` is not recognized | Install Python from [python.org](https://www.python.org/downloads/) (tick **Add python.exe to PATH** on Windows), or use the Node.js or VS Code option instead. |
| `Address already in use` / port 8000 busy | Use a different port, e.g. `python3 -m http.server 8080`, then open `http://localhost:8080/pcb-explorer/`. |
| 404 / "File not found" in the browser | The server was started in the wrong folder. Start it in the folder that *contains* `pcb-explorer` and include `/pcb-explorer/` in the address. |
| Old version still shows after updating the files | Hard-refresh the page with **Ctrl + Shift + R** (**Cmd + Shift + R** on Mac). |
| Very slow / laggy | Close other 3D-heavy tabs, make the window smaller, or use a computer with hardware graphics acceleration enabled. |

---

## Updating your copy

If you cloned with Git (options A or B), get the latest version with:

```bash
git pull
```

If you downloaded a ZIP, download a new ZIP and replace your old folder. If you set up offline mode, redo step 2 of [Option 3](#option-3-run-fully-offline), because the `index.html` edit gets overwritten.

---

## Editing or adding content

Most changes only need `pcb-explorer/content.js`. It's plain text inside JavaScript objects:

- **Glossary terms** are in `TERMS`. Each has a `name`, a category (`cat`), a one-line `short` definition, an HTML `body`, a list of `tips`, and `related` term IDs.
- **Design techniques** are in `TECHNIQUES`. Each has the camera `view`, the terms to highlight, and the text.
- **Tour steps** are in `TOUR`.

To change the board itself (parts, traces, vias, planes), edit the `layout()` function in `board.js`. Coordinates are in millimetres, with the board centred at (0, 0).

To test your changes, run a local server as described in [Option 2](#option-2-download-and-run-it-locally) and refresh the page. Then open a pull request following the steps on the [Git]({{ '/git.html' | relative_url }}) page. See [About the PCB Explorer]({{ '/docs/hardware/pcb_explorer.html' | relative_url }}) for more background.
