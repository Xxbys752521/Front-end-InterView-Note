---
sidebar_position: 2
description: 生命周期
---

## 生命周期

### 1.生命周期有哪些，vue2 和 vue3 有什么区别

#### Vue2 生命周期

![image-20220907204915660](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsimage-20220907204915660.png)

Vue 实例有⼀个完整的⽣命周期，也就是从开始创建、初始化数据、编译模版、挂载 Dom -> 渲染、更新 -> 渲染、卸载 等⼀系列过程，称这是 Vue 的⽣命周期。

1. **beforeCreate（创建前）**：数据观测和初始化事件还未开始，此时 data 的响应式追踪、event/watcher 都还没有被设置，也就是说不能访问到 data、computed、watch、methods 上的方法和数据。
2. **created（创建后）** ：实例创建完成，实例上配置的 options 包括 data、computed、watch、methods 等都配置完成，但是此时渲染得节点还未挂载到 DOM，所以不能访问到 `$el` 属性。
3. **beforeMount（挂载前）**：在挂载开始之前被调用，相关的 render 函数首次被调用。实例已完成以下的配置：编译模板，把 data 里面的数据和模板生成 html。此时还没有挂载 html 到页面上。
4. **mounted（挂载后）**：在 el 被新创建的 vm.$el 替换，并挂载到实例上去之后调用。实例已完成以下的配置：用上面编译好的 html 内容替换 el 属性指向的 DOM 对象。完成模板中的 html 渲染到 html 页面中。mounted 以后可以进行 dom 操作
5. **beforeUpdate（更新前）**：响应式数据更新时调用，此时虽然响应式数据更新了，但是对应的真实 DOM 还没有被渲染。
6. **updated（更新后）** ：在由于数据更改导致的虚拟 DOM 重新渲染和打补丁之后调用。此时 DOM 已经根据响应式数据的变化更新了。调用时，组件 DOM 已经更新，所以可以执行依赖于 DOM 的操作。然而在大多数情况下，应该避免在此期间更改状态，因为这可能会导致更新无限循环。该钩子在服务器端渲染期间不被调用。
7. **beforeDestroy（销毁前）**：实例销毁之前调用。这一步，实例仍然完全可用，`this` 仍能获取到实例。
8. **destroyed（销毁后）**：实例销毁后调用，调用后，Vue 实例指示的所有东西都会解绑定，所有的事件监听器会被移除，所有的子实例也会被销毁。该钩子在服务端渲染期间不被调用。

另外还有 `keep-alive` 独有的生命周期，分别为 `activated` 和 `deactivated` 。用 `keep-alive` 包裹的组件在切换时不会进行销毁，而是缓存到内存中并执行 `deactivated` 钩子函数，命中缓存渲染后会执行 `activated` 钩子函数。

created 和 mounted 都是同步的，API 请求是异步的

一般请求都是异步的，一般无论放到哪里请求都会在 mounted 之后返回，所以放哪儿页面都会至少更新两次

**created 里的情况**

![image](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/img/2718076-20220223231908634-1883404271.png)

也就是说，再发送 API 请求以后，就会产生 2 个分支，代码逻辑比较混乱

**mounted 里的情况**
created => mounted => mounte 组件首次渲染 => API 请求 => 获取到数据 => update 组件重新渲染

建议放在 created 里

created:在模板渲染成 html 前调用，即通常初始化某些属性值，然后再渲染成视图。这时已经拿到数据，然后在进行渲染。

mounted:在模板渲染成 html 后调用，通常是初始化页面完成后，再对 html 的 dom 节点进行一些需要的操作。

如果在 mounted 钩子函数中请求数据可能导致页面闪屏问题

其实就是加载时机问题，放在 created 里会比 mounted 触发早一点，如果在页面挂载完之前请求完成的话就不会看到闪屏了

首先给出结论：created 和 mounted 中发起 ajax 请求是一样的，没有区别。
为啥没有区别：created 和 mounted 是在同一个 tick 中执行的，而 ajax 请求的时间一定会超过一个 tick。所以即便 ajax 的请求耗时是 0ms， 那么也是在 nextTick 中更新数据到 DOM 中。所以说在不依赖 DOM 节点的情况下一点区别都没有。

#### Vue3 生命周期

组件中 setup 的执行顺序

创建组件，先初始化 props，再依次执行 setup、beforeCreate、created

setup() 内部(组合式 api)调用的生命周期钩子里是没有`beforeCreate` 和 `Create`函数的。
官方解释： 因为 `setup` 是围绕 `beforeCreate` 和 `created` 生命周期钩子运行的，所以不需要显式地定义它们。换句话说，在这些钩子中编写的任何代码都应该直接在 `setup` 函数中编写

beforeMount => onBeforeMount

mounted => onMounted

