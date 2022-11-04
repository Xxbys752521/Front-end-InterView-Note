---
sidebar_position: 6
description: Vue3
---


## Vue3

### 1.Vue3 有哪些新特性？

**（1）监测机制的改变**

- 3.0 将带来基于代理 Proxy 的 observer 实现，提供全语言覆盖的反应性跟踪。
- 消除了 Vue 2 当中基于 Object.defineProperty 的实现所存在的很多限制：

**（2）只能监测属性，不能监测对象**

- 检测属性的添加和删除；
- 检测数组索引和长度的变更；
- 支持 Map、Set、WeakMap 和 WeakSet。

**（3）模板**

- 作用域插槽，2.x 的机制导致作用域插槽变了，父组件会重新渲染，而 3.0 把作用域插槽改成了函数的方式，这样只会影响子组件的重新渲染，提升了渲染的性能。
- 同时，对于 render 函数的方面，vue3.0 也会进行一系列更改来方便习惯直接使用 api 来生成 vdom 。

**（4）对象式的组件声明方式**

- vue2.x 中的组件是通过声明的方式传入一系列 option，和 TypeScript 的结合需要通过一些装饰器的方式来做，虽然能实现功能，但是比较麻烦。
- 3.0 修改了组件的声明方式，改成了类式的写法，这样使得和 TypeScript 的结合变得很容易

**（5）其它方面的更改**

- 支持 Fragment（多个根节点）和 Protal（在 dom 其他部分渲染组建内容）组件，针对一些特殊的场景做了处理。
- 基于 tree shaking 优化，提供了更多的内置功能。
- 生命周期 名称发生变化 使用 setup 在 beforeCreate 钩子之前调用
- diff 算法

#### 1. vue2 和 vue3 响应式原理发生了改变

