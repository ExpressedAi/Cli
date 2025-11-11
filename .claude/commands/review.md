---
description: "Comprehensive code review with quality metrics"
---

**QUANTUM CODE REVIEW** 🔍

Perform deep, thorough code review using all quantum systems:

## Review Dimensions

### 1. **Correctness** ✓
- Logic errors
- Edge cases handled
- Error handling
- Type safety
- Null safety

### 2. **Readability** 📖
- Clear naming
- Appropriate comments
- Code organization
- Consistent style
- Self-documenting code

### 3. **Maintainability** 🔧
- Low complexity
- No code smells
- Good abstractions
- Testability
- Documentation

### 4. **Performance** ⚡
- Algorithm efficiency
- Resource usage
- Unnecessary operations
- Caching opportunities
- Scalability

### 5. **Security** 🛡️
- Input validation
- Injection vulnerabilities
- Authentication/authorization
- Data exposure
- Dependency vulnerabilities

### 6. **Best Practices** ⭐
- Design patterns
- SOLID principles
- DRY (Don't Repeat Yourself)
- YAGNI (You Aren't Gonna Need It)
- Language idioms

## Review Process

### Automated Checks
- **Code Analysis Tools**: Complexity, smells, metrics
- **Security Scan**: Vulnerability detection
- **Lint**: Style and standards
- **Type Check**: Static analysis

### Quantum Enhancement
- **Memory Navigation**: Find similar code for comparison
- **COPL Patterns**: Apply learned best practices
- **Neuron Activation**:
  - **Historian**: Verify against documentation
  - **Appraiser**: Evaluate quality
  - **Auditor**: Validate requirements
  - **Red Teamer**: Find edge cases
- **PPQ Introspection**: High-confidence review

### Manual Review Focus
- Business logic correctness
- API design
- User experience
- Error messages
- Edge cases

## Feedback Structure

### Issue Severity
- 🔴 **Critical**: Must fix (security, correctness)
- 🟡 **Major**: Should fix (performance, maintainability)
- 🔵 **Minor**: Nice to fix (style, naming)
- 💡 **Suggestion**: Consider (alternative approaches)

### Feedback Format
```
[SEVERITY] Issue Title
Location: file.ts:123

Problem:
Clear description of the issue

Impact:
Why this matters

Recommendation:
Specific fix with code example

Alternative:
Other approaches if applicable
```

## Review Checklist

- [ ] Code compiles without errors
- [ ] All tests pass
- [ ] New tests added for new functionality
- [ ] No security vulnerabilities
- [ ] Performance acceptable
- [ ] Documentation updated
- [ ] Breaking changes documented
- [ ] Backwards compatibility considered
- [ ] Error handling comprehensive
- [ ] Logging appropriate
- [ ] No hardcoded secrets
- [ ] Configuration externalized

## Output Format

1. **Executive Summary**
   - Overall assessment
   - Key strengths
   - Major concerns
   - Recommendation (approve/request changes)

2. **Detailed Findings**
   - Categorized by dimension
   - Severity-sorted
   - Specific line references

3. **Code Quality Metrics**
   - Complexity scores
   - Test coverage
   - Code smell count
   - Maintainability index

4. **Positive Feedback**
   - What was done well
   - Good patterns to replicate
   - Improvements over previous code

5. **Action Items**
   - Prioritized fixes
   - Estimated effort
   - Suggested timeline

Be constructive, specific, and educational in reviews!
