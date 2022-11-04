---
sidebar_position: 5
description: VueX
---

## Vuex

### 1.Vuex 基本原理，有哪些属性，为什么用 Vuex

有什么状态时需要我们在多个组件间共享呢？

比如用户的登录状态、用户名称、头像、地理位置等等。

比如商品的收藏、购物车中的物品等等。

这些状态信息，我们都可以放在统一的地方，对它进行保护管理，而且它们还是响应式的。

以下是一个表示“单向数据流”理念的极简示意：

但是，当我们的应用遇到多个组件共享状态时，单向数据流的简洁性很容易被破坏：

- 多个视图依赖于同一状态。
- 来自不同视图的行为需要变更同一状态。
  对于问题一，传参的方法对于多层嵌套的组件将会非常繁琐，并且对于兄弟组件间的状态传递无能为力。

对于问题二，我们经常会采用父子组件直接引用或者通过事件来变更和同步状态的多份拷贝。以上的这些模式非常脆弱，通常会导致无法维护的代码。

因此，我们为什么不把组件的共享状态抽取出来，以一个全局单例模式管理呢？在这种模式下，我们的组件树构成了一个巨大的“视图”，不管在树的哪个位置，任何组件都能获取状态或者触发行为！

另外，通过定义和隔离状态管理中的各种概念并强制遵守一定的规则，我们的代码将会变得更结构化且易维护。

这就是 Vuex 背后的基本思想，借鉴了 Flux、Redux、和 The Elm Architecture。与其他模式不同的是，Vuex 是专门为 Vue.js 设计的状态管理库，以利用 Vue.js 的细粒度数据响应机制来进行高效的状态更新。

什么情况下应该使用 Vuex？

虽然 Vuex 可以帮助我们管理共享状态，但也附带了更多的概念和框架。这需要对短期和长期效益进行权衡。

如果您不打算开发大型单页应用，使用 Vuex 可能是繁琐冗余的。确实是如此——如果您的应用够简单，您最好不要使用 Vuex。一个简单的 global event bus 就足够您所需了。但是，如果您需要构建是一个中大型单页应用，您很可能会考虑如何更好地在组件外部管理状态，Vuex 将会成为自然而然的选择。引用 Redux 的作者 Dan Abramov 的话说就是：

Flux 架构就像眼镜：您自会知道什么时候需要它。

使用 vue/react 等框架，需要关注点基本就是数据，因为框架解决了数据和页面更新的实现。页面和数据的关系是 y=f(x)

那么我们需要关注数据(model) 和 视图(组件) 之间的关系.

一个组件使用一个 model，一对一的关系 2. 一个组件使用多个 model，一对多的关系 3. 多个组件使用一个 model，多对一的关系 4. 多个组件使用多个 model，多对多的关系
所以组件和数据之间的对应关系，随着项目的复杂，变得混乱。所以需要统一管理数据，把数据的存取集中到一个地方，所有的组件都从这个地方取数据，更新数据也集中到同一个地方。

Vuex 是一个专为 Vue.js 应用程序开发的状态管理模式。每一个 Vuex 应用的核心就是 store（仓库）。“store” 基本上就是一个容器，它包含着你的应用中大部分的状态 ( state )。

- Vuex 的状态存储是响应式的。当 Vue 组件从 store 中读取状态的时候，若 store 中的状态发生变化，那么相应的组件也会相应地得到高效更新。
- 改变 store 中的状态的唯一途径就是显式地提交 (commit) mutation。这样可以方便地跟踪每一个状态的变化。

![b025e120ca3d0bd2ded3d038d58cacf4.jpg](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs/202208202301928.webp)

Vuex 为 Vue Components 建立起了一个完整的生态圈，包括开发中的 API 调用一环。

**（1)核心流程中的主要功能：**

- Vue Components 是 vue 组件，组件会触发（dispatch）一些事件或动作，也就是图中的 Actions;
- 在组件中发出的动作，肯定是想获取或者改变数据的，但是在 vuex 中，数据是集中管理的，不能直接去更改数据，所以会把这个动作提交（Commit）到 Mutations 中;
- 然后 Mutations 就去改变（Mutate）State 中的数据;
- 当 State 中的数据被改变之后，就会重新渲染（Render）到 Vue Components 中去，组件展示更新后的数据，完成一个流程。
- 有五种属性，分别是 State、 Getter、Mutation 、Action、 Module
  - state => 基本数据(数据源存放地)
  - getters => 从基本数据派生出来的数据
  - mutations => 提交更改数据的方法，同步
  - actions => 像一个装饰器，包裹 mutations，使之可以异步。
  - modules => 模块化 Vuex

