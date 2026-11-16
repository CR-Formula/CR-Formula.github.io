// Text content for the PCB Explorer: glossary terms, design techniques and the guided tour.
// Terms with matching objects in the 3D model can be highlighted; the rest are glossary-only.

export const CATEGORIES = ['Board structure', 'Copper features', 'Components & assembly', 'Design concepts', 'Files & manufacturing'];

export const TERMS = {
  // ------------------------------------------------------------ structure
  pcb: {
    name: 'Printed circuit board (PCB)', cat: 'Board structure',
    short: 'A laminated sandwich of copper and insulating layers that mechanically holds components and electrically connects them.',
    body: `<p>Instead of wires, a PCB uses flat copper shapes etched onto insulating sheets. Components are soldered to exposed copper pads and the copper patterns carry signals and power between them.</p>
<p>The board in this explorer is a typical small <b>4-layer</b> design: an <b>STM32F042K6</b> microcontroller, a USB-C connector for 5 V power, a 3.3 V regulator, a CAN bus transceiver, an I²C temperature sensor and a programming header.</p>
<p>Want to know how the chips talk to each other? Open the <b>CAN Bus</b>, <b>I²C</b> and <b>Microcontroller</b> modules from the top bar.</p>`,
    tips: ['Draw the schematic first, then lay out the board. The layout should follow the schematic, not the other way round.'],
    related: ['stackup', 'copper-layer', 'substrate'],
  },
  stackup: {
    name: 'Layer stackup', cat: 'Board structure',
    short: 'The order, material and thickness of every layer in the board, from top to bottom.',
    body: `<p>This board is a common 4-layer stackup, about <b>1.6 mm</b> thick in total:</p>
<ol><li><b>L1 – Top copper</b>: signals and component pads</li><li><b>L2 – Ground plane</b></li><li><b>L3 – Power plane</b> (3.3 V)</li><li><b>L4 – Bottom copper</b>: more signals</li></ol>
<p>Copper layers are separated by <b>prepreg</b> and a <b>core</b>. Solder mask and silkscreen are added on both outer faces.</p>
<p>Use the <b>Explode</b> slider to pull the layers apart.</p>`,
    tips: ['Signal–Ground–Power–Signal is the classic 4-layer stackup: every signal layer sits right next to a solid reference plane.',
      'A 2-layer board is cheaper but much harder to route cleanly. Going to 4 layers is often the easiest way to fix noise problems.',
      'Ask your fab house (e.g. JLCPCB) for their standard stackups. Picking one of theirs is cheaper and it tells you the dielectric thicknesses for impedance calculations.'],
    related: ['substrate', 'prepreg', 'copper-layer', 'ground-plane', 'power-plane'],
  },
  substrate: {
    name: 'Substrate / FR-4 core', cat: 'Board structure',
    short: 'The rigid insulating material at the centre of the board, normally FR-4 (woven fiberglass + epoxy).',
    body: `<p>The <b>core</b> is a rigid piece of cured FR-4 that comes from the factory with copper already bonded to both faces. On a 4-layer board the inner layers (L2 and L3 here) are etched from the core's copper.</p>
<p>FR-4 is cheap, strong and flame-retardant (the “FR”). For very high frequencies or high temperatures, other materials (Rogers, polyimide, aluminium-backed) are used.</p>`,
    tips: ['1.6 mm is the standard total thickness. Thinner boards (0.8 or 1.0 mm) bend more easily.'],
    related: ['prepreg', 'stackup'],
  },
  prepreg: {
    name: 'Prepreg', cat: 'Board structure',
    short: '“Pre-impregnated” fiberglass sheets with uncured epoxy, used to glue copper layers onto the core.',
    body: `<p>During lamination, heat and pressure melt and cure the prepreg, bonding the outer copper foils (L1 and L4) to the core. Electrically it is just another insulator, similar to FR-4.</p>
<p>Prepreg thickness sets the distance between an outer trace and the plane under it. That distance matters for <b>impedance</b> and for how well the plane shields the trace.</p>`,
    tips: ['A thin prepreg between L1 and L2 couples top-layer traces tightly to the ground plane, which is good for signal integrity and EMI.'],
    related: ['substrate', 'impedance', 'stackup'],
  },
  'copper-layer': {
    name: 'Copper layer', cat: 'Board structure',
    short: 'A conductive layer that is etched into traces, pads and planes. Boards are described by how many they have: 1, 2, 4, 6…',
    body: `<p>Copper thickness is given in <b>ounces</b> (oz): the weight of copper spread over one square foot. <b>1 oz ≈ 35 µm</b> thick, which is standard for outer layers. Thicker copper carries more current but makes fine-pitch etching harder.</p>
<p>Outer layers (L1, L4) hold the component pads. Inner layers (L2, L3) are usually solid planes or extra routing.</p>`,
    tips: ['Copper is drawn thicker than real in this model so you can see it. Real copper is about as thick as a sheet of paper.'],
    related: ['trace', 'ground-plane', 'stackup', 'copper-weight'],
  },
  mask: {
    name: 'Solder mask', cat: 'Board structure',
    short: 'The thin polymer coating (usually green) covering the copper everywhere except where things get soldered.',
    body: `<p>Solder mask stops solder from bridging between pads, protects copper from oxidation and scratches, and insulates traces. Openings in the mask (<b>mask openings</b>) expose the pads.</p>
<p>Look closely: traces show through the mask as lighter green lines, and the gold pads sit in openings.</p>`,
    tips: ['Keep at least a thin “mask dam” between fine-pitch pads so solder can’t bridge them.',
      'Green is cheapest and fastest at most fabs, and its contrast makes inspection easy. Other colours are available.',
      'Vias are usually <b>tented</b> (covered by mask) unless you want to use them as test points.'],
    related: ['pad', 'tented-via', 'silkscreen'],
  },
  silkscreen: {
    name: 'Silkscreen', cat: 'Board structure',
    short: 'The white ink printed on top of the solder mask: reference designators, outlines, polarity marks, logos and labels.',
    body: `<p>Silkscreen is for people. It helps whoever assembles, debugs or uses the board. It has no electrical function.</p>
<p>The fab removes silkscreen anywhere it would land on exposed copper. That is why the labels here never cover a pad.</p>`,
    tips: ['Keep text at least ~0.8–1.0 mm tall with a ~0.15 mm line width or it will be unreadable.',
      'Make all reference designators read in one or two directions so the board is easy to read.',
      'Label connector pins, polarity, the board name, and the <b>revision</b>. You will thank yourself later.',
      'Check that silkscreen isn’t hidden under a component after assembly.'],
    related: ['refdes', 'pin1', 'mask'],
  },
  outline: {
    name: 'Board outline / edge cuts', cat: 'Board structure',
    short: 'The shape of the finished board, drawn on a dedicated mechanical layer that the fab routes along.',
    body: `<p>The outline (highlighted in yellow when selected) tells the manufacturer where to cut the board out of the production panel. Rounded corners are more comfortable to handle and less likely to chip.</p>`,
    tips: ['Keep copper ≥ 0.3–0.5 mm away from the board edge (more for V-scored panels).',
      'Get the outline and mounting hole positions from the mechanical/CAD team <i>before</i> you start placing parts.'],
    related: ['mounting-hole', 'panelization', 'keepout'],
  },

  // ------------------------------------------------------------ copper features
  trace: {
    name: 'Trace', cat: 'Copper features',
    short: 'A strip of copper that connects two or more points: the PCB equivalent of a wire.',
    body: `<p>Traces carry signals and power between pads and vias. Their <b>width</b> sets how much current they can carry and (with the stackup) their impedance. Their <b>spacing</b> (clearance) keeps neighbouring nets from shorting or coupling noise.</p>
<p>On this board most signal traces are 0.25 mm wide. Power traces such as VBUS are wider.</p>`,
    tips: ['Use 45° corners rather than 90° corners. See the <i>Trace corners</i> technique.',
      'Keep traces short and direct, especially for fast or sensitive signals.',
      'Route over a solid plane so the return current has an easy path.',
      'Don’t make traces thinner than you need. Thin traces cost more and are less robust.'],
    related: ['trace-width', 'clearance', 'return-path', 'net'],
  },
  pad: {
    name: 'Pad (SMD pad)', cat: 'Copper features',
    short: 'An exposed copper area where a component lead is soldered.',
    body: `<p>Surface-mount pads sit only on the outer layer. Pads are left uncovered by solder mask and given a <b>surface finish</b> (gold-coloured ENIG here) so solder wets them well.</p>
<p>The size and spacing of the pads for a part form its <b>footprint</b>.</p>`,
    tips: ['Use the manufacturer’s recommended land pattern (it’s in the datasheet) or an IPC-7351-based library footprint.',
      'Avoid putting vias in pads unless the fab fills and caps them, or solder will wick down the hole.'],
    related: ['footprint', 'surface-finish', 'mask', 'smd'],
  },
  'th-pad': {
    name: 'Plated through-hole (PTH) pad', cat: 'Copper features',
    short: 'A drilled hole whose wall is plated with copper, with a pad on each side, used for through-hole component leads.',
    body: `<p>The component lead goes through the hole and is soldered on the far side. The plating connects the pads on every layer. That makes through-hole joints mechanically very strong, which is why connectors often use them.</p>
<p>The square pad on J2 and J3 marks <b>pin 1</b>.</p>`,
    tips: ['Hole diameter ≈ lead diameter + 0.2–0.3 mm.',
      'Use thermal reliefs where a PTH pad connects to a plane so it can still be hand-soldered.'],
    related: ['annular-ring', 'th', 'thermal-relief', 'via'],
  },
  'annular-ring': {
    name: 'Annular ring', cat: 'Copper features',
    short: 'The ring of copper left around a drilled hole: (pad diameter − hole diameter) ÷ 2.',
    body: `<p>Drills never land exactly in the centre. The annular ring gives some margin, so that even a slightly off-centre hole still leaves copper all the way around. If the drill breaks out of the pad, the connection can be unreliable or fail entirely.</p>`,
    tips: ['Check your fab’s minimum annular ring (often ~0.13–0.15 mm) and add margin.'],
    related: ['via', 'th-pad', 'clearance'],
  },
  via: {
    name: 'Via', cat: 'Copper features',
    short: 'A small plated hole that connects copper on different layers.',
    body: `<p>Vias let a trace change layers, or connect a pad to an inner plane. A standard <b>through via</b> is drilled through the whole board. Inside, the hole wall is plated with copper (the <b>barrel</b>), and you can see it when the layers are exploded.</p>
<p>On this board, most component GND and 3V3 pins drop straight to the inner planes through a via next to the pad.</p>`,
    tips: ['A common cheap size is 0.3 mm drill / 0.6 mm pad.',
      'Every via adds a little inductance. Use short connections and, for power, more than one via.',
      'Place a ground via near every signal via that changes layers, so the return current can follow.'],
    related: ['annular-ring', 'blind-via', 'tented-via', 'stitching', 'thermal-vias'],
  },
  'blind-via': {
    name: 'Blind, buried & micro vias', cat: 'Copper features',
    short: 'Vias that do not go all the way through: blind vias reach one outer layer, buried vias connect only inner layers.',
    body: `<p>The tiny via next to U1 (by its ground pin 32, top-left corner) is a <b>blind microvia</b>: it only goes from L1 down to the L2 ground plane, so it takes up no space on L3 or L4. Explode the layers to see its short barrel.</p>
<p>They are essential for dense BGA designs, but they add extra lamination and drilling steps and cost noticeably more.</p>`,
    tips: ['For student boards, stick to through vias unless you really need the density.'],
    related: ['via', 'hdi'],
  },
  'tented-via': {
    name: 'Tented via', cat: 'Copper features',
    short: 'A via covered by solder mask instead of left exposed.',
    body: `<p>Every via on this board is tented. The mask covers it, so solder can't flow into it and it can't short to a nearby part. Untented vias can be useful as quick probe points.</p>`,
    tips: [],
    related: ['via', 'mask'],
  },
  'ground-plane': {
    name: 'Ground plane', cat: 'Copper features',
    short: 'A large, mostly unbroken area of copper connected to ground (GND), usually a whole inner layer.',
    body: `<p>L2 is a solid ground plane. It gives every signal on L1 a low-impedance return path directly underneath it, shields against noise, and spreads heat.</p>
<p>Holes in the plane are either <b>antipads</b> (clearance around vias that are <i>not</i> ground) or <b>thermal reliefs</b> for ground pins.</p>`,
    tips: ['Keep the ground plane continuous. Don’t cut slots through it under signals (see <i>Return path</i>).',
      'One solid ground is better than separate “analog” and “digital” grounds for almost all student designs.',
      'Place it on the layer directly next to your main signal layer.'],
    related: ['return-path', 'antipad', 'power-plane', 'stitching'],
  },
  'power-plane': {
    name: 'Power plane', cat: 'Copper features',
    short: 'An inner copper layer (or region) dedicated to distributing a supply voltage, here 3.3 V.',
    body: `<p>Instead of routing power traces to every chip, a plane makes 3V3 available everywhere. Any pin can reach it with a short via. The power and ground planes, separated by thin dielectric, also act as a small, low-inductance capacitor.</p>
<p>Boards with several rails often <b>split</b> the power plane into regions (e.g. 5 V and 3.3 V islands).</p>`,
    tips: ['Don’t route fast signals across a split in a power plane they reference.'],
    related: ['ground-plane', 'decap', 'antipad'],
  },
  antipad: {
    name: 'Antipad (plane clearance)', cat: 'Copper features',
    short: 'The ring of removed copper around a via or pin where it passes through a plane it must NOT connect to.',
    body: `<p>Explode the layers and look at L2/L3: every 3V3 via has a clearance hole in the ground plane, and every GND via has one in the 3V3 plane. Without them, every via would short to every plane.</p>`,
    tips: ['Many vias placed close together can merge their antipads into a long slot that cuts the plane. Spread them out.'],
    related: ['ground-plane', 'power-plane', 'via'],
  },
  'thermal-relief': {
    name: 'Thermal relief', cat: 'Copper features',
    short: 'A pad connected to a plane through a few thin spokes instead of solid copper, so it can be soldered.',
    body: `<p>A big copper plane is a great heat sink, and that makes it a problem when soldering. A pin connected directly to it draws heat away so fast that the solder never melts properly, which gives a <b>cold joint</b>. The spokes limit how quickly heat escapes but still make a good electrical connection.</p>
<p>See the ground pin of J2 and the USB shield pins on L2, and the 3V3 pin of J2 on L3.</p>`,
    tips: ['Use reliefs on through-hole pins and on SMD pads in pours.',
      'Use solid connections where you <i>want</i> heat to flow, e.g. thermal pads and thermal vias.'],
    related: ['ground-plane', 'th-pad', 'pour'],
  },
  pour: {
    name: 'Copper pour / polygon', cat: 'Copper features',
    short: 'A filled copper area on a routing layer, assigned to a net (often GND or a power rail).',
    body: `<p>The rectangle of copper under the regulator’s tab (U2) is a 3V3 pour. It carries the output current and acts as a heat-spreader. The CAD tool automatically keeps clearance from other nets when it fills a pour.</p>`,
    tips: ['Remove tiny islands of unconnected copper (“dead copper”). Many tools can do this automatically.',
      'Re-pour polygons after any change, before you generate fabrication files.'],
    related: ['thermal-vias', 'thermal-relief', 'ground-plane'],
  },
  testpoint: {
    name: 'Test point', cat: 'Copper features',
    short: 'An exposed pad, deliberately placed so you can touch a probe to an important net.',
    body: `<p>TP1 (3V3) and TP2 (GND) let you check the regulator with a multimeter or clip on a scope ground without poking tiny IC pins.</p>`,
    tips: ['Add test points on every power rail, ground, and important signals (reset, clocks, communication buses).',
      'Label them on the silkscreen.'],
    related: ['silkscreen', 'debugging'],
  },
  fiducial: {
    name: 'Fiducial', cat: 'Copper features',
    short: 'A round copper dot with a large mask opening, used by assembly machines to find the board’s exact position.',
    body: `<p>Pick-and-place machines use cameras to locate fiducials, then correct for any offset or rotation of the board before placing parts. Three non-symmetrical fiducials also let the machine detect a board loaded the wrong way round.</p>`,
    tips: ['Use 3 fiducials, not in a symmetric pattern, for machine-assembled boards. Hand-assembled boards don’t need them.'],
    related: ['pick-place', 'assembly'],
  },
  'thermal-vias': {
    name: 'Thermal vias & thermal pads', cat: 'Copper features',
    short: 'Arrays of vias that conduct heat from a hot part’s exposed pad into inner planes or the other side of the board.',
    body: `<p>The regulator (U2) burns (V<sub>in</sub> − V<sub>out</sub>) × I as heat. Its big tab is soldered to a copper pour, and a grid of vias carries that heat down into the 3V3 plane, spreading it over the whole board.</p>`,
    tips: ['Connect thermal vias solidly (no thermal relief): here you <i>want</i> heat to flow.',
      'Check the package’s datasheet for its recommended thermal pad and via pattern.'],
    related: ['pour', 'via', 'trace-width'],
  },
  stitching: {
    name: 'Stitching vias', cat: 'Copper features',
    short: 'Rows of ground vias that tie ground copper on different layers together, often along the board edge.',
    body: `<p>The ring of vias around this board’s edge connects ground on every layer at many points. That keeps ground at the same potential everywhere and helps contain electromagnetic noise at the edges.</p>`,
    tips: ['Place stitching vias next to signal vias that change layers, along board edges, and around noisy or sensitive circuits.'],
    related: ['ground-plane', 'via', 'emi'],
  },
  'surface-finish': {
    name: 'Surface finish (ENIG, HASL…)', cat: 'Copper features',
    short: 'A metal coating on exposed copper that prevents oxidation and helps soldering.',
    body: `<p><b>HASL</b> (hot-air solder leveling) is cheapest but slightly uneven. <b>ENIG</b> (electroless nickel immersion gold) gives the flat, gold-coloured pads you see here, which is better for fine-pitch parts. <b>Lead-free HASL</b> is a good middle ground.</p>`,
    tips: [],
    related: ['pad', 'mask'],
  },

  // ------------------------------------------------------------ components
  footprint: {
    name: 'Footprint (land pattern)', cat: 'Components & assembly',
    short: 'The pattern of pads, outline and markings that a specific component package needs on the PCB.',
    body: `<p>Every schematic symbol is linked to a footprint. U1’s LQFP-32 footprint is 32 pads at 0.8 mm pitch. If the footprint doesn’t match the real part, the board is scrap. This is the most common beginner mistake.</p>`,
    tips: ['Print the layout 1:1 on paper and lay the real parts on it before you order.',
      'Double-check pin numbering (top vs bottom view!) against the datasheet.',
      'Check the 3D model fits, especially connectors near the board edge.'],
    related: ['pad', 'smd', 'courtyard', 'pin1'],
  },
  smd: {
    name: 'Surface-mount device (SMD/SMT)', cat: 'Components & assembly',
    short: 'A component soldered onto pads on the board surface rather than through holes.',
    body: `<p>Almost every modern part is surface mount. Packages are named by size or style: <b>0603</b> (1.6 × 0.8 mm passives), <b>SOIC</b>, <b>QFP</b>, <b>QFN</b>, <b>BGA</b>…</p>
<p>Click any part on the board to see its package.</p>`,
    tips: ['0603 or 0805 passives are comfortable to hand-solder. 0402 and smaller are hard to hand-solder.',
      'QFN and BGA parts with hidden pads need a stencil and reflow or hot air.'],
    related: ['footprint', 'th', 'pad', 'stencil'],
  },
  th: {
    name: 'Through-hole component (THT)', cat: 'Components & assembly',
    short: 'A component whose leads go through plated holes in the board and are soldered on the opposite side.',
    body: `<p>Through-hole parts are larger, but much stronger mechanically. That is why connectors that get plugged and unplugged (like J2 and J3) often use them.</p>`,
    tips: ['On a car, use connectors with mechanical retention and strain relief. Vibration kills solder joints.'],
    related: ['th-pad', 'smd', 'connector'],
  },
  decap: {
    name: 'Decoupling (bypass) capacitor', cat: 'Components & assembly',
    short: 'A small capacitor (often 100 nF) placed right next to an IC’s power pin to supply fast bursts of current.',
    body: `<p>When a chip switches, it draws sharp current spikes. The supply is too far away, through too much inductance, to deliver them quickly, so the local voltage dips. A capacitor right at the pin supplies that current instead.</p>
<p>Each STM32 supply pin has its own 100 nF cap: C1 on VDD (pin 1), C2 on VDDA (pin 5, the analog supply) and C3 on VDDIO2 (pin 17). The temperature sensor U4 gets C4.</p>`,
    tips: ['One 100 nF per power pin, as close as possible to the pin. Add a bulk cap (1–10 µF) nearby.',
      'Route power from the plane via → capacitor pad → IC pin, so the current flows through the cap.',
      'The <b>loop area</b> (pin → cap → ground → back to pin) is what matters. See the <i>Decoupling placement</i> technique.'],
    related: ['power-plane', 'ground-plane', 'via', 'return-path'],
  },
  crystal: {
    name: 'Crystal oscillator', cat: 'Components & assembly',
    short: 'A quartz resonator that gives a microcontroller an accurate clock. Its layout is surprisingly sensitive.',
    body: `<p>Y1 (8 MHz) and its two load capacitors (C5, C6) sit as close to the STM32’s OSC_IN/OSC_OUT pins (2 and 3) as possible. The traces are short and the solid ground plane sits underneath.</p>`,
    tips: ['Keep crystal traces as short as possible and route no other signals near or under them.',
      'Connect the load caps to ground with short via connections.',
      'Calculate the load capacitor values from the crystal’s datasheet (C<sub>L</sub> and stray capacitance).'],
    related: ['ground-plane', 'trace'],
  },
  connector: {
    name: 'Connectors', cat: 'Components & assembly',
    short: 'Parts that join the board to cables or other boards: USB-C for power (J1), a debug header (J2) and a CAN terminal (J3).',
    body: `<p>Connectors usually sit at the board edge so cables can reach them. The mechanical design matters as much as the electrical one: check orientation, mating clearance and how the cable will be routed.</p>`,
    tips: ['Put the connector’s 3D model in your CAD tool and check it from every side.',
      'Label every pin on the silkscreen.'],
    related: ['th', 'smd', 'outline'],
  },
  refdes: {
    name: 'Reference designator', cat: 'Components & assembly',
    short: 'The unique label for each part (R1, C4, U2…) that ties the board to the schematic and the BOM.',
    body: `<p>The letter gives the type: <b>R</b> resistor, <b>C</b> capacitor, <b>L</b> inductor, <b>D</b> diode/LED, <b>U</b> IC, <b>Q</b> transistor, <b>J</b> connector, <b>Y</b> crystal, <b>TP</b> test point. The number makes it unique.</p>`,
    tips: ['Place each designator right next to its part, all facing the same way.'],
    related: ['silkscreen', 'bom'],
  },
  pin1: {
    name: 'Pin 1 & polarity markings', cat: 'Components & assembly',
    short: 'Silkscreen dots, bars and square pads that show which way round a part goes.',
    body: `<p>ICs, diodes, LEDs, electrolytic capacitors and connectors can all be installed backwards. A clear marking that is <i>still visible after the part is placed</i> prevents this. On this board, the dots mark pin 1 of U1/U3, the bars mark the LED cathodes, and the square pads mark pin 1 of the connectors.</p>`,
    tips: ['Check the part’s datasheet for its own pin-1 / cathode marking and match it.'],
    related: ['silkscreen', 'footprint'],
  },
  'mounting-hole': {
    name: 'Mounting hole', cat: 'Components & assembly',
    short: 'A hole for a screw or standoff that holds the board in its enclosure.',
    body: `<p>These are <b>non-plated</b> 3.2 mm holes for M3 screws. Copper and parts are kept away from them so the screw head and washer can’t short anything.</p>`,
    tips: ['Agree hole positions with the mechanical team early.',
      'Use a plated hole connected to ground if you want the chassis to be grounded through the screw.'],
    related: ['outline', 'keepout'],
  },


  // ------------------------------------------------------------ chips & buses (link to the lesson modules)
  mcu: {
    name: 'Microcontroller (STM32F042K6)', cat: 'Components & assembly', module: 'mcu',
    short: 'A whole small computer on one chip: CPU, Flash memory, RAM, clocks and peripherals like CAN, I²C, timers and ADC.',
    body: `<p>U1 is an <b>STM32F042K6</b> from ST: an Arm Cortex-M0 core running at up to 48 MHz, with 32 KB of Flash and 6 KB of RAM, in a 32-pin LQFP package. On this board it reads the I²C temperature sensor, talks on the CAN bus and blinks two LEDs.</p>
<p>The parts around it are its support circuit: decoupling capacitors (C1–C3), an 8 MHz crystal (Y1), a BOOT0 pull-down (R6), and the SWD programming header (J2).</p>`,
    tips: ['Plan pin assignments in STM32CubeMX before you draw the schematic. Pins have alternate functions that can clash. On the F042, CAN and USB share PA11/PA12, so this board can’t use both.',
      'Always break out SWDIO, SWCLK, NRST, 3V3 and GND to a header so you can program and debug.'],
    related: ['decap', 'crystal', 'can', 'i2c'],
  },
  can: {
    name: 'CAN bus', cat: 'Design concepts', module: 'can',
    short: 'Controller Area Network: the robust two-wire differential bus that most of the car’s controllers share.',
    body: `<p>The STM32’s built-in CAN controller sends logic-level bits on CAN_TX (PA12) to the transceiver U3. U3 turns them into the differential CANH/CANL signals that leave the board through J3. R3 is the 120 Ω termination for this end of the bus.</p>`,
    tips: ['Terminate the bus with 120 Ω at <b>both physical ends</b>, and nowhere else.', 'Route CANH/CANL as a pair, and use twisted-pair cable off the board.'],
    related: ['diffpair', 'mcu', 'connector'],
  },
  i2c: {
    name: 'I²C bus', cat: 'Design concepts', module: 'i2c',
    short: 'A simple two-wire bus (SDA data + SCL clock) for connecting sensors and small chips over short distances on a board.',
    body: `<p>The STM32’s I2C1 peripheral (PB6 = SCL, PB7 = SDA) talks to U4, a temperature sensor at address <b>0x48</b>. R7 and R8 are the pull-up resistors that I²C needs, because devices can only pull the lines low.</p>`,
    tips: ['Every I²C bus needs pull-up resistors (typically 2.2–10 kΩ) on SDA and SCL.', 'Check that no two devices on one bus share an address.'],
    related: ['pull-up', 'mcu'],
  },
  'pull-up': {
    name: 'Pull-up / pull-down resistor', cat: 'Components & assembly',
    short: 'A resistor that gently holds a signal high (to the supply) or low (to ground) when nothing is actively driving it.',
    body: `<p>R7/R8 pull the I²C lines up to 3.3 V. R6 pulls the STM32’s BOOT0 pin down to ground so the chip always starts its own program from Flash. A floating (unconnected) input can read as random 0s and 1s.</p>`,
    tips: ['Never leave an important input like BOOT0, reset or an enable pin floating.'],
    related: ['i2c', 'mcu'],
  },
  // ------------------------------------------------------------ concepts
  'trace-width': {
    name: 'Trace width & current', cat: 'Design concepts',
    short: 'Wider traces carry more current with less heating and voltage drop.',
    body: `<p>The VBUS trace from the USB connector is wider than the signal traces because it carries the whole board’s supply current. Use the <i>Trace width</i> technique to calculate the width with the IPC-2221 formula and see it update on the board.</p>`,
    tips: ['Outer layers cool better than inner layers, so internal traces need to be wider for the same current.',
      'Add margin: rounding up costs almost nothing.'],
    related: ['trace', 'copper-weight', 'thermal-vias'],
  },
  clearance: {
    name: 'Clearance & design rules', cat: 'Design concepts',
    short: 'The minimum spacing between copper features and other limits your fab can reliably build.',
    body: `<p>Design rules set minimum trace width, spacing, drill size, annular ring and so on. A <b>DRC</b> (design rule check) automatically flags any violations.</p>`,
    tips: ['Set your rules to your fab’s capabilities <i>before</i> routing (e.g. 0.15 mm trace/space is safe almost everywhere).',
      'High-voltage nets need much larger clearance (see creepage).'],
    related: ['drc', 'creepage', 'annular-ring'],
  },
  'return-path': {
    name: 'Return current path', cat: 'Design concepts',
    short: 'Every signal current flows back to its source, and at high frequency it returns directly under the trace in the nearest plane.',
    body: `<p>Current always flows in a loop. Beginners often think only about the trace, but the return current matters just as much. At high frequency it follows the path of lowest <i>inductance</i>, which is the plane directly beneath the trace.</p>
<p>If the plane has a slot, the return current must detour around it. That creates a big loop that radiates noise and picks up interference. Try the <i>Return path</i> technique.</p>`,
    tips: ['Never route a signal across a gap or split in its reference plane.',
      'When a signal changes layers, put a ground via next to it.'],
    related: ['ground-plane', 'emi', 'decap'],
  },
  diffpair: {
    name: 'Differential pair', cat: 'Design concepts',
    short: 'Two traces carrying equal and opposite signals (USB D+/D−, CAN H/L), routed together as a matched pair.',
    body: `<p>The receiver looks only at the <i>difference</i> between the two lines. Noise that hits both lines equally cancels out. This only works if both traces stay together with the same length, width and spacing the whole way.</p>
<p>On this board, CANH/CANL run as a pair from the transceiver U3 to J3. CAN is fairly forgiving, but it still benefits from tight routing and needs a <b>120 Ω termination</b> resistor (R3) at each end of the bus. Faster pairs like USB (about 90 Ω differential) need controlled impedance.</p>`,
    tips: ['Route the pair together, symmetrically, with constant spacing.',
      'Match lengths: add small “serpentine” wiggles to the shorter trace if needed.',
      'Use your CAD tool’s differential-pair router and impedance calculator.'],
    related: ['impedance', 'return-path', 'trace'],
  },

  // ------------------------------------------------------------ glossary-only
  net: { name: 'Net', cat: 'Design concepts', short: 'A set of pins that are electrically connected, given a name like GND, 3V3 or SWCLK.', body: '<p>Nets come from the schematic. The layout tool connects every pin on a net, and DRC flags any that end up unconnected or shorted to another net.</p>', tips: ['Name important nets in the schematic. Auto-generated names like N$37 are hard to debug.'], related: ['netlist', 'ratsnest'] },
  netlist: { name: 'Netlist', cat: 'Files & manufacturing', short: 'The list of every net and the pins it connects. It is the link between schematic and layout.', body: '', tips: [], related: ['net', 'ratsnest'] },
  ratsnest: { name: 'Ratsnest / airwires', cat: 'Design concepts', short: 'Thin straight lines in the layout editor showing connections that still need to be routed.', body: '<p>Use the ratsnest during placement: arrange parts so the lines are short and cross as little as possible. A good placement makes routing much easier.</p>', tips: [], related: ['net', 'netlist'] },
  courtyard: { name: 'Courtyard', cat: 'Components & assembly', short: 'An invisible keep-out boundary around a footprint that no other component may overlap.', body: '<p>It accounts for the part body plus some room for assembly tools and rework. DRC flags overlapping courtyards.</p>', tips: [], related: ['footprint', 'keepout'] },
  keepout: { name: 'Keep-out area', cat: 'Design concepts', short: 'A region where copper, components or vias are not allowed (e.g. under an antenna or around a mounting hole).', body: '', tips: [], related: ['mounting-hole', 'outline'] },
  impedance: { name: 'Controlled impedance', cat: 'Design concepts', short: 'Designing trace width/spacing and stackup so a trace has a specific characteristic impedance (e.g. 50 Ω, 90 Ω differential).', body: '<p>For fast signals (USB, Ethernet, RF) a mismatch causes reflections. Impedance depends on trace width, dielectric thickness and material. Use your fab’s impedance calculator with their stackup.</p>', tips: [], related: ['diffpair', 'prepreg', 'stackup'] },
  creepage: { name: 'Creepage & clearance (high voltage)', cat: 'Design concepts', short: 'Minimum distances along the surface (creepage) and through air (clearance) between high-voltage conductors.', body: '<p>Very important on the tractive-system side of an EV. Standards like IPC-2221 and IEC 60664, plus the FSAE rules, define these distances. A milled slot in the board can increase creepage distance.</p>', tips: [], related: ['clearance'] },
  drc: { name: 'DRC (Design Rule Check)', cat: 'Files & manufacturing', short: 'An automated check that the layout follows your spacing, width and connection rules.', body: '<p>Run DRC often and fix <i>every</i> error before ordering. Also run an ERC (electrical rule check) on the schematic.</p>', tips: [], related: ['clearance', 'gerber'] },
  gerber: { name: 'Gerber files', cat: 'Files & manufacturing', short: 'The industry-standard files (one per layer) that describe copper, mask, silkscreen and outline for the fab.', body: '<p>Always open your Gerbers in a viewer (your fab’s online viewer works well) before ordering. You are checking what will actually be built, not what your CAD tool shows.</p>', tips: [], related: ['drill-file', 'bom', 'pick-place'] },
  'drill-file': { name: 'Drill file (NC drill)', cat: 'Files & manufacturing', short: 'Lists the position and size of every hole, plated and non-plated.', body: '', tips: [], related: ['gerber', 'via'] },
  bom: { name: 'BOM (Bill of Materials)', cat: 'Files & manufacturing', short: 'The list of every part: reference designators, values, manufacturer part numbers and quantities.', body: '', tips: ['Order a few spares of small passives. They will get lost.'], related: ['refdes', 'pick-place'] },
  'pick-place': { name: 'Pick-and-place (centroid) file', cat: 'Files & manufacturing', short: 'X/Y position, rotation and side of every SMD part, used by automated assembly machines.', body: '', tips: [], related: ['fiducial', 'bom'] },
  stencil: { name: 'Solder paste stencil', cat: 'Files & manufacturing', short: 'A thin laser-cut steel sheet used to print solder paste onto SMD pads before reflow.', body: '', tips: [], related: ['smd', 'pad'] },
  assembly: { name: 'Reflow & assembly', cat: 'Files & manufacturing', short: 'Paste is printed, parts are placed, then the board passes through a reflow oven that melts the solder.', body: '', tips: [], related: ['stencil', 'pick-place'] },
  panelization: { name: 'Panelization', cat: 'Files & manufacturing', short: 'Arranging several copies of a board on one production panel, joined by tabs or V-score lines.', body: '', tips: [], related: ['outline'] },
  'copper-weight': { name: 'Copper weight (oz)', cat: 'Board structure', short: 'Copper thickness expressed as ounces per square foot; 1 oz ≈ 35 µm, 2 oz ≈ 70 µm.', body: '', tips: [], related: ['copper-layer', 'trace-width'] },
  hdi: { name: 'HDI (High-Density Interconnect)', cat: 'Board structure', short: 'Boards using microvias, very fine traces and stacked vias, needed for fine-pitch BGAs.', body: '', tips: [], related: ['blind-via'] },
  emi: { name: 'EMI / EMC', cat: 'Design concepts', short: 'Electromagnetic interference (noise a board emits or receives) and compatibility (not causing or suffering from it).', body: '<p>Most EMI problems come from large current loops, poor return paths and fast edges. Solid planes, short loops and good decoupling solve most of them.</p>', tips: [], related: ['return-path', 'stitching', 'decap'] },
  debugging: { name: 'Bring-up & debugging', cat: 'Files & manufacturing', short: 'Powering and testing a new board for the first time.', body: '<p>Before power: check for shorts between rails and GND with a multimeter. Power up with a current-limited supply. Then check every rail at its test point before plugging in anything expensive.</p>', tips: [], related: ['testpoint'] },
};

