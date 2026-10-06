# Testing in Oxenn

This document outlines the testing strategy, tools, and organization for the Oxenn repository.

## Vitest Adoption

We have fully migrated to Vitest. All test suites run under a single runner.

### Projects

1. **unit**:
   - Environment: `node`
   - Location: `tests/unit/**/*.test.ts`
   - Description: Fast, isolated tests. They must NOT access `process.env.DATABASE_URL` or require any external service.

2. **db**:
   - Environment: `node`
   - Location: `tests/db/**/*.test.ts`
   - Description: Integration tests that require a real database connection. These tests will fail if `DATABASE_URL` is missing.

3. **ui**:
   - Environment: `jsdom`
   - Location: `tests/ui/**/*.test.ts`, `tests/ui/**/*.test.tsx`
   - Description: Frontend component tests. Stubs for `matchMedia`, `ResizeObserver`, and `IntersectionObserver` are pre-configured.

### Adding UI Tests (FE-002...FE-012)

You can add React component tests without installing any new dependencies.
We already have `@testing-library/react`, `@testing-library/user-event`, and `@testing-library/jest-dom` set up.

Simply create your test file in `tests/ui/` (e.g., `tests/ui/marketing/HeroAccessCard.test.tsx`):

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HeroAccessCard } from '@/components/HeroAccessCard';
import { expect, test } from 'vitest';

test('HeroAccessCard renders and handles inputs', async () => {
  const user = userEvent.setup();
  render(<HeroAccessCard />);

  const btn = screen.getByRole('button');
  expect(btn).toBeInTheDocument();
});
```

**Note on FE Logical-Property Linting:**
The FE logical-property lint (banning `ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-` in CSS modules or utility classes) is considered a static analysis check. It should be implemented as a unit test and placed in the **unit** project (`tests/unit/linting/logical-properties.test.ts`).
