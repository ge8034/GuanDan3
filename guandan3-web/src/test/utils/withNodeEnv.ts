export const withNodeEnv = async <T>(env: string, fn: () => Promise<T> | T): Promise<T> => {
  const prevEnv = process.env.NODE_ENV
  ;(process.env as any).NODE_ENV = env
  try {
    return await fn()
  } finally {
    ;(process.env as any).NODE_ENV = prevEnv
  }
}
