---
sidebar_position: 7
description: Hooks
---

## Hooks

[React 全部 Hooks 使用大全 （包含 React v18 版本 ）](https://juejin.cn/post/7118937685653192735#heading-5)

### 基本用法和注意事项

#### 数据更新驱动

##### useState

useState 可以使函数组件像类组件一样拥有 state，函数组件通过 useState 可以让组件重新渲染，更新视图。

###### **useState 基础介绍：**

```js
const [ ①state , ②dispatch ] = useState(③initData)
```

① state，目的提供给 UI ，作为渲染视图的数据源。

② dispatchAction 改变 state 的函数，可以理解为推动函数组件渲染的渲染函数。

③ initData 有两种情况，第一种情况是非函数，将作为 state 初始化的值。 第二种情况是函数，函数的返回值作为 useState 初始化的值。

###### **useState 基础用法：**

```js
const DemoState = (props) => {
  /* number为此时state读取值 ，setNumber为派发更新的函数 */
  let [number, setNumber] = useState(0); /* 0为初始值 */
  return (
    <div>
      <span>{number}</span>
      <button
        onClick={() => {
          setNumber(number + 1);
          console.log(number); /* 这里的number是不能够即使改变的  */
        }}
      ></button>
    </div>
  );
};
```

###### **useState 注意事项：**

① **在函数组件一次执行上下文中，state 的值是固定不变的。**

```js
function Index() {
  const [number, setNumber] = React.useState(0);
  const handleClick = () =>
    setInterval(() => {
      // 此时 number 一直都是 0
      setNumber(number + 1);
    }, 1000);
  return <button onClick={handleClick}> 点击 {number}</button>;
}
```

② 如果两次 dispatchAction **传入相同的 state 值**，那么组件就不会更新。

```js
export default function Index() {
  const [state, dispatchState] = useState({ name: "alien" });
  const handleClick = () => {
    // 点击按钮，视图没有更新。
    state.name = "Alien";
    dispatchState(state); // 直接改变 `state`，在内存中指向的地址相同。
  };
  return (
    <div>
      <span> {state.name}</span>
      <button onClick={handleClick}>changeName++</button>
    </div>
  );
}
```

③ 当触发 dispatchAction 在当前执行上下文中获取不到最新的 state, 只有再下一次组件 rerender 中才能获取到。

##### useReducer

useReducer 是 react-hooks 提供的能够在无状态组件中运行的类似 redux 的功能 api 。

###### **useReducer 基础介绍：**

```js
const [ ①state , ②dispatch ] = useReducer(③reducer)
```

① 更新之后的 state 值。

② 派发更新的 dispatchAction 函数, 本质上和 useState 的 dispatchAction 是一样的。

③ 一个函数 reducer ，我们可以认为它就是一个 redux 中的 reducer , reducer 的参数就是常规 reducer 里面的 state 和 action, 返回改变后的 state, 这里有一个需要注意的点就是：**如果返回的 state 和之前的 state ，内存指向相同，那么组件将不会更新。**

###### **useReducer 基础用法：**

```js
const DemoUseReducer = () => {
  /* number为更新后的state值,  dispatchNumbner 为当前的派发函数 */
  const [number, dispatchNumbner] = useReducer((state, action) => {
    const { payload, name } = action;
    /* return的值为新的state */
    switch (name) {
      case "add":
        return state + 1;
      case "sub":
        return state - 1;
      case "reset":
        return payload;
    }
    return state;
  }, 0);
  return (
    <div>
      当前值：{number}
      {/* 派发更新 */}
      <button onClick={() => dispatchNumbner({ name: "add" })}>增加</button>
      <button onClick={() => dispatchNumbner({ name: "sub" })}>减少</button>
      <button onClick={() => dispatchNumbner({ name: "reset", payload: 666 })}>
        赋值
      </button>
      {/* 把dispatch 和 state 传递给子组件  */}
      <MyChildren dispatch={dispatchNumbner} State={{ number }} />
    </div>
  );
};
```

#### 执行副作用

纯函数

首先解释纯函数（Pure function）：给一个 function 相同的参数，永远会返回相同的值，并且没有副作用；这个概念拿到 React 中，就是给一个 Pure component 相同的 props, 永远渲染出相同的视图，并且没有其他的副作用；纯组件的好处是，容易监测数据变化、容易测试、提高渲染性能等；
副作用（Side Effect）是指一个 function 做了和本身运算返回值无关的事，比如：修改了全局变量、修改了传入的参数、甚至是 console.log()，所以 ajax 操作，修改 dom 都是算作副作用的；

##### useEffect

React hooks 也提供了 api ，用于弥补函数组件没有生命周期的缺陷。其本质主要是运用了 hooks 里面的 useEffect ， useLayoutEffect，还有 useInsertionEffect。其中最常用的就是 useEffect 。我们首先来看一下 useEffect 的使用。

###### **useEffect 基础介绍：**

```js
useEffect(() => {
  return destory;
}, dep);

useEffect(() => {
  // 执行一些副作用
  // ...
  return () => {
    // 清理函数
  };
});
```

useEffect 第一个参数 callback, 返回的 destory ， destory **作为下一次 callback 执行之前调用，用于清除上一次 callback 产生的副作用**。

有的时候**需要根据 props 的变化来条件执行 effect 函数**，要实现这一点，可以给 useEffect 传递第二个参数，它是 effect 所依赖的值数组：

```js
useEffect(() => {
  const subscription = props.source.subscribe();
  return () => {
    subscription.unsubscribe();
  };
}, [props.source]);
```

第二个参数作为依赖项，是一个数组，可以有多个依赖项，依赖项改变，执行上一次 callback 返回的 destory ，和执行新的 effect 第一个参数 callback 。

对于 useEffect 执行， React 处理逻辑是采用**异步调用** ，对于每一个 effect 的 callback， React 会向 setTimeout 回调函数一样，放入任务队列，等到主线程任务完成，DOM 更新，js 执行完成，视图绘制完毕，才执行。所以 **effect 回调函数不会阻塞浏览器绘制视图**。

###### **useEffect 基础用法：**

```js
/* 模拟数据交互 */
function getUserInfo(a) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        name: a,
        age: 16,
      });
    }, 500);
  });
}

const Demo = ({ a }) => {
  const [userMessage, setUserMessage]: any = useState({});
  const div = useRef();
  const [number, setNumber] = useState(0);
  /* 模拟事件监听处理函数 */
  const handleResize = () => {};
  /* useEffect使用 ，这里如果不加限制 ，会是函数重复执行，陷入死循环*/
  useEffect(() => {
    /* 请求数据 */
    getUserInfo(a).then((res) => {
      setUserMessage(res);
    });
    /* 定时器 延时器等 */
    const timer = setInterval(() => console.log(666), 1000);
    /* 操作dom  */
    console.log(div.current); /* div */
    /* 事件监听等 */
    window.addEventListener("resize", handleResize);
    /* 此函数用于清除副作用 */
    return function () {
      clearInterval(timer);
      window.removeEventListener("resize", handleResize);
    };
    /* 只有当props->a和state->number改变的时候 ,useEffect副作用函数重新执行 ，如果此时数组为空[]，证明函数只有在初始化的时候执行一次相当于componentDidMount */
  }, [a, number]);
  return (
    <div ref={div}>
      <span>{userMessage.name}</span>
      <span>{userMessage.age}</span>
      <div onClick={() => setNumber(1)}>{number}</div>
    </div>
  );
};
```

如上在 useEffect 中做的功能如下：

- ① 请求数据。
- ② 设置定时器,延时器等。
- ③ 操作 dom , 在 React Native 中可以通过 ref 获取元素位置信息等内容。
- ④ 注册事件监听器, 事件绑定，在 React Native 中可以注册 NativeEventEmitter 。
- ⑤ 还可以清除定时器，延时器，解绑事件监听器等。

##### useLayoutEffect

###### **useLayoutEffect 基础介绍：**

useLayoutEffect 和 useEffect 不同的地方是采用了同步执行，那么和 useEffect 有什么区别呢？

① 首先 useLayoutEffect 是在 DOM 更新之后，浏览器绘制之前，这样可以方便修改 DOM，获取 DOM 信息，这样浏览器只会绘制一次，如果修改 DOM 布局放在 useEffect ，那 useEffect 执行是在浏览器绘制视图之后，接下来又改 DOM ，就可能会导致浏览器再次回流和重绘。而且由于两次绘制，视图上可能会造成闪现突兀的效果。

② useLayoutEffect callback 中代码执行会阻塞浏览器绘制。

###### **useEffect 基础用法：**

```js
const DemoUseLayoutEffect = () => {
  const target = useRef();
  useLayoutEffect(() => {
    /*我们需要在dom绘制之前，移动dom到制定位置*/
    const { x, y } = getPositon(); /* 获取要移动的 x,y坐标 */
    animate(target.current, { x, y });
  }, []);
  return (
    <div>
      <span ref={target} className="animate"></span>
    </div>
  );
};
```

##### useInsertionEffect

###### **useInsertionEffect 基础介绍：**

useInsertionEffect 是在 React v18 新添加的 hooks ，它的用法和 useEffect 和 useLayoutEffect 一样。那么这个 hooks 用于什么呢?

在介绍 useInsertionEffect 用途之前，先看一下 useInsertionEffect 的执行时机。

```js
React.useEffect(() => {
  console.log("useEffect 执行");
}, []);

React.useLayoutEffect(() => {
  console.log("useLayoutEffect 执行");
}, []);

React.useInsertionEffect(() => {
  console.log("useInsertionEffect 执行");
}, []);
```

打印： useInsertionEffect 执行 -> useLayoutEffect 执行 -> useEffect 执行

可以看到 useInsertionEffect 的执行时机要比 useLayoutEffect 提前，useLayoutEffect 执行的时候 DOM 已经更新了，但是在 useInsertionEffect 的执行的时候，DOM 还没有更新。本质上 useInsertionEffect 主要是解决 CSS-in-JS 在渲染中注入样式的性能问题。这个 hooks 主要是应用于这个场景，在其他场景下 React 不期望用这个 hooks 。

###### **useInsertionEffect 模拟使用：**

```js
export default function Index() {
  React.useInsertionEffect(() => {
    /* 动态创建 style 标签插入到 head 中 */
    const style = document.createElement("style");
    style.innerHTML = `
       .css-in-js{
         color: red;
         font-size: 20px;
       }
     `;
    document.head.appendChild(style);
  }, []);

  return <div className="css-in-js"> hello , useInsertionEffect </div>;
}
```

如上模拟了 useInsertionEffect 的使用

#### 状态获取与传递

##### useContext

###### **useContext 基础介绍**

可以使用 useContext ，来获取父级组件传递过来的 context 值，这个当前值就是最近的父级组件 Provider 设置的 value 值，useContext 参数一般是由 createContext 方式创建的 ,也可以父级上下文 context 传递的 ( 参数为 context )。useContext 可以代替 context.Consumer 来获取 Provider 中保存的 value 值。

```js
const contextValue = useContext(context);
```

useContext 接受一个参数，一般都是 context 对象，返回值为 context 对象内部保存的 value 值。

###### **useContext 基础用法：**

```js
/* 用useContext方式 */
const DemoContext = () => {
  const value: any = useContext(Context);
  /* my name is alien */
  return <div> my name is {value.name}</div>;
};

/* 用Context.Consumer 方式 */
const DemoContext1 = () => {
  return (
    <Context.Consumer>
      {/*  my name is alien  */}
      {(value) => <div> my name is {value.name}</div>}
    </Context.Consumer>
  );
};

export default () => {
  return (
    <div>
      <Context.Provider value={{ name: "alien", age: 18 }}>
        <DemoContext />
        <DemoContext1 />
      </Context.Provider>
    </div>
  );
};
```

##### useRef

###### **useRef 基础介绍：**

useRef 可以用来获取元素，缓存状态，接受一个状态 initState 作为初始值，返回一个 ref 对象 cur, cur 上有一个 current 属性就是 ref 对象需要获取的内容。

```js
const cur = React.useRef(initState);
console.log(cur.current);
```

###### **useRef 基础用法：**

**useRef 获取 DOM 元**素，在 React Native 中虽然没有 DOM 元素，但是也能够获取组件的节点信息（ fiber 信息 ）。

```js
const DemoUseRef = () => {
  const dom = useRef(null);
  const handerSubmit = () => {
    /*  <div >表单组件</div>  dom 节点 */
    console.log(dom.current);
  };
  return (
    <div>
      {/* ref 标记当前dom节点 */}
      <div ref={dom}>表单组件</div>
      <button onClick={() => handerSubmit()}>提交</button>
    </div>
  );
};
```

如上通过 useRef 来获取 DOM 节点。

**useRef 保存状态，** 可以利用 useRef 返回的 ref 对象来保存状态，只要当前组件不被销毁，那么状态就会一直存在。

```js
const status = useRef(false);
/* 改变状态 */
const handleChangeStatus = () => {
  status.current = true;
};
```

#### 状态派生与保存

##### useMemo

useMemo 可以在函数组件 render 上下文中同步执行一个函数逻辑，这个函数的返回值可以作为一个新的状态缓存起来。那么这个 hooks 的作用就显而易见了：

场景一：在一些场景下，需要在函数组件中进行大量的逻辑计算，那么我们不期望每一次函数组件渲染都执行这些复杂的计算逻辑，所以就需要在 useMemo 的回调函数中执行这些逻辑，然后把得到的产物（计算结果）缓存起来就可以了。

场景二：React 在整个更新流程中，diff 起到了决定性的作用，比如 Context 中的 provider 通过 diff value 来判断是否更新

**useMemo 基础介绍：**

```js
const cacheSomething = useMemo(create, deps);
```

- ① create：第一个参数为一个函数，函数的返回值作为缓存值，如上 demo 中把 Children 对应的 element 对象，缓存起来。
- ② deps： 第二个参数为一个数组，存放当前 useMemo 的依赖项，在函数组件下一次执行的时候，会对比 deps 依赖项里面的状态，是否有改变，如果有改变重新执行 create ，得到新的缓存值。
- ③ acheSomething：返回值，执行 create 的返回值。如果 deps 中有依赖项改变，返回的重新执行 create 产生的值，否则取上一次缓存值。

**useMemo 基础用法：**

派生新状态：

```js
function Scope() {
  const keeper = useKeep();
  const { cacheDispatch, cacheList, hasAliveStatus } = keeper;

  /* 通过 useMemo 得到派生出来的新状态 contextValue  */
  const contextValue = useMemo(() => {
    return {
      cacheDispatch: cacheDispatch.bind(keeper),
      hasAliveStatus: hasAliveStatus.bind(keeper),
      cacheDestory: (payload) =>
        cacheDispatch.call(keeper, { type: ACTION_DESTORY, payload }),
    };
  }, [keeper]);
  return (
    <KeepaliveContext.Provider value={contextValue}></KeepaliveContext.Provider>
  );
}
```

如上通过 useMemo 得到派生出来的新状态 contextValue ，只有 keeper 变化的时候，才改变 Provider 的 value 。

缓存计算结果：

```js
function Scope() {
  const style = useMemo(() => {
    let computedStyle = {};
    // 经过大量的计算
    return computedStyle;
  }, []);
  return <div style={style}></div>;
}
```

缓存组件,减少子组件 rerender 次数：

```js
function Scope({ children }) {
  const renderChild = useMemo(() => {
    children();
  }, [children]);
  return <div>{renderChild} </div>;
}
```

##### useCallback

###### **useCallback 基础介绍：**

useMemo 和 useCallback 接收的参数都是一样，都是在其依赖项发生变化后才执行，都是返回缓存的值，区别在于 useMemo 返回的是**函数运行的结果**，useCallback **返回的是函数**，这个回调函数是经过处理后的也就是说父组件传递一个函数给子组件的时候，由于是无状态组件每一次都会重新生成新的 props 函数，这样就使得每一次传递给子组件的函数都发生了变化，这时候就会触发子组件的更新，这些更新是没有必要的，此时我们就可以通过 usecallback 来处理此函数，然后作为 props 传递给子组件。

###### **useCallback 基础用法：**

```js
/* 用react.memo */
const DemoChildren = React.memo((props) => {
  /* 只有初始化的时候打印了 子组件更新 */
  console.log("子组件更新");
  useEffect(() => {
    props.getInfo("子组件");
  }, []);
  return <div>子组件</div>;
});

const DemoUseCallback = ({ id }) => {
  const [number, setNumber] = useState(1);
  /* 此时usecallback的第一参数 (sonName)=>{ console.log(sonName) }
     经过处理赋值给 getInfo */
  const getInfo = useCallback(
    (sonName) => {
      console.log(sonName);
    },
    [id]
  );
  return (
    <div>
      {/* 点击按钮触发父组件更新 ，但是子组件没有更新 */}
      <button onClick={() => setNumber(number + 1)}>增加</button>
      <DemoChildren getInfo={getInfo} />
    </div>
  );
};
```

### 1.对 React Hook 的理解，它的实现原理是什么

React-Hooks 是 React 团队在 React 组件开发实践中，逐渐认知到的一个改进点，这背后其实涉及对**类组件**和**函数组件**两种组件形式的思考和侧重。

**（1）类组件：** 所谓类组件，就是基于 ES6 Class 这种写法，通过继承 React.Component 得来的 React 组件。以下是一个类组件：

```js
class DemoClass extends React.Component {
  state = {
    text: "",
  };
  componentDidMount() {
    //...
  }
  changeText = (newText) => {
    this.setState({
      text: newText,
    });
  };

  render() {
    return (
      <div className="demoClass">
        <p>{this.state.text}</p>
        <button onClick={this.changeText}>修改</button>
      </div>
    );
  }
}
```

可以看出，React 类组件内部预置了相当多的“现成的东西”等着我们去调度/定制，state 和生命周期就是这些“现成东西”中的典型。要想得到这些东西，难度也不大，只需要继承一个 React.Component 即可。

当然，这也是类组件的一个不便，它太繁杂了，对于解决许多问题来说，编写一个类组件实在是一个过于复杂的姿势。复杂的姿势必然带来高昂的理解成本，这也是我们所不想看到的。除此之外，由于开发者编写的逻辑在封装后是和组件粘在一起的，这就使得**类组件内部的逻辑难以实现拆分和复用。**

**（2）函数组件**：函数组件就是以函数的形态存在的 React 组件。早期并没有 React-Hooks，函数组件内部无法定义和维护 state，因此它还有一个别名叫“无状态组件”。以下是一个函数组件：

```jsx
function DemoFunction(props) {
  const { text } = props;
  return (
    <div className="demoFunction">
      <p>{`函数组件接收的内容：[${text}]`}</p>
    </div>
  );
}
```

相比于类组件，函数组件肉眼可见的特质自然包括轻量、灵活、易于组织和维护、较低的学习成本等。

通过对比，从形态上可以对两种组件做区分，它们之间的区别如下：

- 类组件需要继承 class，函数组件不需要；
- 类组件可以访问生命周期方法，函数组件不能；
- 类组件中可以获取到实例化后的 this，并基于这个 this 做各种各样的事情，而函数组件不可以；
- 类组件中可以定义并维护 state（状态），而函数组件不可以；

除此之外，还有一些其他的不同。通过上面的区别，我们不能说谁好谁坏，它们各有自己的优势。在 React-Hooks 出现之前，**类组件的能力边界明显强于函数组件。**

实际上，类组件和函数组件之间，是面向对象和函数式编程这两套不同的设计思想之间的差异。而函数组件更加契合 React 框架的设计理念：

![image-20220701214125777](https://s2.loli.net/2022/07/01/OzjAem7D6UctS4I.png)

React 组件本身的定位就是函数，一个输入数据、输出 UI 的函数。作为开发者，我们编写的是声明式的代码，而 React 框架的主要工作，就是及时地把声明式的代码转换为命令式的 DOM 操作，把数据层面的描述映射到用户可见的 UI 变化中去。这就意味着从原则上来讲，React 的数据应该总是紧紧地和渲染绑定在一起的，而类组件做不到这一点。**函数组件就真正地将数据和渲染绑定到了一起。函数组件是一个更加匹配其设计理念、也更有利于逻辑拆分与重用的组件表达形式。**

为了能让开发者更好的的去编写函数式组件。于是，React-Hooks 便应运而生。

React-Hooks 是一套能够使函数组件更强大、更灵活的“钩子”。

函数组件比起类组件少了很多东西，比如生命周期、对 state 的管理等。这就给函数组件的使用带来了非常多的局限性，导致我们并不能使用函数这种形式，写出一个真正的全功能的组件。而 React-Hooks 的出现，就是为了帮助函数组件补齐这些（相对于类组件来说）缺失的能力。

如果说函数组件是一台轻巧的快艇，那么 React-Hooks 就是一个内容丰富的零部件箱。“重装战舰”所预置的那些设备，这个箱子里基本全都有，同时它还不强制你全都要，而是允许你自由地选择和使用你需要的那些能力，然后将这些能力以 Hook（钩子）的形式“钩”进你的组件里，从而定制出一个最适合你的“专属战舰”。

### 2.为什么 useState 要使用数组而不是对象

useState 的用法：

```jsx
const [count, setCount] = useState(0);
```

可以看到 useState 返回的是一个数组，那么为什么是返回数组而不是返回对象呢？

这里用到了解构赋值，所以先来看一下 ES6 的解构赋值：

##### 数组的解构赋值

```jsx
const foo = [1, 2, 3];
const [one, two, three] = foo;
console.log(one); // 1
console.log(two); // 2
console.log(three); // 3
```

##### 对象的解构赋值

```jsx
const user = {
  id: 888,
  name: "xiaoxin",
};
const { id, name } = user;
console.log(id); // 888
console.log(name); // "xiaoxin"
```

看完这两个例子，答案应该就出来了：

- 如果 useState 返回的是数组，那么使用者可以对数组中的元素命名，代码看起来也比较干净
- 如果 useState 返回的是对象，在解构对象的时候必须要和 useState 内部实现返回的对象同名，想要使用多次的话，必须得设置别名才能使用返回值

下面来看看如果 useState 返回对象的情况：

```jsx
// 第一次使用
const { state, setState } = useState(false);
// 第二次使用
const { state: counter, setState: setCounter } = useState(0);
```

这里可以看到，返回对象的使用方式还是挺麻烦的，更何况实际项目中会使用的更频繁。 **总结：**useState 返回的是 array 而不是 object 的原因就是为了**降低使用的复杂度**，返回数组的话可以直接根据顺序解构，而返回对象的话要想使用多次就需要定义别名了。

### 3.React Hooks 解决了哪些问题？

React Hooks 主要解决了以下问题：

**（1）在组件之间复用状态逻辑很难**

React 没有提供将可复用性行为“附加”到组件的途径（例如，把组件连接到 store）解决此类问题可以使用 render props 和 高阶组件。但是这类方案需要重新组织组件结构，这可能会很麻烦，并且会使代码难以理解。由 providers，consumers，高阶组件，render props 等其他抽象层组成的组件会形成“嵌套地狱”。尽管可以在 DevTools 过滤掉它们，但这说明了一个更深层次的问题：React 需要为共享状态逻辑提供更好的原生途径。

可以使用 Hook 从组件中提取状态逻辑，使得这些逻辑可以单独测试并复用。Hook 使我们在无需修改组件结构的情况下复用状态逻辑。 这使得在组件间或社区内共享 Hook 变得更便捷。

**（2）复杂组件变得难以理解**

在组件中，每个生命周期常常包含一些不相关的逻辑。例如，组件常常在 componentDidMount 和 componentDidUpdate 中获取数据。但是，同一个 componentDidMount 中可能也包含很多其它的逻辑，如设置事件监听，而之后需在 componentWillUnmount 中清除。相互关联且需要对照修改的代码被进行了拆分，而完全不相关的代码却在同一个方法中组合在一起。如此很容易产生 bug，并且导致逻辑不一致。

在多数情况下，不可能将组件拆分为更小的粒度，因为状态逻辑无处不在。这也给测试带来了一定挑战。同时，这也是很多人将 React 与状态管理库结合使用的原因之一。但是，这往往会引入了很多抽象概念，需要你在不同的文件之间来回切换，使得复用变得更加困难。

为了解决这个问题，Hook 将组件中相互关联的部分拆分成更小的函数（比如设置订阅或请求数据），而并非强制按照生命周期划分。你还可以使用 reducer 来管理组件的内部状态，使其更加可预测。

**（3）难以理解的 class**

除了代码复用和代码管理会遇到困难外，class 是学习 React 的一大屏障。我们必须去理解 JavaScript 中 this 的工作方式，这与其他语言存在巨大差异。还不能忘记绑定事件处理器。没有稳定的语法提案，这些代码非常冗余。大家可以很好地理解 props，state 和自顶向下的数据流，但对 class 却一筹莫展。即便在有经验的 React 开发者之间，对于函数组件与 class 组件的差异也存在分歧，甚至还要区分两种组件的使用场景。

为了解决这些问题，Hook 使你在非 class 的情况下可以使用更多的 React 特性。 从概念上讲，React 组件一直更像是函数。而 Hook 则拥抱了函数，同时也没有牺牲 React 的精神原则。Hook 提供了问题的解决方案，无需学习复杂的函数式或响应式编程技术

### 4.React Hook 的使用限制有哪些？

React Hooks 的限制主要有两条：

- 不要在循环、条件或嵌套函数中调用 Hook；
- 在 React 的函数组件中调用 Hook。

那为什么会有这样的限制呢？Hooks 的设计初衷是为了改进 React 组件的开发模式。在旧有的开发模式下遇到了三个问题。

- 组件之间难以复用状态逻辑。过去常见的解决方案是高阶组件、render props 及状态管理框架。
- 复杂的组件变得难以理解。生命周期函数与业务逻辑耦合太深，导致关联部分难以拆分。
- 人和机器都很容易混淆类。常见的有 this 的问题，但在 React 团队中还有类难以优化的问题，希望在编译优化层面做出一些改进。

这三个问题在一定程度上阻碍了 React 的后续发展，所以为了解决这三个问题，Hooks **基于函数组件**开始设计。然而第三个问题决定了 Hooks 只支持函数组件。

那为什么不要在循环、条件或嵌套函数中调用 Hook 呢？因为 Hooks 的设计是基于数组实现。在调用时按顺序加入数组中，如果使用循环、条件或嵌套函数很有可能导致数组取值错位，执行错误的 Hook。当然，实质上 React 的源码里不是数组，是链表。

这些限制会在编码上造成一定程度的心智负担，新手可能会写错，为了避免这样的情况，可以引入 ESLint 的 Hooks 检查插件进行预防。

### 5.useEffect 与 useLayoutEffect 的区别

**（1）共同点**

- **运用效果：** useEffect 与 useLayoutEffect 两者都是用于处理副作用，这些副作用包括改变 DOM、设置订阅、操作定时器等。在函数组件内部操作副作用是不被允许的，所以需要使用这两个函数去处理。
- **使用方式：** useEffect 与 useLayoutEffect 两者底层的函数签名是完全一致的，都是调用的 mountEffectImpl 方法，在使用上也没什么差异，基本可以直接替换。

**（2）不同点**

- **使用场景：** useEffect 在 React 的渲染过程中是被异步调用的，用于绝大多数场景；而 useLayoutEffect 会在所有的 DOM 变更之后同步调用，主要用于处理 DOM 操作、调整样式、避免页面闪烁等问题。也正因为是同步处理，所以需要避免在 useLayoutEffect 做计算量较大的耗时任务从而造成阻塞。
- **使用效果：** useEffect 是按照顺序执行代码的，改变屏幕像素之后执行（先渲染，后改变 DOM），当改变屏幕内容时可能会产生闪烁；useLayoutEffect 是改变屏幕像素之前就执行了（会推迟页面显示的事件，先改变 DOM 后渲染），不会产生闪烁。**useLayoutEffect 总是比 useEffect 先执行。**

在未来的趋势上，两个 API 是会长期共存的，暂时没有删减合并的计划，需要开发者根据场景去自行选择。React 团队的建议非常实用，如果实在分不清，先用 useEffect，一般问题不大；如果页面有异常，再直接替换为 useLayoutEffect 即可。

### 6\.React Hooks 在平时开发中需要注意的问题和原因

（1）**不要在循环，条件或嵌套函数中调用 Hook，必须始终在 React 函数的顶层使用 Hook**

这是因为 React 需要利用调用顺序来正确更新相应的状态，以及调用相应的钩子函数。一旦在循环或条件分支语句中调用 Hook，就容易导致调用顺序的不一致性，从而产生难以预料到的后果。

**（2）使用 useState 时候，使用 push，pop，splice 等直接更改数组对象的坑**

使用 push 直接更改数组无法获取到新值，应该采用析构方式，但是在 class 里面不会有这个问题。代码示例：

```jsx
function Indicatorfilter() {
  let [num, setNums] = useState([0, 1, 2, 3]);
  const test = () => {
    // 这里坑是直接采用push去更新num
    // setNums(num)是无法更新num的
    // 必须使用num = [...num ,1]
    num.push(1);
    // num = [...num ,1]
    setNums(num);
  };
  return (
    <div className="filter">
      <div onClick={test}>测试</div>
      <div>
        {num.map((item, index) => (
          <div key={index}>{item}</div>
        ))}
      </div>
    </div>
  );
}

class Indicatorfilter extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      nums: [1, 2, 3],
    };
    this.test = this.test.bind(this);
  }

  test() {
    // class采用同样的方式是没有问题的
    this.state.nums.push(1);
    this.setState({
      nums: this.state.nums,
    });
  }

  render() {
    let { nums } = this.state;
    return (
      <div>
        <div onClick={this.test}>测试</div>
        <div>
          {nums.map((item: any, index: number) => (
            <div key={index}>{item}</div>
          ))}
        </div>
      </div>
    );
  }
}
```

（3）**useState 设置状态的时候，只有第一次生效，后期需要更新状态，必须通过 useEffect**

TableDeail 是一个公共组件，在调用它的父组件里面，我们通过 set 改变 columns 的值，以为传递给 TableDeail 的 columns 是最新的值，所以 tabColumn 每次也是最新的值，但是实际 tabColumn 是最开始的值，不会随着 columns 的更新而更新：

```jsx
const TableDeail = ({ columns }: TableData) => {
  const [tabColumn, setTabColumn] = useState(columns);
};

// 正确的做法是通过useEffect改变这个值
const TableDeail = ({ columns }: TableData) => {
  const [tabColumn, setTabColumn] = useState(columns);
  useEffect(() => {
    setTabColumn(columns);
  }, [columns]);
};
```

**（4）善用 useCallback**

父组件传递给子组件事件句柄时，如果我们没有任何参数变动可能会选用 useMemo。但是每一次父组件渲染子组件即使没变化也会跟着渲染一次。

**（5）不要滥用 useContext**

可以使用基于 useContext 封装的状态管理工具。

### 7\.React Hooks 和生命周期的关系？

#### 对应关系

**函数组件** 的本质是函数，没有 state 的概念的，因此**不存在生命周期**一说，仅仅是一个 **render 函数**而已。 但是引入 **Hooks** 之后就变得不同了，它能让组件在不使用 class 的情况下拥有 state，所以就有了生命周期的概念，所谓的生命周期其实就是 `useState`、 `useEffect()` 和 `useLayoutEffect()` 。

即：**Hooks 组件（使用了 Hooks 的函数组件）有生命周期，而函数组件（未使用 Hooks 的函数组件）是没有生命周期的**。

下面是具体的 class 与 Hooks 的**生命周期对应关系**：

- `constructor`：函数组件不需要构造函数，可以通过调用 `useState 来初始化 state`。如果计算的代价比较昂贵，也可以传一个函数给 `useState`。

```jsx
const [num, UpdateNum] = useState(0);
```

- `getDerivedStateFromProps`：一般情况下，我们不需要使用它，可以在**渲染过程中更新 state**，以达到实现 `getDerivedStateFromProps` 的目的。

```jsx
function ScrollView({ row }) {
  let [isScrollingDown, setIsScrollingDown] = useState(false);
  let [prevRow, setPrevRow] = useState(null);
  if (row !== prevRow) {
    // Row 自上次渲染以来发生过改变。更新 isScrollingDown。
    setIsScrollingDown(prevRow !== null && row > prevRow);
    setPrevRow(row);
  }
  return `Scrolling down: ${isScrollingDown}`;
}
```

React 会立即退出第一次渲染并用更新后的 state 重新运行组件以避免耗费太多性能。

- `shouldComponentUpdate`：可以用 `**React.memo**` 包裹一个组件来对它的 `props` 进行浅比较

```jsx
const Button = React.memo((props) => {  // 具体的组件});
```

注意：` **React.memo 等效于 **``**PureComponent** `，它只浅比较 props。这里也可以使用 `useMemo` 优化每一个节点。

- `render`：这是函数组件体本身。
- `componentDidMount`, `componentDidUpdate`： `useLayoutEffect` 与它们两的调用阶段是一样的。但是，我们推荐你**一开始先用  useEffect**，只有当它出问题的时候再尝试使用 `useLayoutEffect`。`useEffect` 可以表达所有这些的组合。

```jsx
// componentDidMount
useEffect(() => {
  // 需要在 componentDidMount 执行的内容
}, []);
useEffect(() => {
  // 在 componentDidMount，以及 count 更改时 componentDidUpdate 执行的内容
  document.title = `You clicked ${count} times`;
  return () => {
    // 需要在 count 更改时 componentDidUpdate（先于 document.title = ... 执行，遵守先清理后更新）
    // 以及 componentWillUnmount 执行的内容
  }; // 当函数中 Cleanup 函数会按照在代码中定义的顺序先后执行，与函数本身的特性无关
}, [count]); // 仅在 count 更改时更新
```

**请记得 React 会等待浏览器完成画面渲染之后才会延迟调用 ，因此会使得额外操作很方便**

- `componentWillUnmount`：相当于 `useEffect`  里面返回的 `cleanup` 函数

```jsx
// componentDidMount/componentWillUnmount
useEffect(() => {
  // 需要在 componentDidMount 执行的内容
  return function cleanup() {
    // 需要在 componentWillUnmount 执行的内容
  };
}, []);
```

- `componentDidCatch` and `getDerivedStateFromError`：目前**还没有**这些方法的 Hook 等价写法，但很快会加上。

| **class 组件**           | **Hooks 组件**            |
| ------------------------ | ------------------------- |
| constructor              | useState                  |
| getDerivedStateFromProps | useState 里面 update 函数 |
| shouldComponentUpdate    | useMemo                   |
| render                   | 函数本身                  |
| componentDidMount        | useEffect                 |
| componentDidUpdate       | useEffect                 |
| componentWillUnmount     | useEffect 里面返回的函数  |
| componentDidCatch        | 无                        |
| getDerivedStateFromError | 无                        |

#### [**React Hooks 如何模拟生命周期**](https://blog.csdn.net/sinat_17775997/article/details/123838210)

在 React 16.8 之前，函数组件只能是无状态组件，也不能访问 react 生命周期。hook 做为 react 新增特性，可以让我们在不编写 class 的情况下使用 state 以及其他的 react 特性，例如生命周期。接下来我们便举例说明如何使用 hooks 来模拟比较常见的 class 组件生命周期。

##### constructor

class 组件

```js
class Example extends Component {
  constructor() {
    super();
    this.state = {
      count: 0,
    };
  }
  render() {
    return null;
  }
}
```

函[数组](https://so.csdn.net/so/search?q=数组&spm=1001.2101.3001.7020)件不需要构造函数,可以通过调用 useState 来初始化 state

```javascript
function Example() {
  const [count, setCount] = useState(0);
  return null;
}
```

##### componentDidMount

class 组件访问 componentDidMount

```js
class Example extends React.Component {
  componentDidMount() {
    console.log("I am mounted!");
  }
  render() {
    return null;
  }
}
```

使用 hooks 模拟 componentDidMount

```javascript
function Example() {
  useEffect(() => console.log("mounted"), []);
  return null;
}
```

useEffect 拥有两个参数，第一个参数作为回调函数会在浏览器布局和绘制完成后调用，因此它不会阻碍浏览器的渲染进程。
第二个参数是一个数组

- 当数组存在并有值时，如果数组中的任何值发生更改，则每次渲染后都会触发回调。
- 当它不存在时，每次渲染后都会触发回调。
- 当它是一个空列表时，回调只会被触发一次，类似于 componentDidMount。

##### shouldComponentUpdate

class 组件访问 shouldComponentUpdate

```javascript
shouldComponentUpdate(nextProps, nextState){
  console.log('shouldComponentUpdate')
  // return true 更新组件
  // return false 则不更新组件
}
```

hooks 模拟 shouldComponentUpdate

```javascript
const MyComponent = React.memo(
  _MyComponent,
  (prevProps, nextProps) => nextProps.count !== prevProps.count
);
```

React.memo 包裹一个组件来对它的 props 进行浅比较,但这不是一个 hooks，因为它的写法和 hooks 不同,其实 React.memo 等效于 PureComponent，但它只比较 props。

##### componentDidUpdate

class 组件访问 componentDidUpdate

```javascript
componentDidMount() {
  console.log('mounted or updated');
}

componentDidUpdate() {
  console.log('mounted or updated');
}
```

使用 hooks 模拟 componentDidUpdate

```js
useEffect(() => console.log("mounted or updated"));
```

值得注意的是，这里的回调函数会在每次渲染后调用，因此不仅可以访问 componentDidUpdate，还可以访问 componentDidMount，如果只想模拟 componentDidUpdate，我们可以这样来实现。

```javascript
const mounted = useRef();
useEffect(() => {
  if (!mounted.current) {
    mounted.current = true;
  } else {
    console.log("I am didUpdate");
  }
});
```

useRef 在组件中创建“实例变量”。它作为一个标志来指示组件是否处于挂载或更新阶段。当组件更新完成后在会执行 else 里面的内容，以此来单独模拟 componentDidUpdate。

##### componentWillUnmount

class 组件访问 componentWillUnmount

```javascript
componentWillUnmount() {
  console.log('will unmount');
}
```

hooks 模拟 componentWillUnmount

```javascript
useEffect(() => {
  return () => {
    console.log("will unmount");
  };
}, []);
```

当在 useEffect 的回调函数中返回一个函数时，这个函数会在组件卸载前被调用。我们可以在这里面清除定时器或事件监听器。

##### 总结

引入 hooks 的函数组件功能越来越完善，在多数情况下，我们完全可以使用 hook 来替代 class 组件。并且使用函数组件也有以下几点好处。

- 纯函数概念，同样的 props 会得到同样的渲染结果。
- 可以使用函数组合，嵌套，实现功能更加强大的组件。
- 组件不会被实例化，整体渲染性能得到提升。

但是 hooks 模拟的生命周期与 class 中的生命周期不尽相同，我们在使用时，还是需要思考业务场景下那种方式最适合。

### 8.**React Hook 的设计模式**

Dan 在 React Hooks 的介绍中 曾经说过：“忘记生命周期，以 effects 的方式开始思考”

#### **React.memo vs React.useMemo**

React.memo 是一个高阶组件，它的效果类似于 React.pureComponent。但在 Hooks 的场景下，更推荐使用 React.useMemo，因为它存在这样一个问题。就像如下的代码一样：

```js
function Banner() {
  let appContext = useContext(AppContext);
  let theme = appContext.theme;
  return <Slider theme={theme} />;
}
export default React.memo(Banner);
```

这段代码的意义是这样的，通过 useContext 获取全局的主题信息，然后给 Slider 组件换上主题。但是如果给最外层的 Banner 组件加上 React.memo，那么外部更新 appContext 的值的时候，Slider 就会被触发重渲染。

当然，我们可以通过**分拆组件**的方式阻断重渲染，但使用 React.useMemo 可以实现更精细化的控制。就像下面的代码一样，为 Slider 组件套上 React.useMemo，写上 theme 进行控制。

```js
function Banner() {
  let appContext = useContext(AppContext);
  let theme = appContext.theme;
  return React.useMemo(() => {
    return <Slider theme={theme} />;
  }, [theme]);
}
export default React.memo(Banner);
```

所有考虑到更宽广的使用场景与可维护性，更推荐使用 React.useMemo。

**（2）常量**

由于函数组件每次渲染时都会重新执行，所以常量应该放置到函数外部去，避免每次都重新创建。而如果定义的常量是一个函数，且需要使用组件内部的变量做计算，那么一定要使用 useCallback 缓存函数。

**（3）useEffect 第二个参数的判断问题**

在设计上它同样是进行浅比较，如果传入的是引用类型，那么很容易会判定不相等，所以尽量不要使用引用类型作为判断条件，很容易出错。

#### 组合 hooks

在这个案例中将 User 的所有操作归到一个自定义 Hook 中去操作，最终返回的值有 users、addUsers 及 deleteUser。其中 users 是通过 useState 获取；addUser 是通过 setUsers 添加 user 完成；deleteUser 通过过滤 userId 完成。代码如下所示：

```jsx
function useUsersManagement() {
  const [users, setUsers] = useState([]);

  function addUser(user) {
    setUsers([...users, user]);
  }

  function deleteUser(userId) {
    const userIndex = users.findIndex((user) => user.id === userId);
    if (userIndex > -1) {
      const newUsers = [...users];
      newUsers.splice(userIndex, 1);
      setUsers(newUsers);
    }
  }

  return {
    users,
    addUser,
    deleteUser,
  };
}
```

第二部分是通过 useAddUserModalManagement 这一个自定义 Hook 控制 Modal 的开关。与上面的操作类似。isAddUserModalOpened 表示了当前处于 Modal 开关状态，openAddUserModal 则是打开，closeAddUserModal 则是关闭。如下代码所示：

```jsx
function useAddUserModalManagement() {
  const [isAddUserModalOpened, setAddUserModalVisibility] = useState(false);

  function openAddUserModal() {
    setAddUserModalVisibility(true);
  }

  function closeAddUserModal() {
    setAddUserModalVisibility(false);
  }
  return {
    isAddUserModalOpened,
    openAddUserModal,
    closeAddUserModal,
  };
}
```

最后来看看在代码中运用的情况，引入 useUsersManagement 和 useAddUserModalManagement 两个自定义 Hook，然后在组件 UsersTable 与 AddUserModal 直接使用。UsersTable 直接展示 users 相关信息，通过操作 deleteUser 可以控制删减 User。AddUserModal 通过 isAddUserModalOpened 控制显隐，完成 addUser 操作。代码如下所示：

```js
import React from "react";
import AddUserModal from "./AddUserModal";
import UsersTable from "./UsersTable";
import useUsersManagement from "./useUsersManagement";
import useAddUserModalManagement from "./useAddUserModalManagement";

const Users = () => {
  const { users, addUser, deleteUser } = useUsersManagement();
  const { isAddUserModalOpened, openAddUserModal, closeAddUserModal } =
    useAddUserModalManagement();

  return (
    <>
      <button onClick={openAddUserModal}>Add user</button>
      <UsersTable users={users} onDelete={deleteUser} />
      <AddUserModal
        isOpened={isAddUserModalOpened}
        onClose={closeAddUserModal}
        onAddUser={addUser}
      />
    </>
  );
};

export default Users;
```

在上面的例子中，我们可以看到组件内部的逻辑已经被自定义 Hook 完全抽出去了。外观模式很接近提到的容器组件的概念，即在组件中通过各个自定义 Hook 去操作业务逻辑。每个自定义 Hook 都是一个独立的子模块，有属于自己的领域模型。基于这样的设计就可以避免 Hook 之间逻辑交叉，提升复用性。

#### 总结

首先用 Hooks 开发需要抛弃生命周期的思考模式，以 effects 的角度重新思考。过去类组件的开发模式中，在 componentDidMount 中放置一个监听事件，还需要考虑在 componentWillUnmount 中取消监听，甚至可能由于部分值变化，还需要在其他生命周期函数中对监听事件做特殊处理。在 Hooks 的设计思路中，可以将这一系列监听与取消监听放置在一个 useEffect 中，useEffect 可以不关心组件的生命周期，只需要关心外部依赖的变化即可，对于开发心智而言是极大的减负。这是 Hooks 的设计根本。

在这样一个认知基础上，我总结了一些在团队内部开发实践的心得，做成了开发规范进行推广。

第一点就是 **React.useMemo 取代 React.memo，因为 React.memo 并不能控制组件内部共享状态的变化，而 React.useMemo 更适合于 Hooks 的场景**。

第二点就是常量，在类组件中，我们很习惯将常量写在类中，但在组件函数中，这意味着每次渲染都会重新声明常量，这是完全无意义的操作。其次就是组件内的函数每次会被重新创建，如果这个函数需要使用函数组件内部的变量，那么可以用 useCallback 包裹下这个函数。

第三点就是 useEffect 的第二个参数容易被错误使用。很多同学习惯在第二个参数放置引用类型的变量，通常的情况下，引用类型的变量很容易被篡改，难以判断开发者的真实意图，所以更推荐使用值类型的变量。当然有个小技巧是 JSON 序列化引用类型的变量，也就是通过 JSON.stringify 将引用类型变量转换为字符串来解决。但不推荐这个操作方式，比较消耗性能

### 9.Hooks 中如何获取上一轮的 state

我们可以通过 ref 来保存上一轮获取到的 state，代码如下

```js
function Counter() {
  const [count, setCount] = useState(0);

  const prevCountRef = useRef();
  useEffect(() => {
    prevCountRef.current = count;
  });
  const prevCount = prevCountRef.current;

  return (
    <h1>
      Now: {count}, before: {prevCount}
    </h1>
  );
}
```

为了方便复用我们可以把它封装成一个 hooks 进行使用：

```js
function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}
```

> 解决的办法确实是找到了，但是凡事都的问一个为什么。我们需要理解一下为什么这么做就可以实现。

我们知道在 react 中 useEffect 中的操作表现的像是**异步**的，就是说每次执行 useEffect 代码块的时候都会将它放到一个链表中，等到同步的代码执行完成后再统一执行链表中的内容。所以此时 useRef 中的值还没有被修改，还是保存的上一轮的值，所以能够被访问到

### 10.setState 和 useState

类组件中的 `setState` 和函数组件中的 `useState` 有什么异同？

**相同点：**

- 首先从原理角度出发，setState 和 useState 更新视图，底层都调用了 scheduleUpdateOnFiber 方法，而且事件驱动情况下都有批量更新规则。

**不同点**

- 在**不是 pureComponent 组件模式**下， setState 不会浅比较两次 state 的值，**只要调用 setState，在没有其他优化手段的前提下，就会执行更新**。但是 useState 中的 dispatchAction 会**默认比较两次 state 是否相同，然后决定是否更新组件**。

- **setState 有专门监听 state 变化的回调函数 callback，可以获取最新 state；但是在函数组件中，只能通过 useEffect 来执行 state 变化引起的副作用。**

- setState 在底层处理逻辑上主要是和老 state 进行合并处理，而 useState 更倾向于重新赋值。

- **setState 会将多个调用合并为一个来执行**，也就是说，当执行 setState 的时候，state 中的数据并不会马上更新

- **同步执行时 useState 也会对 state 进行逐个处理，而 setState 则只会处理最后一次**

**setState 和 useState 是看起来像异步的同步，因为 react 的合并机制，多次调用不会立即更新，setState 是合并 state,useState 是执行最后一次，延迟执行但本身还在一个事件循环，如果脱离 react 事件，如原生事件或者 setTimeout/promise.then 里执行 setState 和 useState，就会得到同步代码。**

只要你进入了 `react` 的调度流程，那就是异步的。只要你没有进入 `react` 的调度流程，那就是同步的。什么东西不会进入 `react` 的调度流程？ `setTimeout` `setInterval` ，直接在 `DOM` 上绑定原生事件等。这些都不会走 `React` 的调度流程，你在这种情况下调用 `setState` ，那这次 `setState` 就是同步的。 否则就是异步的。

而 `setState` 同步执行的情况下， `DOM` 也会被同步更新，也就意味着如果你多次 `setState` ，会导致多次更新，这是毫无意义并且浪费性能的。

**同步更新解决方法**

react 的`setState`是不能变成同步的, 不论是在`函数组件`或是`class组件`

```coffeescript
setState({
    name: 'Ruofee'
}, () => {
    // setState回调函数
});
```

此处只是 set state 之后的一个回调, 实际上是等组件重新 render 再执行, 因此还是异步的
若是想监听`useState`某个值, 可以使用副作用钩子:

```js
useEffect(() => {
  // 监听name变化
}, [name]);
```

需要知道的是, 初始化时`useEffect`总会调用一次

### 11.useSate 异步更新

#### 引入

```javascript
function App() {
  const [n, setN] = useState(0);
  const onClick = () => {
    setN(n + 1);
    setN(n + 1); //  此时发现，n只能+1，而不会+2
    // setN(i=>i+1)
    // setN(i=>i+1)
  };
  return (
    <div className="App">
      <h1>n: {n}</h1>
      <button onClick={onClick}>+2</button>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
```

react 代码如上图：

- 直觉上当我们点击 button，应该会执行两次 setN，n 变为 2。
- **实际上：n 变为了 1**

#### 简单分析

**Fiber 对象**的上有一个**记录内部 `State` 对象的属性**，以便让我们能在**下次渲染的时候取到上一次的值**，叫做 `memoizedState` 。有了这个属性，我们的 FunctionComponent 就能有和 ClaassComponent 一样使用 `this.setState` 的能力了。

`Fiber.memoizedState` 是一个**单项链表**的结构。首先，我们的每一个 useState 都会在后面生成一个 hook 节点。而它会把当前组件所有 useState 对应的 hook 节点用 `next` 指针串起来，头结点就是 `Fiber.memoizedState`。 我们初始化的目的就是为了构造完成它。

hooks 以链表的形式存储在 fiber 节点的 memoizedState 属性上

![[外链图片转存失败,源站可能有防盗链机制,建议将图片保存下来直接上传(img-gUZAW6IT-1653354708608)(/Users/jianshuangpeng/Library/Application Support/typora-user-images/image-20220124173020063.png)]](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/Imgs/1c9519aa1712481ea2f8c0ef03de19e5.png)

分析：

1、在组件第一次渲染的时候，为每个 hooks 都创建了一个对象, 最终形成了一个链表.

2、在组件更新的过程中，hooks 函数执行的顺序是不变的，就可以根据这个链表拿到当前 hooks 对应的`Hook`对象，函数式组件就是这样拥有了 state 的能力。

react 中虚拟 dom----workInProgress 树有一个**memoizedState**属性,这个属性是用来存放 hooks 相关信息的,也就是说 state 是存在虚拟 dom 里面的.

hooks 信息是一个对象.这个对象里除了本身的值和更新函数外,还需要记录一些其他的信息,比如下一次的 useState 更新指向的 hook 信息等.那假如一个函数组件中有多个 useState 怎么办?hooks 采用了数组存放的形式,也就算是在同一个组件中,所有的**hook 对象**是存 在一个**数组**中的.如:

```js
_hook: [
  { value: 1, uplate: function1, next: hook1 },
  { value: 2, uplate: function2, next: hook2 },
];
```

useState 更新时,会**依次**去执行 hook 对象数组里面的更新函数,从而修改虚拟 dom,然后在完成一次组件更新后，会把当前 workInProgress 树赋值给 current 树，current 会在 commit 阶段替换成真实的 Dom 树

**我们再回头解释一下 hooks 使用的规则 1,为什么 hooks 只能在顶层调用?**

diff 算法会根据前后的虚拟 dom 去更新,useState 也存在这个现象.也就是说,useState 会根据前后的虚拟 dom 去更新,而 hook 信息是存在虚拟 dom 里面的,也就是说,会存在前后两个 hook 对象数组.而数据的对比更新是按照下标来的.也就是说,假如前后的数组长度不一样,就 会导致更新混乱,即 useState 的使用必须是明确而且不变的.假如

```js
if (a > 0) {
  const [state, setState] = useState();
}

const [state1, setState1] = useState();
```

这种结果会出现什么现象?a 大于 0 和小于 0 的时候 hooks 数组长度和顺序是不一致的

a>0

```js
_hook: [
  { value: 1, uplate: function1, next: hook1 },
  { value: 2, uplate: function2, next: hook2 },
];
```

a<=0

```js
_hook: [{ value: 2, uplate: function2, next: hook2 }];
```

也就是说,当我 a<=0 时,更新 state1 会拿到 value:1 的值,因为 a<=0 时,state1 的索引是 0,而 0 对应旧 hook 数组里的 value:1,而不是它原本应该在的 value:2.

**总结一下原因就是,hooks 信息是存在数组里的,而每次更新都是根据索引更新的,因此,usestate 的使用必须是明确的,保证 hoos 数组的元素数量是一致的.**

#### 为什么 n 是 1，而不是 2？

- 我们知道：
  1. useState 每次执行会返回一个新的 state（简单类型的等值拷贝）
  2. setState 会触发 UI 更新（重新 render，执行函数组件）
  3. 由于 UI 更新是异步任务，所以 setState 也是一个异步过程

当我们两次`setN(n+1)`时候，实际上形成了两个**闭包**，都保存了对此时 n 的状态（n=0）的引用。
在 setN 后：

1. 先分别生成了两个新的 n，数值上都等于 n+1（即 1），但彼此无关。
2. 分别进行了 render，而只有最新一次 render 有效，此次 render 引用了最后一次 setN 函数里生成的 n。

#### 解决方法

1.利用函数，接收旧值，进行更新

```js
// 利用函数，接收旧值，进行更新
setState((x) => x + 1);
```

- 接收的函数 `x=>x+1` 并未保持对 n 的引用，而是表达了一种 **加 1** 操作
- 推荐使用函数代码进行 `setState`

  2.通过 useEffect

```js
const [state, setState] = useState(123);
useEffect(() => {
  // 这里能拿到最新的state
}, [state]);
```

### 12.使用 useState 更新变量后，怎么拿到变量更新后的值

场景： const [count, setCount] = useState(0)；

在 setCount() 更新变量的值后，立即调用某个函数 query，在函数中需要读取到这个变量的新值；但是此时直接调用的话拿到的是旧值；

**为什么变量更新后不能立即拿到新值？** 因为 setCount 函数用于更新 count 值。它接收一个新的 count 值并将组件的一次重新渲染加入队列中，在组件的重新渲染中，useState()返回的第一个值始终是 count 更新后的新值，所以**如果组件还未重新渲染就直接读取 count 变量的话，拿到的就是未更新的旧值**；

```typescript
const UseState = () => {
  // 函数组件中没有this
  const [count, setCount] = useState(0);

  const add = () => {
    let newCount = count;
    console.log("value1", count); // 0
    setCount((newCount += 1));
    console.log("value2", count); // 0
    query();
  };

  const query = () => {
    console.log("query函数中：", count); // 0
  };
  return (
    <div>
      <p>{count}</p>
      <button onClick={add}>增加</button>
    </div>
  );
};
```

打印结果：

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/Imgs/11541613c7b245458f5cf25d7a5153a3.png)

解决方法：

1）可以将 count 的新值通过函数传参的方式传入 query 函数；

```js
// 改写add和query函数；

const add = () => {
  let newCount = count;
  console.log("value1", count);
  setCount((newCount += 1));
  console.log("value2", count);
  query(newCount);
};
const query = (count) => {
  console.log("query函数中：", count);
};
```

打印结果：

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/Imgs/8e58daf8256d48c299e533c692083253.png)

2）在 useEffect 中调用 query 函数，因为**在 useEffect 中，组件 dom 已经更新完毕**，可以拿到 count 的最新值；（缺点：每次 count 值改变，都会触发 useEffect，从而执行 query 函数；）

```js
// 组件每次渲染之后执行的操作，执行该操作时dom都已经更新完毕
useEffect(() => {
  // 1、可在此处拿到count更新后的值
  console.log("value3", count);
  query();
}, [count]);

const add = () => {
  let newCount = count;
  console.log("value1", count);
  setCount((newCount += 1));
  console.log("value2", count);
};
const query = () => {
  console.log("query函数中：", count);
};
```

打印结果：

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/Imgs/b8c0487eb1ce4e3e8ac74beae8912b9a.png)