**（2）各模块在核心流程中的主要功能：**

- `Vue Components`∶ Vue 组件。HTML 页面上，负责接收用户操作等交互行为，执行 dispatch 方法触发对应 action 进行回应。
- `dispatch`∶ 操作行为触发方法，是唯一能执行 action 的方法。
- `actions`∶ 操作行为处理模块。负责处理 Vue Components 接收到的所有交互行为。包含同步/异步操作，支持多个同名方法，按照注册的顺序依次触发。向后台 API 请求的操作就在这个模块中进行，包括触发其他 action 以及提交 mutation 的操作。该模块提供了 Promise 的封装，以支持 action 的链式触发。
- `commit`∶ 状态改变提交操作方法。对 mutation 进行提交，是唯一能执行 mutation 的方法。
- `mutations`∶ 状态改变操作方法。是 Vuex 修改 state 的唯一推荐方法，其他修改方式在严格模式下将会报错。该方法只能进行同步操作，且方法名只能全局唯一。操作之中会有一些 hook 暴露出来，以进行 state 的监控等。
- `state`∶ 页面状态管理容器对象。集中存储 Vuecomponents 中 data 对象的零散数据，全局唯一，以进行统一的状态管理。页面显示所需的数据从该对象中进行读取，利用 Vue 的细粒度数据响应机制来进行高效的状态更新。
- `getters`∶ state 对象读取方法。图中没有单独列出该模块，应该被包含在了 render 中，Vue Components 通过该方法读取全局 state 对象。

### 2.Vuex 中的 actions 和 mutations 的区别

mutation 中的操作是一系列的同步函数，用于修改 state 中的变量的的状态。当使用 vuex 时需要通过 commit 来提交需要操作的内容。mutation 非常类似于事件：每个 mutation 都有一个字符串的 事件类型 (type) 和 一个 回调函数 (handler)。这个回调函数就是实际进行状态更改的地方，并且它会接受 state 作为第一个参数：

```javascript
const store = new Vuex.Store({
  state: {
    count: 1,
  },
  mutations: {
    increment(state) {
      state.count++; // 变更状态
    },
  },
});
```

当触发一个类型为 increment 的 mutation 时，需要调用此函数：

```javascript
store.commit("increment");
```

而 Action 类似于 mutation，不同点在于：

- Action 可以包含任意异步操作。
- Action 提交的是 mutation，而不是直接变更状态。

```javascript
const store = new Vuex.Store({
  state: {
    count: 0,
  },
  mutations: {
    increment(state) {
      state.count++;
    },
  },
  actions: {
    increment(context) {
      context.commit("increment");
    },
  },
});
```

Action 函数接受一个与 store 实例具有相同方法和属性的 context 对象，因此你可以调用 context.commit 提交一个 mutation，或者通过 context.state 和 context.getters 来获取 state 和 getters。 所以，两者的不同点如下：

- Mutation 专注于修改 State，理论上是修改 State 的唯一途径；Action 业务代码、异步请求。
- Mutation：必须同步执行；Action：可以异步，但不能直接操作 State。
- 在视图更新时，先触发 actions，actions 再触发 mutation
- mutation 的参数是 state，它包含 store 中的数据；store 的参数是 context，它是 state 的父级，包含 state、getters

### 3.Vuex 和 localstorage 的区别

**（1）最重要的区别**

- vuex 存储在内存中
- localstorage 则以文件的方式存储在本地，只能存储字符串类型的数据，存储对象需要 JSON 的 stringify 和 parse 方法进行处理。 读取内存比读取硬盘速度要快

**（2）应用场景**

- Vuex 是一个专为 Vue.js 应用程序开发的状态管理模式。它采用集中式存储管理应用的所有组件的状态，并以相应的规则保证状态以一种可预测的方式发生变化。vuex 用于组件之间的传值。
- localstorage 是本地存储，是将数据存储到浏览器的方法，一般是在跨页面传递数据时使用 。
- Vuex 能做到数据的响应式，localstorage 不能

