---
sidebar_position: 9
description: 框架对比
---

## 框架对比

### Vue 和 js、jquery 对比

jQuery 这个诞生于 2006 年的 js 类库，因为它强大的选择器大大解决了许多前端小白取不到元素的痛、链式操作使得 jQuery 代码简洁优雅、丰富的插件支持让可扩展性相当高、轻量又不会污染顶级变量的优点，曾经风靡一时。但长江后浪推前浪，于 2013 年尤雨溪个人开发的 Vue 框架，现在已然成为全世界三大前端框架之一。那么 Vue 到底有什么优势能够脱颖而出呢？总的来说，Vue 的核心优势就是减少 DOM 操作、双向数据绑定和组件化 3 个方面。

#### 减少 DOM 操作

从 jQuery 到 Vue，是前端思维的转变，从传统的直接操作 DOM 元素转变为操作虚拟 DOM，这是 Vue 较 jQuery 乃至原生 JS，更具优势的一个原因。
那么什么叫做直接操作 DOM 元素？什么叫操作虚拟 DOM？虚拟 DOM 的优势是什么？

- jQuery 直接操作 DOM 元素，是使用选择器（$）选取 DOM 对象，对其进行赋值、取值、事件绑定等操作。每次对元素处理的前提都是先取到元素，DOM 操作较多。
- Vue 操作虚拟 DOM，是在 Vue 类下面新建对象模拟 DOM 元素，在操作过程中对数据进行处理而不是直接操作 DOM 元素，当数据处理完成后，仅仅比较开始和结束状态虚拟 DOM 有哪些变换，最终根据结束状态虚拟 DOM 去操作 DOM。
- 虚拟 DOM 的出现将前端的工作从操作元素为主转变为处理数据，减少了 DOM 操作，减少浏览器的渲染引擎的工作量，渲染更快，大大解决了前端性能优化的难题。

#### 双向数据绑定

数据绑定分单向数据绑定和双向数据绑定。传统的单向数据绑定一般是数据影响页面，而页面不影响数据。Vue 在 MVVM 框架中的双向数据绑定通过 v-model 实现（在 MVVM 框架中，View(视图，也就是常说的页面) 和 Model(数据) 不可以直接通讯），使得视图和数据可以根据一方的改变自身做出相应改变。最直观的就是，在 Vue 中数据改变，视图无需刷新即可实时改变，而 jQuery 中数据改变，视图需要用户手动刷新才会改变。

#### 组件化

Vue 组件具有独立的逻辑和功能或界面，同时又能根据规定的接口规则进行相互融合，变成一个完整的应用，简单来说，就是将页面的功能等需求进行划分成多个模块，可以根据需求增减，同时不影响整个页面的运行。在工作中，有这方面的需求时，可以自己写组件进行重复使用，还可以从网上获取相应组件，也可以对别人封装的组件进行二次封装等等。Vue 组件的优势就是组件进行重复使用，便于协同开发，提高开发效率。

#### 单页面应用

单页面的实现一般是几个 div 在来回切换。如果一开始已经写好 html，再来回切的话，html 是太长了。如果用 js 去写又拼的很麻烦。如果用 jq、原生实现页面切换，比较好的方式是用模版引擎，但其实单页面的实现没那么简单，不单单要考虑 html 能否单独写出来，还要考虑 js 需不需要按需加载，路由需不需要等等。。。用 vue 就不需要烦这些东西，vue 自动构建单页应用，使用 router 模拟跳转

总的来说，jQuery 和 Vue 的关系并非你死我活，各自都有不同的侧重点。jQuery 侧重样式操作，动画效果，而 Vue 侧重数据绑定。大家可以根据需求进行结合使用。

#### Vue 比 JQuery 减少了 DOM 操作

在这里我先提出一个问题，为什么要较少 DOM 操作

回答：当 DOM 操作影响到布局的时候，浏览器的渲染引擎就要重新计算然后渲染，越多的 DOM 操作就会导致越多的计算，自然会影响页面性能，所以 DOM 操作减少是最好的

那 Vue 又是怎么样减少 DOM 操作的呢？

Vue 通过虚拟 DOM 技术减少 DOM 操作。什么是虚拟 DOM？使用 js 对象模拟 DOM，在操作过程中不会直接操作 DOM，等待虚拟 DOM 操作完成，仅仅比较开始和结束状态虚拟 DOM 有哪些变换，最终根据结束状态虚拟 DOM 去操作 DOM。至于虚拟 DOM 怎么比较则是采用 diff 算法，具体算法我也不会。不过 diff 算法里有一个很好的措施来减少 DOM 操作。