3）通过 useRef()定义一个可变的 ref 变量，通过 current 属性保存 count 可变值，从而在 count 更新后，通过 ref 的 current 属性拿到更新后的 count 值；注意：调用 query 函数时需要加上 setTimeout()进行调用；

```js
// 定义一个可变的countRef对象，该对象的current属性被初始化为传入的参数count;
const countRef = useRef(count);

// 在countRef.current属性中保存一个可变值count的盒子；
countRef.current = count;

const add = () => {
  let newCount = count;
  console.log("value1", count);
  setCount((newCount += 1));
  console.log("value2", count);
  setTimeout(() => query(), 0);
};

const query = () => {
  console.log("query函数中：", countRef.current);
};
```

打印结果：

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/Imgs/611e36640f634bf88387b36c65276aa8.png)

### 13.useEffect 的执行

#### 问题

作为`React`开发者，你能答上如下两个问题么：

1.对于如下函数组件：

```js
function Child() {
  useEffect(() => {
    console.log("child");
  }, []);

  return <p>hello</p>;
}

function Parent() {
  useEffect(() => {
    console.log("parent");
  }, []);

  return <Child />;
}

function App() {
  useEffect(() => {
    console.log("app");
  }, []);

  return <Parent />;
}
```

渲染`<App/>`时控制台的打印顺序是？

