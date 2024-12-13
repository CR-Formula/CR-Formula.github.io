---
title: PCB Design
parent: Hardware
nav_order: 3
---

# PCB Design Basics

**Printed Circuit Board (PCB) Design** is the process of laying out the electrical and mechanical connections for electronic circuits. A PCB provides physical support and a platform to interconnect components like resistors, capacitors, ICs, and connectors. Below are the key concepts and steps involved in PCB design.

## Key PCB Design Terms

- **Trace**: Conductive pathways on the PCB that connect components, the "wires".
- **Pad**: Metalized areas on the surface of the board for soldering components.
- **Via**: Conductive holes that allow connections between different layers of the PCB.
- **Ground Plane**: A large area of copper connected to the ground to reduce noise and improve stability.
- **Silkscreen**: Text and symbols printed on the PCB to label components and provide information.
- **Solder Mask**: A protective layer applied to the PCB to prevent short circuits and corrosion.

## PCB Design Process

**Schematic Design**:  
   - The circuit diagram is created to define the electrical connections between components.  
   - This should be the first step in the design process
     - See the [Schematic Design](schematic_design.md) section

**PCB Layout**:  
   - This is the process of placing components on a board.
   - Allows designer to place components where they make sense relative to other components.
   - Gives an early idea of where traces will be routed and how large the board will be 

**Design Rule Check (DRC)**:  
   - Verify the design adheres to manufacturing constraints, such as minimum trace width, clearance, and via sizes.
   - These can be set based on the [JLCPCB's constraints](https://jlcpcb.com/capabilities/pcb-capabilities)

**Gerber File Generation**:  
   - Export the design into Gerber files, these are used to actually produce the board
   - [JLCPCB has a guide](https://jlcpcb.com/help/article/how-to-generate-gerber-files-in-different-software) that explains what files they need for manufacturing

**Fabrication**:  
   - The boards are produced and arrive blank
   - It is a good idea to do some basic tests with a multimeter to check for short circuits.

## Design Guidelines

**Component Placement**:
   - Position components logically, with related components placed close together.
   - Keep high-speed signal traces as short as possible.
   - Place decoupling capacitors near power pins of ICs.
   - Place things in order of importance
     - High speed signals and decoupling capacitors first with things like power last
   - Add test points for easier debugging in signal traces

**Trace Routing**:
   - Use wider traces for higher current-carrying capacity.
   - Avoid sharp angles in traces to reduce impedance changes.
     - Use 45 degree corners
   - Separate analog and digital signal paths to reduce interference.
   - Make sure that sensitive signals have a ground plane under it

**Layer Management**:
   - For two-layer PCBs, one layer is often used for signal routing and the other for ground.
     - Top signal layer can have a power polygon as well to make power routing simpler.
   - For multi-layer PCBs, dedicate inner layers to ground planes.
     - Having two internal ground planes allows for better signal integrity.

**Thermal Considerations**:
   - Use copper pours for better heat spreading for high heat components
   - Add thermal relief connects on ground vias to help with manufacturability.

**Electromagnetic Compatibility (EMC)**:
   - Minimize loop areas in critical signal paths.
   - Use proper grounding and shielding techniques.
     - Add stitching and shielding vias when required

## Common Pitfalls

- Incorrect footprint selection for components.
- Overlapping traces or insufficient clearance.
- Not considering manufacturing tolerances.
- Missing test points for debugging.

### External Resources

- [Phil's Lab on YouTube](https://www.youtube.com/@PhilsLab)
- [Altium Academy](https://www.youtube.com/channel/UCWLoHp3WJG_ats8waVCu7Mw)
- [Robert Feranec Tutorials](https://www.youtube.com/@RobertFeranec)
- [Altium Documentation](https://www.altium.com/documentation/altium-designer/tutorial-complete-design-walkthrough)
- [Common Mistakes](https://youtu.be/D0X76Kbf8fQ?si=wxmHeW_pkwAJdDz_)