#### diff 的处理措施：

##### （一）、优先处理特殊场景

（1）、头部的同类型节点、尾部的同类型节点

这类节点更新前后位置没有发生变化，所以不用移动它们对应的 DOM

（2）、头尾/尾头的同类型节点

这类节点位置很明确，不需要再花心思查找，直接移动 DOM 就好

##### （二）、“原地复用”

“原地复用”是指 Vue 会尽可能复用 DOM，尽可能不发生 DOM 的移动。Vue 在判断更新前后指针是否指向同一个节点，其实不要求它们真实引用同一个 DOM 节点，实际上它仅判断指向的是否是同类节点，如果是同类节点，那么 Vue 会直接复用 DOM，例如通过对换文本内容的方式，这样的好处是不需要移动 DOM。

#### Vue 支持双向数据绑定

数据绑定有单向数据绑定和双向数据绑定。

##### 什么是单向数据绑定？

单向数据绑定即一方面只受另一方面影响，却无法影响另一方面。前端常说的单向数据绑定一般都指数据影响页面，而页面不影响数据。

##### 什么是双向数据绑定？

双向的意思即两个方面相互影响，前端来说，即数据影响页面，页面同时影响数据。例如，在 MVVM 框架中，View(视图) 和 Model(数据) 是不可以直接通讯的，在它们之间存在着 ViewModel 这个中间介充当着观察者的角色。当用户操作 View(视图)，ViewModel 感知到变化，然后通知 Model 发生相应改变；反之当 Model(数据) 发生改变，ViewModel 也能感知到变化，使 View 作出相应更新。

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs11989392-be71514e8de9219b.png)

v-model 双向绑定

以上代码将 input 的 value 和页面显示双向绑定在一起。其实 v-model 只是语法糖，双向绑定其实就等于单向绑定+UI 时间监听，只不过 Vue 将过程采用黑箱封装起来了。

##### 那双向绑定有什么好处？

好处就是方便，数据自动更新。而缺点就是无法得知是哪里更改了数据。

#### Vue 支持组件化

##### 组件化的概念

Web 中的组件其实就是页面组成的一部分，好比是电脑中的每一个元件（如硬盘、键盘、鼠标），它是一个具有独立的逻辑和功能或界面，同时又能根据规定的接口规则进行相互融合，变成一个完整的应用，页面就是有一个个类似这样的部分组成，比如导航、列表、弹窗、下拉菜单等。页面只不过是这些组件的容器，组件自由组合形成功能完善的界面，当不需要某个组件，或者想要替换某个组件时，可以随时进行替换和删除，而不影响整个应用的运行。

##### 组件化的特性

**高内聚性**，组建功能必须是完整的，如我要实现下拉菜单功能，那在下拉菜单这个组件中，就把下拉菜单所需要的所有功能全部实现。

**低耦合度**，通俗点说，代码独立不会和项目中的其他代码发生冲突。在实际工程中，我们经常会涉及到团队协作，传统按照业务线去编写代码的方式，就很容易相互冲突，所以运用组件化方式就可大大避免这种冲突的存在、

每一个组件都有子集清晰的职责，完整的功能，较低的耦合便于单元测试和重复利用。

##### 组件化的优点

1.提高开发效率 2.方便重复使用 3.简化调试步骤 4.提升整个项目的可维护性 5.便于协同开发

### Vue3 与 Vue2 区别详述

#### **1\. 生命周期**

对于生命周期来说，整体上变化不大，只是大部分生命周期钩子名称上 + “on”，功能上是类似的。不过有一点需要注意，Vue3 在组合式 API（Composition API，下面展开）中使用生命周期钩子时需要先引入，而 Vue2 在选项 API（Options API）中可以直接调用生命周期钩子，如下所示。

```js
// vue3
<script setup>
import { onMounted } from 'vue';   // 使用前需引入生命周期钩子

onMounted(() => {
  // ...
});

// 可将不同的逻辑拆开成多个onMounted，依然按顺序执行，不会被覆盖
onMounted(() => {
  // ...
});
</script>

// vue2
<script>
export default {
  mounted() {   // 直接调用生命周期钩子
    // ...
  },
}
</script>
```

常用生命周期对比如下表所示。

