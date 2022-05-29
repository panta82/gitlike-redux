import { AnyRecord, StringKeys } from './types';

export class GitLikeReduxValue<TValue = any> {
  public ignore = false;
  public value: TValue;

  constructor(value: TValue) {
    this.value = value;
  }
}

/**
 * Use this helper to wrap every value you want to set.
 * @example
 *   commit('my message', { x: val(something) });
 */
export function glrVal<T>(value: T): T {
  return new GitLikeReduxValue(value) as any as T;
}

/**
 * If you want value to be ignored, you can pass this.
 * Useful for ternary expressions.
 * @example
 *    commit('set x maybe', { x: enabled ? val('value to set') : val.ignore });
 */
glrVal.ignore = new GitLikeReduxValue(undefined) as any;
glrVal.ignore.ignore = true;

/**
 * Turn a list of items into a patch to be applied to the target store.
 * @example
 *   commit('Add users', val.patchify([
 *     { id: 1, name: 'Jack' },
 *     { id: 2, name: 'Jill' }
 *    ], 'id');
 *   // =>
 *   //   {
 *   //    '1': val({ id: 1, name: 'Jack' }),
 *   //    '2': val({ id: 2, name: 'Jill' })
 *   //   }
 */
glrVal.patchify = <T extends AnyRecord, TKey extends StringKeys<T>>(
  items: T[],
  keyProp: TKey = 'id' as any
): { [key: string]: T } => {
  const patch = {} as any;
  for (const item of items) {
    const key = item[keyProp];
    patch[key] = glrVal(item);
  }
  return patch;
};

/**
 * Wrap every property of given object into val().
 * @example
 *  commit('Update user', val.patchMap({id: 5, name: 'John'}));
 *  // =>
 *  // { id: val(5), name: val('John') }
 */
glrVal.patchMap = <T extends object>(patch: T): T => {
  const result = {} as T;
  for (const key in patch) {
    if (
      Object.prototype.hasOwnProperty.call(patch, key) &&
      !(patch[key] instanceof GitLikeReduxValue)
    ) {
      result[key] = glrVal(patch[key]);
    }
  }
  return result;
};
