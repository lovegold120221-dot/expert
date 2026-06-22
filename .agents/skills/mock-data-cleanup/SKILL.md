---
name: mock-data-cleanup
description: "Detects and removes mock data from source code, replacing it with real data patterns. WHEN: \"remove mock data\", \"find mock data\", \"replace mock data\", \"clean up mock data\", \"detect mock data\"."
license: MIT
metadata:
  author: opencode
  version: "1.0.0"
  argument-hint: "[skip-to-step N]"
---

# Mock Data Cleanup

This skill identifies hardcoded mock data, constants, or fake objects within the codebase and facilitates their replacement with production-ready data fetching or real data integration.

## Quick Reference

| Property | Value |
|----------|-------|
| Best for | Removing hardcoded test/mock data and integrating real data sources |
| CLI tools | `grep`, `find`, `npm test`, `npm run lint` |
| MCP tools | None |
| Related skills | `investigate` (for debugging data issues) |

## When to Use This Skill

Use this skill when the user wants to:
- Find all instances of hardcoded mock data in the project.
- Remove mock data to prepare for production deployment.
- Replace fake data with real API calls or database queries.
- Ensure the application is using real data sources instead of stubs.

## Rules

1. **Detect first, ask second** — Always perform a thorough scan before proposing any changes.
2. **Preserve Logic** — When replacing mock data, ensure the surrounding business logic and component structures are preserved.
3. **Prefer Real Data Patterns** — When replacing, lean towards idiomatic data fetching (e.g., hooks, services, or API clients) used in the existing codebase.
4. **Verification is Mandatory** — Every replacement must be followed by a verification step (linting, type checking, and tests).
5. **Atomic Changes** — Perform replacements in a way that maintains a working state at each step if possible.

## Steps

| # | Step | Reference |
|---|------|-----------|
| 1 | **Mock Detection** — Scan codebase for mock patterns and constants | [step-1-detect.md](references/steps/step-1-detect.md) |
| 2 | **Analysis & Review** — Present found items and proposed replacement strategy | [step-2-review.md](references/steps/step-2-review.md) |
| 3 | **Data Replacement** — Replace mock objects with real data integration | [step-3-replace.md](references/steps/step-3-replace.md) |
| 4 | **Verification** — Run lint, typecheck, and existing tests | [step-4-verify.md](references/steps/step-4-verify.md) |

## Error Handling

| Error / Symptom | Likely Cause | Remediation |
|-----------------|--------------|-------------|
| Mock data still exists | Scan missed a pattern | Refine regex/patterns in detection step |
| Replacement broke types | Incompatible real data structure | Update TypeScript interfaces/types |
| Tests failing after replacement | Mock data was used as dependency in tests | Update tests to use real data or appropriate test doubles |