| vue2          | vue3            |
| ------------- | --------------- |
| beforeCreate  |                 |
| created       |                 |
| beforeMount   | onBeforeMount   |
| mounted       | onMounted       |
| beforeUpdate  | onBeforeUpdate  |
| updated       | onUpdated       |
| beforeDestroy | onBeforeUnmount |
| destroyed     | onUnmounted     |

> Tips： setup 是围绕 beforeCreate 和 created 生命周期钩子运行的，所以不需要显式地去定义。

#### **2\. 多根节点**

熟悉 Vue2 的朋友应该清楚，在模板中如果使用多个根节点时会报错，如下所示。

```js
// vue2中在template里存在多个根节点会报错
<template>
  <header></header>
  <main></main>
  <footer></footer>
</template>

// 只能存在一个根节点，需要用一个<div>来包裹着
<template>
  <div>
    <header></header>
    <main></main>
    <footer></footer>
  </div>
</template>
```

但是，Vue3 支持多个根节点，也就是  fragment。即以下多根节点的写法是被允许的。

```js
<template>
  <header></header>
  <main></main>
  <footer></footer>
</template>
```

#### **3\. Composition API**

Vue2 是选项 API（Options API），一个逻辑会散乱在文件不同位置（data、props、computed、watch、生命周期钩子等），导致代码的可读性变差。当需要修改某个逻辑时，需要上下来回跳转文件位置。

Vue3 组合式 API（Composition API）则很好地解决了这个问题，可将同一逻辑的内容写到一起，增强了代码的可读性、内聚性，其还提供了较为完美的逻辑复用性方案。

#### **4\. 异步组件（Suspense）**

Vue3 提供 Suspense 组件，允许程序在等待异步组件加载完成前渲染兜底的内容，如 loading ，使用户的体验更平滑。使用它，需在模板中声明，并包括两个命名插槽：default 和 fallback。Suspense 确保加载完异步内容时显示默认插槽，并将 fallback 插槽用作加载状态。

```js
<tempalte>
  <suspense>
    <template #default>
      <List />
    </template>
    <template #fallback>
      <div>
        Loading...
      </div>
    </template>
  </suspense>
</template>
```

在 List 组件（有可能是异步组件，也有可能是组件内部处理逻辑或查找操作过多导致加载过慢等）未加载完成前，显示 Loading...（即 fallback 插槽内容），加载完成时显示自身（即 default 插槽内容）。

#### **5\. Teleport**

Vue3 提供 Teleport 组件可将部分 DOM 移动到 Vue app 之外的位置。比如项目中常见的 Dialog 弹窗。

```js
<button @click="dialogVisible = true">显示弹窗</button>
<teleport to="body">
  <div class="dialog" v-if="dialogVisible">
    我是弹窗，我直接移动到了body标签下
  </div>
</teleport>
```

#### **6\. 响应式原理**

Vue2 响应式原理基础是 Object.defineProperty；Vue3 响应式原理基础是 Proxy。

##### Object.defineProperty

基本用法：直接在一个对象上定义新的属性或修改现有的属性，并返回对象。

```js
let obj = {};
let name = "leo";
Object.defineProperty(obj, "name", {
  enumerable: true, // 可枚举（是否可通过 for...in 或 Object.keys() 进行访问）
  configurable: true, // 可配置（是否可使用 delete 删除，是否可再次设置属性）
  // value: '',   // 任意类型的值，默认undefined
  // writable: true,   // 可重写
  get() {
    return name;
  },
  set(value) {
    name = value;
  },
});
```

> Tips： `writable`  和  `value`  与  `getter`  和  `setter`  不共存。

搬运 Vue2 核心源码。

```js
function defineReactive(obj, key, val) {
  // 一 key 一个 dep
  const dep = new Dep()

  // 获取 key 的属性描述符，发现它是不可配置对象的话直接 return
  const property = Object.getOwnPropertyDescriptor(obj, key)
  if (property && property.configurable === false) { return }

  // 获取 getter 和 setter，并获取 val 值
  const getter = property && property.get
  const setter = property && property.set
  if((!getter || setter) && arguments.length === 2) { val = obj[key] }

  // 递归处理，保证对象中所有 key 被观察
  let childOb = observe(val)

  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    // get 劫持 obj[key] 的 进行依赖收集
    get: function reactiveGetter() {
      const value = getter ? getter.call(obj) : val
      if(Dep.target) {
        // 依赖收集
        dep.depend()
        if(childOb) {
          // 针对嵌套对象，依赖收集
          childOb.dep.depend()
          // 触发数组响应式
          if(Array.isArray(value)) {
            dependArray(value)
          }
        }
      }
    }
    return value
  })
  // set 派发更新 obj[key]
  set: function reactiveSetter(newVal) {
    ...
    if(setter) {
      setter.call(obj, newVal)
    } else {
      val = newVal
    }
    // 新值设置响应式
    childOb = observe(val)
    // 依赖通知更新
    dep.notify()
  }
}
```

