# Step 1: Mock Detection

In this step, perform a comprehensive scan of the codebase to identify hardcoded mock data.

## Detection Patterns

Look for the following common patterns:

### 1. Variable Naming
- `MOCK_*` (e.g., `MOCK_USER`, `MOCK_PRODUCTS`)
- `*Mock*` (e.g., `testData`, `fakeUser`, `dummyResponse`)
- `*Stub*` (e.g., `userStub`)

### 2. Object Content
- Objects containing obviously fake information (e.g., `name: "John Doe"`, `email: "test@example.com"`, `id: "12345"`, `username: "testuser"`).
- Arrays of objects that look like repetitive test data.

### 3. Comments
- `// mock data`
- `// TODO: replace with real data`
- `// hardcoded for testing`

## Execution Plan

1. **Global Search**: Use `grep` or similar tools to search for naming patterns (e.g., `grep -r "MOCK_" src/`).
2. **Content Inspection**: Manually inspect files that match naming patterns to confirm if the data is truly "mock" and not just a constant used in production.
3. **Identify Scope**: Determine if the mock data is local to a component/file or shared via a `constants.ts` or `data.ts` file.

## Output

Provide a list of all identified mock data locations in the following format:
- `file_path:line_number`: `Variable Name / Description`
