---
sidebar_position: 9
description: Hooks源码
---

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