那 Vue3 为何会抛弃它呢？那肯定是因为它存在某些局限性。

主要原因：无法监听对象或数组新增、删除的元素。Vue2 里的响应式其实有点像是一个半完全体，对于对象上新增的属性无能为力，对于数组则需要拦截它的原型方法来实现响应式。

Vue2 相应解决方案：针对常用数组原型方法 push、pop、shift、unshift、splice、sort、reverse 进行了 hack 处理；提供 Vue.set 监听对象/数组新增属性。对象的新增/删除响应，还可以 new 个新对象，新增则合并新属性和旧对象；删除则将删除属性后的对象深拷贝给新对象。

##### Proxy

Vue 响应式系统的核心依然是对数据进行劫持，只不过 Vue3 采样点是 Proxy 类，而 Vue2 采用的是 Object.defineProperty()。Vue3 之所以采用 Proxy 类主要有两个原因:

1.可以提升性能，由于 Object.defineProperty 只能对属性进行劫持，需要遍历对象的每个属性，如果属性值也是对象，则需要深度遍历。而 Proxy 直接代理对象，不需要遍历操作。

2.Proxy 可以实现对整个对象的劫持，而 Object.defineProperty()只能实现对对象的属性进行劫持。所以对于对象上的方法或者新增、删除的属性需要手动进行 Observe。也正是因为这个原因，使用 Vue 给 data 中的数组或对象新增属性时，需要使用 vm.$set 才能保证新增的属性也是响应式的。

\- Object.defineProperty 只能劫持对象的属性，而 Proxy 是直接代理对象。

\- Object.defineProperty 对新增属性需要手动进行 Observe。

**\- Object.defineProperty 阉割导致监听不到数组下标的变化，在 Vue 的实现中，从性能 / 体验的性价比考虑，放弃了这个特性。实际上**改变了`arr`的长度，在其首部增加一位数据，而且会触发多次**get、set**，证明使用`Object.defineProperty`是可以对数组进行数据劫持的，因此对于 Vue 中对于数组的特殊处理，并不是因为`Object.defineProperty`不能劫持数组，而是出于性能的考虑重写了 7 个数组的方法。

\- Proxy 支持 13 种拦截操作，这是 defineProperty 所不具有的。

Proxy 是 ES6 新特性，通过第 2 个参数 handler 拦截目标对象的行为。相较于 Object.defineProperty 提供语言全范围的响应能力，消除了局限性。

proxy，还是单层的拦截，也就是说，只会拦截第一层属性的访问，不会管第二层属性，第三层属性...。

如果想要实现深层次的监听，还是要用递归。

reactive 的深层响应就是用的递归方式 。

proxy 是对于数组的监听，效率更高。

局限性：

(1)、对象/数组的新增、删除

(2)、监测 .length 修改

(3)、Map、Set、WeakMap、WeakSet 的支持

基本用法：创建对象的代理，从而实现基本操作的拦截和自定义操作。

```js
let handler = {
  get(obj, prop) {
    return prop in obj ? obj[prop] : '';
  },
  set() {
    // ...
  },
  ...
};
```

搬运 vue3 的源码 reactive.ts 文件。

```js
function createReactiveObject(target, isReadOnly, baseHandlers, collectionHandlers, proxyMap) {
  ...
  // collectionHandlers: 处理Map、Set、WeakMap、WeakSet
  // baseHandlers: 处理数组、对象
  const proxy = new Proxy(
    target,
    targetType === TargetType.COLLECTION ? collectionHandlers : baseHandlers
  )
  proxyMap.set(target, proxy)
  return proxy
}
```

#### **7\. 虚拟 DOM**

Vue3 相比于 Vue2，虚拟 DOM 上增加 patchFlag 字段。我们借助 Vue3 Template Explorer 来看。

```vue
<div id="app">
  <h1>vue3虚拟DOM讲解</h1>
  <p>今天天气真不错</p>
  <div>{{name}}</div>
</div>
```

渲染函数如下所示。

