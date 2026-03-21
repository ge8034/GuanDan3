import { expect } from 'vitest'
import { axe } from 'jest-axe'

expect.extend({
  toHaveNoViolations(received: any) {
    const violations = received.violations || []
    const pass = violations.length === 0

    return {
      pass,
      message: () => {
        if (pass) {
          return 'Expected to have accessibility violations, but found none'
        }
        return `Expected to have no accessibility violations, but found ${violations.length}:\n${JSON.stringify(violations, null, 2)}`
      }
    }
  }
})
