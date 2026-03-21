declare module 'jest-axe' {
  export interface AxeResults {
    passes: any[]
    violations: any[]
    incomplete: any[]
    passesTotal: number
    violationsTotal: number
    incompleteTotal: number
  }

  export function axe(element: HTMLElement | string, options?: any): Promise<AxeResults>
}

declare global {
  namespace Vi {
    interface Matchers<R = any> {
      toHaveNoViolations(): R
    }
  }
}