```js
import { createElementVNode as _createElementVNode, toDisplayString as _toDisplayString, openBlock as _openBlock, createElementBlock as _createElementBlock, pushScopeId as _pushScopeId, popScopeId as _popScopeId } from vue

const _withScopeId = n => (_pushScopeId(scope-id),n=n(),_popScopeId(),n)
const _hoisted_1 = { id: app }
const _hoisted_2 = /*#__PURE__*/ _withScopeId(() => /*#__PURE__*/_createElementVNode(h1, null, vue3虚拟DOM讲解, -1 /* HOISTED */))
const _hoisted_3 = /*#__PURE__*/ _withScopeId(() => /*#__PURE__*/_createElementVNode(p, null, 今天天气真不错, -1 /* HOISTED */))

export function render(_ctx, _cache, $props, $setup, $data, $options) {
  return (_openBlock(), _createElementBlock(div, _hoisted_1, [
    _hoisted_2,
    _hoisted_3,
    _createElementVNode(div, null, _toDisplayString(_ctx.name), 1 /* TEXT */)
  ]))
}
```

注意第 3 个\_createElementVNode 的第 4 个参数即 patchFlag 字段类型。

字段类型情况：1 代表节点为动态文本节点，那在 diff 过程中，只需比对文本对容，无需关注 class、style 等。除此之外，发现所有的静态节点（HOISTED 为 -1），都保存为一个变量进行静态提升，可在重新渲染时直接引用，无需重新创建。

```js
// patchFlags 字段类型列举
export const enum PatchFlags {
  TEXT = 1,   // 动态文本内容
  CLASS = 1 << 1,   // 动态类名
  STYLE = 1 << 2,   // 动态样式
  PROPS = 1 << 3,   // 动态属性，不包含类名和样式
  FULL_PROPS = 1 << 4,   // 具有动态 key 属性，当 key 改变，需要进行完整的 diff 比较
  HYDRATE_EVENTS = 1 << 5,   // 带有监听事件的节点
  STABLE_FRAGMENT = 1 << 6,   // 不会改变子节点顺序的 fragment
  KEYED_FRAGMENT = 1 << 7,   // 带有 key 属性的 fragment 或部分子节点
  UNKEYED_FRAGMENT = 1 << 8,   // 子节点没有 key 的fragment
  NEED_PATCH = 1 << 9,   // 只会进行非 props 的比较
  DYNAMIC_SLOTS = 1 << 10,   // 动态的插槽
  HOISTED = -1,   // 静态节点，diff阶段忽略其子节点
  BAIL = -2   // 代表 diff 应该结束
}
```

#### **8\. 事件缓存**

Vue3 的`cacheHandler`可在第一次渲染后缓存我们的事件。相比于 Vue2 无需每次渲染都传递一个新函数。加一个 click 事件。

```js
<div id="app">
  <h1>vue3事件缓存讲解</h1>
  <p>今天天气真不错</p>
  <div>{{name}}</div>
  <span onCLick=() => {}><span>
</div>
```

渲染函数如下所示。

```javascript
import { createElementVNode as _createElementVNode, toDisplayString as _toDisplayString, openBlock as _openBlock, createElementBlock as _createElementBlock, pushScopeId as _pushScopeId, popScopeId as _popScopeId } from vue

const _withScopeId = n => (_pushScopeId(scope-id),n=n(),_popScopeId(),n)
const _hoisted_1 = { id: app }
const _hoisted_2 = /*#__PURE__*/ _withScopeId(() => /*#__PURE__*/_createElementVNode(h1, null, vue3事件缓存讲解, -1 /* HOISTED */))
const _hoisted_3 = /*#__PURE__*/ _withScopeId(() => /*#__PURE__*/_createElementVNode(p, null, 今天天气真不错, -1 /* HOISTED */))
const _hoisted_4 = /*#__PURE__*/ _withScopeId(() => /*#__PURE__*/_createElementVNode(span, { onCLick: () => {} }, [
  /*#__PURE__*/_createElementVNode(span)
], -1 /* HOISTED */))

export function render(_ctx, _cache, $props, $setup, $data, $options) {
  return (_openBlock(), _createElementBlock(div, _hoisted_1, [
    _hoisted_2,
    _hoisted_3,
    _createElementVNode(div, null, _toDisplayString(_ctx.name), 1 /* TEXT */),
    _hoisted_4
  ]))
}
```

观察以上渲染函数，你会发现 click 事件节点为静态节点（HOISTED  为 -1），即不需要每次重新渲染。

#### **9\. Diff 算法优化**