**（3）永久性**

刷新页面时 vuex 存储的值会丢失，localstorage 不会。

**注意：** 对于不变的数据确实可以用 localstorage 可以代替 vuex，但是当两个组件共用一个数据源（对象或数组）时，如果其中一个组件改变了该数据源，希望另一个组件响应该变化时，localstorage 无法做到，原因就是区别 1。

### 4.Vuex 的 mutations 为什么不能做异步操作

- Vuex 中所有的状态更新的唯一途径都是 mutation，异步操作通过 Action 来提交 mutation 实现，这样可以方便地跟踪每一个状态的变化，从而能够实现一些工具帮助更好地了解我们的应用。
- 每个 mutation 执行完成后都会对应到一个新的状态变更，这样 devtools 就可以打个快照存下来，然后就可以实现 time-travel 了。如果 mutation 支持异步操作，就没有办法知道状态是何时更新的，无法很好的进行状态的追踪，给调试带来困难。

### 5.注意的问题

在组件里面 用方法执行 dispatch('函数名'，value)

actions 对象中函数接受参数（context,value) 执行 context.commit('函数名',value)

mutations 对象 中函数接受参数（state,value)

getters 用于将 state 中的数据进行加工

mapState 传入对象包含计算属性名和 state 对应的变量名 产生了一个对象 可以在计算属性对象里面进行展开 mapstate 生成计算属性 从 state 中读取数据 对象可以简写成数组[ ' ' ] namespaced true 才能让 mapstate 识别模块名简写

mapGetters 传入对象包含计算属性名和 state 对应的变量名

mapActions 生成对应方法 方法中会调用 dispatch 去联系 actions 注意模块名

mapMutations 生成对应方法 方法中会调用 commit 去联系 mutations 注意模块名

### 6.Vuex 持久化

vuex 的 store 中的数据是保存在运行内存中的，当页面刷新时，页面会重新加载 vue 实例，vuex 里面的数据就会被重新赋值，这样就会出现页面刷新 vuex 中的数据丢失的问题。 如何解决浏览器刷新数据丢失问题呢？

#### 方法一：

全局监听，页面刷新的时候将 store 里 state 的值存到 sessionStorage 中，然后从 sessionStorage 中获取，再赋值给 store ，并移除 sessionStorage 中的数据。在 app.vue 中添加以下代码：

```js
 created() {
    window.addEventListener('beforeunload',()=>{
       sessionStorage.setItem('list', JSON.stringify(this.$store.state))
    })

    try{
      sessionStorage.getItem('list') && this.$store.replaceState(Object.assign({},this.$store.state,JSON.parse(sessionStorage.getItem('list'))))
    }catch(err) {
      console.log(err);
    }

    sessionStorage.removeItem("list");
  }
 注意!!! storage 只能存储字符串的数据，对于 JS 中常用的数组或对象不能直接存储。但我们可以通过JSON 对象提供的 parse 和 stringify 方法将其他数据类型转化成字符串，再存储到storage中就可以了。
```

#### 方法二：

安装 vuex-persistedstate 插件

```js
1. npm install vuex-persistedstate -S //安装插件
2. 在 store/index.js 文件中添加以下代码：
import persistedState from 'vuex-persistedstate'
const store = new Vuex.Store({
 state:{},
 getters:{},
 ...
 plugins: [persistedState()] //添加插件
})
注意!!! vuex-persistedstate 默认使用 localStorage 来存储数据，若要实现无痕浏览该如何实现呢？
```

这时候就需要使用 sessionStorage 进行存储，修改 plugins 中的代码

```js
plugins: [persistedState({ storage: window.sessionStorage })];
```

### 7.Vuex 为什么是响应式的

#### `vuex`响应式原理

一旦理解了`vue`的模板如何响应数据变化，那么`vuex`就好理解了

`vuex`本质上是将`state`值绑定到了一个`vue`对象上，请看超简略源码：

```js
class Store {
  constructor(options) {
    this.state = new Vue({
      data: options.state,
    });
  }
}
```

于是当我们在`test.vue`中写出这种代码：

```js
<template>
	<div>{{ $store.state.xx }}</div>
</template>
```