// ------------------------------------------------------------------ techniques
// view: { t:[x,y], d: distance, az: azimuth deg (0 = from +y/back... see app), el: elevation deg }
export const TECHNIQUES = [
  {
    id: 'corners', title: 'Trace corners: 45° not 90°', terms: ['trace'], tag: 'corners',
    view: { t: [9, -5], d: 26, az: 0, el: 62 },
    summary: 'Route bends with two 45° turns (or arcs) instead of a sharp right angle.',
    body: `<p>Look at the CAN TX/RX traces running from U1 to U3. Toggle the switch to see the same route drawn with 90° corners.</p>
<p>Why it matters: a 90° corner is slightly wider at the bend, which causes a small impedance bump. Sharp inside corners were also once an etching problem (acid traps). For low-speed signals the electrical effect is tiny. The real reason to use 45° is that it gives shorter, cleaner routes, and it is a sign of a carefully made layout.</p>`,
    toggle: { key: 'corners90', on: 'Show 90° corners (avoid)', off: 'Show 45° corners (good)' },
  },
  {
    id: 'decap', title: 'Decoupling capacitor placement', terms: ['decap'],
    view: { t: [-6, 4.5], d: 20, az: 0, el: 65 },
    summary: 'Put each decoupling cap right at the power pin it serves, with short, direct via connections.',
    body: `<p>The orange shape is the <b>current loop</b>: from the STM32’s VDD pin (pin 1), through capacitor C1, down its ground via, through the ground plane and back up into the VSS pin (pin 32).</p>
<p>A larger loop means more inductance, so the cap can’t deliver current fast enough and more noise radiates. Toggle the switch to move C1 a few millimetres away and watch the loop grow.</p>`,
    toggle: { key: 'decapFar', on: 'Move C1 far away (bad)', off: 'C1 next to its pin (good)' },
    loop: true,
  },
  {
    id: 'return', title: 'Keep the return path continuous', terms: ['return-path', 'ground-plane'],
    view: { t: [10, 7.5], d: 26, az: 0, el: 50 }, hidden: ['silkT', 'maskT', 'ppT', 'comps'], explode: 0.45, highlight: [],
    summary: 'High-frequency return current flows in the plane directly under its trace. Don’t make it detour.',
    body: `<p>The <span class="swatch" style="background:#36d6ff"></span> cyan dots are the SWCLK debug clock, flowing from the programmer header J2 into the STM32 along its trace on L1. The <span class="swatch" style="background:#ff4fd8"></span> pink dots are the matching return current on the L2 ground plane, travelling back underneath it.</p>
<p>Toggle the switch to cut a slot in the ground plane. The return current now has to go around the slot. The loop gets bigger, so the trace radiates more and picks up more noise, and the impedance changes where it crosses the gap.</p>`,
    toggle: { key: 'slot', on: 'Cut a slot in the ground plane (bad)', off: 'Solid ground plane (good)' },
    returnAnim: true,
  },
  {
    id: 'trace-width', title: 'Trace width for current', terms: ['trace-width'],
    view: { t: [-21, 6], d: 24, az: -10, el: 60 },
    summary: 'Size power traces for the current they carry. The VBUS trace updates as you calculate.',
    body: `<p>This uses the IPC-2221 formula to find the minimum width that keeps the trace’s temperature rise within your limit. The VBUS trace on the board is redrawn at the calculated width (between 0.2 and 1.6 mm).</p>`,
    calculator: true,
  },
  {
    id: 'thermal', title: 'Thermal relief vs. solid connection', terms: ['thermal-relief'],
    view: { t: [19, 12], d: 20, az: 0, el: 60 }, hidden: ['silkT', 'maskT', 'L1', 'ppT', 'comps'], highlight: [],
    summary: 'Connect through-hole pins to planes with spokes so they can be soldered.',
    body: `<p>The top layers are hidden so you’re looking straight at the L2 ground plane. J2’s ground pin (on the right) connects with four spokes. The other pins have plain clearance holes (antipads). Toggle to see a solid connection.</p>
<p>A solid connection makes the plane a giant heat sink, and your iron struggles to get the joint hot enough. Reliefs fix this but add a little resistance and inductance, so <b>don’t</b> use them on thermal vias or high-current paths.</p>`,
    toggle: { key: 'solidRelief', on: 'Solid connection (hard to solder)', off: 'Thermal relief (good for hand soldering)' },
  },
  {
    id: 'diffpair', title: 'Routing differential pairs', terms: ['diffpair'],
    view: { t: [21, -10], d: 20, az: 0, el: 60 },
    summary: 'Keep pairs together, symmetric, length-matched and over a solid plane.',
    body: `<p>CANH and CANL leave the transceiver U3 together, pass the 120 Ω termination resistor R3, and fan out only at the last moment to reach J3’s pins. Off the board, the pair continues as a twisted-pair cable.</p><p>The <b>CAN Bus</b> module (top bar) explains why the pair works the way it does.</p>
<p>Keep both traces the same length and avoid putting vias or other parts between them.</p>`,
  },
  {
    id: 'crystal', title: 'Crystal layout', terms: ['crystal'],
    view: { t: [-9.5, 1.6], d: 14, az: 0, el: 60 },
    summary: 'Crystal and load caps tight against the MCU. Short traces. Nothing else nearby.',
    body: `<p>Oscillator circuits have tiny signal levels and high impedance, so they pick up noise easily. Y1 sits right next to the STM32’s OSC_IN/OSC_OUT pins, with C5/C6 right beside it. Their ground vias drop straight into L2, and no other signals pass through this area.</p>`,
  },
  {
    id: 'thermal-vias', title: 'Getting heat out of parts', terms: ['thermal-vias', 'pour'],
    view: { t: [-21, 15], d: 18, az: 0, el: 55 },
    summary: 'Copper pours and via arrays turn the board itself into a heatsink.',
    body: `<p>U2 drops 5 V to 3.3 V, so at 200 mA it dissipates (5 − 3.3) × 0.2 = 0.34 W. Its tab is soldered to a 3V3 pour, and a 2 × 6 grid of thermal vias carries the heat into the L3 power plane.</p>`,
  },
  {
    id: 'stitching', title: 'Ground stitching', terms: ['stitching'],
    view: { t: [0, 0], d: 78, az: 0, el: 70 },
    summary: 'Stitch ground layers together with many vias, especially around the board edge.',
    body: `<p>The ring of vias around the edge ties ground on every layer together and forms a “fence” that helps keep noise in (and out). Notice that the stitching avoids the mounting holes, connectors and other copper.</p>`,
  },
  {
    id: 'silk', title: 'Silkscreen that helps', terms: ['silkscreen', 'refdes', 'pin1'],
    view: { t: [0, 0], d: 62, az: 0, el: 89 },
    summary: 'Readable refdes, visible pin-1 and polarity marks, labeled connectors, board name and revision.',
    body: `<p>Look at the board from the top. Every part has a designator next to it, all facing the same way. Pin 1 of each IC is marked with a dot, LED cathodes with a bar, and connector pins are labeled. The board name and revision are printed on it.</p>
<p>Flip to the bottom view and you’ll find the bottom silkscreen is mirrored, so it reads correctly from underneath.</p>`,
  },
  {
    id: 'testability', title: 'Design for test & assembly', terms: ['testpoint', 'fiducial'],
    view: { t: [0, 0], d: 78, az: 0, el: 70 },
    summary: 'Test points on the rails, fiducials for the assembly machine, connectors at the edge.',
    body: `<p>TP1/TP2 let you check the 3.3 V rail in seconds. The three asymmetric fiducials let a pick-and-place machine align the board. The programming header (J2) makes the MCU easy to flash and debug.</p>`,
  },
  {
    id: 'stackup', title: 'Choosing a stackup', terms: ['stackup'],
    view: { t: [0, 0], d: 70, az: 35, el: 22 }, explode: 1,
    summary: 'Signal – Ground – Power – Signal: every routing layer gets a solid neighbouring plane.',
    body: `<p>With the layers exploded you can see why 4 layers are so popular. L1 sits directly above a solid ground plane, so every top-layer trace has a clean return path. The power plane also comes almost for free.</p>
<p>On a 2-layer board, you have to give up much of the bottom layer to a ground pour and route carefully around it.</p>`,
  },
];

