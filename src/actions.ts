import { handleError } from './errors';
import { IActionCommit, IReduxAction } from './types';
import { isObjectLike } from './utils';
import { GitLikeReduxValue } from './val';

/**
 * Generate an action that can be interpreted by gitLikeReducer. Target payload will be "unrolled"
 * into string paths and values at the end. For this to work, you must wrap the values you want to
 * commit using val().
 *
 * You can also provide "patch", which can be used as an additional, unprocessed part of the payload
 *
 * @example
 *     commit("Switch to dark theme", {
 *      user: {
 *        profile: {
 *          theme: val('dark')
 *        }
 *      }
 *     })
 *  result:
 *     {
 *       type: "Switch to dark theme",
 *       "user.profile.theme": "dark"
 *     }
 */
export function glrCommit<TPayload>(
  message: string,
  payload: TPayload | GitLikeReduxValue<TPayload>,
  patch?: object
): IReduxAction & IActionCommit<TPayload> {
  if (payload instanceof GitLikeReduxValue) {
    // Replace the entire state. A special case
    return {
      type: message,
      '.': payload.value,
    } as any;
  }

  const result = {
    type: message,
    ...patch,
  };

  digIn(payload);

  return result as any;

  function digIn(ob: any, path = '') {
    if (!ob) {
      return;
    }

    for (const key in ob) {
      if (!ob.hasOwnProperty(key)) {
        continue;
      }

      const val = ob[key];
      if (val instanceof GitLikeReduxValue) {
        // This is where we stop
        if (!val.ignore) {
          result[path + key] = val.value;
        }
      } else if (isObjectLike(val)) {
        // Dig in
        // TODO arrays?
        digIn(val, path + key + '.');
      } else {
        // We have reached a value we don't know what to do with
        handleError(`You cannot commit value at "${path + key}" without wrapping it into val()`, {
          message,
          payload,
        });
      }
    }
  }
}
