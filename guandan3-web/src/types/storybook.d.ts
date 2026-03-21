declare module '@storybook/react' {
  export type Meta<T> = {
    title: string
    component: any
    parameters?: any
    tags?: string[]
    argTypes?: any
    args?: any
  }

  export type StoryObj<T> = {
    args?: any
    render?: (args: any) => React.ReactNode
    parameters?: any
    decorators?: any[]
  }
}

declare module '@storybook/test' {
  export function fn(): jest.Mock
}
