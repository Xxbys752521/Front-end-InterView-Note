---
sidebar_position: 11
description: Demo实现
---

## Demo 实现

### 1.react 实现一个全局的 dialog

```jsx
import React, { Component } from "react";
import { is, fromJS } from "immutable";
import ReactDOM from "react-dom";
import ReactCSSTransitionGroup from "react-addons-css-transition-group";
import "./dialog.css";
let defaultState = {
  alertStatus: false,
  alertTip: "提示",
  closeDialog: function () {},
  childs: "",
};
class Dialog extends Component {
  state = {
    ...defaultState,
  }; // css动画组件设置为目标组件
  FirstChild = (props) => {
    const childrenArray = React.Children.toArray(props.children);
    return childrenArray[0] || null;
  }; //打开弹窗
  open = (options) => {
    options = options || {};
    options.alertStatus = true;
    var props = options.props || {};
    var childs = this.renderChildren(props, options.childrens) || "";
    console.log(childs);
    this.setState({
      ...defaultState,
      ...options,
      childs,
    });
  }; //关闭弹窗
  close() {
    this.state.closeDialog();
    this.setState({
      ...defaultState,
    });
  }
  renderChildren(props, childrens) {
    //遍历所有子组件
    var childs = [];
    childrens = childrens || [];
    var ps = {
      ...props, //给子组件绑定props
      _close: this.close, //给子组件也绑定一个关闭弹窗的事件
    };
    childrens.forEach((currentItem, index) => {
      childs.push(
        React.createElement(currentItem, {
          ...ps,
          key: index,
        })
      );
    });
    return childs;
  }
  shouldComponentUpdate(nextProps, nextState) {
    return (
      !is(fromJS(this.props), fromJS(nextProps)) ||
      !is(fromJS(this.state), fromJS(nextState))
    );
  }
  render() {
    return (
      <ReactCSSTransitionGroup
        component={this.FirstChild}
        transitionName="hide"
        transitionEnterTimeout={300}
        transitionLeaveTimeout={300}
      >
                
        <div
          className="dialog-con"
          style={
            this.state.alertStatus ? { display: "block" } : { display: "none" }
          }
        >
                      {this.state.childs}
                  
        </div>
              
      </ReactCSSTransitionGroup>
    );
  }
}
let div = document.createElement("div");
let props = {};
document.body.appendChild(div);
let Box = ReactD;
```

子类：

```jsx
//子类jsx
import React, { Component } from "react";
class Child extends Component {
  constructor(props) {
    super(props);
    this.state = { date: new Date() };
  }
  showValue = () => {
    this.props.showValue && this.props.showValue();
  };
  render() {
    return (
      <div className="Child">
                
        <div className="content">
                     Child            
          <button onClick={this.showValue}>调用父的方法</button>
                  
        </div>
              
      </div>
    );
  }
}
export default Child;
```

css：

```css
.dialog-con {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.3);
}
```

### 2.hooks 实现一个倒计时

```jsx
import { useEffect, useState } from "react";

// 自定义hook
function useCountDown(initN: number) {
  // 定义状态
  const [n, setN] = useState(initN);
  const changeCount = (n: number) => {
    const timer = setTimeout(() => {
      const current = --n; // n-- 值还是10未变 --n值为9改变
      console.log("current", current);
      setN(current);
    }, 1000);
    return timer;
  };

  // 监听状态变化
  useEffect(() => {
    const timer = changeCount(n);
    console.log("timer :>> ", timer);
    if (n === 0) {
      setN(0);
      clearTimeout(timer);
    }

    return () => {
      clearTimeout(timer);
    };
  }, [n]);

  // 返回状态
  return { n };
}
// 封装成组件
function Timer({ n }: { n: number }) {
  const { n: time } = useCountDown(n);

  return <span>{time === 0 ? "开始" : `剩余${time}秒`}</span>;
}

export default function Count() {
  return (
    <div className={styles.container}>
      <h2>倒计时</h2>
      <Timer n={10} />
    </div>
  );
}
```

```js
import React, { useState, useEffect, useRef } from "react";
import { ReactDOM } from "react-dom";
export default function App() {
  const [cansend, setCansend] = useState(true);
  const [timer, setTimer] = useState(0);
  const time = useRef(null);

  const send = () => {
    setTimer(60);
    setCansend(false);
    time.current = setTimeout(() => {
      setTimer((timer) => timer - 1);
    }, 1000);
  };
  useEffect(() => {
    console.log(timer);
    if (timer == 0) {
      setCansend(true);
      clearInterval(time.current);
    }
  }, [timer]);
  return (
    <div>
      <input> </input>
      <button disabled={!cansend} onClick={send}>
        {cansend ? "发送验证码" : timer + "秒后重发"}
      </button>
    </div>
  );
}
ReactDOM.render(<App />, document.getElementById("root"));
```

### 3.hooks 实现防抖节流

utils.js

```js
import { useEffect, useCallback, useRef } from "react";
// 防抖
export function useDebounce(fn, delay, dep = []) {
  const { current } = useRef({ fn, timer: null });
  useEffect(
    function () {
      current.fn = fn;
    },
    [fn]
  );
  return useCallback(function f(...args) {
    if (current.timer) {
      clearTimeout(current.timer);
    }
    current.timer = setTimeout(() => {
      current.fn.call(this, ...args);
    }, delay);
  }, dep);
}

// 节流
export function useThrottle(fn, delay, dep = []) {
  const { current } = useRef({ fn, timer: null });
  useEffect(
    function () {
      current.fn = fn;
    },
    [fn]
  );
  return useCallback(function f(...args) {
    if (!current.timer) {
      current.timer = setTimeout(() => {
        delete current.timer;
      }, delay);
      current.fn.call(this, ...args);
    }
  }, dep);
}
```

导入

```js
import { useThrottle, useDebounce } from "../utils";
const handlerSearch = useThrottle(() => {
  console.log("小太阳");
}, 1000);
const handlerSearch = useDebounce(() => {
  console.log("小太阳");
}, 1000);
```

```jsx
useThrottle

import { useCallback, useRef } from "react";

export default function useThrottle(fn, delay) {
  const timer = useRef(-1);
  const throttle = useCallback(() => {
    if (timer.current > -1) {
      return;
    }
    timer.current = setTimeout(() => {
      fn();
      timer.current = -1;
      clearTimeout(timer.current);
    }, delay);
  }, [fn, delay]);
  return throttle;
}
useDebounce

import { useEffect, useState } from "react";

export default function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}
```
