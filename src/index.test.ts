import { createStore } from 'redux';

import { commit, reducer, reset, val } from './index';
import { IGitLikeReduxAction } from './types';

interface IUser {
  id: string;
  name: string;
}

interface IState {
  initialized: boolean;
  config: {
    theme: 'light' | 'dark';
    permissions: {
      byPage: { [pageName: string]: boolean };
    };
  };
  users: { [userId: string]: IUser };
}

describe('GitLikeRedux', () => {
  it('works on a basic level', () => {
    // noinspection JSDeprecatedSymbols
    const store = createStore<IState, IGitLikeReduxAction<IState>, unknown, unknown>(reducer);

    store.dispatch(
      reset('Initial state', {
        initialized: true,
        config: {
          theme: 'light' as const,
          permissions: {
            byPage: {},
          },
        },
        users: {},
      })
    );

    expect(store.getState()).toEqual({
      config: {
        permissions: {
          byPage: {},
        },
        theme: 'light',
      },
      initialized: true,
      users: {},
    });

    store.dispatch(
      commit('Initialize', {
        initialized: val(true),
      })
    );
    store.dispatch(
      commit('Add "Jack" and "Jill"', {
        users: val.patchify([
          {
            id: '1',
            name: 'Jack',
          },
          {
            id: '2',
            name: 'Jill',
          },
        ]),
      })
    );

    expect(store.getState()).toEqual({
      config: {
        permissions: {
          byPage: {},
        },
        theme: 'light',
      },
      initialized: true,
      users: {
        '1': {
          id: '1',
          name: 'Jack',
        },
        '2': {
          id: '2',
          name: 'Jill',
        },
      },
    });

    store.dispatch(
      commit('Delete "Jill"', {
        users: {
          2: val(undefined),
        },
      })
    );

    expect(store.getState()).toEqual({
      config: {
        permissions: {
          byPage: {},
        },
        theme: 'light',
      },
      initialized: true,
      users: {
        '1': {
          id: '1',
          name: 'Jack',
        },
      },
    });

    store.dispatch(
      commit('Add some nested config', {
        config: {
          permissions: {
            byPage: {
              index: val(true),
              faq: val(true),
              admin: val(false),
            },
          },
        },
      })
    );

    expect(store.getState()).toEqual({
      config: {
        permissions: {
          byPage: {
            index: true,
            faq: true,
            admin: false,
          },
        },
        theme: 'light',
      },
      initialized: true,
      users: {
        '1': {
          id: '1',
          name: 'Jack',
        },
      },
    });
  });
});
