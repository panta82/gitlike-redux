import { createStore } from 'redux';

import { commit, reducer, val } from './index';
import { IGitLikeReduxAction } from './types';

interface IUser {
  id: string;
  name: string;
  isAdmin?: boolean;
  preferences?: {
    favoriteColor: string;
    favoriteFood: string;
  };
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
  it('example from README works', () => {
    // noinspection JSDeprecatedSymbols
    const store = createStore(reducer);

    store.dispatch(
      commit(
        'Initial state',
        val({
          initialized: false,
          config: {
            theme: 'light',
          },
        })
      )
    );

    store.dispatch(
      commit('Initialize and set dark mode', {
        initialized: val(true),
        config: {
          theme: val('dark'),
        },
      })
    );

    expect(store.getState()).toEqual({
      config: {
        theme: 'dark',
      },
      initialized: true,
    });
  });

  it('works on a basic level', () => {
    // noinspection JSDeprecatedSymbols
    const store = createStore<IState, IGitLikeReduxAction<IState>, unknown, unknown>(reducer);

    store.dispatch(
      commit(
        'Initial state',
        val({
          initialized: true,
          config: {
            theme: 'light' as const,
            permissions: {
              byPage: {},
            },
          },
          users: {},
        })
      )
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
        users: val.patchList([
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

  it('can commit an initial state using commit("...", val(state))', () => {
    // noinspection JSDeprecatedSymbols
    const store = createStore<IState, IGitLikeReduxAction<IState>, unknown, unknown>(reducer);
    store.dispatch(
      commit(
        'Initial state',
        val({
          initialized: true,
          config: {
            theme: 'light' as const,
            permissions: {
              byPage: {},
            },
          },
          users: {},
        })
      )
    );
  });

  it('can create objects at dot path for null and undefined root', () => {
    // noinspection JSDeprecatedSymbols
    const store = createStore<IState, IGitLikeReduxAction<IState>, unknown, unknown>(reducer);
    store.dispatch(
      commit(
        'Initial',
        val({
          a: undefined,
          b: null,
          c: false,
          d: '',
          e: NaN,
        })
      )
    );

    store.dispatch(
      commit('Deep set', {
        a: {
          x: {
            x1: val(123),
          },
          y: val({
            y1: 456,
            y2: 789,
          }),
        },
        b: {
          z: val({}),
        },
      })
    );

    expect(store.getState()).toEqual({
      a: {
        x: {
          x1: 123,
        },
        y: {
          y1: 456,
          y2: 789,
        },
      },
      b: {
        z: {},
      },
      c: false,
      d: '',
      e: NaN,
    });

    for (const key of ['c', 'd', 'e']) {
      expect(() =>
        store.dispatch(
          commit('Failed deep set', {
            [key]: { x: val(1) },
          })
        )
      ).toThrow(`Couldn't update store at path ${key}.x`);
    }
  });

  it('can use enforced partial updates to avoid creating half-objects', () => {
    // noinspection JSDeprecatedSymbols
    const store = createStore<IState, IGitLikeReduxAction<IState>, unknown, unknown>(reducer);
    store.dispatch(
      commit(
        'Initial',
        val({
          users: {
            a: {
              id: 'a',
              name: 'John Doe',
              isAdmin: false,
              preferences: {
                favoriteColor: 'Red',
                favoriteFood: 'Apple',
              },
            },
            b: {
              id: 'b',
              name: 'Jane Doe',
              isAdmin: false,
              preferences: null,
            },
          },
        })
      )
    );

    store.dispatch(
      commit(`Make everyone a black-loving admin`, {
        users: {
          a: val.partial({
            isAdmin: val(true),
            preferences: val.partial({
              favoriteColor: val('Black'),
            }),
          }),
          b: val.partial({
            isAdmin: val(true),
            preferences: val.partial({
              favoriteColor: val('Black'),
            }),
          }),
          c: val.partial({
            isAdmin: val(true),
            preferences: val.partial({
              favoriteColor: val('Black'),
            }),
          }),
        },
      })
    );

    expect(store.getState()).toEqual({
      users: {
        a: {
          id: 'a',
          name: 'John Doe',
          isAdmin: true,
          preferences: {
            favoriteColor: 'Black',
            favoriteFood: 'Apple',
          },
        },
        b: {
          id: 'b',
          name: 'Jane Doe',
          isAdmin: true,
          preferences: null,
        },
      },
    });
  });
});
