---
sidebar_position: 6
description: 目录设计和源码构建
---

## Vuex

Vuex 是一个专为 Vue.js 应用程序开发的状态管理模式。它采用集中式存储管理应用的所有组件的状态，并以相应的规则保证状态以一种可预测的方式发生变化。

### 什么是“状态管理模式”？

让我们从一个简单的 Vue 计数应用开始：

```js
new Vue({
  // state
  data() {
    return {
      count: 0,
    };
  },
  // view
  template: `
    <div>{{ count }}</div>
  `,
  // actions
  methods: {
    increment() {
      this.count++;
    },
  },
});
```

这个状态自管理应用包含以下几个部分：

- state，驱动应用的数据源；
- view，以声明方式将 state 映射到视图；
- actions，响应在 view 上的用户输入导致的状态变化。

以下是一个表示“单向数据流”理念的极简示意：

![img](https://ustbhuangyi.github.io/vue-analysis/assets/vuex.png)

但是，当我们的应用遇到多个组件共享状态时，单向数据流的简洁性很容易被破坏：

- 多个视图依赖于同一状态。
- 来自不同视图的行为需要变更同一状态。

对于问题一，传参的方法对于多层嵌套的组件将会非常繁琐，并且对于兄弟组件间的状态传递无能为力。对于问题二，我们经常会采用父子组件直接引用或者通过事件来变更和同步状态的多份拷贝。以上的这些模式非常脆弱，通常会导致无法维护的代码。

因此，我们为什么不把组件的共享状态抽取出来，以一个全局单例模式管理呢？在这种模式下，我们的组件树构成了一个巨大的“视图”，不管在树的哪个位置，任何组件都能获取状态或者触发行为。

### Vuex 核心思想

Vuex 应用的核心就是 store（仓库）。“store”基本上就是一个容器，它包含着你的应用中大部分的状态 (state)。有些同学可能会问，那我定义一个全局对象，再去上层封装了一些数据存取的接口不也可以么？

Vuex 和单纯的全局对象有以下两点不同：

- Vuex 的状态存储是响应式的。当 Vue 组件从 store 中读取状态的时候，若 store 中的状态发生变化，那么相应的组件也会相应地得到高效更新。
- 你不能直接改变 store 中的状态。改变 store 中的状态的唯一途径就是显式地提交 (commit) mutation。这样使得我们可以方便地跟踪每一个状态的变化，从而让我们能够实现一些工具帮助我们更好地了解我们的应用。

另外，通过定义和隔离状态管理中的各种概念并强制遵守一定的规则，我们的代码将会变得更结构化且易维护。

![img](https://ustbhuangyi.github.io/vue-analysis/assets/vuex1.png)

### Vuex 初始化

这一节我们主要来分析 Vuex 的初始化过程，它包括安装、Store 实例化过程 2 个方面。

#### 安装

当我们在代码中通过 `import Vuex from 'vuex'` 的时候，实际上引用的是一个对象，它的定义在 `src/index.js` 中：

```js
export default {
  Store,
  install,
  version: "__VERSION__",
  mapState,
  mapMutations,
  mapGetters,
  mapActions,
  createNamespacedHelpers,
};
```

和 Vue-Router 一样，Vuex 也同样存在一个静态的 `install` 方法，它的定义在 `src/store.js` 中：

```js
export function install(_Vue) {
  if (Vue && _Vue === Vue) {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        "[vuex] already installed. Vue.use(Vuex) should be called only once."
      );
    }
    return;
  }
  Vue = _Vue;
  applyMixin(Vue);
}
```

`install` 的逻辑很简单，把传入的 `_Vue` 赋值给 `Vue` 并执行了 `applyMixin(Vue)` 方法，它的定义在 `src/mixin.js` 中：

```js
export default function (Vue) {
  const version = Number(Vue.version.split(".")[0]);

  if (version >= 2) {
    Vue.mixin({ beforeCreate: vuexInit });
  } else {
    // override init and inject vuex init procedure
    // for 1.x backwards compatibility.
    const _init = Vue.prototype._init;
    Vue.prototype._init = function (options = {}) {
      options.init = options.init ? [vuexInit].concat(options.init) : vuexInit;
      _init.call(this, options);
    };
  }

  /**
   * Vuex init hook, injected into each instances init hooks list.
   */

  function vuexInit() {
    const options = this.$options;
    // store injection
    if (options.store) {
      this.$store =
        typeof options.store === "function" ? options.store() : options.store;
    } else if (options.parent && options.parent.$store) {
      this.$store = options.parent.$store;
    }
  }
}
```

`applyMixin` 就是这个 `export default function`，它还兼容了 Vue 1.0 的版本，这里我们只关注 Vue 2.0 以上版本的逻辑，它其实就全局混入了一个 `beforeCreate` 钩子函数，它的实现非常简单，就是把 `options.store` 保存在所有组件的 `this.$store` 中，这个 `options.store` 就是我们在实例化 `Store` 对象的实例，稍后我们会介绍，这也是为什么我们在组件中可以通过 `this.$store` 访问到这个实例。

#### Store 实例化

我们在 `import Vuex` 之后，会实例化其中的 `Store` 对象，返回 `store` 实例并传入 `new Vue` 的 `options` 中，也就是我们刚才提到的 `options.store`.

举个简单的例子，如下：

```js
export default new Vuex.Store({
  actions,
  getters,
  state,
  mutations,
  modules,
  // ...
});
```

`Store` 对象的构造函数接收一个对象参数，它包含 `actions`、`getters`、`state`、`mutations`、`modules` 等 Vuex 的核心概念，它的定义在 `src/store.js` 中：

```js
export class Store {
  constructor(options = {}) {
    // Auto install if it is not done yet and `window` has `Vue`.
    // To allow users to avoid auto-installation in some cases,
    // this code should be placed here. See #731
    if (!Vue && typeof window !== "undefined" && window.Vue) {
      install(window.Vue);
    }

    if (process.env.NODE_ENV !== "production") {
      assert(Vue, `must call Vue.use(Vuex) before creating a store instance.`);
      assert(
        typeof Promise !== "undefined",
        `vuex requires a Promise polyfill in this browser.`
      );
      assert(
        this instanceof Store,
        `Store must be called with the new operator.`
      );
    }

    const { plugins = [], strict = false } = options;

    // store internal state
    this._committing = false;
    this._actions = Object.create(null);
    this._actionSubscribers = [];
    this._mutations = Object.create(null);
    this._wrappedGetters = Object.create(null);
    this._modules = new ModuleCollection(options);
    this._modulesNamespaceMap = Object.create(null);
    this._subscribers = [];
    this._watcherVM = new Vue();

    // bind commit and dispatch to self
    const store = this;
    const { dispatch, commit } = this;
    this.dispatch = function boundDispatch(type, payload) {
      return dispatch.call(store, type, payload);
    };
    this.commit = function boundCommit(type, payload, options) {
      return commit.call(store, type, payload, options);
    };

    // strict mode
    this.strict = strict;

    const state = this._modules.root.state;

    // init root module.
    // this also recursively registers all sub-modules
    // and collects all module getters inside this._wrappedGetters
    installModule(this, state, [], this._modules.root);

    // initialize the store vm, which is responsible for the reactivity
    // (also registers _wrappedGetters as computed properties)
    resetStoreVM(this, state);

    // apply plugins
    plugins.forEach((plugin) => plugin(this));

    if (Vue.config.devtools) {
      devtoolPlugin(this);
    }
  }
}
```

我们把 `Store` 的实例化过程拆成 3 个部分，分别是初始化模块，安装模块和初始化 `store._vm`，接下来我们来分析这 3 部分的实现。

#### 初始化模块

在分析模块初始化之前，我们先来了解一下模块对于 Vuex 的意义：由于使用单一状态树，应用的所有状态会集中到一个比较大的对象，当应用变得非常复杂时，`store` 对象就有可能变得相当臃肿。为了解决以上问题，Vuex 允许我们将 `store` 分割成模块（module）。每个模块拥有自己的 `state`、`mutation`、`action`、`getter`，甚至是嵌套子模块——从上至下进行同样方式的分割：

```js
const moduleA = {
  state: { ... },
  mutations: { ... },
  actions: { ... },
  getters: { ... }
}

const moduleB = {
  state: { ... },
  mutations: { ... },
  actions: { ... },
  getters: { ... },
}

const store = new Vuex.Store({
  modules: {
    a: moduleA,
    b: moduleB
  }
})

store.state.a // -> moduleA 的状态
store.state.b // -> moduleB 的状态
```

所以从数据结构上来看，模块的设计就是一个树型结构，`store` 本身可以理解为一个 `root module`，它下面的 `modules` 就是子模块，Vuex 需要完成这颗树的构建，构建过程的入口就是：

```js
this._modules = new ModuleCollection(options);
```

`ModuleCollection` 的定义在 `src/module/module-collection.js` 中：

```js
export default class ModuleCollection {
  constructor(rawRootModule) {
    // register root module (Vuex.Store options)
    this.register([], rawRootModule, false);
  }

  get(path) {
    return path.reduce((module, key) => {
      return module.getChild(key);
    }, this.root);
  }

  getNamespace(path) {
    let module = this.root;
    return path.reduce((namespace, key) => {
      module = module.getChild(key);
      return namespace + (module.namespaced ? key + "/" : "");
    }, "");
  }

  update(rawRootModule) {
    update([], this.root, rawRootModule);
  }

  register(path, rawModule, runtime = true) {
    if (process.env.NODE_ENV !== "production") {
      assertRawModule(path, rawModule);
    }

    const newModule = new Module(rawModule, runtime);
    if (path.length === 0) {
      this.root = newModule;
    } else {
      const parent = this.get(path.slice(0, -1));
      parent.addChild(path[path.length - 1], newModule);
    }

    // register nested modules
    if (rawModule.modules) {
      forEachValue(rawModule.modules, (rawChildModule, key) => {
        this.register(path.concat(key), rawChildModule, runtime);
      });
    }
  }

  unregister(path) {
    const parent = this.get(path.slice(0, -1));
    const key = path[path.length - 1];
    if (!parent.getChild(key).runtime) return;

    parent.removeChild(key);
  }
}
```

`ModuleCollection` 实例化的过程就是执行了 `register` 方法， `register` 接收 3 个参数，其中 `path` 表示路径，因为我们整体目标是要构建一颗模块树，`path` 是在构建树的过程中维护的路径；`rawModule` 表示定义模块的原始配置；`runtime` 表示是否是一个运行时创建的模块。

`register` 方法首先通过 `const newModule = new Module(rawModule, runtime)` 创建了一个 `Module` 的实例，`Module` 是用来描述单个模块的类，它的定义在 `src/module/module.js` 中：

```js
export default class Module {
  constructor(rawModule, runtime) {
    this.runtime = runtime;
    // Store some children item
    this._children = Object.create(null);
    // Store the origin module object which passed by programmer
    this._rawModule = rawModule;
    const rawState = rawModule.state;

    // Store the origin module's state
    this.state = (typeof rawState === "function" ? rawState() : rawState) || {};
  }

  get namespaced() {
    return !!this._rawModule.namespaced;
  }

  addChild(key, module) {
    this._children[key] = module;
  }

  removeChild(key) {
    delete this._children[key];
  }

  getChild(key) {
    return this._children[key];
  }

  update(rawModule) {
    this._rawModule.namespaced = rawModule.namespaced;
    if (rawModule.actions) {
      this._rawModule.actions = rawModule.actions;
    }
    if (rawModule.mutations) {
      this._rawModule.mutations = rawModule.mutations;
    }
    if (rawModule.getters) {
      this._rawModule.getters = rawModule.getters;
    }
  }

  forEachChild(fn) {
    forEachValue(this._children, fn);
  }

  forEachGetter(fn) {
    if (this._rawModule.getters) {
      forEachValue(this._rawModule.getters, fn);
    }
  }

  forEachAction(fn) {
    if (this._rawModule.actions) {
      forEachValue(this._rawModule.actions, fn);
    }
  }

  forEachMutation(fn) {
    if (this._rawModule.mutations) {
      forEachValue(this._rawModule.mutations, fn);
    }
  }
}
```

来看一下 `Module` 的构造函数，对于每个模块而言，`this._rawModule` 表示模块的配置，`this._children` 表示它的所有子模块，`this.state` 表示这个模块定义的 `state`。

回到 `register`，那么在实例化一个 `Module` 后，判断当前的 `path` 的长度如果为 0，则说明它是一个根模块，所以把 `newModule` 赋值给了 `this.root`，否则就需要建立父子关系了：

```js
const parent = this.get(path.slice(0, -1));
parent.addChild(path[path.length - 1], newModule);
```

我们先大体上了解它的逻辑：首先根据路径获取到父模块，然后再调用父模块的 `addChild` 方法建立父子关系。

`register` 的最后一步，就是遍历当前模块定义中的所有 `modules`，根据 `key` 作为 `path`，递归调用 `register` 方法，这样我们再回过头看一下建立父子关系的逻辑，首先执行了 `this.get(path.slice(0, -1)` 方法：

```js
get (path) {
  return path.reduce((module, key) => {
    return module.getChild(key)
  }, this.root)
}
```

传入的 `path` 是它的父模块的 `path`，然后从根模块开始，通过 `reduce` 方法一层层去找到对应的模块，查找的过程中，执行的是 `module.getChild(key)` 方法：

```js
getChild (key) {
  return this._children[key]
}
```

其实就是返回当前模块的 `_children` 中对应 `key` 的模块，那么每个模块的 `_children` 是如何添加的呢，是通过执行 `parent.addChild(path[path.length - 1], newModule)` 方法：

```js
addChild (key, module) {
  this._children[key] = module
}
```

所以说对于 `root module` 的下一层 `modules` 来说，它们的 `parent` 就是 `root module`，那么他们就会被添加的 `root module` 的 `_children` 中。每个子模块通过路径找到它的父模块，然后通过父模块的 `addChild` 方法建立父子关系，递归执行这样的过程，最终就建立一颗完整的模块树。

#### 安装模块

初始化模块后，执行安装模块的相关逻辑，它的目标就是对模块中的 `state`、`getters`、`mutations`、`actions` 做初始化工作，它的入口代码是：

```js
const state = this._modules.root.state;
installModule(this, state, [], this._modules.root);
```

来看一下 `installModule` 的定义：

```js
function installModule(store, rootState, path, module, hot) {
  const isRoot = !path.length;
  const namespace = store._modules.getNamespace(path);

  // register in namespace map
  if (module.namespaced) {
    store._modulesNamespaceMap[namespace] = module;
  }

  // set state
  if (!isRoot && !hot) {
    const parentState = getNestedState(rootState, path.slice(0, -1));
    const moduleName = path[path.length - 1];
    store._withCommit(() => {
      Vue.set(parentState, moduleName, module.state);
    });
  }

  const local = (module.context = makeLocalContext(store, namespace, path));

  module.forEachMutation((mutation, key) => {
    const namespacedType = namespace + key;
    registerMutation(store, namespacedType, mutation, local);
  });

  module.forEachAction((action, key) => {
    const type = action.root ? key : namespace + key;
    const handler = action.handler || action;
    registerAction(store, type, handler, local);
  });

  module.forEachGetter((getter, key) => {
    const namespacedType = namespace + key;
    registerGetter(store, namespacedType, getter, local);
  });

  module.forEachChild((child, key) => {
    installModule(store, rootState, path.concat(key), child, hot);
  });
}
```

`installModule` 方法支持 5 个参数，`store` 表示 `root store`；`state` 表示 `root state`；`path` 表示模块的访问路径；`module` 表示当前的模块，`hot` 表示是否是热更新。

接下来看函数逻辑，这里涉及到了命名空间的概念，默认情况下，模块内部的 `action`、`mutation` 和 `getter` 是注册在全局命名空间的——这样使得多个模块能够对同一 `mutation` 或 `action` 作出响应。如果我们希望模块具有更高的封装度和复用性，可以通过添加 `namespaced: true` 的方式使其成为带命名空间的模块。当模块被注册后，它的所有 `getter`、`action` 及 `mutation` 都会自动根据模块注册的路径调整命名。例如：

```js
const store = new Vuex.Store({
  modules: {
    account: {
      namespaced: true,

      // 模块内容（module assets）
      state: { ... }, // 模块内的状态已经是嵌套的了，使用 `namespaced` 属性不会对其产生影响
      getters: {
        isAdmin () { ... } // -> getters['account/isAdmin']
      },
      actions: {
        login () { ... } // -> dispatch('account/login')
      },
      mutations: {
        login () { ... } // -> commit('account/login')
      },

      // 嵌套模块
      modules: {
        // 继承父模块的命名空间
        myPage: {
          state: { ... },
          getters: {
            profile () { ... } // -> getters['account/profile']
          }
        },

        // 进一步嵌套命名空间
        posts: {
          namespaced: true,

          state: { ... },
          getters: {
            popular () { ... } // -> getters['account/posts/popular']
          }
        }
      }
    }
  }
})
```

回到 `installModule` 方法，我们首先根据 `path` 获取 `namespace`：

```js
const namespace = store._modules.getNamespace(path);
```

`getNamespace` 的定义在 `src/module/module-collection.js` 中：

```js
getNamespace (path) {
  let module = this.root
  return path.reduce((namespace, key) => {
    module = module.getChild(key)
    return namespace + (module.namespaced ? key + '/' : '')
  }, '')
}
```

从 `root module` 开始，通过 `reduce` 方法一层层找子模块，如果发现该模块配置了 `namespaced` 为 true，则把该模块的 `key` 拼到 `namesapce` 中，最终返回完整的 `namespace` 字符串。

回到 `installModule` 方法，接下来把 `namespace` 对应的模块保存下来，为了方便以后能根据 `namespace` 查找模块：

```js
if (module.namespaced) {
  store._modulesNamespaceMap[namespace] = module;
}
```

接下来判断非 `root module` 且非 `hot` 的情况执行一些逻辑，我们稍后再看。

接着是很重要的逻辑，构造了一个本地上下文环境：

```js
const local = (module.context = makeLocalContext(store, namespace, path));
```

来看一下 `makeLocalContext` 实现：

```js
function makeLocalContext(store, namespace, path) {
  const noNamespace = namespace === "";

  const local = {
    dispatch: noNamespace
      ? store.dispatch
      : (_type, _payload, _options) => {
          const args = unifyObjectStyle(_type, _payload, _options);
          const { payload, options } = args;
          let { type } = args;

          if (!options || !options.root) {
            type = namespace + type;
            if (
              process.env.NODE_ENV !== "production" &&
              !store._actions[type]
            ) {
              console.error(
                `[vuex] unknown local action type: ${args.type}, global type: ${type}`
              );
              return;
            }
          }

          return store.dispatch(type, payload);
        },

    commit: noNamespace
      ? store.commit
      : (_type, _payload, _options) => {
          const args = unifyObjectStyle(_type, _payload, _options);
          const { payload, options } = args;
          let { type } = args;

          if (!options || !options.root) {
            type = namespace + type;
            if (
              process.env.NODE_ENV !== "production" &&
              !store._mutations[type]
            ) {
              console.error(
                `[vuex] unknown local mutation type: ${args.type}, global type: ${type}`
              );
              return;
            }
          }

          store.commit(type, payload, options);
        },
  };

  // getters and state object must be gotten lazily
  // because they will be changed by vm update
  Object.defineProperties(local, {
    getters: {
      get: noNamespace
        ? () => store.getters
        : () => makeLocalGetters(store, namespace),
    },
    state: {
      get: () => getNestedState(store.state, path),
    },
  });

  return local;
}
```

`makeLocalContext` 支持 3 个参数相关，`store` 表示 `root store`；`namespace` 表示模块的命名空间，`path` 表示模块的 `path`。

该方法定义了 `local` 对象，对于 `dispatch` 和 `commit` 方法，如果没有 `namespace`，它们就直接指向了 `root store` 的 `dispatch` 和 `commit` 方法，否则会创建方法，把 `type` 自动拼接上 `namespace`，然后执行 `store` 上对应的方法。

对于 `getters` 而言，如果没有 `namespace`，则直接返回 `root store` 的 `getters`，否则返回 `makeLocalGetters(store, namespace)` 的返回值：

```js
function makeLocalGetters(store, namespace) {
  const gettersProxy = {};

  const splitPos = namespace.length;
  Object.keys(store.getters).forEach((type) => {
    // skip if the target getter is not match this namespace
    if (type.slice(0, splitPos) !== namespace) return;

    // extract local getter type
    const localType = type.slice(splitPos);

    // Add a port to the getters proxy.
    // Define as getter property because
    // we do not want to evaluate the getters in this time.
    Object.defineProperty(gettersProxy, localType, {
      get: () => store.getters[type],
      enumerable: true,
    });
  });

  return gettersProxy;
}
```

`makeLocalGetters` 首先获取了 `namespace` 的长度，然后遍历 `root store` 下的所有 `getters`，先判断它的类型是否匹配 `namespace`，只有匹配的时候我们从 `namespace` 的位置截取后面的字符串得到 `localType`，接着用 `Object.defineProperty` 定义了 `gettersProxy`，获取 `localType` 实际上是访问了 `store.getters[type]`。

回到 `makeLocalContext` 方法，再来看一下对 `state` 的实现，它的获取则是通过 `getNestedState(store.state, path)` 方法：

```js
function getNestedState(state, path) {
  return path.length ? path.reduce((state, key) => state[key], state) : state;
}
```

`getNestedState` 逻辑很简单，从 `root state` 开始，通过 `path.reduce` 方法一层层查找子模块 `state`，最终找到目标模块的 `state`。

那么构造完 `local` 上下文后，我们再回到 `installModule` 方法，接下来它就会遍历模块中定义的 `mutations`、`actions`、`getters`，分别执行它们的注册工作，它们的注册逻辑都大同小异。

- `registerMutation`

```js
module.forEachMutation((mutation, key) => {
  const namespacedType = namespace + key;
  registerMutation(store, namespacedType, mutation, local);
});

function registerMutation(store, type, handler, local) {
  const entry = store._mutations[type] || (store._mutations[type] = []);
  entry.push(function wrappedMutationHandler(payload) {
    handler.call(store, local.state, payload);
  });
}
```

首先遍历模块中的 `mutations` 的定义，拿到每一个 `mutation` 和 `key`，并把 `key` 拼接上 `namespace`，然后执行 `registerMutation` 方法。该方法实际上就是给 `root store` 上的 `_mutations[types]` 添加 `wrappedMutationHandler` 方法，该方法的具体实现我们之后会提到。注意，同一 `type` 的 `_mutations` 可以对应多个方法。

- `registerAction`

```js
module.forEachAction((action, key) => {
  const type = action.root ? key : namespace + key;
  const handler = action.handler || action;
  registerAction(store, type, handler, local);
});

function registerAction(store, type, handler, local) {
  const entry = store._actions[type] || (store._actions[type] = []);
  entry.push(function wrappedActionHandler(payload, cb) {
    let res = handler.call(
      store,
      {
        dispatch: local.dispatch,
        commit: local.commit,
        getters: local.getters,
        state: local.state,
        rootGetters: store.getters,
        rootState: store.state,
      },
      payload,
      cb
    );
    if (!isPromise(res)) {
      res = Promise.resolve(res);
    }
    if (store._devtoolHook) {
      return res.catch((err) => {
        store._devtoolHook.emit("vuex:error", err);
        throw err;
      });
    } else {
      return res;
    }
  });
}
```

首先遍历模块中的 `actions` 的定义，拿到每一个 `action` 和 `key`，并判断 `action.root`，如果否的情况把 `key` 拼接上 `namespace`，然后执行 `registerAction` 方法。该方法实际上就是给 `root store` 上的 `_actions[types]` 添加 `wrappedActionHandler` 方法，该方法的具体实现我们之后会提到。注意，同一 `type` 的 `_actions` 可以对应多个方法。

- `registerGetter`

```js
module.forEachGetter((getter, key) => {
  const namespacedType = namespace + key;
  registerGetter(store, namespacedType, getter, local);
});

function registerGetter(store, type, rawGetter, local) {
  if (store._wrappedGetters[type]) {
    if (process.env.NODE_ENV !== "production") {
      console.error(`[vuex] duplicate getter key: ${type}`);
    }
    return;
  }
  store._wrappedGetters[type] = function wrappedGetter(store) {
    return rawGetter(
      local.state, // local state
      local.getters, // local getters
      store.state, // root state
      store.getters // root getters
    );
  };
}
```

首先遍历模块中的 `getters` 的定义，拿到每一个 `getter` 和 `key`，并把 `key` 拼接上 `namespace`，然后执行 `registerGetter` 方法。该方法实际上就是给 `root store` 上的 `_wrappedGetters[key]` 指定 `wrappedGetter` 方法，该方法的具体实现我们之后会提到。注意，同一 `type` 的 `_wrappedGetters` 只能定义一个。

再回到 `installModule` 方法，最后一步就是遍历模块中的所有子 `modules`，递归执行 `installModule` 方法：

```js
module.forEachChild((child, key) => {
  installModule(store, rootState, path.concat(key), child, hot);
});
```

之前我们忽略了非 `root module` 下的 `state` 初始化逻辑，现在来看一下：

```js
if (!isRoot && !hot) {
  const parentState = getNestedState(rootState, path.slice(0, -1));
  const moduleName = path[path.length - 1];
  store._withCommit(() => {
    Vue.set(parentState, moduleName, module.state);
  });
}
```

之前我们提到过 `getNestedState` 方法，它是从 `root state` 开始，一层层根据模块名能访问到对应 `path` 的 `state`，那么它每一层关系的建立实际上就是通过这段 `state` 的初始化逻辑。`store._withCommit` 方法我们之后再介绍。

所以 `installModule` 实际上就是完成了模块下的 `state`、`getters`、`actions`、`mutations` 的初始化工作，并且通过递归遍历的方式，就完成了所有子模块的安装工作。

#### 初始化 `store._vm`

`Store` 实例化的最后一步，就是执行初始化 `store._vm` 的逻辑，它的入口代码是：

```js
resetStoreVM(this, state);
```

来看一下 `resetStoreVM` 的定义：

```js
function resetStoreVM(store, state, hot) {
  const oldVm = store._vm;

  // bind store public getters
  store.getters = {};
  const wrappedGetters = store._wrappedGetters;
  const computed = {};
  forEachValue(wrappedGetters, (fn, key) => {
    // use computed to leverage its lazy-caching mechanism
    computed[key] = () => fn(store);
    Object.defineProperty(store.getters, key, {
      get: () => store._vm[key],
      enumerable: true, // for local getters
    });
  });

  // use a Vue instance to store the state tree
  // suppress warnings just in case the user has added
  // some funky global mixins
  const silent = Vue.config.silent;
  Vue.config.silent = true;
  store._vm = new Vue({
    data: {
      $$state: state,
    },
    computed,
  });
  Vue.config.silent = silent;

  // enable strict mode for new vm
  if (store.strict) {
    enableStrictMode(store);
  }

  if (oldVm) {
    if (hot) {
      // dispatch changes in all subscribed watchers
      // to force getter re-evaluation for hot reloading.
      store._withCommit(() => {
        oldVm._data.$$state = null;
      });
    }
    Vue.nextTick(() => oldVm.$destroy());
  }
}
```

`resetStoreVM` 的作用实际上是想建立 `getters` 和 `state` 的联系，因为从设计上 `getters` 的获取就依赖了 `state` ，并且希望它的依赖能被缓存起来，且只有当它的依赖值发生了改变才会被重新计算。因此这里利用了 Vue 中用 `computed` 计算属性来实现。

`resetStoreVM` 首先遍历了 `_wrappedGetters` 获得每个 `getter` 的函数 `fn` 和 `key`，然后定义了 `computed[key] = () => fn(store)`。我们之前提到过 `_wrappedGetters` 的初始化过程，这里 `fn(store)` 相当于执行如下方法：

```js
store._wrappedGetters[type] = function wrappedGetter(store) {
  return rawGetter(
    local.state, // local state
    local.getters, // local getters
    store.state, // root state
    store.getters // root getters
  );
};
```

返回的就是 `rawGetter` 的执行函数，`rawGetter` 就是用户定义的 `getter` 函数，它的前 2 个参数是 `local state` 和 `local getters`，后 2 个参数是 `root state` 和 `root getters`。

接着实例化一个 Vue 实例 `store._vm`，并把 `computed` 传入：

```js
store._vm = new Vue({
  data: {
    $$state: state,
  },
  computed,
});
```

我们发现 `data` 选项里定义了 `$$state` 属性，而我们访问 `store.state` 的时候，实际上会访问 `Store` 类上定义的 `state` 的 `get` 方法：

```js
get state () {
  return this._vm._data.$$state
}
```

它实际上就访问了 `store._vm._data.$$state`。那么 `getters` 和 `state` 是如何建立依赖逻辑的呢，我们再看这段代码逻辑：

```js
forEachValue(wrappedGetters, (fn, key) => {
  // use computed to leverage its lazy-caching mechanism
  computed[key] = () => fn(store);
  Object.defineProperty(store.getters, key, {
    get: () => store._vm[key],
    enumerable: true, // for local getters
  });
});
```

当我根据 `key` 访问 `store.getters` 的某一个 `getter` 的时候，实际上就是访问了 `store._vm[key]`，也就是 `computed[key]`，在执行 `computed[key]` 对应的函数的时候，会执行 `rawGetter(local.state,...)` 方法，那么就会访问到 `store.state`，进而访问到 `store._vm._data.$$state`，这样就建立了一个依赖关系。当 `store.state` 发生变化的时候，下一次再访问 `store.getters` 的时候会重新计算。

我们再来看一下 `strict mode` 的逻辑：

```js
if (store.strict) {
  enableStrictMode(store);
}

function enableStrictMode(store) {
  store._vm.$watch(
    function () {
      return this._data.$$state;
    },
    () => {
      if (process.env.NODE_ENV !== "production") {
        assert(
          store._committing,
          `Do not mutate vuex store state outside mutation handlers.`
        );
      }
    },
    { deep: true, sync: true }
  );
}
```

当严格模式下，`store._vm` 会添加一个 `wathcer` 来观测 `this._data.$$state` 的变化，也就是当 `store.state` 被修改的时候, `store._committing` 必须为 true，否则在开发阶段会报警告。`store._committing` 默认值是 `false`，那么它什么时候会 true 呢，`Store` 定义了 `_withCommit` 实例方法：

```js
_withCommit (fn) {
  const committing = this._committing
  this._committing = true
  fn()
  this._committing = committing
}
```

它就是对 `fn` 包装了一个环境，确保在 `fn` 中执行任何逻辑的时候 `this._committing = true`。所以外部任何非通过 Vuex 提供的接口直接操作修改 `state` 的行为都会在开发阶段触发警告。

#### 总结

那么至此，Vuex 的初始化过程就分析完毕了，除了安装部分，我们重点分析了 `Store` 的实例化过程。我们要把 `store` 想象成一个数据仓库，为了更方便的管理仓库，我们把一个大的 `store` 拆成一些 `modules`，整个 `modules` 是一个树型结构。每个 `module` 又分别定义了 `state`，`getters`，`mutations`、`actions`，我们也通过递归遍历模块的方式都完成了它们的初始化。为了 `module` 具有更高的封装度和复用性，还定义了 `namespace` 的概念。最后我们还定义了一个内部的 `Vue` 实例，用来建立 `state` 到 `getters` 的联系，并且可以在严格模式下监测 `state` 的变化是不是来自外部，确保改变 `state` 的唯一途径就是显式地提交 `mutation`。

这一节我们已经建立好 `store`，接下来就是对外提供了一些 API 方便我们对这个 `store` 做数据存取的操作，下一节我们就来从源码角度来分析 `Vuex` 提供的一系列 API。

上一节我们对 Vuex 的初始化过程有了深入的分析，在我们构造好这个 `store` 后，需要提供一些 API 对这个 `store` 做存取的操作，那么这一节我们就从源码的角度对这些 API 做分析。

### API

#### 数据获取

Vuex 最终存储的数据是在 `state` 上的，我们之前分析过在 `store.state` 存储的是 `root state`，那么对于模块上的 `state`，假设我们有 2 个嵌套的 `modules`，它们的 `key` 分别为 `a` 和 `b`，我们可以通过 `store.state.a.b.xxx` 的方式去获取。它的实现是在发生在 `installModule` 的时候：

```js
function installModule(store, rootState, path, module, hot) {
  const isRoot = !path.length;

  // ...
  // set state
  if (!isRoot && !hot) {
    const parentState = getNestedState(rootState, path.slice(0, -1));
    const moduleName = path[path.length - 1];
    store._withCommit(() => {
      Vue.set(parentState, moduleName, module.state);
    });
  }
  // ...
}
```

在递归执行 `installModule` 的过程中，就完成了整个 `state` 的建设，这样我们就可以通过 `module` 名的 `path` 去访问到一个深层 `module` 的 `state`。

有些时候，我们获取的数据不仅仅是一个 `state`，而是由多个 `state` 计算而来，Vuex 提供了 `getters`，允许我们定义一个 `getter` 函数，如下：

```js
getters: {
  total (state, getters, localState, localGetters) {
    // 可访问全局 state 和 getters，以及如果是在 modules 下面，可以访问到局部 state 和 局部 getters
    return state.a + state.b
  }
}
```

我们在 `installModule` 的过程中，递归执行了所有 `getters` 定义的注册，在之后的 `resetStoreVM` 过程中，执行了 `store.getters` 的初始化工作：

```js
function installModule(store, rootState, path, module, hot) {
  // ...
  const namespace = store._modules.getNamespace(path);
  // ...
  const local = (module.context = makeLocalContext(store, namespace, path));

  // ...

  module.forEachGetter((getter, key) => {
    const namespacedType = namespace + key;
    registerGetter(store, namespacedType, getter, local);
  });

  // ...
}

function registerGetter(store, type, rawGetter, local) {
  if (store._wrappedGetters[type]) {
    if (process.env.NODE_ENV !== "production") {
      console.error(`[vuex] duplicate getter key: ${type}`);
    }
    return;
  }
  store._wrappedGetters[type] = function wrappedGetter(store) {
    return rawGetter(
      local.state, // local state
      local.getters, // local getters
      store.state, // root state
      store.getters // root getters
    );
  };
}

function resetStoreVM(store, state, hot) {
  // ...
  // bind store public getters
  store.getters = {};
  const wrappedGetters = store._wrappedGetters;
  const computed = {};
  forEachValue(wrappedGetters, (fn, key) => {
    // use computed to leverage its lazy-caching mechanism
    computed[key] = () => fn(store);
    Object.defineProperty(store.getters, key, {
      get: () => store._vm[key],
      enumerable: true, // for local getters
    });
  });

  // use a Vue instance to store the state tree
  // suppress warnings just in case the user has added
  // some funky global mixins
  // ...
  store._vm = new Vue({
    data: {
      $$state: state,
    },
    computed,
  });
  // ...
}
```

在 `installModule` 的过程中，为建立了每个模块的上下文环境， 因此当我们访问 `store.getters.xxx` 的时候，实际上就是执行了 `rawGetter(local.state,...)`，`rawGetter` 就是我们定义的 `getter` 方法，这也就是为什么我们的 `getter` 函数支持这四个参数，并且除了全局的 `state` 和 `getter` 外，我们还可以访问到当前 `module` 下的 `state` 和 `getter`。

#### 数据存储

Vuex 对数据存储的存储本质上就是对 `state` 做修改，并且只允许我们通过提交 `mutaion` 的形式去修改 `state`，`mutation` 是一个函数，如下：

```js
mutations: {
  increment (state) {
    state.count++
  }
}
```

`mutations` 的初始化也是在 `installModule` 的时候：

```js
function installModule(store, rootState, path, module, hot) {
  // ...
  const namespace = store._modules.getNamespace(path);

  // ...
  const local = (module.context = makeLocalContext(store, namespace, path));

  module.forEachMutation((mutation, key) => {
    const namespacedType = namespace + key;
    registerMutation(store, namespacedType, mutation, local);
  });
  // ...
}

function registerMutation(store, type, handler, local) {
  const entry = store._mutations[type] || (store._mutations[type] = []);
  entry.push(function wrappedMutationHandler(payload) {
    handler.call(store, local.state, payload);
  });
}
```

`store` 提供了`commit` 方法让我们提交一个 `mutation`：

```js
commit (_type, _payload, _options) {
  // check object-style commit
  const {
    type,
    payload,
    options
  } = unifyObjectStyle(_type, _payload, _options)

  const mutation = { type, payload }
  const entry = this._mutations[type]
  if (!entry) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[vuex] unknown mutation type: ${type}`)
    }
    return
  }
  this._withCommit(() => {
    entry.forEach(function commitIterator (handler) {
      handler(payload)
    })
  })
  this._subscribers.forEach(sub => sub(mutation, this.state))

  if (
    process.env.NODE_ENV !== 'production' &&
    options && options.silent
  ) {
    console.warn(
      `[vuex] mutation type: ${type}. Silent option has been removed. ` +
      'Use the filter functionality in the vue-devtools'
    )
  }
}
```

这里传入的 `_type` 就是 `mutation` 的 `type`，我们可以从 `store._mutations` 找到对应的函数数组，遍历它们执行获取到每个 `handler` 然后执行，实际上就是执行了 `wrappedMutationHandler(playload)`，接着会执行我们定义的 `mutation` 函数，并传入当前模块的 `state`，所以我们的 `mutation` 函数也就是对当前模块的 `state` 做修改。

需要注意的是， `mutation` 必须是同步函数，但是我们在开发实际项目中，经常会遇到要先去发送一个请求，然后根据请求的结果去修改 `state`，那么单纯只通过 `mutation` 是无法完成需求，因此 Vuex 又给我们设计了一个 `action` 的概念。

`action` 类似于 `mutation`，不同在于 `action` 提交的是 `mutation`，而不是直接操作 `state`，并且它可以包含任意异步操作。例如：

```js
mutations: {
  increment (state) {
    state.count++
  }
},
actions: {
  increment (context) {
    setTimeout(() => {
      context.commit('increment')
    }, 0)
  }
}
```

`actions` 的初始化也是在 `installModule` 的时候：

```js
function installModule(store, rootState, path, module, hot) {
  // ...
  const namespace = store._modules.getNamespace(path);

  // ...
  const local = (module.context = makeLocalContext(store, namespace, path));

  module.forEachAction((action, key) => {
    const type = action.root ? key : namespace + key;
    const handler = action.handler || action;
    registerAction(store, type, handler, local);
  });
  // ...
}

