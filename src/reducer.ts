import { handleError } from './errors';
import { AnyRecord, IReduxAction } from './types';
import { isPlainObject } from './utils';

export function glrReducer<TState extends AnyRecord>(
  state: TState | undefined,
  action: IReduxAction
) {
  if (state === undefined) {
    // Start with an empty state. The implementer is in charge of setting the initial state
    state = {} as TState;
  } else {
    // Shallow copy previous state
    state = { ...state };
  }

  const replacedTargets = new Set();
  for (const key in action) {
    if (action.hasOwnProperty(key) && typeof key === 'string' && key !== 'type') {
      if (key === '.') {
        // Special case. Just replace the entire store with this object
        Object.assign(state, action[key]);
      } else {
        const path = key.split('.');
        const failureInfo = shallowDeepSet(state, path, action[key], replacedTargets);
        if (failureInfo) {
          handleError(
            `Couldn't update store at path ${failureInfo.path.join(
              '.'
            )}. Search has ended at path ${failureInfo.path
              .slice(0, failureInfo.pathIndex)
              .join('.')}. This is likely due to not using "val()" wrapper or a corrupted store.`,
            failureInfo
          );
        }
      }
    }
  }

  // Deeply mutated state at this point, where all the nested objects should be recreated
  return state;
}

/**
 * Given a path like "a.b.c", this function automatically does shallow application of that given value:
 * { a: {...target.a, b: { ...target.a.b, c: value } } }
 * If it fails, it returns an object with failure info.
 */
function shallowDeepSet(
  target: object,
  path: string[] | string,
  value: any,
  replacedTargets?: Set<any>,
  pathIndex = 0
): null | { path: string[]; pathIndex: number; target: object; value: any } {
  if (typeof path === 'string') {
    path = [path];
  }

  const key = path[pathIndex];
  if (pathIndex >= path.length - 1) {
    // There is no more path to follow. Set the value here
    if (value !== undefined) {
      target[key] = value;
    } else {
      delete target[key];
    }
    return null;
  }

  if (Array.isArray(target[key])) {
    // There is already an array here. Create a clone if needed.
    if (!replacedTargets || !replacedTargets.has(target[key])) {
      target[key] = target[key].slice();
    }
    if (replacedTargets) {
      replacedTargets.add(target[key]);
    }
  } else if (isPlainObject(target[key])) {
    // There is already a plain object. Clone if needed.
    if (!replacedTargets || !replacedTargets.has(target[key])) {
      target[key] = { ...target[key] };
    }
    if (replacedTargets) {
      replacedTargets.add(target[key]);
    }
  } else if (isPlainObject(target) && target[key] === undefined) {
    // We will allow you to create a series of POJO-s if none exist yet.
    target[key] = {};
    if (replacedTargets) {
      replacedTargets.add(target[key]);
    }
  } else {
    // So the target is like a null or a class instance or something. We can't clone it.
    return {
      path,
      pathIndex,
      target,
      value,
    };
  }

  // Dig deeper
  return shallowDeepSet(target[key], path, value, replacedTargets, pathIndex + 1);
}
