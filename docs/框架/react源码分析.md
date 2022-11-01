---
sidebar_position: 2
description: React源码分析
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

## React 源码架构

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

## React 设计理念

### 异步可中断

- **React15 慢在哪里**

在讲这部分之前，需要讲是那些因素导致了 react 变慢，并且需要重构呢。

React15 之前的协调过程是同步的，也叫 stack reconciler，又因为 js 的执行是单线程的，这就导致了在更新比较耗时的任务时，不能及时响应一些高优先级的任务，比如用户的输入，所以页面就会卡顿，这就是 cpu 的限制。

- **解决方案**

如何解决这个问题呢，试想一下，如果我们在日常的开发中，在单线程的环境中，遇到了比较耗时的代码计算会怎么做呢，首先我们可能会将任务分割，让它能够被中断，在其他任务到来的时候让出执行权，当其他任务执行后，再从之前中断的部分开始异步执行剩下的计算。所以关键是实现一套异步可中断的方案。

- **实现**

在刚才的解决方案中提到了任务分割，和异步执行，并且能让出执行权，由此可以带出 react 中的三个概念

1. Fiber：react15 的更新是同步的，因为它不能将任务分割，所以需要一套数据结构让它既能对应真实的 dom 又能作为分隔的单元，这就是 Fiber。

   ```js
   let firstFiber;
   let nextFiber = firstFiber;
   let shouldYield = false;
   //firstFiber->firstChild->sibling
   function performUnitOfWork(nextFiber) {
     //...
     return nextFiber.next;
   }

   function workLoop(deadline) {
     while (nextFiber && !shouldYield) {
       nextFiber = performUnitOfWork(nextFiber);
       shouldYield = deadline.timeReaming < 1;
     }
     requestIdleCallback(workLoop);
   }

   requestIdleCallback(workLoop);
   ```

2. Scheduler：有了 Fiber，我们就需要用浏览器的时间片异步执行这些 Fiber 的工作单元，我们知道浏览器有一个 api 叫做**requestIdleCallback**，它可以在浏览器空闲的时候执行一些任务，我们用这个 api 执行 react 的更新，让高优先级的任务优先响应不就可以了吗，但事实是 requestIdleCallback 存在着浏览器的兼容性和触发不稳定的问题，所以我们需要用 js 实现一套时间片运行的机制，在 react 中这部分叫做 scheduler。

3. Lane：有了异步调度，我们还需要细粒度的管理各个任务的优先级，让高优先级的任务优先执行，各个 Fiber 工作单元还能比较优先级，相同优先级的任务可以一起更新，想想是不是更 cool 呢。

- **产生出来的上层实现**

  由于有了这一套异步可中断的机制，我们就能实现 batchedUpdates 批量更新和 Suspense

下面这两张图就是使用异步可中断更新前后的区别，可以体会一下

