# Security Review Skill

Auto-invoked workflow for performing security reviews on code changes.

## Trigger

Use when asked to review code for security issues, vulnerabilities, or before merging sensitive changes.

## Workflow

1. Scan for common vulnerabilities (OWASP Top 10)
2. Check for hardcoded secrets or credentials
3. Verify input validation and sanitization
4. Review authentication and authorization logic
5. Check for insecure dependencies
6. Report findings with severity levels: CRITICAL, HIGH, MEDIUM, LOW

## Output

Provide a structured security report with:
- Summary of findings
- Per-issue details with file:line references
- Recommended fixes
