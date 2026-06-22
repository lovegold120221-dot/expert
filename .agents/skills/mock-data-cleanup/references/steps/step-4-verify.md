# Step 4: Verification

After replacement, verify that the changes are correct and haven't introduced regressions.

## Verification Checklist

1. **Linting & Type Checking**:
    - Run `npm run lint` (or the project's equivalent) to check for syntax or style errors.
    - Run `npm run typecheck` (or `tsc --noEmit`) to ensure all TypeScript types are correct.

2. **Unit & Integration Tests**:
    - Run the existing test suite (e.g., `npm test`) to ensure that the removal of mock data hasn't broken any logic.
    - *Note*: If tests were using the mock data, they may need to be updated to use appropriate test doubles or real data in a controlled way.

3. **Manual Smoke Test**:
    - If possible, run the application (`npm run dev`) and verify that the components/pages that were modified are correctly displaying real data (or the expected data source).

## Final Report

Once verification is complete, report the results to the user:
- ✓ Linting/Typecheck status
- ✓ Test suite status
- Summary of the successful cleanup.
