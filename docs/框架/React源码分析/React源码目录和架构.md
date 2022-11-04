---
sidebar_position: 1
description: React源码目录和架构
---

## React 源码目录

### 源码目录结构

源码中主要包括如下部分

- fixtures：为代码贡献者提供的测试 React
- packages：主要部分，包含 Scheduler，reconciler 等
- scripts：react 构建相关

下面来看下 packages 主要包含的模块

- react：核心 Api 如：React.createElement、React.Component 都在这

- 和平台相关 render 相关的文件夹：

  react-art：如 canvas svg 的渲染 react-dom：浏览器环境 react-native-renderer：原生相关 react-noop-renderer：调试或者 fiber 用

- 试验性的包

  react-server: ssr 相关

  react-fetch: 请求相关

  react-interactions: 和事件如点击事件相关

  react-reconciler: 构建节点

- shared：包含公共方法和变量

- 辅助包：

  react-is : 判断类型

  react-client: 流相关

  react-fetch: 数据请求相关

react-refresh: 热加载相关

- scheduler：调度器相关

- React-reconciler：在 render 阶段用它来构建 fiber 节点

### 怎样调试源码

本课程使用的 react 版本是 17.0.1，通过下面几步就可以调试源码了，

方法一：可以用现成的包含本课程所有 demo 的项目来调试，建议使用已经构建好的项目，地址：[https://github.com/xiaochen1024/react_source_demo](https://github.com/xiaochen1024/react_source_demo)

方法二：

1.  clone 源码：`git clone https://github.com/facebook/react.git`
2.  依赖安装：`npm install` or `yarn`
3.  build 源码：npm run build react/index,react/jsx,react-dom/index,scheduler --type=NODE

- 为源码建立软链：

  ```
  cd build/node_modules/react
  npm link
  cd build/node_modules/react-dom
  npm link
  ```

- create-react-app 创建项目

  ```
  npx create-react-app demo
  npm link react react-dom
  ```

### React 源码架构

认识一下 react 源码架构和各个模块。

在真正的代码学习之前，我们需要在大脑中有一个 react 源码的地图，知道 react 渲染的大致流程和框架，这样才能从上帝视角看 react 是怎么更新的，来吧少年。

react 的核心可以用 ui=fn(state)来表示，更详细可以用

```js
const state = reconcile(update);
const UI = commit(state);
```

上面的 fn 可以分为如下一个部分：

- Scheduler（调度器）： 排序优先级，让优先级高的任务先进行 reconcile
- Reconciler（协调器）： 找出哪些节点发生了改变，并打上不同的 Flags（旧版本 react 叫 Tag）
- Renderer（渲染器）： 将 Reconciler 中打好标签的节点渲染到视图上

一图胜千言：

![react源码3.1](https://xiaochen1024.com/react%E6%BA%90%E7%A0%813.1.png)

![react源码3.2](https://xiaochen1024.com/20210602082005.png)

### jsx

jsx 是 js 语言的扩展，react 通过 babel 词法解析（具体怎么转换可以查阅 babel 相关插件），将 jsx**转换成 React.createElement**，React.createElement 方法返回**virtual-dom 对象**（内存中用来描述 dom 阶段的对象），所有**jsx 本质上就是 React.createElement 的语法糖**，它能声明式的编写我们想要组件呈现出什么样的 ui 效果。

### Fiber 双缓存

**Fiber 对象**上面保存了包括**这个节点的属性、类型、dom 等**，Fiber 通过 child、sibling、return（指向父节点）来形成 Fiber 树，还保存了**更新状态时用于计算 state 的 updateQueue**，**updateQueue 是一种链表结构**，上面可能存在多个未计算的 update，update 也是一种数据结构，上面包含了更新的数据、优先级等，除了这些之外，上面还有和副作用有关的信息。

双缓存是指存在两颗 Fiber 树，**current Fiber 树描述了当前呈现的 dom 树，workInProgress Fiber 是正在更新的 Fiber 树**，这两颗 Fiber 树都是在内存中运行的，**在 workInProgress Fiber 构建完成之后会将它作为 current Fiber 应用到 dom 上**

在 mount 时（**首次渲染**），会根据 jsx 对象（Class Component 或者的 render 函数 Function Component 的返回值），构建 Fiber 对象，形成 Fiber 树，然后这颗**Fiber 树会作为 current Fiber**应用到真实 dom 上，在 update（状态更新时如 setState）的时候，会**根据状态变更后的 jsx 对象**和 current Fiber 做对比形成**新的 workInProgress Fiber**，然后 workInProgress Fiber 切换成 current Fiber 应用到真实 dom 就达到了更新的目的，而这一切都是在内存中发生的，从而减少了对 dom 好性能的操作。

例如下面代码的 Fiber 双缓存结构如下，

```js
function App() {
  const [count, setCount] = useState(0);
  return (
    <>
      <h1
        onClick={() => {
          // debugger;
          setCount(() => count + 1);
        }}
      >
        <p title={count}>{count}</p> xiaochen
      </h1>
    </>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
```

![react源码7.3](https://xiaochen1024.com/react%E6%BA%90%E7%A0%817.3.png)

### scheduler

Scheduler 的作用是调度任务，react15 没有 Scheduler 这部分，**所以所有任务没有优先级，也不能中断，只能同步执行**。

我们知道了要**实现异步可中断的更新，需要浏览器指定一个时间，如果没有时间剩余了就需要暂停任务**，**requestIdleCallback**貌似是个不错的选择，但是它存在兼容和触发不稳定的原因，react17 中采用**MessageChannel**来实现。

```js
//ReactFiberWorkLoop.old.js
function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    //shouldYield判断是否暂停任务
    workInProgress = performUnitOfWork(workInProgress);
  }
}
```

在 Scheduler 中的每个任务的优先级使用过期时间表示的，**如果一个任务的过期时间离现在很近，说明它马上就要过期了，优先级很高**，**如果过期时间很长，那它的优先级就低**，**没有过期的任务存放在 timerQueue 中，过期的任务存放在 taskQueue 中**，timerQueue 和 timerQueue 都是**小顶堆**，所以 p**eek 取出来的都是离现在时间最近也就是优先级最高的那个任务，然后优先执行它**。

![react源码15.2](https://xiaochen1024.com/react%E6%BA%90%E7%A0%8115.2.png)

### Lane 模型

react 之前的版本用`expirationTime`属性**代表优先级**，该**优先级和 IO 不能很好的搭配工作**（io 的优先级高于 cpu 的优先级），现在有了**更加细粒度的优先级表示方法 Lane**，**Lane 用二进制位表示优先级**，二进制中的 1 表示位置，同一个二进制数可以有多个相同优先级的位，这就可以表示‘批’的概念，而且二进制方便计算。

这好比赛车比赛，在比赛开始的时候会分配一个赛道，比赛开始之后大家都会抢内圈的赛道（react 中就是抢优先级高的 Lane），比赛的尾声，最后一名赛车如果落后了很多，它也会跑到内圈的赛道，最后到达目的地（对应 react 中就是饥饿问题，低优先级的任务如果被高优先级的任务一直打断，到了它的过期时间，它也会变成高优先级）

Lane 的二进制位如下，**1 的 bits 越多，优先级越低**

```js
//ReactFiberLane.js
export const NoLanes: Lanes = /*                        */ 0b0000000000000000000000000000000;
export const NoLane: Lane = /*                          */ 0b0000000000000000000000000000000;

export const SyncLane: Lane = /*                        */ 0b0000000000000000000000000000001;
export const SyncBatchedLane: Lane = /*                 */ 0b0000000000000000000000000000010;

export const InputDiscreteHydrationLane: Lane = /*      */ 0b0000000000000000000000000000100;
const InputDiscreteLanes: Lanes = /*                    */ 0b0000000000000000000000000011000;

const InputContinuousHydrationLane: Lane = /*           */ 0b0000000000000000000000000100000;
const InputContinuousLanes: Lanes = /*                  */ 0b0000000000000000000000011000000;

export const DefaultHydrationLane: Lane = /*            */ 0b0000000000000000000000100000000;
export const DefaultLanes: Lanes = /*                   */ 0b0000000000000000000111000000000;

const TransitionHydrationLane: Lane = /*                */ 0b0000000000000000001000000000000;
const TransitionLanes: Lanes = /*                       */ 0b0000000001111111110000000000000;

const RetryLanes: Lanes = /*                            */ 0b0000011110000000000000000000000;

export const SomeRetryLane: Lanes = /*                  */ 0b0000010000000000000000000000000;

export const SelectiveHydrationLane: Lane = /*          */ 0b0000100000000000000000000000000;

const NonIdleLanes = /*                                 */ 0b0000111111111111111111111111111;

export const IdleHydrationLane: Lane = /*               */ 0b0001000000000000000000000000000;
const IdleLanes: Lanes = /*                             */ 0b0110000000000000000000000000000;

export const OffscreenLane: Lane = /*                   */ 0b1000000000000000000000000000000;
```

### reconciler （render phase）

Reconciler 发生在**render 阶段**，render 阶段会分别为**节点执行 beginWork 和 completeWork**（后面会讲），或者**计算 state，对比节点的差异，为节点赋值相应的 effectFlags**（对应 dom 节点的增删改）

协调器是在 render 阶段工作的，简单一句话概括就是**Reconciler 会创建或者更新 Fiber 节点**。在**mount 的时候会根据 jsx 生成 Fiber 对象，在 update 的时候会根据最新的 state 形成的 jsx 对象和 current Fiber 树对比构建 workInProgress Fiber 树，这个对比的过程就是 diff 算法**。

**diff 算法**发生在 render 阶段的**reconcileChildFibers 函数中**，diff 算法分为单节点的 diff 和多节点的 diff（例如一个节点中包含多个子节点就属于多节点的 diff），单节点会根据节点的 key 和 type，props 等来判断节点是复用还是直接新创建节点，多节点 diff 会涉及节点的增删和节点位置的变化。

reconcile 时会在这些**Fiber 上打上 Flags 标签**，在 commit 阶段把这些标签应用到真实 dom 上，这些标签代表节点的增删改，如

```js
//ReactFiberFlags.js
export const Placement = /*             */ 0b0000000000010;
export const Update = /*                */ 0b0000000000100;
export const PlacementAndUpdate = /*    */ 0b0000000000110;
export const Deletion = /*              */ 0b0000000001000;
```

render 阶段**遍历 Fiber 树类似 dfs 的过程**，

‘捕获’阶段发生在 beginWork 函数中，该函数做的主要工作是创建 Fiber 节点，计算 state 和 diff 算法，

‘冒泡’阶段发生在 completeWork 中，该函数主要是做一些收尾工作，例如处理节点的 props、和形成一条 effectList 的链表，该链表是被标记了更新的节点形成的链表

深度优先遍历过程如下，图中的数字是顺序，return 指向父节点，第 9 章详细讲解

```js
function App() {
  return (
    <>
      <h1>
        <p>count</p> xiaochen
      </h1>
    </>
  );
}
```

![react源码7.2](https://xiaochen1024.com/react%E6%BA%90%E7%A0%817.2.png)

看如下代码

```js
function App() {
  const [count, setCount] = useState(0);
  return (
    <>
      <h1
        onClick={() => {
          setCount(() => count + 1);
        }}
      >
        <p title={count}>{count}</p> xiaochen
      </h1>
    </>
  );
}
```

如果 p 和 h1 节点更新了则 effectList 如下，从**rootFiber->h1->p**,，顺便说下 fiberRoot 是整个项目的根节点，只存在一个，**rootFiber 是应用的根节点**，可能存在多个，例如多个`ReactDOM.render(<App />, document.getElementById("root"));`创建多个应用节点

![react源码8.3](https://xiaochen1024.com/react%E6%BA%90%E7%A0%818.3.png)

### renderer（commit phase）

Renderer 发生在 commit 阶段，commit 阶段遍历 effectList 执行对应的 dom 操作或部分生命周期。

Renderer 是在 commit 阶段工作的，**commit 阶段会遍历 render 阶段形成的 effectList，并执行真实 dom 节点的操作和一些生命周期，不同平台对应的 Renderer 不同，例如浏览器对应的就是 react-dom**。

commit 阶段发生在**commitRoot 函数中，该函数主要遍历 effectList，分别用三个函数来处理 effectList 上的节点，这三个函数是 commitBeforeMutationEffects、commitMutationEffects、commitLayoutEffects**

![react源码10.1](https://xiaochen1024.com/react%E6%BA%90%E7%A0%8110.1.png)

### concurrent

它是一类功能的合集（如 fiber、schduler、lane、suspense），其目的是**为了提高应用的响应速度，使应用 cpu 密集型的更新不在那么卡顿，其核心是实现了一套异步可中断、带优先级的更新**。

我们知道一般浏览器的 fps 是 60Hz，也就是每 16.6ms 会刷新一次，而**js 执行线程和 GUI 也就是浏览器的绘制是互斥的，因为 js 可以操作 dom，影响最后呈现的结果，所以如果 js 执行的时间过长，会导致浏览器没时间绘制 dom，造成卡顿**。react17 会在**每一帧分配一个时间（时间片）给 js 执行**，如果在这个时间内 js 还没执行完，那就要暂停它的执行，等下一帧继续执行，把执行权交回给浏览器去绘制。

![react源码15.3](https://xiaochen1024.com/react%E6%BA%90%E7%A0%8115.3.png)

对比下开启和未开启 concurrent mode 的区别，**开启之后，构建 Fiber 的任务的执行不会一直处于阻塞状态，而是分成了一个个的 task**

**未开启 concurrent**

![react源码1.2](https://xiaochen1024.com/20210529135848.png)

**开启 concurrent**

![react源码3.3](https://xiaochen1024.com/react%E6%BA%90%E7%A0%813.3.png)
