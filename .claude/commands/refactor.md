---
description: "Intelligent code refactoring with complexity reduction"
---

**QUANTUM REFACTORING MODE** ♻️

Improve code structure and maintainability using quantum analysis:

## Analysis Phase

### Code Smell Detection
- Long methods (> 50 lines)
- Large classes (> 300 lines)
- Long parameter lists (> 4 params)
- Duplicate code blocks
- Complex conditionals (cyclomatic complexity > 10)
- God objects
- Feature envy
- Data clumps
- Primitive obsession

### Complexity Analysis
- Cyclomatic complexity per function
- Cognitive complexity
- Nesting depth
- Coupling and cohesion metrics

## Refactoring Catalog

### Extract Method
- Break down long methods
- Improve testability
- Enhance readability

### Extract Class
- Split large classes
- Improve single responsibility
- Reduce coupling

### Introduce Parameter Object
- Replace long parameter lists
- Improve API clarity
- Enable evolution

### Replace Conditional with Polymorphism
- Eliminate complex if/switch
- Leverage OOP
- Improve extensibility

### Extract Interface
- Define abstractions
- Enable dependency injection
- Improve testability

### Inline
- Remove unnecessary indirection
- Simplify where appropriate

### Rename
- Improve naming consistency
- Enhance clarity
- Follow conventions

## Quantum Enhancement

- **Code Analysis Tools**: Detect smells and metrics
- **Memory Navigation**: Find refactoring patterns from similar code
- **COPL Learning**: Apply successful refactoring strategies
- **Neurons Activated**:
  - **Appraiser**: Evaluate refactoring impact
  - **Forge**: Implement improvements
  - **Auditor**: Validate correctness preserved

## Output Format

1. **Current State Assessment**
   - Code smells found
   - Complexity metrics
   - Maintainability score

2. **Refactoring Plan**
   - Prioritized improvements
   - Before/after code examples
   - Expected benefits

3. **Implementation**
   - Refactored code
   - Tests to verify behavior unchanged
   - Migration notes if needed

4. **Impact Analysis**
   - Complexity reduction
   - Readability improvement
   - Performance impact (if any)

Apply the Boy Scout Rule: Leave code better than you found it.
