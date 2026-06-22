# Step 2: Analysis & Review

Once the mock data has been detected, present the findings to the user and propose a replacement strategy.

## Review Process

1. **Summarize Findings**: Group the detected mock data by type (e.g., "Global Constants", "Component-local stubs", "Hardcoded arrays").
2. **Propose Replacement Strategy**: For each group, suggest how to replace it.
    - *Example*: "Replace `MOCK_USER` in `src/components/Profile.tsx` with a call to the `useAuth` hook."
    - *Example*: "Replace the hardcoded product list in `src/pages/Products.tsx` with a `fetch` call to the `/api/products` endpoint."
3. **Identify Dependencies**: Note if replacing a piece of mock data will require changes to multiple files (e.g., updating a TypeScript interface).

## User Confirmation

**DO NOT proceed to replacement without explicit user approval of the proposed strategy.**

If the user asks to "use real data skills", prioritize using the most idiomatic and robust data fetching patterns found in the current codebase.

## Output

A structured summary of:
- Detected mock items.
- Proposed replacement for each item.
- Potential impact/dependencies.
