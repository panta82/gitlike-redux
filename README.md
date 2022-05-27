# gitlike-redux

Use redux like git.

Basic usage:

```typescript
import { createStore } from 'redux';
import { reducer, reset, commit, val } from 'gitlike-redux';

const store = createStore(reducer);

store.dispatch(
  reset('Initial state', {
    initialized: false,
    config: {
      theme: 'light',
    }
  })
);

store.dispatch(
  commit('Initialize and set dark mode', {
    initialized: val(true),
    config: {
      theme: val('dark'),
    }
  })
);
```

Library state: **Used in production, but pretty rough.**

What else is needed:

- Better typing support
- Special array handling
- Batching commits (`add()` call?)
- More tests

License: **[MIT](LICENSE.md)**
