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
 * NOTE: Instead of sending this object directly to the store, we will convert it into a message object,
 *       where all the keys are deep paths into the message and values are the wrapped terminators.
 *       .
 *       Why? Redux best practice is to only use POJO-s (plain objects) for the action objects and the store itself.
 *       Various ecosystem middlewares might depend all objects are indeed POJO-s and can be safely
 *       deserialized / reserialized (although some clearly break this, but then the user is forced
 *       to carefully position such middlewares - not nice).
 *       .
 *       In order to pass unmangled objects, we will have to keep Terminator classes in the payload.
 *       That might cause unknown conflicts down the line.
 *       .
 *       Secondary reason is that, if user fails to wrap the object in val(), we want them to receive
 *       the error right there, with relevant stack trace, instead of deep down in the store,
 *       or maybe even in a separate stack frame (in case they are using some kind of a debouncing middleware).
 *       .
 *       An advantage of late conversion is probably slightly better performance,
 *       but IMO it's not worth the risk and ergonomics.
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
 *
 *
 */
export function glrCommit<TPayload>(
  message: string,
  payload: TPayload,
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
        if (val.partial) {
          // We will continue digging in, but only if there's an object already at this place (signified by "!")
          digIn(val.value, path + key + '!');
        } else {
          // This is where we stop
          if (!val.ignore) {
            result[path + key] = val.value;
          }
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
