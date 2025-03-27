import { AnyRecord, StringKeys } from './types';

export class GitLikeReduxValue<TValue = any> {
  public ignore = false;
  public partial = false;
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
  // No duplicate wrapping
  return value instanceof GitLikeReduxValue ? value : (new GitLikeReduxValue(value) as any as T);
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
 *   commit('Add users', val.patchList([
 *     { id: 1, name: 'Jack' },
 *     { id: 2, name: 'Jill' }
 *    ], 'id');
 *   // =>
 *   //   {
 *   //    '1': val({ id: 1, name: 'Jack' }),
 *   //    '2': val({ id: 2, name: 'Jill' })
 *   //   }
 */
glrVal.patchList = <T extends AnyRecord, TKey extends StringKeys<T>>(
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
    if (Object.prototype.hasOwnProperty.call(patch, key)) {
      result[key] = glrVal(patch[key]);
    }
  }
  return result;
};

/**
 * Indicate the wrapped value must be applied as a partial patch.
 * If the object doesn't already exist at this location, the new one will not be created.
 * The patch will just fail silently.
 */
glrVal.partial = <T extends object>(partialPatch: T): T => {
  const result = new GitLikeReduxValue(partialPatch) as any;
  result.partial = true;
  return result;
};
