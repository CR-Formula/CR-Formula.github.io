---
title: Schematic Design
parent: Hardware
nav_order: 2
---

# Schematic Design Basics

**Schematic Design** is the foundational step in the electronic circuit design process. It involves creating a graphical representation of the circuit, which shows how components are electrically connected. The schematic serves as a blueprint for PCB design and aids in troubleshooting and documentation.


## Key Elements of a Schematic

- **Symbols**: Graphical representations of components, such as resistors, capacitors, and ICs.
- **Nets**: Lines connecting component pins to indicate electrical connections.
- **Designators**: Unique identifiers for components (e.g., R1, C2, U3).
- **Power and Ground**: Clearly marked connections for power (e.g., VCC) and ground (GND).
- **Annotations**: Text labels for voltage levels, test points, or important notes.

## Schematic Design Process

**Define Circuit Requirements**:
   - Create a block diagram for your design 
   - Understand the design objectives and constraints, such as voltage levels, current requirements, and desired functionality.

**Select Components**:
   - Choose appropriate components (resistors, capacitors, ICs, etc.) based on specifications like operating voltage, tolerance, and power ratings.
   - Keep in mind the SAE rules when designing EV boards

**Draw the Schematic**:
   - Use an ISO A3 with metric units
   - Place components logically, connecting them with wires or nets to represent electrical connections.
   - Make things easy to read, you can use as many power and ground ports as you want
   - Use net names to avoid running connections all across the page

**Add Supporting Elements**:
   - Include labels, part numbers, and designators (e.g., R1, C1) for clarity.
     - Altium can automatically name components for you
     - Add comments with the component values to make things readable
   - Add decoupling capacitors, pull-up/pull-down resistors, and other necessary elements to ensure stability and functionality.

**Simulate the Circuit (Analog circuits)**:
   - Use simulation tools to verify circuit behavior before moving to the PCB design phase.
     - LTSpice is recommended for this
   - Can be used to sanity check parts of digital boards like power supplies.

**Review and Validate**:
   - Perform a thorough review to check for missing or incorrect connections, unconnected pins, and design rule violations.
   - Altium can also be configured to check some of these things, check their documentation page for more details.


## Best Practices for Schematic Design

**Logical Component Placement**:
   - Arrange components logically
   - Group related components together for easier understanding.
   - Make the groups easily understandable.

**Clear Connections**:
   - Avoid overlapping wires or crossing nets unnecessarily.
   - Use labels for shared connections instead of long wires.
   - Use multiple sheets for larger designs.

**Hierarchical Design**:
   - For complex circuits, divide the schematic into smaller sections or modules.
   - Use hierarchical blocks to represent subsystems.

**Use Standard Symbols**:
   - Follow industry standards for component symbols to maintain consistency and clarity.
   - Keep the symbols consistent.

**Documentation**:
   - Add detailed annotations, including voltage levels, pin functions, and reference part numbers.
   - Add important distinctions for frequencies or circuit gain.

**Design for Debugging**:
   - Include test points and connectors to facilitate troubleshooting.


## Common Mistakes to Avoid

- Missing or incorrect connections between components.
- Floating pins (unconnected pins that should be connected to power, ground, or other signals).
- Using the wrong symbol for a component.
- Forgetting decoupling capacitors near ICs.
- Not assigning unique designators to components.


## Next Steps

**Transition to PCB Design**:
   - Use the schematic as a basis to place components and route traces on the PCB.
   - [PCB Design](pcb_design.md)

**Simulate and Test**:
   - If necessary, simulate the circuit using EDA tools to validate the design.

### External Resources

- [Phil's Lab on YouTube](https://www.youtube.com/@PhilsLab)
- [Altium Academy](https://www.youtube.com/channel/UCWLoHp3WJG_ats8waVCu7Mw)
- [Robert Feranec Tutorials](https://www.youtube.com/@RobertFeranec)
- [Altium Documentation](https://www.altium.com/documentation/altium-designer/tutorial-complete-design-walkthrough)
- [Common Mistakes](https://youtu.be/D0X76Kbf8fQ?si=wxmHeW_pkwAJdDz_)