**vue2** 的双向数据绑定是利用 ES5 的一个 [API](https://so.csdn.net/so/search?q=API&spm=1001.2101.3001.7020) `Object.definePropert()`对数据进行劫持 结合 发布订阅模式的方式来实现的。

**vue3** 中使用了 [es6](https://so.csdn.net/so/search?q=es6&spm=1001.2101.3001.7020) 的 `Proxy`API 对数据代理。

> 相比于 vue2.x，使用 proxy 的优势如下
>
> 1. defineProperty 只能监听某个属性，不能对全对象监听
> 2. 可以省去 for in、闭包等内容来提升效率（直接绑定整个对象即可）
> 3. 可以监听数组，不用再去单独的对数组做特异性操作 vue3.x 可以检测到数组内部数据的变化

在 vue2 中只需要在 data 里定义数据，就可以实现数据层-视图层的双向绑定，而在 vue3 中使用 ref 接受一个内部值并返回一个响应式且可变的 ref 对象。ref 对象具有指向内部值的单个 property.value

reactive 的作用和 ref 的作用是类似的，都是将数据变成可相应的对象，其实 ref 的底层其实利用了 reactive。 两者的区别，ref 包装的对象需要.value ,而 reactive 中的不需要

#### 2. Vue3 支持碎片(Fragments)

就是说在组件可以拥有多个根节点。
**vue2**

```html
<template>
  <div class="form-element">
    <h2>{{ title }}</h2>
  </div>
</template>
```

**vue3**

```html
<template>
  <div class="form-element"></div>
  <h2>{{ title }}</h2>
</template>
```

#### 3. Composition API

Vue2 与 Vue3 `最大的`区别 — Vue2 使用选项类型 API（Options API）对比 Vue3 合成型 API（Composition API）

> 旧的选项型 API 在代码里分割了不同的属性: data,computed 属性，methods，等等。新的合成型 API 能让我们用方法（function）来分割，相比于旧的 API 使用属性来分组，`这样代码会更加简便和整洁`。

`Composition API`也叫组合式 API，是 Vue3.x 的新特性。

> 通过创建 Vue 组件，我们可以将接口的可重复部分及其功能提取到可重用的代码段中。仅此一项就可以使我们的应用程序在可维护性和灵活性方面走得更远。然而，我们的经验已经证明，光靠这一点可能是不够的，尤其是当你的应用程序变得非常大的时候——想想几百个组件。在处理如此大的应用程序时，共享和重用代码变得尤为重要

- Vue2.0 中，随着功能的增加，组件变得越来越复杂，越来越难维护，而难以维护的根本原因是 Vue 的 API 设计迫使开发者使用`watch，computed，methods`选项组织代码，而不是实际的业务逻辑。
- 另外 Vue2.0 缺少一种较为简洁的低成本的机制来完成逻辑复用，虽然可以`minxis`完成逻辑复用，但是当`mixin`变多的时候，会使得难以找到对应的`data、computed`或者`method`来源于哪个`mixin`，使得类型推断难以进行。
- 所以`Composition API`的出现，主要是也是为了解决 Option API 带来的问题，第一个是代码组织问题，`Compostion API`可以让开发者根据业务逻辑组织自己的代码，让代码具备更好的可读性和可扩展性，也就是说当下一个开发者接触这一段不是他自己写的代码时，他可以更好的利用代码的组织反推出实际的业务逻辑，或者根据业务逻辑更好的理解代码。
- 第二个是实现代码的逻辑提取与复用，当然`mixin`也可以实现逻辑提取与复用，但是像前面所说的，多个`mixin`作用在同一个组件时，很难看出`property`是来源于哪个`mixin`，来源不清楚，另外，多个`mixin`的`property`存在变量命名冲突的风险。而`Composition API`刚好解决了这两个问题。

**vue2**

```js
export default {
  props: {
    title: String,
  },
  data() {
    return {
      username: "",
      password: "",
    };
  },
  methods: {
    login() {
      // 登陆方法
    },
  },
  components: {
    buttonComponent: btnComponent,
  },
  computed: {
    fullName() {
      return this.firstName + " " + this.lastName;
    },
  },
};
```

**vue3**

```js
export default {
  props: {
    title: String,
  },

  setup() {
    const state = reactive({
      //数据
      username: "",
      password: "",
      lowerCaseUsername: computed(() => state.username.toLowerCase()), //计算属性
    });
    //方法
    const login = () => {
      // 登陆方法
    };
    return {
      login,
      state,
    };
  },
};
```

#### 4. 建立数据 data

**Vue2 - 这里把数据放入 data 属性中**

```js
export default {
  props: {
    title: String,
  },
  data() {
    return {
      username: "",
      password: "",
    };
  },
};
```

在 Vue3.0，我们就需要使用一个新的 setup()方法，此方法在组件初始化构造的时候触发。

使用以下三步来建立反应性数据:

1. 从 vue 引入 reactive
2. 使用 reactive()方法来声名我们的数据为响应性数据
3. 使用 setup()方法来返回我们的响应性数据，从而我们的 template 可以获取这些响应性数据

```js
import { reactive } from "vue";

export default {
  props: {
    title: String,
  },
  setup() {
    const state = reactive({
      username: "",
      password: "",
    });

    return { state };
  },
};
```

template 使用，可以通过 state.username 和 state.password 获得数据的值。

```html
<template>
  <div>
    <h2>{{ state.username }}</h2>
  </div>
</template>
```

#### 5. 生命周期钩子 — Lifecyle Hooks

```js
Vue2--------------vue3
beforeCreate  -> setup()
created       -> setup()
beforeMount   -> onBeforeMount
mounted       -> onMounted
beforeUpdate  -> onBeforeUpdate
updated       -> onUpdated
beforeDestroy -> onBeforeUnmount
destroyed     -> onUnmounted
activated     -> onActivated
deactivated   -> onDeactivated
```

1. setup() :开始创建组件之前，在 beforeCreate 和 created 之前执行。创建的是 data 和 method
2. onBeforeMount() : 组件挂载到节点上之前执行的函数。
3. onMounted() : 组件挂载完成后执行的函数。
4. onBeforeUpdate(): 组件更新之前执行的函数。
5. onUpdated(): 组件更新完成之后执行的函数。
6. onBeforeUnmount(): 组件卸载之前执行的函数。
7. onUnmounted(): 组件卸载完成后执行的函数

- 若组件被`<keep-alive>`包含，则多出下面两个钩子函数。

1. onActivated(): 被包含在中的组件，会多出两个生命周期钩子函数。被激活时执行 。
2. onDeactivated(): 比如从 A 组件，切换到 B 组件，A 组件消失时执行。

#### 6. 父子传参不同，setup() 函数特性

总结：
1、setup 函数时，它将接受两个参数：（props、context(包含 attrs、slots、emit)）

2、setup 函数是处于 生命周期函数 beforeCreate 和 Created 两个钩子函数之前的函数

3、执行 setup 时，组件实例尚未被创建（在 setup() 内部，this 不会是该活跃实例的引用，即不指向 vue 实例，Vue 为了避免我们错误的使用，直接将 `setup函数中的this修改成了 undefined`）

4、与模板一起使用：需要返回一个对象 (在 setup 函数中定义的变量和方法最后都是需要 return 出去的 不然无法再模板中使用)

5、使用渲染函数：可以返回一个渲染函数，该函数可以直接使用在同一作用域中声明的响应式状态

**注意事项：**

1、setup 函数中不能使用 this。Vue 为了避免我们错误的使用，直接将 `setup函数中的this修改成了 undefined`）

2、setup 函数中的 props 是响应式的，当传入新的 prop 时，它将被更新。但是，因为 props 是响应式的，你`不能使用 ES6 解构`，因为它会消除 prop 的响应性。

如果需要解构 prop，可以通过使用 setup 函数中的`toRefs` 来完成此操作：
**父传子，props**

```js
import { toRefs } from 'vue'

setup(props) {
	const { title } = toRefs(props)

	console.log(title.value)
	 onMounted(() => {
      console.log('title: ' + props.title)
    })

}
```

**子传父，事件 - Emitting Events**

举例，现在我们想在点击提交按钮时触发一个 login 的事件。

在 Vue2 中我们会调用到 this.$emit 然后传入事件名和参数对象。

```js
login () {
      this.$emit('login', {
        username: this.username,
        password: this.password
      })
 }
```

在 setup()中的第二个参数 content 对象中就有 emit，这个是和 this.$emit 是一样的。那么我们只要在 setup()接收第二个参数中使用分解对象法取出 emit 就可以在 setup 方法中随意使用了。

然后我们在 login 方法中编写登陆事件
另外：context 是一个普通的 JavaScript 对象，也就是说，它不是响应式的，这意味着你可以安全地对 context 使用 ES6 解构

```js
setup (props, { attrs, slots, emit }) {
    // ...
    const login = () => {
      emit('login', {
        username: state.username,
        password: state.password
      })
    }

    // ...
}

```

3、 setup()内使用响应式数据时，需要通过.value 获取

```js
import { ref } from "vue";

const count = ref(0);
console.log(count.value); // 0
```

4、从 setup() 中返回的对象上的 property 返回并可以在模板中被访问时，它将自动展开为内部值。不需要在模板中追加 .value

5、setup 函数只能是同步的不能是异步的

#### 7. vue3 Teleport 瞬移组件

Teleport 一般被翻译成瞬间移动组件,实际上是不好理解的.我把他理解成"独立组件",
他可以那你写的组件挂载到任何你想挂载的 DOM 上,所以是很自由很独立的
以一个例子来看:编写一个弹窗组件

```html
<template>
  <teleport to="#modal">
    <div id="center" v-if="isOpen">
      <h2><slot>this is a modal</slot></h2>
      <button @click="buttonClick">Close</button>
    </div>
  </teleport>
</template>
<script lang="ts">
  export default {
    props: {
      isOpen: Boolean,
    },
    emits: {
      "close-modal": null,
    },
    setup(props, context) {
      const buttonClick = () => {
        context.emit("close-modal");
      };
      return {
        buttonClick,
      };
    },
  };
</script>
<style>
  #center {
    width: 200px;
    height: 200px;
    border: 2px solid black;
    background: white;
    position: fixed;
    left: 50%;
    top: 50%;
    margin-left: -100px;
    margin-top: -100px;
  }
</style>
```

在 app.vue 中使用的时候跟普通组件调用是一样的

```html
<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png" />
    <HelloWorld msg="Welcome to Your Vue.js App" />
    <HooksDemo></HooksDemo>
    <button @click="openModal">Open Modal</button><br />
    <modal :isOpen="modalIsOpen" @close-modal="onModalClose">
      My Modal !!!!</modal
    >
  </div>
</template>
<script>
  import HelloWorld from "./components/HelloWorld.vue";
  import HooksDemo from "./components/HooksDemo.vue";
  import Modal from "./components/Modal.vue";
  import { ref } from "vue";
  export default {
    name: "App",
    components: {
      HelloWorld,
      HooksDemo,
      Modal,
    },
    setup() {
      const modalIsOpen = ref(false);
      const openModal = () => {
        modalIsOpen.value = true;
      };
      const onModalClose = () => {
        modalIsOpen.value = false;
      };
      return {
        modalIsOpen,
        openModal,
        onModalClose,
      };
    },
  };
</script>

<style>
  #app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
  }
</style>
```

要是在 app.vue 文件中使用的时候,modal 是在 app 的 DOM 节点之下的,父节点的 dom 结构和 css 都会给 modal 产生影响
于是产生的问题

1. modal 被包裹在其它组件之中，容易被干扰
2. 样式也在其它组件中，容易变得非常混乱

Teleport 可以把 modal 组件渲染到任意你想渲染的外部 Dom 上,不必嵌套在#app 中,这样就可以互不干扰了,可以把 Teleport 看成一个传送门,把你的组件传送到任何地方
使用的时候 to 属性可以确定想要挂载的 DOM 节点下面

```html
<template>
  <teleport to="#modal">
    <div id="center">
      <h2>柏特better</h2>
    </div>
  </teleport>
</template>

12345678
```

在 public 文件夹下的 index.html 中增加一个节点

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width,initial-scale=1.0" />
    <link rel="icon" href="<%= BASE_URL %>favicon.ico" />
    <title><%= htmlWebpackPlugin.options.title %></title>
  </head>
  <body>
    <noscript>
      <strong
        >We're sorry but <%= htmlWebpackPlugin.options.title %> doesn't work
        properly without JavaScript enabled. Please enable it to
        continue.</strong
      >
    </noscript>
    <div id="app"></div>
    <div id="modal"></div>
    <!-- built files will be auto injected -->
  </body>
</html>

12345678910111213141516171819
```

这样可以看到 modal 组件就是没有挂载在 app 下,不再受 app 组件的影响了

### 2.Proxy 的优点

#### proxy 使用

Vue 在实例初始化时遍历 data 中的所有属性，并使用 Object.defineProperty 把这些属性全部转为 getter/setter。这样当追踪数据发生变化时，setter 会被自动调用。

Object.defineProperty 是 ES5 中一个无法 shim 的特性，这也就是 Vue 不支持 IE8 以及更低版本浏览器的原因。

但是这样做有以下问题：

1. 添加或删除对象的属性时，Vue 检测不到。因为添加或删除的对象没有在初始化进行响应式处理，只能通过`$set` 来调用`Object.defineProperty()`处理。
2. 无法监控到数组下标和长度的变化。

Vue3 使用 Proxy 来监控数据的变化。Proxy 是 ES6 中提供的功能，其作用为：用于定义基本操作的自定义行为（如属性查找，赋值，枚举，函数调用等）。相对于`Object.defineProperty()`，其有以下特点：

1. Proxy 直接代理整个对象而非对象属性，这样只需做一层代理就可以监听同级结构下的所有属性变化，包括新增属性和删除属性。
2. Proxy 可以监听数组的变化。

在 Vue2 中， 0bject.defineProperty 会改变原始数据，而 Proxy 是创建对象的虚拟表示，并提供 set 、get 和 deleteProperty 等处理器，这些处理器可在访问或修改原始对象上的属性时进行拦截，有以下特点 ∶

- 不需用使用 `Vue.$set` 或 `Vue.$delete` 触发响应式。
- 全方位的数组变化检测，消除了 Vue2 无效的边界情况。
- 支持 Map，Set，WeakMap 和 WeakSet。

Proxy 实现的响应式原理与 Vue2 的实现原理相同，实现方式大同小异 ∶

- get 收集依赖
- Set、delete 等触发依赖
- 对于集合类型，就是对集合对象的方法做一层包装：原方法执行后执行依赖相关的收集或触发逻辑。

- vue3 使用 [proxy](https://link.juejin.cn/?target=https%3A%2F%2Fdeveloper.mozilla.org%2Fzh-CN%2Fdocs%2FWeb%2FJavaScript%2FReference%2FGlobal_Objects%2FProxy) 监听对象的变化

> - 针对对象：针对整个对象，而不是对象的某个属性，所以也就不需要对 keys 进行遍历。
> - 支持数组：Proxy 不需要对数组的方法进行重载，省去了众多 hack，减少代码量等于减少了维护成本，而且标准的就是最好的。
> - Proxy 的第二个参数可以有 13 种拦截方法，这比起 Object.defineProperty() 要更加丰富
> - Proxy 作为新标准受到浏览器厂商的重点关注和性能优化，相比之下 Object.defineProperty() 是一个已有的老方法。

每当我们改变代理对象(vue2 对象)的时候，比如我们新增一个`age`属性，即使`change`函数里面没有使用到`age`, 我们也会触发`change`函数。 所以我们要正确收集依赖，怎样正确收集依赖呢

- 不同的对象单独存储
- 同一个对象不同属性也要单独存储

- 存储对象我们可以使用 [WeakMap](https://link.juejin.cn/?target=https%3A%2F%2Fdeveloper.mozilla.org%2Fzh-CN%2Fdocs%2FWeb%2FJavaScript%2FReference%2FGlobal_Objects%2FWeakMap)

> **`WeakMap`** 对象是一组键/值对的集合，其中的键是弱引用(原对象销毁的时候可以被垃圾回收)的。其键必须是`对象`，而值可以是任意的。

- 存储对象不同属性可以使用 [Map](https://link.juejin.cn/?target=https%3A%2F%2Fdeveloper.mozilla.org%2Fzh-CN%2Fdocs%2FWeb%2FJavaScript%2FReference%2FGlobal_Objects%2FMap)

> **`Map`** 对象保存键值对，并且能够记住键的原始插入顺序。任何值(对象或者[原始值](https://link.juejin.cn/?target=https%3A%2F%2Fdeveloper.mozilla.org%2Fzh-CN%2Fdocs%2FGlossary%2FPrimitive)) 都可以作为一个键或一个值。

### 3.Vue3 的响应式

[手写简单 vue3 响应式原理](https://juejin.cn/post/7134281691295645732)

vue2 跟 vue3 实现方式不同：

- vue2 使用 Object.defineProperty() 劫持对象监听数据的变化

> - 不能监听数组的变化
> - 必须遍历对象的每个属性
> - 必须深层遍历嵌套的对象

- vue3 使用 [proxy](https://link.juejin.cn/?target=https%3A%2F%2Fdeveloper.mozilla.org%2Fzh-CN%2Fdocs%2FWeb%2FJavaScript%2FReference%2FGlobal_Objects%2FProxy) 监听对象的变化

> - 针对对象：针对整个对象，而不是对象的某个属性，所以也就不需要对 keys 进行遍历。
> - 支持数组：Proxy 不需要对数组的方法进行重载，省去了众多 hack，减少代码量等于减少了维护成本，而且标准的就是最好的。
> - Proxy 的第二个参数可以有 13 种拦截方法，这比起 Object.defineProperty() 要更加丰富
> - Proxy 作为新标准受到浏览器厂商的重点关注和性能优化，相比之下 Object.defineProperty() 是一个已有的老方法。

#### 为什么 Proxy 要配合 Reflect 一起使用

##### 触发代理对象的劫持时保证正确的 this 上下文指向

在阅读 Proxy 的 MDN 文档上可能会发现其实 Proxy 中 get 陷阱中还会存在一个额外的参数 receiver 。

那么这里的 receiver 究竟表示什么意思呢？**大多数同学会将它理解成为代理对象**

```javascript
<script type="text/javaScript">
  const person = {
      name:'Barry',
      age:22
  }

  const p  =new Proxy(person,{
        // get陷阱中target表示原对象 key表示访问的属性名
        get(target, key, receiver) {
            console.log(receiver === p);
            return target[key];
        },

  })
</script>
```

上述的例子中，**我们在 Proxy 实例对象的 get 陷阱上接收了 receiver 这个参数**。

同时，我们在陷阱内部打印 **\*\*`console.log(receiver === proxy);`\*\*** 它会打印出 true ，**\*\*表示这里 receiver 的确是和代理对象相等的。\*\***

那么你可以稍微思考下这里的 receiver 究竟是什么呢？ 其实这也是 proxy 中 get 第三个 receiver 存在的意义。

**\*\*它是为了传递正确的调用者指向\*\***

通过我们上述对 window.Reflect 的打印可以看到，Reflect 的方法、属性和 Proxy 是一样的，所以 Reflect get 也是有这 第三个 receiver 属性的；

```javascript
<script type="text/javaScript">
  const person = {
      name:'Barry',
      age:22
  }

  const p  =new Proxy(person,{
        // get陷阱中target表示原对象 key表示访问的属性名
        get(target, key, receiver) {
            console.log(receiver === p);
            return Reflect.get(target,key,receiver)
        },

  })
  console.log(p.name);
</script>
```

上述代码原理其实非常简单：

> **我们在 Reflect 中 get 陷阱中第三个参数传递了 Proxy 中的 receiver 也就是 obj 作为形参，它会修改调用时的 this 指向。**
>
> **你可以简单的将 \*\*`Reflect.get(target, key, receiver)`\*\* 理解成为 \*\*`target[key].call(receiver)`\*\*，不过这是一段伪代码，但是这样你可能更好理解。**

相信看到这里你已经明白 Relfect 中的 receiver 代表的含义是什么了，没错它正是可以修改属性访问中的 this 指向为传入的 receiver 对象。

##### 框架健壮性

为什么会说道框架的健壮性呢？我们一起看一段代码

```javascript
<script type="text/javaScript">
  const person = {
      name:'Barry',
      age:22
  }


  Object.defineProperty(person,'height',{
      get(){
          return 180
      }
  })
  Object.defineProperty(person,'height',{
      get(){
          return 170
      }
  })
</script>
```

看一下浏览器运行环境

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/img/026fa64e0baa4a7e8cbaeef12bc9a19c.png)

我们可以看到，使用 Object.defineProperty() 重复声明的属性 报错了，因为 JavaScript 是单线程语言，一旦抛出异常，后边的任何逻辑都不会执行，所以为了避免这种情况，我们在底层就要写 大量的 try catch 来避免，不够优雅。

**我们来看一下 Reflect 会是什么情况？**

```javascript
<script type="text/javaScript">
   const person = {
       name:'Barry',
       age:22
   }


  const h1 = Reflect.defineProperty(person,'height',{
       get(){
           return 180
       }
   })
   const h2 =  Reflect.defineProperty(person,'height',{
       get(){
           return 175
       }
   })
   console.log(h1); // true
   console.log(h2); // false
   console.log(person); //age: 22,name: "Barry",height: 180
</script>
```

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/img/d3bb0b4a505b4d7c82f1c771d4a17c1e.png)

我们可以看到使用 **Reflect.defineProperty() 是有返回值的**，所以通过 返回值 来判断你当前操作是否成功。

#### 依赖收集

每当我们改变代理对象(vue2 对象)的时候，比如我们新增一个`age`属性，即使`change`函数里面没有使用到`age`, 我们也会触发`change`函数。 所以我们要正确收集依赖，怎样正确收集依赖呢

- 不同的对象单独存储
- 同一个对象不同属性也要单独存储

- 存储对象我们可以使用 WeakMap

> **`WeakMap`** 对象是一组键/值对的集合，其中的键是弱引用(原对象销毁的时候可以被垃圾回收)的。其键必须是`对象`，而值可以是任意的。

- 存储对象不同属性可以使用 [Map](https://link.juejin.cn/?target=https%3A%2F%2Fdeveloper.mozilla.org%2Fzh-CN%2Fdocs%2FWeb%2FJavaScript%2FReference%2FGlobal_Objects%2FMap)

> **`Map`** 对象保存键值对，并且能够记住键的原始插入顺序。任何值(对象或者[原始值](https://link.juejin.cn/?target=https%3A%2F%2Fdeveloper.mozilla.org%2Fzh-CN%2Fdocs%2FGlossary%2FPrimitive)) 都可以作为一个键或一个值。

**Dep 是一个集合 Set 存储对应的 effect**

![image.png](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs/202208202301735.webp)

```js
const targetMap = new WeakMap();
const getDepend = (target, key) => {
  // 根据target对象获取Map
  let desMap = targetMap.get(target);
  if (!desMap) {
    desMap = new Map();
    targetMap.set(target, desMap);
  }
  // 根据key获取 depend类
  let depend = desMap.get(key);
  if (!depend) {
    depend = new Set();
    desMap.set(key, depend);
  }
  return depend;
};
```

```js
const reactive = (obj) => {
  return new Proxy(obj, {
    get: (target, key) => {
      // 收集依赖
      const depend = getDepend(target, key);
      depend.addDepend();
      return Reflect.get(target, key);
    },
    set: (target, key, value) => {
      const depend = getDepend(target, key);
      Reflect.set(target, key, value);
      // 当值发生改变时 触发
      depend.notify();
    },
  });
};
```

![image-20221022215111581](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/img/image-20221022215111581.png)

在源码中

核心就是**在访问响应式数据的时候**，触发 `getter` 函数，进而执行 `track` 函数收集依赖：

```js
let shouldTrack = true;
// 当前激活的 effect
let activeEffect;
// 原始数据对象 map
const targetMap = new WeakMap();
function track(target, type, key) {
  if (!shouldTrack || activeEffect === undefined) {
    return;
  }
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    // 每个 target 对应一个 depsMap
    targetMap.set(target, (depsMap = new Map()));
  }
  let dep = depsMap.get(key);
  if (!dep) {
    // 每个 key 对应一个 dep 集合
    depsMap.set(key, (dep = new Set()));
  }
  if (!dep.has(activeEffect)) {
    // 收集当前激活的 effect 作为依赖
    dep.add(activeEffect);
    // 当前激活的 effect 收集 dep 集合作为依赖
    activeEffect.deps.push(dep);
  }
}
```

分析这个函数的实现前，我们先想一下要收集的依赖是什么，我们的目的是实现响应式，就是当数据变化的时候可以自动做一些事情，比如执行某些函数，所以我们收集的依赖就是数据变化后执行的副作用函数。

`track` 函数拥有三个参数，其中 `target` 表示原始数据；`type` 表示这次依赖收集的类型；`key` 表示访问的属性。

`track` 函数外部创建了全局的 `targetMap` 作为原始数据对象的 `Map`，它的键是 `target`，值是 `depsMap`，作为依赖的 `Map`；这个 `depsMap` 的键是 `target` 的 `key`，值是 `dep` 集合，`dep` 集合中存储的是依赖的副作用函数。为了方便理解，可以通过下图表示它们之间的关系：

![image-20220828113446237](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsimage-20220828113446237.png)

因此每次执行 `track` 函数，就是把当前激活的副作用函数 `activeEffect` 作为依赖，然后收集到 `target` 相关的 `depsMap` 对应 `key` 下的依赖集合 `dep` 中

#### 派发通知

派发通知发生在数据更新的阶段，核心就是在修改响应式数据时，触发 `setter` 函数，进而执行 `trigger` 函数派发通知:

```js
const targetMap = new WeakMap();
function trigger(target, type, key) {
  // 通过 targetMap 拿到 target 对应的依赖集合
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    // 没有依赖，直接返回
    return;
  }
  // 创建运行的 effects 集合
  const effects = new Set();
  // 添加 effects 的函数
  const add = (effectsToAdd) => {
    if (effectsToAdd) {
      effectsToAdd.forEach((effect) => {
        effects.add(effect);
      });
    }
  };
  // SET | ADD | DELETE 操作之一，添加对应的 effects
  if (key !== void 0) {
    add(depsMap.get(key));
  }
  const run = (effect) => {
    // 调度执行
    if (effect.options.scheduler) {
      effect.options.scheduler(effect);
    } else {
      // 直接运行
      effect();
    }
  };
  // 遍历执行 effects
  effects.forEach(run);
}
```

`trigger` 函数拥有三个参数，其中 `target` 表示目标原始对象；`type` 表示更新的类型；`key` 表示要修改的属性。

`trigger` 函数 主要做了四件事情：

1. 从 `targetMap` 中拿到 `target` 对应的依赖集合 `depsMap`；
2. 创建运行的 `effects` 集合；
3. 根据 `key` 从 `depsMap` 中找到对应的 `effect` 添加到 `effects` 集合；
4. 遍历 `effects` 执行相关的副作用函数。

因此每次执行 `trigger` 函数，就是根据 `target` 和 `key`，从 `targetMap` 中找到相关的所有副作用函数遍历执行一遍。

在描述依赖收集和派发通知的过程中，我们都提到了一个词：副作用函数，依赖收集过程中我们把 `activeEffect`（当前激活副作用函数）作为依赖收集

#### 副作用函数

那么，什么是副作用函数，在介绍它之前，我们先回顾一下响应式的原始需求，即我们修改了数据就能自动做某些事情，举个简单的例子：

```js
import { reactive } from "vue";
const counter = reactive({
  num: 0,
});
function logCount() {
  console.log(counter.num);
}
function count() {
  counter.num++;
}
logCount();
count();
```

我们定义了响应式对象 `counter`，然后在 `logCount` 中访问了 `counter.num`，我们希望在执行 `count` 函数修改 `counter.num` 值的时候，能自动执行 `logCount` 函数。

按我们之前对依赖收集过程的分析，如果`logCount` 是 `activeEffect` 的话，那么就可以实现需求，但显然是做不到的，因为代码在执行到 `console.log(counter.num)` 这一行的时候，它对自己在 `logCount` 函数中的运行是一无所知的。

那么该怎么办呢？其实只要我们运行 `logCount` 函数前，把 `logCount` 赋值给 `activeEffect` 就好了：

```js
activeEffect = logCount;
logCount();
```

顺着这个思路，我们可以利用高阶函数的思想，对 `logCount` 做一层封装：

```js
function wrapper(fn) {
  const wrapped = function (...args) {
    activeEffect = fn;
    fn(...args);
  };
  return wrapped;
}
const wrappedLog = wrapper(logCount);
wrappedLog();
```

`wrapper` 本身也是一个函数，它接受 `fn` 作为参数，返回一个新的函数 `wrapped`，然后维护一个全局变量 `activeEffect`，当 `wrapped` 执行的时候，把 `activeEffect` 设置为 `fn`，然后执行 `fn` 即可。

这样当我们执行 `wrappedLog` 后，再去修改 `counter.num`，就会自动执行 `logCount` 函数了。

实际上 Vue 3 就是采用类似的做法，在它内部就有一个 `effect` 副作用函数，我们来看一下它的实现：

```js
// 全局 effect 栈
const effectStack = [];
// 当前激活的 effect
let activeEffect;
function effect(fn, options = EMPTY_OBJ) {
  if (isEffect(fn)) {
    // 如果 fn 已经是一个 effect 函数了，则指向原始函数
    fn = fn.raw;
  }
  // 创建一个 wrapper，它是一个响应式的副作用的函数
  const effect = createReactiveEffect(fn, options);
  if (!options.lazy) {
    // lazy 配置，计算属性会用到，非 lazy 则直接执行一次
    effect();
  }
  return effect;
}
function createReactiveEffect(fn, options) {
  const effect = function reactiveEffect() {
    if (!effect.active) {
      // 非激活状态，则判断如果非调度执行，则直接执行原始函数。
      return options.scheduler ? undefined : fn();
    }
    if (!effectStack.includes(effect)) {
      // 清空 effect 引用的依赖
      cleanup(effect);
      try {
        // 开启全局 shouldTrack，允许依赖收集
        enableTracking();
        // 压栈
        effectStack.push(effect);
        activeEffect = effect;
        // 执行原始函数
        return fn();
      } finally {
        // 出栈
        effectStack.pop();
        // 恢复 shouldTrack 开启之前的状态
        resetTracking();
        // 指向栈最后一个 effect
        activeEffect = effectStack[effectStack.length - 1];
      }
    }
  };
  effect.id = uid++;
  // 标识是一个 effect 函数
  effect._isEffect = true;
  // effect 自身的状态
  effect.active = true;
  // 包装的原始函数
  effect.raw = fn;
  // effect 对应的依赖，双向指针，依赖包含对 effect 的引用，effect 也包含对依赖的引用
  effect.deps = [];
  // effect 的相关配置
  effect.options = options;
  return effect;
}
```

结合上述代码来看，`effect` 内部通过执行 `createReactiveEffect` 函数去创建一个新的 `effect` 函数，为了和外部的 `effect` 函数区分，我们把它称作 `reactiveEffect` 函数，并且还给它添加了一些额外属性（我在注释中都有标明）。另外，`effect` 函数还支持传入一个配置参数以支持更多的 `feature`，这里就不展开了。

`reactiveEffect` **函数就是响应式的副作用函数，当执行 `trigger` 过程派发通知的时候，执行的 `effect` 就是它。**

按我们之前的分析，`reactiveEffect` 函数只需要做两件事情：让全局的 `activeEffect` 指向它， 然后执行被包装的原始函数 `fn`。

但实际上它的实现要更复杂一些，首先它会判断 `effect` 的状态是否是 `active，`这其实是一种控制手段，允许在非 `active` 状态且非调度执行情况，则直接执行原始函数 `fn` 并返回。

接着判断 `effectStack` 中是否包含 `effect`，如果没有就把 `effect` 压入栈内。之前我们提到，只要设置 `activeEffect = effect` 即可，那么这里为什么要设计一个栈的结构呢？

其实是考虑到以下这样一个嵌套 `effect` 的场景：

```js
import { reactive } from "vue";
import { effect } from "@vue/reactivity";
const counter = reactive({
  num: 0,
  num2: 0,
});
function logCount() {
  effect(logCount2);
  console.log("num:", counter.num);
}
function count() {
  counter.num++;
}
function logCount2() {
  console.log("num2:", counter.num2);
}
effect(logCount);
count();
```

我们每次执行 `effect` 函数时，如果仅仅把 `reactiveEffect` 函数赋值给 `activeEffect`，那么针对这种嵌套场景，执行完 `effect(logCount2)` 后，`activeEffect` 还是 `effect(logCount2)` 返回的 `reactiveEffect` 函数，这样后续访问 `counter.num` 的时候，依赖收集对应的 `activeEffect` 就不对了，此时我们外部执行 `count` 函数修改 `counter.num` 后执行的便不是 `logCount` 函数，而是 `logCount2` 函数，最终输出的结果如下：

```js
num2: 0;
num: 0;
num2: 0;
```

而我们期望的结果应该如下：

```js
num2: 0;
num: 0;
num2: 0;
num: 1;
```

因此针对嵌套 `effect` 的场景，我们不能简单地赋值 `activeEffect`，应该考虑到函数的执行本身就是一种入栈出栈操作，因此我们也可以设计一个 `effectStack`，这样每次进入 `reactiveEffect` 函数就先把它入栈，然后 `activeEffect` 指向这个 `reactiveEffect` 函数，接着在 `fn` 执行完毕后出栈，再把 `activeEffect` 指向 `effectStack` 最后一个元素，也就是外层 `effect` 函数对应的 `reactiveEffect`。

这里我们还注意到一个细节，在入栈前会执行 `cleanup` 函数清空 `reactiveEffect` 函数对应的依赖 。在执行 `track` 函数的时候，除了收集当前激活的 `effect` 作为依赖，还通过 `activeEffect.deps.push(dep)` 把 `dep` 作为 `activeEffect` 的依赖，这样在 `cleanup` 的时候我们就可以找到 `effect` 对应的 `dep` 了，然后把 `effect` 从这些 `dep` 中删除。`cleanup` 函数的代码如下所示：

```js
function cleanup(effect) {
  const { deps } = effect;
  if (deps.length) {
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect);
    }
    deps.length = 0;
  }
}
```

为什么需要 `cleanup` 呢？如果遇到这种场景：

```vue
<template>
  <div v-if="state.showMsg">
    {{ state.msg }}
  </div>
  <div v-else>
    {{ Math.random() }}
  </div>
  <button @click="toggle">Toggle Msg</button>
  <button @click="switchView">Switch View</button>