搬运 Vue3 patchChildren 源码。结合上文与源码，patchFlag 帮助 diff 时区分静态节点，以及不同类型的动态节点。一定程度地减少节点本身及其属性的比对。

```javascript
function patchChildren(n1, n2, container, parentAnchor, parentComponent, parentSuspense, isSVG, optimized) {
  // 获取新老孩子节点
  const c1 = n1 && n1.children
  const c2 = n2.children
  const prevShapeFlag = n1 ? n1.shapeFlag : 0
  const { patchFlag, shapeFlag } = n2

  // 处理 patchFlag 大于 0
  if(patchFlag > 0) {
    if(patchFlag && PatchFlags.KEYED_FRAGMENT) {
      // 存在 key
      patchKeyedChildren()
      return
    } els if(patchFlag && PatchFlags.UNKEYED_FRAGMENT) {
      // 不存在 key
      patchUnkeyedChildren()
      return
    }
  }

  // 匹配是文本节点（静态）：移除老节点，设置文本节点
  if(shapeFlag && ShapeFlags.TEXT_CHILDREN) {
    if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(c1 as VNode[], parentComponent, parentSuspense)
    }
    if (c2 !== c1) {
      hostSetElementText(container, c2 as string)
    }
  } else {
    // 匹配新老 Vnode 是数组，则全量比较；否则移除当前所有的节点
    if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        patchKeyedChildren(c1, c2, container, anchor, parentComponent, parentSuspense,...)
      } else {
        unmountChildren(c1 as VNode[], parentComponent, parentSuspense, true)
      }
    } else {

      if(prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(container, '')
      }
      if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        mountChildren(c2 as VNodeArrayChildren, container,anchor,parentComponent,...)
      }
    }
  }
}
```

patchUnkeyedChildren 源码如下所示。

```javascript
function patchUnkeyedChildren(c1, c2, container, parentAnchor, parentComponent, parentSuspense, isSVG, optimized) {
  c1 = c1 || EMPTY_ARR
  c2 = c2 || EMPTY_ARR
  const oldLength = c1.length
  const newLength = c2.length
  const commonLength = Math.min(oldLength, newLength)
  let i
  for(i = 0; i < commonLength; i++) {
    // 如果新 Vnode 已经挂载，则直接 clone 一份，否则新建一个节点
    const nextChild = (c2[i] = optimized ? cloneIfMounted(c2[i] as Vnode)) : normalizeVnode(c2[i])
    patch()
  }
  if(oldLength > newLength) {
    // 移除多余的节点
    unmountedChildren()
  } else {
    // 创建新的节点
    mountChildren()
  }

}
```

#### **10\. 打包优化**

Tree-shaking：模块打包 webpack、rollup 等中的概念。移除 JavaScript 上下文中未引用的代码。主要依赖于 import 和 export 语句，用来检测代码模块是否被导出、导入，且被 JavaScript 文件使用。

**以 nextTick 为例子，在 Vue2 中，全局 API 暴露在 Vue 实例上，即使未使用，也无法通过 tree-shaking 进行消除。**

```javascript
import Vue from "vue";

Vue.nextTick(() => {
  // 一些和DOM有关的东西
});
```

Vue3 中针对全局和内部的 API 进行了重构，并考虑到 tree-shaking 的支持。因此，全局 API 现在只能作为 ES 模块构建的命名导出进行访问。

```javascript
import { nextTick } from "vue"; // 显式导入

nextTick(() => {
  // 一些和DOM有关的东西
});
```

通过这一更改，只要模块绑定器支持 tree-shaking，则 Vue 应用程序中未使用的 api 将从最终的捆绑包中消除，获得最佳文件大小。

受此更改影响的全局 API 如下所示。

- Vue.nextTick
- Vue.observable （用  Vue.reactive 替换）
- Vue.version
- Vue.compile （仅全构建）
- Vue.set （仅兼容构建）
- Vue.delete （仅兼容构建）

内部 API 也有诸如 transition、v-model 等标签或者指令被命名导出。只有在程序真正使用才会被捆绑打包。Vue3 将所有运行功能打包也只有约 22.5kb，比 Vue2 轻量很多。

