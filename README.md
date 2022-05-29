# gitlike-redux

**Use redux like git.**

```bash
npm install --save gitlike-redux
# or
yarn add gitlike-redux
```

Instead of creating actions, reducers, and the rest of the boilerplate, just commit your store updates, like you would in git.

Your action type is your commit message (so it will show up in console). And your action body is an object that matches your store state, with edge properties wrapped using the `val()` helpers.

Basic example:

```typescript
import { createStore } from 'redux';
import { reducer, commit, val } from 'gitlike-redux';

const store = createStore(reducer);

store.dispatch(
  commit('Initial state', val({
    initialized: false,
    config: {
      theme: 'light',
    }
  }))
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

---

Library state: _Used in production, but pretty rough._

Expect possible API changes.

**_Use at your own risk_**

---

What else is needed:

- Array handling support
- Batching commits (`add()` call?)
- More tests
- Documentation

---

License: **[MIT](LICENSE.md)**