function registerAction(store, type, handler, local) {
  const entry = store._actions[type] || (store._actions[type] = []);
  entry.push(function wrappedActionHandler(payload, cb) {
    let res = handler.call(
      store,
      {
        dispatch: local.dispatch,
        commit: local.commit,
        getters: local.getters,
        state: local.state,
        rootGetters: store.getters,
        rootState: store.state,
      },
      payload,
      cb
    );
    if (!isPromise(res)) {
      res = Promise.resolve(res);
    }
    if (store._devtoolHook) {
      return res.catch((err) => {
        store._devtoolHook.emit("vuex:error", err);
        throw err;
      });
    } else {
      return res;
    }
  });
}
```

`store` 提供了`dispatch` 方法让我们提交一个 `action`：

```js
dispatch (_type, _payload) {
  // check object-style dispatch
  const {
    type,
    payload
  } = unifyObjectStyle(_type, _payload)

  const action = { type, payload }
  const entry = this._actions[type]
  if (!entry) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[vuex] unknown action type: ${type}`)
    }
    return
  }

  this._actionSubscribers.forEach(sub => sub(action, this.state))

  return entry.length > 1
    ? Promise.all(entry.map(handler => handler(payload)))
    : entry[0](payload)
}
```

这里传入的 `_type` 就是 `action` 的 `type`，我们可以从 `store._actions` 找到对应的函数数组，遍历它们执行获取到每个 `handler` 然后执行，实际上就是执行了 `wrappedActionHandler(payload)`，接着会执行我们定义的 `action` 函数，并传入一个对象，包含了当前模块下的 `dispatch`、`commit`、`getters`、`state`，以及全局的 `rootState` 和 `rootGetters`，所以我们定义的 `action` 函数能拿到当前模块下的 `commit` 方法。

因此 `action` 比我们自己写一个函数执行异步操作然后提交 `muataion` 的好处是在于它可以在参数中获取到当前模块的一些方法和状态，Vuex 帮我们做好了这些。

#### 语法糖

我们知道 `store` 是 `Store` 对象的一个实例，它是一个原生的 Javascript 对象，我们可以在任意地方使用它们。但大部分的使用场景还是在组件中使用，那么我们之前介绍过，在 Vuex 安装阶段，它会往每一个组件实例上混入 `beforeCreate` 钩子函数，然后往组件实例上添加一个 `$store` 的实例，它指向的就是我们实例化的 `store`，因此我们可以在组件中访问到 `store` 的任何属性和方法。

比如我们在组件中访问 `state`：

```js
const Counter = {
  template: `<div>{{ count }}</div>`,
  computed: {
    count() {
      return this.$store.state.count;
    },
  },
};
```

但是当一个组件需要获取多个状态时候，将这些状态都声明为计算属性会有些重复和冗余。同样这些问题也在存于 `getter`、`mutation` 和 `action`。

为了解决这个问题，Vuex 提供了一系列 `mapXXX` 辅助函数帮助我们实现在组件中可以很方便的注入 `store` 的属性和方法。

#### `mapState`

我们先来看一下 `mapState` 的用法：

```js
// 在单独构建的版本中辅助函数为 Vuex.mapState
import { mapState } from "vuex";

export default {
  // ...
  computed: mapState({
    // 箭头函数可使代码更简练
    count: (state) => state.count,

    // 传字符串参数 'count' 等同于 `state => state.count`
    countAlias: "count",

    // 为了能够使用 `this` 获取局部状态，必须使用常规函数
    countPlusLocalState(state) {
      return state.count + this.localCount;
    },
  }),
};
```

再来看一下 `mapState` 方法的定义，在 `src/helpers.js` 中：

```js
export const mapState = normalizeNamespace((namespace, states) => {
  const res = {};
  normalizeMap(states).forEach(({ key, val }) => {
    res[key] = function mappedState() {
      let state = this.$store.state;
      let getters = this.$store.getters;
      if (namespace) {
        const module = getModuleByNamespace(this.$store, "mapState", namespace);
        if (!module) {
          return;
        }
        state = module.context.state;
        getters = module.context.getters;
      }
      return typeof val === "function"
        ? val.call(this, state, getters)
        : state[val];
    };
    // mark vuex getter for devtools
    res[key].vuex = true;
  });
  return res;
});

function normalizeNamespace(fn) {
  return (namespace, map) => {
    if (typeof namespace !== "string") {
      map = namespace;
      namespace = "";
    } else if (namespace.charAt(namespace.length - 1) !== "/") {
      namespace += "/";
    }
    return fn(namespace, map);
  };
}

function normalizeMap(map) {
  return Array.isArray(map)
    ? map.map((key) => ({ key, val: key }))
    : Object.keys(map).map((key) => ({ key, val: map[key] }));
}
```

首先 `mapState` 是通过执行 `normalizeNamespace` 返回的函数，它接收 2 个参数，其中 `namespace` 表示命名空间，`map` 表示具体的对象，`namespace` 可不传，稍后我们来介绍 `namespace` 的作用。

当执行 `mapState(map)` 函数的时候，实际上就是执行 `normalizeNamespace` 包裹的函数，然后把 `map` 作为参数 `states` 传入。

`mapState` 最终是要构造一个对象，每个对象的元素都是一个方法，因为这个对象是要扩展到组件的 `computed` 计算属性中的。函数首先执行 `normalizeMap` 方法，把这个 `states` 变成一个数组，数组的每个元素都是 `{key, val}` 的形式。接着再遍历这个数组，以 `key` 作为对象的 `key`，值为一个 `mappedState` 的函数，在这个函数的内部，获取到 `$store.getters` 和 `$store.state`，然后再判断数组的 `val` 如果是一个函数，执行该函数，传入 `state` 和 `getters`，否则直接访问 `state[val]`。

比起一个个手动声明计算属性，`mapState` 确实要方便许多，下面我们来看一下 `namespace` 的作用。

当我们想访问一个子模块的 `state` 的时候，我们可能需要这样访问：

```js
computed: {
  mapState({
    a: state => state.some.nested.module.a,
    b: state => state.some.nested.module.b
  })
},
```

这样从写法上就很不友好，`mapState` 支持传入 `namespace`， 因此我们可以这么写：

```js
computed: {
  mapState('some/nested/module', {
    a: state => state.a,
    b: state => state.b
  })
},
```

这样看起来就清爽许多。在 `mapState` 的实现中，如果有 `namespace`，则尝试去通过 `getModuleByNamespace(this.$store, 'mapState', namespace)` 对应的 `module`，然后把 `state` 和 `getters` 修改为 `module` 对应的 `state` 和 `getters`。

```js
function getModuleByNamespace(store, helper, namespace) {
  const module = store._modulesNamespaceMap[namespace];
  if (process.env.NODE_ENV !== "production" && !module) {
    console.error(
      `[vuex] module namespace not found in ${helper}(): ${namespace}`
    );
  }
  return module;
}
```

我们在 Vuex 初始化执行 `installModule` 的过程中，初始化了这个映射表：

```js
function installModule(store, rootState, path, module, hot) {
  // ...
  const namespace = store._modules.getNamespace(path);

  // register in namespace map
  if (module.namespaced) {
    store._modulesNamespaceMap[namespace] = module;
  }

  // ...
}
```

#### `mapGetters`

我们先来看一下 `mapGetters` 的用法：

```js
import { mapGetters } from 'vuex'

export default {
  // ...
  computed: {
    // 使用对象展开运算符将 getter 混入 computed 对象中
    mapGetters([
      'doneTodosCount',
      'anotherGetter',
      // ...
    ])
  }
}
```

和 `mapState` 类似，`mapGetters` 是将 `store` 中的 `getter` 映射到局部计算属性，来看一下它的定义：

```js
export const mapGetters = normalizeNamespace((namespace, getters) => {
  const res = {};
  normalizeMap(getters).forEach(({ key, val }) => {
    // thie namespace has been mutate by normalizeNamespace
    val = namespace + val;
    res[key] = function mappedGetter() {
      if (
        namespace &&
        !getModuleByNamespace(this.$store, "mapGetters", namespace)
      ) {
        return;
      }
      if (
        process.env.NODE_ENV !== "production" &&
        !(val in this.$store.getters)
      ) {
        console.error(`[vuex] unknown getter: ${val}`);
        return;
      }
      return this.$store.getters[val];
    };
    // mark vuex getter for devtools
    res[key].vuex = true;
  });
  return res;
});
```

`mapGetters` 也同样支持 `namespace`，如果不写 `namespace` ，访问一个子 `module` 的属性需要写很长的 `key`，一旦我们使用了 `namespace`，就可以方便我们的书写，每个 `mappedGetter` 的实现实际上就是取 `this.$store.getters[val]`。

#### `mapMutations`

我们可以在组件中使用 `this.$store.commit('xxx')` 提交 `mutation`，或者使用 `mapMutations` 辅助函数将组件中的 `methods` 映射为 `store.commit` 的调用。

我们先来看一下 `mapMutations` 的用法：

```js
import { mapMutations } from "vuex";

export default {
  // ...
  methods: {
    ...mapMutations([
      "increment", // 将 `this.increment()` 映射为 `this.$store.commit('increment')`

      // `mapMutations` 也支持载荷：
      "incrementBy", // 将 `this.incrementBy(amount)` 映射为 `this.$store.commit('incrementBy', amount)`
    ]),
    ...mapMutations({
      add: "increment", // 将 `this.add()` 映射为 `this.$store.commit('increment')`
    }),
  },
};
```

`mapMutations` 支持传入一个数组或者一个对象，目标都是组件中对应的 `methods` 映射为 `store.commit` 的调用。来看一下它的定义：

```js
export const mapMutations = normalizeNamespace((namespace, mutations) => {
  const res = {};
  normalizeMap(mutations).forEach(({ key, val }) => {
    res[key] = function mappedMutation(...args) {
      // Get the commit method from store
      let commit = this.$store.commit;
      if (namespace) {
        const module = getModuleByNamespace(
          this.$store,
          "mapMutations",
          namespace
        );
        if (!module) {
          return;
        }
        commit = module.context.commit;
      }
      return typeof val === "function"
        ? val.apply(this, [commit].concat(args))
        : commit.apply(this.$store, [val].concat(args));
    };
  });
  return res;
});
```

可以看到 `mappedMutation` 同样支持了 `namespace`，并且支持了传入额外的参数 `args`，作为提交 `mutation` 的 `payload`，最终就是执行了 `store.commit` 方法，并且这个 `commit` 会根据传入的 `namespace` 映射到对应 `module` 的 `commit` 上。

#### `mapActions`

我们可以在组件中使用 `this.$store.dispatch('xxx')` 提交 `action`，或者使用 `mapActions` 辅助函数将组件中的 `methods` 映射为 `store.dispatch` 的调用。

`mapActions` 在用法上和 `mapMutations` 几乎一样，实现也很类似：

```js
export const mapActions = normalizeNamespace((namespace, actions) => {
  const res = {};
  normalizeMap(actions).forEach(({ key, val }) => {
    res[key] = function mappedAction(...args) {
      // get dispatch function from store
      let dispatch = this.$store.dispatch;
      if (namespace) {
        const module = getModuleByNamespace(
          this.$store,
          "mapActions",
          namespace
        );
        if (!module) {
          return;
        }
        dispatch = module.context.dispatch;
      }
      return typeof val === "function"
        ? val.apply(this, [dispatch].concat(args))
        : dispatch.apply(this.$store, [val].concat(args));
    };
  });
  return res;
});
```

和 `mapMutations` 的实现几乎一样，不同的是把 `commit` 方法换成了 `dispatch`。

#### 动态更新模块

在 Vuex 初始化阶段我们构造了模块树，初始化了模块上各个部分。在有一些场景下，我们需要动态去注入一些新的模块，Vuex 提供了模块动态注册功能，在 `store` 上提供了一个 `registerModule` 的 API。

```js
registerModule (path, rawModule, options = {}) {
  if (typeof path === 'string') path = [path]

  if (process.env.NODE_ENV !== 'production') {
    assert(Array.isArray(path), `module path must be a string or an Array.`)
    assert(path.length > 0, 'cannot register the root module by using registerModule.')
  }

  this._modules.register(path, rawModule)
  installModule(this, this.state, path, this._modules.get(path), options.preserveState)
  // reset store to update getters...
  resetStoreVM(this, this.state)
}
```

`registerModule` 支持传入一个 `path` 模块路径 和 `rawModule` 模块定义，首先执行 `register` 方法扩展我们的模块树，接着执行 `installModule` 去安装模块，最后执行 `resetStoreVM` 重新实例化 `store._vm`，并销毁旧的 `store._vm`。

相对的，有动态注册模块的需求就有动态卸载模块的需求，Vuex 提供了模块动态卸载功能，在 `store` 上提供了一个 `unregisterModule` 的 API。

```js
unregisterModule (path) {
  if (typeof path === 'string') path = [path]

  if (process.env.NODE_ENV !== 'production') {
    assert(Array.isArray(path), `module path must be a string or an Array.`)
  }

  this._modules.unregister(path)
  this._withCommit(() => {
    const parentState = getNestedState(this.state, path.slice(0, -1))
    Vue.delete(parentState, path[path.length - 1])
  })
  resetStore(this)
}
```

`unregisterModule` 支持传入一个 `path` 模块路径，首先执行 `unregister` 方法去修剪我们的模块树：

```js
unregister (path) {
  const parent = this.get(path.slice(0, -1))
  const key = path[path.length - 1]
  if (!parent.getChild(key).runtime) return

  parent.removeChild(key)
}
```

注意，这里只会移除我们运行时动态创建的模块。

接着会删除 `state` 在该路径下的引用，最后执行 `resetStore` 方法：

```js
function resetStore(store, hot) {
  store._actions = Object.create(null);
  store._mutations = Object.create(null);
  store._wrappedGetters = Object.create(null);
  store._modulesNamespaceMap = Object.create(null);
  const state = store.state;
  // init all modules
  installModule(store, state, [], store._modules.root, true);
  // reset vm
  resetStoreVM(store, state, hot);
}
```

该方法就是把 `store` 下的对应存储的 `_actions`、`_mutations`、`_wrappedGetters` 和 `_modulesNamespaceMap` 都清空，然后重新执行 `installModule` 安装所有模块以及 `resetStoreVM` 重置 `store._vm`。

#### 总结

那么至此，Vuex 提供的一些常用 API 我们就分析完了，包括数据的存取、语法糖、模块的动态更新等。要理解 Vuex 提供这些 API 都是方便我们在对 `store` 做各种操作来完成各种能力，尤其是 `mapXXX` 的设计，让我们在使用 API 的时候更加方便，这也是我们今后在设计一些 JavaScript 库的时候，从 API 设计角度中应该学习的方向。