Tree shaking`是基于`ES6`模板语法（`import`与`exports`），主要是借助`ES6`模块的静态编译思想，在编译时就能确定模块的依赖关系，以及输入和输出的变量

`Tree shaking`无非就是做了两件事：

- 编译阶段利用`ES6 Module`判断哪些模块已经加载
- 判断那些模块和变量未被使用或者引用，进而删除对应代码

通过`Tree shaking`，`Vue3`给我们带来的好处是：

- 减少程序体积（更小）
- 减少程序执行时间（更快）
- 便于将来对程序架构进行优化（更友好）

#### **11\. TypeScript 支持**

Vue3 由 TypeScript 重写，相对于 Vue2 有更好的 TypeScript 支持。

- Vue2 Options API 中 option 是个简单对象，而 TypeScript 是一种类型系统，面向对象的语法，不是特别匹配。

- Vue2 需要 vue-class-component 强化 vue 原生组件，也需要 vue-property-decorator 增加更多结合 Vue 特性的装饰器，写法比较繁琐。

#### **12.Options API 与 Composition API**

Vue 组件可以用两种不同的 API 风格编写：Options API  和  Composition API。

1\. Options API

使用 Options API，我们使用选项对象定义组件的逻辑，例如 data、methods 和 mounted。由选项定义的属性在 this 内部函数中公开，指向组件实例，如下所示。

```javascript
<template>
  <button @click="increment">count is: {{ count }}</button>
</template>

<script>
export default {
  data() {
    return {
      count: 0
    }
  },
  methods: {
    increment() {
      this.count++;
    }
  },
  mounted() {
    console.log(`The initial count is ${this.count}.`);
  }
}
</script>
```

2\. Composition API

使用 Composition API，我们使用导入的 API 函数定义组件的逻辑。在 SFC 中，Composition API 通常使用

```javascript
<template>
  <button @click="increment">Count is: {{ count }}</button>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const count = ref(0);

function increment() {
  count.value++;
}