`test.vue`实例`mount`的时候执行`updateComponent`，就会为`updateComponent`函数绑定一个依赖：`Store.state.xx`这个属性的`Dep`对象（暂时命名为`xxDep`,便于后续说明）

那么一旦通过`commit`或其他手段更新了属性`Store.state.xx`，`xxDep`就会通知`updateComponent`所绑定的`Watcher`去执行`update`

```js
Watcher.prototype.update = function(){
	if (this.lazy) {
    	...
    } else {
    	// 将此watcher加入队列，在nextick中执行
        // 最终会执行到Watcher.getter，本例中也就是updateComponent
		queueWatcher(this);
	}
}
```

从而最终又执行到了`updateComponent`去更新 dom 树，而在执行`updateComponent`过程中解析 dom 树时会重新获取`{{ $store.state.xx }}`，从而正确的更新了 dom，实现了`store.state`到`vue`对象的绑定

#### store.getters

上面讲了`store.state`如何绑定到`vue`对象，那么`store.getters`呢？

```js
var wrappedGetters = store._wrappedGetters;
var computed = {};
forEachValue(wrappedGetters, function (fn, key) {
  computed[key] = partial(fn, store);
  Object.defineProperty(store.getters, key, {
    get: function () {
      return store._vm[key];
    },
    enumerable: true, // for local getters
  });
});

store._vm = new Vue({
  data: {
    $$state: state,
  },
  computed: computed,
});
```

可以看到对于每个 getters 的值，最终放在两个地方：`store.getters`, `store`内部的`vue`对象上的`computed`属性，`computed`属性的双向绑定机制跟`data`属性类似，这里不多讲

而通过`store.getters.key`获取的值根据以上代码，得到的是`store._vm[key]`,而这个就是`computed[key]`,因为`computed`属性都会绑定到`vm`对象上。所以`store.getters[key]===computed[key]`，是完完全全的同一个值

#### 装载到`vue`

`vue2`中使用`vuex`需要执行`vue.use(vuex)`。最终会执行到`vuex`的`install`方法

```js
// 初始化全局Vue对象时挂载store，并在跟元素上生成
new Vue({
    store,
    ...
})

function install() {
    Vue.mixin({
        beforeCreate() {
            if (this.$options.store) {
                this.$store = this.$options.store // 这里对应根组件
                return
            }
            this.$store = this.$parent.$store // 其他组件逐级向上取
        }
    })
}
```

通过生命周期给每个组件单独挂载`$store`，而不是直接`Vue.prototype.$store =`，这样可以防止声明多个`vuex`实例后覆盖

```javascript
vue3`中挂载`vuex`要执行`app.use(store)`。最终会执行到`Store.prototype.install
function install (app, injectKey) {
    // globalProperties属性上挂载的属性可以在app下所有组件实例中访问到
    app.config.globalProperties.$store = this;
}
```

### 8.Vuex 源码分析

[Vuex 源码分析](https://juejin.cn/post/6895980141466386440)

```js
// store/index
import Vue from "vue";
import Vuex from "vuex";
import cart from "./modules/cart";
import products from "./modules/products";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    rootState: "rootState",
  },
  mutations: {
    rootMutation(state, payload) {
      state.value = payload;
    },
  },
  actions: {
    rootAction({ commit }, payload) {
      commit("updateValue", payload);
    },
  },
  getters: {
    rootGetter: (state) => state.rootState,
  },
  modules: {
    cart,
    products,
  },
});
```

```js
// app.js
import Vue from "vue";
import store from "./store";

new Vue({
  el: "#app",
  store,
  render: (h) => h(App),
});
```

使用 vuex 有如下 3 个步骤

**1. 显式地通过 Vue.use() 来安装 Vuex；**

**2. 通过 Vuex.Store 构造与实际业务相关的 store;**

**3. 在 Vue 的实例化时，添加 store 属性；**

Vuex 是专门为 Vuejs 应用程序设计的**状态管理工具**。它采用集中式存储管理应用的所有组件的状态，并以相应的规则保证状态以一种可预测的方式发生变化。

#### **1.Vuex 的构成和使用**

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/Imgs/v2-f330e46f1a97cfe60b8914802688083b_r.jpg)

由上图，我们可以看出 Vuex 有以下几个部分构成：

**1）state**