// ------------------------------------------------------------------ guided tour
export const TOUR = [
  { title: 'Welcome to the PCB Explorer', terms: [], view: { t: [0, 0], d: 80, az: 28, el: 44 }, explode: 0, hidden: [],
    body: `<p>This is a small but realistic <b>4-layer PCB</b> built to show the basics of board design. Each step of this tour points out one idea.</p>
<p><b>Drag</b> to rotate, <b>scroll</b> to zoom, <b>right-drag</b> to pan. <b>Click anything</b> on the board to learn what it is.</p>` },
  { title: 'A PCB is a sandwich of layers', terms: ['stackup'], highlight: [], view: { t: [0, 0], d: 74, az: 35, el: 20 }, explode: 1, hidden: [],
    body: `<p>A PCB is built up from layers of copper and insulator. Here they’re pulled apart (try the <b>Explode</b> slider yourself).</p>
<p>From top to bottom: silkscreen, solder mask, 4 copper layers separated by prepreg and the core, then mask and silkscreen again on the bottom.</p>` },
  { title: 'The insulators: core & prepreg', terms: ['substrate', 'prepreg'], view: { t: [0, 0], d: 74, az: 35, el: 20 }, explode: 1, hidden: [],
    body: `<p>The thick <b>FR-4 core</b> gives the board its stiffness. The thinner <b>prepreg</b> sheets glue the outer copper layers on. Both are woven glass fiber in epoxy, and both are electrical insulators.</p>` },
  { title: 'Copper layers', terms: ['copper-layer'], view: { t: [0, 0], d: 74, az: 35, el: 20 }, explode: 1, hidden: [],
    body: `<p>The copper is where the circuit lives. The outer layers (L1, L4) carry component pads and signal traces. The inner layers here are solid <b>planes</b>: L2 is ground and L3 is 3.3 V.</p>` },
  { title: 'Traces are the wires', terms: ['trace'], view: { t: [-6, 0], d: 38, az: 0, el: 65 }, explode: 0, hidden: ['maskT', 'silkT', 'comps'],
    body: `<p>With the mask and parts hidden you can see the bare copper <b>traces</b> on the top layer. Each one connects the pins of one <b>net</b>. Notice the clean 45° bends and that power traces are wider than signals.</p>` },
  { title: 'Pads and footprints', terms: ['pad'], view: { t: [0, 0], d: 18, az: 0, el: 60 }, explode: 0, hidden: ['comps'],
    body: `<p>Components are soldered to <b>pads</b>: exposed copper with a gold finish. The pattern of pads for one part is its <b>footprint</b>. U1’s footprint here is 32 pads at 0.8 mm spacing.</p>` },
  { title: 'Vias connect the layers', terms: ['via'], view: { t: [-3, 3], d: 26, az: 30, el: 32 }, explode: 0.55, hidden: [],
    body: `<p>A <b>via</b> is a small plated hole that lets a connection jump between layers. Explode the board and you can see the copper barrels running down through the stack, connecting to the planes.</p>` },
  { title: 'Planes: ground and power', terms: ['ground-plane', 'antipad'], view: { t: [0, 0], d: 70, az: 0, el: 70 }, explode: 0, hidden: ['silkT', 'maskT', 'L1', 'ppT', 'comps'],
    body: `<p>This is L2, the <b>ground plane</b>: a whole layer of copper tied to GND. The small holes are <b>antipads</b>, where vias belonging to other nets pass through without touching it. The spoked rings are <b>thermal reliefs</b>.</p>` },
  { title: 'Solder mask', terms: ['mask'], view: { t: [-6, 2], d: 30, az: 20, el: 50 }, explode: 0, hidden: ['comps'],
    body: `<p>The green <b>solder mask</b> covers all the copper except the pads. It prevents solder bridges and protects the traces, which you can still see through it as lighter lines.</p>` },
  { title: 'Silkscreen', terms: ['silkscreen', 'refdes'], view: { t: [0, 0], d: 66, az: 0, el: 88 }, explode: 0, hidden: [],
    body: `<p>The white <b>silkscreen</b> labels everything: reference designators (U1, C4, R3…), pin-1 marks, connector pin names, and the board name and revision.</p>` },
  { title: 'Surface-mount vs. through-hole', terms: ['smd', 'th'], view: { t: [4, 2], d: 62, az: 25, el: 42 }, explode: 0, hidden: [],
    body: `<p>Most parts are <b>surface mount</b> (SMD): soldered on top. The header J2 and terminal J3 are <b>through-hole</b>: their pins pass through plated holes for extra strength.</p>` },
  { title: 'The mechanical details', terms: ['mounting-hole', 'fiducial', 'outline'], view: { t: [0, 0], d: 78, az: 0, el: 72 }, explode: 0, hidden: [],
    body: `<p>The <b>board outline</b> (yellow) defines the cut. <b>Mounting holes</b> take M3 screws. <b>Fiducials</b> help assembly machines align the board.</p>` },
  { title: 'Now explore!', terms: [], view: { t: [0, 0], d: 80, az: 28, el: 44 }, explode: 0, hidden: [],
    body: `<p>That’s the basics. Next, try the <b>Techniques</b> tab: you can flip between good and bad layout choices and see what changes. Or browse the <b>Glossary</b> for every term.</p>` },
];