![react源码2.2](https://xiaochen1024.com/react%E6%BA%90%E7%A0%812.2.png)

![react源码2.3](https://xiaochen1024.com/react%E6%BA%90%E7%A0%812.3.png)

### 代数效应（Algebraic Effects）

除了 cpu 的瓶颈问题，还有一类问题是和副作用相关的问题，比如获取数据、文件操作等。不同设备性能和网络状况都不一样，react 怎样去处理这些副作用，让我们在编码时最佳实践，运行应用时表现一致呢，这就需要 react 有分离副作用的能力，为什么要分离副作用呢，因为要解耦，这就是代数效应。

提问：我们都写过获取数据的代码，在获取数据前展示 loading，数据获取之后取消 loading，假设我们的设备性能和网络状况都很好，数据很快就获取到了，那我们还有必要在一开始的时候展示 loading 吗？如何才能有更好的用户体验呢？

看下下面这个例子

```js
function getPrice(id) {
  return fetch(`xxx.com?id=${productId}`).then((res) => {
    return res.price;
  });
}

async function getTotalPirce(id1, id2) {
  const p1 = await getPrice(id1);
  const p2 = await getPrice(id2);

  return p1 + p2;
}

async function run() {
  await getTotalPrice("001", "002");
}
```

getPrice 是一个异步获取数据的方法，我们可以用 async+await 的方式获取数据，但是这会导致调用 getTotalPrice 的 run 方法也会变成异步函数，这就是 async 的传染性，所以没法分离副作用。

```js
function getPrice(id) {
  const price = perform id;
  return price;
}

function getTotalPirce(id1, id2) {
  const p1 = getPrice(id1);
  const p2 = getPrice(id2);

  return p1 + p2;
}

try {
  getTotalPrice('001', '002');
} handle (productId) {
  fetch(`xxx.com?id=${productId}`).then((res)=>{
    resume with res.price
  })
}
```

现在改成下面这段代码，其中 perform 和 handle 是虚构的语法，当代码执行到 perform 的时候会暂停当前函数的执行，并且被 handle 捕获，handle 函数体内会拿到 productId 参数获取数据之后 resume 价格 price，resume 会回到之前 perform 暂停的地方并且返回 price，这就完全把副作用分离到了 getTotalPirce 和 getPrice 之外。

这里的关键流程是 perform 暂停函数的执行，handle 获取函数执行权，resume 交出函数执行权。

但是这些语法毕竟是虚构的，但是请看下下面的代码

```js
function usePrice(id) {
  useEffect((id)=>{
      fetch(`xxx.com?id=${productId}`).then((res)=>{
        return res.price
  })
  }, [])
}

function TotalPirce({id1, id2}) {
  const p1 = usePrice(id1);
  const p2 = usePrice(id2);

  return <TotalPirce props={...}>
}

```

如果把 getPrice 换成 usePrice，getTotalPirce 换成 TotalPirce 组件，是不是有点熟悉呢，这就是 hook 分离副作用的能力。

我们知道 generator 也可以做到程序的暂停和恢复啊，那用 generator 不行就行了吗，但是 generator 暂停之后的恢复执行，**还是得把执行权交换给直接调用者，调用者会沿着调用栈继续上交，所以也是有传染性的，并且 generator 不能计算优先级，排序优先级**。

```js
function getPrice(id) {
  return fetch(`xxx.com?id=${productId}`).then((res) => {
    return res.price;
  });
}

function* getTotalPirce(id1, id2) {
  const p1 = yield getPrice(id1);
  const p2 = yield getPrice(id2);

  return p1 + p2;
}

function* run() {
  yield getTotalPrice("001", "002");
}
```

**解耦副作用**在函数式编程的实践中非常常见，例如 redux-saga，将副作用从 saga 中分离，自己不处理副作用，只负责发起请求

```js
function* fetchUser(action) {
  try {
    const user = yield call(Api.fetchUser, action.payload.userId);
    yield put({ type: "USER_FETCH_SUCCEEDED", user: user });
  } catch (e) {
    yield put({ type: "USER_FETCH_FAILED", message: e.message });
  }
}
```

严格意义上讲 react 是不支持 Algebraic Effects 的，但是 react 有 Fiber 啊，**执行完这个 Fiber 的更新之后交还执行权给浏览器，让浏览器决定后面怎么调度，由此可见 Fiber 得是一个链表结构才能达到这样的效果**，

Suspense 也是这种概念的延伸，后面看到了具体的 Suspense 的源码就有些感觉了。先看个例子

```js
const ProductResource = createResource(fetchProduct);

const Proeuct = (props) => {
  const p = ProductResource.read(
    // 用同步的方式来编写异步代码!
    props.id
  );
  return <h3>{p.price}</h3>;
};

function App() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <Proeuct id={123} />
      </Suspense>
    </div>
  );
}
```

可以看到 ProductResource.read 完全是同步的写法，把获取数据的部分完全分离出了 Proeuct 组件之外，在源码中，ProductResource.read 会在获取数据之前会 throw 一个特殊的 Promise，由于 scheduler 的存在，**scheduler 可以捕获这个 promise，暂停更新，等数据获取之后交还执行权**。ProductResource 可以是 localStorage 甚至是 redis、mysql 等数据库，也就是组件即服务，可能以后会有 server Component 的出现。

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

## legacy 和 concurrent 模式入口函数

### react 启动的模式

react 有 3 种模式进入主体函数的入口，我们可以从 react 官方文档 [使用 Concurrent 模式（实验性）](https://zh-hans.reactjs.org/docs/concurrent-mode-adoption.html#feature-comparison)中对比三种模式：

- **legacy 模式：** `ReactDOM.render(<App />, rootNode)`。这是当前 React app 使用的方式。当前没有计划删除本模式，但是这个模式可能不支持这些新功能。
- **blocking 模式：** `ReactDOM.createBlockingRoot(rootNode).render(<App />)`。目前正在实验中。作为迁移到 concurrent 模式的第一个步骤。
- **concurrent 模式：** `ReactDOM.createRoot(rootNode).render(<App />)`。目前在实验中，未来稳定之后，打算作为 React 的默认开发模式。这个模式开启了*所有的*新功能。

**特性对比：**

![react源码6.1](https://xiaochen1024.com/20210529105705.png)

legacy 模式在合成事件中有自动批处理的功能，但仅限于一个浏览器任务。非 React 事件想使用这个功能必须使用 `unstable_batchedUpdates`。在 blocking 模式和 concurrent 模式下，所有的 `setState` 在默认情况下都是批处理的。会在开发中发出警告

#### 不同模式在 react 运行时的含义

legacy 模式是我们常用的，它构建 dom 的过程是同步的，所以在 render 的 reconciler 中，如果 diff 的过程特别耗时，那么导致的结果就是 js 一直阻塞高优先级的任务(例如用户的点击事件)，表现为页面的卡顿，无法响应。

concurrent Mode 是 react 未来的模式，它用时间片调度实现了异步可中断的任务，根据设备性能的不同，时间片的长度也不一样，在每个时间片中，如果任务到了过期时间，就会主动让出线程给高优先级的任务。这部分将在 scheduler&lane 模型 中解释。

#### 两种模式函数主要执行过程

**1.主要执行流程：**

![react源码6.3](https://xiaochen1024.com/20210529105709.png)

2.**详细函数调用过程**：

用 demo_0 跟着视频调试更加清晰，黄色部分是主要任务是创建 fiberRootNode 和 rootFiber，红色部分是创建 Update，蓝色部分是调度 render 阶段的入口函数

![react源码6.2](https://xiaochen1024.com/20210529105712.png)

**3.legacy 模式：**

- render 调用 legacyRenderSubtreeIntoContainer，最后 createRootImpl 会调用到 createFiberRoot 创建 fiberRootNode,然后调用 createHostRootFiber 创建 rootFiber，其中 fiberRootNode 是整个项目的的根节点，rootFiber 是当前应用挂在的节点，也就是 ReactDOM.render 调用后的根节点

  ```js
  //最上层的节点是整个项目的根节点fiberRootNode
  ReactDOM.render(<App />, document.getElementById("root")); //rootFiber
  ReactDOM.render(<App />, document.getElementById("root")); //rootFiber
  ```

  ![react源码7.1](https://xiaochen1024.com/20210529105717.png)

- 创建完 Fiber 节点后，legacyRenderSubtreeIntoContainer 调用 updateContainer 创建创建 Update 对象挂载到 updateQueue 的环形链表上，然后执行 scheduleUpdateOnFiber 调用 performSyncWorkOnRoot 进入 render 阶段和 commit 阶段

**4.concurrent 模式：**

- createRoot 调用 createRootImpl 创建 fiberRootNode 和 rootNode
- 创建完 Fiber 节点后，调用 ReactDOMRoot.prototype.render 执行 updateContainer，然后 scheduleUpdateOnFiber 异步调度 performConcurrentWorkOnRoot 进入 render 阶段和 commit 阶段

**5.legacy 模式主要函数注释**

```js
function legacyRenderSubtreeIntoContainer(
  parentComponent,
  children,
  container,
  forceHydrate,
  callback
) {
  //...
  var root = container._reactRootContainer;
  var fiberRoot;

  if (!root) {
    // mount时
    root = container._reactRootContainer = legacyCreateRootFromDOMContainer(
      container,
      forceHydrate
    ); //创建root节点
    fiberRoot = root._internalRoot;

    if (typeof callback === "function") {
      //处理回调
      var originalCallback = callback;

      callback = function () {
        var instance = getPublicRootInstance(fiberRoot);
        originalCallback.call(instance);
      };
    }

    unbatchedUpdates(function () {
      updateContainer(children, fiberRoot, parentComponent, callback); //创建update入口
    });
  } else {
    // update时
    fiberRoot = root._internalRoot;

    if (typeof callback === "function") {
      //处理回调
      var _originalCallback = callback;

      callback = function () {
        var instance = getPublicRootInstance(fiberRoot);

        _originalCallback.call(instance);
      };
    }

    updateContainer(children, fiberRoot, parentComponent, callback);
  }
}
```

```js
function createFiberRoot(containerInfo, tag, hydrate, hydrationCallbacks) {
  var root = new FiberRootNode(containerInfo, tag, hydrate); //创建fiberRootNode
  const uninitializedFiber = createHostRootFiber(tag); //创建rootFiber
  //rootFiber和fiberRootNode连接
  root.current = uninitializedFiber;
  uninitializedFiber.stateNode = root;
  //创建updateQueue
  initializeUpdateQueue(uninitializedFiber);
  return root;
}

//对于HostRoot或者ClassComponent会使用initializeUpdateQueue创建updateQueue，然后将updateQueue挂载到fiber节点上
export function initializeUpdateQueue<State>(fiber: Fiber): void {
  const queue: UpdateQueue<State> = {
    baseState: fiber.memoizedState, //初始state，后面会基于这个state，根据Update计算新的state
    firstBaseUpdate: null, //Update形成的链表的头
    lastBaseUpdate: null, //Update形成的链表的尾
    //新产生的update会以单向环状链表保存在shared.pending上，计算state的时候会剪开这个环状链表，并且连接在  //lastBaseUpdate后
    shared: {
      pending: null,
    },
    effects: null,
  };
  fiber.updateQueue = queue;
}
```

```js
function updateContainer(element, container, parentComponent, callback) {
  var lane = requestUpdateLane(current$1); //获取当前可用lane 在12章讲解
  var update = createUpdate(eventTime, lane); //创建update

  update.payload = {
    element: element, //jsx
  };

  enqueueUpdate(current$1, update); //update入队
  scheduleUpdateOnFiber(current$1, lane, eventTime); //调度update
  return lane;
}
```

```js
function scheduleUpdateOnFiber(fiber, lane, eventTime) {
  if (lane === SyncLane) {
    //同步lane 对应legacy模式
    //...
    performSyncWorkOnRoot(root); //render阶段的起点 render在第6章讲解
  } else {
    //concurrent模式
    //...
    ensureRootIsScheduled(root, eventTime); //确保root被调度
  }
}
```

**6.concurrent 主要函数注释：**

```js
function ensureRootIsScheduled(root, currentTime) {
  //...
  var nextLanes = getNextLanes(
    root,
    root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes
  ); //计算nextLanes

  //...

  //将lane的优先级转换成schduler的优先级
  var schedulerPriorityLevel =
    lanePriorityToSchedulerPriority(newCallbackPriority);
  //以schedulerPriorityLevel的优先级执行performConcurrentWorkOnRoot 也就是concurrent模式的起点
  newCallbackNode = scheduleCallback(
    schedulerPriorityLevel,
    performConcurrentWorkOnRoot.bind(null, root)
  );
}
```

**7.两种模式的不同点：**

1.  createRootImpl 中传入的第二个参数不一样 一个是 LegacyRoot 一个是 ConcurrentRoot
2.  requestUpdateLane 中获取的 lane 的优先级不同
3.  在函数 scheduleUpdateOnFiber 中根据不同优先级进入不同分支，legacy 模式进入 performSyncWorkOnRoot，concurrent 模式会异步调度 performConcurrentWorkOnRoot

## Fiber 架构

### Fiber 的深度理解

react15 在 render 阶段的 reconcile 是不可打断的，这会在进行大量节点的 reconcile 时可能产生卡顿，因为浏览器所有的时间都交给了 js 执行，并且 js 的执行时单线程。为此 react16 之后就有了**scheduler 进行时间片的调度，给每个 task（工作单元）一定的时间，如果在这个时间内没执行完，也要交出执行权给浏览器进行绘制和重排，所以异步可中断的更新需要一定的数据结构在内存中来保存工作单元的信息，这个数据结构就是 Fiber**。

那么有了 Fiber 这种数据结构后，能完成哪些事情呢，

- **工作单元 任务分解** ：Fiber 最重要的功能就是作为工作单元，保存原生节点或者组件节点对应信息（包括优先级），这些节点通过指针的形似形成 Fiber 树
- **增量渲染**：通过 jsx 对象和 current Fiber 的对比，生成最小的差异补丁，应用到真实节点上
- **根据优先级暂停、继续、排列优先级**：Fiber 节点上保存了优先级，能通过不同节点优先级的对比，达到任务的暂停、继续、排列优先级等能力，也为上层实现批量更新、Suspense 提供了基础
- **保存状态**：因为 Fiber 能保存状态和更新的信息，所以就能实现函数组件的状态更新，也就是 hooks

#### Fiber 的数据结构

Fiber 的自带的属性如下：

```js
//ReactFiber.old.js
function FiberNode(
  tag: WorkTag,
  pendingProps: mixed,
  key: null | string,
  mode: TypeOfMode
) {
  //作为静态的数据结构 保存节点的信息
  this.tag = tag; //对应组件的类型
  this.key = key; //key属性
  this.elementType = null; //元素类型
  this.type = null; //func或者class
  this.stateNode = null; //真实dom节点

  //作为fiber数架构 连接成fiber树
  this.return = null; //指向父节点
  this.child = null; //指向child
  this.sibling = null; //指向兄弟节点
  this.index = 0;

  this.ref = null;

  //用作为工作单元 来计算state
  this.pendingProps = pendingProps;
  this.memoizedProps = null;
  this.updateQueue = null;
  this.memoizedState = null;
  this.dependencies = null;

  this.mode = mode;

  //effect相关
  this.effectTag = NoEffect;
  this.nextEffect = null;
  this.firstEffect = null;
  this.lastEffect = null;

  //优先级相关的属性
  this.lanes = NoLanes;
  this.childLanes = NoLanes;

  //current和workInProgress的指针
  this.alternate = null;
}
```

#### Fiber 双缓存

现在我们知道了 Fiber 可以保存真实的 dom，真实 dom 对应在内存中的 Fiber 节点会形成 Fiber 树，这颗 Fiber 树在 react 中叫 current Fiber，也就是当前 dom 树对应的 Fiber 树，而正在构建 Fiber 树叫 workInProgress Fiber，这两颗树的节点通过 alternate 相连.

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

ReactDOM.render(<App />, document.getElementById("root"));
```

![react源码7.2](https://xiaochen1024.com/20210529105724.png)

构建 workInProgress Fiber 发生在 createWorkInProgress 中，它能创建或者服用 Fiber

```js
//ReactFiber.old.js
export function createWorkInProgress(current: Fiber, pendingProps: any): Fiber {
  let workInProgress = current.alternate;
  if (workInProgress === null) {
    //区分是在mount时还是在update时
    workInProgress = createFiber(
      current.tag,
      pendingProps,
      current.key,
      current.mode
    );
    workInProgress.elementType = current.elementType;
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;

    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    workInProgress.pendingProps = pendingProps; //复用属性
    workInProgress.type = current.type;
    workInProgress.flags = NoFlags;

    workInProgress.nextEffect = null;
    workInProgress.firstEffect = null;
    workInProgress.lastEffect = null;

    //...
  }

  workInProgress.childLanes = current.childLanes; //复用属性
  workInProgress.lanes = current.lanes;

  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;

  const currentDependencies = current.dependencies;
  workInProgress.dependencies =
    currentDependencies === null
      ? null
      : {
          lanes: currentDependencies.lanes,
          firstContext: currentDependencies.firstContext,
        };

  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;
  workInProgress.ref = current.ref;

  return workInProgress;
}
```

- 在 mount 时：会创建 fiberRoot 和 rootFiber，然后根据 jsx 对象创建 Fiber 节点，节点连接成 current Fiber 树。 ![react源码7.1](https://xiaochen1024.com/20210529105729.png)

- 在 update 时：会根据新的状态形成的 jsx（ClassComponent 的 render 或者 FuncComponent 的返回值）和 current Fiber 对比形（diff 算法）成一颗叫 workInProgress 的 Fiber 树，然后将 fiberRoot 的 current 指向 workInProgress 树，此时 workInProgress 就变成了 current Fiber。fiberRoot：指整个应用的根节点，只存在一个

  > fiberRoot：指整个应用的根节点，只存在一个
  >
  > rootFiber：ReactDOM.render 或者 ReactDOM.unstable_createRoot 创建出来的应用的节点，可以存在多个。

我们现在知道了存在 current Fiber 和 workInProgress Fiber 两颗 Fiber 树，Fiber 双缓存指的就是，在经过 reconcile（diff）形成了新的 workInProgress Fiber 然后将 workInProgress Fiber 切换成 current Fiber 应用到真实 dom 中，存在双 Fiber 的好处是在内存中形成视图的描述，在最后应用到 dom 中，减少了对 dom 的操作。

**现在来看看 Fiber 双缓存创建的过程图**：

- **mount 时：**

  1.  刚开始只创建了 fiberRoot 和 rootFiber 两个节点 ![react源码7.6](https://xiaochen1024.com/20210529105732.png)

  2.  然后根据 jsx 创建 workInProgress Fiber： ![react源码7.7](https://xiaochen1024.com/20210529105735.png)

  3.  把 workInProgress Fiber 切换成 current Fiber ![react源码7.8](https://xiaochen1024.com/20210529105738.png)

- **update 时**

  1.  根据 current Fiber 创建 workInProgress Fiber ![react源码7.9](https://xiaochen1024.com/20210529105741.png)
  2.  把 workInProgress Fiber 切换成 current Fiber

![react源码7.8](https://xiaochen1024.com/20210529105745.png)

## render 阶段

### render 阶段的入口

render 阶段的主要工作是构建 Fiber 树和生成 effectList，我们知道了 react 入口的两种模式会进入**performSyncWorkOnRoot**或者**performConcurrentWorkOnRoot**，而这两个方法分别会调用**workLoopSync**或者**workLoopConcurrent**

```js
//ReactFiberWorkLoop.old.js
function workLoopSync() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}
```

这两函数的区别是判断条件**是否存在 shouldYield 的执行**，**如果浏览器没有足够的时间，那么会终止 while 循环，也不会执行后面的 performUnitOfWork 函数，自然也不会执行后面的 render 阶段和 commit 阶段**，这部分属于 scheduler 的知识点。

- workInProgress：新创建的 workInProgress fiber

- performUnitOfWork：workInProgress fiber 和会和已经创建的 Fiber 连接起来形成 Fiber 树。这个过程类似深度优先遍历，我们暂且称它们为‘捕获阶段’和‘冒泡阶段’。伪代码执行的过程大概如下

  ```js
  function performUnitOfWork(fiber) {
    if (fiber.child) {
      performUnitOfWork(fiber.child); //beginWork
    }

    if (fiber.sibling) {
      performUnitOfWork(fiber.sibling); //completeWork
    }
  }
  ```

### render 阶段整体执行流程

![react源码8.1](https://xiaochen1024.com/20210529105753.png)

- 捕获阶段 从根节点 rootFiber 开始，遍历到叶子节点，每次遍历到的节点都会执行 beginWork，并且传入当前 Fiber 节点，然后创建或复用它的子 Fiber 节点，并赋值给 workInProgress.child。

- 冒泡阶段 在捕获阶段遍历到子节点之后，会执行 completeWork 方法，执行完成之后会判断此节点的兄弟节点存不存在，如果存在就会为兄弟节点执行 completeWork，当全部兄弟节点执行完之后，会向上‘冒泡’到父节点执行 completeWork，直到 rootFiber。

- 示例

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

  ReactDOM.render(<App />, document.getElementById("root"));
  ```

  当执行完深度优先遍历之后形成的 Fiber 树：

  ![react源码7.2](https://xiaochen1024.com/20210529105757.png)

图中的数字是遍历过程中的顺序，可以看到，遍历的过程中会从应用的根节点 rootFiber 开始，依次执行 beginWork 和 completeWork，最后形成一颗 Fiber 树，每个节点以 child 和 return 相连。

> 注意：当遍历到只有一个子文本节点的 Fiber 时，该 Fiber 节点的子节点不会执行 beginWork 和 completeWork，如图中的‘chen’文本节点。这是 react 的一种优化手段

### beginWork

beginWork 主要的工作是创建或复用子 fiber 节点

```js
function beginWork(
  current: Fiber | null, //当前存在于dom树中对应的Fiber树
  workInProgress: Fiber, //正在构建的Fiber树
  renderLanes: Lanes //第12章在讲
): Fiber | null {
  // 1.update时满足条件即可复用current fiber进入bailoutOnAlreadyFinishedWork函数
  if (current !== null) {
    const oldProps = current.memoizedProps;
    const newProps = workInProgress.pendingProps;
    if (
      oldProps !== newProps ||
      hasLegacyContextChanged() ||
      (__DEV__ ? workInProgress.type !== current.type : false)
    ) {
      didReceiveUpdate = true;
    } else if (!includesSomeLane(renderLanes, updateLanes)) {
      didReceiveUpdate = false;
      switch (
        workInProgress.tag
        // ...
      ) {
      }
      return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
    } else {
      didReceiveUpdate = false;
    }
  } else {
    didReceiveUpdate = false;
  }

  //2.根据tag来创建不同的fiber 最后进入reconcileChildren函数
  switch (workInProgress.tag) {
    case IndeterminateComponent:
    // ...
    case LazyComponent:
    // ...
    case FunctionComponent:
    // ...
    case ClassComponent:
    // ...
    case HostRoot:
    // ...
    case HostComponent:
    // ...
    case HostText:
    // ...
  }
}
```

从代码中可以看到参数中有 current Fiber，也就是当前真实 dom 对应的 Fiber 树，在之前介绍 Fiber 双缓存机制中，我们知道在首次渲染时除了 rootFiber 外，current 等于 null，因为首次渲染 dom 还没构建出来，在 update 时 current 不等于 null，因为 update 时 dom 树已经存在了，所以 beginWork 函数中用 current === null 来判断是 mount 还是 update 进入不同的逻辑

- mount：根据 fiber.tag 进入不同 fiber 的创建函数，最后都会调用到 reconcileChildren 创建子 Fiber
- update：在构建 workInProgress 的时候，当满足条件时，会复用 current Fiber 来进行优化，也就是进入 bailoutOnAlreadyFinishedWork 的逻辑，能复用 didReceiveUpdate 变量是 false，复用的条件是
  1.  oldProps ==`= newProps && workInProgress.type =`== current.type 属性和 fiber 的 type 不变
  2.  !includesSomeLane(renderLanes, updateLanes) 更新的优先级是否足够，第 15 章讲解

### reconcileChildren/mountChildFibers

创建子 fiber 的过程会进入 reconcileChildren，该函数的作用是为 workInProgress fiber 节点生成它的 child fiber 即 workInProgress.child。然后继续深度优先遍历它的子节点执行相同的操作。

```js
//ReactFiberBeginWork.old.js
export function reconcileChildren(
  current: Fiber | null,
  workInProgress: Fiber,
  nextChildren: any,
  renderLanes: Lanes
) {
  if (current === null) {
    //mount时
    workInProgress.child = mountChildFibers(
      workInProgress,
      null,
      nextChildren,
      renderLanes
    );
  } else {
    //update
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren,
      renderLanes
    );
  }
}
```

reconcileChildren 会区分 mount 和 update 两种情况，进入 reconcileChildFibers 或 mountChildFibers，reconcileChildFibers 和 mountChildFibers 最终其实就是 ChildReconciler 传递不同的参数返回的函数，这个参数用来表示是否追踪副作用，在 ChildReconciler 中用 shouldTrackSideEffects 来判断是否为对应的节点打上 effectTag，例如如果一个节点需要进行插入操作，需要满足两个条件：

1. fiber.stateNode!==null 即 fiber 存在真实 dom，真实 dom 保存在 stateNode 上

2. (fiber.effectTag & Placement) !== 0 fiber 存在 Placement 的 effectTag

   ```js
   var reconcileChildFibers = ChildReconciler(true);
   var mountChildFibers = ChildReconciler(false);
   ```

   ```js
   function ChildReconciler(shouldTrackSideEffects) {
     function placeChild(newFiber, lastPlacedIndex, newIndex) {
       newFiber.index = newIndex;

       if (!shouldTrackSideEffects) {
         //是否追踪副作用
         // Noop.
         return lastPlacedIndex;
       }

       var current = newFiber.alternate;

       if (current !== null) {
         var oldIndex = current.index;

         if (oldIndex < lastPlacedIndex) {
           // This is a move.
           newFiber.flags = Placement;
           return lastPlacedIndex;
         } else {
           // This item can stay in place.
           return oldIndex;
         }
       } else {
         // This is an insertion.
         newFiber.flags = Placement;
         return lastPlacedIndex;
       }
     }
   }
   ```

在之前心智模型的介绍中，我们知道为 Fiber 打上 effectTag 之后在 commit 阶段会被执行对应 dom 的增删改，而且在 reconcileChildren 的时候，rootFiber 是存在 alternate 的，即 rootFiber 存在对应的 current Fiber，所以 rootFiber 会走 reconcileChildFibers 的逻辑，所以 shouldTrackSideEffects 等于 true 会追踪副作用，最后为 rootFiber 打上 Placement 的 effectTag，然后将 dom 一次性插入，提高性能。

```js
export const NoFlags = /*                      */ 0b0000000000000000000;
// 插入dom
export const Placement = /*                */ 0b00000000000010;
```

在源码的 ReactFiberFlags.js 文件中，用二进制位运算来判断是否存在 Placement,例如让 var a = NoFlags,如果需要在 a 上增加 Placement 的 effectTag，就只要 effectTag | Placement 就可以了

![react源码8.4](https://xiaochen1024.com/20210529110149.png)

### bailoutOnAlreadyFinishedWork

```js
//ReactFiberBeginWork.old.js
function bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes) {
  //...
  if (!includesSomeLane(renderLanes, workInProgress.childLanes)) {
    return null;
  } else {
    cloneChildFibers(current, workInProgress);

    return workInProgress.child;
  }
}
```

如果进入了 bailoutOnAlreadyFinishedWork 复用的逻辑，会判断优先级第 12 章介绍，优先级足够则进入 cloneChildFibers 否则返回 null

### completeWork

completeWork 主要工作是处理 fiber 的 props、创建 dom、创建 effectList

```js
//ReactFiberCompleteWork.old.js
function completeWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
): Fiber | null {
  const newProps = workInProgress.pendingProps;

//根据workInProgress.tag进入不同逻辑，这里我们关注HostComponent，HostComponent，其他类型之后在讲
  switch (workInProgress.tag) {
    case IndeterminateComponent:
    case LazyComponent:
    case SimpleMemoComponent:
    case HostRoot:
   //...

    case HostComponent: {
      popHostContext(workInProgress);
      const rootContainerInstance = getRootHostContainer();
      const type = workInProgress.type;

      if (current !== null && workInProgress.stateNode != null) {
        // update时
       updateHostComponent(
          current,
          workInProgress,
          type,
          newProps,
          rootContainerInstance,
        );
      } else {
        // mount时
        const currentHostContext = getHostContext();
        // 创建fiber对应的dom节点
        const instance = createInstance(
            type,
            newProps,
            rootContainerInstance,
            currentHostContext,
            workInProgress,
          );
        // 将后代dom节点插入刚创建的dom里
        appendAllChildren(instance, workInProgress, false, false);
        // dom节点赋值给fiber.stateNode
        workInProgress.stateNode = instance;

        // 处理props和updateHostComponent类似
        if (
          finalizeInitialChildren(
            instance,
            type,
            newProps,
            rootContainerInstance,
            currentHostContext,
          )
        ) {
          markUpdate(workInProgress);
        }
     }
      return null;
    }
```

从简化版的 completeWork 中可以看到，这个函数做了一下几件事

- 根据 workInProgress.tag 进入不同函数，我们以 HostComponent 举例
- update 时（除了判断`current===null外还需要判断workInProgress.stateNode===null`），调用 updateHostComponent 处理 props（包括 onClick、style、children ...），并将处理好的 props 赋值给 updatePayload,最后会保存在 workInProgress.updateQueue 上
- mount 时 调用 createInstance 创建 dom，将后代 dom 节点插入刚创建的 dom 中，调用 finalizeInitialChildren 处理 props（和 updateHostComponent 处理的逻辑类似）

之前我们有说到在 beginWork 的 mount 时，rootFiber 存在对应的 current，所以他会执行 mountChildFibers 打上 Placement 的 effectTag，在冒泡阶段也就是执行 completeWork 时，我们将子孙节点通过 appendAllChildren 挂载到新创建的 dom 节点上，最后就可以一次性将内存中的节点用 dom 原生方法反应到真实 dom 中。

在 beginWork 中我们知道有的节点被打上了 effectTag 的标记，有的没有，而在 commit 阶段时要遍历所有包含 effectTag 的 Fiber 来执行对应的增删改，那我们还需要从 Fiber 树中找到这些带 effectTag 的节点嘛，答案是不需要的，这里是以空间换时间，在执行 completeWork 的时候遇到了带 effectTag 的节点，会将这个节点加入一个叫 effectList 中,所以在 commit 阶段只要遍历 effectList 就可以了（rootFiber.firstEffect.nextEffect 就可以访问带 effectTag 的 Fiber 了）

effectList 的指针操作发生在 completeUnitOfWork 函数中，例如我们的应用是这样的

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

那么我们的操作 effectList 指针如下（这张图是操作指针过程中的图，此时遍历到了 app Fiber 节点，当遍历到 rootFiber 时，h1，p 节点会和 rootFiber 形成环状链表）

![react源码8.2](https://xiaochen1024.com/20210529105807.png)

```js
rootFiber.firstEffect === h1;

rootFiber.firstEffect.next === p;
```

形成环状链表的时候会从触发更新的节点向上合并 effectList 直到 rootFiber，这一过程发生在 completeUnitOfWork 函数中，整个函数的作用就是向上合并 effectList

```js
//ReactFiberWorkLoop.old.js
function completeUnitOfWork(unitOfWork: Fiber): void {
  let completedWork = unitOfWork;
  do {
    //...

      if (
        returnFiber !== null &&
        (returnFiber.flags & Incomplete) === NoFlags
      ) {
        if (returnFiber.firstEffect === null) {
          returnFiber.firstEffect = completedWork.firstEffect;//父节点的effectList头指针指向completedWork的effectList头指针
        }
        if (completedWork.lastEffect !== null) {
          if (returnFiber.lastEffect !== null) {
            //父节点的effectList头尾指针指向completedWork的effectList头指针
            returnFiber.lastEffect.nextEffect = completedWork.firstEffect;
          }
          //父节点头的effectList尾指针指向completedWork的effectList尾指针
          returnFiber.lastEffect = completedWork.lastEffect;
        }

        const flags = completedWork.flags;
        if (flags > PerformedWork) {
          if (returnFiber.lastEffect !== null) {
            //completedWork本身追加到returnFiber的effectList结尾
            returnFiber.lastEffect.nextEffect = completedWork;
          } else {
            //returnFiber的effectList头节点指向completedWork
            returnFiber.firstEffect = completedWork;
          }
          //returnFiber的effectList尾节点指向completedWork
          returnFiber.lastEffect = completedWork;
        }
      }
    } else {

      //...

      if (returnFiber !== null) {
        returnFiber.firstEffect = returnFiber.lastEffect = null;//重制effectList
        returnFiber.flags |= Incomplete;
      }
    }

  } while (completedWork !== null);

//...
}
```

最后生成的 fiber 树如下

![react源码8.3](https://xiaochen1024.com/20210529105811.png)

然后 commitRoot(root);进入 commit 阶段

## diff 算法

在 render 阶段**更新 Fiber 节点**时，我们会调用**reconcileChildFibers**对比**current Fiber 和 jsx 对象构建 workInProgress Fiber**，这里 current Fiber 是指当前 dom 对应的 fiber 树，jsx 是 class 组件 render 方法或者函数组件的返回值。

在`reconcileChildFibers`中会根据`newChild`的类型来进入**单节点的 diff 或者多节点 diff**

```js
//ReactChildFiber.old.js
function reconcileChildFibers(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChild: any
): Fiber | null {
  const isObject = typeof newChild === "object" && newChild !== null;

  if (isObject) {
    switch (newChild.$$typeof) {
      case REACT_ELEMENT_TYPE:
        //单一节点diff
        return placeSingleChild(
          reconcileSingleElement(
            returnFiber,
            currentFirstChild,
            newChild,
            lanes
          )
        );
    }
  }
  //...

  if (isArray(newChild)) {
    //多节点diff
    return reconcileChildrenArray(
      returnFiber,
      currentFirstChild,
      newChild,
      lanes
    );
  }

  // 删除节点
  return deleteRemainingChildren(returnFiber, currentFirstChild);
}
```

**diff 过程的主要流程如下图：**

![react源码9.5](https://xiaochen1024.com/20210529105818.png)

我们知道对比**[两颗树的复杂度本身是 O(n3)](https://zhuanlan.zhihu.com/p/344702969)**，对我们的应用来说这个是不能承受的量级，react 为了降低复杂度，**提出了三个前提：**

1. 只对**同级比较**，跨层级的 dom 不会进行复用

2. **不同类型节点生成的 dom 树不同**，此时**会直接销毁老节点及子孙节点，并新建节点**

3. 可以**通过 key 来对元素 diff 的过程提供复用的线索**，例如：

   ```js
   const a = (
     <>
       <p key="0">0</p>
       <p key="1">1</p>
     </>
   );
   const b = (
     <>
       <p key="1">1</p>
       <p key="0">0</p>
     </>
   );
   ```

   如果 a 和 b 里的元素都没有 key，因为节点的**更新前后文本节点不同**，导致他们都不能复用，所以**会销毁之前的节点**，并新建节点，但是现在**有 key**了，b 中的节点会**在老的 a 中寻找 key 相同的节点尝试复用，最后发现只是交换位置就可以完成更新**，具体对比过程后面会讲到。

### 单节点 diff

单点 diff 有如下几种情况：

- **key 和 type 相同表示**可以复用节点
- key 不同**直接标记删除节点**，然后新建节点
- key 相同 type 不同，标记删除该节点和兄弟节点，然后**新创建节点**

```js
function reconcileSingleElement(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  element: ReactElement
): Fiber {
  const key = element.key;
  let child = currentFirstChild;

  //child节点不为null执行对比
  while (child !== null) {
    // 1.比较key
    if (child.key === key) {
      // 2.比较type

      switch (child.tag) {
        //...

        default: {
          if (child.elementType === element.type) {
            // type相同则可以复用 返回复用的节点
            return existing;
          }
          // type不同跳出
          break;
        }
      }
      //key相同，type不同则把fiber及和兄弟fiber标记删除
      deleteRemainingChildren(returnFiber, child);
      break;
    } else {
      //key不同直接标记删除该节点
      deleteChild(returnFiber, child);
    }
    child = child.sibling;
  }

  //新建新Fiber
}
```

### 多节点 diff

多节点 diff 比较复杂，我们分三种情况进行讨论，其中**a 表示更新前的节点，b 表示更新后的节点**

- 属性变化

  ```js
  const a = (
    <>
      <p key="0" name="0">
        0
      </p>
      <p key="1">1</p>
    </>
  );
  const b = (
    <>
      <p key="0" name="00">
        0
      </p>
      <p key="1">1</p>
    </>
  );
  ```

- type 变化

  ```js
  const a = (
    <>
      <p key="0">0</p>
      <p key="1">1</p>
    </>
  );
  const b = (
    <>
      <div key="0">0</div>
      <p key="1">1</p>
    </>
  );
  ```

- 新增节点

  ```js
  const a = (
    <>
      <p key="0">0</p>
      <p key="1">1</p>
    </>
  );
  const b = (
    <>
      <p key="0">0</p>
      <p key="1">1</p>
      <p key="2">2</p>
    </>
  );
  ```

- 节点删除

  ```js
  const a = (
    <>
      <p key="0">0</p>
      <p key="1">1</p>
      <p key="2">2</p>
    </>
  );
  const b = (
    <>
      <p key="0">0</p>
      <p key="1">1</p>
    </>
  );
  ```

- 节点位置变化

  ```js
  const a = (
    <>
      <p key="0">0</p>
      <p key="1">1</p>
    </>
  );
  const b = (
    <>
      <p key="1">1</p>
      <p key="0">0</p>
    </>
  );
  ```

在源码中**多节点 diff 有三个 for 循环遍历**（并不意味着所有更新都有经历三个遍历，进入循环体有条件，也有条件跳出循环），第一个**遍历处理节点的更新**（包括 props 更新和 type 更新和删除），第二个遍历处理其他的情况（节点新增），其原因在于在大多数的应用中，节点更新的频率更加频繁，第三个**处理节点位置改变**

- 第一次遍历 因为**老的节点**存在于**current Fiber**中，所以它是个**链表结构**，还记得 Fiber 双缓存结构嘛，节点通过 child、return、sibling 连接，而**newChildren 存在于 jsx 当中**，所以遍历对比的时候，首先让`newChildren[i]` `oldFiber`对比，然后让 i++、nextOldFiber = oldFiber.sibling。在第一轮遍历中，会处理三种情况，其中第 1，2 两种情况会结束第一次循环

  1.  key 不同，第一次循环结束
  2.  newChildren 或者 oldFiber 遍历完，第一次循环结束
  3.  key 同 type 不同，标记 oldFiber 为 DELETION
  4.  key 相同 type 相同则可以复用

  newChildren 遍历完，oldFiber 没遍历完，在第一次遍历完成之后将 oldFiber 中没遍历完的节点标记为 DELETION，即删除的 DELETION Tag

- 第二个遍历 第二个遍历考虑三种情况

  1.  newChildren 和 oldFiber 都遍历完：多节点 diff 过程结束

  2.  newChildren 没遍历完，oldFiber 遍历完，将剩下的 newChildren 的节点标记为 Placement，即插入的 Tag

  3.  newChildren 和 oldFiber 没遍历完，则进入节点移动的逻辑

- 第三个遍历 主要逻辑在 placeChild 函数中，例如更新前节点顺序是 ABCD，更新后是 ACDB

  1.  newChild 中第一个位置的 A 和 oldFiber 第一个位置的 A，key 相同可复用，lastPlacedIndex=0

  2.  newChild 中第二个位置的 C 和 oldFiber 第二个位置的 B，key 不同跳出第一次循环，将 oldFiber 中的 BCD 保存在 map 中

  3.  newChild 中第二个位置的 C 在 oldFiber 中的 index=2 > lastPlacedIndex=0 不需要移动，lastPlacedIndex=2

  4.  newChild 中第三个位置的 D 在 oldFiber 中的 index=3 > lastPlacedIndex=2 不需要移动，lastPlacedIndex=3

  5.  newChild 中第四个位置的 B 在 oldFiber 中的 index=1 < lastPlacedIndex=3,移动到最后

  **看图更直观**

  ![react源码9.6](https://xiaochen1024.com/20210529105824.png)

  例如更新前节点顺序是 ABCD，更新后是 DABC

  1.  newChild 中第一个位置的 D 和 oldFiber 第一个位置的 A，key 不相同不可复用，将 oldFiber 中的 ABCD 保存在 map 中，lastPlacedIndex=0

  2.  newChild 中第一个位置的 D 在 oldFiber 中的 index=3 > lastPlacedIndex=0 不需要移动，lastPlacedIndex=3

      3.  newChild 中第二个位置的 A 在 oldFiber 中的 index=0 < lastPlacedIndex=3,移动到最后
      4.  newChild 中第三个位置的 B 在 oldFiber 中的 index=1 < lastPlacedIndex=3,移动到最后
      5.  newChild 中第四个位置的 C 在 oldFiber 中的 index=2 < lastPlacedIndex=3,移动到最后

  **看图更直观**

  ![react源码9.7](https://xiaochen1024.com/20210529105827.png)

  **代码如下**：

```js
//ReactChildFiber.old.js

function placeChild(newFiber, lastPlacedIndex, newIndex) {
  newFiber.index = newIndex;

  if (!shouldTrackSideEffects) {
    return lastPlacedIndex;
  }

  var current = newFiber.alternate;

  if (current !== null) {
    var oldIndex = current.index;

    if (oldIndex < lastPlacedIndex) {
      //oldIndex小于lastPlacedIndex的位置 则将节点插入到最后
      newFiber.flags = Placement;
      return lastPlacedIndex;
    } else {
      return oldIndex; //不需要移动 lastPlacedIndex = oldIndex;
    }
  } else {
    //新增插入
    newFiber.flags = Placement;
    return lastPlacedIndex;
  }
}
```

```js
//ReactChildFiber.old.js

function reconcileChildrenArray(
  returnFiber: Fiber, //父fiber节点
  currentFirstChild: Fiber | null, //childs中第一个节点
  newChildren: Array<*>, //新节点数组 也就是jsx数组
  lanes: Lanes //lane相关 第12章介绍
): Fiber | null {
  let resultingFirstChild: Fiber | null = null; //diff之后返回的第一个节点
  let previousNewFiber: Fiber | null = null; //新节点中上次对比过的节点

  let oldFiber = currentFirstChild; //正在对比的oldFiber
  let lastPlacedIndex = 0; //上次可复用的节点位置 或者oldFiber的位置
  let newIdx = 0; //新节点中对比到了的位置
  let nextOldFiber = null; //正在对比的oldFiber
  for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
    //第一次遍历
    if (oldFiber.index > newIdx) {
      //nextOldFiber赋值
      nextOldFiber = oldFiber;
      oldFiber = null;
    } else {
      nextOldFiber = oldFiber.sibling;
    }
    const newFiber = updateSlot(
      //更新节点，如果key不同则newFiber=null
      returnFiber,
      oldFiber,
      newChildren[newIdx],
      lanes
    );
    if (newFiber === null) {
      if (oldFiber === null) {
        oldFiber = nextOldFiber;
      }
      break; //跳出第一次遍历
    }
    if (shouldTrackSideEffects) {
      //检查shouldTrackSideEffects
      if (oldFiber && newFiber.alternate === null) {
        deleteChild(returnFiber, oldFiber);
      }
    }
    lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx); //标记节点插入
    if (previousNewFiber === null) {
      resultingFirstChild = newFiber;
    } else {
      previousNewFiber.sibling = newFiber;
    }
    previousNewFiber = newFiber;
    oldFiber = nextOldFiber;
  }

  if (newIdx === newChildren.length) {
    deleteRemainingChildren(returnFiber, oldFiber); //将oldFiber中没遍历完的节点标记为DELETION
    return resultingFirstChild;
  }

  if (oldFiber === null) {
    for (; newIdx < newChildren.length; newIdx++) {
      //第2次遍历
      const newFiber = createChild(returnFiber, newChildren[newIdx], lanes);
      if (newFiber === null) {
        continue;
      }
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx); //插入新增节点
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
    }
    return resultingFirstChild;
  }

  // 将剩下的oldFiber加入map中
  const existingChildren = mapRemainingChildren(returnFiber, oldFiber);

  for (; newIdx < newChildren.length; newIdx++) {
    //第三次循环 处理节点移动
    const newFiber = updateFromMap(
      existingChildren,
      returnFiber,
      newIdx,
      newChildren[newIdx],
      lanes
    );
    if (newFiber !== null) {
      if (shouldTrackSideEffects) {
        if (newFiber.alternate !== null) {
          existingChildren.delete(
            //删除找到的节点
            newFiber.key === null ? newIdx : newFiber.key
          );
        }
      }
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx); //标记为插入的逻辑
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
    }
  }

  if (shouldTrackSideEffects) {
    //删除existingChildren中剩下的节点
    existingChildren.forEach((child) => deleteChild(returnFiber, child));
  }

  return resultingFirstChild;
}
```

## commit 阶段

在 render 阶段的末尾会调用 commitRoot(root);进入 commit 阶段，这里的 root 指的就是 fiberRoot，然后会遍历 render 阶段生成的 effectList，effectList 上的 Fiber 节点保存着对应的 props 变化。之后会遍历 effectList 进行对应的 dom 操作和生命周期、hooks 回调或销毁函数，各个函数做的事情如下

![react源码10.1](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs20210529105833.png)

在 commitRoot 函数中其实是调度了 commitRootImpl 函数

```js
//ReactFiberWorkLoop.old.js
function commitRoot(root) {
  var renderPriorityLevel = getCurrentPriorityLevel();
  runWithPriority$1(
    ImmediatePriority$1,
    commitRootImpl.bind(null, root, renderPriorityLevel)
  );
  return null;
}
```

在 commitRootImpl 的函数中主要分三个部分：

- commit 阶段前置工作

  1. 调用 flushPassiveEffects 执行完所有 effect 的任务

  2. 初始化相关变量

  3. 赋值 firstEffect 给后面遍历 effectList 用

     ```js
     //ReactFiberWorkLoop.old.js
     do {
       // 调用flushPassiveEffects执行完所有effect的任务
       flushPassiveEffects();
     } while (rootWithPendingPassiveEffects !== null);

     //...

     // 重置变量 finishedWork指rooFiber
     root.finishedWork = null;
     //重置优先级
     root.finishedLanes = NoLanes;

     // Scheduler回调函数重置
     root.callbackNode = null;
     root.callbackId = NoLanes;

     // 重置全局变量
     if (root === workInProgressRoot) {
       workInProgressRoot = null;
       workInProgress = null;
       workInProgressRootRenderLanes = NoLanes;
     } else {
     }

     //rootFiber可能会有新的副作用 将它也加入到effectLis
     let firstEffect;
     if (finishedWork.effectTag > PerformedWork) {
       if (finishedWork.lastEffect !== null) {
         finishedWork.lastEffect.nextEffect = finishedWork;
         firstEffect = finishedWork.firstEffect;
       } else {
         firstEffect = finishedWork;
       }
     } else {
       firstEffect = finishedWork.firstEffect;
     }
     ```

- mutation 阶段

  遍历 effectList 分别执行三个方法 commitBeforeMutationEffects、commitMutationEffects、commitLayoutEffects 执行对应的 dom 操作和生命周期

  在介绍双缓存 Fiber 树的时候，我们在构建完 workInProgress Fiber 树之后会将 fiberRoot 的 current 指向 workInProgress Fiber，让 workInProgress Fiber 成为 current，这个步骤发生在 commitMutationEffects 函数执行之后，commitLayoutEffects 之前，因为 componentWillUnmount 发生在 commitMutationEffects 函数中，这时还可以获取之前的 Update，而 componentDidMount`和`componentDidUpdate 会在 commitLayoutEffects 中执行，这时已经可以获取更新后的真实 dom 了

  ```js
  function commitRootImpl(root, renderPriorityLevel) {
    //...
    do {
      //...
      commitBeforeMutationEffects();
    } while (nextEffect !== null);

    do {
      //...
      commitMutationEffects(root, renderPriorityLevel); //commitMutationEffects
    } while (nextEffect !== null);

    root.current = finishedWork; //切换current Fiber树

    do {
      //...
      commitLayoutEffects(root, lanes); //commitLayoutEffects
    } while (nextEffect !== null);
    //...
  }
  ```

- mutation 后

  1. 根据 rootDoesHavePassiveEffects 赋值相关变量

  2. 执行 flushSyncCallbackQueue 处理 componentDidMount 等生命周期或者 useLayoutEffect 等同步任务

     ```js
     const rootDidHavePassiveEffects = rootDoesHavePassiveEffects;

     // 根据rootDoesHavePassiveEffects赋值相关变量
     if (rootDoesHavePassiveEffects) {
       rootDoesHavePassiveEffects = false;
       rootWithPendingPassiveEffects = root;
       pendingPassiveEffectsLanes = lanes;
       pendingPassiveEffectsRenderPriority = renderPriorityLevel;
     } else {
     }
     //...

     // 确保被调度
     ensureRootIsScheduled(root, now());

     // ...

     // 执行flushSyncCallbackQueue处理componentDidMount等生命周期或者useLayoutEffect等同步任务
     flushSyncCallbackQueue();

     return null;
     ```

现在让我们来看看 mutation 阶段的三个函数分别做了什么事情

- **commitBeforeMutationEffects** 该函数主要做了如下两件事

  1. 执行 getSnapshotBeforeUpdate 在源码中 commitBeforeMutationEffectOnFiber 对应的函数是 commitBeforeMutationLifeCycles 在该函数中会调用 getSnapshotBeforeUpdate，现在我们知道了 getSnapshotBeforeUpdate 是在 mutation 阶段中的 commitBeforeMutationEffect 函数中执行的，而 commit 阶段是同步的，所以 getSnapshotBeforeUpdate 也同步执行

     ```js
     function commitBeforeMutationLifeCycles(
       current: Fiber | null,
       finishedWork: Fiber,
     ): void {
       switch (finishedWork.tag) {
     		//...
         case ClassComponent: {
           if const instance = finishedWork.stateNode;
               const snapshot = instance.getSnapshotBeforeUpdate(//getSnapshotBeforeUpdate
                 finishedWork.elementType === finishedWork.type
                   ? prevProps
                   : resolveDefaultProps(finishedWork.type, prevProps),
                 prevState,
               );
             }
     }
     ```

  2. 调度 useEffect

     在 flushPassiveEffects 函数中调用 flushPassiveEffectsImpl 遍历 pendingPassiveHookEffectsUnmount 和 pendingPassiveHookEffectsMount，执行对应的 effect 回调和销毁函数，而这两个数组是在 commitLayoutEffects 函数中赋值的（待会就会讲到），mutation 后 effectList 赋值给 rootWithPendingPassiveEffects，然后 scheduleCallback 调度执行 flushPassiveEffects

     ```js
     function flushPassiveEffectsImpl() {
       if (rootWithPendingPassiveEffects === null) {
         //在mutation后变成了root
         return false;
       }
       const unmountEffects = pendingPassiveHookEffectsUnmount;
       pendingPassiveHookEffectsUnmount = []; //useEffect的回调函数
       for (let i = 0; i < unmountEffects.length; i += 2) {
         const effect = ((unmountEffects[i]: any): HookEffect);
         //...
         const destroy = effect.destroy;
         destroy();
       }

       const mountEffects = pendingPassiveHookEffectsMount; //useEffect的销毁函数
       pendingPassiveHookEffectsMount = [];
       for (let i = 0; i < mountEffects.length; i += 2) {
         const effect = ((unmountEffects[i]: any): HookEffect);
         //...
         const create = effect.create;
         effect.destroy = create();
       }
     }
     ```

     componentDidUpdate 或 componentDidMount 会在 commit 阶段同步执行(这个后面会讲到)，而 useEffect 会在 commit 阶段异步调度，所以适用于数据请求等副作用的处理

     > 注意，和在 render 阶段的 fiber node 会打上 Placement 等标签一样，useEffect 或 useLayoutEffect 也有对应的 effect Tag，在源码中对应 export const Passive = /\* \*/ 0b0000000001000000000;

     ```js
     function commitBeforeMutationEffects() {
       while (nextEffect !== null) {
         const current = nextEffect.alternate;
         const effectTag = nextEffect.effectTag;

         // 在commitBeforeMutationEffectOnFiber函数中会执行getSnapshotBeforeUpdate
         if ((effectTag & Snapshot) !== NoEffect) {
           commitBeforeMutationEffectOnFiber(current, nextEffect);
         }

         // scheduleCallback调度useEffect
         if ((effectTag & Passive) !== NoEffect) {
           if (!rootDoesHavePassiveEffects) {
             rootDoesHavePassiveEffects = true;
             scheduleCallback(NormalSchedulerPriority, () => {
               flushPassiveEffects();
               return null;
             });
           }
         }
         nextEffect = nextEffect.nextEffect; //遍历effectList
       }
     }
     ```

- **commitMutationEffects** commitMutationEffects 主要做了如下几件事

  1. 调用 commitDetachRef 解绑 ref（第 11 章 hook 会讲解）

  2. 根据 effectTag 执行对应的 dom 操作

  3. useLayoutEffect 销毁函数在 UpdateTag 时执行

     ```js
     function commitMutationEffects(root: FiberRoot, renderPriorityLevel) {
       //遍历effectList
       while (nextEffect !== null) {
         const effectTag = nextEffect.effectTag;
         // 调用commitDetachRef解绑ref
         if (effectTag & Ref) {
           const current = nextEffect.alternate;
           if (current !== null) {
             commitDetachRef(current);
           }
         }

         // 根据effectTag执行对应的dom操作
         const primaryEffectTag =
           effectTag & (Placement | Update | Deletion | Hydrating);
         switch (primaryEffectTag) {
           // 插入dom
           case Placement: {
             commitPlacement(nextEffect);
             nextEffect.effectTag &= ~Placement;
             break;
           }
           // 插入更新dom
           case PlacementAndUpdate: {
             // 插入
             commitPlacement(nextEffect);
             nextEffect.effectTag &= ~Placement;
             // 更新
             const current = nextEffect.alternate;
             commitWork(current, nextEffect);
             break;
           }
           //...
           // 更新dom
           case Update: {
             const current = nextEffect.alternate;
             commitWork(current, nextEffect);
             break;
           }
           // 删除dom
           case Deletion: {
             commitDeletion(root, nextEffect, renderPriorityLevel);
             break;
           }
         }

         nextEffect = nextEffect.nextEffect;
       }
     }
     ```

     现在让我们来看看操作 dom 的这几个函数

     **commitPlacement 插入节点：**

     简化后的代码很清晰，找到该节点最近的 parent 节点和兄弟节点，然后根据 isContainer 来判断是插入到兄弟节点前还是 append 到 parent 节点后

     ```js
     unction commitPlacement(finishedWork: Fiber): void {
     	//...
       const parentFiber = getHostParentFiber(finishedWork);//找到最近的parent

       let parent;
       let isContainer;
       const parentStateNode = parentFiber.stateNode;
       switch (parentFiber.tag) {
         case HostComponent:
           parent = parentStateNode;
           isContainer = false;
           break;
         //...

       }
       const before = getHostSibling(finishedWork);//找兄弟节点
       if (isContainer) {
         insertOrAppendPlacementNodeIntoContainer(finishedWork, before, parent);
       } else {
         insertOrAppendPlacementNode(finishedWork, before, parent);
       }
     }
     ```

     **commitWork 更新节点：**

     在简化后的源码中可以看到

     如果 fiber 的 tag 是 SimpleMemoComponent 会调用 commitHookEffectListUnmount 执行对应的 hook 的销毁函数，可以看到传入的参数是 HookLayout | HookHasEffect，也就是说执行 useLayoutEffect 的销毁函数。

     如果是 HostComponent，那么调用 commitUpdate，commitUpdate 最后会调用 updateDOMProperties 处理对应 Update 的 dom 操作

     ```js
     function commitWork(current: Fiber | null, finishedWork: Fiber): void {
       if (!supportsMutation) {
         switch (finishedWork.tag) {
           //...
           case SimpleMemoComponent: {
             commitHookEffectListUnmount(
               HookLayout | HookHasEffect,
               finishedWork
             );
           }
           //...
         }
       }

       switch (finishedWork.tag) {
         //...
         case HostComponent:
           {
             //...
             commitUpdate(
               instance,
               updatePayload,
               type,
               oldProps,
               newProps,
               finishedWork
             );
           }
           return;
       }
     }
     ```

     ```js
     function updateDOMProperties(
       domElement: Element,
       updatePayload: Array<any>,
       wasCustomComponentTag: boolean,
       isCustomComponentTag: boolean
     ): void {
       // TODO: Handle wasCustomComponentTag
       for (let i = 0; i < updatePayload.length; i += 2) {
         const propKey = updatePayload[i];
         const propValue = updatePayload[i + 1];
         if (propKey === STYLE) {
           setValueForStyles(domElement, propValue);
         } else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
           setInnerHTML(domElement, propValue);
         } else if (propKey === CHILDREN) {
           setTextContent(domElement, propValue);
         } else {
           setValueForProperty(
             domElement,
             propKey,
             propValue,
             isCustomComponentTag
           );
         }
       }
     }
     ```

     **commitDeletion 删除节点:** 如果是 ClassComponent 会执行 componentWillUnmount，删除 fiber，如果是 FunctionComponent 会删除 ref、并执行 useEffect 的销毁函数，具体可在源码中查看 unmountHostComponents、commitNestedUnmounts、detachFiberMutation 这几个函数

     ```js
     function commitDeletion(
       finishedRoot: FiberRoot,
       current: Fiber,
       renderPriorityLevel: ReactPriorityLevel
     ): void {
       if (supportsMutation) {
         // Recursively delete all host nodes from the parent.
         // Detach refs and call componentWillUnmount() on the whole subtree.
         unmountHostComponents(finishedRoot, current, renderPriorityLevel);
       } else {
         // Detach refs and call componentWillUnmount() on the whole subtree.
         commitNestedUnmounts(finishedRoot, current, renderPriorityLevel);
       }
       const alternate = current.alternate;
       detachFiberMutation(current);
       if (alternate !== null) {
         detachFiberMutation(alternate);
       }
     }
     ```

- **commitLayoutEffects** 在 commitMutationEffects 之后所有的 dom 操作都已经完成，可以访问 dom 了，commitLayoutEffects 主要做了

  1. 调用 commitLayoutEffectOnFiber 执行相关生命周期函数或者 hook 相关 callback

  2. 执行 commitAttachRef 为 ref 赋值

     ```js
     function commitLayoutEffects(root: FiberRoot, committedLanes: Lanes) {
       while (nextEffect !== null) {
         const effectTag = nextEffect.effectTag;

         // 调用commitLayoutEffectOnFiber执行生命周期和hook
         if (effectTag & (Update | Callback)) {
           const current = nextEffect.alternate;
           commitLayoutEffectOnFiber(root, current, nextEffect, committedLanes);
         }

         // ref赋值
         if (effectTag & Ref) {
           commitAttachRef(nextEffect);
         }

         nextEffect = nextEffect.nextEffect;
       }
     }
     ```

     **commitLayoutEffectOnFiber:**

     在源码中 commitLayoutEffectOnFiber 函数的别名是 commitLifeCycles，在简化后的代码中可以看到，commitLifeCycles 会判断 fiber 的类型，SimpleMemoComponent 会执行 useLayoutEffect 的回调，然后调度 useEffect，ClassComponent 会执行 componentDidMount 或者 componentDidUpdate，this.setState 第二个参数也会执行，HostRoot 会执行 ReactDOM.render 函数的第三个参数，例如

     ```js
     ReactDOM.render(<App />, document.querySelector("#root"), function () {
       console.log("root mount");
     });
     ```

     现在可以知道 useLayoutEffect 是在 commit 阶段同步执行，useEffect 会在 commit 阶段异步调度

     ```js
     function commitLifeCycles(
       finishedRoot: FiberRoot,
       current: Fiber | null,
       finishedWork: Fiber,
       committedLanes: Lanes
     ): void {
       switch (finishedWork.tag) {
         case SimpleMemoComponent: {
           // 此函数会调用useLayoutEffect的回调
           commitHookEffectListMount(HookLayout | HookHasEffect, finishedWork);
           // 向pendingPassiveHookEffectsUnmount和pendingPassiveHookEffectsMount中push effect						// 并且调度它们
           schedulePassiveEffects(finishedWork);
         }
         case ClassComponent: {
           //条件判断...
           instance.componentDidMount();
           //条件判断...
           instance.componentDidUpdate(
             //update 在layout期间同步执行
             prevProps,
             prevState,
             instance.__reactInternalSnapshotBeforeUpdate
           );
         }

         case HostRoot: {
           commitUpdateQueue(finishedWork, updateQueue, instance); //render第三个参数
         }
       }
     }
     ```

     在 schedulePassiveEffects 中会将 useEffect 的销毁和回调函数 push 到 pendingPassiveHookEffectsUnmount 和 pendingPassiveHookEffectsMount 中

     ```js
     function schedulePassiveEffects(finishedWork: Fiber) {
       const updateQueue: FunctionComponentUpdateQueue | null =
         (finishedWork.updateQueue: any);
       const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
       if (lastEffect !== null) {
         const firstEffect = lastEffect.next;
         let effect = firstEffect;
         do {
           const { next, tag } = effect;
           if (
             (tag & HookPassive) !== NoHookEffect &&
             (tag & HookHasEffect) !== NoHookEffect
           ) {
             //push useEffect的销毁函数并且加入调度
             enqueuePendingPassiveHookEffectUnmount(finishedWork, effect);
             //push useEffect的回调函数并且加入调度
             enqueuePendingPassiveHookEffectMount(finishedWork, effect);
           }
           effect = next;
         } while (effect !== firstEffect);
       }
     }
     ```

     **commitAttachRef:**

     commitAttachRef 中会判断 ref 的类型，执行 ref 或者给 ref.current 赋值

     ```js
     function commitAttachRef(finishedWork: Fiber) {
       const ref = finishedWork.ref;
       if (ref !== null) {
         const instance = finishedWork.stateNode;

         let instanceToUse;
         switch (finishedWork.tag) {
           case HostComponent:
             instanceToUse = getPublicInstance(instance);
             break;
           default:
             instanceToUse = instance;
         }

         if (typeof ref === "function") {
           // 执行ref回调
           ref(instanceToUse);
         } else {
           // 如果是值的类型则赋值给ref.current
           ref.current = instanceToUse;
         }
       }
     }
     ```

## 生命周期调用顺序

### 各阶段生命周期执行情况

函数组件 hooks 的周期会在 hooks 章节讲解，这一章的使命周期主要针对类组件，各阶段生命周期执行情况看下图：

![react源码11.1](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs20210529105841.png)

- render 阶段：
  1. mount 时：组件首先会经历 constructor、getDerivedStateFromProps、componnetWillMount、render
  2. update 时：组件首先会经历 componentWillReceiveProps、getDerivedStateFromProps、shouldComponentUpdate、render
  3. error 时：会调用 getDerivedStateFromError
- commit 阶段
  1. mount 时：组件会经历 componnetDidMount
  2. update 时：组件会调用 getSnapshotBeforeUpdate、componnetDidUpdate
  3. unMount 时：调用 componnetWillUnmount
  4. error 时：调用 componnetDidCatch

其中红色的部分不建议使用，需要注意的是 commit 阶段生命周期在 mutation 各个子阶段的执行顺序，可以复习上一章

接下来根据一个例子来讲解在 mount 时和 update 时更新的具体顺序：

![react源码11.2](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs20210529105844.png)

![react源码11.3](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs20210529105850.png)

- mount 时：首先会按照深度优先的方式，依次构建 wip Fiber 节点然后切换成 current Fiber，在 render 阶段会依次执行各个节点的 constructor、getDerivedStateFromProps/componnetWillMount、render，在 commit 阶段，也就是深度优先遍历向上冒泡的时候依次执行节点的 componnetDidMount
- update 时：同样会深度优先构建 wip Fiber 树，在构建的过程中会 diff 子节点，在 render 阶段，如果返现有节点的变化，例如上图的 c2，那就标记这个节点 Update Flag，然后执行 getDerivedStateFromProps 和 render，在 commit 阶段会依次执行节点的 getSnapshotBeforeUpdate、componnetDidUpdate

## 状态更新流程

### setState&forceUpdate

在 react 中触发状态更新的几种方式：

- ReactDOM.render
- this.setState
- this.forceUpdate
- useState
- useReducer

我们重点看下重点看下 this.setState 和 this.forceUpdate，hook 在第 13 章讲

1. this.setState 内调用 this.updater.enqueueSetState，主要是将 update 加入 updateQueue 中

   ```js
   //ReactBaseClasses.js
   Component.prototype.setState = function (partialState, callback) {
     if (
       !(
         typeof partialState === "object" ||
         typeof partialState === "function" ||
         partialState == null
       )
     ) {
       {
         throw Error(
           "setState(...): takes an object of state variables to update or a function which returns an object of state variables."
         );
       }
     }
     this.updater.enqueueSetState(this, partialState, callback, "setState");
   };
   ```

   ```js
   //ReactFiberClassComponent.old.js
   enqueueSetState(inst, payload, callback) {
     const fiber = getInstance(inst);//fiber实例

     const eventTime = requestEventTime();
     const suspenseConfig = requestCurrentSuspenseConfig();

     const lane = requestUpdateLane(fiber, suspenseConfig);//优先级

     const update = createUpdate(eventTime, lane, suspenseConfig);//创建update

     update.payload = payload;

     if (callback !== undefined && callback !== null) {  //赋值回调
       update.callback = callback;
     }

     enqueueUpdate(fiber, update);//update加入updateQueue
     scheduleUpdateOnFiber(fiber, lane, eventTime);//调度update
   }
   ```

   enqueueUpdate 用来将 update 加入 updateQueue 队列

   ```js
   //ReactUpdateQueue.old.js
   export function enqueueUpdate<State>(fiber: Fiber, update: Update<State>) {
     const updateQueue = fiber.updateQueue;
     if (updateQueue === null) {
       return;
     }

     const sharedQueue: SharedQueue<State> = (updateQueue: any).shared;
     const pending = sharedQueue.pending;
     if (pending === null) {
       update.next = update; //与自己形成环状链表
     } else {
       update.next = pending.next; //加入链表的结尾
       pending.next = update;
     }
     sharedQueue.pending = update;
   }
   ```

   ![react源码12.6](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs20210529105855.png)

2. this.forceUpdate 和 this.setState 一样，只是会让 tag 赋值 ForceUpdate

   ```js
   //ReactBaseClasses.js
   Component.prototype.forceUpdate = function (callback) {
     this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
   };
   ```

   ```js
   //ReactFiberClassComponent.old.js
   enqueueForceUpdate(inst, callback) {
       const fiber = getInstance(inst);
       const eventTime = requestEventTime();
       const suspenseConfig = requestCurrentSuspenseConfig();
       const lane = requestUpdateLane(fiber, suspenseConfig);

       const update = createUpdate(eventTime, lane, suspenseConfig);

       //tag赋值ForceUpdate
       update.tag = ForceUpdate;

       if (callback !== undefined && callback !== null) {
         update.callback = callback;
       }

       enqueueUpdate(fiber, update);
       scheduleUpdateOnFiber(fiber, lane, eventTime);

     },
   };
   ```

   如果标记 ForceUpdate，render 阶段组件更新会根据 checkHasForceUpdateAfterProcessing，和 checkShouldComponentUpdate 来判断，如果 Update 的 tag 是 ForceUpdate，则 checkHasForceUpdateAfterProcessing 为 true，当组件是 PureComponent 时，checkShouldComponentUpdate 会浅比较 state 和 props，所以当使用 this.forceUpdate 一定会更新

   ```js
   //ReactFiberClassComponent.old.js
   const shouldUpdate =
     checkHasForceUpdateAfterProcessing() ||
     checkShouldComponentUpdate(
       workInProgress,
       ctor,
       oldProps,
       newProps,
       oldState,
       newState,
       nextContext
     );
   ```

   **状态更新整体流程**

   ![react源码12.1](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs20210529105900.png)

### Update&updateQueue

HostRoot 或者 ClassComponent 触发更新后，会在函数 createUpdate 中创建 update，并在后面的 render 阶段的 beginWork 中计算 Update。FunctionComponent 对应的 Update 在第 11 章讲，它和 HostRoot 或者 ClassComponent 的 Update 结构有些不一样

```js
//ReactUpdateQueue.old.js
export function createUpdate(eventTime: number, lane: Lane): Update<*> {
  //创建update
  const update: Update<*> = {
    eventTime,
    lane,

    tag: UpdateState,
    payload: null,
    callback: null,

    next: null,
  };
  return update;
}
```

**我们主要关注这些参数：**

- lane：优先级（第 12 章讲）
- tag：更新的类型，例如 UpdateState、ReplaceState
- payload：ClassComponent 的 payload 是 setState 第一个参数，HostRoot 的 payload 是 ReactDOM.render 的第一个参数
- callback：setState 的第二个参数
- next：连接下一个 Update 形成一个链表，例如同时触发多个 setState 时会形成多个 Update，然后用 next 连接

对于 HostRoot 或者 ClassComponent 会在 mount 的时候使用 initializeUpdateQueue 创建 updateQueue，然后将 updateQueue 挂载到 fiber 节点上

```js
//ReactUpdateQueue.old.js
export function initializeUpdateQueue<State>(fiber: Fiber): void {
  const queue: UpdateQueue<State> = {
    baseState: fiber.memoizedState,
    firstBaseUpdate: null,
    lastBaseUpdate: null,
    shared: {
      pending: null,
    },
    effects: null,
  };
  fiber.updateQueue = queue;
}
```

- baseState：初始 state，后面会基于这个 state，根据 Update 计算新的 state
- firstBaseUpdate、lastBaseUpdate：Update 形成的链表的头和尾
- shared.pending：新产生的 update 会以单向环状链表保存在 shared.pending 上，计算 state 的时候会剪开这个环状链表，并且链接在 lastBaseUpdate 后
- effects：calback 不为 null 的 update

### 从触发更新的 fiber 节点向上遍历到 rootFiber

在 markUpdateLaneFromFiberToRoot 函数中会从触发更新的节点开始向上遍历到 rootFiber，遍历的过程会处理节点的优先级（第 15 章讲）

```js
//ReactFiberWorkLoop.old.js
function markUpdateLaneFromFiberToRoot(
  sourceFiber: Fiber,
  lane: Lane
): FiberRoot | null {
  sourceFiber.lanes = mergeLanes(sourceFiber.lanes, lane);
  let alternate = sourceFiber.alternate;
  if (alternate !== null) {
    alternate.lanes = mergeLanes(alternate.lanes, lane);
  }
  let node = sourceFiber;
  let parent = sourceFiber.return;
  while (parent !== null) {
    //从触发更新的节点开始向上遍历到rootFiber
    parent.childLanes = mergeLanes(parent.childLanes, lane); //合并childLanes优先级
    alternate = parent.alternate;
    if (alternate !== null) {
      alternate.childLanes = mergeLanes(alternate.childLanes, lane);
    } else {
    }
    node = parent;
    parent = parent.return;
  }
  if (node.tag === HostRoot) {
    const root: FiberRoot = node.stateNode;
    return root;
  } else {
    return null;
  }
}
```

例如 B 节点触发更新，B 节点被被标记为 normal 的 update，也就是图中的 u1，然后向上遍历到根节点，在根节点上打上一个 normal 的 update，如果此时 B 节点又触发了一个 userBlocking 的 Update，同样会向上遍历到根节点，在根节点上打上一个 userBlocking 的 update。

如果当前根节点更新的优先级是 normal，u1、u2 都参与状态的计算，如果当前根节点更新的优先级是 userBlocking，则只有 u2 参与计算

![react源码12.5](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs20210529105905.png)

### 调度

在 ensureRootIsScheduled 中，scheduleCallback 会以一个优先级调度 render 阶段的开始函数 performSyncWorkOnRoot 或者 performConcurrentWorkOnRoot

```js
//ReactFiberWorkLoop.old.js
if (newCallbackPriority === SyncLanePriority) {
  // 任务已经过期，需要同步执行render阶段
  newCallbackNode = scheduleSyncCallback(
    performSyncWorkOnRoot.bind(null, root)
  );
} else {
  // 根据任务优先级异步执行render阶段
  var schedulerPriorityLevel =
    lanePriorityToSchedulerPriority(newCallbackPriority);
  newCallbackNode = scheduleCallback(
    schedulerPriorityLevel,
    performConcurrentWorkOnRoot.bind(null, root)
  );
}
```

### 状态更新

classComponent 状态计算发生在 processUpdateQueue 函数中，涉及很多链表操作，看图更加直白

- 初始时 fiber.updateQueue 单链表上有 firstBaseUpdate（update1）和 lastBaseUpdate（update2），以 next 连接

- fiber.updateQueue.shared 环状链表上有 update3 和 update4，以 next 连接互相连接

- 计算 state 时，先将 fiber.updateQueue.shared 环状链表‘剪开’，形成单链表，连接在 fiber.updateQueue 后面形成 baseUpdate

- 然后遍历按这条链表，根据 baseState 计算出 memoizedState

  ![react源码12.2](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs20210529105911.png)

### 带优先级的状态更新

类似 git 提交，这里的 c3 意味着高优先级的任务，比如用户出发的事件，数据请求，同步执行的代码等。

- 通过 ReactDOM.render 创建的应用没有优先级的概念，类比 git 提交，相当于先 commit，然后提交 c3![react源码12.3](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs20210529105915.png)

- 在 concurrent 模式下，类似 git rebase，先暂存之前的代码，在 master 上开发，然后 rebase 到之前的分支上

  优先级是由 Scheduler 来调度的，这里我们只关心状态计算时的优先级排序，也就是在函数 processUpdateQueue 中发生的计算，例如初始时有 c1-c4 四个 update，其中 c1 和 c3 为高优先级

  1. 在第一次 render 的时候，低优先级的 update 会跳过，所以只有 c1 和 c3 加入状态的计算
  2. 在第二次 render 的时候，会以第一次中跳过的 update（c2）之前的 update（c1）作为 baseState，跳过的 update 和之后的 update（c2，c3，c4）作为 baseUpdate 重新计算

  在在 concurrent 模式下，componentWillMount 可能会执行多次，变现和之前的版本不一致

  > 注意，fiber.updateQueue.shared 会同时存在于 workInprogress Fiber 和 current Fiber，目的是为了防止高优先级打断正在进行的计算而导致状态丢失，这段代码也是发生在 processUpdateQueue 中

![react源码12.4](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs20210529105918.png)

看 demo_8 的优先级

现在来看下计算状态的函数

```js
//ReactUpdateQueue.old.js
export function processUpdateQueue<State>(
  workInProgress: Fiber,
  props: any,
  instance: any,
  renderLanes: Lanes
): void {
  const queue: UpdateQueue<State> = (workInProgress.updateQueue: any);
  hasForceUpdate = false;

  let firstBaseUpdate = queue.firstBaseUpdate; //updateQueue的第一个Update
  let lastBaseUpdate = queue.lastBaseUpdate; //updateQueue的最后一个Update
  let pendingQueue = queue.shared.pending; //未计算的pendingQueue

  if (pendingQueue !== null) {
    queue.shared.pending = null;
    const lastPendingUpdate = pendingQueue; //未计算的ppendingQueue的最后一个update
    const firstPendingUpdate = lastPendingUpdate.next; //未计算的pendingQueue的第一个update
    lastPendingUpdate.next = null; //剪开环状链表
    if (lastBaseUpdate === null) {
      //将pendingQueue加入到updateQueue
      firstBaseUpdate = firstPendingUpdate;
    } else {
      lastBaseUpdate.next = firstPendingUpdate;
    }
    lastBaseUpdate = lastPendingUpdate;

    const current = workInProgress.alternate; //current上做同样的操作
    if (current !== null) {
      const currentQueue: UpdateQueue<State> = (current.updateQueue: any);
      const currentLastBaseUpdate = currentQueue.lastBaseUpdate;
      if (currentLastBaseUpdate !== lastBaseUpdate) {
        if (currentLastBaseUpdate === null) {
          currentQueue.firstBaseUpdate = firstPendingUpdate;
        } else {
          currentLastBaseUpdate.next = firstPendingUpdate;
        }
        currentQueue.lastBaseUpdate = lastPendingUpdate;
      }
    }
  }

  if (firstBaseUpdate !== null) {
    let newState = queue.baseState;

    let newLanes = NoLanes;

    let newBaseState = null;
    let newFirstBaseUpdate = null;
    let newLastBaseUpdate = null;

    let update = firstBaseUpdate;
    do {
      const updateLane = update.lane;
      const updateEventTime = update.eventTime;
      if (!isSubsetOfLanes(renderLanes, updateLane)) {
        //判断优先级是够足够
        const clone: Update<State> = {
          //优先级不够 跳过当前update
          eventTime: updateEventTime,
          lane: updateLane,

          tag: update.tag,
          payload: update.payload,
          callback: update.callback,

          next: null,
        };
        if (newLastBaseUpdate === null) {
          //保存跳过的update
          newFirstBaseUpdate = newLastBaseUpdate = clone;
          newBaseState = newState;
        } else {
          newLastBaseUpdate = newLastBaseUpdate.next = clone;
        }
        newLanes = mergeLanes(newLanes, updateLane);
      } else {
        //直到newLastBaseUpdate为null才不会计算，防止updateQueue没计算完
        if (newLastBaseUpdate !== null) {
          const clone: Update<State> = {
            eventTime: updateEventTime,
            lane: NoLane,

            tag: update.tag,
            payload: update.payload,
            callback: update.callback,

            next: null,
          };
          newLastBaseUpdate = newLastBaseUpdate.next = clone;
        }

        newState = getStateFromUpdate(
          //根据updateQueue计算state
          workInProgress,
          queue,
          update,
          newState,
          props,
          instance
        );
        const callback = update.callback;
        if (callback !== null) {
          workInProgress.flags |= Callback; //Callback flag
          const effects = queue.effects;
          if (effects === null) {
            queue.effects = [update];
          } else {
            effects.push(update);
          }
        }
      }
      update = update.next; //下一个update
      if (update === null) {
        //重置updateQueue
        pendingQueue = queue.shared.pending;
        if (pendingQueue === null) {
          break;
        } else {
          const lastPendingUpdate = pendingQueue;

          const firstPendingUpdate =
            ((lastPendingUpdate.next: any): Update<State>);
          lastPendingUpdate.next = null;
          update = firstPendingUpdate;
          queue.lastBaseUpdate = lastPendingUpdate;
          queue.shared.pending = null;
        }
      }
    } while (true);

    if (newLastBaseUpdate === null) {
      newBaseState = newState;
    }

    queue.baseState = ((newBaseState: any): State); //新的state
    queue.firstBaseUpdate = newFirstBaseUpdate; //新的第一个update
    queue.lastBaseUpdate = newLastBaseUpdate; //新的最后一个update

    markSkippedUpdateLanes(newLanes);
    workInProgress.lanes = newLanes;
    workInProgress.memoizedState = newState;
  }

  //...
}
```

## hooks 源码

### hook 调用入口

在 hook 源码中 hook 存在于 Dispatcher 中，Dispatcher 就是一个对象，不同 hook 调用的函数不一样，全局变量 ReactCurrentDispatcher.current 会根据是 mount 还是 update 赋值为 HooksDispatcherOnMount 或 HooksDispatcherOnUpdate

```js
ReactCurrentDispatcher.current =
  current === null || current.memoizedState === null //mount or update
    ? HooksDispatcherOnMount
    : HooksDispatcherOnUpdate;
const HooksDispatcherOnMount: Dispatcher = {
  //mount时
  useCallback: mountCallback,
  useContext: readContext,
  useEffect: mountEffect,
  useImperativeHandle: mountImperativeHandle,
  useLayoutEffect: mountLayoutEffect,
  useMemo: mountMemo,
  useReducer: mountReducer,
  useRef: mountRef,
  useState: mountState,
  //...
};

const HooksDispatcherOnUpdate: Dispatcher = {
  //update时
  useCallback: updateCallback,
  useContext: readContext,
  useEffect: updateEffect,
  useImperativeHandle: updateImperativeHandle,
  useLayoutEffect: updateLayoutEffect,
  useMemo: updateMemo,
  useReducer: updateReducer,
  useRef: updateRef,
  useState: updateState,
  //...
};
```

### hook 数据结构

在 FunctionComponent 中，多个 hook 会形成 hook 链表，保存在 Fiber 的 memoizedState 的上，而需要更新的 Update 保存在 hook.queue.pending 中

```js
const hook: Hook = {
  memoizedState: null, //对于不同hook，有不同的值
  baseState: null, //初始state
  baseQueue: null, //初始queue队列
  queue: null, //需要更新的update
  next: null, //下一个hook
};
```

下面来看下 memoizedState 对应的值

- useState：例如`const [state, updateState] = useState(initialState)`，`memoizedState等于`state 的值
- useReducer：例如`const [state, dispatch] = useReducer(reducer, {});`，`memoizedState等于`state 的值
- useEffect：在 mountEffect 时会调用 pushEffect 创建 effect 链表，`memoizedState`就等于 effect 链表，effect 链表也会挂载到 fiber.updateQueue 上，每个 effect 上存在 useEffect 的第一个参数回调和第二个参数依赖数组，例如，`useEffect(callback, [dep])`，effect 就是{create:callback, dep:dep,...}
- useRef：例如`useRef(0)`，memoizedState`就等于`{current: 0}
- useMemo：例如`useMemo(callback, [dep])`，`memoizedState`等于`[callback(), dep]`
- useCallback：例如`useCallback(callback, [dep])`，`memoizedState`等于`[callback, dep]`。`useCallback`保存`callback`函数，`useMemo`保存`callback`的执行结果

### useState&useReducer

之所以把 useState 和 useReducer 放在一起，是因为在源码中 useState 就是有默认 reducer 参数的 useReducer。

- useState&useReducer 声明

  resolveDispatcher 函数会获取当前的 Dispatcher

  ```js
  function useState(initialState) {
    var dispatcher = resolveDispatcher();
    return dispatcher.useState(initialState);
  }
  function useReducer(reducer, initialArg, init) {
    var dispatcher = resolveDispatcher();
    return dispatcher.useReducer(reducer, initialArg, init);
  }
  ```

- mount 阶段

  mount 阶段 useState 调用 mountState，useReducer 调用 mountReducer，唯一区别就是它们创建的 queue 中 lastRenderedReducer 不一样，mount 有初始值 basicStateReducer，所以说 useState 就是有默认 reducer 参数的 useReducer。

  ```js
  function mountState<S>( //
    initialState: (() => S) | S
  ): [S, Dispatch<BasicStateAction<S>>] {
    const hook = mountWorkInProgressHook(); //创建当前hook
    if (typeof initialState === "function") {
      initialState = initialState();
    }
    hook.memoizedState = hook.baseState = initialState; //hook.memoizedState赋值
    const queue = (hook.queue = {
      //赋值hook.queue
      pending: null,
      dispatch: null,
      lastRenderedReducer: basicStateReducer, //和mountReducer的区别
      lastRenderedState: (initialState: any),
    });
    const dispatch: Dispatch<
      //创建dispatch函数
      BasicStateAction<S>
    > = (queue.dispatch = (dispatchAction.bind(
      null,
      currentlyRenderingFiber,
      queue
    ): any));
    return [hook.memoizedState, dispatch]; //返回memoizedState和dispatch
  }

  function mountReducer<S, I, A>(
    reducer: (S, A) => S,
    initialArg: I,
    init?: (I) => S
  ): [S, Dispatch<A>] {
    const hook = mountWorkInProgressHook(); //创建当前hook
    let initialState;
    if (init !== undefined) {
      initialState = init(initialArg);
    } else {
      initialState = ((initialArg: any): S);
    }
    hook.memoizedState = hook.baseState = initialState; //hook.memoizedState赋值
    const queue = (hook.queue = {
      //创建queue
      pending: null,
      dispatch: null,
      lastRenderedReducer: reducer,
      lastRenderedState: (initialState: any),
    });
    const dispatch: Dispatch<A> = (queue.dispatch = (dispatchAction.bind(
      //创建dispatch函数
      null,
      currentlyRenderingFiber,
      queue
    ): any));
    return [hook.memoizedState, dispatch]; //返回memoizedState和dispatch
  }
  ```

  ```react
  function basicStateReducer<S>(state: S, action: BasicStateAction<S>): S {
    return typeof action === 'function' ? action(state) : action;
  }
  ```

- update 阶段

  update 时会根据 hook 中的 update 计算新的 state

  ```react
  function updateReducer<S, I, A>(
    reducer: (S, A) => S,
    initialArg: I,
    init?: I => S,
  ): [S, Dispatch<A>] {
    const hook = updateWorkInProgressHook();//获取hook
    const queue = hook.queue;
    queue.lastRenderedReducer = reducer;

    //...更新state和第12章的state计算逻辑基本一致

    const dispatch: Dispatch<A> = (queue.dispatch: any);
    return [hook.memoizedState, dispatch];
  }

  ```

- 执行阶段

  useState 执行 setState 后会调用 dispatchAction，dispatchAction 做的事情就是讲 Update 加入 queue.pending 中，然后开始调度

  ```react
  function dispatchAction(fiber, queue, action) {

    var update = {//创建update
      eventTime: eventTime,
      lane: lane,
      suspenseConfig: suspenseConfig,
      action: action,
      eagerReducer: null,
      eagerState: null,
      next: null
    };

    //queue.pending中加入update

    var alternate = fiber.alternate;

    if (fiber === currentlyRenderingFiber$1 || alternate !== null && alternate === currentlyRenderingFiber$1) {
      //如果是render阶段执行的更新didScheduleRenderPhaseUpdate=true
  }
      didScheduleRenderPhaseUpdateDuringThisPass = didScheduleRenderPhaseUpdate = true;
    } else {
      if (fiber.lanes === NoLanes && (alternate === null || alternate.lanes === NoLanes)) {
        //如果fiber不存在优先级并且当前alternate不存在或者没有优先级，那就不需要更新了
        //优化的步骤
      }

      scheduleUpdateOnFiber(fiber, lane, eventTime);
    }
  }

  ```

### useEffect

- 声明

  获取并返回 useEffect 函数

  ```js
  export function useEffect(
    create: () => (() => void) | void,
    deps: Array<mixed> | void | null
  ): void {
    const dispatcher = resolveDispatcher();
    return dispatcher.useEffect(create, deps);
  }
  ```

- mount 阶段

  调用 mountEffect，mountEffect 调用 mountEffectImpl，hook.memoizedState 赋值为 effect 链表

  ```jsx
  function mountEffectImpl(fiberFlags, hookFlags, create, deps): void {
    const hook = mountWorkInProgressHook(); //获取hook
    const nextDeps = deps === undefined ? null : deps; //依赖
    currentlyRenderingFiber.flags |= fiberFlags; //增加flag
    hook.memoizedState = pushEffect(
      //memoizedState=effects环状链表
      HookHasEffect | hookFlags,
      create,
      undefined,
      nextDeps
    );
  }
  ```

- update 阶段

  浅比较依赖，如果依赖性变了 pushEffect 第一个参数传 HookHasEffect | hookFlags，HookHasEffect 表示 useEffect 依赖项改变了，需要在 commit 阶段重新执行

  ```jsx
  function updateEffectImpl(fiberFlags, hookFlags, create, deps): void {
    const hook = updateWorkInProgressHook();
    const nextDeps = deps === undefined ? null : deps;
    let destroy = undefined;

    if (currentHook !== null) {
      const prevEffect = currentHook.memoizedState;
      destroy = prevEffect.destroy; //
      if (nextDeps !== null) {
        const prevDeps = prevEffect.deps;
        if (areHookInputsEqual(nextDeps, prevDeps)) {
          //比较deps
          //即使依赖相等也要将effect加入链表，以保证顺序一致
          pushEffect(hookFlags, create, destroy, nextDeps);
          return;
        }
      }
    }

    currentlyRenderingFiber.flags |= fiberFlags;

    hook.memoizedState = pushEffect(
      //参数传HookHasEffect | hookFlags，包含hookFlags的useEffect会在commit阶段执行这个effect
      HookHasEffect | hookFlags,
      create,
      destroy,
      nextDeps
    );
  }
  ```

- 执行阶段

  在第 9 章 commit 阶段的 commitLayoutEffects 函数中会调用 schedulePassiveEffects，将 useEffect 的销毁和回调函数 push 到 pendingPassiveHookEffectsUnmount 和 pendingPassiveHookEffectsMount 中，然后在 mutation 之后调用 flushPassiveEffects 依次执行上次 render 的销毁函数回调和本次 render 的回调函数

  ```jsx
  const unmountEffects = pendingPassiveHookEffectsUnmount;
  pendingPassiveHookEffectsUnmount = [];
  for (let i = 0; i < unmountEffects.length; i += 2) {
    const effect = ((unmountEffects[i]: any): HookEffect);
    const fiber = ((unmountEffects[i + 1]: any): Fiber);
    const destroy = effect.destroy;
    effect.destroy = undefined;

    if (typeof destroy === "function") {
      try {
        destroy(); //销毁函数执行
      } catch (error) {
        captureCommitPhaseError(fiber, error);
      }
    }
  }

  const mountEffects = pendingPassiveHookEffectsMount;
  pendingPassiveHookEffectsMount = [];
  for (let i = 0; i < mountEffects.length; i += 2) {
    const effect = ((mountEffects[i]: any): HookEffect);
    const fiber = ((mountEffects[i + 1]: any): Fiber);

    try {
      const create = effect.create; //本次render的创建函数
      effect.destroy = create();
    } catch (error) {
      captureCommitPhaseError(fiber, error);
    }
  }
  ```

### useRef

sring 类型的 ref 已经不在推荐使用(源码中 string 会生成 refs，发生在 coerceRef 函数中)，ForwardRef 只是把 ref 通过传参传下去，createRef 也是{current: any 这种结构，所以我们只讨论 function 或者{current: any}的 useRef

```js
//createRef返回{current: any}
export function createRef(): RefObject {
  const refObject = {
    current: null,
  };
  return refObject;
}
```

- 声明阶段

  和其他 hook 一样

  ```js
  export function useRef<T>(initialValue: T): {| current: T |} {
    const dispatcher = resolveDispatcher();
    return dispatcher.useRef(initialValue);
  }
  ```

- mount 阶段

  mount 时会调用 mountRef，创建 hook 和 ref 对象。

  ```js
  function mountRef<T>(initialValue: T): {| current: T |} {
    const hook = mountWorkInProgressHook(); //获取useRef
    const ref = { current: initialValue }; //ref初始化
    hook.memoizedState = ref;
    return ref;
  }
  ```

  render 阶段：将带有 ref 属性的 Fiber 标记上 Ref Tag，这一步发生在 beginWork 和 completeWork 函数中的 markRef

  ```js
  export const Ref = /*                          */ 0b0000000010000000;
  ```

  ```js
  //beginWork中
  function markRef(current: Fiber | null, workInProgress: Fiber) {
    const ref = workInProgress.ref;
    if (
      (current === null && ref !== null) ||
      (current !== null && current.ref !== ref)
    ) {
      workInProgress.effectTag |= Ref;
    }
  }
  //completeWork中
  function markRef(workInProgress: Fiber) {
    workInProgress.effectTag |= Ref;
  }
  ```

  commit 阶段：

  会在 commitMutationEffects 函数中判断 ref 是否改变，如果改变了会先执行 commitDetachRef 先删除之前的 ref，然后在 commitLayoutEffect 中会执行 commitAttachRef 赋值 ref。

  ```js
  function commitMutationEffects(root: FiberRoot, renderPriorityLevel) {
    while (nextEffect !== null) {
      const effectTag = nextEffect.effectTag;
      // ...

      if (effectTag & Ref) {
        const current = nextEffect.alternate;
        if (current !== null) {
          commitDetachRef(current);//移除ref
        }
      }
    }
  ```

  ```js
  function commitDetachRef(current: Fiber) {
    const currentRef = current.ref;
    if (currentRef !== null) {
      if (typeof currentRef === "function") {
        currentRef(null); //类型是function，则调用
      } else {
        currentRef.current = null; //否则赋值{current: null}
      }
    }
  }
  ```

  ```js
  function commitAttachRef(finishedWork: Fiber) {
    const ref = finishedWork.ref;
    if (ref !== null) {
      const instance = finishedWork.stateNode; //获取ref的实例
      let instanceToUse;
      switch (finishedWork.tag) {
        case HostComponent:
          instanceToUse = getPublicInstance(instance);
          break;
        default:
          instanceToUse = instance;
      }

      if (typeof ref === "function") {
        //ref赋值
        ref(instanceToUse);
      } else {
        ref.current = instanceToUse;
      }
    }
  }
  ```

- update 阶段

  update 时调用 updateRef 获取获取当前 useRef，然后返回 hook 链表

  ```js
  function updateRef<T>(initialValue: T): {| current: T |} {
    const hook = updateWorkInProgressHook(); //获取当前useRef
    return hook.memoizedState; //返回hook链表
  }
  ```

### useMemo&useCallback

- 声明阶段

  和其他 hook 一样

- mount 阶段

  mount 阶段 useMemo 和 useCallback 唯一区别是在 memoizedState 中存贮 callback 还是 callback 计算出来的函数

  ```js
  function mountMemo<T>(
    nextCreate: () => T,
    deps: Array<mixed> | void | null
  ): T {
    const hook = mountWorkInProgressHook(); //创建hook
    const nextDeps = deps === undefined ? null : deps;
    const nextValue = nextCreate(); //计算value
    hook.memoizedState = [nextValue, nextDeps]; //把value和依赖保存在memoizedState中
    return nextValue;
  }

  function mountCallback<T>(callback: T, deps: Array<mixed> | void | null): T {
    const hook = mountWorkInProgressHook(); //创建hook
    const nextDeps = deps === undefined ? null : deps;
    hook.memoizedState = [callback, nextDeps]; //把callback和依赖保存在memoizedState中
    return callback;
  }
  ```

- update 阶段

  update 时也一样，唯一区别就是直接用回调函数还是执行回调后返回的 value 作为[?, nextDeps]赋值给 memoizedState

  ```js
  function updateMemo<T>(
    nextCreate: () => T,
    deps: Array<mixed> | void | null
  ): T {
    const hook = updateWorkInProgressHook(); //获取hook
    const nextDeps = deps === undefined ? null : deps;
    const prevState = hook.memoizedState;

    if (prevState !== null) {
      if (nextDeps !== null) {
        const prevDeps: Array<mixed> | null = prevState[1];
        if (areHookInputsEqual(nextDeps, prevDeps)) {
          //浅比较依赖
          return prevState[0]; //没变 返回之前的状态
        }
      }
    }
    const nextValue = nextCreate(); //有变化重新调用callback
    hook.memoizedState = [nextValue, nextDeps];
    return nextValue;
  }

  function updateCallback<T>(callback: T, deps: Array<mixed> | void | null): T {
    const hook = updateWorkInProgressHook(); //获取hook
    const nextDeps = deps === undefined ? null : deps;
    const prevState = hook.memoizedState;

    if (prevState !== null) {
      if (nextDeps !== null) {
        const prevDeps: Array<mixed> | null = prevState[1];
        if (areHookInputsEqual(nextDeps, prevDeps)) {
          //浅比较依赖
          return prevState[0]; //没变 返回之前的状态
        }
      }
    }

    hook.memoizedState = [callback, nextDeps]; //变了重新将[callback, nextDeps]赋值给memoizedState
    return callback;
  }
  ```

### useLayoutEffect

useLayoutEffect 和 useEffect 一样，只是调用的时机不同，它是在 commit 阶段的 commitLayout 函数中同步执行

### forwardRef

forwardRef 也非常简单，就是传递 ref 属性

```js
export function forwardRef<Props, ElementType: React$ElementType>(
  render: (props: Props, ref: React$Ref<ElementType>) => React$Node
) {
  const elementType = {
    $$typeof: REACT_FORWARD_REF_TYPE,
    render,
  };

  return elementType;
}
//ForwardRef第二个参数是ref对象
let children = Component(props, secondArg);
```

## 手写 hooks

最关键的是要理解 hook 队列和 update 队列的指针指向和 updateQueue 的更新计算，详细见视频讲解

```js
import React from "react";
import ReactDOM from "react-dom";

let workInProgressHook; //当前工作中的hook
let isMount = true; //是否时mount时

const fiber = {
  //fiber节点
  memoizedState: null, //hook链表
  stateNode: App, //dom
};

const Dispatcher = (() => {
  //Dispatcher对象
  function mountWorkInProgressHook() {
    //mount时调用
    const hook = {
      //构建hook
      queue: {
        //更新队列
        pending: null, //未执行的update队列
      },
      memoizedState: null, //当前state
      next: null, //下一个hook
    };
    if (!fiber.memoizedState) {
      fiber.memoizedState = hook; //第一个hook的话直接赋值给fiber.memoizedState
    } else {
      workInProgressHook.next = hook; //不是第一个的话就加在上一个hook的后面，形成链表
    }
    workInProgressHook = hook; //记录当前工作的hook
    return workInProgressHook;
  }
  function updateWorkInProgressHook() {
    //update时调用
    let curHook = workInProgressHook;
    workInProgressHook = workInProgressHook.next; //下一个hook
    return curHook;
  }
  function useState(initialState) {
    let hook;
    if (isMount) {
      hook = mountWorkInProgressHook();
      hook.memoizedState = initialState; //初始状态
    } else {
      hook = updateWorkInProgressHook();
    }

    let baseState = hook.memoizedState; //初始状态
    if (hook.queue.pending) {
      let firstUpdate = hook.queue.pending.next; //第一个update

      do {
        const action = firstUpdate.action;
        baseState = action(baseState);
        firstUpdate = firstUpdate.next; //循环update链表
      } while (firstUpdate !== hook.queue.pending); //通过update的action计算state

      hook.queue.pending = null; //重置update链表
    }
    hook.memoizedState = baseState; //赋值新的state

    return [baseState, dispatchAction.bind(null, hook.queue)]; //useState的返回
  }

  return {
    useState,
  };
})();

function dispatchAction(queue, action) {
  //触发更新
  const update = {
    //构建update
    action,
    next: null,
  };
  if (queue.pending === null) {
    update.next = update; //update的环状链表
  } else {
    update.next = queue.pending.next; //新的update的next指向前一个update
    queue.pending.next = update; //前一个update的next指向新的update
  }
  queue.pending = update; //更新queue.pending

  isMount = false; //标志mount结束
  workInProgressHook = fiber.memoizedState; //更新workInProgressHook
  schedule(); //调度更新
}

function App() {
  let [count, setCount] = Dispatcher.useState(1);
  let [age, setAge] = Dispatcher.useState(10);
  return (
    <>
      <p>Clicked {count} times</p>
      <button onClick={() => setCount(() => count + 1)}> Add count</button>
      <p>Age is {age}</p>
      <button onClick={() => setAge(() => age + 1)}> Add age</button>
    </>
  );
}

function schedule() {
  ReactDOM.render(<App />, document.querySelector("#root"));
}

schedule();
```

## scheduler&Lane

当我们在类似下面的搜索框组件进行搜索时会发现，组件分为搜索部分和搜索结果展示列表，我们期望输入框能立刻响应，结果列表可以有等待的时间，如果结果列表数据量很大，在进行渲染的时候，我们又输入了一些文字，因为用户输入事件的优先级是很高的，所以就要停止结果列表的渲染，这就引出了不同任务之间的优先级和调度

![react源码15.5](https://xiaochen1024.com/20210529105929.png)

### Scheduler

我们知道如果我们的应用占用较长的 js 执行时间，比如超过了设备一帧的时间，那么设备的绘制就会出不的现象。

Scheduler 主要的功能是时间切片和调度优先级，react 在对比差异的时候会占用一定的 js 执行时间，Scheduler 内部借助 MessageChannel 实现了在浏览器绘制之前指定一个时间片，如果 react 在指定时间内没对比完，Scheduler 就会强制交出执行权给浏览器

![react源码15.3](https://xiaochen1024.com/20210529105933.png)

### 时间切片

在浏览器的一帧中 js 的执行时间如下

![react源码15.1](https://xiaochen1024.com/20210529105937.png)

requestIdleCallback 是在浏览器重绘重排之后，如果还有空闲就可以执行的时机，所以为了不影响重绘重排，可以在浏览器在 requestIdleCallback 中执行耗性能的计算，但是由于 requestIdleCallback 存在兼容和触发时机不稳定的问题，scheduler 中采用 MessageChannel 来实现 requestIdleCallback，当前环境不支持 MessageChannel 就采用 setTimeout。

在之前的介绍中我们知道在 performUnitOfWork 之后会执行 render 阶段和 commit 阶段，如果在浏览器的一帧中，cup 的计算还没完成，就会让出 js 执行权给浏览器，这个判断在 workLoopConcurrent 函数中，shouldYield 就是用来判断剩余的时间有没有用尽。在源码中每个时间片时 5ms，这个值会根据设备的 fps 调整。

```js
function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}
function forceFrameRate(fps) {
  //计算时间片
  if (fps < 0 || fps > 125) {
    console["error"](
      "forceFrameRate takes a positive int between 0 and 125, " +
        "forcing frame rates higher than 125 fps is not supported"
    );
    return;
  }
  if (fps > 0) {
    yieldInterval = Math.floor(1000 / fps);
  } else {
    yieldInterval = 5; //时间片默认5ms
  }
}
```

### 任务的暂停

在 shouldYield 函数中有一段，所以可以知道，如果当前时间大于任务开始的时间+yieldInterval，就打断了任务的进行。

```js
//deadline = currentTime + yieldInterval，deadline是在performWorkUntilDeadline函数中计算出来的
if (currentTime >= deadline) {
  //...
  return true;
}
```

### 调度优先级

在 Scheduler 中有两个函数可以创建具有优先级的任务

- runWithPriority：以一个优先级执行 callback，如果是同步的任务，优先级就是 ImmediateSchedulerPriority

  ```js
  function unstable_runWithPriority(priorityLevel, eventHandler) {
    switch (
      priorityLevel //5种优先级
    ) {
      case ImmediatePriority:
      case UserBlockingPriority:
      case NormalPriority:
      case LowPriority:
      case IdlePriority:
        break;
      default:
        priorityLevel = NormalPriority;
    }

    var previousPriorityLevel = currentPriorityLevel; //保存当前的优先级
    currentPriorityLevel = priorityLevel; //priorityLevel赋值给currentPriorityLevel

    try {
      return eventHandler(); //回调函数
    } finally {
      currentPriorityLevel = previousPriorityLevel; //还原之前的优先级
    }
  }
  ```

- scheduleCallback：以一个优先级注册 callback，在适当的时机执行，因为涉及过期时间的计算，所以 scheduleCallback 比 runWithPriority 的粒度更细。

  - 在 scheduleCallback 中优先级意味着过期时间，优先级越高 priorityLevel 就越小，过期时间离当前时间就越近，`var expirationTime = startTime + timeout;`例如 IMMEDIATE_PRIORITY_TIMEOUT=-1，那`var expirationTime = startTime + (-1);`就小于当前时间了，所以要立即执行。

  - scheduleCallback 调度的过程用到了小顶堆，所以我们可以在 O(1)的复杂度找到优先级最高的 task，不了解可以查阅资料，在源码中小顶堆存放着任务，每次 peek 都能取到离过期时间最近的 task。

  - scheduleCallback 中，未过期任务 task 存放在 timerQueue 中，过期任务存放在 taskQueue 中。

    新建 newTask 任务之后，判断 newTask 是否过期，没过期就加入 timerQueue 中，如果此时 taskQueue 中还没有过期任务，timerQueue 中离过期时间最近的 task 正好是 newTask，则设置个定时器，到了过期时间就加入 taskQueue 中。

    当 timerQueue 中有任务，就取出最早过期的任务执行。

```js
function unstable_scheduleCallback(priorityLevel, callback, options) {
  var currentTime = getCurrentTime();

  var startTime;//开始时间
  if (typeof options === 'object' && options !== null) {
    var delay = options.delay;
    if (typeof delay === 'number' && delay > 0) {
      startTime = currentTime + delay;
    } else {
      startTime = currentTime;
    }
  } else {
    startTime = currentTime;
  }

  var timeout;
  switch (priorityLevel) {
    case ImmediatePriority://优先级越高timeout越小
      timeout = IMMEDIATE_PRIORITY_TIMEOUT;//-1
      break;
    case UserBlockingPriority:
      timeout = USER_BLOCKING_PRIORITY_TIMEOUT;//250
      break;
    case IdlePriority:
      timeout = IDLE_PRIORITY_TIMEOUT;
      break;
    case LowPriority:
      timeout = LOW_PRIORITY_TIMEOUT;
      break;
    case NormalPriority:
    default:
      timeout = NORMAL_PRIORITY_TIMEOUT;
      break;
  }

  var expirationTime = startTime + timeout;//优先级越高 过期时间越小

  var newTask = {//新建task
    id: taskIdCounter++,
    callback//回调函数
    priorityLevel,
    startTime,//开始时间
    expirationTime,//过期时间
    sortIndex: -1,
  };
  if (enableProfiling) {
    newTask.isQueued = false;
  }

  if (startTime > currentTime) {//没有过期
    newTask.sortIndex = startTime;
    push(timerQueue, newTask);//加入timerQueue
    //taskQueue中还没有过期任务，timerQueue中离过期时间最近的task正好是newTask
    if (peek(taskQueue) === null && newTask === peek(timerQueue)) {
      if (isHostTimeoutScheduled) {
        cancelHostTimeout();
      } else {
        isHostTimeoutScheduled = true;
      }
      //定时器，到了过期时间就加入taskQueue中
      requestHostTimeout(handleTimeout, startTime - currentTime);
    }
  } else {
    newTask.sortIndex = expirationTime;
    push(taskQueue, newTask);//加入taskQueue
    if (enableProfiling) {
      markTaskStart(newTask, currentTime);
      newTask.isQueued = true;
    }
    if (!isHostCallbackScheduled && !isPerformingWork) {
      isHostCallbackScheduled = true;
      requestHostCallback(flushWork);//执行过期的任务
    }
  }

  return newTask;
}
```

![react源码15.2](https://xiaochen1024.com/assets/20210529110158.png)

#### 任务暂停之后怎么继续

在 workLoop 函数中有这样一段

```js
const continuationCallback = callback(didUserCallbackTimeout); //callback就是调度的callback
currentTime = getCurrentTime();
if (typeof continuationCallback === "function") {
  //判断callback执行之后的返回值类型
  currentTask.callback = continuationCallback; //如果是function类型就把又赋值给currentTask.callback
  markTaskYield(currentTask, currentTime);
} else {
  if (enableProfiling) {
    markTaskCompleted(currentTask, currentTime);
    currentTask.isQueued = false;
  }
  if (currentTask === peek(taskQueue)) {
    pop(taskQueue); //如果是function类型就从taskQueue中删除
  }
}
advanceTimers(currentTime);
```

在 performConcurrentWorkOnRoot 函数的结尾有这样一个判断，如果 callbackNode 等于 originalCallbackNode 那就恢复任务的执行

```js
if (root.callbackNode === originalCallbackNode) {
  // The task node scheduled for this root is the same one that's
  // currently executed. Need to return a continuation.
  return performConcurrentWorkOnRoot.bind(null, root);
}
```

### Lane

Lane 的和 Scheduler 是两套优先级机制，相比来说 Lane 的优先级粒度更细，Lane 的意思是车道，类似赛车一样，在 task 获取优先级时，总是会优先抢内圈的赛道，Lane 表示的优先级有以下几个特点。

- 可以表示不同批次的优先级

  从代码中中可以看到，每个优先级都是个 31 位二进制数字，1 表示该位置可以用，0 代表这个位置不能用，从第一个优先级 NoLanes 到 OffscreenLane 优先级是降低的，优先级越低 1 的个数也就越多（赛车比赛外圈的车越多），也就是说含多个 1 的优先级就是同一个批次。

  ```js
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

- 优先级的计算的性能高

  例如，可以通过二进制按位与来判断 a 和 b 代表的 lane 是否存在交集

  ```js
  export function includesSomeLane(a: Lanes | Lane, b: Lanes | Lane) {
    return (a & b) !== NoLanes;
  }
  ```

#### Lane 模型中 task 是怎么获取优先级的（赛车的初始赛道）

任务获取赛道的方式是从高优先级的 lanes 开始的，这个过程发生在 findUpdateLane 函数中，如果高优先级没有可用的 lane 了就下降到优先级低的 lanes 中寻找，其中 pickArbitraryLane 会调用 getHighestPriorityLane 获取一批 lanes 中优先级最高的那一位，也就是通过`lanes & -lanes`获取最右边的一位

```js
export function findUpdateLane(
  lanePriority: LanePriority,
  wipLanes: Lanes
): Lane {
  switch (lanePriority) {
    //...
    case DefaultLanePriority: {
      let lane = pickArbitraryLane(DefaultLanes & ~wipLanes); //找到下一个优先级最高的lane
      if (lane === NoLane) {
        //上一个level的lane都占满了下降到TransitionLanes继续寻找可用的赛道
        lane = pickArbitraryLane(TransitionLanes & ~wipLanes);
        if (lane === NoLane) {
          //TransitionLanes也满了
          lane = pickArbitraryLane(DefaultLanes); //从DefaultLanes开始找
        }
      }
      return lane;
    }
  }
}
```

#### Lane 模型中高优先级是怎么插队的（赛车抢赛道）

在 Lane 模型中如果一个低优先级的任务执行，并且还在调度的时候触发了一个高优先级的任务，则高优先级的任务打断低优先级任务，此时应该先取消低优先级的任务，因为此时低优先级的任务可能已经进行了一段时间，Fiber 树已经构建了一部分，所以需要将 Fiber 树还原，这个过程发生在函数 prepareFreshStack 中，在这个函数中会初始化已经构建的 Fiber 树

```js
function ensureRootIsScheduled(root: FiberRoot, currentTime: number) {
  const existingCallbackNode = root.callbackNode; //之前已经调用过的setState的回调
  //...
  if (existingCallbackNode !== null) {
    const existingCallbackPriority = root.callbackPriority;
    //新的setState的回调和之前setState的回调优先级相等 则进入batchedUpdate的逻辑
    if (existingCallbackPriority === newCallbackPriority) {
      return;
    }
    //两个回调优先级不一致，则被高优先级任务打断，先取消当前低优先级的任务
    cancelCallback(existingCallbackNode);
  }
  //调度render阶段的起点
  newCallbackNode = scheduleCallback(
    schedulerPriorityLevel,
    performConcurrentWorkOnRoot.bind(null, root)
  );
  //...
}
```

```js
function prepareFreshStack(root: FiberRoot, lanes: Lanes) {
  root.finishedWork = null;
  root.finishedLanes = NoLanes;
  //...
  //workInProgressRoot等变量重新赋值和初始化
  workInProgressRoot = root;
  workInProgress = createWorkInProgress(root.current, null);
  workInProgressRootRenderLanes =
    subtreeRenderLanes =
    workInProgressRootIncludedLanes =
      lanes;
  workInProgressRootExitStatus = RootIncomplete;
  workInProgressRootFatalError = null;
  workInProgressRootSkippedLanes = NoLanes;
  workInProgressRootUpdatedLanes = NoLanes;
  workInProgressRootPingedLanes = NoLanes;
  //...
}
```

#### Lane 模型中怎么解决饥饿问题（最后一名赛车最后也要到达终点啊）

在调度优先级的过程中，会调用 markStarvedLanesAsExpired 遍历 pendingLanes（未执行的任务包含的 lane），如果没过期时间就计算一个过期时间，如果过期了就加入 root.expiredLanes 中，然后在下次调用 getNextLane 函数的时候会优先返回 expiredLanes

```js
export function markStarvedLanesAsExpired(
  root: FiberRoot,
  currentTime: number
): void {
  const pendingLanes = root.pendingLanes;
  const suspendedLanes = root.suspendedLanes;
  const pingedLanes = root.pingedLanes;
  const expirationTimes = root.expirationTimes;

  let lanes = pendingLanes;
  while (lanes > 0) {
    //遍历lanes
    const index = pickArbitraryLaneIndex(lanes);
    const lane = 1 << index;

    const expirationTime = expirationTimes[index];
    if (expirationTime === NoTimestamp) {
      if (
        (lane & suspendedLanes) === NoLanes ||
        (lane & pingedLanes) !== NoLanes
      ) {
        expirationTimes[index] = computeExpirationTime(lane, currentTime); //计算过期时间
      }
    } else if (expirationTime <= currentTime) {
      //过期了
      root.expiredLanes |= lane; //在expiredLanes加入当前遍历到的lane
    }

    lanes &= ~lane;
  }
}
```

```js
export function getNextLanes(root: FiberRoot, wipLanes: Lanes): Lanes {
  //...
  if (expiredLanes !== NoLanes) {
    nextLanes = expiredLanes;
    nextLanePriority = return_highestLanePriority = SyncLanePriority; //优先返回过期的lane
  } else {
    //...
  }
  return nextLanes;
}
```

下图更直观，随之时间的推移，低优先级的任务被插队，最后也会变成高优先级的任务

![react源码15.4](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs20210529105945.png)

## concurrent 模式

### concurrent mode

react17 支持 concurrent mode，这种模式的根本目的是为了让应用保持 cpu 和 io 的快速响应，它是一组新功能，包括 Fiber、Scheduler、Lane，可以根据用户硬件性能和网络状况调整应用的响应速度，核心就是为了实现异步可中断的更新。concurrent mode 也是未来 react 主要迭代的方向。

- cup：让耗时的 reconcile 的过程能让出 js 的执行权给更高优先级的任务，例如用户的输入，
- io：依靠 Suspense

### Fiber

Fiber 我们之前介绍过，这里我们来看下在 concurrent mode 下 Fiber 的意义，react15 之前的 reconcile 是同步执行的，当组件数量很多，reconcile 时的计算量很大时，就会出现页面的卡顿，为了解决这个问题就需要一套异步可中断的更新来让耗时的计算让出 js 的执行权给高优先级的任务，在浏览器有空闲的时候再执行这些计算。所以我们需要一种数据结构来描述真实 dom 和更新的信息，在适当的时候可以在内存中中断 reconcile 的过程，这种数据结构就是 Fiber。

### Scheduler

Scheduler 独立于 react 本身，相当于一个单独的 package，Scheduler 的意义在于，当 cup 的计算量很大时，我们根据设备的 fps 算出一帧的时间，在这个时间内执行 cup 的操作，当任务执行的时间快超过一帧的时间时，会暂停任务的执行，让浏览器有时间进行重排和重绘。在适当的时候继续任务。

在 js 中我们知道 generator 也可以暂停和继续任务，但是我们还需要用优先级来排列任务，这个是 generator 无法完成的。在 Scheduler 中使用 MessageChannel 实现了时间切片，然后用小顶堆排列任务优先级的高低，达到了异步可中断的更新。

Scheduler 可以用过期时间来代表优先级的高低。

优先级越高，过期时间越短，离当前时间越近，也就是说过一会就要执行它了。

优先级越低，过期时间越长，离当前时间越长，也就是过很久了才能轮到它执行。

### lane

Lane 用二进制位表示任务的优先级，方便优先级的计算，不同优先级占用不同位置的‘赛道’，而且存在批的概念，优先级越低，‘赛道’越多。高优先级打断低优先级，新建的任务需要赋予什么优先级等问题都是 Lane 所要解决的问题。

### batchedUpdates

简单来说，在一个上下文中同时触发多次更新，这些更新会合并成一次更新，例如

```jsx
onClick() {
  this.setState({ count: this.state.count + 1 });
  this.setState({ count: this.state.count + 1 });
}
```

在之前的 react 版本中如果脱离当前的上下文就不会被合并，例如把多次更新放在 setTimeout 中，原因是处于同一个 context 的多次 setState 的 executionContext 都会包含 BatchedContext，包含 BatchedContext 的 setState 会合并，当 executionContext 等于 NoContext，就会同步执行 SyncCallbackQueue 中的任务，所以 setTimeout 中的多次 setState 不会合并，而且会同步执行。

```js
onClick() {
 setTimeout(() => {
    this.setState({ count: this.state.count + 1 });
    this.setState({ count: this.state.count + 1 });
  });
}
export function batchedUpdates<A, R>(fn: A => R, a: A): R {
  const prevExecutionContext = executionContext;
  executionContext |= BatchedContext;
  try {
    return fn(a);
  } finally {
    executionContext = prevExecutionContext;
    if (executionContext === NoContext) {
      resetRenderTimer();
       //executionContext为NoContext就同步执行SyncCallbackQueue中的任务
      flushSyncCallbackQueue();
    }
  }
}
```

在 Concurrent mode 下，上面的例子也会合并为一次更新，根本原因在如下一段简化的源码，如果多次 setState，会比较这几次 setState 回调的优先级，如果优先级一致，则先 return 掉，不会进行后面的 render 阶段

```js
function ensureRootIsScheduled(root: FiberRoot, currentTime: number) {
  const existingCallbackNode = root.callbackNode; //之前已经调用过的setState的回调
  //...
  if (existingCallbackNode !== null) {
    const existingCallbackPriority = root.callbackPriority;
    //新的setState的回调和之前setState的回调优先级相等 则进入batchedUpdate的逻辑
    if (existingCallbackPriority === newCallbackPriority) {
      return;
    }
    cancelCallback(existingCallbackNode);
  }
  //调度render阶段的起点
  newCallbackNode = scheduleCallback(
    schedulerPriorityLevel,
    performConcurrentWorkOnRoot.bind(null, root)
  );
  //...
}
```

那为什么在 Concurrent mode 下，在 setTimeout 回调多次 setState 优先级一致呢，因为在获取 Lane 的函数 requestUpdateLane，只有第一次 setState 满足 currentEventWipLanes === NoLanes，所以他们的 currentEventWipLanes 参数相同，而在 findUpdateLane 中 schedulerLanePriority 参数也相同（调度的优先级相同），所以返回的 lane 相同。

```js
export function requestUpdateLane(fiber: Fiber): Lane {
  //...
  if (currentEventWipLanes === NoLanes) {
    //第一次setState满足currentEventWipLanes === NoLanes
    currentEventWipLanes = workInProgressRootIncludedLanes;
  }
  //...
  //在setTimeout中schedulerLanePriority, currentEventWipLanes都相同，所以返回的lane也相同
  lane = findUpdateLane(schedulerLanePriority, currentEventWipLanes);
  //...

  return lane;
}
```

### Suspense

Suspense 可以在请求数据的时候显示 pending 状态，请求成功后展示数据，原因是因为 Suspense 中组件的优先级很低，而离屏的 fallback 组件优先级高，当 Suspense 中组件 resolve 之后就会重新调度一次 render 阶段，此过程发生在 updateSuspenseComponent 函数中，具体可以看调试 suspense 的视频

### 总结

Fiber 为 concurrent 架构提供了数据层面的支持。

Scheduler 为 concurrent 实现时间片调度提供了保障。

Lane 模型为 concurrent 提供了更新的策略

上层实现了 batchedUpdates 和 Suspense

## context

### context 流程图

![react源码17.1](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs20210529105951.png)

![react源码17.2](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs20210529105954.png)

### cursor/valueStack

react 源码中存在一个 valueStack 和 valueCursor 用来记录 context 的历史信息和当前 context，另外还有一个 didPerformWorkStackCursor 用来表示当前的 context 有没有变化

```js
//ReactFiberNewContext.new.js
const valueCursor: StackCursor<mixed> = createCursor(null);
const didPerformWorkStackCursor: StackCursor<boolean> = createCursor(false);
//ReactFiberStack.new.js
const valueStack: Array<any> = [];
function pushProvider(providerFiber, nextValue) {
  var context = providerFiber.type._context;
  {
    push(valueCursor, context._currentValue, providerFiber);
    context._currentValue = nextValue;
  }
}
function popProvider(providerFiber) {
  var currentValue = valueCursor.current;
  pop(valueCursor, providerFiber);
  var context = providerFiber.type._context;

  {
    context._currentValue = currentValue;
  }
}
```

- 在 render 阶段调用 updateContextProvider 的时候会执行 pushProvider，将新的值 push 进 valueStack 中
- 在 commit 阶段调用 completeWork 的时候会执行 popProvider，将栈顶 context pop 出来，

为什么会有这样一个机制呢，因为我们的 context 是跨层级的，在之前讲到 render 阶段和 commit 阶段的时候，我们会以深度优先遍历的方式遍历节点，如果涉及跨层级读取状态就有点力不从心了，就需要一层一层往下传递我们的 props，所以我们可以用一个 stack 记录我们的 context，在 render 阶段 pushProvider，在 commit 阶段 popProvider，在每个具体的层级能根据 valueCursor 取当前 value

### createContext

```js
export function createContext<T>(
  defaultValue: T,
  calculateChangedBits: ?(a: T, b: T) => number
): ReactContext<T> {
  if (calculateChangedBits === undefined) {
    //可以传入计算bit的函数
    calculateChangedBits = null;
  } else {
    //...
  }

  const context: ReactContext<T> = {
    $$typeof: REACT_CONTEXT_TYPE,
    _calculateChangedBits: calculateChangedBits, //计算value变化的函数
    _currentValue: defaultValue, //dom环境的value
    _currentValue2: defaultValue, //art环境的value
    _threadCount: 0,
    Provider: (null: any),
    Consumer: (null: any),
  };

  context.Provider = {
    $$typeof: REACT_PROVIDER_TYPE,
    _context: context,
  };

  if (__DEV__) {
  } else {
    context.Consumer = context;
  }

  return context;
}

//示例
const NameChangedBits = 0b01;
const AgeChangedBits = 0b10;
const AppContext = createContext({}, (prevValue, nextValue) => {
  let result = 0;
  if (prevValue.name !== nextValue.name) {
    result |= NameChangedBits;
  }
  if (prevValue.age !== nextValue.age) {
    result |= AgeChangedBits;
  }
  return result;
});
```

在简化之后的 createContext 中可以看到，context 和 Provider、Consumer 的关系是这样的：

```js
context.Provider = {
  $$typeof: REACT_PROVIDER_TYPE,
  _context: context,
};
context.Consumer = context;
```

### useContext

useContext 会调用 readContext，readContext 会创建 dependce，加入当前 fiber 的 dependencies 链表中

```js
function readContext(context, observedBits) {
  {
  if (lastContextWithAllBitsObserved === context) ; else if (observedBits === false || observedBits === 0) ; else {
    var resolvedObservedBits;

    //生成resolvedObservedBits
    if (typeof observedBits !== 'number' || observedBits === MAX_SIGNED_31_BIT_INT) {
      lastContextWithAllBitsObserved = context;
      resolvedObservedBits = MAX_SIGNED_31_BIT_INT;
    } else {
      resolvedObservedBits = observedBits;
    }

    var contextItem = {//生成dependce
      context: context,
      observedBits: resolvedObservedBits,
      next: null
    };

    if (lastContextDependency === null) {
      //...

      lastContextDependency = contextItem;
      currentlyRenderingFiber.dependencies = {//dependencies链表的第一个
        lanes: NoLanes,
        firstContext: contextItem,
        responders: null
      };
    } else {
      lastContextDependency = lastContextDependency.next = contextItem;//加入dependencies链表
    }
  }

  return  context._currentValue ;
}
```

### provider/customer

在 render 阶段会调用 updateContextProvider，注意几个关键的步骤

- pushProvider：将当前 context 加入 valueStack
- calculateChangedBits：useContext 可以设置 observedBits，没有设置的话就是 MAX_SIGNED_31_BIT_INT，也就是 31 位 1，用于计算 changedBits，这个计算 context 是否变化的过程就发生在 calculateChangedBits 函数中，用这样的方式可以提高 context 变化之后的性能
- bailoutOnAlreadyFinishedWork/propagateContextChange：如果 changedBits 没有改变则走 bailoutOnAlreadyFinishedWork 的逻辑，跳过当前节点的更新，如果改变则执行 propagateContextChange

```js
function updateContextProvider(current, workInProgress, renderLanes) {
  var providerType = workInProgress.type;
  var context = providerType._context;
  var newProps = workInProgress.pendingProps;
  var oldProps = workInProgress.memoizedProps;
  var newValue = newProps.value;

  //...

  pushProvider(workInProgress, newValue);

  if (oldProps !== null) {
    var oldValue = oldProps.value;
    var changedBits = calculateChangedBits(context, newValue, oldValue);

    if (changedBits === 0) {//context没有改变
      if (oldProps.children === newProps.children && !hasContextChanged()) {
        return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
      }
    } else {//context改变了
      propagateContextChange(workInProgress, context, changedBits, renderLanes);
    }
  }

  var newChildren = newProps.children;
  reconcileChildren(current, workInProgress, newChildren, renderLanes);
  return workInProgress.child;
}
function calculateChangedBits(context, newValue, oldValue) {
  if (objectIs(oldValue, newValue)) {
		//没有改变
    return 0;
  } else {
    var changedBits = typeof context._calculateChangedBits === 'function' ? context._calculateChangedBits(oldValue, newValue) : MAX_SIGNED_31_BIT_INT;

    {
      if ((changedBits & MAX_SIGNED_31_BIT_INT) !== changedBits) {
        error('calculateChangedBits: Expected the return value to be a ' + '31-bit integer. Instead received: %s', changedBits);
      }
    }

    return changedBits | 0;
  }
}

//示例
const NameChangedBits = 0b01;
const AgeChangedBits = 0b10;
const AppContext = createContext({}, (prevValue, nextValue) => {
  let result = 0;
  if (prevValue.name !== nextValue.name) {
    result |= NameChangedBits;
  };
  if (prevValue.age !== nextValue.age) {
    result |= AgeChangedBits;
  };
  return result;
});
function propagateContextChange(workInProgress, context, changedBits, renderLanes) {
  var fiber = workInProgress.child;

  if (fiber !== null) {
    fiber.return = workInProgress;//fiber不存在 就找父节点
  }

  while (fiber !== null) {
    var nextFiber = void 0;//遍历fiber

    var list = fiber.dependencies;

    if (list !== null) {
      nextFiber = fiber.child;
      var dependency = list.firstContext;

      while (dependency !== null) {//遍历dependencies链表
        if (dependency.context === context && (dependency.observedBits & changedBits) !== 0) {
					//有变化
          if (fiber.tag === ClassComponent) {
            //创建新的update
            var update = createUpdate(NoTimestamp, pickArbitraryLane(renderLanes));
            update.tag = ForceUpdate;
            enqueueUpdate(fiber, update);
          }

          fiber.lanes = mergeLanes(fiber.lanes, renderLanes);//合并优先级
          var alternate = fiber.alternate;

          if (alternate !== null) {
            alternate.lanes = mergeLanes(alternate.lanes, renderLanes);
          }

          scheduleWorkOnParentPath(fiber.return, renderLanes); //更新祖先节点的优先级

          list.lanes = mergeLanes(list.lanes, renderLanes);
          break;
        }

        dependency = dependency.next;
      }
    }
    	//...
      nextFiber = fiber.sibling;
    } else {
      nextFiber = fiber.child;
    }
    //...

    fiber = nextFiber;
  }
}
```

updateContextConsumer 关键的代码如下，执行 prepareToReadContext 判断优先级是否足够加入当前这次 render，readContext 取到当前 context 的 value

```js
function updateContextConsumer(current, workInProgress, renderLanes) {
  var context = workInProgress.type;
  //...
  prepareToReadContext(workInProgress, renderLanes);
  var newValue = readContext(context, newProps.unstable_observedBits);
  var newChildren;
  {
    ReactCurrentOwner$1.current = workInProgress;
    setIsRendering(true);
    newChildren = render(newValue);
    setIsRendering(false);
  }

  //...
  workInProgress.flags |= PerformedWork;
  reconcileChildren(current, workInProgress, newChildren, renderLanes);
  return workInProgress.child;
}
```

## 事件系统

### 从一个 bug 说起

下面这个 demo_13 在 react17 和 react16 中有什么不同吗？代码也很简单，模拟一个 modal 框，点击显示出现，点击其他地方，相当于点击了 mask，modal 消失，因为 react 事件都是委托到上层，所以需要在 handleClick 阻止冒泡，这样点击显示的时候不会触发 document 上的事件回调，导致 modal 无法显示。但是在 react16 上发现这样做还是不行，需要调用 e.nativeEvent.stopImmediatePropagation()才能实现，而 react17 上没什么影响

究其原因就是 react16 和 17 在委托事件的容器上做出了改变，react16 的事件会冒泡的 document 上，而 17 则会冒泡到 root 容器上，也就是 ReactDom.render 的第二个参数

```js
export default class Demo13 extends React.Component {
  state = { show: false };
  componentDidMount() {
    document.addEventListener("click", () => {
      this.setState({ show: false });
    });
  }
  handleClick = (e) => {
    e.stopPropagation(); //react17中生效
    // e.nativeEvent.stopImmediatePropagation(); //react16中生效 stopImmediatePropagation也阻止本级监听函数执行
    this.setState({ show: true });
  };
  render() {
    return (
      <div>
        <button onClick={this.handleClick}>显示</button>
        {this.state.show && (
          <div onClick={(e) => e.nativeEvent.stopImmediatePropagation()}>
            modal
          </div>
        )}
      </div>
    );
  }
}
```

大家也可以看下 demo_11、demo_12 在 react16、17 触发顺序有何差异，同时 demo 项目中的 event.html 也模拟了 react16、17 的事件代理机制

### 事件系统架构图

![react源码18.1](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs20210529110000.png)

我们以 SimpleEvent 为例看事件注册、绑定和触发的过程，看视频的调试过程

### 事件注册

1. DOMPluginEventSystem.js 会调用 SimpleEventPlugin 插件的 registerEvents 方法注册事件

   ```js
   //DOMPluginEventSystem.js
   SimpleEventPlugin.registerEvents();
   ```

2. registerSimpleEvents

   ```js
   function registerSimpleEvents() {
     registerSimplePluginEventsAndSetTheirPriorities(
       discreteEventPairsForSimpleEventPlugin,
       DiscreteEvent
     );
     //...
   }

   function registerSimplePluginEventsAndSetTheirPriorities(
     eventTypes,
     priority
   ) {
     for (var i = 0; i < eventTypes.length; i += 2) {
       var topEvent = eventTypes[i];
       var event = eventTypes[i + 1];
       var capitalizedEvent = event[0].toUpperCase() + event.slice(1);
       var reactName = "on" + capitalizedEvent;
       eventPriorities.set(topEvent, priority);
       topLevelEventsToReactNames.set(topEvent, reactName);
       registerTwoPhaseEvent(reactName, [topEvent]); //注册捕获和冒泡两个阶段的事件
     }
   }
   ```

3. registerTwoPhaseEvent

   ```js
   function registerTwoPhaseEvent(registrationName, dependencies) {
     registerDirectEvent(registrationName, dependencies);
     registerDirectEvent(registrationName + "Capture", dependencies);
   }
   ```

4. registerDirectEvent

   ```js
   function registerDirectEvent(registrationName, dependencies) {
     //...

     for (var i = 0; i < dependencies.length; i++) {
       allNativeEvents.add(dependencies[i]); //生成allNativeEvents对象
     }
   }
   ```

### 事件绑定

1. listenToAllSupportedEvents

   ```js
   //由函数createRootImpl调用，也就是在创建根节点之后执行
   function listenToAllSupportedEvents(rootContainerElement) {
       allNativeEvents.forEach(function (domEventName) {
         if (!nonDelegatedEvents.has(domEventName)) {
           listenToNativeEvent(domEventName, false, rootContainerElement, null);
         }

         listenToNativeEvent(domEventName, true, rootContainerElement, null);
       });
     }
   }
   ```

2. listenToNativeEvent

   ```js
   function listenToNativeEvent(
     domEventName,
     isCapturePhaseListener,
     rootContainerElement,
     targetElement
   ) {
     //...

     if (!listenerSet.has(listenerSetKey)) {
       if (isCapturePhaseListener) {
         eventSystemFlags |= IS_CAPTURE_PHASE;
       }

       addTrappedEventListener(
         target,
         domEventName,
         eventSystemFlags,
         isCapturePhaseListener
       );
       listenerSet.add(listenerSetKey);
     }
   }
   ```

3. addTrappedEventListener

   ```js
   function addTrappedEventListener(
     targetContainer,
     domEventName,
     eventSystemFlags,
     isCapturePhaseListener,
     isDeferredListenerForLegacyFBSupport
   ) {
     //创建具有优先级的监听函数
     var listener = createEventListenerWrapperWithPriority(
       targetContainer,
       domEventName,
       eventSystemFlags
     );
     //...
     targetContainer = targetContainer;
     var unsubscribeListener;

     if (isCapturePhaseListener) {
       //节点上添加事件
       if (isPassiveListener !== undefined) {
         unsubscribeListener = addEventCaptureListenerWithPassiveFlag(
           targetContainer,
           domEventName,
           listener,
           isPassiveListener
         );
       } else {
         unsubscribeListener = addEventCaptureListener(
           targetContainer,
           domEventName,
           listener
         );
       }
     } else {
       if (isPassiveListener !== undefined) {
         unsubscribeListener = addEventBubbleListenerWithPassiveFlag(
           targetContainer,
           domEventName,
           listener,
           isPassiveListener
         );
       } else {
         unsubscribeListener = addEventBubbleListener(
           targetContainer,
           domEventName,
           listener
         );
       }
     }
   }
   ```

4. createEventListenerWrapperWithPriority

   ```js
   function createEventListenerWrapperWithPriority(
     targetContainer,
     domEventName,
     eventSystemFlags
   ) {
     var eventPriority = getEventPriorityForPluginSystem(domEventName);
     var listenerWrapper;

     switch (eventPriority) {
       case DiscreteEvent:
         listenerWrapper = dispatchDiscreteEvent;
         break;

       case UserBlockingEvent:
         listenerWrapper = dispatchUserBlockingUpdate;
         break;

       case ContinuousEvent:
       default:
         listenerWrapper = dispatchEvent;
         break;
     }
     //绑定dispatchDiscreteEvent
     return listenerWrapper.bind(
       null,
       domEventName,
       eventSystemFlags,
       targetContainer
     );
   }
   ```

### 事件触发

1. dispatchDiscreteEvent(dispatchEvent)

   ```js
   function dispatchDiscreteEvent(
     domEventName,
     eventSystemFlags,
     container,
     nativeEvent
   ) {
     {
       flushDiscreteUpdatesIfNeeded(nativeEvent.timeStamp);
     }

     discreteUpdates(
       dispatchEvent,
       domEventName,
       eventSystemFlags,
       container,
       nativeEvent
     );
   }
   ```

2. unstable_runWithPriority

   ```js
   function unstable_runWithPriority(priorityLevel, eventHandler) {
     //eventHandler就是dispatchEvent函数
     switch (priorityLevel) {
       case ImmediatePriority:
       case UserBlockingPriority:
       case NormalPriority:
       case LowPriority:
       case IdlePriority:
         break;

       default:
         priorityLevel = NormalPriority;
     }

     var previousPriorityLevel = currentPriorityLevel;
     currentPriorityLevel = priorityLevel;

     try {
       return eventHandler();
     } finally {
       currentPriorityLevel = previousPriorityLevel;
     }
   }
   ```

3. batchedEventUpdates

   ```js
   function batchedEventUpdates(fn, a, b) {
     if (isBatchingEventUpdates) {
       return fn(a, b);
     }

     isBatchingEventUpdates = true;

     try {
       return batchedEventUpdatesImpl(fn, a, b);
       //fn参数即：
       //function () {
       //	return dispatchEventsForPlugins(domEventName, eventSystemFlags, nativeEvent, 		       		 //ancestorInst);
     	//}
       function () {
       return dispatchEventsForPlugins(domEventName, eventSystemFlags, nativeEvent, ancestorInst);
     }
     } finally {
       isBatchingEventUpdates = false;
       finishEventHandler();
     }
   }
   ```

4. dispatchEventsForPlugins

   ```js
   function dispatchEventsForPlugins(
     domEventName,
     eventSystemFlags,
     nativeEvent,
     targetInst,
     targetContainer
   ) {
     var nativeEventTarget = getEventTarget(nativeEvent);
     var dispatchQueue = [];
     //extractEvent生成SyntheticEvent
     extractEvents(
       dispatchQueue,
       domEventName,
       targetInst,
       nativeEvent,
       nativeEventTarget,
       eventSystemFlags
     );
     //processDispatchQueue执行形成事件队列
     processDispatchQueue(dispatchQueue, eventSystemFlags);
   }
   ```

## 手写 miniReact

### 迷你 react 和真正的源码有哪些区别呢

- 在 render 阶段我们遍历了整颗 Fiber 树，在源码中如果节点什么都没改变会命中优化的逻辑，然后跳过这个节点的遍历
- commit 我们也遍历了整颗 Fiber 树，源码中只遍历带有 effect 的 Fiber 节点，也就是遍历 effectList
- 每次遍历的时候我们都是新建节点，源码中某些条件会复用节点
- 没有用到优先级

第一步：渲染器和入口函数

```js
const React = {
  createElement,
  render,
};

const container = document.getElementById("root");

const updateValue = (e) => {
  rerender(e.target.value);
};

const rerender = (value) => {
  const element = (
    <div>
      <input onInput={updateValue} value={value} />
      <h2>Hello {value}</h2>
    </div>
  );
  React.render(element, container);
};

rerender("World");
```

第二步：创建 dom 节点函数

```js
/创建element
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) => (typeof child === "object" ? child : createTextElement(child))),
    },
  };
}

//创建text类型
function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

//创建dom
function createDom(fiber) {
  const dom = fiber.type === "TEXT_ELEMENT" ? document.createTextNode("") : document.createElement(fiber.type);

  updateDom(dom, {}, fiber.props);

  return dom;
}
```

第三步：更新节点函数

```js
const isEvent = (key) => key.startsWith("on");
const isProperty = (key) => key !== "children" && !isEvent(key);
const isNew = (prev, next) => (key) => prev[key] !== next[key];
const isGone = (prev, next) => (key) => !(key in next);

//更新节点属性
function updateDom(dom, prevProps, nextProps) {
  //删除老的事件
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

  // 删除旧属性
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = "";
    });

  // 设置新属性
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = nextProps[name];
    });

  // 增加新事件
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
}
```

第四步：render 阶段

```js
//render阶段
function performUnitOfWork(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  const elements = fiber.props.children;
  reconcileChildren(fiber, elements);

  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}

//调协节点
function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;
  while (
    index < elements.length ||
    (oldFiber !== null && oldFiber !== undefined)
  ) {
    const element = elements[index];
    let newFiber = null;

    const sameType = oldFiber && element && element.type === oldFiber.type;

    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      };
    }
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      };
    }
    if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      wipFiber.child = newFiber;
    } else if (element) {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    index++;
  }
}
```

第五步：commit 阶段

```js
//commit阶段
function commitRoot() {
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}

//操作真实dom
function commitWork(fiber) {
  if (!fiber) {
    return;
  }

  const domParent = fiber.parent.dom;
  if (fiber.effectTag === "PLACEMENT" && fiber.dom !== null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom !== null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    domParent.removeChild(fiber.dom);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}
```

第六步：开始调度

```js
//渲染开始的入口
function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
}

//调度函数
function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    //render阶段
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot(); //commit阶段
  }

  requestIdleCallback(workLoop); //空闲调度
}

requestIdleCallback(workLoop);
```

完整代码

```js
//创建element
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === "object" ? child : createTextElement(child)
      ),
    },
  };
}