</template>
<script>
import { reactive } from "vue";

export default {
  setup() {
    const state = reactive({
      msg: "Hello World",
      showMsg: true,
    });

    function toggle() {
      state.msg = state.msg === "Hello World" ? "Hello Vue" : "Hello World";
    }

    function switchView() {
      state.showMsg = !state.showMsg;
    }

    return {
      toggle,
      switchView,
      state,
    };
  },
};
</script>
```

结合代码可以知道，这个组件的视图会根据 `showMsg` 变量的控制显示 `msg` 或者一个随机数，当我们点击 `Switch View` 的按钮时，就会修改这个变量值。

假设没有 `cleanup`，在第一次渲染模板的时候，`activeEffect` 是组件的副作用渲染函数，因为模板 `render` 的时候访问了 `state.msg`，所以会执行依赖收集，把副作用渲染函数作为 `state.msg` 的依赖，我们把它称作 `render effect`。然后我们点击 `Switch View` 按钮，视图切换为显示随机数，此时我们再点击 `Toggle Msg` 按钮，由于修改了 `state.msg` 就会派发通知，找到了 `render effect` 并执行，就又触发了组件的重新渲染。

但这个行为实际上并不符合预期，因为当我们点击 `Switch View` 按钮，视图切换为显示随机数的时候，也会触发组件的重新渲染，但这个时候视图并没有渲染 `state.msg`，所以对它的改动并不应该影响组件的重新渲染。

因此在组件的 `render effect` 执行之前，如果通过 `cleanup` 清理依赖，我们就可以删除之前 `state.msg` 收集的 `render effect` 依赖。这样当我们修改 `state.msg` 时，由于已经没有依赖了就不会触发组件的重新渲染，符合预期

### 4.如何理解 composition API

在 Vue2 中，代码是 Options API 风格的，也就是通过填充 (option) data、methods、computed 等属性来完成一个 Vue 组件。这种风格使得 Vue 相对于 React 极为容易上手，同时也造成了几个问题：

1. 由于 Options API 不够灵活的开发方式，使得 Vue 开发缺乏优雅的方法来在组件间共用代码。
2. Vue 组件过于依赖`this`上下文，Vue 背后的一些小技巧使得 Vue 组件的开发看起来与 JavaScript 的开发原则相悖，比如在`methods` 中的`this`竟然指向组件实例来不指向`methods`所在的对象。这也使得 TypeScript 在 Vue2 中很不好用。

Options Api 可以理解为就是组件的各个选项，data、methods、computed、watch 等等就像是组件的一个个选项，在对应的选项里做对应的事情。

不在 data 中定义的数据，是无法做到响应式的，那是因为 Object.definePropety 只会对 data 选项中的数据进行递归拦截

因为所有的数据都是挂载在 this 下面，typescript 的类型推导也很麻烦，代码的复用、公共组件的导入导出也都很困难

```js
export default {
    data () {
        return {
            // 定义响应式数据的选项
        }
    },
    methods: {
        // 定义相关方法的选项
    },
    computed: {
        // 计算属性的选项
    },
    watch: {
        // 监听数据的选项
    }
    ...
}
```

于是在 Vue3 中，舍弃了 Options API，转而投向 Composition API。Composition API 本质上是将 Options API 背后的机制暴露给用户直接使用，这样用户就拥有了更多的灵活性，也使得 Vue3 更适合于 TypeScript 结合。

Composition Api，我们也从名字来看，Composition 表示组合，在 Compostion Api 的写法中，没有选项的概念了，设计指向的是组合，各种功能模块的组合。Composition Api 支持将相同的功能模块代码写在一起，甚至可以将某个功能单独的封装成函数，随意导入引用；也可以**将任意的数据定义成响应式，再也不用局限于 data 中，我们只需要将每个实现的功能组合起来就可以了**。

如下，是一个使用了 Vue Composition API 的 Vue3 组件：

```javascript
<template>
  <button @click="increment">
    Count: {{ count }}
  </button>
