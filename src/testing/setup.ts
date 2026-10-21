/**
 * Registers the jest-dom matchers with Vitest.
 *
 * The `/vitest` entry point is the one that augments Vitest's `Assertion`
 * type. The bare `@testing-library/jest-dom` import augments Jest's, so the
 * matchers (`toBeInTheDocument`, `toHaveTextContent`, ...) resolve at runtime
 * but are invisible to `tsc`, which fails the build on every test file.
 */
import '@testing-library/jest-dom/vitest'