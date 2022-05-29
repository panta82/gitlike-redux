import { glrCommit as commit } from './actions';
import { glrSetErrorHandler as setErrorHandler } from './errors';
import { glrReducer as reducer } from './reducer';
import { IActionCommit, IReduxAction } from './types';
import { GitLikeReduxValue, glrVal as val } from './val';

/**
 * A helper to setup typescript types for all the helpers.
 * Give it your initial state object or use as a generic parameter.
 * It returns the same instances you'd get directly from the library, they are just better typed.
 */
function glrTyped<TState>(_?: TState): {
  reducer: (state: TState | undefined, action: IReduxAction) => TState;
  commit: (
    message: string,
    payload: TState,
    patch?: object
  ) => IReduxAction & IActionCommit<TState>;
} {
  return {
    reducer,
    commit,
  };
}

export { glrTyped, commit, val, reducer, setErrorHandler };