</template>

<script>
// Composition API 将组件属性暴露为函数，因此第一步是导入所需的函数
import { ref, computed, onMounted } from 'vue'

export default {
  setup() {
// 使用 ref 函数声明了称为 count 的响应属性，对应于Vue2中的data函数
    const count = ref(0)

// Vue2中需要在methods option中声明的函数，现在直接声明
    function increment() {
      count.value++
    }
 // 对应于Vue2中的mounted声明周期
    onMounted(() => console.log('component mounted!'))

    return {
      count,
      increment
    }
  }
}
</script>
```

显而易见，Vue Composition API 使得 Vue3 的开发风格更接近于原生 JavaScript，带给开发者更多地灵活性

例子

```js
<template>
    <div @click="add">{{count}}</div>
</template>
<script setup>
    import { ref } from "vue";
    let count = ref(0);
    function add () {
        count.value++;
    };
</script>
```

功能单独封装成一个函数，供其他地方引用

定义一个新的 count.js 文件。

```js
import { ref } from "vue";
export default function Count() {
  let count = ref(0);
  function add() {
    count.value++;
  }
  return { count, add };
}
```

在我们的源代码里，只需要引入一下。

```js
<template>
    <div @click="add">{{count}}</div>
</template>
<script setup>
    import Count from "./count.js";
    const { count, add } = Count();
