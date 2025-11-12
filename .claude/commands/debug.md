---
description: "Advanced debugging with root cause analysis"
---

**QUANTUM DEBUG MODE** 🐛

Systematic debugging using quantum-enhanced analysis:

## Phase 1: Problem Understanding

### Information Gathering
- Error messages and stack traces
- Reproduction steps
- Expected vs. actual behavior
- Environment details
- Recent changes

### Preflection Analysis
- Categorize issue type (logic bug, race condition, config, etc.)
- Assess complexity
- Determine investigation strategy

## Phase 2: Root Cause Analysis

### Investigation Techniques

**Trace Execution Flow**:
- Follow code path
- Identify decision points
- Track variable states

**Analyze Dependencies**:
- External services
- Database queries
- File I/O
- Network calls
- Third-party libraries

**Check Assumptions**:
- Input validation
- Boundary conditions
- State consistency
- Timing and ordering

**Memory Navigation**:
- Search for similar bugs previously encountered
- Retrieve debugging patterns that worked
- Find related code sections via wormholes

### Neurons Activated
- **Orchestrator**: Synthesize findings
- **Simulator**: Model the bug scenario
- **Historian**: Validate against documentation
- **Red Teamer**: Think adversarially about edge cases

## Phase 3: Hypothesis Formation

Generate and test hypotheses:

1. **State hypothesis**: What we think is causing the bug
2. **Make prediction**: What we expect to observe
3. **Test**: Add logging, breakpoints, or tests
4. **Evaluate**: Confirm or refute hypothesis

Use Momentum Recursion: Iterate until root cause found.

## Phase 4: Fix Implementation

### Fix Strategies
- Minimal change principle
- Add defensive programming
- Improve error handling
- Add tests to prevent regression
- Document the fix

### Validation
- Verify fix resolves original issue
- Check for side effects
- Run full test suite
- Validate in production-like environment

## COPL Learning

Record this debugging session:
- Bug pattern
- Root cause type
- Investigation steps that worked
- Time to resolution

Learn for next time!

## Output Format

1. **Bug Analysis**
   - Symptom description
   - Root cause identified
   - Why it happened

2. **Investigation Log**
   - Hypotheses tested
   - Evidence gathered
   - Aha moment

3. **Fix Implementation**
   - Code changes
   - Tests added
   - Verification steps

4. **Prevention**
   - How to catch this earlier (linting, types, tests)
   - Similar issues to look for
   - Monitoring to add

Be methodical, thorough, and learn from every bug.