//创建text类型
function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

//创建dom
function createDom(fiber) {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  updateDom(dom, {}, fiber.props);

  return dom;
}

const isEvent = (key) => key.startsWith("on");
const isProperty = (key) => key !== "children" && !isEvent(key);
const isNew = (prev, next) => (key) => prev[key] !== next[key];
const isGone = (prev, next) => (key) => !(key in next);

//更新节点属性
function updateDom(dom, prevProps, nextProps) {
  //删除老的事件
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

  // 删除旧属性
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = "";
    });

  // 设置新属性
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = nextProps[name];
    });

  // 增加新事件
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
}

//commit阶段
function commitRoot() {
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}

//操作真实dom
function commitWork(fiber) {
  if (!fiber) {
    return;
  }

  const domParent = fiber.parent.dom;
  if (fiber.effectTag === "PLACEMENT" && fiber.dom !== null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom !== null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    domParent.removeChild(fiber.dom);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

let nextUnitOfWork = null;
let currentRoot = null;
let wipRoot = null;
let deletions = null;

//渲染开始的入口
function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
}

//调度函数
function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    //render阶段
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot(); //commit阶段
  }

  requestIdleCallback(workLoop); //空闲调度
}

requestIdleCallback(workLoop);

//render阶段
function performUnitOfWork(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  const elements = fiber.props.children;
  reconcileChildren(fiber, elements);

  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}