// ------------------------------------------------------------------ stack panel
export const LAYER_INFO = [
  { id: 'comps', name: 'Components', detail: 'Parts soldered to the top', term: 'smd', color: '#2a2a30' },
  { id: 'silkT', name: 'Top silkscreen', detail: 'Ink · ~0.02 mm', term: 'silkscreen', color: '#f2f2ea' },
  { id: 'maskT', name: 'Top solder mask', detail: 'Epoxy · ~0.02 mm', term: 'mask', color: '#0e7a3e' },
  { id: 'L1', name: 'L1 · Top copper', detail: 'Signals · 1 oz (35 µm)', term: 'copper-layer', color: '#c8783c' },
  { id: 'ppT', name: 'Prepreg', detail: '~0.2 mm', term: 'prepreg', color: '#d3c48c' },
  { id: 'L2', name: 'L2 · Ground plane', detail: 'GND · 0.5–1 oz', term: 'ground-plane', color: '#d08550' },
  { id: 'core', name: 'FR-4 core', detail: '~1.0 mm', term: 'substrate', color: '#b39d5c' },
  { id: 'L3', name: 'L3 · Power plane', detail: '3V3 · 0.5–1 oz', term: 'power-plane', color: '#d08550' },
  { id: 'ppB', name: 'Prepreg', detail: '~0.2 mm', term: 'prepreg', color: '#d3c48c' },
  { id: 'L4', name: 'L4 · Bottom copper', detail: 'Signals · 1 oz (35 µm)', term: 'copper-layer', color: '#c8783c' },
  { id: 'maskB', name: 'Bottom solder mask', detail: 'Epoxy · ~0.02 mm', term: 'mask', color: '#0e7a3e' },
  { id: 'silkB', name: 'Bottom silkscreen', detail: 'Ink · ~0.02 mm', term: 'silkscreen', color: '#f2f2ea' },
];