`child -> parent -> app`

2.如下两个回调函数的调用时机相同么？

不同

```js
// componentDidMount生命周期钩子
class App extends React.Component {
  componentDidMount() {
    console.log("hello");
  }
}

// 依赖为[]的useEffect
useEffect(() => {
  console.log("hello");
}, []);
```

两个问题分别考察的是：

- `useEffect`的执行顺序
- `useEffect`如何介入`React`工作流程

#### useEffect 的执行顺序

`React`的源码可以拆分为三块：

- 调度器：调度更新
- 协调器：决定更新的内容
- 渲染器：将更新的内容渲染到视图中

其中，只有`渲染器`会执行渲染视图操作。

对于浏览器环境来说，只有`渲染器`会执行类似`appendChild`、`insertBefore`这样的`DOM`操作。

`协调器`如何决定更新的内容呢？

答案是：他会为需要更新的内容对应的`fiber`（可以理解为`虚拟DOM`）打上标记。

这些被打标记的`fiber`会形成一条链表`effectList`。

`渲染器`会遍历`effectList`，执行标记对应的操作。

- 比如`Placement`标记对应插入`DOM`
- 比如`Update`标记对应更新`DOM`属性

`useEffect`也遵循同样的工作原理：

1. 触发更新时，`FunctionComponent`被执行，执行到`useEffect`时会判断他的第二个参数`deps`是否有变化。
2. 如果`deps`变化，则`useEffect`对应`FunctionComponent`的`fiber`会被打上`Passive`（即：需要执行 useEffect）的标记。
3. 在`渲染器`中，遍历`effectList`过程中遍历到该`fiber`时，发现`Passive`标记，则依次执行该`useEffect`的`destroy`（即`useEffect`回调函数的返回值函数）与`create`（即`useEffect`回调函数）。

