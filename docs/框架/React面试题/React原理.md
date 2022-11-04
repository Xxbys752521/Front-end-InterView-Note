---
sidebar_position: 9
description: React原理
---

## react 原理

### 1.为什么 React 要用 JSX？

JSX 是一个 JavaScript 的语法扩展，或者说是一个类似于 XML 的 ECMAScript 语法扩展。它本身没有太多的语法定义，也不期望引入更多的标准。

其实 React 本身并不强制使用 JSX。在没有 JSX 的时候，React 实现一个组件依赖于使用 React.createElement 函数。代码如下：

```jsx
class Hello extends React.Component {
  render() {
    return React.createElement("div", null, `Hello ${this.props.toWhat}`);
  }
}
ReactDOM.render(
  React.createElement(Hello, { toWhat: "World" }, null),
  document.getElementById("root")
);
```

而 JSX 更像是一种语法糖，通过类似 XML 的描述方式，描写函数对象。在采用 JSX 之后，这段代码会这样写：

```jsx
class Hello extends React.Component {
  render() {
    return <div>Hello {this.props.toWhat}</div>;
  }
}
ReactDOM.render(<Hello toWhat="World" />, document.getElementById("root"));
```

通过对比，可以清晰地发现，代码变得更为简洁，而且代码结构层次更为清晰。

因为 React 需要将组件转化为虚拟 DOM 树，所以在编写代码时，实际上是在手写一棵结构树。而**XML 在树结构的描述上天生具有可读性强的优势。**

但这样可读性强的代码仅仅是给写程序的同学看的，实际上在运行的时候，会使用 Babel 插件将 JSX 语法的代码还原为 React.createElement 的代码。

**总结：** JSX 是一个 JavaScript 的语法扩展，结构类似 XML。JSX 主要用于声明 React 元素，但 React 中并不强制使用 JSX。即使使用了 JSX，也会在构建过程中，通过 Babel 插件编译为 React.createElement。所以 JSX 更像是 React.createElement 的一种语法糖。

React 团队并不想引入 JavaScript 本身以外的开发体系。而是希望通过合理的关注点分离保持组件开发的纯粹性。

### 2.对 React 和 Vue 的理解，它们的异同

**相似之处：**

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

### 3.React Fiber

