declare module 'spacetime:sys@2.0';
declare module 'object-inspect';
declare module 'statuses';

declare global {
  interface SymbolConstructor {
    readonly dispose: symbol;
    readonly asyncDispose: symbol;
  }

  interface Disposable {
    [Symbol.dispose](): void;
  }

  interface AsyncDisposable {
    [Symbol.asyncDispose](): PromiseLike<void>;
  }

  interface PromiseConstructor {
    withResolvers<T>(): {
      promise: Promise<T>;
      resolve: (value: T | PromiseLike<T>) => void;
      reject: (reason?: unknown) => void;
    };
  }
}

export {};