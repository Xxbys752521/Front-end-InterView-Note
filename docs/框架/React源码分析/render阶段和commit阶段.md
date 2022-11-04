---
sidebar_position: 7
description: render and commit
---

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
