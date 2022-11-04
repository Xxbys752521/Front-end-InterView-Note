---
sidebar_position: 12
description: Context和事件系统
---

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
