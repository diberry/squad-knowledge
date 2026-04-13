# Team Decision: Error Handling Strategy

**Date:** 2024-01-15
**Owner:** team-lead
**Status:** Approved

## Summary

Establish standardized error handling across all services and agent code.

## Principles

Always wrap I/O operations in try-catch blocks. Log errors with full context including stack traces and request metadata.

Use custom error classes for domain-specific error types. Never swallow exceptions without logging.

Validate all user input at the boundary. Use async/await for all async operations.

Always check for null before accessing object properties. Prefer optional chaining when available.
