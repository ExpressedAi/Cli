---
description: "Apply Momentum Recursion pattern for complex tasks"
---

Execute **MOMENTUM RECURSION** pattern ♻️

Apply the four-phase recursive pattern for systematic problem solving:

## The Four Phases

### 1. **Clarify** 🎯
**Operations**: Interpret, Evaluate, Discriminate, Compare
- Understand requirements clearly
- Resolve ambiguities
- Define success criteria
- Min confidence: 0.7

### 2. **Architect** 🏗️
**Operations**: Propose, Compare, Harmonize, Align
- Design approach
- Identify dependencies
- Assess risks
- Min confidence: 0.75

### 3. **Work** ⚙️
**Operations**: Execute, Manifest, Integrate, Transform
- Implement solution
- Create artifacts
- Run tests
- Min confidence: 0.8

### 4. **Audit** ✅
**Operations**: Evaluate, Benchmark, Compare, Refute
- Validate quality
- Verify requirements met
- Check for regressions
- Min confidence: 0.85

## Recursion Behavior

If a phase fails or has low confidence:
- **Audit** fails → recurse to **Work**
- **Work** fails → recurse to **Architect**
- **Architect** fails → recurse to **Clarify**
- Max recursion depth: 5

## Your Task

Execute the full Momentum Recursion cycle for the user's request:

1. Start with Clarify phase
2. Progress through each phase
3. Recurse if needed (show recursion decisions)
4. Report outputs, issues, and recommendations from each phase
5. Show final result with confidence scores

Make the recursive improvement visible - show when and why you recurse back to earlier phases.
