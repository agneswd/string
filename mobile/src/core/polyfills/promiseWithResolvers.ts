type PromiseWithResolversResult<T> = {
  promise: Promise<T>
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: unknown) => void
}

type PromiseConstructorWithResolvers = PromiseConstructor & {
  withResolvers?: <T>() => PromiseWithResolversResult<T>
}

const PromiseWithResolversPolyfill = Promise as PromiseConstructorWithResolvers

if (typeof PromiseWithResolversPolyfill.withResolvers !== 'function') {
  PromiseWithResolversPolyfill.withResolvers = function withResolvers<T>() {
    let resolve!: (value: T | PromiseLike<T>) => void
    let reject!: (reason?: unknown) => void

    const promise = new Promise<T>((nextResolve, nextReject) => {
      resolve = nextResolve
      reject = nextReject
    })

    return { promise, resolve, reject }
  }
}