[这可能是最通俗的 React Fiber(时间分片) 打开方式](https://juejin.cn/post/6844903975112671239)

[浅谈对 React Fiber 的理解](https://juejin.cn/post/6926432527980691470)

#### 基本理论

代操作系统都是**多任务操作系统**. 进程的调度策略如果按照 CPU 核心数来划分，可以分为**单处理器调度**和**多处理器调度**。本文只关注的是单处理器调度，因为它可以类比 JavaScript 的运行机制

**为了实现进程的并发，操作系统会按照一定的调度策略，将 CPU 的执行权分配给多个进程，多个进程都有被执行的机会，让它们交替执行，形成一种“同时在运行”假象, 因为 CPU 速度太快，人类根本感觉不到。实际上在单核的物理环境下同时只能有一个程序在运行**

进程**调度策略**

**先到先得(First-Come-First-Served, FCFS)**

这是最简单的调度策略, 简单说就是**没有调度**。谁先来谁就先执行，执行完毕后就执行下一个。不过如果中间某些进程因为 I/O 阻塞了，这些进程会挂起移回就绪队列(说白了就是重新排队).

`FCFS` 上面 `DOS` 的单任务操作系统没有太大的区别。所以非常好理解，因为生活中到处是这样的例子:。

- **FCFS 对`短进程`不利**。 短进程即执行时间非常短的进程，可以用饭堂排队来比喻: _在饭堂排队打饭的时候，最烦那些一个人打包好好几份的人，这些人就像`长进程`一样，霸占着 CPU 资源，后面排队只打一份的人会觉得很吃亏，打一份的人会觉得他们优先级应该更高，毕竟他们花的时间很短，反正你打包那么多份再等一会也是可以的，何必让后面那么多人等这么久..._
- **FCFS 对`I/O密集`不利**。I/O 密集型进程(这里特指同步 I/O)在进行 I/O 操作时，会阻塞休眠，这会导致进程重新被放入就绪队列，等待下一次被宠幸。 可以类比 ZF 部门办业务: _假设 CPU 一个窗口、I/O 一个窗口。在 CPU 窗口好不容易排到你了，这时候发现一个不符合条件或者漏办了, 需要去 I/O 搞一下，Ok 去 I/O 窗口排队，I/O 执行完了，到 CPU 窗口又得重新排队。对于这些丢三落四的人很不公平..._

所以 FCFS 这种原始的策略在单处理器进程调度中并不受欢迎

**轮转**

这是一种基于时钟的**抢占策略**，这也是抢占策略中最简单的一种: **公平地给每一个进程一定的执行时间，当时间消耗完毕或阻塞，操作系统就会调度其他进程，将执行权抢占过来**。

> **决策模式**: `抢占策略`相对应的有`非抢占策略`，非抢占策略指的是让进程运行直到结束、阻塞(如 I/O 或睡眠)、或者主动让出控制权；抢占策略支持中断正在运行的进程，将主动权掌握在操作系统这里，不过通常开销会比较大。

这种调度策略的要点是**确定合适的时间片长度**: 太长了，长进程霸占太久资源，其他进程会得不到响应(等待执行时间过长)，这时候就跟上述的 `FCFS` 没什么区别了; 太短了也不好，因为进程抢占和切换都是需要成本的, 而且成本不低，时间片太短，时间可能都浪费在上下文切换上了，导致进程干不了什么实事。

因此**时间片的长度最好符合大部分进程完成一次典型交互所需的时间**.

轮转策略非常容易理解，只不过确定时间片长度需要伤点脑筋；另外和`FCFS`一样，轮转策略对 I/O 进程还是不公平。

**2️⃣ 最短进程优先(Shortest Process Next, SPN)**

上面说了`先到先得`策略对`短进程`不公平，`最短进程优先`索性就让'最短'的进程优先执行，也就是说: **按照进程的预估执行时间对进程进行优先级排序，先执行完短进程，后执行长进程。这是一种非抢占策略**。

这样可以让短进程能得到较快的响应。但是怎么获取或者**评估进程执行时间**呢？一是让程序的提供者提供，这不太靠谱；二是由操作系统来收集进程运行数据，并对它们进程统计分析。例如最简单的是计算它们的平均运行时间。不管怎么说都比上面两种策略要复杂一点。

`SPN` 的缺陷是: 如果系统有大量的短进程，那么长进程可能会饥饿得不到响应。

另外因为它不是抢占性策略, 尽管现在短进程可以得到更多的执行机会，但是还是没有解决 `FCFS` 的问题: 一旦长进程得到 CPU 资源，得等它执行完，导致后面的进程得不到响应。

**3️⃣ 最短剩余时间(Shortest Remaining Time, SRT)**

**SRT 进一步优化了 SPN，增加了抢占机制**。在 SPN 的基础上，当一个进程添加到就绪队列时，操作系统会比较*刚添加的新进程*和*当前正在执行的老进程*的‘剩余时间’，如果新进程剩余时间更短，新进程就会抢占老进程。

相比轮转的抢占，SRT 没有中断处理的开销。但是在 SPN 的基础上，操作系统需要记录进程的历史执行时间，这是新增的开销。**另外长进程饥饿问题还是没有解决**。

**4️⃣ 最高响应比优先(HRRN)**

**为了解决长进程饥饿问题，同时提高进程的响应速率**。还有一种`最高响应比优先的`策略，首先了解什么是响应比:

```
响应比 = （等待执行时间 + 进程执行时间） / 进程执行时间
```

**这种策略会选择响应比最高的进程优先执行**：

- 对于短进程来说，因为执行时间很短，分母很小，所以响应比比较高，会被优先执行
- 对于长进程来说，执行时间长，一开始响应比小，但是随着等待时间增长，它的优先级会越来越高，最终可以被执行

**5️⃣ 反馈法**

SPN、SRT、HRRN 都需要对进程时间进行评估和统计，实现比较复杂且需要一定开销。而反馈法采取的是**事后反馈**的方式。这种策略下: **每个进程一开始都有相同的优先级，每次被抢占(需要配合其他抢占策略使用，如轮转)，优先级就会降低一级。因此通常它会根据优先级划分多个队列**。

举个例子:

```
队列1
队列2
...
队列N
```

新增的任务会推入`队列1`，`队列1`会按照`轮转策略`以一个时间片为单位进行调度。短进程可以很快得到响应，而对于长进程可能一个时间片处理不完，就会被抢占，放入`队列2`。

`队列2`会在`队列1`任务清空后被执行，有时候低优先级队列可能会等待很久才被执行，所以一般会给予一定的补偿，例如增加执行时间，所以`队列2`的轮转时间片长度是 2。

反馈法仍然可能导致长进程饥饿，所以操作系统可以统计长进程的等待时间，当等待时间超过一定的阈值，可以选择提高它们的优先级。

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsGhC8L3Fj7cQUHYA.webp)

没有一种调度策略是万能的, 它需要考虑很多因素:

- 响应速率。进程等待被执行的时间
- 公平性。兼顾短进程、长进程、I/O 进程

这两者在某些情况下是对立的，提高了响应，可能会减低公平性，导致饥饿。短进程、长进程、I/O 进程之间要取得平衡也非常难。

#### Fiber 出现的背景

JavaScript 引擎和页面渲染引擎两个线程是互斥的，当其中一个线程执行时，另一个线程只能挂起等待。

在这样的机制下，如果 JavaScript 线程长时间地占用了主线程，那么渲染层面的更新就不得不长时间地等待，界面长时间不更新，会导致页面响应度变差，用户可能会感觉到卡顿。

而这正是 React 15 的 Stack Reconciler 所面临的问题，即是 JavaScript 对主线程的超时占用问题。Stack Reconciler 是一个同步的递归过程，使用的是 JavaScript 引擎自身的函数调用栈，它会一直执行到栈空为止，所以当 React 在渲染组件时，从开始到渲染完成整个过程是一气呵成的。如果渲染的组件比较庞大，js 执行会占据主线程较长时间，会导致页面响应度变差。

而且所有的任务都是按照先后顺序，没有区分优先级，这样就会导致优先级比较高的任务也无法被优先执行

#### Fiber 优点

JavaScript 是[单线程运行](https://juejin.cn/post/6844903553795014663)的，而且在浏览器环境屁事非常多，它要负责页面的 JS 解析和执行、绘制、事件处理、静态资源加载和处理, 这些任务可以类比上面’进程‘。

> 这里特指 Javascript 引擎是单线程运行的。 严格来说，Javascript 引擎和页面渲染引擎在同一个`渲染线程`，GUI 渲染和 Javascript 执行 两者是互斥的. 另外异步 I/O 操作底层实际上可能是多线程的在驱动。

**它只是一个'JavaScript'，同时只能做一件事情，这个和 `DOS` 的单任务操作系统一样的，事情只能一件一件的干。要是前面有一个傻叉任务长期霸占 CPU，后面什么事情都干不了，浏览器会呈现卡死的状态，这样的用户体验就会非常差**。

**解决这种问题有三个方向**:

- 1️⃣ 优化每个任务，让它有多快就多快。挤压 CPU 运算量
- 2️⃣ 快速响应用户，让用户觉得够快，不能阻塞用户的交互
- 3️⃣ 尝试 Worker 多线程

在 Reconcilation 期间，React 会霸占着浏览器资源，一则会导致用户触发的事件得不到响应, 二则会导致掉帧，用户可以感知到这些卡顿。

React 的 Reconcilation 是 CPU 密集型的操作, 它就相当于我们上面说的’长进程‘。所以初衷和进程调度一样，我们要让高优先级的进程或者短进程优先运行，不能让长进程长期霸占资源。

为了给用户制造一种应用很快的'假象'，我们不能让一个程序长期霸占着资源. 你可以将浏览器的渲染、布局、绘制、资源加载(例如 HTML 解析)、事件响应、脚本执行视作操作系统的'进程'，我们需要通过某些调度策略合理地分配 CPU 资源，从而提高浏览器的用户响应速率, 同时兼顾任务执行效率

**所以 React 通过 Fiber 架构，让自己的 Reconcilation 过程变成可被中断。 '适时'地让出 CPU 执行权，除了可以让浏览器及时地响应用户的交互，还有其他好处**:

与其一次性操作大量 DOM 节点相比, 分批延时对 DOM 进行操作，可以得到更好的用户体验

给浏览器一点喘息的机会，他会对代码进行编译优化（JIT）及进行热代码优化，或者对 reflow 进行修正.

#### Fiber 是什么

Fiber 的中文翻译叫纤程，与进程、线程同为程序执行过程，Fiber 就是比线程还要纤细的一个过程。纤程意在对渲染过程实现进行更加精细的控制。

从架构角度来看，Fiber 是对 React 核心算法（即调和过程）的重写。

从编码角度来看，Fiber 是 React 内部所定义的一种数据结构，它是 Fiber 树结构的节点单位，也就是 React 16 新架构下的"虚拟 DOM"。

一个 fiber 就是一个 JavaScript 对象，Fiber 的数据结构如下：

```js
type Fiber = {
  // 用于标记fiber的WorkTag类型，主要表示当前fiber代表的组件类型如FunctionComponent、ClassComponent等
  tag: WorkTag,
  // ReactElement里面的key
  key: null | string,
  // ReactElement.type，调用`createElement`的第一个参数
  elementType: any,
  // The resolved function/class/ associated with this fiber.
  // 表示当前代表的节点类型
  type: any,
  // 表示当前FiberNode对应的element组件实例
  stateNode: any,

  // 指向他在Fiber节点树中的`parent`，用来在处理完这个节点之后向上返回
  return: Fiber | null,
  // 指向自己的第一个子节点
  child: Fiber | null,
  // 指向自己的兄弟结构，兄弟节点的return指向同一个父节点
  sibling: Fiber | null,
  index: number,

  ref: null | (((handle: mixed) => void) & { _stringRef: ?string }) | RefObject,

  // 当前处理过程中的组件props对象
  pendingProps: any,
  // 上一次渲染完成之后的props
  memoizedProps: any,

  // 该Fiber对应的组件产生的Update会存放在这个队列里面
  updateQueue: UpdateQueue<any> | null,

  // 上一次渲染的时候的state
  memoizedState: any,

  // 一个列表，存放这个Fiber依赖的context
  firstContextDependency: ContextDependency<mixed> | null,

  mode: TypeOfMode,

  // Effect
  // 用来记录Side Effect
  effectTag: SideEffectTag,

  // 单链表用来快速查找下一个side effect
  nextEffect: Fiber | null,

  // 子树中第一个side effect
  firstEffect: Fiber | null,
  // 子树中最后一个side effect
  lastEffect: Fiber | null,

  // 代表任务在未来的哪个时间点应该被完成，之后版本改名为 lanes
  expirationTime: ExpirationTime,

  // 快速确定子树中是否有不在等待的变化
  childExpirationTime: ExpirationTime,

  // fiber的版本池，即记录fiber更新过程，便于恢复
  alternate: Fiber | null,
};
```

> 在 2020 年 5 月，以 expirationTime 属性为代表的优先级模型被 lanes 取代。

#### Fiber 如何解决问题的

Fiber 把一个渲染任务分解为多个渲染任务，而不是一次性完成，把每一个分割得很细的任务视作一个"执行单元"，React 就会检查现在还剩多少时间，如果没有时间就将控制权让出去，故任务会被分散到多个帧里面，中间可以返回至主进程控制执行其他任务，最终实现更流畅的用户体验。

即是实现了"增量渲染"，实现了可中断与恢复，恢复后也可以复用之前的中间状态，并给不同的任务赋予不同的优先级，其中每个任务更新单元为 React Element 对应的 Fiber 节点。

#### Fiber 实现原理

实现的方式是`requestIdleCallback`这一 API，但 React 团队 polyfill 了这个 API，使其对比原生的浏览器兼容性更好且拓展了特性。

> `window.requestIdleCallback()`方法将在浏览器的空闲时段内调用的函数排队。这使开发者能够在主事件循环上执行后台和低优先级工作，而不会影响延迟关键事件，如动画和输入响应。函数一般会按先进先调用的顺序执行，然而，如果回调函数指定了执行超时时间 timeout，则有可能为了在超时前执行函数而打乱执行顺序。

`requestIdleCallback`回调的执行的前提条件是当前浏览器处于空闲状态。

即`requestIdleCallback`的作用是在浏览器一帧的剩余空闲时间内执行优先度相对较低的任务。首先 React 中任务切割为多个步骤，分批完成。**在完成一部分任务之后，将控制权交回给浏览器，让浏览器有时间再进行页面的渲染**。等浏览器忙完之后有剩余时间，再继续之前 React 未完成的任务，是一种合作式调度。

简而言之，由浏览器给我们分配执行时间片，我们要按照约定在这个时间内执行完毕，并将控制权还给浏览器。

React 16 的`Reconciler`基于 Fiber 节点实现，被称为 Fiber Reconciler。

作为静态的数据结构来说，每个 Fiber 节点对应一个 React element，保存了该组件的类型（函数组件/类组件/原生组件等等）、对应的 DOM 节点等信息。

作为动态的工作单元来说，每个 Fiber 节点保存了本次更新中该组件改变的状态、要执行的工作。

每个 Fiber 节点有个对应的 React element，多个 Fiber 节点是如何连接形成树呢？靠如下三个属性：

```javascript
// 指向父级Fiber节点
this.return = null;
// 指向子Fiber节点
this.child = null;
// 指向右边第一个兄弟Fiber节点
this.sibling = null;
```

#### Fiber 架构核心

Fiber 架构可以分为三层：

- Scheduler 调度器 —— 调度任务的优先级，高优任务优先进入 Reconciler
- Reconciler 协调器 —— 负责找出变化的组件
- Renderer 渲染器 —— 负责将变化的组件渲染到页面上

相比 React15，React16 多了**Scheduler（调度器）**，调度器的作用是调度更新的优先级。

在新的架构模式下，工作流如下：

- 每个更新任务都会被赋予一个优先级。
- 当更新任务抵达调度器时，高优先级的更新任务（记为 A）会更快地被调度进 Reconciler 层；
- 此时若有新的更新任务（记为 B）抵达调度器，调度器会检查它的优先级，若发现 B 的优先级高于当前任务 A，那么当前处于 Reconciler 层的 A 任务就会被中断，调度器会将 B 任务推入 Reconciler 层。
- 当 B 任务完成渲染后，新一轮的调度开始，之前被中断的 A 任务将会被重新推入 Reconciler 层，继续它的渲染之旅，即“可恢复”。

**Fiber 架构的核心即是"可中断"、"可恢复"、"优先级"**

#### Scheduler 调度器

这个需要上面提到的`requestIdleCallback`，React 团队实现了功能更完备的 `requestIdleCallback` polyfill，这就是 Scheduler。除了在空闲时触发回调的功能外，Scheduler 还提供了多种调度优先级供任务设置。

#### Reconciler 协调器

在 React 15 中是递归处理虚拟 DOM 的，React 16 则是变成了可以中断的循环过程，每次循环都会调用`shouldYield`判断当前是否有剩余时间。

```javascript
function workLoopConcurrent() {
  // Perform work until Scheduler asks us to yield
  while (workInProgress !== null && !shouldYield()) {
    // workInProgress表示当前工作进度的树。
    workInProgress = performUnitOfWork(workInProgress);
  }
}
```

React 16 是如何解决中断更新时 DOM 渲染不完全的问题呢？

在 React 16 中，`Reconciler`与`Renderer`不再是交替工作。当`Scheduler`将任务交给`Reconciler`后，`Reconciler`会为变化的虚拟 DOM 打上的标记。

```javascript
export const Placement = /*             */ 0b0000000000010;
export const Update = /*                */ 0b0000000000100;
export const PlacementAndUpdate = /*    */ 0b0000000000110;
export const Deletion = /*              */ 0b0000000001000;
```

- `Placement`表示插入操作
- `PlacementAndUpdate`表示替换操作
- `Update`表示更新操作
- `Deletion`表示删除操作

整个`Scheduler`与`Reconciler`的工作都在内存中进行，所以即使反复中断，用户也不会看见更新不完全的 DOM。只有当所有组件都完成`Reconciler`的工作，才会统一交给`Renderer`。

#### Renderer 渲染器

`Renderer`根据`Reconciler`为虚拟 DOM 打的标记，同步执行对应的 DOM 操作。

#### Fiber 架构对生命周期的影响

![d8eb7f64f3f94a9f8038949001284385](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgssdbO71P4LqIu295.png)

1. render 阶段：纯净且没有副作用，可能会被 React 暂停、终止或重新启动。
2. pre-commit 阶段：可以读取 DOM。
3. commit 阶段：可以使用 DOM，运行副作用，安排更新。

其中 pre-commit 和 commit 从大阶段上来看都属于 commit 阶段。

在 render 阶段，React 主要是在内存中做计算，明确 DOM 树的更新点；而 commit 阶段，则负责把 render 阶段生成的更新真正地执行掉。

新老两种架构对 React 生命周期的影响主要在 render 这个阶段，这个影响是通过增加 Scheduler 层和改写 Reconciler 层来实现的。

在 render 阶段，一个庞大的更新任务被分解为了一个个的工作单元，这些工作单元有着不同的优先级，React 可以根据优先级的高低去实现工作单元的打断和恢复。

而这次从 Firber 机制 render 阶段的角度看这三个生命周期，这三个生命周期的共同特点是都处于 render 阶段：

```jsx
componentWillMount;
componentWillUpdate;
componentWillReceiveProps;
```

由于 render 阶段是允许暂停、终止和重启的，这就导致 render 阶段的生命周期都有可能被重复执行，故也是废弃他们的原因之一。

#### Fiber 更新过程

虚拟 DOM 更新过程分为 2 个阶段：

- **render/reconciliation 协调阶段(可中断/异步)**：通过 Diff 算法找出所有节点变更，例如节点新增、删除、属性变更等等, 获得需要更新的节点信息，对应早期版本的 Diff 过程。
- **commit 提交阶段(不可中断/同步)**：将需要更新的节点一次过批量更新，对应早期版本的 patch 过程。

![reactfiber](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsreactfiber.png)

##### 协调阶段

在协调阶段会进行 Diff 计算，会生成一棵 Fiber 树。

该阶段开始于`performSyncWorkOnRoot`或`performConcurrentWorkOnRoot`方法的调用。这取决于本次更新是同步更新还是异步更新。

```javascript
// performSyncWorkOnRoot会调用该方法
function workLoopSync() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

// performConcurrentWorkOnRoot会调用该方法
function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}
```

它们唯一的区别是是否调用`shouldYield`。如果当前浏览器帧没有剩余时间，`shouldYield`会中止循环，直到浏览器有空闲时间后再继续遍历。

`workInProgress`代表当前已创建的 workInProgress fiber。

`performUnitOfWork`方法将触发对 `beginWork` 的调用，进而实现对新 Fiber 节点的创建。若 `beginWork` 所创建的 Fiber 节点不为空，则 `performUniOfWork` 会用这个新的 Fiber 节点来更新 `workInProgress` 的值，为下一次循环做准备。

通过循环调用 `performUnitOfWork` 来触发 `beginWork`，新的 Fiber 节点就会被不断地创建。当 `workInProgress` 终于为空时，说明没有新的节点可以创建了，也就意味着已经完成对整棵 Fiber 树的构建。

我们知道 Fiber Reconciler 是从 Stack Reconciler 重构而来，通过遍历的方式实现可中断的递归，所以`performUnitOfWork`的工作可以分为两部分："递"和"归"。

**"递阶段"**

首先从 rootFiber 开始向下深度优先遍历。为遍历到的每个 Fiber 节点调用`beginWork`方法。

```javascript
function beginWork(
  current: Fiber | null, // 当前组件对应的Fiber节点在上一次更新时的Fiber节点
  workInProgress: Fiber, // 当前组件对应的Fiber节点
  renderExpirationTime: ExpirationTime // 优先级相关
): Fiber | null {
  // ...省略函数体
}
```

该方法会根据传入的 Fiber 节点创建子 Fiber 节点，并将这两个 Fiber 节点连接起来。

当遍历到叶子节点（即没有子组件的组件）时就会进入"归"阶段。

**"归阶段"**

在"归"阶段会调用`completeWork`处理 Fiber 节点。

> completeWork 将根据 workInProgress 节点的 tag 属性的不同，进入不同的 DOM 节点的创建、处理逻辑。

completeWork 内部有 3 个关键动作：

- 创建 DOM 节点（CreateInstance）
- 将 DOM 节点插入到 DOM 树中（AppendAllChildren）
- 为 DOM 节点设置属性（FinalizeInitialChildren）

当某个 Fiber 节点执行完`completeWork`，如果其存在兄弟 Fiber 节点（即`fiber.sibling !== null`），会进入其兄弟 Fiber 的"递"阶段。

如果不存在兄弟 Fiber，会进入父级 Fiber 的"归"阶段。

"递"和"归"阶段会交错执行直到"归"到 rootFiber。至此，协调阶段的工作就结束了。

##### commit 提交阶段

commit 阶段的主要工作（即 Renderer 的工作流程）分为三部分：

- before mutation 阶段，这个阶段 DOM 节点还没有被渲染到界面上去，过程中会触发 `getSnapshotBeforeUpdate`，也会处理 `useEffect` 钩子相关的调度逻辑。
- mutation 阶段，这个阶段负责 DOM 节点的渲染。在渲染过程中，会遍历 effectList，根据 flags（effectTag）的不同，执行不同的 DOM 操作。
- layout 阶段，这个阶段处理 DOM 渲染完毕之后的收尾逻辑。比如调用 `componentDidMount/componentDidUpdate`，调用 `useLayoutEffect` 钩子函数的回调等。除了这些之外，它还会把 fiberRoot 的 current 指针指向 workInProgress Fiber 树。

### 4.**React 性能优化**

React 应用也是前端应用，如果之前你知道一些前端项目普适的性能优化手段，比如资源加载过程中的优化、减少重绘与回流、服务端渲染、启用 CDN 等，那么这些手段对于 React 来说也是同样奏效的。

不过对于 React 项目来说，它有一个区别于传统前端项目的重要特点，就是**以 React 组件的形式来组织逻辑**：组件允许我们将 UI 拆分为独立可复用的代码片段，并对每个片段进行独立构思。因此，除了前面所提到的普适的前端性能优化手段之外，React 还有一些充满了自身特色的性能优化思路，这些思路基本都围绕“组件性能优化”这个中心思想展开

1. **使用 shouldComponentUpdate 规避冗余的更新逻辑**
2. **PureComponent + Immutable.js**
3. **React.memo 与 useMemo**

#### 善用 shouldComponentUpdate

shouldComponentUpdate 是 React 类组件的一个生命周期。关于 shouldComponentUpdate 是什么，我们已经在第 02 讲有过介绍，这里先简单复习一下。

shouldComponentUpdate 的调用形式如下：

```jsx
shouldComponentUpdate(nextProps, nextState);
```

render 方法由于伴随着对虚拟 DOM 的构建和对比，过程可以说相当耗时。而在 React 当中，很多时候我们会不经意间就频繁地调用了 render。为了避免不必要的 render 操作带来的性能开销，React 提供了 shouldComponentUpdate 这个口子。**React 组件会根据 shouldComponentUpdate 的返回值，来决定是否执行该方法之后的生命周期，进而决定是否对组件进行 re-render（重渲染）**。

shouldComponentUpdate 的默认值为 true，也就是说 **“无条件 re-render”**。在实际的开发中，我们往往通过手动往 shouldComponentUpdate 中填充判定逻辑，来实现“有条件的 re-render”。

接下来我们通过一个 Demo，来感受一下 shouldComponentUpdate 到底是如何解决问题的。在这个 Demo 中会涉及 3 个组件：子组件 ChildA、ChildB 及父组件 App 组件。

首先我们来看两个子组件的代码，这里为了尽量简化与数据变更无关的逻辑，ChildA 和 ChildB 都只负责从父组件处读取数据并渲染，它们的编码分别如下所示。

ChildA.js：

```jsx
import React from "react";
export default class ChildA extends React.Component {
  render() {
    console.log("ChildA 的render方法执行了");
    return (
      <div className="childA">
        子组件A的内容：
        {this.props.text}
      </div>
    );
  }
}
```

ChildB.js：

```jsx
import React from "react";
export default class ChildB extends React.Component {
  render() {
    console.log("ChildB 的render方法执行了");
    return (
      <div className="childB">
        子组件B的内容：
        {this.props.text}
      </div>
    );
  }
}
```

在共同的父组件 App.js 中，会将 ChildA 和 ChildB 组合起来，并分别向其中注入数据：

```jsx
import React from "react";
import ChildA from "./ChildA";
import ChildB from "./ChildB";
class App extends React.Component {
  state = {
    textA: "我是A的文本",
    textB: "我是B的文本",
  };
  changeA = () => {
    this.setState({
      textA: "A的文本被修改了",
    });
  };
  changeB = () => {
    this.setState({
      textB: "B的文本被修改了",
    });
  };
  render() {
    return (
      <div className="App">
        <div className="container">
          <button onClick={this.changeA}>点击修改A处的文本</button>
          <button onClick={this.changeB}>点击修改B处的文本</button>
          <ul>
            <li>
              <ChildA text={this.state.textA} />
            </li>
            <li>
              <ChildB text={this.state.textB} />
            </li>
          </ul>
        </div>
      </div>
    );
  }
}
export default App;
```

App 组件最终渲染到界面上的效果如下图所示，两个子组件在图中分别被不同颜色的标注圈出：

![Drawing 0.png](https://s0.lgstatic.com/i/image/M00/8B/D3/CgqCHl_ga3-ADPKZAACHTPJhWNw299.png)

通过点击左右两个按钮，我们可以分别对 ChildA 和 ChildB 中的文案进行修改。

由于初次渲染时，两个组件的 render 函数都必然会被触发，因此控制台在挂载完成后的输出内容如下图所示：

![Drawing 1.png](https://s0.lgstatic.com/i/image2/M01/03/AA/CgpVE1_ga4qAdOlsAAAzU_bU8eQ279.png)

接下来我点击左侧的按钮，尝试对 A 处的文本进行修改。我们可以看到界面上只有 A 处的渲染效果发生了改变，如下图箭头处所示：

![Drawing 2.png](https://s0.lgstatic.com/i/image2/M01/03/A9/Cip5yF_ga5KALnO1AABLrDrgDGM452.png)

但是如果我们打开控制台，会发现输出的内容如下图所示：

![Drawing 3.png](https://s0.lgstatic.com/i/image2/M01/03/A9/Cip5yF_ga5qABE7ZAABs-adr_7k107.png)

这样的输出结果告诉我们，在刚刚的点击动作后，不仅 ChildA 的 re-render 被触发了，ChildB 的 re-render 也被触发了。

在 React 中，**只要父组件发生了更新，那么所有的子组件都会被无条件更新**。这就导致了 ChildB 的 props 尽管没有发生任何变化，它本身也没有任何需要被更新的点，却还是会走一遍更新流程。

> 注：同样的情况也适用于组件自身的更新：当组件自身调用了 setState 后，那么不管 setState 前后的状态内容是否真正发生了变化，它都会去走一遍更新流程。

而在刚刚这个更新流程中，shouldComponentUpdate 函数没有被手动定义，因此它将返回“true”这个默认值。“true”则意味着对更新流程不作任何制止，也即所谓的“无条件 re-render”。在这种情况下，我们就可以考虑使用 shouldComponentUpdate 来对更新过程进行管控，避免没有意义的 re-render 发生。

现在我们就可以为 ChildB 加装这样一段 shouldComponentUpdate 逻辑：

```jsx
shouldComponentUpdate(nextProps, nextState) {
  // 判断 text 属性在父组件更新前后有没有发生变化，若没有发生变化，则返回 false
  if(nextProps.text === this.props.text) {
    return false
  }
  // 只有在 text 属性值确实发生变化时，才允许更新进行下去
  return true
}
```

在这段逻辑中，我们对 ChildB 中的可变数据，也就是 this.props.text 这个属性进行了判断。

这样，当父组件 App 组件发生更新、进而试图触发 ChildB 的更新流程时，shouldComponentUpdate 就会充当一个“守门员”的角色：它会检查新下发的 props.text 是否和之前的值一致，如果一致，那么就没有更新的必要，直接返回“false”将整个 ChildB 的更新生命周期中断掉即可。只有当 props.text 确实发生变化时，它才会“准许” re-render 的发生。

在 shouldComponentUpdate 的加持下，当我们再次点击左侧按钮，试图修改 ChildA 的渲染内容时，控制台的输出就会变成下图这样：

![Drawing 4.png](https://s0.lgstatic.com/i/image2/M01/03/AA/CgpVE1_ga6yAVvq5AABmBay34YA804.png)

我们看到，控制台中现在只有 ChildA 的 re-render 提示。ChildB “稳如泰山”，成功躲开了一次多余的渲染。

使用 shouldComponentUpdate 来调停不必要的更新，避免无意义的 re-render 发生，这是 React 组件中最基本的性能优化手段，也是最重要的手段。许多看似高级的玩法，都是基于 shouldComponentUpdate 衍生出来的。我们接下来要讲的 PureComponent，就是这类玩法中的典型。

#### 进阶玩法：PureComponent + Immutable.js

##### PureComponent：提前帮你安排好更新判定逻辑

shouldComponentUpdate 虽然一定程度上帮我们解决了性能方面的问题，但每次避免 re-render，都要手动实现一次 shouldComponentUpdate，未免太累了。作为一个不喜欢重复劳动的前端开发者来说，在写了不计其数个 shouldComponentUpdate 逻辑之后，难免会怀疑人生，进而发出由衷的感叹——“这玩意儿要是能内置到组件里该多好啊！”。

哪里有需求，哪里就有产品。React 15.3 很明显听到了开发者的声音，它新增了一个叫 [PureComponent](https://zh-hans.reactjs.org/docs/react-api.html#reactpurecomponent) 的类，恰到好处地解决了“程序员写 shouldComponentUpdate 写出腱鞘炎”这个问题。

PureComponent 与 Component 的区别点，就在于它内置了对 shouldComponentUpdate 的实现：PureComponent 将会在 shouldComponentUpdate 中对组件更新前后的 props 和 state 进行**浅比较**，并根据浅比较的结果，决定是否需要继续更新流程。

“浅比较”将针对值类型数据对比其值是否相等，而针对数组、对象等引用类型的数据则对比其引用是否相等。

在我们开篇的 Demo 中，若把 ChildB 的父类从 Component 替换为 PureComponent（修改后的代码如下所示），那么无须手动编写 shouldComponentUpdate，也可以达到同样避免 re-render 的目的。

```jsx
import React from "react";
export default class ChildB extends React.PureComponent {
  render() {
    console.log("ChildB 的render方法执行了");
    return (
      <div className="childB">
        子组件B的内容：
        {this.props.text}
      </div>
    );
  }
}
```

此时再去修改 ChildA 中的文本，我们会发现 ChildB 同样不受影响。点击左侧按钮后，控制台对应的输出内容如下图高亮处所示：

![Drawing 5.png](https://s0.lgstatic.com/i/image2/M01/03/A9/Cip5yF_ga8qADhf9AACUfTqE0ag890.png)

在值类型数据这种场景下，PureComponent 可以说是战无不胜。但是如果数据类型为引用类型，那么这种基于浅比较的判断逻辑就会带来这样两个风险：

1. 若数据内容没变，但是引用变了，那么浅比较仍然会认为“数据发生了变化”，进而触发一次不必要的更新，导致过度渲染；
2. 若数据内容变了，但是引用没变，那么浅比较则会认为“数据没有发生变化”，进而阻断一次更新，导致不渲染。

怎么办呢？Immutable.js 来帮忙！

##### Immutable：“不可变值”让“变化”无处遁形

PureComponent 浅比较带来的问题，本质上是对“变化”的判断不够精准导致的。那有没有一种办法，能够让引用的变化和内容的变化之间，建立一种必然的联系呢？

这就是 Immutable.js 所做的事情。

Immutable 直译过来是“不可变的”，顾名思义，Immutable.js 是对“不可变值”这一思想的贯彻实践。它在 2014 年被 Facebook 团队推出，Facebook 给它的定位是“实现持久性数据结构的库”。**所谓“持久性数据”，指的是这个数据只要被创建出来了，就不能被更改。我们对当前数据的任何修改动作，都会导致一个新的对象的返回**。这就将数据内容的变化和数据的引用严格地关联了起来，使得“变化”无处遁形。

这里我用一个简单的例子，来演示一下 Immutable.js 的效果。请看下面代码：

```
// 引入 immutable 库里的 Map 对象，它用于创建对象
import { Map } from 'immutable'
// 初始化一个对象 baseMap
const baseMap = Map({
  name: '修言',
  career: '前端',
  age: 99
})
// 使用 immutable 暴露的 Api 来修改 baseMap 的内容
const changedMap = baseMap.set({
  age: 100
})
// 我们会发现修改 baseMap 后将会返回一个新的对象，这个对象的引用和 baseMap 是不同的
console.log('baseMap === changedMap', baseMap === changedMap)
```

由此可见，PureComonent 和 Immutable.js 真是一对好基友,在实际的开发中，我们也确实经常左手 PureComonent，右手 Immutable.js，研发质量大大地提升

> 值得注意的是，由于 Immutable.js 存在一定的学习成本，并不是所有场景下都可以作为最优解被团队采纳。因此，一些团队也会基于 PureComonent 和 Immutable.js 去打造将两者结合的公共类，通过改写 setState 来提升研发体验，这也是不错的思路。

#### 函数组件的性能优化：React.memo 和 useMemo

以上咱们讨论的都是类组件的优化思路。那么在函数组件中，有没有什么通用的手段可以阻止“过度 re-render”的发生呢？接下来我们就一起认识一下“函数版”的 shouldComponentUpdate/Purecomponent —— React.memo。

##### React.memo：“函数版”shouldComponentUpdate/PureComponent

React.memo 是 React 导出的一个顶层函数，它本质上是一个高阶组件，负责对函数组件进行包装。基本的调用姿势如下面代码所示：

```jsx
import React from "react";
// 定义一个函数组件
function FunctionDemo(props) {
  return xxx;
}
// areEqual 函数是 memo 的第二个入参，我们之前放在 shouldComponentUpdate 里面的逻辑就可以转移至此处
function areEqual(prevProps, nextProps) {
  /*
  return true if passing nextProps to render would return
  the same result as passing prevProps to render,
  otherwise return false
  */
}
// 使用 React.memo 来包装函数组件
export default React.memo(FunctionDemo, areEqual);
```

**React.memo 会帮我们“记住”函数组件的渲染结果，在组件前后两次 props 对比结果一致的情况下，它会直接复用最近一次渲染的结果**。如果我们的组件在相同的 props 下会渲染相同的结果，那么使用 React.memo 来包装它将是个不错的选择。

从示例中我们可以看出，React.memo 接收两个参数，第一个参数是我们需要渲染的目标组件，第二个参数 areEqual 则用来承接 props 的对比逻辑。**之前我们在 shouldComponentUpdate 里面做的事情，现在就可以放在 areEqual 里来做**。

比如开篇 Demo 中的 ChildB 组件，就完全可以用 Function Component + React.memo 来改造。改造后的 ChildB 代码如下：

```jsx
import React from "react";
// 将 ChildB 改写为 function 组件
function ChildB(props) {
  console.log("ChildB 的render 逻辑执行了");
  return (
    <div className="childB">
      子组件B的内容：
      {props.text}
    </div>
  );
}
// areEqual 用于对比 props 的变化
function areEqual(prevProps, nextProps) {
  if (prevProps.text === nextProps.text) {
    return true;
  }
  return false;
}
// 使用 React.memo 来包装 ChildB
export default React.memo(ChildB, areEqual);
```

改造后的组件在效果上就等价于 shouldComponentUpdate 加持后的类组件 ChildB。

**这里的 areEqual 函数是一个可选参数，当我们不传入 areEqual 时，React.memo 也可以工作，此时它的作用就类似于 PureComponent——React.memo 会自动为你的组件执行 props 的浅比较逻辑**。

和 shouldComponentUpdate 不同的是，React.memo 只负责对比 props，而不会去感知组件内部状态（state）的变化。

##### useMemo：更加“精细”的 memo

通过上面的分析我们知道，React.memo 可以实现类似于 shouldComponentUpdate 或者 PureComponent 的效果，对组件级别的 re-render 进行管控。但是有时候，我们希望复用的并不是整个组件，而是组件中的某一个或几个部分。这种更加“精细化”的管控，就需要 useMemo 来帮忙了。

**简而言之，React.memo 控制是否需要重渲染一个组件，而 useMemo 控制的则是是否需要重复执行某一段逻辑**。

useMemo 的使用方式如下面代码所示：

```jsx
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
```

我们可以把目标逻辑作为第一个参数传入，把逻辑的依赖项数组作为第二个参数传入。这样只有当依赖项数组中的某个依赖发生变化时，useMemo 才会重新执行第一个入参中的目标逻辑。

这里我仍然以开篇的示例为例，现在我尝试向 ChildB 中传入两个属性：text 和 count，它们分别是一段文本和一个数字。当我点击右边的按钮时，只有 count 数字会发生变化。改造后的 App 组件代码如下：

```jsx
class App extends React.Component {
  state = {
    textA: "我是A的文本",
    stateB: {
      text: "我是B的文本",
      count: 10,
    },
  };
  changeA = () => {
    this.setState({
      textA: "A的文本被修改了",
    });
  };
  changeB = () => {
    this.setState({
      stateB: {
        ...this.state.stateB,
        count: 100,
      },
    });
  };
  render() {
    return (
      <div className="App">
        <div className="container">
          <button onClick={this.changeA}>点击修改A处的文本</button>
          <button onClick={this.changeB}>点击修改B处的文本</button>
          <ul>
            <li>
              <ChildA text={this.state.textA} />
            </li>
            <li>
              <ChildB {...this.state.stateB} />
            </li>
          </ul>
        </div>
      </div>
    );
  }
}
export default App;
```

在 ChildB 中，使用 useMemo 来加持 text 和 count 各自的渲染逻辑。改造后的 ChildB 代码如下所示：

```jsx
import React, { useMemo } from "react";
export default function ChildB({ text, count }) {
  console.log("ChildB 的render 逻辑执行了");
  // text 文本的渲染逻辑
  const renderText = (text) => {
    console.log("renderText 执行了");
    return (
      <p>
        子组件B的文本内容：
        {text}
      </p>
    );
  };
  // count 数字的渲染逻辑
  const renderCount = (count) => {
    console.log("renderCount 执行了");
    return (
      <p>
        子组件B的数字内容：
        {count}
      </p>
    );
  };

  // 使用 useMemo 加持两段渲染逻辑
  const textContent = useMemo(() => renderText(text), [text]);
  const countContent = useMemo(() => renderCount(count), [count]);
  return (
    <div className="childB">
      {textContent}
      {countContent}
    </div>
  );
}
```

渲染 App 组件，我们可以看到初次渲染时，renderText 和 renderCount 都执行了，控制台输出如下图所示：

![Drawing 6.png](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsCgqCHl_ga_SAeZvVAACbMQxPKsc444.png)

点击右边按钮，对 count 进行修改，修改后的界面会发生如下的变化：

![Drawing 7.png](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsCgpVE1_ga_yAZ5u-AADTkxhPMO8352.png)

可以看出，由于 count 发生了变化，因此 useMemo 针对 renderCount 的逻辑进行了重计算。而 text 没有发生变化，因此 renderText 的逻辑压根没有执行。

使用 useMemo，我们可以对函数组件的执行逻辑进行更加细粒度的管控（尤其是定向规避掉一些高开销的计算），同时也弥补了 React.memo 无法感知函数内部状态的遗憾，这对我们整体的性能提升是大有裨益的。

### 5.React17 特性

> React v17 的发布非比寻常，因为它没有增加任何面向开发者的新特性。但是，**这个版本会使得 React 自身的升级变得更加容易**。
> 值得特别说明的是，React v17 作为后续版本的“基石”，它让不同版本的 React 相互嵌套变得更加容易。
> —— React 官方

React 17 中没有新特性，这是由它的定位决定的。React 17 的定位是**后续 18、19 等更新版本的“基石”**，它是一个“承上启下”的版本，用官方的说法来说，“**React v17 开启了 React 渐进式升级的新篇章”**。

所谓“渐进式升级”，是相对于“一次性升级”来说的。日后我们需要将项目从 React 17 迁移至 18、19 等更新版本时，不需要一口气把整个应用升级到新版本，而是可以部分升级，比如说我们完全可以在 React 18 中安全地引入 React 17 版本的某个组件。而在 React 17 之前，这样做将会伴随着不可用的风险，彼时我们但凡要升级 React 版本，就必须一次性将整个应用迁移至目标版本。

“渐进式升级”意味着更大的选择余地，它将在未来为大量的 React 老版本项目留出喘息的空间，确保开发者们不必为了兼容多版本而徒增烦恼。

没有新特性，不代表没有变化，更不代表没有东西可以学了。事实上，React 17 中仍然有不少值得我们关注的用户侧改变，个人认为最重要的是以下三点：

- 新的 JSX 转换逻辑
- 事件系统重构
- Lane 模型的引入

除此之外，React 17 中还有一些细节层面的变化，比如调整了 useEffect 钩子中清理副作用的时机，强化了组件返回 undefined 的错误校验等

### 6.React 单向数据流

单向数据流，指的就是当前组件的 state 以 props 的形式流动时，只能流向组件树中比自己层级更低的组件。 比如在父-子组件这种嵌套关系中，只能由父组件传 props 给子组件，而不能反过来。

React 数据流管理方案：

- 使用基于 props 的单向数据流串联父子、兄弟组件；
- 使用第三方数据流 Redux
- 使用 Context API 维护全局状态
- 利用“发布-订阅”模式驱动 React 数据在任意组件间流动。

#### 组件间通信方式

![image.png](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsHyk8m7p5xJhfZto.webp)

#### props 的几种模式

##### props chidren 模式

```jsx
<Container>
    <Children>
</Container>


function Container(props){
 	return props.children
}
```

作用：

- 可以根据需要控制 Chidren 是否渲染。
- Container 可以用 React.cloneElement 强化 props (混入新的 props )，或者修改 Chidren 的子元素。

##### render props 模式

```jsx
<Container>{(ContainerProps) => <Children {...ContainerProps} />}</Container>;

function Container(props) {
  const ContainerProps = {
    name: "xiaoming",
    mes: "hello",
  };
  return props.children(ContainerProps);
}
复制代码;
```

作用：

- 根据需要控制 Chidren 渲染与否。
- 可以将需要传给 Children 的 props 直接通过函数参数的方式传递给执行函数 children 。

##### 混合模式

```jsx
<Container>
  <Children />
  {(ContainerProps) => <Children {...ContainerProps} name={"haha"} />}
</Container>;
复制代码;
```

这种情况需要先遍历 children ，判断 children 元素类型：

- 针对 element 节点，通过 cloneElement 混入 props ；
- 针对函数，直接传递参数，执行函数。

```jsx
const Children = (props) => (
  <div>
    <div>hello, my name is {props.name} </div>
    <div> {props.mes} </div>
  </div>
);

function Container(props) {
  const ContainerProps = {
    name: "xiaoming",
    mes: "hello",
  };
  return props.children.map((item) => {
    if (React.isValidElement(item)) {
      // 判断是 react elment  混入 props
      return React.cloneElement(
        item,
        { ...ContainerProps },
        item.props.children
      );
    } else if (typeof item === "function") {
      return item(ContainerProps);
    } else return null;
  });
}

const Index = () => {
  return (
    <Container>
      <Children />
      {(ContainerProps) => <Children {...ContainerProps} name={"haha"} />}
    </Container>
  );
};
```

#### Redux

在 Redux 的整个工作过程中，数据流是严格单向的。

如果你想对数据进行修改，只有一种途径：派发 action。action 会被 reducer 读取，进而根据 action 内容的不同对数据进行修改、生成新的 state（状态），这个新的 state 会更新到 store 对象里，进而驱动视图层面做出对应的改变。

对于组件来说，任何组件都可以通过约定的方式从 store 读取到全局的状态，任何组件也都可以通过合理地派发 action 来修改全局的状态。Redux 通过提供一个统一的状态容器，使得数据能够自由而有序地在任意组件之间穿梭。

![image.png](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsAU3YtWJ8fHc4DsT.webp)

1.使用 createStore 来完成 store 对象的创建

```jsx
// 引入 redux
import { createStore } from 'redux'
// 创建 store
const store = createStore(
    reducer,
    initial_state,
    applyMiddleware(middleware1, middleware2, ...)
);
```

2.reducer 的作用是将新的 state 返回给 store

```jsx
const reducer = (state, action) => {
  // 此处是各种样的 state处理逻辑
  return new_state;
};
```

3.action 的作用是通知 reducer “让改变发生”

```jsx
const action = {
  type: "ADD_ITEM",
  payload: "<li>text</li>",
};
```

4.派发 action，靠的是 dispatch

```jsx
import { createStore } from "redux";
// 创建 reducer
const reducer = (state, action) => {
  // 此处是各种样的 state处理逻辑
  return new_state;
};
// 基于 reducer 创建 state
const store = createStore(reducer);
// 创建一个 action，这个 action 用 “ADD_ITEM” 来标识
const action = {
  type: "ADD_ITEM",
  payload: "<li>text</li>",
};

// 订阅
store.subscribe(() => console.log(store.getState()));

// 使用 dispatch 派发 action，action 会进入到 reducer 里触发对应的更新
store.dispatch(action);
```

#### Context

Context 提供了一个无需为每层组件手动添加 props，就能在组件树间进行数据传递的方法。

![image.png](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgslYZIyvcsm3EPxdD.webp)

基本用法：

```javascript
const ThemeContext = React.createContext("light"); //
const ThemeProvider = ThemeContext.Provider; //提供者
const ThemeConsumer = ThemeContext.Consumer; // 订阅消费者
```

Provider：

```javascript
const ThemeProvider = ThemeContext.Provider  //提供者
import ConsumerComponent form './ConsumerComponent'


function ProviderComponent(){
    const [ theme , setTheme ] = React.useState({ theme: "light" })
    return <div>
        <ThemeProvider value={ theme } >
           <ConsumerComponent />
        </ThemeProvider>
    </div>
}

export default ProviderComponent
```

provider 作用有两个：

- value 属性传递 context，供给 Consumer 使用。
- value 属性改变，ThemeProvider 会让消费 Provider value 的组件重新渲染。

Consumer：

类组件：

```javascript
// 类组件 - contextType 方式
class ConsumerComponent extends React.Component {
  render() {
    const { theme } = this.context;
    return <div style={{ color: theme }}>消费者</div>;
  }
}

ConsumerComponent.contextType = ThemeContext;

export default ConsumerComponent;
```

函数组件：

（1）使用 useContext：

```javascript
export default function ConsumerComponent() {
  const contextValue = React.useContext(ThemeContext);
  const { theme } = contextValue;
  return <div style={{ color: theme }}>消费者</div>;
}
```

（2）使用订阅者：

```javascript
const ThemeConsumer = ThemeContext.Consumer // 订阅消费者

export default const ConsumerComponent = () => {
  return (
    <ThemeConsumer>
       { (contextValue)=> // todo }
    </ThemeConsumer>
	)
}
```

#### 发布订阅

事件的监听（订阅）和事件的触发（发布）

- on()：负责注册事件的监听器，指定事件触发时的回调函数。
- emit()：负责触发事件，可以通过传参使其在触发的时候携带数据 。

##### 映射

事件和监听函数的对应关系“映射”，处理“映射”我们大部分情况下都是用对象来做的。所以说在全局我们需要设置一个对象，来存储事件和监听函数之间的关系：

```javascript
 constructor() {
   // eventMap 用来存储事件和监听函数之间的关系
   this.eventMap = {};
 }
```

##### 订阅

把事件和对应的监听函数写入到 eventMap 里面去：

```javascript
// type 这里就代表事件的名称
on(type, handler) {
  // hanlder 必须是一个函数，如果不是直接报错
  if(!(handler instanceof Function)) {
    throw new Error("需要传一个函数")
  }
  // 判断 type 事件对应的队列是否存在
  if(!this.eventMap[type]) {
   // 若不存在，新建该队列
    this.eventMap[type] = []
  }
  // 若存在，直接往队列里推入 handler
  this.eventMap[type].push(handler)
}

```

##### 发布

发布操作就是一个“读”操作。

```javascript
// 别忘了我们前面说过触发时是可以携带数据的，params 就是数据的载体
emit(type, params) {
  // 假设该事件是有订阅的（对应的事件队列存在）
  if(this.eventMap[type]) {
    // 将事件队列里的 handler 依次执行出队
    this.eventMap[type].forEach((handler, index)=> {
      // 注意别忘了读取 params
      handler(params)
    })
  }
}

```

##### 关闭

关闭就是一个出队列的操作。

```javascript
off(type, handler) {
  if(this.eventMap[type]) {
    this.eventMap[type].splice(this.eventMap[type].indexOf(handler)>>>0,1)
  }
}

```

##### 测试

完整代码

```javascript
class myEventEmitter {
  constructor() {
    this.eventMap = {};
  }

  on(type, handler) {
    if (!handler instanceof Function) {
      throw new Error("请传一个函数");
    }
    if (!this.eventMap[type]) {
      this.eventMap[type] = [];
    }
    this.eventMap[type].push(handler);
  }

  emit(type, params) {
    if (this.eventMap[type]) {
      this.eventMap[type].forEach((handler) => {
        handler(params);
      });
    }
  }

  off(type, handler) {
    if (this.eventMap[type]) {
      // 位运算 负数返回无限大的数，否则返回本身
      this.eventMap[type].splice(this.eventMap[type].indexOf(handler) >>> 0, 1);
    }
  }
}

const myEvent = new myEventEmitter();
// 编写一个简单的 handler
const testHandler = function (params) {
  console.log(`test事件被触发了，testHandler 接收到的入参是${params}`);
};
// 监听 test 事件
myEvent.on("test", testHandler);
// 在触发 test 事件的同时，传入希望 testHandler 感知的参数
myEvent.emit("test", "123");

// myEvent.off("test", testHandler);

console.log(`object`, myEvent.eventMap);
```

![image.png](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsnFzy1pr5CatVZ3h.webp)

##### 在 React 中应用

```javascript
// index.jsx
import React, { Component } from 'react'
import A from './A'
import B from './B'
import event from './event.js'

class index extends Component {
    render() {
        React.$myEvent = new event()
        return (
            <div>
                <A></A>
                <B></B>
            </div>
        )
    }
}

export default index


// event.js
class myEventEmitter {
    constructor() {
        this.eventMap = {};
    }

    on(type, handler) {
        if (!handler instanceof Function) {
            throw new Error("请传一个函数");
        }
        if (!this.eventMap[type]) {
            this.eventMap[type] = []
        }
        this.eventMap[type].push(handler)
    }

    emit(type, params) {
        if (this.eventMap[type]) {
            this.eventMap[type].forEach((handler) => {
                handler(params);
            })
        }
    }

    off(type, handler) {
        if (this.eventMap[type]) {
            this.eventMap[type].splice(this.eventMap[type].indexOf(handler) >>> 0, 1);
        }
    }
}
export default myEventEmitter


// A
import React from "react";

class A extends React.Component {
  state = {
    newParams: "",
  };
  handler = (params) => {
    this.setState({
      newParams: params,
    });
  };
  bindHandler = () => {
    React.$myEvent.on("someEvent", this.handler);
  };
  render() {
    return (
      <div>
        <button onClick={this.bindHandler}>点我监听A的动作</button>
        <div>A传入的内容是[{this.state.newParams}]</div>
      </div>
    );
  }
}

export default A;

// B
import React from "react";

class B extends React.Component {
  state = {
    infoToB: "哈哈哈哈我来自A",
  };
  reportToB = () => {
    React.$myEvent.emit("someEvent", this.state.infoToB);
  };
  render() {
    return <button onClick={this.reportToB}>点我把state传递给B</button>;
  }
}

export default B;

```

![image.png](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsvImzEbAJyiRTwoe.webp)

### 7.React 中使用 css 的各种方式

[react 中 css 实现方式](https://blog.csdn.net/kuizuo12/article/details/122486443)

[react 中使用 css 的 7 种方式 ](https://www.cnblogs.com/furenjian/p/15498917.html)

#### 第一种: 在组件中直接使用 style

不需要组件从外部引入 css 文件，直接在组件中书写。

```javascript
import react, { Component } from "react";

const div1 = {
  width: "300px",
  margin: "30px auto",
  backgroundColor: "#44014C",  //驼峰法
  minHeight: "200px",
  boxSizing: "border-box"
};

class Test extends Component {
  constructor(props, context) {
    super(props);
  }

  render() {
    return (
     <div style={div1}>123</div>
     <div style="">
    );
  }
}

export default Test;
```

注意事项:

1. 在正常的 css 中，比如 background-color，box-sizing 等属性，在 style 对象 div1 中的属性中，必须转换成驼峰法，backgroundColor，boxSizing。而没有连字符的属性，如 margin，width 等，则在 style 对象中不变。
2. 在正常的 css 中，css 的值不需要用双引好("")，如

```css
.App-header {
  background-color: #282c34;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
  color: white;
}
```

而在 react 中使用 style 对象的方式时。值必须用双引号包裹起来。

这种方式的 react 样式，只作用于当前组件。

#### 第二种: 在组件中引入[name].css 文件

需要在当前组件开头使用 import 引入 css 文件。

```javascript
import React, { Component } from "react";
import TestChidren from "./TestChidren";
import "@/assets/css/index.scss";

class Test extends Component {
  constructor(props, context) {
    super(props);
  }

  render() {
    return (
      <div>
        <div className="link-name">123</div>
        <TestChidren>测试子组件的样式</TestChidren>
      </div>
    );
  }
}

export default Test;
```

这种方式引入的 css 样式，会作用于**当前组件及其所有后代组件**。

#### 第三种: 在组件中引入[name].scss 文件

引入 react 内部已经支持了后缀为 scss 的文件，所以只需要安装 node-sass 即可，因为有个 node-sass，scss 文件才能在 node 环境上编译成 css 文件。

```csharp
>yarn add node-sass
```

然后编写 scss 文件

```php
//index.scss
.App{
  background-color: #282c34;
  .header{
    min-height: 100vh;
    color: white;
  }
}
```

关于如何详细的使用 sass，请查看 sass 官网

这种方式引入的 css 样式，同样会作用于**当前组件及其所有后代组件**。

#### 第四种: 在组件中引入[name].module.css 文件

将 css 文件作为一个模块引入，这个模块中的所有 css，只作用于当前组件。不会影响当前组件的后代组件。

```javascript
import React, { Component } from "react";
import TestChild from "./TestChild";
import moduleCss from "./test.module.css";

class Test extends Component {
  constructor(props, context) {
    super(props);
  }

  render() {
    return (
      <div>
        <div className={moduleCss.linkName}>321321</div>
        <TestChild></TestChild>
      </div>
    );
  }
}

export default Test;
```

这种方式可以看做是前面第一种在组件中使用 style 的升级版。完全将 css 和组件分离开，又不会影响其他组件。

#### 第五种: 在组件中引入 [name].module.scss 文件

类似于第四种，区别是第四种引入 css module，而这种是引入 scss module 而已。

```javascript
import React, { Component } from "react";
import TestChild from "./TestChild";
import moduleCss from "./test.module.scss";

class Test extends Component {
  constructor(props, context) {
    super(props);
  }

  render() {
    return (
      <div>
        <div className={moduleCss.linkName}>321321</div>
        <TestChild></TestChild>
      </div>
    );
  }
}

export default Test;
```

同样这种方式可以看做是前面第一种在组件中使用 style 的升级版。

#### 第六种: 使用 styled-components

需要先安装

```csharp
>yarn add styled-components
```

然后创建一个 js 文件(注意是 js 文件，不是 css 文件)

```javascript
//style.js
import styled, { createGlobalStyle } from "styled-components";

export const SelfLink = styled.div`
  height: 50px;
  border: 1px solid red;
  color: yellow;
`;

export const SelfButton = styled.div`
  height: 150px;
  width: 150px;
  color: ${(props) => props.color};
  background-image: url(${(props) => props.src});
  background-size: 150px 150px;
`;
```

组件中使用 styled-components 样式

```javascript
import React, { Component } from "react";

import { SelfLink, SelfButton } from "./style";

class Test extends Component {
  constructor(props, context) {
    super(props);
  }

  render() {
    return (
      <div>
        <SelfLink title="People's Republic of China">app.js</SelfLink>
        <SelfButton color="palevioletred" style={{ color: "pink" }} src={fist}>
          SelfButton
        </SelfButton>
      </div>
    );
  }
}

export default Test;
```

这种方式是将整个 css 样式，和 html 节点整体合并成一个组件。引入这个组件 html 和 css 都有了。
它的好处在于可以随时通过往组件上传入 属性，来动态的改变样式。对于处理变量、媒体查询、伪类等较方便的。

这种方式的 css 也只对当前组件有效。

具体用法，请查看 styled-components 官网

[广州 vi 设计](http://www.maiqicn.com/)http://www.maiqicn.com [办公资源网站大全](https://www.wode007.com/)https://www.wode007.com

#### 第七种: 使用 radium

需要先安装

```csharp
>yarn add radium
```

然后在 react 组件中直接引入使用

```javascript
import React, { Component } from "react";
import Radium from "radium";

let styles = {
  base: {
    color: "#fff",
    ":hover": {
      background: "#0074d9",
    },
  },
  primary: {
    background: "#0074D9",
  },
  warning: {
    background: "#FF4136",
  },
};

class Test extends Component {
  constructor(props, context) {
    super(props);
  }

  render() {
    return (
      <div>
        <button style={[styles.base, styles.primary]}>
          this is a primary button
        </button>
      </div>
    );
  }
}

export default Radium(Test);
```

对于处理变量、媒体查询、伪类等是不方便的。

使用 Radium 可以直接处理变量、媒体查询、伪类等，并且可以直接使用 js 中的数学，连接，正则表达式，条件，函数等。

注意:
**在 export 之前，必须用 Radium 包裹。**
