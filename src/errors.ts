import { AnyRecord } from './types';

export class GLRError extends Error {
  public info: AnyRecord;

  constructor(message: string, info: AnyRecord) {
    // Fix typescript custom Error prototype chain
    // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    // https://github.com/reduardo7/ts-base-error/blob/master/src/index.ts
    const trueProto = new.target.prototype;

    super(message);

    Object.setPrototypeOf(this, trueProto);

    this.info = info;
  }
}

export type IGLRErrorHandler = (message: string, info: AnyRecord) => void;

let _errorHandler: IGLRErrorHandler = null;

export function handleError(message: string, info: AnyRecord) {
  if (_errorHandler) {
    _errorHandler(message, info);
  }

  // By default, we throw the error, letting someone up the stack deal with it
  throw new GLRError(message, info);
}

/**
 * Set function that will be called in case of an error.
 */
export function glrSetErrorHandler(errorHandler: IGLRErrorHandler | null) {
  _errorHandler = errorHandler;
}