</script>
```

添加一个计算属性，每当 count 的值改变的时候，就计算出 count \* 2 的值，大家应该马上就想到了 computed，而在 Compostion Api 中，computed 需要通过 import 导入使用。

```vue
<template>
  <div @click="add">{{ count }}</div>
  <div>{{ doubleCount }}</div>
</template>
<script setup>
import { computed } from "vue";
import Count from "./count.js";
const { count, add } = Count();
let doubleCount = computed(() => count.value * 2);
</script>
```

现在给 count 加点颜色，如果 count 是偶数，想让文字显示红色，如果是奇数，让文字显示绿色，这次我们使用 watch 来实现，在 Composition Api 中对应的是 watchEffect。

```vue
<style scope>
.count {
  color: v-bind(color);
}
</style>
<template>
  <div @click="add" class="count">{{ count }}</div>
  <div>{{ doubleCount }}</div>
</template>
<script setup>
import { computed, ref, watchEffect } from "vue";
...
let color = ref('red');
const watchEffectStop = watchEffect(() => {
    if (count.value % 2) {
        color.value = 'green';
    } else {
        color.value = 'red';
    }
})
</script>
```

我们已经添加了一个 watchEffect 来监听 count 值的变化，相对于 Vue2 中的 watch 方法，watchEffect 的使用还是有一些差别的。

1.  watchEffect 是立即执行的，不需要添加 immediate 属性。

1.  watchEffect 不需要指定对某个具体的数据监听，watchEffect 会根据内容自动去感知，所以我们也可以在一个 watchEffect 中添加多个数据的监听处理（如果 watchEffect 中没有任何响应式数据，会不会执行呢？大家可以试一下）。

1.  watchEffect 不能获取数据改变之前的值。

同时，watchEffect 会返回一个对象 watchEffectStop，通过执行 watchEffectStop，我们可以控制监听在什么时候结束

### 5.reactive 和 ref

在 vue2 中只需要在 data 里定义数据，就可以实现数据层-视图层的双向绑定，而在 vue3 中使用 ref 接受一个内部值并返回一个响应式且可变的 ref 对象。ref 对象具有指向内部值的单个 property.value

reactive 的作用和 ref 的作用是类似的，都是将数据变成可相应的对象，其实 ref 的底层其实利用了 reactive。 两者的区别，ref 包装的对象需要.value ,而 reactive 中的不需要

![image-20220316213837203](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs/202208202301420.png)

`toRefs`会将我们一个`响应式`的对象转变为一个`普通`对象，然后将这个`普通对象`里的每一个属性变为一个响应式的数据

如果利用 toRef 将一个数据变成响应式数据，是会影响到原始数据，但是响应式数据通过 toRef。并不回出发 ui 界面更新(ref 式改变，不会影响到原始数据)

toRefs 类似 toRef,只是一次性处理多次 toRef

### 6.setup

`setup` 选项是一个接收 `props` 和 `context` 的函数

```js
export default {
  name: "test",
  setup(props, context) {
    return {}; // 这里返回的任何内容都可以用于组件的其余部分
  },
  // 组件的“其余部分”
};
```

接收一个`props`和`context`函数并且将`setup`内的内容通过`return`暴露给组件的其余部分

- 由于在执行 setup 函数的时候，还没有执行 Created 生命周期方法，所以在 setup 函数中，无法使用 data 和 methods 的变量和方法
- 由于我们不能在 setup 函数中使用 data 和 methods，所以 Vue 为了避免我们错误的使用，直接将 setup 函数中的 this 修改成了 undefined

![image-20220316213946552](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsaJAiv7qclpgNeyS.png)

#### setup script 优势

##### 1.自动注册子组件

vue3 语法

在引入 Child 组件后，需要在 components 中注册对应的组件才可使用

```js
<template>
  <div>
    <h2>我是父组件!</h2>
    <Child />
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue';
import Child from './Child.vue'

export default defineComponent({
  components: {
      Child
  },
  setup() {

    return {

    }
  }
});
</script>
```

setup script 写法

直接省略了子组件注册的过程

```js
<template>
  <div>
    <h2>我是父组件!-setup script</h2>
    <Child />
  </div>
</template>

<script setup>
import Child from './Child.vue'

</script>
```

##### 2.属性和方法无需返回

composition API 写起来有点繁琐的原因在于需要手动返回模板需要使用的属性和方法。

而在 setup script 中可以省略这一步

vue3 语法

```js
<template>
  <div>
    <h2 @click="ageInc">{{ name }} is {{ age }}</h2>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue';