state 是存储的单一状态，是存储的基本数据。

**2）Getters**

getters 是 store 的计算属性，对 state 的加工，是派生出来的数据。就像 computed 计算属性一样，getter 返回的值会根据它的依赖被缓存起来，且只有当它的依赖值发生改变才会被重新计算。

**3）Mutations**

mutations 提交更改数据，使用 store.commit 方法更改 state 存储的状态。（mutations 同步函数）

**4）Actions**

actions 像一个装饰器，提交 mutation，而不是直接变更状态。（actions 可以包含任何异步操作）

**5）Module**

Module 是 store 分割的模块，每个模块拥有自己的 state、getters、mutations、actions。

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
  actions: { ... }
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

**6）辅助函数**

Vuex 提供了 mapState、MapGetters、MapActions、mapMutations 等辅助函数给开发在 vm 中处理 store。

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/Imgs/v2-90437dee8c4d7b465b2d0e6e07778ff0_r.jpg)

```js
import Vuex from "vuex";
Vue.use(Vuex); // 1. vue的插件机制，安装vuex
let store = new Vuex.Store({
  // 2.实例化store，调用install方法
  state,
  getters,
  modules,
  mutations,
  actions,
  plugins,
});
new Vue({
  // 3.注入store, 挂载vue实例
  store,
  render: (h) => h(app),
}).$mount("#app");
```

**Vuex 的设计思想**

Vuex 的设计思想，借鉴了 Flux、Redux，将数据存放到全局的 store，再将 store 挂载到每个 vue 实例组件中，利用 Vue.js 的细粒度数据响应机制来进行高效的状态更新。

看了 Vuex 设计思想，心里难免会有这样的疑问：

- vuex 的 store 是**如何挂载注入到组件中**呢？
- vuex 的 state 和**getters 是如何映射到各个组件实例中响应式更新状态**呢？

#### 2.**Vuex 的原理解析**

我们来看下 vuex 的源码，分析看看上面 2 个疑惑的问题：

**疑问 1：vuex 的 store 是如何挂载注入到组件中呢？**

1、在 vue 项目中先安装 vuex，核心代码如下：

```js
import Vuex from "vuex";
Vue.use(vuex); // vue的插件机制
```

