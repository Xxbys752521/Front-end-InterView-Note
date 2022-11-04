---
sidebar_position: 3
description: JSX和api
---

## jsx&核心 api

### virtual Dom 是什么

一句话概括就是，用 js 对象表示 dom 信息和结构，更新时重新渲染更新后的对象对应的 dom，这个对象就是 React.createElement()的返回结果

virtual Dom 是一种编程方式，它以**对象的形式保存在内存中，它描述了我们 dom 的必要信息，并且用类似 react-dom 等模块与真实 dom 同步**，这一过程也叫协调(reconciler)，这种方式**可以声明式的渲染相应的 ui 状态，让我们从 dom 操作中解放出来**，**在 react 中是以 fiber 树的形式存放组件树的相关信息，在更新时可以增量渲染相关 dom，所以 fiber 也是 virtual Dom 实现的一部分**

### 为什么要用 virtual Dom

**大量的 dom 操作慢，很小的更新都有可能引起页面的重新排列，js 对象优于在内存中，处理起来更快，可以通过 diff 算法比较新老 virtual Dom 的差异，并且批量、异步、最小化的执行 dom 的变更，以提高性能**

另外就是可以跨平台，jsx --> ReactElement 对象 --> 真实节点，有中间层的存在，就可以在操作真实节点之前进行对应的处理，处理的结果反映到真实节点上，这个真实节点可以是浏览器环境，也可以是 Native 环境

virtual Dom 真的快吗？其实 virtual Dom**只是在更新的时候快**，在应用初始的时候不一定快

![react源码5.1](https://xiaochen1024.com/20210529105653.png)

```js
const div = document.createElement("div");
let str = "";
for (let k in div) {
  str += "," + k;
}
console.log(str);
```

![react源码5.2](https://xiaochen1024.com/20210529110136.png)

### jsx&createElement

jsx 可以声明式的描述视图，提升开发效率，通过 babel 可以转换成 React.createElement()的语法糖，也是 js 语法的扩展。

jsx 是**ClassComponent 的 render 函数**或者**FunctionComponent 的返回值**，可以用来表示组件的内容，在经过 babel 编译之后，最后会被编译成`React.createElement`，这就是为什么 jsx 文件要声明`import React from 'react'`的原因（react17 之后不用导入），你可以在 babel 编译 jsx 站点查看 jsx 被编译后的结果

`React.createElement`的源码中做了如下几件事

- 处理 config，把除了保留属性外的其他 config 赋值给 props
- 把 children 处理后赋值给 props.children
- 处理 defaultProps
- 调用 ReactElement 返回一个**jsx 对象**(virtual-dom)

```js
//ReactElement.js
export function createElement(type, config, children) {
  let propName;

  const props = {};

  let key = null;
  let ref = null;
  let self = null;
  let source = null;

  if (config != null) {
    //处理config，把除了保留属性外的其他config赋值给props
    //...
  }

  const childrenLength = arguments.length - 2;
  //把children处理后赋值给props.children
  //...

  //处理defaultProps
  //...

  return ReactElement(
    type,
    key,
    ref,
    self,
    source,
    ReactCurrentOwner.current,
    props
  );
}

const ReactElement = function (type, key, ref, self, source, owner, props) {
  const element = {
    $$typeof: REACT_ELEMENT_TYPE, //表示是ReactElement类型

    type: type, //class或function
    key: key, //key
    ref: ref, //ref属性
    props: props, //props
    _owner: owner,
  };

  return element;
};
```

`$$typeof`表示的是**组件的类型**，例如在源码中有一个检查是否是合法 Element 的函数，就是根`object.$$typeof === REACT_ELEMENT_TYPE`来判断的

```js
//ReactElement.js
export function isValidElement(object) {
  return (
    typeof object === "object" &&
    object !== null &&
    object.$$typeof === REACT_ELEMENT_TYPE
  );
}
```

如果**组件是 ClassComponent 则 type 是 class 本身**，**如果组件是 FunctionComponent 创建的，则 type 是这个 function**，源码中用 ClassComponent.prototype.isReactComponent 来区别二者。注意 class 或者 function 创建的组件一定要首**字母大写，不然后被当成普通节点，type 就是字符串**。

jsx 对象**上没有优先级、状态、effectTag 等标记**，这些**标记在 Fiber 对象上**，在 mount 时 Fiber 根据 jsx 对象来构建，**在 update 时根据最新状态的 jsx 和 current Fiber 对比**，形成新的 workInProgress Fiber，**最后 workInProgress Fiber 切换成 current Fiber**。

### render

```js
//ReactDOMLegacy.js
export function render(
  element: React$Element<any>, //jsx对象
  container: Container, //挂载dom
  callback: ?Function //回调
) {
  return legacyRenderSubtreeIntoContainer(
    null,
    element,
    container,
    false,
    callback
  );
}
```

可以看到 render 所做的事也就是调用 legacyRenderSubtreeIntoContainer，这个函数在下一章讲解，这里重点关注 ReactDom.render()使用时候的三个参数。

#### component

```js
//ReactBaseClasses.js
function Component(props, context, updater) {
  this.props = props; //props属性
  this.context = context; //当前的context
  this.refs = emptyObject; //ref挂载的对象
  this.updater = updater || ReactNoopUpdateQueue; //更新的对像
}

Component.prototype.isReactComponent = {}; //表示是classComponent
```

component 函数中主要在当前实例上**挂载了 props、context、refs、updater 等**，所以在组件的实例上能拿到这些，而更新主要的承载结构就是 updater， 主要关注 isReactComponent，它用来表示这个组件是类组件

总结：jsx 是 React.createElement 的语法糖，jsx 通过 babel 转化成 React.createElement 函数，React.createElement 执行之后**返回 jsx 对象，也叫 virtual-dom**，Fiber 会根据 jsx 对象和 current Fiber 进行对比形成 workInProgress Fiber

pureComponent 也很简单，和 component 差不多，**他会进行原型继承，然后赋值 isPureReactComponent**

```js
function PureComponent(props, context, updater) {
  this.props = props;
  this.context = context;
  this.refs = emptyObject;
  this.updater = updater || ReactNoopUpdateQueue;
}

const pureComponentPrototype = (PureComponent.prototype = new ComponentDummy());
pureComponentPrototype.constructor = PureComponent;
Object.assign(pureComponentPrototype, Component.prototype);
pureComponentPrototype.isPureReactComponent = true;

export { Component, PureComponent };
```
