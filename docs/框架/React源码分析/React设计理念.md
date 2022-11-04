---
sidebar_position: 2
description: React设计理念
---

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
