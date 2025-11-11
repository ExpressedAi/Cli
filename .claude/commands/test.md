---
description: "Generate comprehensive test suites with quantum analysis"
---

**QUANTUM TEST GENERATION** 🧪

Generate comprehensive, high-quality tests using quantum enhancement:

## Test Strategy

### Test Types to Generate

**Unit Tests**:
- Test individual functions/methods
- Mock dependencies
- Cover edge cases
- Fast execution

**Integration Tests**:
- Test component interactions
- Real dependencies
- Data flow validation
- API contracts

**E2E Tests**:
- User workflows
- Full system scenarios
- Critical paths
- Happy path + edge cases

**Property-Based Tests**:
- Generative testing
- Invariant validation
- Fuzzing

## Coverage Goals

- **Line Coverage**: > 80%
- **Branch Coverage**: > 75%
- **Function Coverage**: 100%
- **Edge Case Coverage**: Comprehensive

## Test Cases to Generate

### Partitioning Strategy
- Valid inputs
- Invalid inputs
- Boundary values
- Null/undefined/empty
- Extreme values
- Error conditions

### Quantum Navigation
- **Memory Search**: Find similar test patterns
- **Wormhole Navigation**: Discover related test cases
- **COPL Learning**: Apply successful testing strategies

### Neurons Activated
- **Strategist**: Plan test strategy
- **Benchmarker**: Performance tests
- **Red Teamer**: Adversarial test cases
- **Auditor**: Validate coverage

## Test Quality

### Characteristics of Good Tests
- **Fast**: Execute quickly
- **Independent**: No test interdependencies
- **Repeatable**: Same result every time
- **Self-validating**: Clear pass/fail
- **Timely**: Written with code

### AAA Pattern
- **Arrange**: Set up test data
- **Act**: Execute functionality
- **Assert**: Verify results

## Output Format

For each function/component:

1. **Test Suite Structure**
   ```
   describe('ComponentName', () => {
     describe('methodName', () => {
       it('should handle valid input', () => {})
       it('should reject invalid input', () => {})
       it('should handle edge cases', () => {})
     })
   })
   ```

2. **Test Implementations**
   - Complete, runnable tests
   - Proper mocks and fixtures
   - Clear assertions
   - Helpful error messages

3. **Coverage Report**
   - What's covered
   - What gaps remain
   - Recommendations

4. **Performance Tests**
   - Benchmark critical paths
   - Load testing scenarios
   - Memory usage validation

Generate tests that catch bugs before production!