export default defineComponent({
  setup() {
    const name = ref('CoCoyY1')
    const age = ref(18)

    const ageInc = () => {
      age.value++
    }

    return {
      name,
      age,

      ageInc
    }
  }
})
</script>
```

setup script 语法

```js
<template>
  <div>
    <h2 @click="ageInc">{{ name }} is {{ age }}</h2>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const name = ref('CoCoyY1')
const age = ref(18)

const ageInc = () => {
  age.value++
}

</script>
```

##### 3.支持 props、emit 和 context

vue3 语法

```js
//Father.vue
<template>
  <div >
    <h2 >我是父组件！</h2>
    <Child msg="hello" @child-click="childCtx" />
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue';
import Child from './Child.vue';

export default defineComponent({
  components: {
    Child
  },
  setup(props, context) {
    const childCtx = (ctx) => {
      console.log(ctx);
    }

    return {
      childCtx
    }
  }
})
</script>


//Child.vue
<template>
  <span @click="handleClick">我是子组件! -- msg: {{ props.msg }}</span>
</template>

<script>
import { defineComponent, ref } from 'vue'

export default defineComponent({
  emits: [
    'child-click'
  ],
  props: {
    msg: String
  },
  setup(props, context) {
    const handleClick = () => {
      context.emit('child-click', context)
    }

    return {
      props,
      handleClick
    }
  },
})
</script>
```

setup script 写法

```js
//Father.vue
<template>
  <div >
    <h2 >我是父组件！</h2>
    <Child msg="hello" @child-click="childCtx" />
  </div>
</template>

<script setup>
import Child from './Child.vue';

const childCtx = (ctx) => {
  console.log(ctx);
}
</script>


//Child.vue
<template>
  <span @click="handleClick">我是子组件! -- msg: {{ props.msg }}</span>
</template>

<script setup>
import { useContext, defineProps, defineEmit } from 'vue'

const emit = defineEmit(['child-click'])
const ctx = useContext()
const props = defineProps({
  msg: String
})

const handleClick = () => {
  emit('child-click', ctx)
}
</script>

```

setup script 语法糖提供了三个新的 API 来供我们使用：`defineProps`、`defineEmit`和`useContext`。

其中`defineProps`用来接收父组件传来的值 props。`defineEmit`用来声明触发的事件表。`useContext`用来获取组件上下文 context

### 7.Vue3 中 watch 与 watchEffect 有什么区别？

- `watch` 与 `watchEffect` 的不同
  1. `watch` 初次渲染不执行
  2. `watch` 侦听的更具体
  3. `watch` 可以访问侦听数据变化前后的值

同一个功能的两种不同形态，底层的实现是一样的。

- `watch`- 显式指定依赖源，依赖源更新时执行回调函数
- `watchEffect` - 自动收集依赖源，依赖源更新时重新执行自身

Watch

这里的依赖源函数只会执行一次，回调函数会在每次依赖源改变的时候触发，但是并不对回调函数进行依赖收集。也就是说，依赖源和回调函数之间并不一定要有直接关系

```js
watch(
  () => {
    /* 依赖源收集函数 */
  },
  () => {
    /* 依赖源改变时的回调函数 */
  }
);
```

WatchEffect

`watchEffect` 相当于将 `watch` 的依赖源和回调函数合并，当任何你有用到的响应式依赖更新时，该回调函数便会重新执行。不同于 `watch`，`watchEffect` 的回调函数会被立即执行（即 `{ immediate: true }`）

简单理解 watchEffect 会在第一次运行时创建副作用函数并执行一次，如果存在响应式变量，取值会触发 get 函数，这个时候收集依赖存储起来，当其他地方给响应式变量重新赋值的时候，set 函数中会触发方法派发更新，执行收集到的副作用函数，如果不存在响应式变量，就不会被收集触发

```js
watchEffect(() => {
  /* 依赖源同时是回调函数 */
});
```

### 8.Teleport

这个组件的作用主要用来将模板内的 DOM 元素移动到其他位置

业务开发的过程中，我们经常会封装一些常用的组件，例如 Modal 组件

有时组件模板的一部分逻辑上属于该组件，而从技术角度来看，最好将模板的这一部分移动到 DOM 中 Vue app 之外的其他位置 最常见的就是类似于 element 的 dialog 组件 dialog 是 fixed 定位，而 dialog 父元素的 css 会影响 dialog 因此要将 dialog 放在 body 下

> eleport 提供了一种干净的方法，允许我们控制在 DOM 中哪个父节点下呈现 HTML，而不必求助于全局状态或将其拆分为两个组件。 -- Vue 官方文档

我们只需要将弹窗内容放入 `Teleport` 内，并设置 `to` 属性为 `body`，表示弹窗组件每次渲染都会做为 `body` 的子级，这样之前的问题就能得到解决

```javascript
<template>
  <teleport to="body">
    <div class="modal__mask">
      <div class="modal__main">...</div>
    </div>
  </teleport>
</template>
```

### 9.Suspense

前端开发中异步请求是非常常见的事情,比如远程读取图片,调用后端接口等等 Suspense 是有两个 template 插槽的，第一个 default 代表异步请求完成后，显示的模板内容。fallback 代表在加载中时，显示的模板内容。 子组件 child

```js
<template>
  <h1>{{result}}</h1>
</template>
<script>
import { defineComponent } from 'vue'
export default defineComponent({
  setup() {
    return new Promise((resolve) => {
      setTimeout(() => {
        return resolve({
          result: 1000
        })
      }, 5000)
    })
  }
})
</script>
```

父组件 当异步没有执行完的时候。使用 fallback 里面的组件，当执行成功之后使用 default

```js
<Suspense>
  <template #default>
    <Child />
  </template>
  <template #fallback>
    <h1>Loading !...</h1>
  </template>
</Suspense>
```

### 10.实现一个 reactive

reactive 内使用 proxy

handler 的 get 方法调用 track 收集依赖，使用 Reflect.get(),然后进行对象递归

handler 的 set 方法会进行值的新老对比，使用 Reflect.set(),然后触发 trigger 进行更新

targetMap(weakMap) 收集不同的对象 target 和 depsMap 作为 key-value

depsMap(Map)收集对象属性和包含 effect 的 Set 集合做为 key-value

```js
const isObject = (val) => val !== null && typeof val === "object";
const convert = (target) => (isObject(target) ? reactive(target) : target);
const hasOwnProperty = Object.prototype.hasOwnProperty;
const hasOwn = (target, key) => hasOwnProperty.call(target, key);

export function reactive(target) {
  if (!isObject(target)) return target;

  const handler = {
    get(target, key, receiver) {
      // 收集依赖
      track(target, key);
      const result = Reflect.get(target, key, receiver);
      return convert(result);
    },
    set(target, key, value, receiver) {
      const oldValue = Reflect.get(target, key, receiver);
      let result = true;
      if (oldValue !== value) {
        result = Reflect.set(target, key, value, receiver);
        // 触发更新
        trigger(target, key);
      }
      return result;
    },
    deleteProperty(target, key) {
      const hadKey = hasOwn(target, key);
      const result = Reflect.deleteProperty(target, key);
      if (hadKey && result) {
        // 触发更新
        trigger(target, key);
      }
      return result;
    },
  };

  return new Proxy(target, handler);
}

let activeEffect = null;
export function effect(callback) {
  activeEffect = callback;
  callback(); // 访问响应式对象属性，去收集依赖
  activeEffect = null;
}

let targetMap = new WeakMap();

export function track(target, key) {
  if (!activeEffect) return;
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }
  dep.add(activeEffect);
}

export function trigger(target, key) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  const dep = depsMap.get(key);
  if (dep) {
    dep.forEach((effect) => {
      effect();
    });
  }
}

export function ref(raw) {
  // 判断 raw 是否是ref 创建的对象，如果是的话直接返回
  if (isObject(raw) && raw.__v_isRef) {
    return;
  }
  let value = convert(raw);
  const r = {
    __v_isRef: true,
    get value() {
      track(r, "value");
      return value;
    },
    set value(newValue) {
      if (newValue !== value) {
        raw = newValue;
        value = convert(raw);
        trigger(r, "value");
      }
    },
  };
  return r;
}

export function toRefs(proxy) {
  const ret = proxy instanceof Array ? new Array(proxy.length) : {};

  for (const key in proxy) {
    ret[key] = toProxyRef(proxy, key);
  }

  return ret;
}

function toProxyRef(proxy, key) {
  const r = {
    __v_isRef: true,
    get value() {
      return proxy[key];
    },
    set value(newValue) {
      proxy[key] = newValue;
    },
  };
  return r;
}

