---
title: Requirements
parent: System Design
nav_order: 2
---

# Requirements
Defining requirements is one of the most important steps in systems design. It is the *first* thing that should be done each year. It is extremely important to know what each board does, and how they interact before they are designed. When creating requirements, it is important to write precise statements that thoroughly explain what the board or software component should be doing. Make sure to include metrics such as data rates, interfaces, specialty connectors, or any physical limitations. Requirements for each board, and if applicable board software, should be included in the first section of the design report.

# Writing Requirements for Embedded System Design

This page provides an overview of best practices and guidelines for writing requirements specifically tailored to embedded system design. Embedded systems often have unique constraints and considerations—such as limited computational resources, real-time responsiveness, and hardware-software interplay—that necessitate rigorous, clear, and testable requirements.

## Why Requirements Matter
1. **Scope Definition**: Requirements establish the scope and boundaries of the project.  
2. **Cost and Schedule Control**: Clear requirements enable more accurate cost and time estimations, reducing the risk of overruns.  
3. **Quality Assurance**: Well-defined requirements act as a baseline for testing and validation, ensuring that the delivered system meets its intended purpose.  
4. **Risk Management**: Identifying requirements early helps uncover technical challenges and potential risks before they impact the development cycle.  

## Characteristics of Well-Written Requirements
- **Clear**: Avoid jargon and ambiguity. Each requirement should have only one interpretation.  
- **Concise**: Keep statements short and to the point. Lengthy or compound statements can be difficult to test.  
- **Verifiable**: You should be able to test or measure whether the requirement has been met.  
- **Necessary**: Every requirement should be essential for system function or compliance.  
- **Feasible**: Requirements must be technically and legally achievable within resource constraints.  
- **Prioritized**: Critical vs. optional requirements should be clearly identified.  


## Types of Requirements
Embedded systems often need multiple layers of requirements, including:

1. **Functional Requirements**  
   - Define what the system *must do*.  
   - Examples: data processing algorithms, sensor input handling, communication protocols.

2. **Non-Functional Requirements**  
   - Define *how* the system must behave under certain conditions.  
   - Examples: response time, power consumption, reliability, memory usage limits.

3. **Hardware Requirements**  
   - Specify hardware constraints and specifications.  
   - Examples: CPU architecture, RAM size, sensor accuracy, operating voltage range.

4. **Interface Requirements**  
   - Describe how the system communicates with external systems, devices, or users.  
   - Examples: communication standards (SPI, I2C, UART), software APIs, user interface protocols.

5. **Compliance and Regulatory Requirements**  
   - Outline standards or regulations the system must comply with.  
   - Examples: ISO 26262 (automotive), IEC 60601 (medical devices), FCC regulations (wireless communication).

6. **Performance and Safety Requirements**  
   - State critical performance metrics and safety constraints.  
   - Examples: maximum operational temperature, fail-safe modes, real-time constraints for sensor data processing.

## Best Practices for Writing Requirements
1. **Use a Standard Template**  
   - Maintain consistency by using a predefined format for all requirement statements.  
   - Include fields like: *ID*, *Description*, *Rationale*, *Priority*, *Verification Method*.

2. **Requirements Tracking**  
   - The team uses Git and Git issues to track progress
   - GitHub Projects are split up by board or MCU depending on how many systems use the MCU

3. **Engage Engineers Early**  
   - Collaborate with hardware engineers, firmware engineers, and other subsystems.
   - Conduct requirement reviews or workshops to refine and validate requirements.

4. **Consider Worst-Case Scenarios**  
   - Embedded systems can operate in harsh or unpredictable environments.  
   - Include requirements for environmental stress (temperature, humidity), electrical interference, and power anomalies related to the car.

5. **Iterate and Refine**  
   - Requirements evolve. Maintain an iterative process for requirement review and updates.  
   - Use versioning to keep track of changes and decisions.
   - This can be tracked through the git issues and design documents.

## Common Pitfalls
1. **Ambiguity**  
   - Example: “The system shall respond quickly.” What does “quickly” mean? Provide a quantifiable metric like “within 10 ms.”  

2. **Over-Specification**  
   - Providing too many low-level details can limit design choices and discourage creativity.  
   - Balance detail with flexibility.

3. **Under-Specification**  
   - Vague requirements lead to guesswork and misinterpretation.  
   - Important constraints might be overlooked, leading to suboptimal design or missed functionality.

4. **Lack of Verification Method**  
   - Unclear how to test or measure certain requirements.  
   - Always define a method (e.g., simulation, prototyping, inspection, or measurement).

5. **Ignoring External Constraints**  
   - Failing to consider regulatory and safety standards can lead to non-compliant designs.  
   - Missing these requirements can result in costly rework.

6. **Poor Change Management**  
   - Requirements often change, but uncontrolled change can wreak havoc on project scope.  
   - Use formal processes for logging, reviewing, and approving changes.