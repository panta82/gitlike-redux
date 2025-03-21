import { handleError } from './errors';
import { AnyRecord, IReduxAction } from './types';
import { isPlainObject } from './utils';

type IPathSegment = string | [value: string, mustExist: boolean];

export function keyToPathSegments(key: string): IPathSegment[] {
  const result: IPathSegment[] = [];
  let fromIndex = 0;

  for (let i = 0; i < key.length; i++) {
    const isDot = key[i] === '.';
    const isBang = key[i] === '!';

    if (isDot || isBang) {
      const segment = key.slice(fromIndex, i);
      if (isBang) {
        result.push([segment, true]);
      } else {
        result.push(segment);
      }
      fromIndex = i + 1;
    }
  }

  if (fromIndex < key.length) {
    result.push(key.slice(fromIndex));
  }

  return result;
}

function pathSegmentsToKey(segments: IPathSegment[]): string {
  return segments
    .map((segment, index) => {
      let prefix = '';
      let value = '';
      if (typeof segment === 'string') {
        value = segment;
        prefix = '.';
      } else {
        value = segment[0];
        prefix = segment[1] ? '!' : '.';
      }
      return index === 0 ? value : prefix + value;
    })
    .join('');
}

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
        const failureInfo = shallowDeepSet(
          state,
          keyToPathSegments(key),
          action[key],
          replacedTargets
        );
        if (failureInfo) {
          handleError(
            `Couldn't update store at path ${pathSegmentsToKey(
              failureInfo.path
            )}. Search has ended at path ${pathSegmentsToKey(
              failureInfo.path.slice(0, failureInfo.pathIndex)
            )}. This is likely due to not using "val()" wrapper or a corrupted store.`,
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
  path: IPathSegment[],
  value: any,
  replacedTargets?: Set<any>,
  pathIndex = 0
): null | { path: IPathSegment[]; pathIndex: number; target: object; value: any } {
  if (typeof path === 'string') {
    path = [path];
  }

  const segment = path[pathIndex];
  const key = typeof segment === 'string' ? segment : segment[0];
  const mustExist = typeof segment === 'string' ? false : segment[1];
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
  } else if (isPlainObject(target) && (target[key] === undefined || target[key] === null)) {
    if (mustExist) {
      // We can't create a new object here. We need to stop.
      return null;
    }
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