//调协节点
function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;
  while (
    index < elements.length ||
    (oldFiber !== null && oldFiber !== undefined)
  ) {
    const element = elements[index];
    let newFiber = null;

    const sameType = oldFiber && element && element.type === oldFiber.type;

    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      };
    }
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      };
    }
    if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      wipFiber.child = newFiber;
    } else if (element) {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    index++;
  }
}

const React = {
  createElement,
  render,
};

const container = document.getElementById("root");

const updateValue = (e) => {
  rerender(e.target.value);
};

const rerender = (value) => {
  const element = (
    <div>
      <input onInput={updateValue} value={value} />
      <h2>Hello {value}</h2>
    </div>
  );
  React.render(element, container);
};

rerender("World");
```

## 常见面试问题

至此我们介绍了 react 的理念，如果解决 cpu 和 io 的瓶颈，关键是实现异步可中断的更新

我们介绍了 react 源码架构（ui=fn(state)），从 scheduler 开始调度（根据过期事件判断优先级），经过 render 阶段的深度优先遍历形成 effectList（中间会执行 reconcile|diff），交给 commit 处理真实节点（中间穿插生命周期和部分 hooks），而这些调度的过程都离不开 Fiber 的支撑，Fiber 是工作单元，也是节点优先级、更新 UpdateQueue、节点信息的载体，Fiber 双缓存则提供了对比前后节点更新的基础。我们还介绍了 jsx 是 React.createElement 的语法糖。Lane 模型则提供了更细粒度的优先级对比和计算，这一切都为 concurrent mode 提供了基础，在这之上变可以实现 Suspense 和 batchedUpdate（16、17 版本实现的逻辑不一样），18 章 context 的 valueStack 和 valueCursor 在整个架构中运行机制，19 章介绍了新版事件系统，包括事件生产、监听和触发

### 面试题简答（详见视频源码角度讲解）

1. jsx 和 Fiber 有什么关系

   答：mount 时通过 jsx 对象（调用 createElement 的结果）调用 createFiberFromElement 生成 Fiber update 时通过 reconcileChildFibers 或 reconcileChildrenArray 对比新 jsx 和老的 Fiber（current Fiber）生成新的 wip Fiber 树

2. react17 之前 jsx 文件为什么要声明 import React from 'react'，之后为什么不需要了

   答：jsx 经过编译之后编程 React.createElement，不引入 React 就会报错，react17 改变了编译方式，变成了 jsx.createElement

   ```js
   function App() {
     return <h1>Hello World</h1>;
   }
   //转换后
   import { jsx as _jsx } from "react/jsx-runtime";

   function App() {
     return _jsx("h1", { children: "Hello world" });
   }
   ```

3. Fiber 是什么，它为什么能提高性能

   答：Fiber 是一个 js 对象，能承载节点信息、优先级、updateQueue，同时它还是一个工作单元。

   1. Fiber 双缓存可以在构建好 wip Fiber 树之后切换成 current Fiber，内存中直接一次性切换，提高了性能
   2. Fiber 的存在使异步可中断的更新成为了可能，作为工作单元，可以在时间片内执行工作，没时间了交还执行权给浏览器，下次时间片继续执行之前暂停之后返回的 Fiber
   3. Fiber 可以在 reconcile 的时候进行相应的 diff 更新，让最后的更新应用在真实节点上

**hooks**

1. 为什么 hooks 不能写在条件判断中

   答：hook 会按顺序存储在链表中，如果写在条件判断中，就没法保持链表的顺序

**状态/生命周期**

1. setState 是同步的还是异步的

   答：legacy 模式下：命中 batchedUpdates 时是异步 未命中 batchedUpdates 时是同步的

   concurrent 模式下：都是异步的

2. componentWillMount、componentWillMount、componentWillUpdate 为什么标记 UNSAFE

   答：新的 Fiber 架构能在 scheduler 的调度下实现暂停继续，排列优先级，Lane 模型能使 Fiber 节点具有优先级，在高优先级的任务打断低优先级的任务时，低优先级的更新可能会被跳过，所有以上生命周期可能会被执行多次，和之前版本的行为不一致。

**组件**

1. react 元素$$typeof 属性什么

   答：用来表示元素的类型，是一个 symbol 类型

2. react 怎么区分 Class 组件和 Function 组件

   答：Class 组件 prototype 上有 isReactComponent 属性

3. 函数组件和类组件的相同点和不同点

   答：相同点：都可以接收 props 返回 react 元素

   不同点：

   编程思想：类组件需要创建实例，面向对象，函数组件不需要创建实例，接收输入，返回输出，函数式编程

   内存占用：类组建需要创建并保存实例，占用一定的内存

   值捕获特性：函数组件具有值捕获的特性 下面的函数组件换成类组件打印的 num 一样吗

   ```js
   export default function App() {
     const [num, setNum] = useState(0);
     const click = () => {
       setTimeout(() => {
         console.log(num);
       }, 3000);
       setNum(num + 1);
     };

     return <div onClick={click}>click {num}</div>;
   }


   export default class App extends React.Component {
     state = {
       num: 0
     };

     click = () => {
       setTimeout(() => {
         console.log(this.state.num);
       }, 3000);
       this.setState({ num: this.state.num + 1 });
     };

     render() {
       return <div onClick={this.click}>click {this.state.num}</div>;
     }
   }


   ```

   可测试性：函数组件方便测试

   状态：类组件有自己的状态，函数组件没有只能通过 useState

   生命周期：类组件有完整生命周期，函数组件没有可以使用 useEffect 实现类似的生命周期

   逻辑复用：类组件继承 Hoc（逻辑混乱 嵌套），组合优于继承，函数组件 hook 逻辑复用

   跳过更新：shouldComponentUpdate PureComponent，React.memo

   发展未来：函数组件将成为主流，屏蔽 this、规范、复用，适合时间分片和渲染

**开放性问题**

1. 说说你对 react 的理解/请说一下 react 的渲染过程

   答：是什么：react 是构建用户界面的 js 库

   能干什么：可以用组件化的方式构建快速响应的 web 应用程序

   如何干：声明式（jsx） 组件化（方便拆分和复用 高内聚 低耦合） 一次学习随处编写

   做的怎么样： 优缺（社区繁荣 一次学习随处编写 api 简介）缺点（没有系统解决方案 选型成本高 过于灵活）

   设计理念：跨平台（虚拟 dom） 快速响应（异步可中断 增量更新）

   性能瓶颈：cpu io fiber 时间片 concurrent mode

   渲染过程：scheduler render commit Fiber 架构

2. 聊聊 react 生命周期 详见第 11 章

3. 简述 diff 算法 详见第 9 章

4. react 有哪些优化手段

   答：shouldComponentUpdate、不可变数据结构、列表 key、pureComponent、react.memo、useEffect 依赖项、useCallback、useMemo、bailoutOnAlreadyFinishedWork ...

5. react 为什么引入 jsx

   答：jsx 声明式 虚拟 dom 跨平台

   解释概念：jsx 是 js 语法的扩展 可以很好的描述 ui jsx 是 React.createElement 的语法糖

   想实现什么目的：声明式 代码结构简洁 可读性强 结构样式和事件可以实现高内聚 低耦合 、复用和组合 不需要引入新的概念和语法 只写 js， 虚拟 dom 跨平

   有哪些可选方案：模版语法 vue ag 引入了控制器 作用域 服务等概念

   jsx 原理：babel 抽象语法树 classic 是老的转换 automatic 新的转换

6. 说说 virtual Dom 的理解

   答：是什么：React.createElement 函数返回的就是虚拟 dom，用 js 对象描述真实 dom 的 js 对象

   优点：处理了浏览器的兼容性 防范 xss 攻击 跨平台 差异化更新 减少更新的 dom 操作

   缺点：额外的内存 初次渲染不一定快

7. 你对合成事件的理解

   | 类型         | 原生事件   | 合成事件               |
   | ------------ | ---------- | ---------------------- |
   | 命名方式     | 全小写     | 小驼峰                 |
   | 事件处理函数 | 字符串     | 函数对象               |
   | 阻止默认行为 | 返回 false | event.preventDefault() |
   |              |            |                        |

   理解：

   - React 把事件委托到 document 上（v17 是 container 节点上）
   - 先处理原生事件 冒泡到 document 上在处理 react 事件
   - React 事件绑定发生在 reconcile 阶段 会在原生事件绑定前执行

   优势：

   - 进行了浏览器兼容。顶层事件代理，能保证冒泡一致性(混合使用会出现混乱)
   - 默认批量更新
   - 避免事件对象频繁创建和回收，react 引入事件池，在事件池中获取和释放对象（react17 中废弃） react17 事件绑定在容器上了

   1. 我们写的事件是绑定在`dom`上么，如果不是绑定在哪里？ 答：v16 绑定在 document 上，v17 绑定在 container 上
   2. 为什么我们的事件手动绑定`this`(不是箭头函数的情况) 答：合成事件监听函数在执行的时候会丢失上下文
   3. 为什么不能用 `return false `来阻止事件的默认行为？ 答：说到底还是合成事件和原生事件触发时机不一样
   4. `react`怎么通过`dom`元素，找到与之对应的 `fiber`对象的？ 答：通过 internalInstanceKey 对应![react源码18.2](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs20210529110015.png)

**解释结果和现象**

1. 点击 Father 组件的 div，Child 会打印 Child 吗

   ```js
   function Child() {
     console.log("Child");
     return <div>Child</div>;
   }

   function Father(props) {
     const [num, setNum] = React.useState(0);
     return (
       <div
         onClick={() => {
           setNum(num + 1);
         }}
       >
         {num}
         {props.children}
       </div>
     );
   }

   function App() {
     return (
       <Father>
         <Child />
       </Father>
     );
   }

   const rootEl = document.querySelector("#root");
   ReactDOM.render(<App />, rootEl);
   ```

   答： 不会，源码中是否命中 bailoutOnAlreadyFinishedWork

2. 打印顺序是什么

   ```js
   function Child() {
     useEffect(() => {
       console.log("Child");
     }, []);
     return <h1>child</h1>;
   }

   function Father() {
     useEffect(() => {
       console.log("Father");
     }, []);

     return <Child />;
   }

   function App() {
     useEffect(() => {
       console.log("App");
     }, []);

     return <Father />;
   }
   ```

   答：Child ，Father ，App ，render 阶段 mount 时深度优先遍历，commit 阶段 useEffect 执行时机

3. useLayout/componentDidMount 和 useEffect 的区别是什么

   ```js
   class App extends React.Component {
     componentDidMount() {
       console.log("mount");
     }
   }

   useEffect(() => {
     console.log("useEffect");
   }, []);
   ```

   答：他们在 commit 阶段不同时机执行，useEffect 在 commit 阶段结尾异步调用，useLayout/componentDidMount 同步调用

   ![react源码20.1](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs20210529110019.png)

4. 如何解释 demo_4、demo_8、demo_9 出现的现象

   答：demo_4：useEffect 和 useLayoutEffect 的区别 demo_8：任务的优先级有关，见源码分析视频 demo_9：批量更新有关，见源码分析视频