2、利用 vue 的[插件机制](https://cn.vuejs.org/v2/guide/plugins.html)，使用 Vue.use(vuex)时，会调用 vuex 的 install 方法，装载 vuex，install 方法的代码如下：

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

3、applyMixin 方法使用 vue[混入机制](https://cn.vuejs.org/v2/guide/mixins.html)，vue 的生命周期 beforeCreate 钩子函数前混入 vuexInit 方法，核心代码如下：

```js
Vue.mixin({ beforeCreate: vuexInit });

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
```

分析源码，我们知道了**vuex 是利用 vue 的 mixin 混入机制**，在 beforeCreate 钩子前**混入 vuexInit 方法**，vuexInit 方法实现了 store 注入 vue 组件实例，**并注册了 vuex store 的引用属性$store**。store 注入过程如下图所示：

![img](https://pic4.zhimg.com/v2-a8b969f8771a1fc13b7cedfdfe86f0e7_r.jpg)

**疑问 2：vuex 的 state 和 getters 是如何映射到各个组件实例中响应式更新状态呢？**

store 实现的源码在 src/store.js

1、我们在源码中找到 resetStoreVM 核心方法：

```js
function resetStoreVM(store, state, hot) {
  const oldVm = store._vm;

  // 设置 getters 属性
  store.getters = {};
  const wrappedGetters = store._wrappedGetters;
  const computed = {};
  // 遍历 wrappedGetters 属性
  forEachValue(wrappedGetters, (fn, key) => {
    // 给 computed 对象添加属性
    computed[key] = partial(fn, store);
    // 重写 get 方法
    // store.getters.xx 其实是访问了store._vm[xx]，其中添加 computed 属性
    Object.defineProperty(store.getters, key, {
      get: () => store._vm[key],
      enumerable: true, // for local getters
    });
  });

  const silent = Vue.config.silent;
  Vue.config.silent = true;
  // 创建Vue实例来保存state，同时让state变成响应式
  // store._vm._data.$$state = store.state
  store._vm = new Vue({
    data: {
      $$state: state,
    },
    computed,
  });
  Vue.config.silent = silent;

  // 只能通过commit方式更改状态
  if (store.strict) {
    enableStrictMode(store);
  }
}
```

从上面源码，我们可以看出 Vuex 的 state 状态是响应式，是**借助 vue 的 data 是响应式，将 state 存入 vue 实例组件的 data 中**；Vuex 的 getters 则是**借助 vue 的计算属性 computed 实现数据实时监听**。

computed 计算属性**监听 data 数据变更**主要经历以下几个过程：

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/Imgs/v2-2730644102b66eef140110b814a90496_r.jpg)

**小结**

Vuex 是通过全局注入 store 对象，来实现组件间的状态共享。在大型复杂的项目中（多级组件嵌套），需要实现一个组件更改某个数据，多个组件自动获取更改后的数据进行业务逻辑处理，这时候使用 vuex 比较合适。假如只是多个组件间传递数据，使用 vuex 未免有点大材小用，其实只用使用组件间常用的通信方法即可。

Vue 组件简单常用的通信方式有以下几种：

1、父子通信：

父向子传值，通过 props；子向父传值通过 events ($emit)；父调用子方法通过 ref；provide / inject。

2、兄弟通信：bus

3、跨级嵌套通信：bus；provide / inject 等。

### 9.Pinia 和 Vuex 对比

完整的 typescript 的支持；

足够轻量，压缩后的体积只有 1.6kb;

去除 mutations，只有 state，getters，actions（这是我最喜欢的一个特点）；

actions 支持同步和异步；

没有模块嵌套，只有 store 的概念，store 之间可以自由使用，更好的代码分割；

### 10.手写 vuex

index.js

```js
import Vue from "vue";
// import Vuex from 'vuex' //引用三方库
import Vuex from "./vuex"; //使用自定义vuex.js

Vue.use(Vuex); //使用插件

//每一个vue实例中都有一个属性$store
export default new Vuex.Store({
  state: {
    num: 1,
  },
  getters: {
    getNum(state) {
      return state.num;
    },
  },
  mutations: {
    //同步
    //payload---传入参数
    syncAdd(state, payload) {
      state.num += payload;
    },
    syncMinus(state, payload) {
      state.num -= payload;
    },
  },
  actions: {
    //异步
    asyncAdd({ commit, dispatch }, payload) {
      //模拟ajax
      setTimeout(() => {
        //调用mutation
        commit("syncAdd", payload);
      }, 1000);
    },
  },
  modules: {},
});
```

vuex.js

```js
//自己实现vuex
let Vue;

const forEach = (obj, callback) => {
  Object.keys(obj).forEach((key) => {
    callback(key, obj[key]);
  });
};

class Store {
  constructor(options) {
    this.vm = new Vue({
      data: {
        state: options.state,
      },
    });

    //for getters
    let getters = options.getters || {};
    this.getters = {};
    //把getters中属性定义到this.getters
    Object.keys(getters).forEach((getterName) => {
      Object.defineProperty(this.getters, getterName, {
        get: () => {
          return getters[getterName](this.state);
        },
      });
    });
    //for mutations
    let mutations = options.mutations || {};
    this.mutations = {};
    Object.keys(mutations).forEach((mutationName) => {
      this.mutations[mutationName] = (payload) => {
        mutations[mutationName](this.state, payload);
      };
    });
    //for actions
    let actions = options.actions || {};
    this.actions = {};
    Object.keys(actions).forEach((actionName) => {
      this.actions[actionName] = (payload) => {
        actions[actionName](this, payload);
      };
    });
  }
  dispatch(type, payload) {
    this.actions[type](payload);
  }
  commit = (type, payload) => {
    console.log(this);
    this.mutations[type](payload);
  };
  get state() {
    return this.vm.state;
  }
}

// 安装插件
// 目的：让每一个组件都有$store
const install = (_Vue) => {
  Vue = _Vue;
  //给每一个组件都注册一个beforeCreate
  Vue.mixin({
    beforeCreate() {
      console.log(this.$options.name);
      if (this.$options && this.$options.store) {
        //根
        this.$store = this.$options.store;
      } else {
        //子
        this.$store = this.$parent && this.$parent.$store;
      }
    },
  });
};

export default {
  install,
  Store,
};
```