其中，前两步发生在`协调器`中。

所以，`effectList`构建的顺序就是`useEffect`的执行顺序。

#### effectList

`协调器`的工作流程是使用`遍历`实现的`递归`。所以可以分为`递`与`归`两个阶段。

我们知道，`递`是从根节点向下一直到叶子节点，`归`是从叶子节点一路向上到根节点。

`effectList`的构建发生在`归`阶段。所以，`effectList`的顺序也是从叶子节点一路向上。

`useEffect`对应`fiber`作为`effectList`中的一个节点，他的调用逻辑也遵循`归`的流程。

现在，我们有充足的知识回答第一个问题：

由于`归`阶段是从`Child`到`Parent`到`App`，所以相应`effectList`也是同样的顺序。

所以`useEffect`回调函数执行也是同样的顺序。

#### 渲染

按照流程，`effectList`会在`渲染器`中被处理。

对于`useEffect`来说，遍历`effectList`时，会找到的所有包含`Passive`标记的`fiber`。

依次执行对应`useEffect`的`destroy`。

所有`destroy`执行完后，再依次执行所有`create`。

整个过程是在页面渲染后异步执行的。

回答第二个问题：

如果`useEffect`的`deps`为`[]`，由于`deps`不会改变，对应`fiber`只会在`mount`时被标记`Passive`。