beforeUpdate => onBeforeUpdate

updated => onUpdated

beforeUnmount => onBeforeUnmount

unmount => onUnmounted

在 comsition API 中不存在 beforeCreate 和 created 这两个生命周期函数 因为 setup 函数的执行时间在 beforeCreate 和 created 之前，有需要执行的内容可以直接在 setup 函数中执行，没必要再写在 beforeCreate 和 created 中

vue3 中新增了 onRenderTracked 生命周期函数 指的是每次渲染之后收集页面响应式的依赖的时候会自动执行的函数

当页面渲染的时候，vue 都会重新收集响应式的依赖，响应式的依赖一旦重新渲染需要重新收集的时候 onRenderTracked 便会自动执行一次 页面首次渲染便会执行 页面再次重新渲染也会执行 与 onRenderTracked 对应的函数是 onRenderTriggered 指每次重新渲染被触发的时候，首次页面加载不会触发，当数据改变，页面重新渲染的时候触发，onRenderTracked 也会再次触发。

### 2.created 和 mounted 有什么区别

- created:在模板渲染成 html 前调用，即通常初始化某些属性值，然后再渲染成视图。
- mounted:在模板渲染成 html 后调用，通常是初始化页面完成后，再对 html 的 dom 节点进行一些需要的操作。

### 3.异步请求放在那个生命周期函数

我们可以在钩子函数 created、beforeMount、mounted 中进行调用，因为在这三个钩子函数中，data 已经创建，可以将服务端端返回的数据进行赋值。

推荐在 created 钩子函数中调用异步请求，因为在 created 钩子函数中调用异步请求有以下优点：

- 能更快获取到服务端数据，减少页面加载时间，用户体验更好；
- SSR 不支持 beforeMount 、mounted 钩子函数，放在 created 中有助于一致性。

### 4.keep-alive 生命周期

keep-alive 是 Vue 提供的一个内置组件，用来对组件进行缓存——在组件切换过程中将状态保留在内存中，防止重复渲染 DOM。

如果为一个组件包裹了 keep-alive，那么它会多出两个生命周期：deactivated、activated。同时，beforeDestroy 和 destroyed 就不会再被触发了，因为组件不会被真正销毁。

当组件被换掉时，会被缓存到内存中、触发 deactivated 生命周期；当组件被切回来时，再去缓存里找这个组件、触发 activated 钩子函数。

### 5.Vue 子组件和父组件执行顺序

**加载渲染过程：**

1. 父组件 beforeCreate
2. 父组件 created
3. 父组件 beforeMount
4. 子组件 beforeCreate
5. 子组件 created
6. 子组件 beforeMount
7. 子组件 mounted
8. 父组件 mounted

**更新过程：**

1. 父组件 beforeUpdate
2. 子组件 beforeUpdate
3. 子组件 updated
4. 父组件 updated

**销毁过程：**

1. 父组件 beforeDestroy
2. 子组件 beforeDestroy
3. 子组件 destroyed
4. 父组件 destoryed

把父组件的 data 通过 props 传递给子组件的时候，子组件在初次渲染的时候生命周期或者 render 方法，有调用 data 相关的 props 的属性, 这样子组件也被添加到父组件的 data 的相关属性依赖中，这样父组件的 data 在 set 的时候，就相当于触发自身和子组件的 update。
例子如下:

```javascript
// main.vue
import Vue from 'vue'
import App from './App'

const root = new Vue({
  data: {
    state: false
  },
  mounted() {
    setTimeout(() => {
      this.state = true
    }, 1000)
  },
  render: function(h) {
    const { state } = this // state 变化重新触发render
    let root = h(App, { props: { status: state } })
    console.log('root:', root)
    return root
  }
}).$mount('#app')

window.root = root
// App.vue
<script>
export default {
  props: {
    status: Boolean
  },
  render: function (h){
    const { status } = this
    let app = h('h1', ['hello world'])
    console.log('app:', app)
    return app
  }
}
</script>
```

截图如下:

<img src="https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs/202208202300173.png" alt="clipboard.png"  />
在`main.js`中 **state** 状态发生了变化，由`false` => `true`, 触发了**自身**与**子组件**的render方法。

### 6.生命周期源码分析

