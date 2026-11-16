---
title: About the PCB Explorer
parent: Hardware
nav_order: 3.5
---

# PCB Explorer (3D)

The **[PCB Explorer]({{ '/pcb-explorer/' | relative_url }})** is an interactive 3D model of a small, realistic 4-layer board. It is built for people designing their first PCB. You can click on any part of the board, such as a trace, via, pad, silkscreen label, plane or component, to see what it's called, what it does, and the design rules of thumb that go with it.

**[Open the PCB Explorer →]({{ '/pcb-explorer/' | relative_url }})**

## What's in it

- **Learn**: a 13-step guided tour that builds the board up from the layer stackup to the mechanical details.
- **Techniques**: switch between good and bad layout choices and see the difference:
  - 45° vs. 90° trace corners
  - Decoupling capacitor placement (with the current-loop area drawn on the board)
  - Return current paths, with an animation of the return current detouring around a slot in the ground plane
  - Trace width for current, using an IPC-2221 calculator that redraws the VBUS trace
  - Thermal reliefs vs. solid plane connections
  - Differential pairs, crystal layout, thermal vias, ground stitching, silkscreen, test points/fiducials and stackup choice
- **Glossary**: about 60 PCB terms in plain language. Most are linked to the model, so clicking one highlights it on the board.
- **Layers**: show or hide each layer, explode the stackup, or slice the board with a cross-section view.
- **CAN Bus**, **I²C** and **Microcontroller (STM32F042K6)** modules: animated, step-by-step lessons on how the chips on the board talk to each other and how the microcontroller works. Each one links back to the matching parts of the 3D board.

You can link straight to a term by adding it after `#` in the URL, for example [`/pcb-explorer/#thermal-relief`]({{ '/pcb-explorer/#thermal-relief' | relative_url }}).

## The example board

The model is a made-up "dev board" built around parts the team uses all the time: an **STM32F042K6** microcontroller (LQFP-32, wired to its real pinout), a USB-C connector for 5 V power, a 3.3 V LDO in a SOT-223 package, a CAN transceiver with a termination resistor and screw terminal, an I²C temperature sensor with pull-ups, an SWD programming header, LEDs, test points, fiducials and M3 mounting holes. It uses a standard **Signal / GND / 3V3 / Signal** stackup.

On the STM32F042, CAN and USB share pins PA11/PA12. That's why the board uses USB for power only, which is a good example of why you plan pin assignments in STM32CubeMX first.

The copper and other thin layers are drawn thicker than they really are so you can see them. All other dimensions are realistic.

## Editing the explorer

The explorer is a static page in [`/pcb-explorer`](https://github.com/CR-Formula/CR-Formula.github.io/tree/main/pcb-explorer). It uses [three.js](https://threejs.org/), loaded from a CDN, so it has no build step.

| File | What it contains |
|------|------------------|
| `content.js` | The PCB text: glossary terms, techniques and tour steps. **Start here to add or fix explanations.** |
| `lessons/` | The CAN, I²C and microcontroller lesson modules (`can.js`, `i2c.js`, `mcu.js`), the lesson player (`engine.js`) and drawing helpers (`svg.js`) |
| `board.js` | The board layout (parts, traces, vias, planes) and the code that turns it into 3D geometry |
| `app.js` | Camera, clicking/highlighting, and the sidebar UI |
| `index.html` | Page layout and styles |

To try changes locally, serve the repository root with any static file server (for example `python3 -m http.server`) and open `http://localhost:8000/pcb-explorer/`.