这点是类似`componentDidMount`的。

但是，处理`Passive` `effect`是在渲染完成后异步执行，而`componentDidMount`是在渲染完成后同步执行，所以他们是不同的。

#### 依赖问题

1.当第二个参数是空，**挂载和更新都渲染**。

2.当第二个参数是空数组[]，**挂载进行渲染**。

3.当[数据]

当依赖是**基础数据类型**时，**挂载和更新渲染**

当依赖是**引用类型,数组和对象**时，会一直渲染 ，因为 useEffect 是**浅层对比**，**每次比较返回的结果都是 false**

4.解决办法：

A={a:1,b:1}

useEffect(()=>{},[A]

1、依赖改为设置对象或者数组中的某个值，如 useEffect(()=>{},[A.a]

2、使用 usePrevious,利用 useRef 能保存上一次渲染内容的办法

```typescript
import React, { useState, useRef, useEffect } from "react";
function usePrevious<T>(
  state: T,
  compare?: (prev: T | undefined, next: T) => boolean
): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    const needUpdate =
      typeof compare === "function" ? compare(ref.current, state) : true;
    if (needUpdate) {
      ref.current = state;
    }
  });

  return ref.current;
}

function A(props) {
  const [obj, setObj] = useState({ a: 1, b: 1 });
  const preObj = usePrevious(obj);
  useEffect(() => {
    if (preObj && preObj.a != obj.a) console.log(obj.a);
  }, [obj]);
  return <></>;
}
```

### 14.Hooks 更新机制

Fiber 可以保存真实的 dom，真实 dom 对应在内存中的 Fiber 节点会形成 Fiber 树，这颗 Fiber 树在 react 中叫 current Fiber，也就是当前 dom 树对应的 Fiber 树，而正在构建 Fiber 树叫 workInProgress Fiber，这两颗树的节点通过 alternate 相连.

构建 workInProgress Fiber 发生在 createWorkInProgress 中，它能创建或者服用 Fiber

在 mount 时：会创建 fiberRoot 和 rootFiber，然后根据 jsx 对象创建 Fiber 节点，节点连接成 current Fiber 树。

在 update 时：会根据新的状态形成的 jsx（ClassComponent 的 render 或者 FuncComponent 的返回值）和 current Fiber 对比形（diff 算法）成一颗叫 workInProgress 的 Fiber 树，然后将 fiberRoot 的 current 指向 workInProgress 树，此时 workInProgress 就变成了 current Fiber。fiberRoot：指整个应用的根节点，只存在一个

存在 current Fiber 和 workInProgress Fiber 两颗 Fiber 树，Fiber 双缓存指的就是，在经过 reconcile（diff）形成了新的 workInProgress Fiber 然后将 workInProgress Fiber 切换成 current Fiber 应用到真实 dom 中，存在双 Fiber 的好处是在内存中形成视图的描述，在最后应用到 dom 中，减少了对 dom 的操作。

Fiber 双缓存创建的过程图\*\*：

- **mount 时：**

  1.  刚开始只创建了 fiberRoot 和 rootFiber 两个节点 ![react源码7.6](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/img/20210529105732.png)

  2.  然后根据 jsx 创建 workInProgress Fiber： ![react源码7.7](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/img/20210529105735.png)

  3.  把 workInProgress Fiber 切换成 current Fiber ![react源码7.8](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/img/20210529105738.png)

- **update 时**

  1.  根据 current Fiber 创建 workInProgress Fiber ![react源码7.9](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/img/20210529105741.png)
  2.  把 workInProgress Fiber 切换成 current Fiber

![react源码7.8](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/img/20210529105745.png)

### hooks 案例

[hooks 的典型案例](https://blog.csdn.net/jiaojsun/article/details/105298510)

#### 清除 effect

通常，组件卸载时需要清除 effect 创建的诸如订阅或计时器 ID 等资源。要实现这一点，useEffect 函数需返回一个清除函数。也就是说，要想在组件销毁的时候搞一些事情，需要 useEffect 末尾返回一个函数，在这个函数里面可以写具体销毁的内容。

看下面的例子，在当前页面里面，页面的标题是'测试 title'，当切换到其他页面时，页面的标题变成‘前端精读’

```js
import React, { useEffect } from "react";

function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title;
    return () => {
      console.log("销毁1————————————————");
      document.title = "前端精读";
    };
  }, [title]);
}

export default function CheckboxDemo() {
  useDocumentTitle("测试title");

  return <div />;
}
```

#### 监听页面大小变化，网络是否断开

效果：在组件调用 useWindowSize 时，可以拿到页面大小，并且在浏览器缩放时自动触发组件更新。

```js
import React, { useEffect, useState } from 'react';

function getSize() {
  return {
    innerHeight: window.innerHeight,
    innerWidth: window.innerWidth,
    outerHeight: window.outerHeight,
    outerWidth: window.outerWidth,
  };
}

function useWindowSize() {
  const [windowSize, setWindowSize] = useState(getSize());

  function handleResize() {
    setWindowSize(getSize());
  }

  useEffect(() => {
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };

  }, []);
  return windowSize;
}

export default function Demo() {
  const windowSize = useWindowSize();
  return <div>页面宽度{windowSize.innerWidth}</div>;
}

动态注入 css
效果：在页面注入一段 class，并且当组件销毁时，移除这个 class。

const className = useCss({
  color: "red"
});

return <div className={className}>Text.</div>;
```

实现：可以看到，Hooks 方便的地方是在组件销毁时移除副作用，所以我们可以安心的利用 Hooks 做一些副作用。注入 css 自然不必说了，而销毁 css 只要找到注入的那段引用进行销毁即可，具体可以看这个 代码片段。

DOM 副作用修改 / 监听场景有一些现成的库了，从名字上就能看出来用法： document-visibility、 network-status、 online-status、 window-scroll-position、 window-size、 document-title。
组件辅助
Hooks 还可以增强组件能力，比如拿到并监听组件运行时宽高等。

#### 获取组件宽高

效果：通过调用 useComponentSize 拿到某个组件 ref 实例的宽高，并且在宽高变化时，rerender 并拿到最新的宽高。

```js
import React, { useLayoutEffect, useState, useRef } from "react";

function getSize(el) {
  if (!el) {
    return {};
  }

  return {
    width: el.offsetWidth,
    height: el.offsetHeight,
  };
}

function useComponentSize(ref) {
  const [ComponentSize, setComponentSize] = useState(getSize(ref.current));

  function handleResize() {
    if (ref && ref.current) {
      setComponentSize(getSize(ref.current));
    }
  }

  useLayoutEffect(() => {
    handleResize();

    let resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(ref.current);

    return () => {
      resizeObserver.disconnect(ref.current);
      resizeObserver = null;
    };
  }, []);
  return ComponentSize;
}

export default function Demo() {
  const ref = useRef(null);
  const componentSize = useComponentSize(ref);
  return (
    <>
      {componentSize.width}

      <textarea ref={ref} />
    </>
  );
}
```

#### 拿到组件 onChange 抛出的值

效果：通过 useInputValue() 拿到 Input 框当前用户输入的值，而不是手动监听 onChange 再腾一个 otherInputValue 和一个回调函数把这一堆逻辑写在无关的地方。

```js
import React, { useState, useCallback } from "react";

function useInputValue(initialValue) {
  const [value, setValue] = useState(initialValue);
  const onChange = useCallback(function (e) {
    setValue(e.currentTarget.value);
  }, []);
  return {
    value,
    onChange,
  };
}

export default function Demo() {
  const name = useInputValue("jjsun");
  return (
    <>
      {name.value}
      <input {...name} />
    </>
  );
}
```

### hooks 原理

#### function 组件和 class 组件本质的区别

在解释`react-hooks`原理的之前，我们要加深理解一下， **函数组件和类组件到底有什么区别**，废话不多说，我们先看 两个代码片段。

```jsx
class Index extends React.Component<any, any> {
  constructor(props) {
    super(props);
    this.state = {
      number: 0,
    };
  }
  handerClick = () => {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.setState({ number: this.state.number + 1 });
        console.log(this.state.number);
      }, 1000);
    }
  };

  render() {
    return (
      <div>
        <button onClick={this.handerClick}>num++</button>
      </div>
    );
  }
}
```

打印结果？

再来看看函数组件中：

```jsx
function Index() {
  const [num, setNumber] = React.useState(0);
  const handerClick = () => {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        setNumber(num + 1);
        console.log(num);
      }, 1000);
    }
  };
  return <button onClick={handerClick}>{num}</button>;
}
```

打印结果？

\------------公布答案-------------

在第一个例子 🌰 打印结果： 1 2 3 4 5

在第二个例子 🌰 打印结果： 0 0 0 0 0

这个问题实际很蒙人，我们来一起分析一下,第一个类组件中，由于执行上`setState`没有在`react`正常的函数执行上下文上执行，而是`setTimeout`中执行的，**批量更新**条件被破坏。原理这里我就不讲了,所以可以直接获取到变化后的`state`。

但是在无状态组件中，似乎没有生效。原因很简单，在`class`状态中，通过一个实例化的`class`，去维护组件中的各种状态；但是在`function`组件中，没有一个状态去保存这些信息，每一次函数上下文执行，所有变量，常量都重新声明，执行完毕，再被垃圾机制回收。所以如上，无论`setTimeout`执行多少次，都是在当前函数上下文执行,此时`num = 0`不会变，之后`setNumber`执行，函数组件重新执行之后，`num`才变化。

所以， 对于`class`组件，我们只需要实例化一次，实例中保存了组件的`state`等状态。对于每一次更新只需要调用`render`方法就可以。但是在`function`组件中，每一次更新都是一次新的函数执行,为了保存一些状态,执行一些副作用钩子,`react-hooks`应运而生，去帮助记录组件的状态，处理一些额外的副作用。

#### 一 初识：揭开 hooks 的面纱

##### 1.引入 hooks 时候发生了什么

我们从引入 `hooks`开始，以`useState`为例子，当我们从项目中这么写：

```js
import { useState } from "react";
```

于是乎我们去找`useState`,看看它到底是哪路神仙？

`react/src/ReactHooks.js`

**useState**

```js
export function useState(initialState) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState);
}
```

`useState()` 的执行等于 `dispatcher.useState(initialState)` 这里面引入了一个`dispatcher`，我们看一下`resolveDispatcher`做了些什么？

**resolveDispatcher**

```js
function resolveDispatcher() {
  const dispatcher = ReactCurrentDispatcher.current;
  return dispatcher;
}
```

**ReactCurrentDispatcher**

`react/src/ReactCurrentDispatcher.js`

```js
const ReactCurrentDispatcher = {
  current: null,
};
```

我们看到**`ReactCurrentDispatcher.current`初始化的时候为`null`**，然后就没任何下文了。我们暂且只能把`ReactCurrentDispatcher`记下来。看看`ReactCurrentDispatcher`什么时候用到的 ？

##### 2.从无状态组件的函数执行说起

想要彻底弄明白`hooks`，就要从其根源开始，上述我们在引入`hooks`的时候，最后以一个`ReactCurrentDispatcher`草草收尾，线索全部断了，所以接下来我们只能从**函数组件执行**开始。

###### renderWithHooks 执行函数

对于`function`组件是什么时候执行的呢？

`react-reconciler/src/ReactFiberBeginWork.js`

`function`组件初始化：

```jsx
renderWithHooks(
  null, // current Fiber
  workInProgress, // workInProgress Fiber
  Component, // 函数组件本身
  props, // props
  context, // 上下文
  renderExpirationTime // 渲染 ExpirationTime
);
```

**对于初始化是没有`current`树的，之后完成一次组件更新后，会把当前`workInProgress`树赋值给`current`树。**

`function`组件更新：

```jsx
renderWithHooks(
  current,
  workInProgress,
  render,
  nextProps,
  context,
  renderExpirationTime
);
```

我们从上边可以看出来，`renderWithHooks`函数作用是**调用`function`组件函数**的主要函数。我们重点看看`renderWithHooks`做了些什么？

**renderWithHooks** `react-reconciler/src/ReactFiberHooks.js`

```jsx
export function renderWithHooks(
  current,
  workInProgress,
  Component,
  props,
  secondArg,
  nextRenderExpirationTime
) {
  renderExpirationTime = nextRenderExpirationTime;
  currentlyRenderingFiber = workInProgress;

  workInProgress.memoizedState = null;
  workInProgress.updateQueue = null;
  workInProgress.expirationTime = NoWork;

  ReactCurrentDispatcher.current =
    current === null || current.memoizedState === null
      ? HooksDispatcherOnMount
      : HooksDispatcherOnUpdate;

  let children = Component(props, secondArg);

  if (workInProgress.expirationTime === renderExpirationTime) {
    // ....这里的逻辑我们先放一放
  }

  ReactCurrentDispatcher.current = ContextOnlyDispatcher;

  renderExpirationTime = NoWork;
  currentlyRenderingFiber = null;

  currentHook = null;
  workInProgressHook = null;

  didScheduleRenderPhaseUpdate = false;

  return children;
}
```

**所有的函数组件执行，都是在这里方法中**,首先我们应该明白几个感念，这对于后续我们理解`useState`是很有帮助的。

`current fiber树`: 当**完成一次渲染之后**，会产生一个`current`树,`current`会在`commit`阶段替换成真实的`Dom`树。

`workInProgress fiber树`: 即将**调和渲染**的 `fiber` 树。在一次新的组件更新过程中，会从`current`复制一份作为`workInProgress`,更新完毕后，将当前的`workInProgress`树赋值给`current`树。

`workInProgress.memoizedState`: 在`class`组件中，`memoizedState`存放`state`信息，在`function`组件中，**`memoizedState`在一次调和渲染过程中，以链表的形式存放`hooks`信息。**

`workInProgress.expirationTime`: `react`用不同的`expirationTime`,来确定更新的优先级。

`currentHook` : 可以理解 `current`树上的**指向的当前调度**的 `hooks`节点。

`workInProgressHook` : 可以理解 `workInProgress`树上指向的当前调度的 `hooks`节点。

**`renderWithHooks`函数主要作用:**

首先先**置空**即将调和渲染的`workInProgress`树的`memoizedState`和`updateQueue`，为什么这么做，因为在**接下来的函数组件执行过程**中，要把新的`hooks`信息挂载到这两个属性上，然后在组件`commit`阶段，将`workInProgress`树替换成`current`树，替换真实的`DOM`元素节点。并在`current`树保存`hooks`信息。

然后根据当前函数组件**是否是第一次渲染**，赋予`ReactCurrentDispatcher.current`不同的`hooks`,终于和上面讲到的`ReactCurrentDispatcher`联系到一起。对于第一次渲染组件，那么用的是`HooksDispatcherOnMount` hooks 对象。 对于渲染后，需要更新的函数组件，则是`HooksDispatcherOnUpdate`对象，那么两个不同就是通过`current`树上是否`memoizedState`（hook 信息）来判断的。如果`current`不存在，证明是第一次渲染函数组件。

接下来，调用`Component(props, secondArg);`执行我们的函数组件，我们的函数组件在这里真正的被执行了，然后，我们写的`hooks`被依次执行，把`hooks`信息依次保存到`workInProgress`树上。

接下来，也很重要，将`ContextOnlyDispatcher`赋值给 `ReactCurrentDispatcher.current`，由于`js`是单线程的，也就是说我们**没有**在函数组件中，调用的`hooks`，都是`ContextOnlyDispatcher`对象上`hooks`,我们看看`ContextOnlyDispatcher`hooks，到底是什么。

```jsx
const ContextOnlyDispatcher = {
  useState: throwInvalidHookError,
};
function throwInvalidHookError() {
  invariant(
    false,
    "Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for" +
      " one of the following reasons:\n" +
      "1. You might have mismatching versions of React and the renderer (such as React DOM)\n" +
      "2. You might be breaking the Rules of Hooks\n" +
      "3. You might have more than one copy of React in the same app\n" +
      "See https://fb.me/react-invalid-hook-call for tips about how to debug and fix this problem."
  );
}
```

原来如此，`react-hooks`就是通过这种**函数组件执行赋值不同**的`hooks`对象方式，判断在`hooks`执行是否在函数组件内部，捕获并抛出异常的。

最后，重新置空一些变量比如`currentHook`，`currentlyRenderingFiber`,`workInProgressHook`等。

##### 3.不同的`hooks`对象

上述讲到在函数**第一次渲染组件**和**更新组件**分别调用不同的`hooks`对象，我们现在就来看看`HooksDispatcherOnMount` 和 `HooksDispatcherOnUpdate`。

**第一次渲染(我这里只展示了常用的`hooks`)：**

```jsx
const HooksDispatcherOnMount = {
  useCallback: mountCallback,
  useEffect: mountEffect,
  useLayoutEffect: mountLayoutEffect,
  useMemo: mountMemo,
  useReducer: mountReducer,
  useRef: mountRef,
  useState: mountState,
};
```

**更新组件：**

```jsx
const HooksDispatcherOnUpdate = {
  useCallback: updateCallback,
  useEffect: updateEffect,
  useLayoutEffect: updateLayoutEffect,
  useMemo: updateMemo,
  useReducer: updateReducer,
  useRef: updateRef,
  useState: updateState,
};
```

看来对于第一次渲染组件，和更新组件，`react-hooks`采用了两套`Api`，本文的第二部分和第三部分，将重点两者的联系。

我们用流程图来描述整个过程：

<img src="https://s2.loli.net/2022/08/12/Bg5IemuDhxFCNj1.webp" alt="17AC0A26-745A-4FD8-B91B-7CADB717234C.jpg"  />

#### 二 hooks 初始化，我们写的 hooks 会变成什么样子

本文将重点围绕四个重点`hooks`展开，分别是负责组件更新的`useState`，负责执行副作用`useEffect` ,负责保存数据的`useRef`,负责缓存优化的`useMemo`， 至于`useCallback`,`useReducer`,`useLayoutEffect`原理和那四个重点`hooks`比较相近，就不一一解释了。

我们先写一个组件，并且用到上述四个主要`hooks`：

**请记住如下代码片段，后面讲解将以如下代码段展开**

```jsx
import React, { useEffect, useState, useRef, useMemo } from "react";
function Index() {
  const [number, setNumber] = useState(0);
  const DivDemo = useMemo(() => <div> hello , i am useMemo </div>, []);
  const curRef = useRef(null);
  useEffect(() => {
    console.log(curRef.current);
  }, []);
  return (
    <div ref={curRef}>
      hello,world {number}
      {DivDemo}
      <button onClick={() => setNumber(number + 1)}>number++</button>
    </div>
  );
}
```

接下来我们一起研究一下我们上述写的四个`hooks`最终会变成什么？

##### 1 mountWorkInProgressHook

在**组件初始化**的时候,每一次`hooks`执行，如`useState()`,`useRef()`,都会调用`mountWorkInProgressHook`,`mountWorkInProgressHook`到底做了些什么，让我们一起来分析一下：

`react-reconciler/src/ReactFiberHooks.js -> mountWorkInProgressHook`

```jsx
function mountWorkInProgressHook() {
  const hook: Hook = {
    memoizedState: null, // useState中 保存 state信息 ｜ useEffect 中 保存着 effect 对象 ｜ useMemo 中 保存的是缓存的值和deps ｜ useRef中保存的是ref 对象
    baseState: null,
    baseQueue: null,
    queue: null,
    next: null,
  };
  if (workInProgressHook === null) {
    // 例子中的第一个`hooks`-> useState(0) 走的就是这样。
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    workInProgressHook = workInProgressHook.next = hook;
  }
  return workInProgressHook;
}
```

`mountWorkInProgressHook`这个函数做的事情很简单，首先**每次执行**一个`hooks`函数，都产生一个`hook`对象，里面保存了当前`hook`信息,然后将每个`hooks`以**链表形式串联**起来，并赋值给`workInProgress`的`memoizedState`。也就证实了上述所说的，**函数组件用`memoizedState`存放`hooks`链表**。

至于`hook`对象中都保留了那些信息？我这里先分别介绍一下 :

**memoizedState**： `useState`中保存 `state` 信息 ｜ `useEffect` 中 保存着 `effect` 对象 ｜ `useMemo` 中 保存的是缓存的值和 `deps` ｜ `useRef` 中保存的是 `ref` 对象。

**baseQueue** : `usestate`和`useReducer`中 保存**最新的更新队列**。

**baseState** ： `usestate`和`useReducer`中,一次更新中 ，产生的最新`state`值。

**queue** ： 保存待更新队列 `pendingQueue` ，更新函数 `dispatch` 等信息。

**next**: 指向下一个 `hooks`对象。

那么当我们函数组件执行之后，四个`hooks`和`workInProgress`将是如图的关系。

![shunxu.jpg](https://s2.loli.net/2022/08/12/oDUnd9GiwV6k5Q7.webp)

知道每个`hooks`关系之后，我们应该理解了，为什么不能条件语句中，声明`hooks`。

我们用一幅图表示如果**在条件语句中声明会出现什么情况发生**。

如果我们将上述`demo`其中的一个 `useRef` 放入条件语句中，

```jsx
let curRef = null;
if (isFisrt) {
  curRef = useRef(null);
}
```

![hoo11.jpg](https://s2.loli.net/2022/08/12/P7Dzl5XmVMUxCAE.webp)

**因为一旦在条件语句中声明`hooks`，在下一次函数组件更新，`hooks`链表结构，将会被破坏，`current`树的`memoizedState`缓存`hooks`信息，和当前`workInProgress`不一致，如果涉及到读取`state`等操作，就会发生异常。**

上述介绍了 **`hooks`通过什么来证明唯一性的，答案 ，通过`hooks`链表顺序**。和为什么不能在条件语句中，声明`hooks`，接下来我们按照四个方向，分别介绍初始化的时候发生了什么？

##### 2 初始化 useState -> mountState

###### **mountState**

```jsx
function mountState(initialState) {
  const hook = mountWorkInProgressHook();
  if (typeof initialState === "function") {
    // 如果 useState 第一个参数为函数，执行函数得到state
    initialState = initialState();
  }
  hook.memoizedState = hook.baseState = initialState;
  const queue = (hook.queue = {
    pending: null, // 带更新的
    dispatch: null, // 负责更新函数
    lastRenderedReducer: basicStateReducer, //用于得到最新的 state ,
    lastRenderedState: initialState, // 最后一次得到的 state
  });

  const dispatch = (queue.dispatch = dispatchAction.bind(
    // 负责更新的函数
    null,
    currentlyRenderingFiber,
    queue
  ));
  return [hook.memoizedState, dispatch];
}
```

`mountState`到底做了些什么，首先会得到**初始化**的`state`，将它赋值给`mountWorkInProgressHook`产生的`hook`对象的 `memoizedState`和`baseState`属性，然后**创建一个`queue`对象**，里面保存了**负责更新**的信息。

这里先说一下，在**无状态组件**中，`useState`和`useReducer`触发**函数更新的方法**都是`dispatchAction`,`useState`，可以看成一个简化版的`useReducer`,至于`dispatchAction`怎么更新`state`，更新组件的，我们接着往下研究`dispatchAction`。

在研究之前 我们**先要弄明白`dispatchAction`是什么?**

```jsx
function dispatchAction<S, A>(
  fiber: Fiber,
  queue: UpdateQueue<S, A>,
  action: A,
)
```

```jsx
const [number, setNumber] = useState(0);
```

**`dispatchAction` 就是 `setNumber`** , `dispatchAction` 第一个参数和第二个参数，已经被`bind`给改成`currentlyRenderingFiber`和 `queue`,我们传入的参数是第三个参数`action`

###### dispatchAction 无状态组件更新机制

作为更新的主要函数，我们一下来研究一下，我把 `dispatchAction` 精简，精简，再精简，

```js
function dispatchAction(fiber, queue, action) {

  // 计算 expirationTime 过程略过。
  /* 创建一个update */
  const update= {
    expirationTime,
    suspenseConfig,
    action,
    eagerReducer: null,
    eagerState: null,
    next: null,
  }
  /* 把创建的update */
  const pending = queue.pending;
  if (pending === null) {  // 证明第一次更新
    update.next = update;
  } else { // 不是第一次更新
    update.next = pending.next;
    pending.next = update;
  }

  queue.pending = update;
  const alternate = fiber.alternate;
  /* 判断当前是否在渲染阶段 */
  if ( fiber === currentlyRenderingFiber || (alternate !== null && alternate === currentlyRenderingFiber)) {
    didScheduleRenderPhaseUpdate = true;
    update.expirationTime = renderExpirationTime;
    currentlyRenderingFiber.expirationTime = renderExpirationTime;
  } else { /* 当前函数组件对应fiber没有处于调和渲染阶段 ，那么获取最新state , 执行更新 */
    if (fiber.expirationTime === NoWork && (alternate === null || alternate.expirationTime === NoWork)) {
      const lastRenderedReducer = queue.lastRenderedReducer;
      if (lastRenderedReducer !== null) {
        let prevDispatcher;
        try {
          const currentState = queue.lastRenderedState; /* 上一次的state */
          const eagerState = lastRenderedReducer(currentState, action); /**/
          update.eagerReducer = lastRenderedReducer;
          update.eagerState = eagerState;
          if (is(eagerState, currentState)) {
            return
          }
        }
      }
    }
    scheduleUpdateOnFiber(fiber, expirationTime);
  }
}
```

无论是类组件调用`setState`,还是函数组件的`dispatchAction` ，都会**产生一个 `update`对象**，里面记录了**此次更新的信息，**然后将此`update`放入**待更新的`pending`队列中**，`dispatchAction`第二步就是判断当前函数组件的`fiber`对象**是否处于渲染阶段**，如果**处于渲染阶段**，那么不需要我们在更新当前函数组件，只需要更新一下当前`update`的`expirationTime`即可。

如果当前`fiber`**没有处于更新阶段**。那么通过调用`lastRenderedReducer`获取最新的`state`,和上一次的`currentState`，进行**浅比较**，如果相等，那么就退出，这就证实了为什么`useState`，两次值相等的时候，组件不渲染的原因了，这个机制和`Component`模式下的`setState`有一定的区别。

如果两次`state`不相等，那么调用`scheduleUpdateOnFiber`调度渲染当前`fiber`，`scheduleUpdateOnFiber`是`react`渲染更新的主要函数。

我们把**初始化`mountState`**和**无状态组件更新机制**讲明白了，接下来看一下其他的**hooks**初始化做了些什么操作？

##### 3 初始化 useEffect -> mountEffect

上述讲到了无状态组件中`fiber`对象`memoizedState`保存当前的`hooks`形成的链表。那么`updateQueue`保存了什么信息呢，我们会在接下来探索`useEffect`过程中找到答案。 当我们调用`useEffect`的时候，在组件第一次渲染的时候会调用`mountEffect`方法，这个方法到底做了些什么？

###### mountEffect

```jsx
function mountEffect(create, deps) {
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  hook.memoizedState = pushEffect(
    HookHasEffect | hookEffectTag,
    create, // useEffect 第一次参数，就是副作用函数
    undefined,
    nextDeps // useEffect 第二次参数，deps
  );
}
```

每个`hooks`初始化都会创建一个`hook`对象，然后将 hook 的`memoizedState`保存当前`effect hook`信息。

**有两个`memoizedState`大家千万别混淆了，我这里再友情提示一遍**

- `workInProgress / current` 树上的 `memoizedState` 保存的是当前函数组件每个`hooks`形成的链表。

- 每个`hooks`上的`memoizedState` 保存了当前`hooks`信息，不同种类的`hooks`的`memoizedState`内容不同。上述的方法最后执行了一个`pushEffect`，我们一起看看`pushEffect`做了些什么？

###### pushEffect 创建 effect 对象，挂载 updateQueue

```jsx
function pushEffect(tag, create, destroy, deps) {
  const effect = {
    tag,
    create,
    destroy,
    deps,
    next: null,
  };
  let componentUpdateQueue = currentlyRenderingFiber.updateQueue;
  if (componentUpdateQueue === null) {
    // 如果是第一个 useEffect
    componentUpdateQueue = { lastEffect: null };
    currentlyRenderingFiber.updateQueue = componentUpdateQueue;
    componentUpdateQueue.lastEffect = effect.next = effect;
  } else {
    // 存在多个effect
    const lastEffect = componentUpdateQueue.lastEffect;
    if (lastEffect === null) {
      componentUpdateQueue.lastEffect = effect.next = effect;
    } else {
      const firstEffect = lastEffect.next;
      lastEffect.next = effect;
      effect.next = firstEffect;
      componentUpdateQueue.lastEffect = effect;
    }
  }
  return effect;
}
```

这一段实际很简单，首先创建一个 `effect` ，判断组件如果第一次渲染，那么创建 `componentUpdateQueue` ，就是`workInProgress`的`updateQueue`。然后将`effect`放入`updateQueue`中。

假设我们在一个函数组件中这么写：

```jsx
useEffect(() => {
  console.log(1);
}, [props.a]);
useEffect(() => {
  console.log(2);
}, []);
useEffect(() => {
  console.log(3);
}, []);
```

最后`workInProgress.updateQueue`会以这样的形式保存：

![7B8889E7-05B3-4BC4-870A-0D4C1CDF6981.jpg](https://s2.loli.net/2022/08/12/ENyeHgbQ5Z6knRJ.webp)

###### 拓展:effectList

`effect list` 可以理解为是一个存储 `effectTag` 副作用列表容器。它是由 `fiber` 节点和指针 `nextEffect` 构成的**单链表结构**，这其中还包括第一个节点 `firstEffect` ，和最后一个节点 `lastEffect`。 `React` 采用**深度优先搜索算法**，在 `render` 阶段遍历 `fiber` 树时，**把每一个有副作用的 `fiber` 筛选出来**，最后**构建生成一个只带副作用的 `effect list` 链表**。 在 `commit` 阶段，`React` 拿到 `effect list` 数据后，通过遍历 `effect list`，并根据每一个 `effect` 节点的 `effectTag` 类型，执行每个`effect`，从而对相应的 `DOM` 树执行更改。

##### 4 初始化 useMemo -> mountMemo

不知道大家是否把 `useMemo` 想象的过于复杂了，实际相比其他 `useState` , `useEffect`等，它的逻辑实际简单的很。

```js
function mountMemo(nextCreate, deps) {
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  const nextValue = nextCreate();
  hook.memoizedState = [nextValue, nextDeps];
  return nextValue;
}
```

初始化`useMemo`，就是创建一个`hook`，然后执行`useMemo`的第一个参数,得到需要缓存的值，然后将值和`deps`记录下来，赋值给当前`hook`的`memoizedState`。整体上并没有复杂的逻辑。

###### 5 初始化 useRef -> mountRef

对于`useRef`初始化处理，似乎更是简单，我们一起来看一下：

```jsx
function mountRef(initialValue) {
  const hook = mountWorkInProgressHook();
  const ref = { current: initialValue };
  hook.memoizedState = ref;
  return ref;
}
```

`mountRef`初始化很简单, 创建一个 ref 对象， 对象的`current` 属性来保存初始化的值，最后用`memoizedState`保存`ref`，完成整个操作。

###### 6 mounted 阶段 hooks 总结

我们来总结一下初始化阶段,`react-hooks`做的事情，在**一个函数组件第一次渲染执行上下文过程**中，每个`react-hooks`执行，都会产生一个`hook`对象，并形成**链表结构**，绑定在`workInProgress`的`memoizedState`属性上，然后`react-hooks`上的状态，绑定在当前`hooks`对象的`memoizedState`属性上。对于`effect`副作用钩子，会绑定在`workInProgress.updateQueue`上，等到`commit`阶段，`dom`树构建完成，再执行每个 `effect` 副作用钩子。

#### 三 hooks 更新阶段

上述介绍了第一次**渲染函数组件**，`react-hooks`初始化都做些什么，接下来，我们分析一下，

对于更新阶段，说明上一次 `workInProgress` 树已经赋值给了 `current` 树。存放`hooks`信息的`memoizedState`，此时已经存在`current`树上，`react`对于`hooks`的处理逻辑和`fiber`树逻辑类似。

对于一次**函数组件更新**，当再次执行`hooks`函数的时候，比如 `useState(0)` ，首先要从`current`的`hooks`中找到与当前`workInProgressHook`，对应的`currentHooks`，然后**复制一份**`currentHooks`给`workInProgressHook`,接下来`hooks`函数执行的时候,把最新的状态更新到`workInProgressHook`，保证`hooks`状态不丢失。

所以**函数组件每次更新，每一次`react-hooks`函数执行，都需要有一个函数去做上面的操作，这个函数就是`updateWorkInProgressHook`**,我们接下来一起看这个`updateWorkInProgressHook`。

##### 1 updateWorkInProgressHook

```jsx
function updateWorkInProgressHook() {
  let nextCurrentHook;
  if (currentHook === null) {
    /* 如果 currentHook = null 证明它是第一个hooks */
    const current = currentlyRenderingFiber.alternate;
    if (current !== null) {
      nextCurrentHook = current.memoizedState;
    } else {
      nextCurrentHook = null;
    }
  } else {
    /* 不是第一个hooks，那么指向下一个 hooks */
    nextCurrentHook = currentHook.next;
  }
  let nextWorkInProgressHook;
  if (workInProgressHook === null) {
    //第一次执行hooks
    // 这里应该注意一下，当函数组件更新也是调用 renderWithHooks ,memoizedState属性是置空的
    nextWorkInProgressHook = currentlyRenderingFiber.memoizedState;
  } else {
    nextWorkInProgressHook = workInProgressHook.next;
  }

  if (nextWorkInProgressHook !== null) {
    /* 这个情况说明 renderWithHooks 执行 过程发生多次函数组件的执行 ，我们暂时先不考虑 */
    workInProgressHook = nextWorkInProgressHook;
    nextWorkInProgressHook = workInProgressHook.next;
    currentHook = nextCurrentHook;
  } else {
    invariant(
      nextCurrentHook !== null,
      "Rendered more hooks than during the previous render."
    );
    currentHook = nextCurrentHook;
    const newHook = {
      //创建一个新的hook
      memoizedState: currentHook.memoizedState,
      baseState: currentHook.baseState,
      baseQueue: currentHook.baseQueue,
      queue: currentHook.queue,
      next: null,
    };
    if (workInProgressHook === null) {
      // 如果是第一个hooks
      currentlyRenderingFiber.memoizedState = workInProgressHook = newHook;
    } else {
      // 重新更新 hook
      workInProgressHook = workInProgressHook.next = newHook;
    }
  }
  return workInProgressHook;
}
```

这一段的逻辑大致是这样的：

- 首先如果是**第一次执行**`hooks`函数，那么从`current`树上取出`memoizedState` ，也就是旧的`hooks`。
- 然后声明变量`nextWorkInProgressHook`，这里应该值得注意，正常情况下，一次`renderWithHooks`执行，`workInProgress`上的`memoizedState`会被置空，`hooks`函数顺序执行，`nextWorkInProgressHook`应该一直为`null`，那么什么情况下`nextWorkInProgressHook`不为`null`,也就是当一次`renderWithHooks`执行过程中，执行了多次函数组件，也就是在`renderWithHooks`中这段逻辑。

```jsx
if (workInProgress.expirationTime === renderExpirationTime) {
  // ....这里的逻辑我们先放一放
}
```

这里面的逻辑，实际就是判定，如果当前函数组件执行后，当前函数组件的**还是处于渲染优先级，说明函数组件又有了新的更新任务**，那么循坏执行函数组件。这就造成了上述的，`nextWorkInProgressHook`不为 `null` 的情况。

最后复制`current`的`hooks`，把它赋值给`workInProgressHook`,用于更新新的一轮`hooks`状态。

接下来我们看一下四个种类的`hooks`，在一次组件更新中，分别做了那些操作。

##### 2 updateState

useState

```jsx
function updateReducer(
  reducer,
  initialArg,
  init,
){
  const hook = updateWorkInProgressHook();
  const queue = hook.queue;
  queue.lastRenderedReducer = reducer;
  const current = currentHook;
  let baseQueue = current.baseQueue;
  const pendingQueue = queue.pending;
  if (pendingQueue !== null) {
     // 这里省略... 第一步：将 pending  queue 合并到 basequeue
  }
  if (baseQueue !== null) {
    const first = baseQueue.next;
    let newState = current.baseState;
    let newBaseState = null;
    let newBaseQueueFirst = null;
    let newBaseQueueLast = null;
    let update = first;
    do {
      const updateExpirationTime = update.expirationTime;
      if (updateExpirationTime < renderExpirationTime) { //优先级不足
        const clone  = {
          expirationTime: update.expirationTime,
          ...
        };
        if (newBaseQueueLast === null) {
          newBaseQueueFirst = newBaseQueueLast = clone;
          newBaseState = newState;
        } else {
          newBaseQueueLast = newBaseQueueLast.next = clone;
        }
      } else {  //此更新确实具有足够的优先级。
        if (newBaseQueueLast !== null) {
          const clone= {
            expirationTime: Sync,
             ...
          };
          newBaseQueueLast = newBaseQueueLast.next = clone;
        }
        /* 得到新的 state */
        newState = reducer(newState, action);
      }
      update = update.next;
    } while (update !== null && update !== first);
    if (newBaseQueueLast === null) {
      newBaseState = newState;
    } else {
      newBaseQueueLast.next = newBaseQueueFirst;
    }
    hook.memoizedState = newState;
    hook.baseState = newBaseState;
    hook.baseQueue = newBaseQueueLast;
    queue.lastRenderedState = newState;
  }
  const dispatch = queue.dispatch
  return [hook.memoizedState, dispatch];
}
```

首先将上一次更新的`pending queue` 合并到 `basequeue`，为什么要这么做，比如我们再一次点击事件中这么写，

```jsx
function Index() {
  const [number, setNumber] = useState(0);
  const handerClick = () => {
    //    setNumber(1)
    //    setNumber(2)
    //    setNumber(3)
    setNumber((state) => state + 1);
    // 获取上次 state = 1
    setNumber((state) => state + 1);
    // 获取上次 state = 2
    setNumber((state) => state + 1);
  };
  console.log(number); // 3
  return (
    <div>
      <div>{number}</div>
      <button onClick={() => handerClick()}>点击</button>
    </div>
  );
}
```

**点击按钮， 打印 3**

三次`setNumber`产生的`update`会暂且放入`pending queue`，在下一次函数组件执行时候，三次 `update`被合并到 `baseQueue`。结构如下图：

![setState.jpg](https://s2.loli.net/2022/08/12/9xtm18ZSBqcX3ky.webp)

接下来会把当前`useState`或是`useReduer`对应的`hooks`上的`baseState`和`baseQueue`更新到最新的状态。会循环`baseQueue`的`update`，复制一份`update`,更新 `expirationTime`，对于**有足够优先级**的`update`（上述三个`setNumber`产生的`update`都具有足够的优先级），我们要获取最新的`state`状态。，会一次执行`useState`上的每一个`action`。得到最新的`state`。

**更新 state**

![sset1.jpg](https://s2.loli.net/2022/08/12/gE2LDf3raUGOlCm.webp)

这里有会有两个疑问 🤔️:

- 问题一：这里不是执行最后一个`action`不就可以了嘛? 答案： 原因很简单，上面说了 `useState`逻辑和`useReducer`差不多。如果第一个参数是一个函数，会引用上一次 `update`产生的 `state`, 所以需要**循环调用，每一个`update`的`reducer`**，如果`setNumber(2)`是这种情况，那么只用更新值，如果是`setNumber(state=>state+1)`,那么传入上一次的 `state` 得到最新`state`。

- 问题二：什么情况下会有优先级不足的情况(`updateExpirationTime < renderExpirationTime`)？

答案： 这种情况，一般会发生在，当我们调用`setNumber`时候，调用`scheduleUpdateOnFiber`渲染当前组件时，又产生了一次新的更新，所以把最终执行`reducer`更新`state`任务交给下一次更新。

##### 3 updateEffect

```jsx
function updateEffect(create, deps): void {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  let destroy = undefined;
  if (currentHook !== null) {
    const prevEffect = currentHook.memoizedState;
    destroy = prevEffect.destroy;
    if (nextDeps !== null) {
      const prevDeps = prevEffect.deps;
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        pushEffect(hookEffectTag, create, destroy, nextDeps);
        return;
      }
    }
  }
  currentlyRenderingFiber.effectTag |= fiberEffectTag;
  hook.memoizedState = pushEffect(
    HookHasEffect | hookEffectTag,
    create,
    destroy,
    nextDeps
  );
}
```

`useEffect` 做的事很简单，**判断两次`deps` 相等**，如果**相等说明此次更新不需要执行，则直接调用 `pushEffect`**,这里注意 `effect`的标签，`hookEffectTag`,如果不相等，那么更新 `effect` ,并且赋值给`hook.memoizedState`，这里标签是 `HookHasEffect | hookEffectTag`,然后在`commit`阶段，`react`会通过标签来判断，是否执行当前的 `effect` 函数。

##### 4 updateMemo

```jsx
function updateMemo(nextCreate, deps) {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps; // 新的 deps 值
  const prevState = hook.memoizedState;
  if (prevState !== null) {
    if (nextDeps !== null) {
      const prevDeps = prevState[1]; // 之前保存的 deps 值
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        //判断两次 deps 值
        return prevState[0];
      }
    }
  }
  const nextValue = nextCreate();
  hook.memoizedState = [nextValue, nextDeps];
  return nextValue;
}
```

在组件更新过程中，我们执行`useMemo`函数，做的事情实际很简单，就是判断两次 `deps`是否相等，如果不想等，证明依赖项发生改变，那么执行 `useMemo`的第一个函数，得到新的值，然后重新赋值给`hook.memoizedState`,如果相等 证明没有依赖项改变，那么直接获取缓存的值。

不过这里有一点，值得注意，`nextCreate()`执行，如果里面引用了`usestate`等信息，变量会被引用，无法被垃圾回收机制回收，就是闭包原理，那么访问的属性有可能不是最新的值，所以需要把引用的值，添加到依赖项 `dep` 数组中。每一次`dep`改变，重新执行，就不会出现问题了。

**温馨小提示： 有很多同学说 `useMemo`怎么用，到底什么场景用，用了会不会起到反作用，通过对源码原理解析，我可以明确的说，基本上可以放心使用，说白了就是可以定制化缓存，存值取值而已。**

##### 5 updateRef

```jsx
function updateRef(initialValue) {
  const hook = updateWorkInProgressHook();
  return hook.memoizedState;
}
```

函数组件更新 useRef 做的事情更简单，就是返回了缓存下来的值，也就是无论函数组件怎么执行，执行多少次，`hook.memoizedState`内存中都指向了一个对象，所以解释了`useEffect`,`useMemo` 中，为什么`useRef`不需要依赖注入，就能访问到最新的改变值。

##### 一次点击事件更新

<img src="https://s2.loli.net/2022/08/12/iZRp1JIADzOsQ5h.webp" alt="91A72028-3A38-4491-9375-0895F420B7CD.jpg"  />