onMounted(() => {
  console.log(`The initial count is ${count.value}.`);
})
</script>
```

### vue 和 react

相似之处：

- 都将注意力集中保持在核心库，而将其他功能如路由和全局状态管理交给相关的库
- 都有自己的构建工具，能让你得到一个根据最佳实践设置的项目模板。
- 都使用了 Virtual DOM（虚拟 DOM）提高重绘性能
- 都有 props 的概念，允许组件间的数据传递
- 都鼓励组件化应用，将应用分拆成一个个功能明确的模块，提高复用性

**不同之处：**

**1）数据流**

Vue 默认支持数据双向绑定，而 React 一直提倡单向数据流

**2）虚拟 DOM**

Vue2.x 开始引入"Virtual DOM"，消除了和 React 在这方面的差异，但是在具体的细节还是有各自的特点。

- Vue 宣称可以更快地计算出 Virtual DOM 的差异，这是由于它在渲染过程中，会跟踪每一个组件的依赖关系，不需要重新渲染整个组件树。
- 对于 React 而言，每当应用的状态被改变时，全部子组件都会重新渲染。当然，这可以通过 PureComponent/shouldComponentUpdate 这个生命周期方法来进行控制，但 Vue 将此视为默认的优化。

**3）组件化**

React 与 Vue 最大的不同是模板的编写。

- Vue 鼓励写近似常规 HTML 的模板。写起来很接近标准 HTML 元素，只是多了一些属性。
- React 推荐你所有的模板通用 JavaScript 的语法扩展——JSX 书写。

具体来讲：React 中 render 函数是支持闭包特性的，所以我们 import 的组件在 render 中可以直接调用。但是在 Vue 中，由于模板中使用的数据都必须挂在 this 上进行一次中转，所以 import 完组件之后，还需要在 components 中再声明下。

**4）监听数据变化的实现原理不同**

- Vue 通过 getter/setter 以及一些函数的劫持，能精确知道数据变化，不需要特别的优化就能达到很好的性能
- React 默认是通过比较引用的方式进行的，如果不优化（PureComponent/shouldComponentUpdate）可能导致大量不必要的 vDOM 的重新渲染。这是因为 Vue 使用的是可变数据，而 React 更强调数据的不可变。

**5）高阶组件**

react 可以通过高阶组件（Higher Order Components-- HOC）来扩展，而 vue 需要通过 mixins 来扩展。

原因高阶组件就是高阶函数，而 React 的组件本身就是纯粹的函数，所以高阶函数对 React 来说易如反掌。相反 Vue.js 使用 HTML 模板创建视图组件，这时模板无法有效的编译，因此 Vue 不采用 HOC 来实现。

**6）构建工具**

两者都有自己的构建工具

- React ==> Create React APP
- Vue ==> vue-cli

**7）跨平台**

- React ==> React Native
- Vue ==> Weex

相同点:

- 核心库都只关注 ui 层面的问题解决，路由/状态管理都由其他库处理。

- 都使用了虚拟 dom 来提高重渲染效率。

- 都采用了组件化思想，将应用中不同功能抽象成一个组件，提高了代码复用性。

- 都能进行跨平台，react 使用 react native，vue 使用 weex

- 都有自己的构建工具:

  vue: vue-cli

  react: create-react-app

不同点:

- 最大的不同是组件的编写方式

  vue 推荐使用类似于常规 html 模板的方式来编写组件, 基于 vue 强大的指令系统来进行数据的绑定和添加事件监听。在 vue 中，一个组件就是一个.vue 文件。

  而 react 中采用 jsx 语法，每一个 jsx 表达式都是一个 react 元素. 在 react 中，一个组件本质就是一个函数或者一个类。

- 虚拟 dom 渲染效率方面

  由于 vue 对数据进行了劫持，因此每一个响应式数据都能进行依赖跟踪。当组件重新渲染时，不必重新渲染它的整个子组件树，而是只渲染应该重渲染的子组件。

  在 react 中，一旦组件状态变化导致重渲染后，其整个子组件树都会默认重新渲染。可以通过 pureComponent 或者 shouldComponentUpdate 来进行优化。

- 响应式方面

  vue 由于使用 defineProperty 或者 proxy, 能对数据进行劫持。因此只要修改了响应式数据本身就能导致组件的重渲染。

  而在 react 中，并没有对数据本身进行劫持，需要手动调用 setState 才能触发组件的重渲染。并且 react 强调使用不可变数据，即每次更改状态时，新状态的引用必须和旧状态不同。如果说没有使用不可变数据并且又在组件内使用了 pureComponent 或者 shouldComponentUpdate 进行优化，可能会导致状态变化组件没有重新渲染。

- 高阶组件

  react 中存在 HOC(高阶组件)的概念，因为 react 中的每一个组件本质都是一个函数或者类，都是编写在 js 代码中。因此可以轻松的实现高阶组件来对组件进行扩展。而 vue 采用模板编译的方式编写组件，无法使用 HOC, 通常通过 mixin 来扩展组件.

- 指令系统

  vue 有一套强大的指令系统并且支持自定义指令来封装一些功能。

  react 则更偏向底层，使用 javascript 原生代码进行封装功能。

### vue3 的 composition api 和 react hook 的区别？

react:

由于 react 没有实现真正的数据双向绑定即没有对数据进行劫持，react 是依靠 hook 的调用顺序来知道重渲染时，本次的 state 对应于哪一个 useState hook。因此在 react 中使用 hook 有如下要求:

- 不能在循环/判断/嵌套函数内使用 hook
- 总是确保 hook 出现在函数组件的最顶部
- 对于一些 hook 如 useEffect, useMemo, useCallBack, 必须手动注册依赖项。

而在 vue 中, 基于 vue 的响应式系统，compostion api 在调用时可以不用考虑顺序并且能使用在判断/循环/内部函数中。并且由于 vue 的响应式数据会自动收集依赖，因此使用一些 composiiton api 如 computed 以及 watchEffect 时无需手动注册依赖。

后面基本是一些小的问题比如:

> 从 React Hook 的实现角度看，React Hook 是根据 useState 调用的顺序来确定下一次重渲染时的 state 是来源于哪个 useState，所以出现了以下限制

- 不能在循环、条件、嵌套函数中调用 Hook
- 必须确保总是在你的 React 函数的顶层调用 Hook
- `useEffect、useMemo`等函数必须手动确定依赖关系

> 而 Composition API 是基于 Vue 的响应式系统实现的，与 React Hook 的相比

- 声明在`setup`函数内，一次组件实例化只调用一次`setup`，而 React Hook 每次重渲染都需要调用 Hook，使得 React 的 GC 比 Vue 更有压力，性能也相对于 Vue 来说也较慢
- `Compositon API`的调用不需要顾虑调用顺序，也可以在循环、条件、嵌套函数中使用
- 响应式系统自动实现了依赖收集，进而组件的部分的性能优化由 Vue 内部自己完成，而`React Hook`需要手动传入依赖，而且必须必须保证依赖的顺序，让`useEffect`、`useMemo`等函数正确的捕获依赖变量，否则会由于依赖不正确使得组件性能下降。

> 虽然`Compositon API`看起来比`React Hook`好用，但是其设计思想也是借鉴`React Hook`的