[Vue 的完整生命周期源码流程详解](https://juejin.cn/post/7017712966485147678)

[Vue 的生命周期之间到底做了什么事清？](https://juejin.cn/post/6844904114879463437)

#### 初始化流程

```js
export function initMixin(Vue: Class<Component>) {
  // 在原型上添加 _init 方法
  Vue.prototype._init = function (options?: Object) {
    // 保存当前实例
    const vm: Component = this;
    // 合并配置
    if (options && options._isComponent) {
      // 把子组件依赖父组件的 props、listeners 挂载到 options 上，并指定组件的$options
      initInternalComponent(vm, options);
    } else {
      // 把我们传进来的 options 和当前构造函数和父级的 options 进行合并，并挂载到原型上
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      );
    }
    vm._self = vm;
    initLifecycle(vm); // 初始化实例的属性、数据：$parent, $children, $refs, $root, _watcher...等
    initEvents(vm); // 初始化事件：$on, $off, $emit, $once
    initRender(vm); // 初始化渲染： render, mixin
    callHook(vm, "beforeCreate"); // 调用生命周期钩子函数
    initInjections(vm); // 初始化 inject
    initState(vm); // 初始化组件数据：props, data, methods, watch, computed
    initProvide(vm); // 初始化 provide
    callHook(vm, "created"); // 调用生命周期钩子函数

    if (vm.$options.el) {
      // 如果传了 el 就会调用 $mount 进入模板编译和挂载阶段
      // 如果没有传就需要手动执行 $mount 才会进入下一阶段
      vm.$mount(vm.$options.el);
    }
  };
}
```

#### new Vue

从 `new Vue(options)` 开始作为入口，`Vue` 只是一个简单的构造函数，内部是这样的：

```js
function Vue(options) {
  this._init(options);
}
```

进入了 `_init` 函数之后，先初始化了一些属性。

1.  `initLifecycle`：初始化一些属性如`$parent`，`$children`。根实例没有 `$parent`，`$children` 开始是空数组，直到它的 `子组件` 实例进入到 `initLifecycle` 时，才会往父组件的 `$children` 里把自身放进去。所以 `$children` 里的一定是组件的实例。
2.  `initEvents`：初始化事件相关的属性，如 `_events` 等。
3.  `initRender`：初始化渲染相关如 `$createElement`，并且定义了 `$attrs` 和 `$listeners` 为`浅层`响应式属性。具体可以查看`细节`章节。并且还定义了`$slots`、`$scopedSlots`，其中 `$slots` 是立刻赋值的，但是 `$scopedSlots` 初始化的时候是一个 `emptyObject`，直到组件的 `vm._render` 过程中才会通过 `normalizeScopedSlots` 去把真正的 `$scopedSlots` 整合后挂到 `vm` 上。

然后开始第一个生命周期：

```js
callHook(vm, "beforeCreate");
```

#### beforeCreate 被调用完成

`beforeCreate` 之后

1.  初始化 `inject`
2.  初始化 `state`
    - 初始化 `props`
    - 初始化 `methods`
    - 初始化 `data`
    - 初始化 `computed`
    - 初始化 `watch`
3.  初始化 `provide`

所以在 `data` 中可以使用 `props` 上的值，反过来则不行

然后进入 `created` 阶段：

```js
callHook(vm, "created");
```

#### created 被调用完成

调用 `$mount` 方法，开始挂载组件到 `dom` 上。

如果使用了 `runtime-with-compile` 版本，则会把你传入的 `template` 选项，或者 `html` 文本，通过一系列的编译生成 `render` 函数。

- 编译这个 `template`，生成 `ast` 抽象语法树。
- 优化这个 `ast`，标记静态节点。（渲染过程中不会变的那些节点，优化性能）。
- 根据 `ast`，生成 `render` 函数。

对应具体的代码就是：

```js
const ast = parse(template.trim(), options);
if (options.optimize !== false) {
  optimize(ast, options);
}
const code = generate(ast, options);
```

如果是脚手架搭建的项目的话，这一步 `vue-cli` 已经帮你做好了，所以就直接进入 `mountComponent` 函数。

那么，确保有了 `render` 函数后，我们就可以往`渲染`的步骤继续进行了

#### beforeMount 被调用完成

把 `渲染组件的函数` 定义好，具体代码是：

```js
updateComponent = () => {
  vm._update(vm._render(), hydrating);
};
```

拆解来看，`vm._render` 其实就是调用我们上一步拿到的 `render` 函数生成一个 `vnode`，而 `vm._update` 方法则会对这个 `vnode` 进行 `patch` 操作，帮我们把 `vnode` 通过 `createElm`函数创建新节点并且渲染到 `dom节点` 中

接下来就是执行这段代码了，是由 `响应式原理` 的一个核心类 `Watcher` 负责执行这个函数，为什么要它来代理执行呢？因为我们需要在这段过程中去 `观察` 这个函数读取了哪些响应式数据，将来这些**响应式数据更新**的时候，我们需要重新执行 `updateComponent` 函数

如果是更新后调用 `updateComponent` 函数的话，`updateComponent` 内部的 `patch` 就不再是初始化时候的创建节点，而是对新旧 `vnode` 进行 `diff`，最小化的更新到 `dom节点` 上去

这一切交给 `Watcher` 完成：

```js
new Watcher(
  vm,
  updateComponent,
  noop,
  {
    before() {
      if (vm._isMounted) {
        callHook(vm, "beforeUpdate");
      }
    },
  },
  true /* isRenderWatcher */
);
```

注意这里在`before` 属性上定义了`beforeUpdate` 函数，也就是说在 `Watcher` 被响应式属性的更新触发之后，重新渲染新视图之前，会先调用 `beforeUpdate` 生命周期。

注意，在 `render` 的过程中，如果遇到了 `子组件`，则会调用 `createComponent` 函数。

`createComponent` 函数内部，会为子组件生成一个属于自己的`构造函数`，可以理解为子组件自己的 `Vue` 函数：

```js
Ctor = baseCtor.extend(Ctor);
```

在普通的场景下，其实这就是 `Vue.extend` 生成的构造函数，它继承自 `Vue` 函数，拥有它的很多全局属性。

这里插播一个知识点，除了组件有自己的`生命周期`外，其实 `vnode` 也是有自己的 `生命周期的`，只不过我们平常开发的时候是接触不到的。

那么`子组件的 vnode` 会有自己的 `init` 周期，这个周期内部会做这样的事情：

```js
// 创建子组件
const child = createComponentInstanceForVnode(vnode);
// 挂载到 dom 上
child.$mount(vnode.elm);
```

而 `createComponentInstanceForVnode` 内部又做了什么事呢？它会去调用 `子组件` 的构造函数。

```js
new vnode.componentOptions.Ctor(options);
```

构造函数的内部是这样的：

```js
const Sub = function VueComponent(options) {
  this._init(options);
};
```

这个 `_init` 其实就是我们文章开头的那个函数，也就是说，如果遇到 `子组件`，那么就会优先开始`子组件`的构建过程，也就是说，从 `beforeCreated` 重新开始。这是一个递归的构建过程。

也就是说，如果我们有 `父 -> 子 -> 孙` 这三个组件，那么它们的初始化生命周期顺序是这样的：

```
父 beforeCreate
父 create
父 beforeMount
子 beforeCreate
子 create
子 beforeMount
孙 beforeCreate
孙 create
孙 beforeMount
孙 mounted
子 mounted
父 mounted
```

然后，`mounted` 生命周期被触发

#### mounted 被调用完成

到此为止，组件的挂载就完成了，初始化的生命周期结束

#### 更新流程

当一个响应式属性被更新后，触发了 `Watcher` 的回调函数，也就是 `vm._update(vm._render())`，在更新之前，会先调用刚才在 `before` 属性上定义的函数，也就是

```js
callHook(vm, "beforeUpdate");
```

注意，由于 Vue 的异步更新机制，`beforeUpdate` 的调用已经是在 `nextTick` 中了。 具体代码如下：

```js
nextTick(flushSchedulerQueue)

function flushSchedulerQueue {
  for (index = 0; index < queue.length; index++) {
    watcher = queue[index]
    if (watcher.before) {
     // callHook(vm, 'beforeUpdate')
      watcher.before()
    }
 }
}
```

#### beforeUpdate 被调用完成

然后经历了一系列的 `patch`、`diff` 流程后，组件重新渲染完毕，调用 `updated` 钩子。

注意，这里是对 `watcher` 倒序 `updated` 调用的。

也就是说，假如同一个属性通过 `props` 分别流向 `父 -> 子 -> 孙` 这个路径，那么收集到依赖的先后也是这个顺序，但是触发 `updated` 钩子确是 `孙 -> 子 -> 父` 这个顺序去触发的。

```js
function callUpdatedHooks(queue) {
  let i = queue.length;
  while (i--) {
    const watcher = queue[i];
    const vm = watcher.vm;
    if (vm._watcher === watcher && vm._isMounted) {
      callHook(vm, "updated");
    }
  }
}
```

#### updated 被调用完成

至此，渲染更新流程完毕

#### 销毁流程

在刚刚所说的更新后的 `patch` 过程中，如果发现有组件在下一轮渲染中消失了，比如 `v-for` 对应的数组中少了一个数据。那么就会调用 `removeVnodes` 进入组件的销毁流程。

`removeVnodes` 会调用 `vnode` 的 `destroy` 生命周期，而 `destroy` 内部则会调用我们相对比较熟悉的 `vm.$destroy()`。（keep-alive 包裹的子组件除外）

这时，就会调用 `callHook(vm, 'beforeDestroy')`

#### beforeDestroy 被调用完成

之后就会经历一系列的`清理`逻辑，清除父子关系、`watcher` 关闭等逻辑。但是注意，`$destroy` 并不会把组件从视图上移除，如果想要手动销毁一个组件，则需要我们自己去完成这个逻辑。

然后，调用最后的 `callHook(vm, 'destroyed')`

#### destroyed 被调用完成