export function computed(getter) {
  const result = ref();

  effect(() => (result.value = getter()));

  return result;
}
```

#### effect 的基本实现

```js
export let activeEffect = undefined;// 当前正在执行的effect
class ReactiveEffect {
    active = true;
    deps = []; // 收集effect中使用到的属性
    parent = undefined;
    constructor(public fn) { }
    run() {
        if (!this.active) { // 不是激活状态
            return this.fn();
        }
        try {
            this.parent = activeEffect; // 当前的effect就是他的父亲
            activeEffect = this; // 设置成正在激活的是当前effect
            return this.fn();
        } finally {
            activeEffect = this.parent; // 执行完毕后还原activeEffect
            this.parent = undefined;
        }
    }
}
export function effect(fn, options?) {
    const _effect = new ReactiveEffect(fn); // 创建响应式effect
    _effect.run(); // 让响应式effect默认执行
}
```

#### 依赖收集

```js
get(target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) {
        return true;
    }
    const res = Reflect.get(target, key, receiver);
    track(target, 'get', key);  // 依赖收集
    return res;
}
```

```js
const targetMap = new WeakMap(); // 记录依赖关系
export function track(target, type, key) {
  if (activeEffect) {
    let depsMap = targetMap.get(target); // {对象：map}
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()));
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, (dep = new Set())); // {对象：{ 属性 :[ dep, dep ]}}
    }
    let shouldTrack = !dep.has(activeEffect);
    if (shouldTrack) {
      dep.add(activeEffect);
      activeEffect.deps.push(dep); // 让effect记住dep，这样后续可以用于清理
    }
  }
}
```

将属性和对应的 effect 维护成映射关系，后续属性变化可以触发对应的 effect 函数重新 run

#### 触发更新

```js
set(target, key, value, receiver) {
    // 等会赋值的时候可以重新触发effect执行
    let oldValue = target[key]
    const result = Reflect.set(target, key, value, receiver);
    if (oldValue !== value) {
        trigger(target, 'set', key, value, oldValue)
    }
    return result;
}
```

```js
export function trigger(target, type, key?, newValue?, oldValue?) {
  const depsMap = targetMap.get(target); // 获取对应的映射表
  if (!depsMap) {
    return;
  }
  const effects = depsMap.get(key);
  effects &&
    effects.forEach((effect) => {
      if (effect !== activeEffect) effect.run(); // 防止循环
    });
}
```

#### 分支切换与 cleanup

在渲染时我们要避免副作用函数产生的遗留

```js
const state = reactive({ flag: true, name: "jw", age: 30 });
effect(() => {
  // 副作用函数 (effect执行渲染了页面)
  console.log("render");
  document.body.innerHTML = state.flag ? state.name : state.age;
});
setTimeout(() => {
  state.flag = false;
  setTimeout(() => {
    console.log("修改name，原则上不更新");
    state.name = "zf";
  }, 1000);
}, 1000);
```

```js
function cleanupEffect(effect) {
    const { deps } = effect; // 清理effect
    for (let i = 0; i < deps.length; i++) {
        deps[i].delete(effect);
    }
    effect.deps.length = 0;
}
class ReactiveEffect {
    active = true;
    deps = []; // 收集effect中使用到的属性
    parent = undefined;
    constructor(public fn) { }
    run() {
        try {
            this.parent = activeEffect; // 当前的effect就是他的父亲
            activeEffect = this; // 设置成正在激活的是当前effect
+           cleanupEffect(this);
            return this.fn(); // 先清理在运行
        }
    }
}
```

这里要注意的是：触发时会进行清理操作（清理 effect），在重新进行收集（收集 effect）。在循环过程中会导致死循环。

```js
let effect = () => {};
let s = new Set([effect]);
s.forEach((item) => {
  s.delete(effect);
  s.add(effect);
}); // 这样就导致死循环了
```

#### 停止 effect

```js
export class ReactiveEffect {
  stop() {
    if (this.active) {
      cleanupEffect(this);
      this.active = false;
    }
  }
}
export function effect(fn, options?) {
  const _effect = new ReactiveEffect(fn);
  _effect.run();
  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner; // 返回runner
}
```

#### 调度执行

trigger 触发时，我们可以自己决定副作用函数执行的时机、次数、及执行方式

```js
export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler); // 创建响应式effect // if(options){ //     Object.assign(_effect,options); // 扩展属性 // }
  _effect.run(); // 让响应式effect默认执行
  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner; // 返回runner
}
export function trigger(target, type, key?, newValue?, oldValue?) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  let effects = depsMap.get(key);
  if (effects) {
    effects = new Set(effects);
    for (const effect of effects) {
      if (effect !== activeEffect) {
        if (effect.scheduler) {
          // 如果有调度函数则执行调度函数
          effect.scheduler();
        } else {
          effect.run();
        }
      }
    }
  }
}
```

#### 深度代理

```js
get(target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) {
        return true;
    }
    // 等会谁来取值就做依赖收集
    const res = Reflect.get(target, key, receiver);
    track(target, 'get', key);
    if(isObject(res)){
        return reactive(res);
    }
    return res;
}
```

当取值时返回的值是对象，则返回这个对象的代理对象，从而实现深度代理

#### 总结

为了实现响应式，我们使用了 new Proxy

effect 默认数据变化要能更新，我们先将正在执行的 effect 作为全局变量，渲染（取值），然后在 get 方法中进行依赖收集

依赖收集的数据格式 weakMap（对象：map（属性：set（effect））

用户数据发生变化，会通过对象属性来查找对应的 effect 集合，全部执行；

调度器的实现，创建 effect 时，把 scheduler 存在实例上，调用 runner 时，判断如果有调度器就调用调度器，否则执行 runner

### 11.实现一个 mini-vue3

#### dom 渲染过程

![image-20220828193515638](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsimage-20220828193515638.png)

![image-20220828193541719](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsimage-20220828193541719.png)

<img src="https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsimage-20220828193608830.png" alt="image-20220828193608830"  />

#### 渲染系统实现

功能一：h 函数，用于返回一个 VNode 对象；
功能二：mount 函数，用于将 VNode 挂载到 DOM 上；
功能三：patch 函数，用于对两个 VNode 进行对比，决定如何处理新的 VNode

##### h 函数

```js
const h = (tag, props, children) => {
  // vnode -> javascript对象 -> {}
  return {
    tag,
    props,
    children,
  };
};
```

##### mount 函数

**第一步**：根据 tag，创建 HTML 元素，并且存储
到 vnode 的 el 中；
**第二步**：处理 props 属性
如果以 on 开头，那么监听事件；
普通属性直接通过 setAttribute 添加即可；
**第三步**：处理子节点
如果是字符串节点，那么直接设置
textContent；
如果是数组节点，那么遍历调用 mount 函
数；

```js
const mount = (vnode, container) => {
  // vnode -> element
  // 1.创建出真实的原生, 并且在vnode上保留el
  const el = (vnode.el = document.createElement(vnode.tag));

  // 2.处理props
  if (vnode.props) {
    for (const key in vnode.props) {
      const value = vnode.props[key];

      if (key.startsWith("on")) {
        // 对事件监听的判断
        el.addEventListener(key.slice(2).toLowerCase(), value);
      } else {
        el.setAttribute(key, value);
      }
    }
  }

  // 3.处理children
  if (vnode.children) {
    if (typeof vnode.children === "string") {
      el.textContent = vnode.children;
    } else {
      vnode.children.forEach((item) => {
        mount(item, el);
      });
    }
  }

  // 4.将el挂载到container上
  container.appendChild(el);
};
```

##### patch 函数

![image-20220828194432401](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsimage-20220828194432401.png)

```js
const patch = (n1, n2) => {
  if (n1.tag !== n2.tag) {
    const n1ElParent = n1.el.parentElement;
    n1ElParent.removeChild(n1.el);
    mount(n2, n1ElParent);
  } else {
    // 1.取出element对象, 并且在n2中进行保存
    const el = (n2.el = n1.el);

    // 2.处理props
    const oldProps = n1.props || {};
    const newProps = n2.props || {};
    // 2.1.获取所有的newProps添加到el
    for (const key in newProps) {
      const oldValue = oldProps[key];
      const newValue = newProps[key];
      if (newValue !== oldValue) {
        if (key.startsWith("on")) {
          // 对事件监听的判断
          el.addEventListener(key.slice(2).toLowerCase(), newValue);
        } else {
          el.setAttribute(key, newValue);
        }
      }
    }

    // 2.2.删除旧的props
    for (const key in oldProps) {
      if (key.startsWith("on")) {
        // 对事件监听的判断
        const value = oldProps[key];
        el.removeEventListener(key.slice(2).toLowerCase(), value);
      }
      if (!(key in newProps)) {
        el.removeAttribute(key);
      }
    }

    // 3.处理children
    const oldChildren = n1.children || [];
    const newChidlren = n2.children || [];

    if (typeof newChidlren === "string") {
      // 情况一: newChildren本身是一个string
      // 边界情况 (edge case)
      if (typeof oldChildren === "string") {
        if (newChidlren !== oldChildren) {
          el.textContent = newChidlren;
        }
      } else {
        el.innerHTML = newChidlren;
      }
    } else {
      // 情况二: newChildren本身是一个数组
      if (typeof oldChildren === "string") {
        el.innerHTML = "";
        newChidlren.forEach((item) => {
          mount(item, el);
        });
      } else {
        // oldChildren: [v1, v2, v3, v8, v9]
        // newChildren: [v1, v5, v6]
        // 1.前面有相同节点的原生进行patch操作
        const commonLength = Math.min(oldChildren.length, newChidlren.length);
        for (let i = 0; i < commonLength; i++) {
          patch(oldChildren[i], newChidlren[i]);
        }

        // 2.newChildren.length > oldChildren.length
        if (newChidlren.length > oldChildren.length) {
          newChidlren.slice(oldChildren.length).forEach((item) => {
            mount(item, el);
          });
        }

        // 3.newChildren.length < oldChildren.length
        if (newChidlren.length < oldChildren.length) {
          oldChildren.slice(newChidlren.length).forEach((item) => {
            el.removeChild(item.el);
          });
        }
      }
    }
  }
};
```

#### 依赖收集系统

```js
class Dep {
  constructor() {
    this.subscribers = new Set();
  }

