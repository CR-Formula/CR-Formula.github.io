---
title: Manufacturing
parent: Hardware
nav_order: 5
---

# Manufacturing
There are a few ways to manufacture a PCB and the strategies change depending on what type of components you are using. As of CR-28/CR-29, all of the boards use primarily surface mount (SMD) components. This page will cover the manufacturing steps for through-hole, and surface mount components, as well as how to fix some common problems.

# Surface Mount Device (SMD)
Surface mount components are much smaller than through-hole options. This allows for smaller board designs and the ability to make more complex circuits. Surface mount components can be soldered many ways, including with a soldering iron, hot plate, PCB oven, or hot air rework. For initial board assembly, it is best to use a PCB oven and a board stencil. This allows easier application of solder paste, and has a much higher success rate than soldering by hand. The PCB oven on campus is in the ECE Senior Design lab (1301), if you don't have the code just talk to ETG (1331).
**Materials Needed**
- PCB
- Solder paste
- Solder paste stencil
- Squeegee or credit card (for spreading solder paste)
- Surface-mount components
- Tweezers
- PCB holder, alignment jig, or old PCBs
- Tape
- Reflow oven

**1. Prepare the Workspace**
- Ensure the workspace is clean and free of dust.
- Gather all required materials and components for the assembly.

**2. Align the Stencil**
- Place the PCB on a flat surface.
- Place other PCBs around it to hold the PCB in place.
- Tape down the boards so they don't move, avoid taping under where the stencil will be.
- Align the stencil over the PCB so that the openings in the stencil match the component pads on the PCB.
- Tape down the stencil, avoid covering any of the pads 

**3. Apply Solder Paste**
- Place a small amount of solder paste on one edge of the stencil.
- Use a squeegee or similar tool to spread the solder paste across the stencil, ensuring even coverage over all the openings.
- Remove excess solder paste for clean and precise application.

**4. Remove the Stencil**
- Carefully lift the stencil straight up to avoid smudging the solder paste on the PCB.
- Inspect the PCB to ensure the solder paste is evenly applied to all pads.

**5. Place Components**
- Using tweezers, place surface-mount components onto the PCB. Ensure each component aligns with its corresponding solder paste pads.
- **Double-check** the orientation of polarized components like diodes and capacitors.
- **Double-check** the placement of ICs to make sure the pins line up correctly.

**6. Reflow Soldering**
- Place the PCB inside the oven and start the reflow process.
- Allow the solder paste to melt and bond the components to the PCB as the oven follows its temperature cycle.
- Once the reflow process is complete, let the PCB cool before handling.

**7. Inspect the PCB**
- Inspect the solder joints for quality. Each joint should be shiny and properly bonded without excess solder or bridging.
- Inspect the board for any bridged pins or shifted components.
- Rework any problematic joints with a soldering iron or hot air station if necessary.

**8. Clean the PCB**
- If using flux-containing solder paste, clean the PCB with isopropyl alcohol and a soft brush to remove any residue.

**Tips for Success**
- Use a small amount of solder paste to avoid over-application.
- Ensure proper alignment of the stencil to prevent uneven solder paste distribution.

**Tips for Reworking Joints**
- Use lots of extra flux, this helps the solder flow
- Heat up a soldering iron and drag the tip across any bridged pins to spread out the solder
- Can use solder wick to pick up extra solder if there is too much on a pin.
- Hot air can be used to replace components and may be easier on smaller components.

# Through Hole
The easiest way to assemble through hole components is by hand. The best places to do this on campus are in Coover: the **TLA** (1313) and the **Signals Lab** (2011). It is best to use leaded solder with flux, or add flux when soldering. Follow these steps to solder a through-hole component to a PCB:
**1. Prepare the PCB and Component:**
  - Ensure the PCB is clean and free of dust or residue.
  - Insert the through-hole component leads into the designated holes on the PCB.

**2. Secure the Component:**
  - Flip the PCB over and slightly bend the component leads outward to hold it in place.
  - Alternatively, use tape or a PCB holder to secure the component.

**3. Heat the Joint:**
  - Turn on the soldering iron and let it reach the appropriate temperature (typically 350–400°C).
  - Place the soldering iron tip on the copper pad and the component lead simultaneously.

**4. Apply Solder:**
  - Feed solder wire into the heated joint (not directly onto the soldering iron).
  - Allow the solder to flow smoothly, forming a shiny cone shape around the joint.

**5. Remove the Heat:**
  - Remove the soldering iron immediately after the solder flows to avoid overheating or damaging the component.

**6. Trim Excess Leads:**
  - Use flush cutters to trim any excess lead sticking out of the joint.

**7. Inspect the Joint:**
  - Ensure the solder joint is shiny and has a good "volcano" shape.
  - Check for cold joints (dull or incomplete connections) or excess solder.

**8. Repeat for Other Components:**
  - Continue soldering each through-hole component, one at a time.

**9. Clean the PCB:**
  - Use isopropyl alcohol and a brush to remove flux residue if necessary.