  depend() {
    if (activeEffect) {
      this.subscribers.add(activeEffect);
    }
  }

  notify() {
    this.subscribers.forEach((effect) => {
      effect();
    });
  }
}

let activeEffect = null;
function watchEffect(effect) {
  activeEffect = effect;
  effect();
  activeEffect = null;
}

// Map({key: value}): key是一个字符串
// WeakMap({key(对象): value}): key是一个对象, 弱引用
const targetMap = new WeakMap();
function getDep(target, key) {
  // 1.根据对象(target)取出对应的Map对象
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  // 2.取出具体的dep对象
  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Dep();
    depsMap.set(key, dep);
  }
  return dep;
}

// vue3对raw进行数据劫持
function reactive(raw) {
  return new Proxy(raw, {
    get(target, key) {
      const dep = getDep(target, key);
      dep.depend();
      return target[key];
    },
    set(target, key, newValue) {
      const dep = getDep(target, key);
      target[key] = newValue;
      dep.notify();
    },
  });
}
```

#### 外层设计

```js
function createApp(rootComponent) {
  return {
    mount(selector) {
      const container = document.querySelector(selector);
      let isMounted = false;
      let oldVNode = null;

      watchEffect(function () {
        if (!isMounted) {
          oldVNode = rootComponent.render();
          mount(oldVNode, container);
          isMounted = true;
        } else {
          const newVNode = rootComponent.render();
          patch(oldVNode, newVNode);
          oldVNode = newVNode;
        }
      });
    },
  };
}
```

### 12.vue3 性能提升主要是通过哪几方面体现的

#### 一、编译阶段

回顾`Vue2`，我们知道每个组件实例都对应一个 `watcher` 实例，它会在组件渲染的过程中把用到的数据`property`记录为依赖，当依赖发生改变，触发`setter`，则会通知`watcher`，从而使关联的组件重新渲染

![img](https://static.vue-js.com/39066120-5ed0-11eb-85f6-6fac77c0c9b3.png)

试想一下，一个组件结构如下图

```html
<template>
  <div id="content">
    <p class="text">静态文本</p>
    <p class="text">静态文本</p>
    <p class="text">{{ message }}</p>
    <p class="text">静态文本</p>
    ...
    <p class="text">静态文本</p>
  </div>
</template>
```

可以看到，组件内部只有一个动态节点，剩余一堆都是静态节点，所以这里很多 `diff` 和遍历其实都是不需要的，造成性能浪费

因此，`Vue3`在编译阶段，做了进一步优化。主要有如下：

- diff 算法优化
- 静态提升
- 事件监听缓存
- SSR 优化

#### diff 算法优化

`vue3`在`diff`算法中相比`vue2`增加了静态标记

关于这个静态标记，其作用是为了会发生变化的地方添加一个`flag`标记，下次发生变化的时候直接找该地方进行比较

下图这里，已经标记静态节点的`p`标签在`diff`过程中则不会比较，把性能进一步提高

![img](https://static.vue-js.com/c732e150-5c58-11eb-ab90-d9ae814b240d.png)

关于静态类型枚举如下

```js
export const enum PatchFlags {
  TEXT = 1,// 动态的文本节点
  CLASS = 1 << 1,  // 2 动态的 class
  STYLE = 1 << 2,  // 4 动态的 style
  PROPS = 1 << 3,  // 8 动态属性，不包括类名和样式
  FULL_PROPS = 1 << 4,  // 16 动态 key，当 key 变化时需要完整的 diff 算法做比较
  HYDRATE_EVENTS = 1 << 5,  // 32 表示带有事件监听器的节点
  STABLE_FRAGMENT = 1 << 6,   // 64 一个不会改变子节点顺序的 Fragment
  KEYED_FRAGMENT = 1 << 7, // 128 带有 key 属性的 Fragment
  UNKEYED_FRAGMENT = 1 << 8, // 256 子节点没有 key 的 Fragment
  NEED_PATCH = 1 << 9,   // 512
  DYNAMIC_SLOTS = 1 << 10,  // 动态 solt
  HOISTED = -1,  // 特殊标志是负整数表示永远不会用作 diff
  BAIL = -2 // 一个特殊的标志，指代差异算法
}
```

#### 静态提升

`Vue3`中对**不参与更新的元素，会做静态提升，只会被创建一次，在渲染时直接复用**

这样就免去了重复的创建节点，大型应用会受益于这个改动，免去了重复的创建操作，优化了运行时候的内存占用

```js
<span>你好</span>

<div>{{ message }}</div>
```

没有做静态提升之前

```js
export function render(_ctx, _cache, $props, $setup, $data, $options) {
  return (
    _openBlock(),
    _createBlock(
      _Fragment,
      null,
      [
        _createVNode("span", null, "你好"),
        _createVNode("div", null, _toDisplayString(_ctx.message), 1 /* TEXT */),
      ],
      64 /* STABLE_FRAGMENT */
    )
  );
}
```

做了静态提升之后

静态内容`_hoisted_1`被放置在`render` 函数外，每次渲染的时候只要取 `_hoisted_1` 即可

同时 `_hoisted_1` 被打上了 `PatchFlag` ，静态标记值为 -1 ，特殊标志是负整数表示永远不会用于 Diff

#### 事件监听缓存

默认情况下绑定事件行为会被视为动态绑定，所以每次都会去追踪它的变化

```js
<div>
  <button @click = 'onClick'>点我</button>
</div>
```

没开启事件监听器缓存

```js
export const render = /*#__PURE__*/ _withId(function render(
  _ctx,
  _cache,
  $props,
  $setup,
  $data,
  $options
) {
  return (
    _openBlock(),
    _createBlock("div", null, [
      _createVNode("button", { onClick: _ctx.onClick }, "点我", 8 /* PROPS */, [
        "onClick",
      ]),
      // PROPS=1<<3,// 8 //动态属性，但不包含类名和样式
    ])
  );
});
```

开启事件侦听器缓存后

```js
export function render(_ctx, _cache, $props, $setup, $data, $options) {
  return (
    _openBlock(),
    _createBlock("div", null, [
      _createVNode(
        "button",
        {
          onClick:
            _cache[1] || (_cache[1] = (...args) => _ctx.onClick(...args)),
        },
        "点我"
      ),
    ])
  );
}
```

上述发现开启了缓存后，没有了静态标记。也就是说下次`diff`算法的时候直接使用

#### SSR 优化

当静态内容大到一定量级时候，会用`createStaticVNode`方法在客户端去生成一个 static node，这些静态`node`，会被直接`innerHtml`，就不需要创建对象，然后根据对象渲染

```js
div>
	<div>
		<span>你好</span>
	</div>
	...  // 很多个静态属性
	<div>
		<span>{{ message }}</span>
	</div>
</div>
```

编译后

```js
import { mergeProps as _mergeProps } from "vue";
import {
  ssrRenderAttrs as _ssrRenderAttrs,
  ssrInterpolate as _ssrInterpolate,
} from "@vue/server-renderer";

export function ssrRender(
  _ctx,
  _push,
  _parent,
  _attrs,
  $props,
  $setup,
  $data,
  $options
) {
  const _cssVars = { style: { color: _ctx.color } };
  _push(
    `<div${_ssrRenderAttrs(
      _mergeProps(_attrs, _cssVars)
    )}><div><span>你好</span>...<div><span>你好</span><div><span>${_ssrInterpolate(
      _ctx.message
    )}</span></div></div>`
  );
}
```

#### 二、源码体积

相比`Vue2`，`Vue3`整体体积变小了，除了移出一些不常用的 API，再重要的是`Tree shanking`

任何一个函数，如`ref`、`reavtived`、`computed`等，仅仅在用到的时候才打包，没用到的模块都被摇掉，打包的整体体积变小

```js
import { computed, defineComponent, ref } from "vue";
export default defineComponent({
  setup(props, context) {
    const age = ref(18);

    let state = reactive({
      name: "test",
    });

    const readOnlyAge = computed(() => age.value++); // 19

    return {
      age,
      state,
      readOnlyAge,
    };
  },
});
```

`Tree shaking`是基于`ES6`模板语法（`import`与`exports`），主要是借助`ES6`模块的静态编译思想，在编译时就能确定模块的依赖关系，以及输入和输出的变量

`Tree shaking`无非就是做了两件事：

- 编译阶段利用`ES6 Module`判断哪些模块已经加载
- 判断那些模块和变量未被使用或者引用，进而删除对应代码

通过`Tree shaking`，`Vue3`给我们带来的好处是：

- 减少程序体积（更小）
- 减少程序执行时间（更快）
- 便于将来对程序架构进行优化（更友好）

#### 三、响应式系统

`vue2`中采用 `defineProperty`来劫持整个对象，然后进行深度遍历所有属性，给每个属性添加`getter`和`setter`，实现响应式

`vue3`采用`proxy`重写了响应式系统，因为`proxy`可以对整个对象进行监听，所以不需要深度遍历

- 可以监听动态属性的添加
- 可以监听到数组的索引和数组`length`属性
- 可以监听删除属性
