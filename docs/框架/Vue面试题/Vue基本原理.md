---
sidebar_position: 1
description: Vue基本原理
---

## 基本原理

### 1.什么是 MVVM,MVC？

**（1）MVC**

MVC 通过分离 Model、View 和 Controller 的方式来组织代码结构。其中 View 负责页面的显示逻辑，Model 负责存储页面的业务数据，以及对相应数据的操作。并且 View 和 Model 应用了观察者模式，当 Model 层发生改变的时候它会通知有关 View 层更新页面。Controller 层是 View 层和 Model 层的纽带，它主要负责用户与应用的响应操作，当用户与页面产生交互的时候，Controller 中的事件触发器就开始工作了，通过调用 Model 层，来完成对 Model 的修改，然后 Model 层再去通知 View 层更新。

![image.png](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs/202208202258494.webp)

（2）MVVM

MVVM 分为 Model、View、ViewModel：

- Model 代表数据模型，数据和业务逻辑都在 Model 层中定义；
- View 代表 UI 视图，负责数据的展示；
- ViewModel 负责监听 Model 中数据的改变并且控制视图的更新，处理用户交互操作；

Model 和 View 并无直接关联，而是通过 ViewModel 来进行联系的，Model 和 ViewModel 之间有着双向数据绑定的联系。因此当 Model 中的数据改变时会触发 View 层的刷新，View 中由于用户交互操作而改变的数据也会在 Model 中同步。

这种模式实现了 Model 和 View 的数据自动同步，因此开发者只需要专注于数据的维护操作即可，而不需要自己操作 DOM。 ![image.png](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs/202208202258529.webp)

### 2.vue 的响应式原理

![4.png](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs/202208202258995.webp)

当一个 Vue 实例创建时，Vue 会遍历 data 中的属性，用 Object.defineProperty（vue3.0 使用 proxy ）将它们转为 getter/setter，并且在内部追踪相关依赖，在属性被访问和修改时通知变化。 每个组件实例都有相应的 watcher 程序实例，它会在组件渲染的过程中把属性记录为依赖，之后当依赖项的 setter 被调用时，会通知 watcher 重新计算，从而致使它关联的组件得以更新。

Vue.js 是采用**数据劫持**结合**发布者-订阅者模式**的方式，通过 Object.defineProperty()来劫持各个属性的 setter，getter，在数据变动时发布消息给订阅者，触发相应的监听回调。主要分为以下几个步骤：

1. 需要 observe 的数据对象进行递归遍历，包括子属性对象的属性，都加上 setter 和 getter 这样的话，给这个对象的某个值赋值，就会触发 setter，那么就能监听到了数据变化
2. compile 解析模板指令，将模板中的变量替换成数据，然后初始化渲染页面视图，并将每个指令对应的节点绑定更新函数，添加监听数据的订阅者，一旦数据有变动，收到通知，更新视图
3. Watcher 订阅者是 Observer 和 Compile 之间通信的桥梁，主要做的事情是: ① 在自身实例化时往属性订阅器(dep)里面添加自己 ② 自身必须有一个 update()方法 ③ 待属性变动 dep.notice()通知时，能调用自身的 update()方法，并触发 Compile 中绑定的回调，则功成身退。
4. MVVM 作为数据绑定的入口，整合 Observer、Compile 和 Watcher 三者，通过 Observer 来监听自己的 model 数据变化，通过 Compile 来解析编译模板指令，最终利用 Watcher 搭起 Observer 和 Compile 之间的通信桥梁，达到数据变化 -> 视图更新；视图交互变化(input) -> 数据 model 变更的双向绑定效果。

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs/202208202259845.webp)

[双向绑定原理](https://juejin.cn/post/7065967379095748638#heading-9)

vue 接收一个模板和 data 参数。

1，首先将 data 中的数据进行递归遍历，对每个属性执行 Object.defineProperty，定义 get 和 set 函数。**并为每个属性添加一个 dep 数组**。当 get 执行时，会为调用的 dom 节点创建一个 watcher 存放在该数组中。当 set 执行时，重新赋值，并调用 dep 数组的 notify 方法，通知所有使用了该属性 watcher，并更新对应 dom 的内容。

2，将模板加载到内存中，递归模板中的元素，检测到元素有 v-开头的命令或者双大括号的指令，就会从 data 中取对应的值去修改模板内容，这个时候就将该 dom 元素添加到了该属性的 dep 数组中。这就实现了数据驱动视图。在处理 v-model 指令的时候，为该 dom 添加 input 事件（或 change），输入时就去修改对应的属性的值，实现了页面驱动数据。

3，将模板与数据进行绑定后，将模板添加到真实 dom 树中

#### 收集依赖具体过程

- Dep：`用于收集某个data属性依赖的dom节点集合，并提供更新方法`
- Watcher：`每个dom节点的包裹对象`

  - attr：该 dom 使用的 data 属性
  - cb：修改该 dom 内容的回调函数，在对象创建的时候会接收

- 为 data 的每个属性添加一个 dep 数组，用来收集依赖的 dom 节点。
- 因为 vue 实例初始化的时候会解析模板，会触发 data 数据的 getter，所以在此收集 dom

- 在 CompilerUtil 类解析 v-model，{{}}等命令时，会触发 getter。
- 我们在触发之前创建 Wather 对象，该对象在初始化的时候调用 getOldValue，首先为 Dep 添加一个静态属性 target，值为该 dom 节点。
- 再调用 CompilerUtil.getValue，获取该 data 的当前值，此时就以及触发了 getter。然后我们在 getter 函数里面获取该静态变量 Dep.target，并添加到对应的依赖数组 dep 中了，就完成了一次收集。
- 因为每次触发 getter 之前都对该静态变量赋值，所以不存在收集错依赖的情况。

- 1.我们如何知道哪里用了 data 里面的数据？
- 2.数据变更了，如何通知 render 更新视图？

在视图渲染过程中，被使用的数据需要被记录下来，并且只针对这些数据的变化触发视图更新

这就需要做依赖收集，需要为属性创建 dep 用来收集渲染 watcher

我们可以来看下官方介绍图，这里的`collect as Dependency`就是源码中的`dep.depend()`依赖收集，`Notify`就是源码中的`dep.notify()`通知订阅者

![响应式原理.png](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs/202208202259404.webp)

##### 依赖收集中的各个类

Vue 源码中负责依赖收集的类有三个：

- Observer：`可观测类`，将数组/对象转成可观测数据，每个`Observer`的实例成员中都有一个`Dep`的实例（上一篇文章实现过这个类）
- Dep：`观察目标类`，每一个数据都会有一个`Dep`类实例，它内部有个 subs 队列，subs 就是 subscribers 的意思，保存着依赖本数据的`观察者`，当本数据变更时，调用`dep.notify()`通知观察者
- Watcher：`观察者类`，进行`观察者函数`的包装处理。如`render()`函数，会被进行包装成一个`Watcher`实例

依赖就是`Watcher`,只有`Watcher`触发的`getter`才会收集依赖，哪个`Watcher`触发了`getter`，就把哪个`watcher`收集到`Dep`中。Dep 使用发布订阅模式，当数据发生变化时，会循环依赖列表，把所有的`watcher`都通知一遍，这里我自己画了一张更清晰的图：

![vue响应式原理.png](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs/202208202259194.webp)

##### Observer 类

这个类我们上一期已经实现过了，这一期我们主要增加的是`defineReactive`在劫持数据`gētter`时进行依赖收集，劫持数据`setter`时进行通知依赖更新，这里就是 Vue 收集依赖的入口

```js
class Observer {
  constructor(v) {
    // 每一个Observer实例身上都有一个Dep实例
    this.dep = new Dep();
    // 如果数据层次过多，需要递归去解析对象中的属性，依次增加set和get方法
    def(v, "__ob__", this); //给数据挂上__ob__属性，表明已观测
    if (Array.isArray(v)) {
      // 把重写的数组方法重新挂在数组原型上
      v.__proto__ = arrayMethods;
      // 如果数组里放的是对象，再进行监测
      this.observerArray(v);
    } else {
      // 非数组就直接调用defineReactive将数据定义成响应式对象
      this.walk(v);
    }
  }
  observerArray(value) {
    for (let i = 0; i < value.length; i++) {
      observe(value[i]);
    }
  }
  walk(data) {
    let keys = Object.keys(data); //获取对象key
    keys.forEach((key) => {
      defineReactive(data, key, data[key]); // 定义响应式对象
    });
  }
}

function defineReactive(data, key, value) {
  const dep = new Dep(); //实例化dep,用于收集依赖，通知订阅者更新
  observe(value); // 递归实现深度监测，注意性能
  Object.defineProperty(data, key, {
    configurable: true,
    enumerable: true,
    get() {
      //获取值
      // 如果现在处于依赖的手机阶段
      if (Dep.target) {
        dep.depend();
      }
      //  依赖收集
      return value;
    },
    set(newV) {
      //设置值
      if (newV === value) return;
      observe(newV); //继续劫持newV,用户有可能设置的新值还是一个对象
      value = newV;
      console.log("值变化了:", value);
      // 发布订阅模式，通知
      dep.notify();
      // cb() //订阅者收到消息回调
    },
  });
}
```

将`Observer`类的实例挂在`__ob__`属性上，提供后期数据观察时使用，实例化`Dep`类实例，并且将`对象/数组`作为 value 属性保存下来 - 如果 value 是个对象，就执行`walk()`过程，遍历对象把每一项数据都变为可观测数据（调用`defineReactive`方法处理） - 如果 value 是个数组，就执行`observeArray()`过程，递归地对数组元素调用`observe()`。

##### Dep 类（订阅者）

`Dep`类的角色是一个`订阅者`，它主要作用是用来存放`Watcher`观察者对象，每一个数据都有一个`Dep`类实例，在一个项目中会有多个观察者，但由于 JavaScript 是单线程的，所以在同一时刻，只能有一个`观察者`在执行，此刻正在执行的那个`观察者`所对应的`Watcher`实例就会赋值给`Dep.target`这个变量，从而只要访问`Dep.target`就能知道当前的观察者是谁。

```js
var uid = 0;
export default class Dep {
  constructor() {
    this.id = uid++;
    this.subs = []; // subscribes订阅者，存储订阅者，这里放的是Watcher的实例
  }

  //收集观察者
  addSub(watcher) {
    this.subs.push(watcher);
  }
  // 添加依赖
  depend() {
    // 自己指定的全局位置，全局唯一
    //自己指定的全局位置，全局唯一,实例化Watcher时会赋值Dep.target = Watcher实例
    if (Dep.target) {
      this.addSub(Dep.target);
    }
  }
  //通知观察者去更新
  notify() {
    console.log("通知观察者更新～");
    const subs = this.subs.slice(); // 复制一份
    subs.forEach((w) => w.update());
  }
}
```

`Dep`实际上就是对`Watcher`的管理，`Dep`脱离`Watcher`单独存在是没有意义的。

- `Dep`是一个发布者，可以订阅多个观察者，依赖收集之后`Dep`中会有一个`subs`存放一个或多个观察者，在数据变更的时候通知所有的`watcher`。
- `Dep`和`Observer`的关系就是`Observer`监听整个 data，遍历 data 的每个属性给每个属性绑定`defineReactive`方法劫持`getter`和`setter`, 在`getter`的时候往`Dep`类里塞依赖`（dep.depend）`，在`setter`的时候通知所有`watcher`进行`update(dep.notify)`。

##### Watcher 类（观察者）

`Watcher`类的角色是`观察者`，它关心的是数据，在数据变更之后获得通知，通过回调函数进行更新。

由上面的`Dep`可知，`Watcher`需要实现以下两个功能：

- `dep.depend()`的时候往 subs 里面添加自己
- `dep.notify()`的时候调用`watcher.update()`，进行更新视图

**同时要注意的是，watcher 有三种：render watcher、 computed watcher、user watcher(就是 vue 方法中的那个 watch)**

```js
var uid = 0;
import { parsePath } from "../util/index";
import Dep from "./dep";
export default class Watcher {
  constructor(vm, expr, cb, options) {
    this.vm = vm; // 组件实例
    this.expr = expr; // 需要观察的表达式
    this.cb = cb; // 当被观察的表达式发生变化时的回调函数
    this.id = uid++; // 观察者实例对象的唯一标识
    this.options = options; // 观察者选项
    this.getter = parsePath(expr);
    this.value = this.get();
  }

  get() {
    // 依赖收集,把全局的Dep.target设置为Watcher本身
    Dep.target = this;
    const obj = this.vm;
    let val;
    // 只要能找就一直找
    try {
      val = this.getter(obj);
    } finally {
      // 依赖收集完需要将Dep.target设为null，防止后面重复添加依赖。
      Dep.target = null;
    }
    return val;
  }
  // 当依赖发生变化时，触发更新
  update() {
    this.run();
  }
  run() {
    this.getAndInvoke(this.cb);
  }
  getAndInvoke(cb) {
    let val = this.get();

    if (val !== this.value || typeof val == "object") {
      const oldVal = this.value;
      this.value = val;
      cb.call(this.target, val, oldVal);
    }
  }
}
```

要注意的是，`watcher`中有个`sync`属性，绝大多数情况下，`watcher`并不是同步更新的，而是采用异步更新的方式，也就是调用`queueWatcher(this)`推送到观察者队列当中，待`nextTick`的时候进行调用。

这里的`parsePath`函数比较有意思，它是一个高阶函数，用于把表达式解析成 getter，也就是取值，我们可以试着写写看：

```js
export function parsePath (str) {
   const segments = str.split('.') // 先将表达式以.切割成一个数据
  // 它会返回一个函数
  	return obj = > {
      for(let i=0; i< segments.length; i++) {
        if(!obj) return
        // 遍历表达式取出最终值
        obj = obj[segments[i]]
      }
      return obj
    }
}
```

##### Dep 与 Watcher 的关系

watcher 中实例化了 dep 并向 dep.subs 中添加了订阅者, dep 通过 notify 遍历了 dep.subs 通知每个 watcher 更新。

##### 总结

###### 依赖收集

1. `initState `时,对` computed` 属性初始化时,触发 `computed watcher` 依赖收集
2. `initState` 时,对侦听属性初始化时,触发 `user watcher` 依赖收集(这里就是我们常写的那个 watch)
3. `render()`时,触发 `render watcher` 依赖收集
4. `re-render` 时,`render()`再次执行,会移除所有 `subs` 中的 `watcer` 的订阅,重新赋值。

```js
observe->walk->defineReactive->get->dep.depend()->
watcher.addDep(new Dep()) ->
watcher.newDeps.push(dep) ->
dep.addSub(new Watcher()) ->
dep.subs.push(watcher)
```

###### 派发更新

1. 组件中对响应的数据进行了修改,触发`defineReactive`中的 `setter` 的逻辑
2. 然后调用 `dep.notify()`
3. 最后遍历所有的 `subs（Watcher 实例）`,调用每一个 `watcher` 的 `update` 方法。

```js
set ->
dep.notify() ->
subs[i].update() ->
watcher.run() || queueWatcher(this) ->
watcher.get() || watcher.cb ->
watcher.getter() ->
vm._update() ->
vm.__patch__()
```

###### 实现视图驱动数据

监听输入框的 input、change 事件。修改 CompilerUtil 的 model 方法

```js
model: function (node, value, vm) {
    new Watcher(vm, value, (newValue, oldValue)=>{
        node.value = newValue;
    });
    let val = this.getValue(vm, value);
    node.value = val;
	// 看这里
    node.addEventListener('input', (e)=>{
        let newValue = e.target.value;
        this.setValue(vm, value, newValue);
    })
},
```

#### 如何将 watcher 放在 dep 数组中？

在解析模板的时候，会根据 v-指令获取对应 data 属性值，这个时候就会调用属性的 get 方法，我们先创建 Watcher 实例，并在其内部获取该属性值，作为旧值存放在 watcher 内部，我们在获取该值之前，在 Watcher 原型对象上添加属性 Watcher.target = this;然后取值，将讲 Watcher.target = null；这样 get 在被调用的时候就可以根据 Watcher.target 获取到 watcher 实例对象。

#### methods 的原理

创建 vue 实例的时候，接收 methods 参数

在解析模板的时候遇到 v-on 的指令。会对**该 dom 元素添加对应事件的监听**，并使用 call 方法将 vue 绑定为该方法的 this：`vm.$methods[value].call(vm, e);`

#### computed 的原理

创建 vue 实例的时候，接收 computed 参数

初始化 vue 实例的时候，为 computed 的 key 进行 Object.defineProperty 处理，并添加 get 属性。

#### 更新时候发生了什么

属性 set 方法被触发 执行 dep.notify()

通知所有使用了该属性 watcher，执行 watcher 的 update()方法 执行传过来的 callback

并更新对应 dom 的内容

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs/202208202259705.webp)

[代码实现](https://juejin.cn/post/6844903903822086151)

#### 设计模式

##### **1. 发布/订阅模式**

- 发布/订阅模式
  - 订阅者
  - 发布者
  - 信号中心

> 我们假定，存在一个"信号中心"，某个任务执行完成，就向信号中心"发布"(publish)一个信 号，其他任务可以向信号中心"订阅"(subscribe)这个信号，从而知道什么时候自己可以开始执 行。这就叫做"发布/订阅模式"(publish-subscribe pattern)

> Vue 的自定义事件

```js
let vm = new Vue();
vm.$on("dataChange", () => {
  console.log("dataChange");
});
vm.$on("dataChange", () => {
  console.log("dataChange1");
});
vm.$emit("dataChange");
```

兄弟组件通信过程

```js
// eventBus.js
// 事件中心
let eventHub = new Vue()

// ComponentA.vue
// 发布者
addTodo: function () {
  // 发布消息(事件)
  eventHub.$emit('add-todo', { text: this.newTodoText })
  this.newTodoText = ''
}
// ComponentB.vue
// 订阅者
created: function () {
  // 订阅消息(事件)
  eventHub.$on('add-todo', this.addTodo)
}
```

> 模拟 Vue 自定义事件的实现

```js
class EventEmitter {
  constructor() {
    // { eventType: [ handler1, handler2 ] }
    this.subs = {};
  }
  // 订阅通知
  $on(eventType, fn) {
    this.subs[eventType] = this.subs[eventType] || [];
    this.subs[eventType].push(fn);
  }
  // 发布通知
  $emit(eventType) {
    if (this.subs[eventType]) {
      this.subs[eventType].forEach((v) => v());
    }
  }
}

// 测试
var bus = new EventEmitter();

// 注册事件
bus.$on("click", function () {
  console.log("click");
});

bus.$on("click", function () {
  console.log("click1");
});

// 触发事件
bus.$emit("click");
```

##### **2. 观察者模式**

- 观察者(订阅者) --Watcher
  - `update()`:当事件发生时，具体要做的事情
- 目标(发布者) --Dep
  - `subs` 数组:存储所有的观察者
  - `addSub()`:添加观察者
  - `notify()`:当事件发生，调用所有观察者的 `update()` 方法
- 没有事件中心

```js
// 目标(发布者)
// Dependency
class Dep {
  constructor() {
    // 存储所有的观察者
    this.subs = [];
  }
  // 添加观察者
  addSub(sub) {
    if (sub && sub.update) {
      this.subs.push(sub);
    }
  }
  // 通知所有观察者
  notify() {
    this.subs.forEach((sub) => sub.update());
  }
}

// 观察者(订阅者)
class Watcher {
  update() {
    console.log("update");
  }
}

// 测试
let dep = new Dep();
let watcher = new Watcher();
dep.addSub(watcher);
dep.notify();
```

##### **3. 总结**

- **观察者模式**是由具体目标调度，比如当事件触发，`Dep` 就会去调用观察者的方法，所以观察者模 式的订阅者与发布者之间是存在依赖的
- **发布/订阅模式**由统一调度中心调用，因此发布者和订阅者不需要知道对方的存在

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs233118.png)

### 3.v-model 原理是什么? 语法糖实际是什么？

在自己封装组件的时在 Vue 中，我们可以使用`v-bind`实现单向的数据绑定，也就是通过**父组件向子组件传入数据** ，但是反过来，**子组件不可以修改父组件传递过来的数据** ，这也就是所谓的单向数据绑定。

而`v-model`就实现了双向数据绑定，实际上它就是**通过 Vue 提供的事件机制**。即在子组件通过`$emit()`触发一个事件，在父组件使用`v-on`来**监听对应的事件并修改相应的数据时候**，特别是输入框，下拉选择框等交互组件的时候，一般绑定值的时候，采用的是 `v-model`，使用 `v-model` 的主要好处是无需记特定的 `prop` 字段名，即可绑定到组件中的值，降低组件的使用成本。

毕竟，一个好的公共组件，首先是 `API` 的设计应该让人容易理解，并且使用方便。

其次，应该尽量将**重复的逻辑处理**放在子组件中，这样子才会让组件的封装更有意义。

即使不是交互组件，**任何组件都可以**通过这种方式来实现 `v-model`。

#### 交互组件

`v-model` 实际上就是 `$emit('input')` 以及 `props:value` 的组合语法糖，只要组件中满足这两个条件，就可以在组件中使用 `v-model`。

**虽然在有些交互组件中有些许不同**，例如：

`checkbox` 和 `radio` 使用 `props:checked` 属性和 `$emit('change')` 事件。

`select` 使用 `props:value` 属性和 `$emit('change')` 事件。

但是，除了上面列举的这些，别的都是 `$emit('input')` 以及 `props:value` 。

**（1）作用在表单元素上** 动态绑定了 input 的 value 指向了 messgae 变量，并且在触发 input 事件的时候去动态把 message 设置为目标值：一个是数据绑定，另一个是监听事件

```javascript
<input v-model="sth" />
//  等同于
<input
    v-bind:value="message"
    v-on:input="message=$event.target.value"
>
//$event 指代当前触发的事件对象;
//$event.target 指代当前触发的事件对象的dom;
//$event.target.value 就是当前dom的value值;
//在@input方法中，value => sth;
//在:value中,sth => value;
```

![image-20220923182943569](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/Imgs/image-20220923182943569.png)

**（2）作用在组件上** 在自定义组件中，v-model 默认会利用名为 value 的 prop 和名为 input 的事件

**本质是一个父子组件通信的语法糖，通过 prop 和$.emit 实现。** 因此父组件 v-model 语法糖本质上可以修改为：

```javascript
<child :value="message"  @input="function(e){message = e}"></child>
```

在组件的实现中，可以通过 v-model 属性来配置子组件接收的 prop 名称，以及派发的事件名称。 例子：

```javascript
// 父组件
<aa-input v-model="aa"></aa-input>
// 等价于
<aa-input v-bind:value="aa" v-on:input="aa=$event.target.value"></aa-input>

// 子组件：
<input v-bind:value="aa" v-on:input="onmessage"></aa-input>

props:{value:aa,}
methods:{
    onmessage(e){
        $emit('input',e.target.value)
    }
}
```

默认情况下，一个组件上的 v-model 会把 value 用作 prop 且把 input 用作 event。但是一些输入类型比如单选框和复选框按钮可能想使用 value prop 来达到不同的目的。使用 model 选项可以回避这些情况产生的冲突。js 监听 input 输入框输入数据改变，用 oninput，数据改变以后就会立刻出发这个事件。通过 input 事件把数据$emit 出去，在父组件接受。父组件设置v-model的值为input `$emit`过来的值。

#### 组件绑定

![image-20220923183158452](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/Imgs/image-20220923183158452.png)

在给组件使用`v-model`的时候，其实相当于将绑定的值`update:model-value`通过 props 传递给组件。并且在该组件上监听一个名为`update:model-value`，在组件中通过`this.$emit触发事件`，并且可以将要修改的值，传递过去

也可以写成

![image-20220923183416036](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/Imgs/image-20220923183416036.png)

![image-20220923183452248](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/Imgs/image-20220923183452248.png)

当我们在`home`组件中使用`v-model`进行双线数据绑定，此时可以使用`computed`计算属性来进行设置，当绑定的数据发生改变时，此时通过`this.$emit`触发事件。

#### **绑定多个属性**

![image-20220923183609821](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/Imgs/image-20220923183609821.png)

绑定两个属性，如果我们直接对组件使用`v-model`,则默认`v-bind`绑定`model-value`,`v-on`监听`update:model-value`。此时如果对其更改名称，`v-model:title='title',`这样`v-bind`绑定`title`,`v-on`监听`update:title`。

### 4.Object.defineProperty 和 Proxy 特点对比分析？

#### Object.defineProperty()

作用：在一个对象上定义一个新属性，或者修改一个对象的现有属性，并返回这个对象。

##### 1.基本使用

语法：`Object.defineProperty(obj, prop, descriptor)`

参数：

1.  要添加属性的对象
2.  要定义或修改的属性的名称或 [`Symbol`]
3.  要定义或修改的属性描述符

看一个简单的例子

```js
let person = {};
let personName = "lihua";

//在person对象上添加属性namep,值为personName
Object.defineProperty(person, "namep", {
  //但是默认是不可枚举的(for in打印打印不出来)，可：enumerable: true
  //默认不可以修改，可：wirtable：true
  //默认不可以删除，可：configurable：true
  get: function () {
    console.log("触发了get方法");
    return personName;
  },
  set: function (val) {
    console.log("触发了set方法");
    personName = val;
  },
});

//当读取person对象的namp属性时，触发get方法
console.log(person.namep);

//当修改personName时，重新访问person.namep发现修改成功
personName = "liming";
console.log(person.namep);

// 对person.namep进行修改，触发set方法
person.namep = "huahua";
console.log(person.namep);
```

通过这种方法，我们成功监听了 person 上的 name 属性的变化。

##### 2.监听对象上的多个属性

一个错误的版本

```js
Object.keys(person).forEach(function (key) {
  Object.defineProperty(person, key, {
    enumerable: true,
    configurable: true, // 默认会传入this
    get() {
      return person[key];
    },
    set(val) {
      console.log(`对person中的${key}属性进行了修改`);
      person[key] = val; // 修改之后可以执行渲染操作
    },
  });
});
console.log(person.age);
```

栈溢出问题：我们在访问 person 身上的属性时，就会触发 get 方法，返回 person[key]，但是访问 person[key]也会触发 get 方法，导致递归调用，最终栈溢出

我们需要设置一个中转 Obsever，来让 get 中 return 的值并不是直接访问 obj[key]

```js
let person = {
  name: "",
  age: 0,
};
// 实现一个响应式函数
function defineProperty(obj, key, val) {
  Object.defineProperty(obj, key, {
    get() {
      console.log(`访问了${key}属性`);
      return val;
    },
    set(newVal) {
      console.log(`${key}属性被修改为${newVal}了`);
      val = newVal;
    },
  });
}
// 实现一个遍历函数Observer
function Observer(obj) {
  Object.keys(obj).forEach((key) => {
    defineProperty(obj, key, obj[key]);
  });
}
Observer(person);
console.log(person.age);
person.age = 18;
console.log(person.age);
```

##### 3.深度监听一个对象

只要把对象传入其中，就可以实现对这个对象的属性监视，即使该对象的属性也是一个对象。
我们在 defineProperty()函数中，添加一个递归的情况：

```js
function defineProperty(obj, key, val) {
  //如果某对象的属性也是一个对象，递归进入该对象，进行监听
  if (typeof val === "object") {
    observer(val);
  }
  Object.defineProperty(obj, key, {
    get() {
      console.log(`访问了${key}属性`);
      return val;
    },
    set(newVal) {
      console.log(`${key}属性被修改为${newVal}了`);
      val = newVal;
    },
  });
}
```

##### 4.监听数组

对象的属性是一个数组 如何实现监听

```js
let arr = [1, 2, 3];
let obj = {};
//把arr作为obj的属性监听
Object.defineProperty(obj, "arr", {
  get() {
    console.log("get arr");
    return arr;
  },
  set(newVal) {
    console.log("set", newVal);
    arr = newVal;
  },
});
console.log(obj.arr); //输出get arr [1,2,3]  正常
obj.arr = [1, 2, 3, 4]; //输出set [1,2,3,4] 正常
obj.arr.push(3); //输出get arr 不正常，监听不到push
```

通过`push`方法给数组增加的元素，set 方法是监听不到的

通过索引访问或者修改数组中已经存在的元素，是可以出发 get 和 set 的，但是对于通过 push、unshift 增加的元素，会增加一个索引，这种情况需要手动初始化，新增加的元素才能被监听到。另外， 通过 pop 或 shift 删除元素，会删除并更新索引，也会触发 setter 和 getter 方法

通过重写 Array 原型上的方法解决了这个问题

#### Proxy

当我们要给对象新增加一个属性时，也需要手动去监听这个新增属性

使用 vue 给 data 中的数组或对象新增属性时，需要使用 vm.$set 才能保证新增的属性也是响应式的

##### 1.基本使用

语法：`const p = new Proxy(target, handler)` 参数:

1.  target:要使用 `Proxy` 包装的目标对象（可以是任何类型的对象，包括原生数组，函数，甚至另一个代理）
2.  handler:一个通常以函数作为属性的对象，各属性中的函数分别定义了在执行各种操作时代理 `p` 的行为。

通过 Proxy，我们可以对`设置代理的对象`上的一些操作进行拦截，外界对这个对象的各种操作，都要先通过这层拦截。（和 defineProperty 差不多）

例子

```js
//定义一个需要代理的对象
let person = {
  age: 0,
  school: "upc",
};
//定义handler对象
let hander = {
  get(obj, key) {
    // 如果对象里有这个属性，就返回属性值，如果没有，就返回默认值66
    return key in obj ? obj[key] : 66;
  },
  set(obj, key, val) {
    obj[key] = val;
    return true;
  },
};
//把handler对象传入Proxy
let proxyObj = new Proxy(person, hander);

// 测试get能否拦截成功
console.log(proxyObj.age); //输出0
console.log(proxyObj.school); //输出西电
console.log(proxyObj.name); //输出默认值66

// 测试set能否拦截成功
proxyObj.age = 18;
console.log(proxyObj.age); //输出18 修改成功
```

Proxy 代理的是整个对象，而不是对象的某个特定属性，不需要我们通过遍历来逐个进行数据绑定。

> 值得注意的是:之前我们在使用 Object.defineProperty()给对象添加一个属性之后，我们对对象属性的读写操作仍然在对象本身。
> 但是一旦使用 Proxy，如果想要读写操作生效，我们就要对 Proxy 的实例对象`proxyObj`进行操作

##### 2.解决 Object.defineProperty 中遇到的问题

使用 Object.defineProperty 的时候，我们遇到的问题有：

1.一次只能对一个属性进行监听，需要遍历来对所有属性监听。这个我们在上面已经解决了。

2.在遇到一个对象的属性还是一个对象的情况下，需要递归监听。 3.对于对象的新增属性，需要手动监听 4.对于数组通过 push、unshift 方法增加的元素，也无法监听

### 5.v-if 和 v-show 特点对比分析

- **手段**：v-if 是动态的向 DOM 树内添加或者删除 DOM 元素；v-show 是通过设置 DOM 元素的 display 样式属性控制显隐；
- **编译过程**：v-if 切换有一个局部编译/卸载的过程，切换过程中合适地销毁和重建内部的事件监听和子组件；v-show 只是简单的基于 css 切换；
- **编译条件**：v-if 是惰性的，如果初始条件为假，则什么也不做；只有在条件第一次变为真时才开始局部编译; v-show 是在任何条件下，无论首次条件是否为真，都被编译，然后被缓存，而且 DOM 元素保留；
- **性能消耗**：v-if 有更高的切换消耗；v-show 有更高的初始渲染消耗；
- **使用场景**：v-if 适合运营条件不大可能改变；v-show 适合频繁切换。

### 6.computed 和 method、computed 和 watch 对比分析

#### Computed 和 Methods 的区别

可以将同一函数定义为一个 method 或者一个计算属性。对于最终的结果，两种方式是相同的

**不同点：**

- computed: 计算属性是基于它们的依赖进行缓存的，只有在它的相关依赖发生改变时才会重新求值；
- method 调用总会执行该函数。

#### Computed 和 Watch 的区别

[源码学习](https://juejin.cn/post/6974293549135167495)

watch 用法

```js
<body>
    <div id="app">
        姓： <input type="text" v-model=firstName> 名：
        <input type="text" v-model=lastName> 姓名：
        <span>{{fullname}}</span>
    </div>
</body>
<script type="text/javascript">
    var app = new Vue({
        el: "#app",
        data: {
            firstName: 'z',
            lastName: 's',
            fullname: 'zs'
        },
        watch: {
            firstName(newval) {
​
                this.fullname = newval + this.lastName
            },
            lastName(newval) {
                this.fullname = this.firstName + newval
            }
​
        }
    })
​
</script>
```

computed 用法

```js
<body>
    <div id="app">
        姓： <input type="text" v-model=firstName> 名：
        <input type="text" v-model=lastName> 姓名：
        <span>{{fullname}}</span>
    </div>
</body>
<script type="text/javascript">
    var app = new Vue({
        el: "#app",
        data: {
            firstName: 'z',
            lastName: 's'
        },
        computed: {
            fullname() {
                return this.firstName + this.lastName
            }
        }
    })
​
</script>
```

**对于 Computed：**

- 它支持缓存，只有依赖的数据发生了变化，才会重新计算
- 不支持异步，当 Computed 中有异步操作时，无法监听数据的变化
- computed 的值会默认走缓存，计算属性是基于它们的响应式依赖进行缓存的，也就是基于 data 声明过，或者父组件传递过来的 props 中的数据进行计算的。
- 如果一个属性是由其他属性计算而来的，这个属性依赖其他的属性，一般会使用 computed
- 如果 computed 属性的属性值是函数，那么默认使用 get 方法，函数的返回值就是属性的属性值；在 computed 中，属性有一个 get 方法和一个 set 方法，当数据发生变化时，会调用 set 方法。

**对于 Watch：**

- 它不支持缓存，数据变化时，它就会触发相应的操作
- 支持异步监听
- 监听的函数接收两个参数，第一个参数是最新的值，第二个是变化之前的值
- 当一个属性发生变化时，就需要执行相应的操作
- 监听数据必须是 data 中声明的或者父组件传递过来的 props 中的数据，当发生变化时，会触发其他操作，函数有两个的参数：
  - immediate：组件加载立即触发回调函数
  - deep：深度监听，发现数据内部的变化，在复杂数据类型中使用，例如数组中的对象发生变化。需要注意的是，deep 无法监听到数组和对象内部的变化。

当想要执行异步或者昂贵的操作以响应不断的变化时，就需要使用 watch。

**总结：**

- computed 计算属性 : 依赖其它属性值，并且 computed 的值有缓存，只有它依赖的属性值发生改变，下一次获取 computed 的值时才会重新计算 computed 的值。
- watch 侦听器 : 更多的是**观察**的作用，**无缓存性**，类似于某些数据的监听回调，每当监听的数据变化时都会执行回调进行后续操作。

**运用场景：**

- 当需要进行数值计算,并且依赖于其它数据时，应该使用 computed，因为可以利用 computed 的缓存特性，避免每次获取值时都要重新计算。
- 当需要在数据变化时执行异步或开销较大的操作时，应该使用 watch，使用 watch 选项允许执行异步操作 ( 访问一个 API )，限制执行该操作的频率，并在得到最终结果前，设置中间状态。这些都是计算属性无法做到的。

#### 源码实现

##### Watcher 的种类

`name`变量被三处地方所依赖，分别是`html里，computed里，watch里`。只要`name`一改变，html 里就会重新渲染，computed 里就会重新计算，watch 里就会重新执行。那么是谁去通知这三个地方`name`修改了呢？那就是`Watcher`了

```js
<div>{{name}}</div>

data() {
        return {
            name: '林三心'
        }
    },
    computed: {
        info () {
            return this.name
        }
    },
    watch: {
        name(newVal) {
            console.log(newVal)
        }
    }
```

- `渲染Watcher`：变量修改时，负责通知 HTML 里的重新渲染
- `computed Watcher`：变量修改时，负责通知 computed 里依赖此变量的 computed 属性变量的修改
- `user Watcher`：变量修改时，负责通知 watch 属性里所对应的变量函数的执行

##### computed 的本质 —— computed watch

我们知道 new Vue()的时候会调用\_init 方法，该方法会初始化生命周期，初始化事件，初始化 render，初始化 data，computed，methods，wacther 等等。[Vue.js 源码角度：剖析模版和数据渲染成最终的 DOM 的过程](https://juejin.cn/post/6844903664998416392)。今天主要来看以下初始化 watch(initWatch)的实现，我加上了注释方便理解，定义在 src/core/instance/state.js 中：

```JS
// 用于传入Watcher实例的一个对象，即computed watcher
const computedWatcherOptions = { computed: true }

function initComputed (vm: Component, computed: Object) {
  // $flow-disable-line
  // 声明一个watchers且同时挂载到vm实例上
  const watchers = vm._computedWatchers = Object.create(null)
  // 在SSR模式下computed属性只能触发getter方法
  const isSSR = isServerRendering()

  // 遍历传入的computed方法
  for (const key in computed) {
    // 取出computed对象中的每个方法并赋值给userDef
    const userDef = computed[key]
    const getter = typeof userDef === 'function' ? userDef : userDef.get
    if (process.env.NODE_ENV !== 'production' && getter == null) {
      warn(
        `Getter is missing for computed property "${key}".`,
        vm
      )
    }

    // 如果不是SSR服务端渲染，则创建一个watcher实例
    if (!isSSR) {
      // create internal watcher for the computed property.
      watchers[key] = new Watcher(
        vm,
        getter || noop,
        noop,
        computedWatcherOptions
      )
    }

    // component-defined computed properties are already defined on the
    // component prototype. We only need to define computed properties defined
    // at instantiation here.
    if (!(key in vm)) {
      // 如果computed中的key没有设置到vm中，通过defineComputed函数挂载上去
      defineComputed(vm, key, userDef)
    } else if (process.env.NODE_ENV !== 'production') {
      // 如果data和props有和computed中的key重名的，会产生warning
      if (key in vm.$data) {
        warn(`The computed property "${key}" is already defined in data.`, vm)
      } else if (vm.$options.props && key in vm.$options.props) {
        warn(`The computed property "${key}" is already defined as a prop.`, vm)
      }
    }
  }
}
```

通过源码我们可以发现它先声明了一个名为 watchers 的空对象，同时在 vm 上也挂载了这个空对象。之后**遍历计算属性，并把每个属性的方法赋给 userDef**，如果 userDef 是 function 的话就赋给 getter，接着判断是否是服务端渲染，如果不是的话就创建一个 Watcher 实例。

这里**新建的 Watcher 实例中我们传入了第四个参数 computedWatcherOptions**。

const computedWatcherOptions = { computed: true }，这个对象是实现 computed watcher 的关键。这时，Watcher 中的逻辑就有变化了：

```JS
    // 源码定义在src/core/observer/watcher.js中
    // options
    if (options) {
      this.deep = !!options.deep
      this.user = !!options.user
      this.computed = !!options.computed
      this.sync = !!options.sync
      this.before = options.before
    } else {
      this.deep = this.user = this.computed = this.sync = false
    }
    // 其他的代码......
    this.dirty = this.computed // for computed watchers
```

这里传入的**options**就是上边定义的 computedWatcherOptions，当走 initData 方法的时候，options 并不存在，但当走到**initComputed**的时候，computedWatcherOptions 中的 computed 为 true，注意上边的一行代码**this.dirty = this.computed**，将 this.computed 赋值给 this.dirty。接着看下边的代码：

```JS
  evaluate () {
    if (this.dirty) {
      this.value = this.get()
      this.dirty = false
    }
    return this.value
  }
```

只有 this.dirty 为 true 的时候才能通过 this.get() 求值，然后把 this.dirty 设置为 false。在求值过程中，会执行 value = this.getter.call(vm, vm)，**这实际上就是执行了计算属性定义的 getter 函数**，否则直接返回 value。

当对**计算属性依赖的数据做修改**的时候，会触发 setter 过程，通知所有订阅它变化的 watcher 更新，**执行 watcher.update() 方法**：

```JS
  /**
   * Subscriber interface.
   * Will be called when a dependency changes.
   */
  update () {
    /* istanbul ignore else */
    if (this.computed) {
      // A computed property watcher has two modes: lazy and activated.
      // It initializes as lazy by default, and only becomes activated when
      // it is depended on by at least one subscriber, which is typically
      // another computed property or a component's render function.
      if (this.dep.subs.length === 0) {
        // In lazy mode, we don't want to perform computations until necessary,
        // so we simply mark the watcher as dirty. The actual computation is
        // performed just-in-time in this.evaluate() when the computed property
        // is accessed.
        this.dirty = true
      } else {
        // In activated mode, we want to proactively perform the computation
        // but only notify our subscribers when the value has indeed changed.
        this.getAndInvoke(() => {
          this.dep.notify()
        })
      }
    } else if (this.sync) {
      this.run()
    } else {
      queueWatcher(this)
    }
  }
```

那么对于计算属性这样的 computed watcher，它实际上是有 2 种模式，lazy 和 active。如果 this.dep.subs.length === 0 成立，则说明没有人去订阅这个 computed watcher 的变化，就把 this.dirty = true，只有当下次再访问这个计算属性的时候才会重新求值。否则会执行 getAndInvoke 方法：

```JS
  getAndInvoke (cb: Function) {
    const value = this.get()
    if (
      value !== this.value ||
      // Deep watchers and watchers on Object/Arrays should fire even
      // when the value is the same, because the value may
      // have mutated.
      isObject(value) ||
      this.deep
    ) {
      // set new value
      const oldValue = this.value
      this.value = value
      this.dirty = false
      if (this.user) {
        try {
          cb.call(this.vm, value, oldValue)
        } catch (e) {
          handleError(e, this.vm, `callback for watcher "${this.expression}"`)
        }
      } else {
        cb.call(this.vm, value, oldValue)
      }
    }
  }
```

getAndInvoke 函数会重新计算，然后对比新旧值，在三种情况下(1.新旧值不相等的情况 2.value 是对象或数组的时候 3.设置 deep 属性的时候)会执行回调函数，那么这里这个回调函数是 this.dep.notify()，在我们这个场景下就是触发了渲染 watcher 重新渲染。这就能解释官网中所说的**计算属性是基于它们的依赖进行缓存的**。

##### Computed 源码总结

基于 Watcher 类，有一个 lazy 属性，可以进行缓存作用，如果 lazy 是 true 证明是计算属性，直接返回数据，不用继续求值，这就是缓存值的原理

![image-20220621085011422](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsFSHsPfdICcehav7.png)

1.遍历计算属性，并把每个属性的方法赋给 userDef

2.新建的 Watcher 实例中我们传入了第四个参数 computedWatcherOptions

3.**initComputed**的时候，computedWatcherOptions 中的 computed 为 true

4.evaluate () 中 只有 this.dirty 为 true 的时候才能通过 this.get() 求值，然后把 this.dirty 设置为 false

5.求值过程中，会执行 value = this.getter.call(vm, vm)，**这实际上就是执行了计算属性定义的 getter 函数**，如果 dirty 为 false 直接返回 value

6.**计算属性依赖的数据做修改**的时候，会触发 setter 过程，通知所有订阅它变化的 watcher 更新，**执行 watcher.update() 方法**

7.computed watcher 是有 2 种模式，lazy 和 active。如果 this.dep.subs.length === 0 成立，则说明没有人去订阅这个 computed watcher 的变化，就把 this.dirty = true 只有当下次再访问这个计算属性的时候才会重新求值

8.getAndInvoke 函数会重新计算，然后对比新旧值，在三种情况下(1.新旧值不相等的情况 2.value 是对象或数组的时候 3.设置 deep 属性的时候)会执行回调函数

##### watch 底层是如何工作的？

上边提到了在 new Vue()的时候调用了\_init 方法完成了初始化。在这当中有调用了 initWatch 方法，定义在 src/core/instance/state.js 中：

```JS
function initWatch (vm: Component, watch: Object) {
  for (const key in watch) {
    const handler = watch[key]
    if (Array.isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i])
      }
    } else {
      createWatcher(vm, key, handler)
    }
  }
}
```

遍历 watch 对象，并将每个 watch[key]赋值给 handler，如果是数组则遍历 createWatcher 方法，否则直接调用 createWatcher 方法。接下来看一下 createWatcher 方法的定义：

```JS
function createWatcher (
  vm: Component,
  expOrFn: string | Function,
  handler: any,
  options?: Object
) {
  if (isPlainObject(handler)) {
    options = handler
    handler = handler.handler
  }
  if (typeof handler === 'string') {
    handler = vm[handler]
  }
  return vm.$watch(expOrFn, handler, options)
}
```

通过代码可以发现，createWatcher 方法 vm.?watch(keyOrFn, handler, options) 函数，调用了 Vue.prototype.$watch 方法，定义在 src/core/instance/state.js 中：

```JS
  Vue.prototype.$watch = function (
    expOrFn: string | Function,
    cb: any,
    options?: Object
  ): Function {
    const vm: Component = this
    if (isPlainObject(cb)) {
      return createWatcher(vm, expOrFn, cb, options)
    }
    options = options || {}
    options.user = true
    const watcher = new Watcher(vm, expOrFn, cb, options)
    if (options.immediate) {
      cb.call(vm, watcher.value)
    }
    return function unwatchFn () {
      watcher.teardown()
    }
  }
}
```

通过代码我们可以发现， watch 最终会调用 Vue.prototype.watch 方法，

这个方法首先判断 cb 如果是一个对象，则调用 createWatcher 方法，这是因为*w**a**t**c**h*方法，这个方法首先判断*cb*如果是一个对象，则调用**_createWatcher_**方法，

接着执行 const watcher = new Watcher(vm, expOrFn, cb, options) 实例化了一个 watcher，这里需要注意一点这是一个 user watcher，因为 options.user = true。

通过实例化 watcher 的方式，一旦我们 watch 的数据发送变化，它最终会执行 watcher 的 run 方法，执行回调函数 cb，并且如果我们设置了 immediate 为 true，则直接会执行回调函数 cb。即设置 immediate 属性为 true 的时候，第一次 watch 绑定的时候就可以执行。

最后返回了一个 unwatchFn 方法，它会调用 teardown 方法去移除这个 watcher。

所以 watcher 是如何工作的？本质上也是基于 Watcher 实现的，它是一个 user watcher。前面提到了计算属性 computed 本质上是一个 computed watcher

##### Watch 源码总结

双向数据绑定有一个 Watcher 类，只是普通的 watch 实例化，有没有 deep 参数只需要加上判断，即可。

还有可以监听函数，将当前函数赋值给 getter,监听的函数里面涉及到的状态都会被监听到，发生了变化就会触发 watch。

还要新增一个取消观察函数的函数

watch 中 deep:true 实现：当用户指定了 watch 中的 deep 属性为 true 时，如果当前监控的值是数组或者对象。 在 watch 类里面有 get 方法对 deep，和复杂对象处理方法，**会对对象中的每一项进行求值**，此时会将当前 watcher 存入到对应属性的依赖中(将当前依赖放到 Dep.target 上)，这样数组中对象发生变化时也会通知数据更新

\_traverse()方法里面

不是数组也不是对象返回，冰冻对象返回，Vnode 实例返回

对数组和对象进行递归判断

### 7.nextTick 有什么应用场景？原理是什么？

![12c574e8b85e729b0d9905959cc281ab.png](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/Imgs/12c574e8b85e729b0d9905959cc281ab.png)

**打印的结果是 begin, 而不是我们设置的 end。**这个结果足以说明 Vue 中 DOM 的更新并非同步

vue 异步执行 DOM 更新。只要观察到数据变化，Vue 将开启一个队列，并缓冲在同一事件循环中发生的所有数据改变。如果同一个 watcher 被多次触发，只会被推入到队列中一次。这种在缓冲时去除重复数据对于避免不必要的计算和 DOM 操作上非常重要。然后，在下一个的事件循环“tick”中，Vue 刷新队列并执行实际 (已去重的) 工作

Vue 的 nextTick 其本质是对 JavaScript 执行原理 EventLoop 的一种应用。

nextTick 的核心是利用了如 Promise 、MutationObserver、setImmediate、setTimeout 的原生 JavaScript 方法来模拟对应的微/宏任务的实现，本质是为了利用 JavaScript 的这些异步回调任务队列来实现 Vue 框架中自己的异步回调队列。

nextTick 不仅是 Vue 内部的异步队列的调用方法，同时也允许开发者在实际项目中使用这个方法来满足实际应用中对 DOM 更新数据时机的后续逻辑处理

nextTick 是典型的将底层 JavaScript 执行原理应用到具体案例中的示例，引入异步更新队列机制的原因 ∶

- 如果是同步更新，则多次对一个或多个属性赋值，会频繁触发 UI/DOM 的渲染，可以减少一些无用渲染
- 同时由于 VirtualDOM 的引入，每一次状态发生变化后，状态变化的信号会发送给组件，组件内部使用 VirtualDOM 进行计算得出需要更新的具体的 DOM 节点，然后对 DOM 进行更新操作，每次更新状态后的渲染过程需要更多的计算，而这种无用功也将浪费更多的性能，所以异步渲染变得更加至关重要

Vue 采用了数据驱动视图的思想，但是在一些情况下，仍然需要操作 DOM。有时候，可能遇到这样的情况，DOM1 的数据发生了变化，而 DOM2 需要从 DOM1 中获取数据，那这时就会发现 DOM2 的视图并没有更新，这时就需要用到了`nextTick`了。

由于 Vue 的 DOM 操作是异步的，所以，在上面的情况中，就要将 DOM2 获取数据的操作写在`$nextTick`中。

```javascript
this.$nextTick(() => {    // 获取数据的操作...})
```

所以，在以下情况下，会用到 nextTick：

- 在数据变化后执行的某个操作，而这个操作需要使用随数据变化而变化的 DOM 结构的时候，这个操作就需要方法在`nextTick()`的回调函数中。
- 在 vue 生命周期中，如果在 created()钩子进行 DOM 操作，也一定要放在`nextTick()`的回调函数中。

因为在 created()钩子函数中，页面的 DOM 还未渲染，这时候也没办法操作 DOM，所以，此时如果想要操作 DOM，必须将操作的代码放在`nextTick()`的回调函数中。

vue 采用的**异步更新策略**，当监听到数据发生变化的时候不会立即去更新 DOM，
而是开启一个任务队列，并缓存在同一事件循环中发生的所有数据变更;

nextTick 接收一个回调函数作为参数，并将这个回调函数延迟到 DOM 更新后才执行；
**使用场景**：想要操作 _基于最新数据的生成 DOM_ 时，就将这个操作放在 nextTick 的回调中

nextTick 提供了四种异步方法 Promise.then、MutationObserver、setImmediate、setTimeOut(fn,0)

源码解析

```js
import { noop } from "shared/util";
import { handleError } from "./error";
import { isIE, isIOS, isNative } from "./env";

//  上面三行与核心代码关系不大，了解即可
//  noop 表示一个无操作空函数，用作函数默认值，防止传入 undefined 导致报错
//  handleError 错误处理函数
//  isIE, isIOS, isNative 环境判断函数，
//  isNative 判断是否原生支持，如果通过第三方实现支持也会返回 false

export let isUsingMicroTask = false; // nextTick 最终是否以微任务执行

const callbacks = []; // 存放调用 nextTick 时传入的回调函数
let pending = false; // 标识当前是否有 nextTick 在执行，同一时间只能有一个执行

// 声明 nextTick 函数，接收一个回调函数和一个执行上下文作为参数
export function nextTick(cb?: Function, ctx?: Object) {
  let _resolve;
  // 将传入的回调函数存放到数组中，后面会遍历执行其中的回调
  callbacks.push(() => {
    if (cb) {
      // 对传入的回调进行 try catch 错误捕获
      try {
        cb.call(ctx);
      } catch (e) {
        handleError(e, ctx, "nextTick");
      }
    } else if (_resolve) {
      _resolve(ctx);
    }
  });

  // 如果当前没有在 pending 的回调，就执行 timeFunc 函数选择当前环境优先支持的异步方法
  if (!pending) {
    pending = true;
    timerFunc();
  }

  // 如果没有传入回调，并且当前环境支持 promise，就返回一个 promise
  if (!cb && typeof Promise !== "undefined") {
    return new Promise((resolve) => {
      _resolve = resolve;
    });
  }
}

// 判断当前环境优先支持的异步方法，优先选择微任务
// 优先级：Promise---> MutationObserver---> setImmediate---> setTimeout
// setTimeOut 最小延迟也要4ms，而 setImmediate 会在主线程执行完后立刻执行
// setImmediate 在 IE10 和 node 中支持

// 多次调用 nextTick 时 ,timerFunc 只会执行一次

let timerFunc;
// 判断当前环境是否支持 promise
if (typeof Promise !== "undefined" && isNative(Promise)) {
  // 支持 promise
  const p = Promise.resolve();
  timerFunc = () => {
    // 用 promise.then 把 flushCallbacks 函数包裹成一个异步微任务
    p.then(flushCallbacks);
    if (isIOS) setTimeout(noop);
  };
  // 标记当前 nextTick 使用的微任务
  isUsingMicroTask = true;

  // 如果不支持 promise，就判断是否支持 MutationObserver
  // 不是IE环境，并且原生支持 MutationObserver，那也是一个微任务
} else if (
  !isIE &&
  typeof MutationObserver !== "undefined" &&
  (isNative(MutationObserver) ||
    MutationObserver.toString() === "[object MutationObserverConstructor]")
) {
  let counter = 1;
  // new 一个 MutationObserver 类
  const observer = new MutationObserver(flushCallbacks);
  // 创建一个文本节点
  const textNode = document.createTextNode(String(counter));
  // 监听这个文本节点，当数据发生变化就执行 flushCallbacks
  observer.observe(textNode, { characterData: true });
  timerFunc = () => {
    counter = (counter + 1) % 2;
    textNode.data = String(counter); // 数据更新
  };
  isUsingMicroTask = true; // 标记当前 nextTick 使用的微任务

  // 判断当前环境是否原生支持 setImmediate
} else if (typeof setImmediate !== "undefined" && isNative(setImmediate)) {
  timerFunc = () => {
    setImmediate(flushCallbacks);
  };
} else {
  // 以上三种都不支持就选择 setTimeout
  timerFunc = () => {
    setTimeout(flushCallbacks, 0);
  };
}

// 如果多次调用 nextTick，会依次执行上面的方法，将 nextTick 的回调放在 callbacks 数组中
// 最后通过 flushCallbacks 函数遍历 callbacks 数组的拷贝并执行其中的回调
function flushCallbacks() {
  pending = false;
  const copies = callbacks.slice(0); // 拷贝一份
  callbacks.length = 0; // 清空 callbacks
  for (let i = 0; i < copies.length; i++) {
    // 遍历执行传入的回调
    copies[i]();
  }
}

// 为什么要拷贝一份 callbacks

// callbacks.slice(0) 将 callbacks 拷贝出来一份，
// 是因为考虑到 nextTick 回调中可能还会调用 nextTick 的情况,
// 如果 nextTick 回调中又调用了一次 nextTick，则又会向 callbacks 中添加回调，
// nextTick 回调中的 nextTick 应该放在下一轮执行，
// 如果不将 callbacks 复制一份就可能一直循环
```

### 8.data 为什么是一个函数而不是一个对象？

JavaScript 中的对象是引用类型的数据，当多个实例引用同一个对象时，只要一个实例对这个对象进行操作，其他实例中的数据也会发生变化。

而在 Vue 中，更多的是想要复用组件，那就需要每个组件都有自己的数据，这样组件之间才不会相互干扰。

所以组件的数据不能写成对象的形式，而是要写成函数的形式。数据以函数返回值的形式定义，这样当每次复用组件的时候，就会返回一个新的 data，也就是说每个组件都有自己的私有数据空间，它们各自维护自己的数据，不会干扰其他组件的正常运行。

### 9.vue 中的三种 Watcher

`Vue`可以说存在三种`watcher`，第一种是在定义`data`函数时定义数据的`render watcher`；第二种是`computed watcher`，是`computed`函数在自身内部维护的一个`watcher`，配合其内部的属性`dirty`开关来决定`computed`的值是需要重新计算还是直接复用之前的值；第三种就是`whtcher api`了，就是用户自定义的`export`导出对象的`watch`属性；当然实际上他们都是通过`class Watcher`类来实现的。

#### 描述

`Vue.js`的数据响应式，通常有以下的的场景：

- 数据变`->`使用数据的视图变。
- 数据变`->`使用数据的计算属性变`->`使用计算属性的视图变。
- 数据变`->`开发者主动注册的`watch`回调函数执行。

三个场景，对应三种`watcher`：

- 负责视图更新的`render watcher`。
- 执行计算属性更新的`computed watcher`。
- 用户注册的普通`watcher api`。

#### render watcher

##### 建立联系

如何才能建立视图渲染与属性值之间的联系？先来搞清楚两个问题

- 谁**用了**这个数据
- 数据**变了**之后怎么办

在视图渲染这个场景下，这两个问题的解答分别是：

- 负责生成视图的 render 函数要用这个数据
- 数据变了得执行 render 函数

##### 数据劫持

**用了**和**变了**，是可以通过对该属性值设置访问描述符（get/set）知道的。

因此，需要遍历所有 data 属性值，用 Object.defineProperty 设置访问描述符（get/set）。

- 谁用了这个数据？
  触发了属性值 get 的就是要用到的，应该在 getter 里记录下使用者。
- 数据变了怎么办？
  数据变就会触发属性值 set，应该在 setter 里告知使用者。

##### 订阅-发布

从上面的描述可以看出，这个场景是典型的发布&订阅。

在视图渲染的场景中，render-watcher 是订阅者。每个属性值都有一个依赖管理者——dep，负责记录和通知订阅者。

##### 依赖的收集与通知

###### 收集订阅（依赖）者的流程

1. 订阅者执行回调（render 函数）
2. 触发属性值 getter
3. 添加到订阅者队列
4. 重复 2、3 直至所有 getter 执行完

###### 通知订阅者的流程

1. 属性改变
2. 触发属性值 setter
3. dep 通知订阅者（render watcher）
4. 订阅者执行回调（render 函数）

##### 取消订阅

当某些属性值不再被视图使用的时候，就应该取消掉对这些属性的订阅。

怎么才能知道哪些属性值不再被引用呢？我们可以这么做：

订阅者（render-watcher）也维护一个依赖集合，将依赖的属性值的 dep 存储在这个集合里。

每当 render function 执行一次，也就是触发属性值的 getter 时，订阅者（render-watcher）会存储一份新的依赖集合。对比新旧依赖集合，找出已经不再依赖的旧 dep，将 render-watcher 从这个旧 dep 的订阅者队列中删除。这样就不会通知到当前的订阅者了（render-watcher）。

在`render watcher`中，响应式就意味着，当数据中的值改变时，在视图上的渲染内容也需要跟着改变，在这里就需要一个视图渲染与属性值之间的联系，`Vue`中的响应式，简单点来说分为以下三个部分：

- `Observer`: 这里的主要工作是递归地监听对象上的所有属性，在属性值改变的时候，触发相应的`Watcher`。
- `Watcher`: 观察者，当监听的数据值修改时，执行响应的回调函数，在`Vue`里面的更新模板内容。
- `Dep`: 链接`Observer`和`Watcher`的桥梁，每一个`Observer`对应一个`Dep`，它内部维护一个数组，保存与该`Observer`相关的`Watcher`。

根据上面的三部分实现一个功能非常简单的`Demo`，实际`Vue`中的数据在页面的更新是异步的，且存在大量优化，实际非常复杂。
首先实现`Dep`方法，这是链接`Observer`和`Watcher`的桥梁，简单来说，就是一个监听者模式的事件总线，负责接收`watcher`并保存。其中`subscribers`数组用以保存将要触发的事件，`addSub`方法用以添加事件，`notify`方法用以触发事件。

```javascript
function __dep(){
    this.subscribers = [];
    this.addSub = function(watcher){
        if(__dep.target && !this.subscribers.includes(__dep.target) ) this.subscribers.push(watcher);
    }
    this.notifyAll = function(){
        this.subscribers.forEach( watcher => watcher.update());
    }
}Copy to clipboardErrorCopied
```

`Observer`方法就是将数据进行劫持，使用`Object.defineProperty`对属性进行重定义，注意一个属性描述符只能是数据描述符和存取描述符这两者其中之一，不能同时是两者，所以在这个小`Demo`中使用`getter`与`setter`操作的的是定义的`value`局部变量，主要是利用了`let`的块级作用域定义`value`局部变量并利用闭包的原理实现了`getter`与`setter`操作`value`，对于每个数据绑定时都有一个自己的`dep`实例，利用这个总线来保存关于这个属性的`Watcher`，并在`set`更新数据的时候触发。

```javascript
function __observe(obj){
    for(let item in obj){
        let dep = new __dep();
        let value = obj[item];
        if (Object.prototype.toString.call(value) === "[object Object]") __observe(value);
        Object.defineProperty(obj, item, {
            configurable: true,
            enumerable: true,
            get: function reactiveGetter() {
                if(__dep.target) dep.addSub(__dep.target);
                return value;
            },
            set: function reactiveSetter(newVal) {
                if (value === newVal) return value;
                value = newVal;
                dep.notifyAll();
            }
        });
    }
    return obj;
}Copy to clipboardErrorCopied
```

`Watcher`方法传入一个回调函数，用以执行数据变更后的操作，一般是用来进行模板的渲染，`update`方法就是在数据变更后执行的方法，`activeRun`是首次进行绑定时执行的操作，关于这个操作中的`__dep.target`，他的主要目的是将执行回调函数相关的数据进行`sub`，例如在回调函数中用到了`msg`，那么在执行这个`activeRun`的时候`__dep.target`就会指向`this`，然后执行`fn()`的时候会取得`msg`，此时就会触发`msg`的`get()`，而`get`中会判断这个`__dep.target`是不是空，此时这个`__dep.target`不为空，上文提到了每个属性都会有一个自己的`dep`实例，此时这个`__dep.target`便加入自身实例的`subscribers`，在执行完之后，便将`__dep.target`设置为`null`，重复这个过程将所有的相关属性与`watcher`进行了绑定，在相关属性进行`set`时，就会触发各个`watcher`的`update`然后执行渲染等操作。

```javascript
function __watcher(fn){
    this.update = function(){
        fn();
    }

    this.activeRun = function(){
        __dep.target = this;
        fn();
        __dep.target = null;
    }
    this.activeRun();
}Copy to clipboardErrorCopied
```

这是上述的小`Demo`的代码示例，其中上文没有提到的`__proxy`函数主要是为了将`vm.$data`中的属性直接代理到`vm`对象上，两个`watcher`中第一个是为了打印并查看数据，第二个是之前做的一个非常简单的模板引擎的渲染，为了演示数据变更使得页面数据重新渲染，在这个`Demo`下打开控制台，输入`vm.msg = 11;`即可触发页面的数据更改，也可以通过在`40`行添加一行`console.log(dep);`来查看每个属性的`dep`绑定的`watcher`。

```html
<!DOCTYPE html>
<html>
  <head>
    <title>数据绑定</title>
  </head>
  <body>
    <div id="app">
      <div>{{msg}}</div>
      <div>{{date}}</div>
    </div>
  </body>
  <script type="text/javascript">
    var Mvvm = function (config) {
      this.$el = config.el;
      this.__root = document.querySelector(this.$el);
      this.__originHTML = this.__root.innerHTML;

      function __dep() {
        this.subscribers = [];
        this.addSub = function (watcher) {
          if (__dep.target && !this.subscribers.includes(__dep.target))
            this.subscribers.push(watcher);
        };
        this.notifyAll = function () {
          this.subscribers.forEach((watcher) => watcher.update());
        };
      }

      function __observe(obj) {
        for (let item in obj) {
          let dep = new __dep();
          let value = obj[item];
          if (Object.prototype.toString.call(value) === "[object Object]")
            __observe(value);
          Object.defineProperty(obj, item, {
            configurable: true,
            enumerable: true,
            get: function reactiveGetter() {
              if (__dep.target) dep.addSub(__dep.target);
              return value;
            },
            set: function reactiveSetter(newVal) {
              if (value === newVal) return value;
              value = newVal;
              dep.notifyAll();
            },
          });
        }
        return obj;
      }

      this.$data = __observe(config.data);

      function __proxy(target) {
        for (let item in target) {
          Object.defineProperty(this, item, {
            configurable: true,
            enumerable: true,
            get: function proxyGetter() {
              return this.$data[item];
            },
            set: function proxySetter(newVal) {
              this.$data[item] = newVal;
            },
          });
        }
      }

      __proxy.call(this, config.data);

      function __watcher(fn) {
        this.update = function () {
          fn();
        };

        this.activeRun = function () {
          __dep.target = this;
          fn();
          __dep.target = null;
        };
        this.activeRun();
      }

      new __watcher(() => {
        console.log(this.msg, this.date);
      });

      new __watcher(() => {
        var html = String(this.__originHTML || "")
          .replace(/"/g, '\\"')
          .replace(/\s+|\r|\t|\n/g, " ")
          .replace(/\{\{(.)*?\}\}/g, function (value) {
            return value.replace("{{", '"+(').replace("}}", ')+"');
          });
        html = `var targetHTML = "${html}";return targetHTML;`;
        var parsedHTML = new Function(...Object.keys(this.$data), html)(
          ...Object.values(this.$data)
        );
        this.__root.innerHTML = parsedHTML;
      });
    };

    var vm = new Mvvm({
      el: "#app",
      data: {
        msg: "1",
        date: new Date(),
        obj: {
          a: 1,
          b: 11,
        },
      },
    });
  </script>
</html>
Copy to clipboardErrorCopied
```

#### computed watcher

`computed`函数在自身内部维护的一个`watcher`，配合其内部的属性`dirty`开关来决定`computed`的值是需要重新计算还是直接复用之前的值。
在`Vue`中`computed`是计算属性，其会根据所依赖的数据动态显示新的计算结果，虽然使用`{{}}`模板内的表达式非常便利，但是设计它们的初衷是用于简单运算的，在模板中放入太多的逻辑会让模板过重且难以维护，所以对于任何复杂逻辑，都应当使用计算属性。计算属性是基于数据的响应式依赖进行缓存的，只在相关响应式依赖发生改变时它们才会重新求值，也就是说只要计算属性依赖的数据还没有发生改变，多次访问计算属性会立即返回之前的计算结果，而不必再次执行函数，当然如果不希望使用缓存可以使用方法属性并返回值即可，`computed`计算属性非常适用于一个数据受多个数据影响以及需要对数据进行预处理的条件下使用。
`computed`计算属性可以定义两种方式的参数，`{ [key: string]: Function | { get: Function, set: Function } }`，计算属性直接定义在`Vue`实例中，所有`getter`和`setter`的`this`上下文自动地绑定为`Vue`实例，此外如果为一个计算属性使用了箭头函数，则`this`不会指向这个组件的实例，不过仍然可以将其实例作为函数的第一个参数来访问，计算属性的结果会被缓存，除非依赖的响应式`property`变化才会重新计算，注意如果某个依赖例如非响应式`property`在该实例范畴之外，则计算属性是不会被更新的。

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Vue</title>
  </head>
  <body>
    <div id="app"></div>
  </body>
  <script src="https://cdn.bootcss.com/vue/2.4.2/vue.js"></script>
  <script type="text/javascript">
    var vm = new Vue({
      el: "#app",
      data: {
        a: 1,
        b: 2,
      },
      template: `
            <div>
                <div>{{multiplication}}</div>
                <div>{{multiplication}}</div>
                <div>{{multiplication}}</div>
                <div>{{multiplicationArrow}}</div>
                <button @click="updateSetting">updateSetting</button>
            </div>
        `,
      computed: {
        multiplication: function () {
          console.log("a * b"); // 初始只打印一次 返回值被缓存
          return this.a * this.b;
        },
        multiplicationArrow: (vm) => vm.a * vm.b * 3, // 箭头函数可以通过传入的参数获取当前实例
        setting: {
          get: function () {
            console.log("a * b * 6");
            return this.a * this.b * 6;
          },
          set: function (v) {
            console.log(`${v} -> a`);
            this.a = v;
          },
        },
      },
      methods: {
        updateSetting: function () {
          // 点击按钮后
          console.log(this.setting); // 12
          this.setting = 3; // 3 -> a
          console.log(this.setting); // 36
        },
      },
    });
  </script>
</html>
Copy to clipboardErrorCopied
```

#### watcher api

在`watch api`中可以定义`deep`与`immediate`属性，分别为深度监听`watch`和最初绑定即执行回调的定义，在`render watch`中定义数组的每一项由于性能与效果的折衷是不会直接被监听的，但是使用`deep`就可以对其进行监听，当然在`Vue3`中使用`Proxy`就不存在这个问题了，这原本是`Js`引擎的内部能力，拦截行为使用了一个能够响应特定操作的函数，即通过`Proxy`去对一个对象进行代理之后，我们将得到一个和被代理对象几乎完全一样的对象，并且可以从底层实现对这个对象进行完全的监控。
对于`watch api`，类型`{ [key: string]: string | Function | Object | Array }`，是一个对象，键是需要观察的表达式，值是对应回调函数，值也可以是方法名，或者包含选项的对象，`Vue`实例将会在实例化时调用`$watch()`，遍历`watch`对象的每一个`property`。 不应该使用箭头函数来定义`watcher`函数，例如`searchQuery: newValue => this.updateAutocomplete(newValue)`，理由是箭头函数绑定了父级作用域的上下文，所以`this`将不会按照期望指向`Vue`实例，`this.updateAutocomplete`将是`undefined`。

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Vue</title>
  </head>
  <body>
    <div id="app"></div>
  </body>
  <script src="https://cdn.bootcss.com/vue/2.4.2/vue.js"></script>
  <script type="text/javascript">
    var vm = new Vue({
      el: "#app",
      data: {
        a: 1,
        b: 2,
        c: 3,
        d: {
          e: 4,
        },
        f: {
          g: 5,
        },
      },
      template: `
            <div>
                <div>a: {{a}}</div>
                <div>b: {{b}}</div>
                <div>c: {{c}}</div>
                <div>d.e: {{d.e}}</div>
                <div>f.g: {{f.g}}</div>
                <button @click="updateA">updateA</button>
                <button @click="updateB">updateB</button>
                <button @click="updateC">updateC</button>
                <button @click="updateDE">updateDE</button>
                <button @click="updateFG">updateFG</button>
            </div>
        `,
      watch: {
        a: function (n, o) {
          // 普通watcher
          console.log("a", o, "->", n);
        },
        b: {
          // 可以指定immediate属性
          handler: function (n, o) {
            console.log("b", o, "->", n);
          },
          immediate: true,
        },
        c: [
          // 逐单元执行
          function handler(n, o) {
            console.log("c1", o, "->", n);
          },
          {
            handler: function (n, o) {
              console.log("c2", o, "->", n);
            },
            immediate: true,
          },
        ],
        d: {
          handler: function (n, o) {
            // 因为是内部属性值 更改不会执行
            console.log("d.e1", o, "->", n);
          },
        },
        "d.e": {
          // 可以指定内部属性的值
          handler: function (n, o) {
            console.log("d.e2", o, "->", n);
          },
        },
        f: {
          // 深度绑定内部属性
          handler: function (n) {
            console.log("f.g", n.g);
          },
          deep: true,
        },
      },
      methods: {
        updateA: function () {
          this.a = this.a * 2;
        },
        updateB: function () {
          this.b = this.b * 2;
        },
        updateC: function () {
          this.c = this.c * 2;
        },
        updateDE: function () {
          this.d.e = this.d.e * 2;
        },
        updateFG: function () {
          this.f.g = this.f.g * 2;
        },
      },
    });
  </script>
</html>
```

### 10.slot 的使用

我们知道在 Vue 中 Child 组件的标签 的中间是不可以包着什么的 。

![image-20220714223514708](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsld6RJOhpcTbBPvN.png)

可是往往在很多时候我们在使用组件的时候总想在组件间外面自定义一些标签，vue 新增了一种插槽机制，叫做作用域插槽。

插槽，其实就相当于占位符。**它在组件中给你的 HTML 模板占了一个位置，让你来传入一些东西**。插槽又分为 匿名插槽、具名插槽、作用域插槽。

在 2.6.0 中，我们为具名插槽和作用域插槽引入了一个新的统一的语法 (即 `v-slot` 指令)。它取代了 `slot` 和 `slot-scope`

子组件里面写`<slot>`标签

#### 匿名插槽

匿名插槽，我们也可以叫它单个插槽或者默认插槽。和具名插槽相对，它是不需要设置 name 属性的，它隐藏的 name 属性为 default。

father.vue

![image-20220621091100389](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs2aHchKi93d7uADY.png)

child.vue

![image-20220621091115897](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs6AZtGqxIcYzTF7S.png)

匿名插槽，name 的属性对应的是 default 也可以不写就是默认的意思啦；

在使用的时候还有一个问题要注意的 如果是有 2 个以上的匿名插槽是会 child 标签里面的内容全部都替换到每个 slot；

#### 具名插槽 （vue2.6.0+被废弃的 slot='name'）

顾名思义就是 slot 是带有 name 的 定义， 或者使用简单缩写的定义 #header 使用：要用一个 template 标签包裹

父组件 `v-slot:myName`

子组件 `<slot name="myName">`

father.vue

![image-20220621091140171](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsFuYa7PyUZ9EHipx.png)

child.vue

![image-20220621091151645](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsXKOCJqS7DVU1GhM.png)

多个具名插槽的使用 多个具名插槽，插槽的位置不是使用插槽的位置而定的，是在定义的时候的位置来替换的(子组件里面确定)

father.vue

![image-20220621091208254](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsCSzm39cRM2WVQ4q.png)

child.vue

![image-20220621091217351](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsHQG3KPIelOzysAR.png)

#### 作用域插槽

就是用来传递数据的插槽

当你想在一个插槽中使用数据时，要注意一个问题作用域的问题，Vue 官方文档中说了父级模板里的所有内容都是在父级作用域中编译的；子模板里的所有内容都是在子作用域中编译的;

为了让 子组件中的数据 在父级的插槽 内容中可用我们可以将 数据 作为 元素的一个特性绑定上去： v-bind:text="text"

注意：

匿名的作用域插槽和具名的作用域插槽 区别在 v-slot:defult="接受的名称"(defult(匿名的可以不写，具名的相反要写的是对应的 name))

v-solt 可以解构接收 解构接收的字段要和传的字段一样才可以

子组件`<slot :one="user2" >`对应父组件里面 `v-slot="{one}"` 父组件可以通过 one 来取值

子组件`<slot name="footer" v-bind:users='user1'>`对应父组件里面 `v-slot:footer="slotProps"` 父组件可以通过 slotProps.users 来取值 user1

![image-20220621091229483](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsqgjwZ1r2EcJOsmC.png)

效果图

![image-20220621091246267](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsUAzp31qG6lXSrhn.png)

#### 总结和理解

插槽父子组件

一般是子组件内使用`<slot></slot>`进行占位

父组件进行 slot 内容的替换 组件标签内数据 或者 template 设置

**内容插槽**

slot 相当于占位的 调用组件 在组件标签内的东西会替换 slot 实际上就是对内容替换

**具名插槽**

slot 设置 name `<slot name="header"></slot>`

然后通过 template`<template v-slot:header> </template>`的内容替换 slot 可以进行简写 `<template #header>`

**作用域插槽**

父组件访问自组件的数据

test 组件 `<slot v-bind:usertext="user">{{user.lastName}}</slot>`

```js
//test.vue
<div>
	<!-- 设置默认值：{{user.lastName}}获取 Jun -->
	<!-- 如果home.vue中给这个插槽值的话，则不显示 Jun -->
	<!-- 设置一个 usertext 然后把user绑到设置的 usertext 上 -->
	<slot v-bind:usertext="user">{{user.lastName}}</slot>
</div>

//定义内容
data(){
  return{
	user:{
	  firstName:"Fan",
	  lastName:"Jun"
	}
  }
}
```

home 组件内部

```js
<test v-slot:default="slotProps">  //可以把 :default 去掉，仅限于默认插槽
    {{slotProps.usertext.firstName}}
</test>
```

只要出现**多个插槽**，始终要为所有的插槽使用完整的基于`<template>`的语法：

```xml
<test>
  <template v-slot:default="slotProps">
    {{ slotProps.user.firstName }}
  </template>

  <template v-slot:other="otherSlotProps">
    ...
  </template>
</test>
```

解构插槽 Prop

因为 作用域插槽 的内部工作原理是将你的插槽内容包括在一个传入单个参数的函数里
这意味着 `v-slot` 的值实际上可以是任何能够作为函数定义中的参数的 JS 表达式

所以本来是这样写的：

```js
<div>
  <test v-slot="slotProps">
    {{slotProps.usertext.firstName}}
  </test>
</div>
```

还可以这样写：

```js
<div>
  <test v-slot={usertext}>
    {{usertext.firstName}}
  </test>
</div>
```

动态插槽名(2.6.0 新增)

**动态指令参数**(需要自己了解)也可以用在`v-slot`上，来定义动态的插槽名：

```xml
<base-layout>
  <template v-slot:[dynamicSlotName]>
    ...
  </template>
</base-layout>
```

**具名插槽**的缩写(2.6.0 新增)

跟 `v-on` 和 `v-bind` 一样，`v-slot` 也有缩写，即把参数之前的所有内容 `(v-slot:)` 替换为字符 `#`。例如 `v-slot:header` 可以被重写为 `#header`：

原来是这样写的：

```less
<div>
   <template v-slot:header>
    <h1>Here might be a page title</h1>
   </template>

  <p>A paragraph for the main content.</p>
  <p>And another one.</p>

  <template v-slot:footer>
    <p>Here some contact info</p>
  </template>
</div>
```

现在可以这样写：

```less
<div>
   <template #header>
    <h1>Here might be a page title</h1>
   </template>

  <p>A paragraph for the main content.</p>
  <p>And another one.</p>

  <template #footer>
    <p>Here some contact info</p>
  </template>
</div>
```

### 11.保存当前页面状态，keep-alive 原理

既然是要保持页面的状态（其实也就是组件的状态），那么会出现以下两种情况：

- 前组件会被卸载
- 前组件不会被卸载

那么可以按照这两种情况分别得到以下方法：

**组件会被卸载：**

**（1）将状态存储在 LocalStorage / SessionStorage**

只需要在组件即将被销毁的生命周期 `componentWillUnmount` （react）中在 LocalStorage / SessionStorage 中把当前组件的 state 通过 JSON.stringify() 储存下来就可以了。在这里面需要注意的是组件更新状态的时机。

比如从 B 组件跳转到 A 组件的时候，A 组件需要更新自身的状态。但是如果从别的组件跳转到 B 组件的时候，实际上是希望 B 组件重新渲染的，也就是不要从 Storage 中读取信息。所以需要在 Storage 中的状态加入一个 flag 属性，用来控制 A 组件是否读取 Storage 中的状态。

**优点：**

- 兼容性好，不需要额外库或工具。
- 简单快捷，基本可以满足大部分需求。

**缺点：**

- 状态通过 JSON 方法储存（相当于深拷贝），如果状态中有特殊情况（比如 Date 对象、Regexp 对象等）的时候会得到字符串而不是原来的值。（具体参考用 JSON 深拷贝的缺点）
- 如果 B 组件后退或者下一页跳转并不是前组件，那么 flag 判断会失效，导致从其他页面进入 A 组件页面时 A 组件会重新读取 Storage，会造成很奇怪的现象

**（2）路由传值**

通过 react-router 的 Link 组件的 prop —— to 可以实现路由间传递参数的效果。

在这里需要用到 state 参数，在 B 组件中通过 history.location.state 就可以拿到 state 值，保存它。返回 A 组件时再次携带 state 达到路由状态保持的效果。

**优点：**

- 简单快捷，不会污染 LocalStorage / SessionStorage。
- 可以传递 Date、RegExp 等特殊对象（不用担心 JSON.stringify / parse 的不足）

**缺点：**

- 如果 A 组件可以跳转至多个组件，那么在每一个跳转组件内都要写相同的逻辑。

**组件不会被卸载：**

**（1）单页面渲染**

要切换的组件作为子组件全屏渲染，父组件中正常储存页面状态。

**优点：**

- 代码量少
- 不需要考虑状态传递过程中的错误

**缺点：**

- 增加 A 组件维护成本
- 需要传入额外的 prop 到 B 组件
- 无法利用路由定位页面

除此之外，在 Vue 中，还可以是用 keep-alive 来缓存页面，当组件在 keep-alive 内被切换时组件的**activated、deactivated**这两个生命周期钩子函数会被执行 被包裹在 keep-alive 中的组件的状态将会被保留：

```javascript
<keep-alive>
	<router-view v-if="$route.meta.keepAlive"></router-view>
</kepp-alive>
```

**router.js**

```javascript
{
  path: '/',
  name: 'xxx',
  component: ()=>import('../src/views/xxx.vue'),
  meta:{
    keepAlive: true // 需要被缓存
  }
},
```

如果需要在组件切换的时候，保存一些组件的状态防止多次渲染，就可以使用 keep-alive 组件包裹需要保存的组件。

**（1）keep-alive**

keep-alive 有以下三个属性：

- include 字符串或正则表达式，只有名称匹配的组件会被匹配；
- exclude 字符串或正则表达式，任何名称匹配的组件都不会被缓存；
- max 数字，最多可以缓存多少组件实例。

注意：keep-alive 包裹动态组件时，会缓存不活动的组件实例。

**主要流程**

1. 判断组件 name ，不在 include 或者在 exclude 中，直接返回 vnode，说明该组件不被缓存。
2. 获取组件实例 key ，如果有获取实例的 key，否则重新生成。
3. key 生成规则，cid +"∶∶"+ tag ，仅靠 cid 是不够的，因为相同的构造函数可以注册为不同的本地组件。
4. 如果缓存对象内存在，则直接从缓存对象中获取组件实例给 vnode ，不存在则添加到缓存对象中。 5.最大缓存数量，当缓存组件数量超过 max 值时，清除 keys 数组内第一个组件。

**（2）keep-alive 的实现**

```javascript
const patternTypes: Array<Function> = [String, RegExp, Array]; // 接收：字符串，正则，数组

export default {
  name: "keep-alive",
  abstract: true, // 抽象组件，是一个抽象组件：它自身不会渲染一个 DOM 元素，也不会出现在父组件链中。

  props: {
    include: patternTypes, // 匹配的组件，缓存
    exclude: patternTypes, // 不去匹配的组件，不缓存
    max: [String, Number], // 缓存组件的最大实例数量, 由于缓存的是组件实例（vnode），数量过多的时候，会占用过多的内存，可以用max指定上限
  },

  created() {
    // 用于初始化缓存虚拟DOM数组和vnode的key
    this.cache = Object.create(null);
    this.keys = [];
  },

  destroyed() {
    // 销毁缓存cache的组件实例
    for (const key in this.cache) {
      pruneCacheEntry(this.cache, key, this.keys);
    }
  },

  mounted() {
    // prune 削减精简[v.]
    // 去监控include和exclude的改变，根据最新的include和exclude的内容，来实时削减缓存的组件的内容
    this.$watch("include", (val) => {
      pruneCache(this, (name) => matches(val, name));
    });
    this.$watch("exclude", (val) => {
      pruneCache(this, (name) => !matches(val, name));
    });
  },
};
```

**render 函数：**

1. 会在 keep-alive 组件内部去写自己的内容，所以可以去获取默认 slot 的内容，然后根据这个去获取组件
2. keep-alive 只对第一个组件有效，所以获取第一个子组件。
3. 和 keep-alive 搭配使用的一般有：动态组件 和 router-view

```javascript
render () {
  //
  function getFirstComponentChild (children: ?Array<VNode>): ?VNode {
    if (Array.isArray(children)) {
  for (let i = 0; i < children.length; i++) {
    const c = children[i]
    if (isDef(c) && (isDef(c.componentOptions) || isAsyncPlaceholder(c))) {
      return c
    }
  }
  }
  }
  const slot = this.$slots.default // 获取默认插槽
  const vnode: VNode = getFirstComponentChild(slot)// 获取第一个子组件
  const componentOptions: ?VNodeComponentOptions = vnode && vnode.componentOptions // 组件参数
  if (componentOptions) { // 是否有组件参数
    // check pattern
    const name: ?string = getComponentName(componentOptions) // 获取组件名
    const { include, exclude } = this
    if (
      // not included
      (include && (!name || !matches(include, name))) ||
      // excluded
      (exclude && name && matches(exclude, name))
    ) {
      // 如果不匹配当前组件的名字和include以及exclude
      // 那么直接返回组件的实例
      return vnode
    }

    const { cache, keys } = this

    // 获取这个组件的key
    const key: ?string = vnode.key == null
      // same constructor may get registered as different local components
      // so cid alone is not enough (#3269)
      ? componentOptions.Ctor.cid + (componentOptions.tag ? `::${componentOptions.tag}` : '')
      : vnode.key

    if (cache[key]) {
      // LRU缓存策略执行
      vnode.componentInstance = cache[key].componentInstance // 组件初次渲染的时候componentInstance为undefined

      // make current key freshest
      remove(keys, key)
      keys.push(key)
      // 根据LRU缓存策略执行，将key从原来的位置移除，然后将这个key值放到最后面
    } else {
      // 在缓存列表里面没有的话，则加入，同时判断当前加入之后，是否超过了max所设定的范围，如果是，则去除
      // 使用时间间隔最长的一个
      cache[key] = vnode
      keys.push(key)
      // prune oldest entry
      if (this.max && keys.length > parseInt(this.max)) {
        pruneCacheEntry(cache, keys[0], keys, this._vnode)
      }
    }
    // 将组件的keepAlive属性设置为true
    vnode.data.keepAlive = true // 作用：判断是否要执行组件的created、mounted生命周期函数
  }
  return vnode || (slot && slot[0])
}
```

keep-alive 具体是通过 cache 数组缓存所有组件的 vnode 实例。当 cache 内原有组件被使用时会将该组件 key 从 keys 数组中删除，然后 push 到 keys 数组最后，以便清除最不常用组件。

**实现步骤：**

1. 获取 keep-alive 下第一个子组件的实例对象，通过他去获取这个组件的组件名
2. 通过当前组件名去匹配原来 include 和 exclude，判断当前组件是否需要缓存，不需要缓存，直接返回当前组件的实例 vNode
3. 需要缓存，判断他当前是否在缓存数组里面：

- 存在，则将他原来位置上的 key 给移除，同时将这个组件的 key 放到数组最后面（LRU）
- 不存在，将组件 key 放入数组，然后判断当前 key 数组是否超过 max 所设置的范围，超过，那么削减未使用时间最长的一个组件的 key

1. 最后将这个组件的 keepAlive 设置为 true

**（3）keep-alive 本身的创建过程和 patch 过程**

缓存渲染的时候，会根据 vnode.componentInstance（首次渲染 vnode.componentInstance 为 undefined） 和 keepAlive 属性判断不会执行组件的 created、mounted 等钩子函数，而是对缓存的组件执行 patch 过程 ∶ 直接把缓存的 DOM 对象直接插入到目标元素中，完成了数据更新的情况下的渲染过程。

**首次渲染**

- 组件的首次渲染 ∶ 判断组件的 abstract 属性，才往父组件里面挂载 DOM

```javascript
// core/instance/lifecycle
function initLifecycle(vm: Component) {
  const options = vm.$options;

  // locate first non-abstract parent
  let parent = options.parent;
  if (parent && !options.abstract) {
    // 判断组件的abstract属性，才往父组件里面挂载DOM
    while (parent.$options.abstract && parent.$parent) {
      parent = parent.$parent;
    }
    parent.$children.push(vm);
  }

  vm.$parent = parent;
  vm.$root = parent ? parent.$root : vm;

  vm.$children = [];
  vm.$refs = {};

  vm._watcher = null;
  vm._inactive = null;
  vm._directInactive = false;
  vm._isMounted = false;
  vm._isDestroyed = false;
  vm._isBeingDestroyed = false;
}
```

- 判断当前 keepAlive 和 componentInstance 是否存在来判断是否要执行组件 prepatch 还是执行创建 componentlnstance

```javascript
// core/vdom/create-component
init (vnode: VNodeWithData, hydrating: boolean): ?boolean {
    if (
      vnode.componentInstance &&
      !vnode.componentInstance._isDestroyed &&
      vnode.data.keepAlive
    ) { // componentInstance在初次是undefined!!!
      // kept-alive components, treat as a patch
      const mountedNode: any = vnode // work around flow
      componentVNodeHooks.prepatch(mountedNode, mountedNode) // prepatch函数执行的是组件更新的过程
    } else {
      const child = vnode.componentInstance = createComponentInstanceForVnode(
        vnode,
        activeInstance
      )
      child.$mount(hydrating ? vnode.elm : undefined, hydrating)
    }
  },
```

prepatch 操作就不会在执行组件的 mounted 和 created 生命周期函数，而是直接将 DOM 插入

**（4）LRU （least recently used）缓存策略**

LRU 缓存策略 ∶ 从内存中找出最久未使用的数据并置换新的数据。 LRU（Least rencently used）算法根据数据的历史访问记录来进行淘汰数据，其核心思想是 **"如果数据最近被访问过，那么将来被访问的几率也更高"**。 最常见的实现是使用一个链表保存缓存数据，详细算法实现如下 ∶

- 新数据插入到链表头部
- 每当缓存命中（即缓存数据被访问），则将数据移到链表头部
- 链表满的时候，将链表尾部的数据丢弃。

### 12.vue 如何监听对象或数组的属性变化 数组检测缺陷问题

#### 监听缺陷

在 Vue 的数据绑定中会对一个对象属性的变化进行监听，并且通过依赖收集做出相应的视图更新

一个对象所有类型的属性变化都能被监听到吗？

之前用 Object.defineProperty 通过对象的 getter/setter 简单的实现了对象属性变化的监听，并且去通过依赖关系去做相应的依赖处理。

但是，这是存在问题的，尤其是当对象中某个属性的值是数组的时候。

**正如 Vue 文档所说：**

由于 JavaScript 的限制(出于性能考虑)，Vue 无法检测到以下数组变动（vue 做了阉割）：

vue2 不是不能监听数组的变化，而是效率太低。

数组通过索引值修改内容 vm.arr[1] = ‘aa’

```js
// 数组值虽然变化了，但是并没有相应到页面上，此时的数组值其实是 ['aaa','b','c']
btnClick(){
  this.letters[0]('aaa');

  // 替换方法一：splice()
  this.letters.splice(0,1,'aaa')
  // 替换方法二：Vue.set()。vue内部函数（这个也是响应式的）
  Vue.set(this.letters,0,'aaa')
}
```

数组长度的变化 vm.arr.length = 4

![image.png](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsnA6bieGWTtERalj.webp)

#### Vue.$set

Vue.$set(target,key,value)：可以动态的给数组、对象添加和修改数据，并更新视图中数据的显示。

Vue.set(target, key/index, value) 向响应式对象中添加一个属性，并确保这个新属性同样是响应式的，且触发视图更新。它必须用于向响应式对象上添加新属性，因为 Vue 无法探测普通的新增属性 (比如 this.obj.newProperty = 'hi')

- `Vue.set()` 方法内部是一个循环处理的过程，如果当前新增监听的是一个对象，那就继续调用自己形成一个递归，直到最后的**子属性**是一个`数组/非对象类型`的参数后，递归结束，然后为自己添加监听，在监听中又会触发其他相关的方法(Dep 中订阅的事件就会被触发)。形成我们常见的双向数据绑定

Vue.set( ) 是将 set 函数绑定在 Vue 构造函数上，this.$set() 是将 set 函数绑定在 Vue 原型上。

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs5420598-b147c6f4580c131d.png)

对于响应式数组，当浏览器支持*proto*属性时，使用 push 等方法时先从其原型 arrayMethods 上寻找 push 方法，也就是重写后的方法，处理之后数组变化会通知到其订阅者，更新页面，当在 arrayMethods 上查询不到时会向上在 Array.prototype 上查询；

当浏览器不支持*proto*属性时，使用 push 等方法时会从数组自身上查询，如果查询不到会向上再 Array.proptotype 上查询。

对于非响应式数组，当使用 push 等方法时会直接从 Array.prototype 上查询。

值得一提的是源码中通过判断浏览器是否支持*proto*来分别使用 protoAugment 和 copyAugment 方法将重写后的数组方法应用到数组中，这是因为对于 IE10 及以下浏览器是不支持*proto*属性的

判断当前环境是否可以使用对象的*proto*属性,该属性在 IE11 及更高浏览器中使用 export const hasProp = '_proto_' in {}

**结论：**

在将数组处理成响应式数据后，如果使用数组原始方法改变数组时，数组值会发生变化，但是并不会触发数组的 setter 来通知所有依赖该数组的地方进行更新，为此，vue 通过重写数组的某些方法来监听数组变化，重写后的方法中会手动触发通知该数组的所有依赖进行更新。

#### **Vue 重新的属性**

push pop shift unshift splice sort reverse

看来 Vue 能对数组进行监听的原因是，把数组的方法重写了。总结起来就是这几步：

**1**.先获取原生 Array 的原型方法，因为拦截后还是需要原生的方法帮我们实现数组的变化。

**2**.对 Array 的原型方法使用 Object.defineProperty 做一些拦截操作。

**3.**把需要被拦截的 Array 类型的数据原型指向改造后原型

```js
// 触发更新视图
function updateView() {
  console.log("视图更新");
}

// 重新定义数组原型
const oldArrayProperty = Array.prototype;
// 创建新对象，原型指向 oldArrayProperty ，再扩展新的方法不会影响原型
const arrProto = Object.create(oldArrayProperty);
["push", "pop", "shift", "unshift", "splice"].forEach((methodName) => {
  arrProto[methodName] = function () {
    updateView(); // 触发视图更新
    oldArrayProperty[methodName].call(this, ...arguments);
    // Array.prototype.push.call(this, ...arguments)
  };
});

// 重新定义属性，监听起来
function defineReactive(target, key, value) {
  // 深度监听
  observer(value);

  // 核心 API
  Object.defineProperty(target, key, {
    get() {
      return value;
    },
    set(newValue) {
      if (newValue !== value) {
        // 深度监听
        observer(newValue);

        // 设置新值
        // 注意，value 一直在闭包中，此处设置完之后，再 get 时也是会获取最新的值
        value = newValue;

        // 触发更新视图
        updateView();
      }
    },
  });
}

// 监听对象属性
function observer(target) {
  if (typeof target !== "object" || target === null) {
    // 不是对象或数组
    return target;
  }

  // 污染全局的 Array 原型
  // Array.prototype.push = function () {
  //     updateView()
  //     ...
  // }

  if (Array.isArray(target)) {
    target.__proto__ = arrProto;
  }

  // 重新定义各个属性（for in 也可以遍历数组）
  for (let key in target) {
    defineReactive(target, key, target[key]);
  }
}

// 准备数据
const data = {
  name: "zhangsan",
  age: 20,
  info: {
    address: "北京", // 需要深度监听
  },
  nums: [10, 20, 30],
};

// 监听数据
observer(data);

// 测试
// data.name = 'lisi'
// data.age = 21
// // console.log('age', data.age)
// data.x = '100' // 新增属性，监听不到 —— 所以有 Vue.set
// delete data.name // 删除属性，监听不到 —— 所有已 Vue.delete
// data.info.address = '上海' // 深度监听
data.nums.push(4); // 监听数组
```

### 13.vue 事件修饰符有哪些

**Vue 的事件处理**

1. 使用`@xxx`或者`v:on:xxx`来绑定事件，其中 xxx 是事件名。
2. 事件的回调函数必须写在`methods`上，并且`不要用箭头函数`，否则 this 指向不是 Vue 实例。
3. methods 中配置的函数，都是被 Vue 管理的函数，`this指向都是Vue`

**Vue 的事件修饰符**

- `.stop`：等同于 JavaScript 中的 `event.stopPropagation()` ，防止事件冒泡；
- `.prevent` ：等同于 JavaScript 中的 `event.preventDefault()` ，防止执行预设的行为（如果事件可取消，则取消该事件，而不停止事件的进一步传播）；
- `.capture` ：与事件冒泡的方向相反，事件捕获由外到内；
- `.self` ：只会触发自己范围内的事件，不包含子元素；
- `.once` ：只会触发一次。
- `passive`： 事件的默认行为立即执行，无需等待事件回调执行完毕

```js
//阻止默认事件(只会触发showInfo函数，并不会跳转到www.baid.com)
<a href="www.baidu.com" @click.prevent="showInfo">点我提示信息</a>

//阻止事件冒泡(点击div2只会触发当前的事件，并不会冒泡触发div1的事件)
<div @click="show">
   div1
   <div @click.stop="show">div2</div>
</div>

//事件只触发一次(只会触发一次点击事件，后续继续点击也不会再触发)
<div @click.once="show">div2</div>

//阻止事件捕获(点击div2先触发div1的事件，再触发div2的事件)
<div @click.capture="show">
   div1
   <div @click="show">div2</div>
</div>

//只有event.targer是当前操作的元素才触发(只有点击自身才会触发，通过冒泡也不会触发事件)
<div @click.self="show">
   div1
   <div @click="show">div2</div>
</div>

//事件的默认行为立即执行，无需等待事件回调执行完毕(不需要等待函数内容执行完，直接触发事件本来的效果)
<div @whell.passive="show">
   <div >div2</div>
   <div >div3</div>
   <div >div4</div>
   <div >div5</div>
</div>

```

### 14.template 渲染过程 ，模板编译原理

vue 的模版编译过程主要如下：**template -> ast -> render 函数**

vue 在模版编译版本的码中会执行 compileToFunctions 将 template 转化为 render 函数：

```javascript
// 将模板编译为render函数
const { render, staticRenderFns } = compileToFunctions(template,options//省略}, this)
```

CompileToFunctions 中的主要逻辑如下 ∶

**（1）调用 parse 方法将 template 转化为 ast（抽象语法树）**

```javascript
constast = parse(template.trim(), options);
```

- **parse 的目标**：把 tamplate 转换为 AST 树，它是一种用 JavaScript 对象的形式来描述整个模板。
- **解析过程**：利用正则表达式顺序解析模板，当解析到开始标签、闭合标签、文本的时候都会分别执行对应的 回调函数，来达到构造 AST 树的目的。

AST 元素节点总共三种类型：type 为 1 表示普通元素、2 为表达式、3 为纯文本

**（2）对静态节点做优化**

```javascript
optimize(ast, options);
```

这个过程主要分析出哪些是静态节点，给其打一个标记，为后续更新渲染可以直接跳过静态节点做优化

深度遍历 AST，查看每个子树的节点元素是否为静态节点或者静态节点根。如果为静态节点，他们生成的 DOM 永远不会改变，这对运行时模板更新起到了极大的优化作用。

**（3）生成代码**

```javascript
const code = generate(ast, options);
```

generate 将 ast 抽象语法树编译成 render 字符串并将静态部分放到 staticRenderFns 中，最后通过 ` new Function(`` render``) ` 生成 render 函数。

转换成 AST 的是 Vue 模板，Vue 需要根据模版去处理各种插值、指令；生成虚拟 DOM 的是最终要展示在页面上的内容的对象描述，Vue 每次需要通过 Diff 算法对比新旧虚拟 DOM 的差异；固定模版生成的 AST 是不变的，虚拟 DOM 是不断变化、需要进行差异对比的（数据等会变）

### 15.mixin 和 extends 的应用

**（1）mixin 和 extends** mixin 和 extends 均是用于合并、拓展组件的，两者均通过 mergeOptions 方法实现合并。

- mixins 接收一个混入对象的数组，其中混入对象可以像正常的实例对象一样包含实例选项，这些选项会被合并到最终的选项中。Mixin 钩子按照传入顺序依次调用，并在调用组件自身的钩子之前被调用。
- extends 主要是为了便于扩展单文件组件，接收一个对象或构造函数。

**（2）mergeOptions 的执行过程**

- 规范化选项（normalizeProps、normalizelnject、normalizeDirectives)
- 对未合并的选项，进行判断

```javascript
if (!child._base) {
  if (child.extends) {
    parent = mergeOptions(parent, child.extends, vm);
  }
  if (child.mixins) {
    for (let i = 0, l = child.mixins.length; i < l; i++) {
      parent = mergeOptions(parent, child.mixins[i], vm);
    }
  }
}
```

- 合并处理。根据一个通用 Vue 实例所包含的选项进行分类逐一判断合并，如 props、data、 methods、watch、computed、生命周期等，将合并结果存储在新定义的 options 对象里。
- 返回合并结果 options。

### 16.v-cloak 的应用

在开发过程中，会遇到刷新或者切换路由页面闪烁的情况，等数据加载成功再重新展示，需要用到 v-cloak 防止闪烁。

v-cloak 指令设置样式，样式会在 Vue 实例编译结束时，从 HTML 元素上被移除。

这个指令可以隐藏未编译的 Mustache 标签直到实例准备完毕。

解决方法

> 1.在 vue 容器的 div 里面加上 v-cloak：

```vue
<div id="app" v-cloak>
```

> 2.css 样式中加：

```css
<style>
    [v-cloak] {
        display: none !important;
    }
</style>
```

### 17.执行命令后渲染显示出页面的过程

[vue 渲染过程](https://segmentfault.com/a/1190000018495383)

1. 把模板编译为 render 函数
2. 实例进行挂载, 根据根节点 render 函数的调用，递归的生成虚拟 dom
3. 对比虚拟 dom，渲染到真实 dom
4. 组件内部 data 发生变化，组件和子组件引用 data 作为 props 重新调用 render 函数，生成虚拟 dom, 返回到步骤 3

#### 第一步: 模板到 render

在我们使用 Vue 的组件化进行开发应用的时候, 如果仔细的查看我们要引入的组件, 例子如下

```javascript
// App.vue
<template>
    <div>
        hello word
    </div>
</template>

<script>

export default {
}

</script>

<style>

</style>
```

在我们的主入口 main.js

```javascript
import Vue from "vue";
import App from "./App";

console.log(App);

new Vue({
  render: (h) => h(App),
}).$mount("#app");
```

![clipboard.png](https://segmentfault.com/img/bVbpyO2?w=1143&h=140)

我们能够看到在我们引入的 App 这个模块，里面是一个对象，对象里面存在一个方法叫做 render。在说 render 函数之前，我们可以想一想，每一次加载一个组件，然后对模板进行解析，解析完后，生成 Dom，挂载到页面上。这样会导致效率很低效。而使用 Vue-cli 进行组件化开发，在我们引入组件的后，其实会有一个解析器(`vue-loader`)对此模板进行了解析，生成了 render 函数。当然，如果没有通过解析器解析为 render 函数，也没有关系，在组件第一次挂载的时候，Vue 会自己进行解析。源码请参考: [https://github.com/vuejs/vue/...](https://link.segmentfault.com/?enc=1siedWNl%2FJiTt88QwG8ihw%3D%3D.%2Fo3W7WUR%2FZobCnNu8f0%2BVPj0AW4tdwsYnN6dRvDoexwg752EEpjJl52SJ2CtATv3ZKrf9XODxHyLz%2B9UBsIW%2BkrIkcnVhg9r64BOKXxAe0qiSFZWs6S%2FIVdZd%2BW9Gscy)
这样，能保证组件每次调用的都是 render 函数，使用 render 函数生成 VNode。

#### 第二步：虚拟节点 VNode

我们把 Vue 的实例挂载到`#app`, 会调用实例里面的 render 方法，生成虚拟 DOM。来看看什么是虚拟节点，把例子修改一下。

```arcade
new Vue({
  render: h => {
    let root = h(App)
    console.log('root:', root)
    return root
  }
}).$mount('#app')
```

![clipboard.png](https://segmentfault.com/img/bVbpAmx?w=1146&h=414)

上面生成的 VNode 就是虚拟节点，虚拟节点里面有一个属性**`elm`**, 这个属性指向真实的 DOM 节点。因为 VNode 指向了真实的 DOM 节点，那么虚拟节点经过对比后，生成的 DOM 节点就可以直接进行替换。
**这样有什么好处呢？**
一个组件对象，如果内部的`data`发生变化，触发了 render 函数，重新生成了 VNode 节点。那么就可以直接找到所对应的节点，然后直接替换。那么这个过程只会在本组件内发生，不会影响其他的组件。于是组件与组件是隔离的。
例子如下:

```javascript
// main.js
const root = new Vue({
  data: {
    state: true
  },
  mounted() {
    setTimeout(() => {
      console.log(this)
      this.state = false
    }, 1000)
  },
  render: function(h) {
    const { state } = this // state 变化重新触发render
    let root = h(App)
    console.log('root:', root)
    return root
  }
}).$mount('#app')
// App.vue
<script>
export default {
  render: (h) => {
    let app = h('h1', ['hello world'])
    console.log('app:', app)
    return app
  }
}
</script>
```

![clipboard.png](https://segmentfault.com/img/bVbpAvU?w=1203&h=285)
我们可以看到，当`main.js`中重新触发 render 函数的时候，render 方法里面有引用 App.vue 这个子组件。但是并没有触发 App.vue 组件的的 render 函数。

**`在一个组件内，什么情况会触发render?`**。

#### 如何才能触发组件的 render

数据劫持是 Vue 的一大特色，原理官方已经讲的很多了[深入响应式原理](https://link.segmentfault.com/?enc=nG3Xm0TdYEcB%2Bd%2F5LHODGA%3D%3D.RtXq4EIfRNFMdPrs%2Bkd3qxSB2AkDvc1jUSHWFl3W6Nt4xo6b%2Bo3A2WcgrS%2BLnRCt)。在我们给组件的 data 的属性进行的赋值的时候(set)，此属性如果在组件内部初次渲染过程被引用(`data的属性被访问，也就是数据劫持的get`), 包括生命周期方法或者 render 方法。于是会触发组件的 update(beforeUpdate -> render -> updated)。

> 注: 为了防止 data 被多次 set 从而触发多次 update, Vue 把 update 存放到异步队列中。这样就能保证多次 data 的 set 只会触发一次 update。

**`当props会触发组件的重新渲染是怎么发生的呢？`**

把父组件的 data 通过 props 传递给子组件的时候，子组件在初次渲染的时候生命周期或者 render 方法，有调用 data 相关的 props 的属性, 这样子组件也被添加到父组件的 data 的相关属性依赖中，这样父组件的 data 在 set 的时候，就相当于触发自身和子组件的 update。
例子如下:

```javascript
// main.vue
import Vue from 'vue'
import App from './App'

const root = new Vue({
  data: {
    state: false
  },
  mounted() {
    setTimeout(() => {
      this.state = true
    }, 1000)
  },
  render: function(h) {
    const { state } = this // state 变化重新触发render
    let root = h(App, { props: { status: state } })
    console.log('root:', root)
    return root
  }
}).$mount('#app')

window.root = root
// App.vue
<script>
export default {
  props: {
    status: Boolean
  },
  render: function (h){
    const { status } = this
    let app = h('h1', ['hello world'])
    console.log('app:', app)
    return app
  }
}
</script>
```

截图如下:

![clipboard.png](https://segmentfault.com/img/bVbpLBL?w=937&h=164)
在`main.js`中 **state** 状态发生了变化，由`false` => `true`, 触发了**自身**与**子组件**的 render 方法。

### 18.修改后页面更新渲染的过程

![在这里插入图片描述](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs5EZMmAjgp3Olv1w.png)

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsKWtlC9SIxfFOkhA.png)

一、初始化

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsOP6ZFBQD1WRbMay.png)

在 new Vue() 之后。 Vue 会调用 \_init 函数进行初始化，也就是这里的 init 过程，它会初始化生命周期、事件、 props、 methods、 data、 computed 与 watch 等。

二、模板编译

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsQH8LvVxN1BediCp.png)

上面就是使用 vue template complier（compile 编译可以分成 parse、optimize 与 generate 三个阶段），将模板编译成 render 函数，执行 render 函数后，变成 vnode。

parse、optimize 与 generate 三个阶段

parse

parse 会用正则等方式解析 template 模板中的指令、class、style 等数据，形成 AST，就是 with 语法的过程。

optimize

optimize 的主要作用是标记 static 静态节点，这是 Vue 在编译过程中的一处优化，后面当 update 更新界面时，会有一个 patch 的过程， diff 算法会直接跳过静态节点，从而减少了比较的过程，优化了 patch 的性能。

generate

generate 是将 AST 转化成 render function 字符串的过程，得到结果是 render 的字符串以及 staticRenderFns 字符串。

在经历过 parse、optimize 与 generate 这三个阶段以后，组件中就会存在渲染 VNode 所需的 render function 了。

三、vue 的响应式原理：

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgstzy3aGYQmgcwK5n.png)

前置知识:

observer (value) ，其中 value（需要「响应式」化的对象）。
defineReactive ，这个方法通过 Object.defineProperty 来实现对对象的「响应式」化，入参是一个 obj（需要绑定的对象）、key（obj 的某一个属性），val（具体的值）。
对象被读，就是说，这个值已经在页面中使用或则说已经使用插值表达式插入。
正式知识:

1.首先我们一开始会进行响应式初始化，也即是我们开始前的哪个 init 过程，通过 observer (value) 方法，然后通过 defineReactive()方法遍历，对每个对象的每个属性进行 setter 和 getter 初始化。

2.依赖收集：我们在闭包中增加了一个 Dep 类的对象，用来收集 Watcher 对象。在对象被「读」的时候，会触发 reactiveGetter 函数把当前的 Watcher 对象，收集到 Dep 类中去。之后如果当该对象被「写」的时候，则会触发 reactiveSetter 方法，通知 Dep 类调用 notify 来触发所有 Watcher 对象的 update 方法更新对应视图。

附加知识点：object.defineproperty()的缺点

我们知道 vue 响应式主要使用的是 object.defineproperty()这个 api，那他也会带来一些缺点：

需要深度监听，需要递归到底，一次性计算量大（比如引用类型层级较深）

无法监听新增属性/删除属性，需要使用 Vue.set 和 Vue.delete 才行
无法监听原生数组，需要重写数组方法
四、虚拟 dom

DOM 操作非常耗时，所以使用 VDOM，我们把计算转移为 JS 计算，
VDOM-用 JS 模拟 DOM 结构，计算出最小的变更，操作 DOM
因为有了虚拟 DOM，所以让 Vue 有了跨平台的能力

五、patch 函数，diff 算法上台

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsgKfwp6R9qtZ4okX.png)

这部分涉及算法

前置知识：

insert：在父几点下插入节点，如果指定 ref 则插入道 ref 这个子节点的前面。
createElm：用来新建一些节点，tag 节点存在创建一个标签节点，否则创建一个文本节点。
addVnodes：用来批量调用 createElm 新建节点。
removeNode：用来移除一个节点
removeVnodes：会批量调用 removeNode 移除节点
patch 函数：

patch 的核心就是 diff 算法，diff 算法通过同层的树节点进行比较而非对树进行逐层搜索遍历的方式，所以时间复杂度只有 o(n)，比较高效，我们看下图所示：

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs9Sz7lEO5gQjtpi2.png)

我们看下 patch 这个函数的 demo:

```js
 1 function patch (oldVnode, vnode, parentElm) {
 2     if (!oldVnode) {
 3         addVnodes(parentElm, null, vnode, 0, vnode.length - 1);
 4     } else if (!vnode) {
 5         removeVnodes(parentElm, oldVnode, 0, oldVnode.length - 1);
 6     } else {
 7         if (sameVnode(oldVNode, vnode)) {
 8             patchVnode(oldVNode, vnode);
 9         } else {
10             removeVnodes(parentElm, oldVnode, 0, oldVnode.length - 1);
11             addVnodes(parentElm, null, vnode, 0, vnode.length - 1);
12         }
13     }
14 }
```

首先在 oldVnode（老 VNode 节点）不存在的时候，相当于新的 VNode 替代原本没有的节点，所以直接用 addVnodes 将这些节点批量添加到 parentElm 上。
如果 vnode（新 VNode 节点）不存在的时候，相当于要把老的节点删除，所以直接使用 removeVnodes 进行批量的节点删除即可。
当 oldVNode 与 vnode 都存在的时候，需要判断它们是否属于 sameVnode（相同的节点）。如果是则进行 patchVnode（比对 VNode ）操作，否则删除老节点，增加新节点
patchVnode 函数:

我们看下关键代码

```js
 1 function patchVnode (oldVnode, vnode) {
 2     // 新老节点相同，直接return
 3     if (oldVnode === vnode) {
 4         return;
 5     }
 6     // 节点是否静态，并且新老接待你的key相同，只要把老节点拿来用就好了
 7     if (vnode.isStatic && oldVnode.isStatic && vnode.key === oldVnode.key) {
 8         vnode.elm = oldVnode.elm;
 9         vnode.componentInstance = oldVnode.componentInstance;
10         return;
11     }
12
13     const elm = vnode.elm = oldVnode.elm;
14     const oldCh = oldVnode.children;
15     const ch = vnode.children;
16     // 当VNode是文本节点，直接setTextContent来设置text
17     if (vnode.text) {
18         nodeOps.setTextContent(elm, vnode.text);
19     // 不是文本节点
20     } else {
21         // oldch(老)与ch(新)存在且不同，使用updateChildren()
22         if (oldCh && ch && (oldCh !== ch)) {
23             updateChildren(elm, oldCh, ch);
24         // 只有ch存在，若oldch(老)节点是文本节点，先删除，再将ch(新)节点插入elm节点下
25         } else if (ch) {
26             if (oldVnode.text) nodeOps.setTextContent(elm, '');
27             addVnodes(elm, null, ch, 0, ch.length - 1);
28         // 同理当只有oldch(老)节点存在，说明需要将oldch(老)节点通过removeVnode全部删除
29         } else if (oldCh) {
30             removeVnodes(elm, oldCh, 0, oldCh.length - 1)
31         // 当老节点是文本节点，清除其节点内容
32         } else if (oldVnode.text) {
33             nodeOps.setTextContent(elm, '')
34         }
35     }
36 }
```

整理如下：

新老节点相同，直接 return
节点是否静态，并且新老接待你的 key 相同，只要把老节点拿来用就好了
当 VNode 是文本节点，直接 setTextContent 来设置 text，若不是文本节点者执行 4-7
oldch(老)与 ch(新)存在且不同，使用 updateChildren()（后面介绍）
只有 ch 存在，若 oldch(老)节点是文本节点，先删除，再将 ch(新)节点插入 elm 节点下
同理当只有 oldch(老)节点存在，说明需要将 oldch(老)节点通过 removeVnode 全部删除
当老节点是文本节点，清除其节点内容
updateChildren 函数

下面是关键代码：

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsSwqaBmjKc9NxPIA.png)

直接看我的代码注释吧！

```js
 1 // sameVnode() 就是说key，tag，iscomment(注释节点)，data四个同时定义
 2 while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
 3   if (!oldStartVnode) {
 4       oldStartVnode = oldCh[++oldStartIdx];
 5   } else if (!oldEndVnode) {
 6       oldEndVnode = oldCh[--oldEndIdx];
 7   // 老节点的开头与新节点的开头对比
 8   } else if (sameVnode(oldStartVnode, newStartVnode)) {
 9       patchVnode(oldStartVnode, newStartVnode);
10       oldStartVnode = oldCh[++oldStartIdx];
11       newStartVnode = newCh[++newStartIdx];
12   // 老节点的结尾与新节点的结尾对比
13   } else if (sameVnode(oldEndVnode, newEndVnode)) {
14       patchVnode(oldEndVnode, newEndVnode);
15       oldEndVnode = oldCh[--oldEndIdx];
16       newEndVnode = newCh[--newEndIdx];
17   // 老节点的开头与新节点的结尾
18   } else if (sameVnode(oldStartVnode, newEndVnode)) {
19       patchVnode(oldStartVnode, newEndVnode);
20       nodeOps.insertBefore(parentElm, oldStartVnode.elm, nodeOps.nextSibling(oldEndVnode.elm));
21       oldStartVnode = oldCh[++oldStartIdx];
22       newEndVnode = newCh[--newEndIdx];
23   // 老节点的结尾与新节点的开头
24   } else if (sameVnode(oldEndVnode, newStartVnode)) {
25       patchVnode(oldEndVnode, newStartVnode);
26       nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
27       oldEndVnode = oldCh[--oldEndIdx];
28       newStartVnode = newCh[++newStartIdx];
29   // 如果上面的情况都没有满足
30   } else {
31       // 把老的元素进行移动
32       let elmToMove = oldCh[idxInOld];
33       // 如果老的节点找不到对应索引则创建
34       if (!oldKeyToIdx) oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
35       // 在新节点中的key值找到老节点索引
36       idxInOld = newStartVnode.key ? oldKeyToIdx[newStartVnode.key] : null;
37       // 如果没有找到相同的节点，则通过 createElm 创建一个新节点，并将 newStartIdx 向后移动一位。
38       if (!idxInOld) {
39           createElm(newStartVnode, parentElm);
40           newStartVnode = newCh[++newStartIdx];
41       // 否则如果找到了节点，同时它符合 sameVnode，则将这两个节点进行 patchVnode，将该位置的老节点赋值 undefined
42       } else {
43           // 这是是想把相同的节点进行移动
44           elmToMove = oldCh[idxInOld];
45           // 然后再进行对比
46           if (sameVnode(elmToMove, newStartVnode)) {
47               patchVnode(elmToMove, newStartVnode);
48               oldCh[idxInOld] = undefined;
49               nodeOps.insertBefore(parentElm, newStartVnode.elm, oldStartVnode.elm);
50               newStartVnode = newCh[++newStartIdx];
51               // 如果不符合 sameVnode，只能创建一个新节点插入到 parentElm 的子节点中，newStartIdx 往后移动一位。
52           } else {
53               createElm(newStartVnode, parentElm);
54               newStartVnode = newCh[++newStartIdx];
55           }
56       }
57   }
58 }
59 // 当oldStartIdx > oldEndIdx 或oldStartIdx> oldEndIdx说明结束
60 if (oldStartIdx > oldEndIdx) {
61   refElm = (newCh[newEndIdx + 1]) ? newCh[newEndIdx + 1].elm : null;
62   addVnodes(parentElm, refElm, newCh, newStartIdx, newEndIdx);
63 } else if (newStartIdx > newEndIdx) {
64   removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
65 }
66 }
```

上面涉及了很多东西，也不是一时半会能够讲完的，看代码的过程也挺艰辛的！

**最后总结下渲染过程**

初次渲染：

解析模板为 render 函数(或再开发环境已完成)
触发响应式，监听 data 属性的 getter 的依赖收集，也即是往 dep 里面添加 watcher 的过程
执行 render 函数，生成 vnode，patch
更新过程:

修改 data，setter(必需是初始渲染已经依赖过的)调用 Dep.notify()，将通知它内部的所有的 Watcher 对象进行视图更新
重新执行 rendern 函数，生成 newVnode
然后就是 patch 的过程(diff 算法)

### 19.vue data 中某一个属性的值发生改变后，视图会立即同步执行重新渲染吗？

不会立即同步执行重新渲染。Vue 实现响应式并不是数据发生变化之后 DOM 立即变化，而是按一定的策略进行 DOM 的更新。Vue 在更新 DOM 时是异步执行的。只要侦听到数据变化， Vue 将开启一个队列，并缓冲在同一事件循环中发生的所有数据变更。

如果同一个 watcher 被多次触发，只会被推入到队列中一次。这种在缓冲时去除重复数据对于避免不必要的计算和 DOM 操作是非常重要的。然后，在下一个的事件循环 tick 中，Vue 刷新队列并执行实际（已去重的）工作。

### 20.vue 中 scoped css 原理

在开发环境我们的组件会先经过 vue-loader 的处理，然后结合运行时的框架代码渲染到页面上

Scope CSS 的本质是基于 HTML 和 CSS 选择器的属性，通过分别给 HTML 标签和 CSS 选择器添加 `data-v-xxxx` 属性的方式实现

针对 Scope CSS 而言，vue-loader 会做这 3 件事：

- 解析组件，提取出 `template`、`script`、`style` 对应的代码块
- 构造并导出 `export` 组件实例，在组件实例的选项上绑定 ScopId
- 对 `style` 的 CSS 代码进行编译转化，应用 ScopId 生成选择器的属性

vue-loader 的底层使用了 Vue 官方提供的包（package） [@vue/component-compiler-utils](https://link.juejin.cn/?target=https%3A%2F%2Fgithub.com%2Fvuejs%2Fcomponent-compiler-utils)，其提供了解析组件（.vue 文件）、编译模版 `template`、编译 `style`等 3 种能力

`template` 会被编译成 `render` 函数，然后会根据 `render` 函数创建对应的 VNode，最后再由 VNode 渲染成真实的 DOM 在页面上

### 21.vue-cli 实现原理

[精简版](https://juejin.cn/post/6844904041823240205)

献上源码地址： [源码](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2FMasonEast%2Fmasoneast-cli)

```js
$ npm i masoneast-cli -g
$ masoneast init my-project
```

现在， 我们一起来了解下`vue-cli`到底帮我们做了什么，让我们可以一行命令就可以生成一个工程吧！

#### 整体流程

我们先了解下如何使用`vue-cli`， 再详细讲解每一步的实现。

`vue-cli`提供了多种模板， 我们这里以`webpack`模板为例。

- 安装: `npm install vue-cli -g`
- 使用：
  1. 直接下载使用： `vue init webpack my-project`
  2. 离线使用： `vue init webpack my-projiect --offline`
  3. clone 使用： `vue init webpack my-projiect --clone`

这样， 我们就能在当前目录下得到一个 vue 的初始工程了。

当我们使用`vue-cli`时， 其实依赖了两个东西： 一个是`vue-cli`命令行， 一个是`vue-template`模板， 用于生成工程。

1. 当我们**全局安装了`vue-cli`后**， 会注册环境变量，生成软连接， 这样我们在命令行中任意路径就可以使用该命令了。
2. 当我们**敲下`vue init webpack my-project`时**， `vue-cli`会提示你正在下载模板。

此时， `vue-cli`就是从 github 托管的代码中`download`对应的`webpack`模板。 对应的 webpack 模板的 git 地址在这里： [webpack 模板](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fvuejs-templates%2Fwebpack)

拼接 url 代码是这段：

```js
function getUrl(repo, clone) {
  var url;

  // Get origin with protocol and add trailing slash or colon (for ssh)
  var origin = addProtocol(repo.origin, clone);
  if (/^git\@/i.test(origin)) origin = origin + ":";
  else origin = origin + "/";

  // Build url
  if (clone) {
    url = origin + repo.owner + "/" + repo.name + ".git";
  } else {
    if (repo.type === "github")
      url =
        origin +
        repo.owner +
        "/" +
        repo.name +
        "/archive/" +
        repo.checkout +
        ".zip";
    else if (repo.type === "gitlab")
      url =
        origin +
        repo.owner +
        "/" +
        repo.name +
        "/repository/archive.zip?ref=" +
        repo.checkout;
    else if (repo.type === "bitbucket")
      url =
        origin +
        repo.owner +
        "/" +
        repo.name +
        "/get/" +
        repo.checkout +
        ".zip";
  }

  return url;
}
```

3.当模板下载完毕后， `vue-cli`会将它放在你的本地，方便你以后离线使用它生成项目， 路径是`/Users/xxx/.vue-templates`， 如果你之前有使用`vue-cli`生成过项目， 应该在你的管理员路径下能找到对应的`.vue-templates`文件夹。里面的 webpack 文件就和上面 git 地址里的代码一模一样。

**注意：** .开头的文件夹默认是隐藏的， 你需要让它展示出来才能看到。

1.**询问交互**

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsimgs9MhlgVd6PuGSIY2.webp)

接下， `vue-cli`会问你一堆问题， 你回答的这些问题它会将它们的答案存起来， 在接下来的生成中， 会根据你的答案来渲染生成对应的文件。

2.**文件筛选**

在你回答完问题后， `vue-cli`就会根据你的需求从 webpack 模板中筛选出无用的文件， 并删除， 它不是从你本地删除， 只是在给你生成的项目中删除这些文件。

3.**模板渲染**

在模板中， 你的`src/App.vue`长这样：

```js
<template>
  <div id="app">
    <img src="./assets/logo.png">
    {{#router}}
    <router-view/>
    {{else}}
    <HelloWorld/>
    {{/router}}
  </div>
</template>

<script>
{{#unless router}}
import HelloWorld from './components/HelloWorld'

{{/unless}}
export default {
  name: 'App'{{#router}}{{else}},
  components: {
    HelloWorld
  }{{/router}}
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
```

如果在选择是否需要路由， 你选是，那最后生成在你的项目的`App.vue`长这样：

```js
<template>
  <div id="app">
    <img src="./assets/logo.png">
    <router-view/>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
```

它会根据你的要求，渲染出不同的文件给你。

4.**文件生成**

在完成渲染后， 接下来就会在你当前目录下生成对应的文件了， 至此， `vue-cli`的工作就完成了。

#### 动手实现

搞明白了`vue-cli`的工作原理， 我们完全可以自己做一个简单点的 cli 出来了。

##### 命令注册

通过`npm init`生成你的`package.json`文件, 在里面加入 bin

```js
  "bin": {
    "xxx": "bin/index.js"
  },
```

这样， 当你全局装包的时候才会把你`xxx`命令注册到环境变量中。

接下来就是`bin/index.js`的事了。

##### 使用`commander`完成命令行中的命令

```js
program
  .command("init [project-name]")
  .description("create a project")
  .option("-c, --clone", `it will clone from ${tmpUrl}`)
  .option("--offline", "use cached template")
  .action(function (name, options) {
    console.log('we are try to create "%s"....', name);
    downloadAndGenerate(name, options);
  })
  .on("--help", function () {
    console.log("");
    console.log("Examples:");
    console.log("");
    console.log("  $ masoneast init my-project");
    console.log(`  $ path: ${home}`);
  });

program.parse(process.argv);
```

通过上面代码， 你就有了`init`命令， 和`clone`, `offline`参数了， 此时你就有了：

```js
$ masoneast init my-project
$ masoneast init my-project --clone
$ masoneast init my-project --offline
```

关于`commander`包的具体使用， 可以看这里： [commander](https://link.juejin.cn?target=)

##### 实现下载和 clone 模板

这里你需要有有个模板的地址供你下载和 clone， 如果你只是玩玩的话也可以直接使用`vue`提供的模板地址， 或者我的模板地址： [模板](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2FMasonEast%2Fmasoneast-template)

下载实现代码：

这里依赖了两个库: `git-clone`和`download`。

```js
function download(name, clone, fn) {
  if (clone) {
    gitclone(tmpUrl, tmpPath, (err) => {
      if (err) fn(err);
      rm(tmpPath + "/.git");
      fn();
    });
  } else {
    const url = tmpUrl.replace(/\.git*/, "") + "/archive/master.zip";
    console.log(url);
    downloadUrl(url, tmpPath, {
      extract: true,
      strip: 1,
      mode: "666",
      headers: { accept: "application/zip" },
    })
      .then(function (data) {
        fn();
      })
      .catch(function (err) {
        fn(err);
      });
  }
}
```

##### 实现询问交互

交互的实现， 主要依赖了`inquirer`库。

```js
function askQuestion(prompts) {
  //询问交互
  return (files, metalsmith, done) => {
    async.eachSeries(
      Object.keys(prompts),
      (key, next) => {
        prompt(metalsmith.metadata(), key, prompts[key], next);
      },
      done
    );
  };
}
```

将询问得到的答案存贮起来， 留给后面渲染使用

```js
function prompt(data, key, prompt, done) {
  //将用户操作存储到metaData中
  inquirer
    .prompt([
      {
        type: prompt.type,
        name: key,
        message: prompt.message || prompt.label || key,
        default: prompt.default,
        choices: prompt.choices || [],
        validate: prompt.validate || (() => true),
      },
    ])
    .then((answers) => {
      if (Array.isArray(answers[key])) {
        data[key] = {};
        answers[key].forEach((multiChoiceAnswer) => {
          data[key][multiChoiceAnswer] = true;
        });
      } else if (typeof answers[key] === "string") {
        data[key] = answers[key].replace(/"/g, '\\"');
      } else {
        data[key] = answers[key];
      }
      done();
    })
    .catch(done);
}
```

##### 实现模板渲染

模板渲染， 依赖了前端模板引擎`handlebar`和解析模板引擎的`consolidate`库。 上面看到的`vue-template`模板里的`{{#router}}`其实就是`handlebar`的语法。

```js
function renderTemplateFiles() {
  return (files, metalsmith, done) => {
    const keys = Object.keys(files);
    const metalsmithMetadata = metalsmith.metadata(); //之前用户操作后的数据存在这里面
    async.each(
      keys,
      (file, next) => {
        //对模板进行遍历， 找到需要渲染内容的文件
        const str = files[file].contents.toString();
        if (!/{{([^{}]+)}}/g.test(str)) {
          //正则匹配文件内容， 如果没有就不需要修改文件， 直接去往下一个
          return next();
        }
        render(str, metalsmithMetadata, (err, res) => {
          if (err) {
            err.message = `[${file}] ${err.message}`;
            return next(err);
          }
          files[file].contents = new Buffer(res);
          next();
        });
      },
      done
    );
  };
}
```

##### 实现将文件从本地写到你的项目目录中

这里用到了一个核心库： `metalsmith`。它主要功能就是读取你的文件， 并通过一系列的中间件对你的文件进行处理， 然后写到你想要的路径中去。就是通过这个库， 将我们的各个流程串联起来， 实现对模板的改造， 写出你想要的项目。

```js
metalsmith
  .use(askQuestion(options.prompts)) //这一段是generator的精华， 通过各种中间件对用户选择的模板进行处理
  .use(filterFiles(options.filters)) //文件筛选过滤
  .use(renderTemplateFiles()) //模板内部变量渲染
  .source(".")
  .destination(projectPath) //项目创建的路径
  .build((err, files) => {
    if (err) console.log(err);
  });
```

##### 后话

这里实现的 demo 就是`vue-cli`的精简版， 主要功能有：

- 1. 从 git 上 download 和 clone 项目模板
- 1. 保存模板到本地，方便离线使用
- 1. 询问问题， 按用户需求定制模板

`vue-cli`还有有很多的容错判断， 以及其他模板， 下载源等的切换这里都没有做处理了。

### 22.render 函数使用

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsRdTW6LmoK5j8wBx.webp)

在了解 vue render 函数之前, 需要先了解下 Vue 的整体流程(如上图)

通过上图, 应该可以理解一个 Vue 组件是如何运行起来的.

- 模板通过编译生成 AST 树
- AST 树生成 Vue 的 render 渲染函数
- render 渲染函数结合数据生成 vNode(Virtual DOM Node)树
- Diff 和 Patch 后生新的 UI 界面(真实 DOM 渲染)

在这张图中, 我们需要了解以下几个概念:

- 模板, Vue 模板是纯 HTML, 基于 Vue 的模板语法, 可以比较方便的处理数据和 UI 界面的关系
- AST, 即 Abstract Syntax Tree 的简称, Vue 将 HTML 模板解析为 AST,并对 AST 进行一些优化的标记处理, 提取最大的静态树,以使 Virtual DOM 直接跳过后面的 Diff
- render 渲染函数, render 渲染函数是用来生成 Virtual DOM 的. Vue 推荐使用模板来构建我们的应用程序, 在底层实现中 Vue 最终还是会将模板编译成渲染函数. 因此, 若我们想要得到更好的控制, 可以直接写渲染函数.(**重点**)
- Virtual DOM, 虚拟 DOM
- Watcher, 每个 Vue 组件都有一个对应的`watcher`, 它会在组件`render`时收集组件所依赖的数据, 并在依赖有更新时, 触发组件重新渲染, Vue 会自动优化并更新需要更新 DOM

在上图中, `render`函数可以作为一道分割线:

- `render`函数左边可以称为**编译期**, 将 Vue 板转换为渲染函数
- `render`函数右边, 是 Vue 运行时, 主要是将渲染函数生成 Virtual DOM 树, 以及 Diff 和 Patch

#### render 渲染组件

Vue 推荐在绝大多数情况下使用模板来创建你的 HTML。然而在一些场景中，你真的需要 JavaScript 的完全编程的能力。这时你可以用渲染函数，它比模板更接近编译器。

这个例子里 `render` 函数很实用。假设我们要生成一些带锚点的标题：

```js
<h1>
  <a name="hello-world" href="#hello-world">
    Hello world!
  </a>
</h1>
```

对于上面的 HTML，你决定这样定义组件接口：

```js
<anchored-heading :level="1">Hello world!</anchored-heading>
```

当开始写一个只能通过 `level` prop 动态生成标题 (heading) 的组件时，你可能很快想到这样实现：

```js
<script type="text/x-template" id="anchored-heading-template">
  <h1 v-if="level === 1">
    <slot></slot>
  </h1>
  <h2 v-else-if="level === 2">
    <slot></slot>
  </h2>
  <h3 v-else-if="level === 3">
    <slot></slot>
  </h3>
  <h4 v-else-if="level === 4">
    <slot></slot>
  </h4>
  <h5 v-else-if="level === 5">
    <slot></slot>
  </h5>
  <h6 v-else-if="level === 6">
    <slot></slot>
  </h6>
</script>;
Vue.component("anchored-heading", {
  template: "#anchored-heading-template",
  props: {
    level: {
      type: Number,
      required: true,
    },
  },
});
```

这里用模板并不是最好的选择：不但代码冗长，而且在每一个级别的标题中重复书写了 `<slot></slot>`，在要插入锚点元素时还要再次重复。

虽然模板在大多数组件中都非常好用，但是显然在这里它就不合适了。那么，我们来尝试使用 `render` 函数重写上面的例子：

```js
Vue.component("anchored-heading", {
  render: function (createElement) {
    return createElement(
      "h" + this.level, // 标签名称
      this.$slots.default // 子节点数组
    );
  },
  props: {
    level: {
      type: Number,
      required: true,
    },
  },
});
```

#### Node & tree & Virtual DOM

HTML 代码:

```xml
<div>
    <h1>My title</h1>
    Some text content
    <!-- TODO: Add tagline -->
</div>

```

当浏览器读取到这些代码时, 它会建立一个[DOM 节点树](https://link.juejin.cn?target=https%3A%2F%2Fjavascript.info%2Fdom-nodes)来保持追踪, 如果你要画一张家谱树来追踪家庭成员的发展的话, HTML 的 DOM 节点树的可能如下图所示:

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsyZqHADgsTkrjdLO.webp)

每个**元素**和**文字**都是一个节点, 甚至注释也是节点. 一个节点就是页面的一部分, 就像家谱树中一样, 每个节点都可以有孩子节点.

高效的更新所有节点可能是比较困难的, 不过你不用担心, 这些 Vue 都会自动帮你完成, 你只需要通知 Vue 页面上 HTML 是什么?

可以是一个 HTML 模板, 例如:

```css
<h1>{{title}}</h1>
```

也可以是一个渲染函数:

```javascript
render(h){
  return h('h1', this.title)
}
```

在这两种情况下，若`title`值发生了改变, Vue 都会自动保持页面的更新.

#### 虚拟 DOM

Vue 编译器在编译模板之后, 会将这些模板编译为渲染函数(render), 当渲染函数(render)被调用时, 就会返回一个虚拟 DOM 树.

当我们得到虚拟 DOM 树后, 再转交给一个**Patch 函数**, 它会负责把这些虚拟 DOM 渲染为真实 DOM. 在这个过程中, Vue 自身的响应式系统会侦测在渲染过程中所依赖的数据来源, 在渲染过程中, 侦测到数据来源后即可精确感知数据源的变动, 以便在需要的时候重新进行渲染. 当重新进行渲染之后, 会生成一个新的树, 将新的树与旧的树进行对比, 就可以得到最终需要对真实 DOM 进行修改的改动点, 最后通过 Patch 函数实施改动.

简单来讲, 即: 在 Vue 的底层实现上，Vue 将模板编译成虚拟 DOM 渲染函数。结合 Vue 自带的响应系统，在应该状态改变时，Vue 能够智能地计算出重新渲染组件的最小代价并应到 DOM 操作上。

Vue 支持我们通过`data`参数传递一个 JavaScript 对象作为组件数据, Vue 将遍历 data 对象属性, 使用`Object.defineProperty`方法设置描述对象, 通过`gett/setter`函数来拦截对该属性的读取和修改.

Vue 创建了一层`Watcher`层, 在组件渲染的过程中把属性记录为依赖, 当依赖项的`setter`被调用时, 会通知`Watcher`重新计算, 从而使它关联的组件得以更新.

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgstRAXZKzB6hrYju8.webp)

通过前面的学习, 我们初步了解到 Vue 通过建立一个\*\*虚拟 DOM"对真实 DOM 发生变化保持追踪. 例如

```kotlin
return createElement('h1', this.title)
```

`createElement`, 即`createNodeDescription`, 返回虚拟节点(Virtual Node), 通常简写为"VNode". 虚拟 DOM 是由 Vue 组件树建立起来的整个 VNode 树的总称.

Vue 组件树建立起来的整个 VNode 树是唯一的, 不可重复的. 例如, 下面的 render 函数是无效的.

```javascript
render(createElement) {
  const vP = createElement('p', 'hello james')
  return createElement('div', [
    // error, 有重复的vNode
    vP, vP
  ])
}
```

若需要很多重复的组件/元素, 可以使用工厂函数来实现. 例如:

```javascript
render(createElement){
  return createElement('div', Array.apply(null, {length: 20}).map(() => {
    return createElement('p', 'hi james')
  }))
}
```

#### Vue 渲染机制

下图展示的是独立构建时, 一个组件的渲染流程图:

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs4R8GYfyKgCltSzb.webp)

会涉及到 Vue 的 2 个概念:

- 独立构建, 包含模板编译器, 渲染过程: HTML 字符串 => render 函数 => vNode => 真实 DOM
- 运行时构建, 不包含模板编译器, 渲染过程: render 函数 => vNode => 真实 DOM

运行时构建的包, 会比独立构建少一个模板编译器(因此运行速度上会更快). 在`$mount`函数上也不同, 而`$mount`方法是整个渲染过程中的起始点, 用下面这张流程图来说明:

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs3MULJGrseoOEAXa.webp)

从上图可以看出, 在渲染过程中, 提供了三种模板:

- 自定义 render 函数
- template
- el

均可以渲染页面, 也就对应我们使用 Vue 时的三种写法. 这 3 种模式最终都是要得到`render`函数.

对于平时开发来讲, 使用 template 和 el 会比较友好些, 容易理解, 但灵活性较差. 而 render 函数, 能够胜任更加复杂的逻辑, 灵活性高, 但对于用户理解相对较差.

##### 自定义 render 函数

```js
Vue.component("anchored-heading", {
  render(createElement) {
    return createElement("h" + this.level, this.$slots.default);
  },
  props: {
    level: {
      type: Number,
      required: true,
    },
  },
});
```

##### template 写法

```js
const app = new Vue({
  template: `<div>{{ msg }}</div>`,
  data() {
    return {
      msg: "Hello Vue.js!",
    };
  },
});
```

##### el 写法

```js
let app = new Vue({
  el: "#app",
  data() {
    return {
      msg: "Hello Vue!",
    };
  },
});
```

#### vue 的 h 函数

在 vue 脚手架中，我们经常会看到这样一段代码：

```javascript
  const app = new Vue({
    ··· ···
    render: h => h(App)
  })
```

这个 render 方法也可以写成这样：

```javascript
  const app = new Vue({
    ··· ···
    render:function(createElement){
        return createElment(App)
    }
  })
```

**h 函数就是 vue 中的 createElement 方法，这个函数作用就是创建虚拟 dom，追踪 dom 变化**

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs20190715150357696.png)

**上边代码：最终 html 代码会被编译成 h 函数的渲染形式。返回的是一个虚拟 DOM 对象，通过 diff 算法，来追踪自己要如何改变真实 DOM**

```js
function h(tag, props, ...children) {
  //h函数，返回一个虚拟dom对象
  return {
    tag,
    props: props || {},
    children: children.flat(), //扁平化数组，降至一维数组
  };
}
```

**createElement 函数，它返回的实际上不是一个 DOM 元素，更准确的名字是：createNodeDescription（直译为——创建节点描述），因为它所包含的信息会告诉 vue 页面上需要渲染什么样的节点，包括其子节点的描述信息**

#### 理解&使用 render 函数

render 函数即渲染函数，它接收一个`createElement` 方法作为第一个参数用来创建 `VNode`。（简单的说就是 render 函数的参数也是一个函数）

createElement 也是一个函数，它接受三个参数

- 【必填】一个 HTML **标签**名、**组件**选项对象，或者 resolve 了上述任何一种的一个 async 函数。`类型：{String | Object | Function}`
- 【可选】一个与模板中 attribute 对应的数据对象。 `类型:{Object}`
- 【可选】子级虚拟节点 (VNodes) `类型：{String | Array}`

将 `h` 作为 `createElement` 的别名是 Vue 生态系统中的一个通用惯例

![image-20220403211335766](https://s2.loli.net/2022/04/03/4jENmaDQyK1YWVu.png)

在 vue-cli 生成的项目中

vue-template-complier 可以将 template 转换成 withIthis){ return h('p',[...]) }

![DOM的流程图 (1).png](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsPWVyCU5BtrkQKjS.webp)

#### createElement 参数

`createElement`可以接受多个参数

##### 第 1 个参数: `{String | Object | Function }`, 必传

第一个参数是必传参数, 可以是字符串`String`, 也可以是`Object`对象或函数`Function`

```javascript
// String
Vue.component("custom-element", {
  render(createElement) {
    return createElement("div", "hello world!");
  },
});
// Object
Vue.component("custom-element", {
  render(createElement) {
    return createElement({
      template: `<div>hello world!</div>`,
    });
  },
});
// Function
Vue.component("custom-element", {
  render(createElement) {
    const elFn = () => {
      template: `<div>hello world!</div>`;
    };
    return createElement(elFn());
  },
});
```

以上代码, 等价于:

```xml
<template>
  <div>hello world!</>
</template>
<script>
  export default {
    name: 'custom-element'
  }
</script>
```

##### 第 2 个参数: `{ Object }`, 可选

`createElemen`的第二个参数是可选参数, 这个参数是一个 Object, 例如:

```php
Vue.component('custom-element', {
  render(createElement) {
    const self = this;
    return createElement('div', {
      'class': {
        foo: true,
        bar: false
      },
      style: {
        color: 'red',
        fontSize: '18px'
      },
      attrs: {
        ...self.attrs,
        id: 'id-demo'
      },
      on: {
        ...self.$listeners,
        click: (e) => {console.log(e)}
      },
      domProps: {
        innerHTML: 'hello world!'
      },
      staticClass: 'wrapper'
    })
  }
})
```

等价于:

```xml
<template>
  <div :id="id" class="wrapper" :class="{'foo': true, 'bar': false}" :style="{color: 'red', fontSize: '18px'}" v-bind="$attrs" v-on="$listeners" @click="(e) => console.log(e)"> hello world! </div>
</template>
<script>
export default {
  name: 'custom-element',
  data(){
    return {
      id: 'id-demo'
    }
  }
}
</script>

<style>
.wrapper{
  display: block;
  width: 100%;
}
</style>
```

##### 第 3 个参数: `{ String | Array }`, 可选

`createElement`第 3 个参数是可选的，可以给其传一个`String`或`Array`, 例如:

```js
Vue.component("custom-element", {
  render(createElement) {
    var self = this;
    return createElement(
      "div",
      {
        class: {
          title: true,
        },
        style: {
          border: "1px solid",
          padding: "10px",
        },
      },
      [createElement("h1", "Hello Vue!"), createElement("p", "Hello world!")]
    );
  },
});
```

等价于:

```js
<template>
  <div :class="{'title': true}" :style="{border: '1px solid', padding: '10px'}">
    <h1>Hello Vue!</h1>
    <p>Hello world!</p>
  </div>
</template>
<script>
export default {
  name: 'custom-element',
  data(){
    return {
      id: 'id-demo'
    }
  }
}
</script>
```

##### 使用 template 和 render 创建相同效果的组件

template 方式

```xml
<template>
  <div id="wrapper" :class="{show: show}" @click="clickHandler">
    Hello Vue!
  </div>
</template>
<script>
export default {
  name: 'custom-element',
  data(){
    return {
      show: true
    }
  },
  methods: {
    clickHandler(){
      console.log('you had click me!');
    }
  }
}
</script>
```

render 方式

```php
Vue.component('custom-element', {
      data () {
        return {
            show: true
        }
      },
      methods: {
          clickHandler: function(){
            console.log('you had click me!');
          }
      },
      render: function (createElement) {
          return createElement('div', {
              class: {
                show: this.show
              },
              attrs: {
                id: 'wrapper'
              },
              on: {
                click: this.handleClick
              }
          }, 'Hello Vue!')
      }
})
```

#### createElement 解析过程

createElement 解析流程图

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgscAN4GmIKa7wFWbp.webp)

[`createElement`解析过程核心源代码](https://segmentfault.com/a/1190000008291645)

```scss
const SIMPLE_NORMALIZE = 1
const ALWAYS_NORMALIZE = 2

function createElement (context, tag, data, children, normalizationType, alwaysNormalize) {

    // 兼容不传data的情况
    if (Array.isArray(data) || isPrimitive(data)) {
        normalizationType = children
        children = data
        data = undefined
    }

    // 如果alwaysNormalize是true
    // 那么normalizationType应该设置为常量ALWAYS_NORMALIZE的值
    if (alwaysNormalize) normalizationType = ALWAYS_NORMALIZE
        // 调用_createElement创建虚拟节点
        return _createElement(context, tag, data, children, normalizationType)
    }

    function _createElement (context, tag, data, children, normalizationType) {
        /**
        * 如果存在data.__ob__，说明data是被Observer观察的数据
        * 不能用作虚拟节点的data
        * 需要抛出警告，并返回一个空节点
        *
        * 被监控的data不能被用作vnode渲染的数据的原因是：
        * data在vnode渲染过程中可能会被改变，这样会触发监控，导致不符合预期的操作
        */
        if (data && data.__ob__) {
            process.env.NODE_ENV !== 'production' && warn(
            `Avoid using observed data object as vnode data: ${JSON.stringify(data)}\n` +
            'Always create fresh vnode data objects in each render!',
            context
            )
            return createEmptyVNode()
        }

        // 当组件的is属性被设置为一个falsy的值
        // Vue将不会知道要把这个组件渲染成什么
        // 所以渲染一个空节点
        if (!tag) {
            return createEmptyVNode()
        }

        // 作用域插槽
        if (Array.isArray(children) && typeof children[0] === 'function') {
            data = data || {}
            data.scopedSlots = { default: children[0] }
            children.length = 0
        }

        // 根据normalizationType的值，选择不同的处理方法
        if (normalizationType === ALWAYS_NORMALIZE) {
            children = normalizeChildren(children)
        } else if (normalizationType === SIMPLE_NORMALIZE) {
            children = simpleNormalizeChildren(children)
        }
        let vnode, ns

        // 如果标签名是字符串类型
        if (typeof tag === 'string') {
            let Ctor
            // 获取标签名的命名空间
            ns = config.getTagNamespace(tag)

            // 判断是否为保留标签
            if (config.isReservedTag(tag)) {
                // 如果是保留标签,就创建一个这样的vnode
                vnode = new VNode(
                    config.parsePlatformTagName(tag), data, children,
                    undefined, undefined, context
                )

                // 如果不是保留标签，那么我们将尝试从vm的components上查找是否有这个标签的定义
            } else if ((Ctor = resolveAsset(context.$options, 'components', tag))) {
                // 如果找到了这个标签的定义，就以此创建虚拟组件节点
                vnode = createComponent(Ctor, data, context, children, tag)
            } else {
                // 兜底方案，正常创建一个vnode
                vnode = new VNode(
                    tag, data, children,
                    undefined, undefined, context
                )
            }

        // 当tag不是字符串的时候，我们认为tag是组件的构造类
        // 所以直接创建
        } else {
            vnode = createComponent(tag, data, context, children)
        }

        // 如果有vnode
        if (vnode) {
            // 如果有namespace，就应用下namespace，然后返回vnode
            if (ns) applyNS(vnode, ns)
            return vnode
        // 否则，返回一个空节点
        } else {
            return createEmptyVNode()
        }
    }
}
```

Vue 渲染中, 核心关键的几步是:

- `new Vue`, 执行初始化
- 挂载`$mount`, 通过自定义`render`方法, `template`, `el`等生成`render`渲染函数
- 通过`Watcher`监听数据的变化
- 当数据发生变化时, `render`函数执行生成 VNode 对象
- 通过`patch`方法, 对比新旧 VNode 对象, 通过`DOM Diff`算法, 添加/修改/删除真正的 DOM 元素

至此, 整个`new Vue`渲染过程完成.

#### render 函数触发过程

[第一次挂载和每次数据更新都会触发 render 函数](https://www.zhihu.com/question/406811368)

在 vue 内部的$mount方法里（$mount 为 Vue 处理 mount 相关的方法），调用了 mountComponent 方法

在 mountComponent 内，可以发现两点：

**1.定义了 updateComponent 函数**，updateComponent 调用了 vm.\_render()。vm.\_render()内会调用 this.$options.render。

2.**将 updateComponent 函数传给实例化的 Watcher。**

传给了 watcher 之后，只要有任何数据等变化，那么 watcher 就会调用 updateComponent 函数，之后 render 就会被调用。

### 23.new Vue 发生了什么

[原理](https://juejin.cn/post/6997776616294187015)

![5f17cedf4e974df89fb807ff961ae00b](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs75EQRtOALMcUkC2.png)

#### 初始化及挂载

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsGtsq3B1RCFEcgAT.png)

在 `new Vue()` 之后。 Vue 会调用 `_init` 函数进行初始化，也就是这里的 `init` 过程，它会初始化生命周期、事件、 props、 methods、 data、 computed 与 watch 等。其中最重要的是通过 `Object.defineProperty` 设置 `setter` 与 `getter` 函数，用来实现「**响应式**」以及「**依赖收集**」，后面会详细讲到，这里只要有一个印象即可。

初始化之后调用 `$mount` 会挂载组件，如果是运行时编译，即不存在 render function 但是存在 template 的情况，需要进行「**编译**」步骤。

```js
new Vue({
  el: "#app",
  store,
  router,
  render: (h) => h(App),
});
```

new Vue()是创建 Vue 实例，而 Vue 是一个类，当执行 new Vue()的时候，它的内部主要是执行了一个`_init`私有函数

```jsx
// 从源码可以看到vue类中非常干净，只是执行了一个_init私有函数, 并且只能通过new关键字初始化
function Vue(options) {
  if (process.env.NODE_ENV !== "production" && !(this instanceof Vue)) {
    warn("Vue is a constructor and should be called with the `new` keyword");
  }
  this._init(options);
}
```

看下 `_init`私有函数内部，这个函数主要是做了一堆初始化工作，比如对 options 进行合并，初始化生命周期，初始化事件中心，初始化渲染，初始化 data,props,computed,watcher 等，最后调用 vm.$mount 做挂载

```tsx
export function initMixin(Vue: Class<Component>) {
  Vue.prototype._init = function (options?: Object) {
    const vm: Component = this;
    // a uid
    vm._uid = uid++;

    let startTag, endTag;
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== "production" && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`;
      endTag = `vue-perf-end:${vm._uid}`;
      mark(startTag);
    }

    // a flag to avoid this being observed
    vm._isVue = true;
    // merge options
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options);
    } else {
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      );
    }
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== "production") {
      initProxy(vm);
    } else {
      vm._renderProxy = vm;
    }
    // expose real self
    vm._self = vm;
    initLifecycle(vm);
    initEvents(vm);
    initRender(vm);
    callHook(vm, "beforeCreate");
    initInjections(vm); // resolve injections before data/props
    initState(vm);
    initProvide(vm); // resolve provide after data/props
    callHook(vm, "created");

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== "production" && config.performance && mark) {
      vm._name = formatComponentName(vm, false);
      mark(endTag);
      measure(`vue ${vm._name} init`, startTag, endTag);
    }

    if (vm.$options.el) {
      vm.$mount(vm.$options.el);
    }
  };
}
```

#### 编译

compile 编译可以分成 `parse`、`optimize` 与 `generate` 三个阶段，最终需要得到 render function。

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgstoyDrG7Fz8IH5Mh.png)

##### parse

`parse` 会用正则等方式解析 template 模板中的指令、class、style 等数据，形成 AST。

##### optimize

`optimize` 的主要作用是标记 static 静态节点，这是 Vue 在编译过程中的一处优化，后面当 `update` 更新界面时，会有一个 `patch` 的过程， diff 算法会直接跳过静态节点，从而减少了比较的过程，优化了 `patch` 的性能。

##### generate

`generate` 是将 AST 转化成 render function 字符串的过程，得到结果是 render 的字符串以及 staticRenderFns 字符串。

在经历过 `parse`、`optimize` 与 `generate` 这三个阶段以后，组件中就会存在渲染 VNode 所需的 render function 了。

#### 响应式

接下来也就是 Vue.js 响应式核心部分。

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsHNEGnT9c3Qqoz2F.png)

这里的 `getter` 跟 `setter` 已经在之前介绍过了，在 `init` 的时候通过 `Object.defineProperty` 进行了绑定，它使得当被设置的对象被读取的时候会执行 `getter` 函数，而在当被赋值的时候会执行 `setter` 函数。

当 render function 被渲染的时候，因为会读取所需对象的值，所以会触发 `getter` 函数进行「**依赖收集**」，「**依赖收集**」的目的是将观察者 Watcher 对象存放到当前闭包中的订阅者 Dep 的 subs 中。形成如下所示的这样一个关系。

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgssxMCPi7qQw2ApmV.png)

在修改对象的值的时候，会触发对应的 `setter`， `setter` 通知之前「**依赖收集**」得到的 Dep 中的每一个 Watcher，告诉它们自己的值改变了，需要重新渲染视图。这时候这些 Watcher 就会开始调用 `update` 来更新视图，当然这中间还有一个 `patch` 的过程以及使用队列来异步更新的策略，这个我们后面再讲。

#### Virtual DOM

我们知道，render function 会被转化成 VNode 节点。Virtual DOM 其实就是一棵以 JavaScript 对象（ VNode 节点）作为基础的树，用对象属性来描述节点，实际上它只是一层对真实 DOM 的抽象。最终可以通过一系列操作使这棵树映射到真实环境上。由于 Virtual DOM 是以 JavaScript 对象为基础而不依赖真实平台环境，所以使它具有了跨平台的能力，比如说浏览器平台、Weex、Node 等。

比如说下面这样一个例子：

```
{
    tag: 'div',                 /*说明这是一个div标签*/
    children: [                 /*存放该标签的子节点*/
        {
            tag: 'a',           /*说明这是一个a标签*/
            text: 'click me'    /*标签的内容*/
        }
    ]
}
```

渲染后可以得到

```
<div>
    <a>click me</a>
</div>
```

这只是一个简单的例子，实际上的节点有更多的属性来标志节点，比如 isStatic （代表是否为静态节点）、 isComment （代表是否为注释节点）等。

#### 更新视图

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsAn3LVpCH1BESxjO.png)

前面我们说到，在修改一个对象值的时候，会通过 `setter -> Watcher -> update` 的流程来修改对应的视图，那么最终是如何更新视图的呢？

当数据变化后，执行 render function 就可以得到一个新的 VNode 节点，我们如果想要得到新的视图，最简单粗暴的方法就是直接解析这个新的 VNode 节点，然后用 `innerHTML` 直接全部渲染到真实 DOM 中。但是其实我们只对其中的一小块内容进行了修改，这样做似乎有些「**浪费**」。

那么我们为什么不能只修改那些「改变了的地方」呢？这个时候就要介绍我们的「**`patch`**」了。我们会将新的 VNode 与旧的 VNode 一起传入 `patch` 进行比较，经过 diff 算法得出它们的「**差异**」。最后我们只需要将这些「**差异**」的对应 DOM 进行修改即可。

#### 再看全局

<img src="https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsULjhe4DXv16xNl8.png" alt="img" />

### 24.vue 性能优化

#### 编码优化

##### 避免响应所有数据

不要将所有的数据都放到`data`中，`data`中的数据都会增加`getter`和`setter`，并且会收集`watcher`，这样还占内存，不需要响应式的数据我们可以直接定义在实例上。

```html
<template>
  <view> </view>
</template>

<script>
  export default {
    components: {},
    data: () => ({}),
    beforeCreate: function () {
      this.timer = null;
    },
  };
</script>

<style scoped></style>Copy to clipboardErrorCopied
```

##### 函数式组件

函数组是一个不包含状态和实例的组件，简单的说，就是组件不支持响应式，并且不能通过`this`关键字引用自己。因为函数式组件没有状态，所以它们不需要像`Vue`的响应式系统一样需要经过额外的初始化，这样就可以避免相关操作带来的性能消耗。当然函数式组件仍然会对相应的变化做出响应式改变，比如新传入新的`props`，但是在组件本身中，它无法知道数据何时发生了更改，因为它不维护自己的状态。很多场景非常适合使用函数式组件：

- 一个简单的展示组件，也就是所谓的`dumb`组件。例如`buttons`、`pills`、`tags`、`cards`等，甚至整个页面都是静态文本，比如`About`页面。
- 高阶组件，即用于接收一个组件作为参数，返回一个被包装过的组件。
- `v-for`循环中的每项通常都是很好的候选项。

##### 区分 computed 和 watch 使用场景

`computed`是计算属性，依赖其它属性值，并且`computed`的值有缓存，只有它依赖的属性值发生改变，下一次获取`computed`的值时才会重新计算`computed`的值。
`watch`更多的是观察的作用，类似于某些数据的监听回调，每当监听的数据变化时都会执行回调进行后续操作。
当我们需要进行数值计算，并且依赖于其它数据时，应该使用`computed`，因为可以利用`computed`的缓存特性，避免每次获取值时，都要重新计算。当我们需要在数据变化时执行异步或开销较大的操作时，应该使用`watch`，使用`watch`选项允许我们执行异步操作，限制我们执行该操作的频率，并在我们得到最终结果前，设置中间状态。

##### v-for 添加 key 且避免同时使用 v-if

- `v-for`遍历必须为`item`添加`key`，且尽量不要使用`index`而要使用唯一`id`去标识`item`，在列表数据进行遍历渲染时，设置唯一`key`值方便`Vue.js`内部机制精准找到该条列表数据，当`state`更新时，新的状态值和旧的状态值对比，较快地定位到`diff`。
- `v-for`遍历避免同时使用`v-if`，`v-for`比`v-if`优先级高，如果每一次都需要遍历整个数组，将会影响速度。

##### 区分 v-if 与 v-show 使用场景

- 实现方式: `v-if`是动态的向`DOM`树内添加或者删除`DOM`元素，`v-show`是通过设置`DOM`元素的`display`样式属性控制显隐。
- 编译过程: `v-if`切换有一个局部编译卸载的过程，切换过程中合适地销毁和重建内部的事件监听和子组件，`v-show`只是简单的基于`CSS`切换。
- 编译条件: `v-if`是惰性的，如果初始条件为假，则什么也不做，只有在条件第一次变为真时才开始局部编译， `v-show`是在任何条件下都被编译，然后被缓存，而且`DOM`元素保留。
- 性能消耗: `v-if`有更高的切换消耗，`v-show`有更高的初始渲染消耗。
- 使用场景: `v-if`适合条件不太可能改变的情况，`v-show`适合条件频繁切换的情况。

##### 长列表性能优化

`Vue`会通过`Object.defineProperty`对数据进行劫持，来实现视图响应数据的变化，然而有些时候我们的组件就是纯粹的数据展示，不会有任何改变，我们就不需要`Vue`来劫持我们的数据，在大量数据展示的情况下，这能够很明显的减少组件初始化的时间，可以通过`Object.freeze`方法来冻结一个对象，一旦被冻结的对象就再也不能被修改了。对于需要修改的长列表的优化大列表两个核心，一个分段一个区分，具体执行分为：仅渲染视窗可见的数据、进行函数节流、 减少驻留的`VNode`和`Vue`组件，不使用显示的子组件`slot`方式，改为手动创建虚拟`DOM`来切断对象引用。

```javascript
export default {
  data: () => ({
      users: {}
  }),
  async created() {
      const users = await axios.get("/api/users");
      this.users = Object.freeze(users);
  }
};Copy to clipboardErrorCopied
```

##### 路由懒加载

`Vue`是单页面应用，可能会有很多的路由引入，这样使用`webpcak`打包后的文件很大，当进入首页时，加载的资源过多，页面会出现白屏的情况，不利于用户体验。如果我们能把不同路由对应的组件分割成不同的代码块，然后当路由被访问的时候才加载对应的组件，这样就更加高效。对于`Vue`路由懒加载的方式有`Vue`异步组件、动态`import`、`webpack`提供的`require.ensure`，最常用的就是动态`import`的方式。

```javascript
{
  path: "/example",
  name: "example",
  //打包后，每个组件单独生成一个chunk文件
  component: () => import("@/views/example.vue")
}Copy to clipboardErrorCopied
```

##### 服务端渲染 SSR

如果需要优化首屏加载速度并且首屏加载速度是至关重要的点，那么就需要服务端渲染`SSR`，服务端渲染`SSR`其实是优缺点并行的，需要合理决定是否真的需要服务端渲染。

##### 优点

- 更好的`SEO`，由于搜索引擎爬虫抓取工具可以直接查看完全渲染的页面，如果`SEO`对站点至关重要，而页面又是异步获取内容，则可能需要服务器端渲染`SSR`解决此问题。
- 更快的内容到达时间`time-to-content`，特别是对于缓慢的网络情况或运行缓慢的设备，无需等待所有的`JavaScript`都完成下载并执行，用户将会更快速地看到完整渲染的页面，通常可以产生更好的用户体验，并且对于那些内容到达时间`time-to-content`与转化率直接相关的应用程序而言，服务器端渲染`SSR`至关重要。

##### 缺点

- 开发条件所限，浏览器特定的代码，只能在某些生命周期钩子函数`lifecycle hook`中使用，一些外部扩展库`external library`可能需要特殊处理，才能在服务器渲染应用程序中运行。
- 涉及构建设置和部署的更多要求，与可以部署在任何静态文件服务器上的完全静态单页面应用程序`SPA`不同，服务器渲染应用程序，通常需要处于`Node.js server`运行环境。
- 更大的服务器端负载，在`Node.js`中渲染完整的应用程序，显然会比仅仅提供静态文件的`server`更加大量占用`CPU`资源`CPU-intensive`-`CPU`密集型，因此如果预料在高流量环境`high traffic`下使用，需要准备相应的服务器负载，并明智地采用缓存策略。

##### 使用 keep-alive 组件

当在组件之间切换的时候，有时会想保持这些组件的状态，以避免反复重渲染导致的性能等问题，使用`<keep-alive>`包裹动态组件时，会缓存不活动的组件实例，而不是销毁它们。重新创建动态组件的行为通常是非常有用的，但是在有些情况下我们更希望那些标签的组件实例能够被在它们第一次被创建的时候缓存下来，此时使用`<keep-alive>`包裹组件即可缓存当前组件实例，将组件缓存到内存，用于保留组件状态或避免重新渲染，和`<transition>`相似它，其自身不会渲染一个`DOM`元素，也不会出现在组件的父组件链中。

```html
<keep-alive>
  <component v-bind:is="currentComponent" class="tab"></component> </keep-alive
>Copy to clipboardErrorCopied
```

#### 打包优化

##### 模板预编译

当使用`DOM`内模板或`JavaScript`内的字符串模板时，模板会在运行时被编译为渲染函数，通常情况下这个过程已经足够快了，但对性能敏感的应用还是最好避免这种用法。预编译模板最简单的方式就是使用单文件组件——相关的构建设置会自动把预编译处理好，所以构建好的代码已经包含了编译出来的渲染函数而不是原始的模板字符串。如果使用`webpack`，并且喜欢分离`JavaScript`和模板文件，可以使用`vue-template-loader`，其可以在构建过程中把模板文件转换成为`JavaScript`渲染函数。

##### SourceMap

在项目进行打包后，会将开发中的多个文件代码打包到一个文件中，并且经过压缩、去掉多余的空格、`babel`编译化后，最终将编译得到的代码会用于线上环境，那么这样处理后的代码和源代码会有很大的差别，当有`bug`的时候，我们只能定位到压缩处理后的代码位置，无法定位到开发环境中的代码，对于开发来说不好调式定位问题，因此`sourceMap`出现了，它就是为了解决不好调式代码问题的，在线上环境则需要关闭`sourceMap`。

##### 配置 splitChunksPlugins

`Webpack`内置了专门用于提取多个`Chunk`中的公共部分的插件`CommonsChunkPlugin`，是用于提取公共代码的工具，`CommonsChunkPlugin`于`4.0`及以后被移除，使用`SplitChunksPlugin`替代。

##### 使用 treeShaking

`tree shaking`是一个术语，通常用于描述移除`JavaScript`上下文中的未引用代码`dead-code`，其依赖于`ES2015`模块系统中的静态结构特性，例如`import`和`export`，这个术语和概念实际上是兴起于`ES2015`模块打包工具`rollup`。

##### 第三方插件的按需引入

我们在项目中经常会需要引入第三方插件，如果我们直接引入整个插件，会导致项目的体积太大，我们可以借助`babel-plugin-component`，然后可以只引入需要的组件，以达到减小项目体积的目的，以项目中引入`element-ui`组件库为例。

```js
{
  "presets": [["es2015", { "modules": false }]],
  "plugins": [
    [
      "component",
      {
        "libraryName": "element-ui",
        "styleLibraryName": "theme-chalk"
      }
    ]
  ]
}
Copy to clipboardErrorCopied
import Vue from 'vue';
import { Button, Select } from 'element-ui';

Vue.use(Button)
Vue.use(Select)
```

### 25.vue 首屏性能优化组件

简单实现一个`Vue`首屏性能优化组件，现代化浏览器提供了很多新接口，在不考虑`IE`兼容性的情况下，这些接口可以很大程度上减少编写代码的工作量以及做一些性能优化方面的事情，当然为了考虑`IE`我们也可以在封装组件的时候为其兜底，本文的首屏性能优化组件主要是使用`IntersectionObserver`以及`requestIdleCallback`两个接口。

#### 描述

先考虑首屏场景，当做一个主要为展示用的首屏时，通常会加载较多的资源例如图片等，如果我们不想在用户打开时就加载所有资源，而是希望用户滚动到相关位置时再加载组件，此时就可以选择`IntersectionObserver`这个接口，当然也可以使用`onscroll`事件去做一个监听，只不过这样性能可能比较差一些。还有一些组件，我们希望他必须要加载，但是又不希望他在初始化页面时同步加载，这样我们可以使用异步的方式比如`Promise`和`setTimeout`等，但是如果想再降低这个组件加载的优先级，我们就可以考虑`requestIdleCallback`这个接口，相关代码在`https://github.com/WindrunnerMax/webpack-simple-environment`的`vue--first-screen-optimization`分支。

##### IntersectionObserver

`IntersectionObserver`接口，从属于`Intersection Observer API`，提供了一种异步观察目标元素与其祖先元素或顶级文档视窗`viewport`交叉状态的方法，祖先元素与视窗`viewport`被称为根`root`，也就是说`IntersectionObserver API`，可以自动观察元素是否可见，由于可见`visible`的本质是，目标元素与视口产生一个交叉区，所以这个`API`叫做交叉观察器，兼容性`https://caniuse.com/?search=IntersectionObserver`。

```javascript
const io = new IntersectionObserver(callback, option);

// 开始观察
io.observe(document.getElementById("example"));
// 停止观察
io.unobserve(element);
// 关闭观察器
io.disconnect();Copy to clipboardErrorCopied
```

- 参数`callback`，创建一个新的`IntersectionObserver`对象后，当其监听到目标元素的可见部分穿过了一个或多个阈`thresholds`时，会执行指定的回调函数。

- 参数

  ```
  option
  ```

  ，

  ```
  IntersectionObserver
  ```

  构造函数的第二个参数是一个配置对象，其可以设置以下属性:

  - `threshold`属性决定了什么时候触发回调函数，它是一个数组，每个成员都是一个门槛值，默认为`[0]`，即交叉比例`intersectionRatio`达到`0`时触发回调函数，用户可以自定义这个数组，比如`[0, 0.25, 0.5, 0.75, 1]`就表示当目标元素`0%`、`25%`、`50%`、`75%`、`100%`可见时，会触发回调函数。
  - `root`属性指定了目标元素所在的容器节点即根元素，目标元素不仅会随着窗口滚动，还会在容器里面滚动，比如在`iframe`窗口里滚动，这样就需要设置`root`属性，注意，容器元素必须是目标元素的祖先节点。
  - `rootMargin`属性定义根元素的`margin`，用来扩展或缩小`rootBounds`这个矩形的大小，从而影响`intersectionRect`交叉区域的大小，它使用`CSS`的定义方法，比如`10px 20px 30px 40px`，表示`top`、`right`、`bottom`和`left`四个方向的值。

- 属性`IntersectionObserver.root`只读，所监听对象的具体祖先元素`element`，如果未传入值或值为`null`，则默认使用顶级文档的视窗。

- 属性`IntersectionObserver.rootMargin`只读，计算交叉时添加到根`root`边界盒`bounding box`的矩形偏移量，可以有效的缩小或扩大根的判定范围从而满足计算需要，此属性返回的值可能与调用构造函数时指定的值不同，因此可能需要更改该值，以匹配内部要求，所有的偏移量均可用像素`pixel`、`px`或百分比`percentage`、`%`来表达，默认值为`0px 0px 0px 0px`。

- 属性`IntersectionObserver.thresholds`只读，一个包含阈值的列表，按升序排列，列表中的每个阈值都是监听对象的交叉区域与边界区域的比率，当监听对象的任何阈值被越过时，都会生成一个通知`Notification`，如果构造器未传入值，则默认值为`0`。

- 方法`IntersectionObserver.disconnect()`，使`IntersectionObserver`对象停止监听工作。

- 方法`IntersectionObserver.observe()`，使`IntersectionObserver`开始监听一个目标元素。

- 方法`IntersectionObserver.takeRecords()`，返回所有观察目标的`IntersectionObserverEntry`对象数组。

- 方法`IntersectionObserver.unobserve()`，使`IntersectionObserver`停止监听特定目标元素。

此外当执行`callback`函数时，会传递一个`IntersectionObserverEntry`对象参数，其提供的信息如下。

- `time:`可见性发生变化的时间，是一个高精度时间戳，单位为毫秒。
- `target:`被观察的目标元素，是一个`DOM`节点对象。
- `rootBounds:`根元素的矩形区域的信息，是`getBoundingClientRect`方法的返回值，如果没有根元素即直接相对于视口滚动，则返回`null`。
- `boundingClientRect:`目标元素的矩形区域的信息。
- `intersectionRect:`目标元素与视口或根元素的交叉区域的信息。
- `intersectionRatio:`目标元素的可见比例，即`intersectionRect`占`boundingClientRect`的比例，完全可见时为`1`，完全不可见时小于等于`0`。

```
{
  time: 3893.92,
  rootBounds: ClientRect {
    bottom: 920,
    height: 1024,
    left: 0,
    right: 1024,
    top: 0,
    width: 920
  },
  boundingClientRect: ClientRect {
     // ...
  },
  intersectionRect: ClientRect {
    // ...
  },
  intersectionRatio: 0.54,
  target: element
}Copy to clipboardErrorCopied
```

##### requestIdleCallback

`requestIdleCallback`方法能够接受一个函数，这个函数将在浏览器空闲时期被调用，这使开发者能够在主事件循环上执行后台和低优先级工作，而不会影响延迟关键事件，如动画和输入响应，函数一般会按先进先调用的顺序执行，如果回调函数指定了执行超时时间`timeout`，则有可能为了在超时前执行函数而打乱执行顺序，兼容性`https://caniuse.com/?search=requestIdleCallback`。

```javascript
const handle = window.requestIdleCallback(callback[, options]);Copy to clipboardErrorCopied
```

- `requestIdleCallback`方法返回一个`ID`，可以把它传入`window.cancelIdleCallback()`方法来结束回调。

- 参数`callback`，一个在事件循环空闲时即将被调用的函数的引用，函数会接收到一个名为`IdleDeadline`的参数，这个参数可以获取当前空闲时间以及回调是否在超时时间前已经执行的状态。

- 参数

  ```
  options
  ```

  可选，包括可选的配置参数，具有如下属性:

  - `timeout`: 如果指定了`timeout`，并且有一个正值，而回调在`timeout`毫秒过后还没有被调用，那么回调任务将放入事件循环中排队，即使这样做有可能对性能产生负面影响。

#### 实现

实际上编写组件主要是搞清楚如何使用这两个主要的`API`就好，首先关注`IntersectionObserver`，因为考虑需要使用动态组件`<component />`，那么我们向其传值的时候就需要使用异步加载组件`() => import("component")`的形式。监听的时候，可以考虑加载完成之后即销毁监听器，或者离开视觉区域后就将其销毁等，这方面主要是策略问题。在页面销毁的时候就必须将`Intersection Observer`进行`disconnect`，防止内存泄漏。另外我们为了使用`IntersectionObserver`则必须需要一个可以观察的目标，如果什么不都渲染，我们就无从观察，所以我们需要引入一个骨架屏，我们可以为真实的组件做一个在尺寸上非常接近真实组件的组件，在这里为了演示只是简单的渲染了`<section />`作为骨架屏。使用`requestIdleCallback`就比较简单了，只需要将回调函数执行即可，同样也类似于`Promise.resolve().then`这种异步处理的情况。
这里是简单的实现逻辑，通常`observer`的使用方案是先使用一个`div`等先进行占位，然后在`observer`监控其占位的容器，当容器在视区时加载相关的组件，相关的代码在`https://github.com/WindrunnerMax/webpack-simple-environment`的`vue--first-screen-optimization`分支，请尽量使用`yarn`进行安装，可以使用`yarn.lock`文件锁住版本，避免依赖问题。使用`npm run dev`运行之后可以在`Console`中看到这四个懒加载组件`created`创建的顺序，其中`A`的`observer`懒加载是需要等其加载页面渲染完成之后，判断在可视区，才进行加载，首屏使能够直接看到的，而`D`的懒加载则是需要将滚动条滑动到`D`的外部容器出现在视图之后才会出现，也就是说只要不滚动到底部是不会加载`D`组件的，另外还可以通过`component-params`和`component-events`将`attrs`和`listeners`传递到懒加载的组件，类似于`$attrs`和`$listeners`，至此懒加载组件已简单实现。

```html
<!-- App.vue -->
<template>
  <div>
    <section>1</section>
    <section>
      <div>2</div>
      <lazy-load
        :lazy-component="Example"
        type="observer"
        :component-params="{ content: 'Example A' }"
        :component-events="{
                    'test-event': testEvent,
                }"
      ></lazy-load>
    </section>
    <section>
      <div>3</div>
      <lazy-load
        :lazy-component="Example"
        type="idle"
        :component-params="{ content: 'Example B' }"
        :component-events="{
                    'test-event': testEvent,
                }"
      ></lazy-load>
    </section>
    <section>
      <div>4</div>
      <lazy-load
        :lazy-component="Example"
        type="lazy"
        :component-params="{ content: 'Example C' }"
        :component-events="{
                    'test-event': testEvent,
                }"
      ></lazy-load>
    </section>
    <section>
      <div>5</div>
      <lazy-load
        :lazy-component="Example"
        type="observer"
        :component-params="{ content: 'Example D' }"
        :component-events="{
                    'test-event': testEvent,
                }"
      ></lazy-load>
    </section>
  </div>
</template>

<script lang="ts">
  import { Component, Vue } from "vue-property-decorator";
  import LazyLoad from "./components/lazy-load/lazy-load.vue";
  @Component({
    components: { LazyLoad },
  })
  export default class App extends Vue {
    protected Example = () => import("./components/example/example.vue");

    protected testEvent(content: string) {
      console.log(content);
    }
  }
</script>

<style lang="scss">
  @import "./common/styles.scss";
  body {
    padding: 0;
    margin: 0;
  }
  section {
    margin: 20px 0;
    color: #fff;
    height: 500px;
    background: $color-blue;
  }</style
>Copy to clipboardErrorCopied
<!-- lazy-load.vue -->
<template>
  <div>
    <component
      :is="renderComponent"
      v-bind="componentParams"
      v-on="componentEvents"
    ></component>
  </div>
</template>

<script lang="ts">
  import { Component, Prop, Vue } from "vue-property-decorator";
  @Component
  export default class LazyLoad extends Vue {
    @Prop({ type: Function, required: true })
    lazyComponent!: () => Vue;
    @Prop({ type: String, required: true })
    type!: "observer" | "idle" | "lazy";
    @Prop({ type: Object, default: () => ({}) })
    componentParams!: Record<string, unknown>;
    @Prop({ type: Object, default: () => ({}) })
    componentEvents!: Record<string, unknown>;

    protected observer: IntersectionObserver | null = null;
    protected renderComponent: (() => Vue) | null = null;

    protected mounted() {
      this.init();
    }

    private init() {
      if (this.type === "observer") {
        // 存在`window.IntersectionObserver`
        if (window.IntersectionObserver) {
          this.observer = new IntersectionObserver((entries) => {
            entries.forEach((item) => {
              // `intersectionRatio`为目标元素的可见比例，大于`0`代表可见
              // 在这里也有实现策略问题 例如加载后不解除`observe`而在不可见时销毁等
              if (item.intersectionRatio > 0) {
                this.loadComponent();
                // 加载完成后将其解除`observe`
                this.observer?.unobserve(item.target);
              }
            });
          });
          this.observer.observe(this.$el.parentElement || this.$el);
        } else {
          // 直接加载
          this.loadComponent();
        }
      } else if (this.type === "idle") {
        // 存在`requestIdleCallback`
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (window.requestIdleCallback) {
          requestIdleCallback(this.loadComponent, { timeout: 3 });
        } else {
          // 直接加载
          this.loadComponent();
        }
      } else if (this.type === "lazy") {
        // 存在`Promise`
        if (window.Promise) {
          Promise.resolve().then(this.loadComponent);
        } else {
          // 降级使用`setTimeout`
          setTimeout(this.loadComponent);
        }
      } else {
        throw new Error(`type: "observer" | "idle" | "lazy"`);
      }
    }

    private loadComponent() {
      this.renderComponent = this.lazyComponent;
      this.$emit("loaded");
    }

    protected destroyed() {
      this.observer && this.observer.disconnect();
    }
  }
</script>
```

### 26.vue 的双向绑定和单向数据流冲突吗？

`Vue`中更加推荐单向数据流的状态管理模式(比如`Vuex`)，但`Vue`同时支持通过`v-model`实现双向数据绑定。

#### props 传递问题

不管是 react 还是 vue，父级组件与子组件的通信都是通过 props 来实现的，在 vue 中父组件的 props 遵循的是单向数据流，用官方的话说就是，父级的 props 的更新会向下流动到子组件中，反之则不行。也就是说，子组件不应该去修改 props。但实际开发过程中，可能会有一些情况试图去修改 props 数据：

1、这个 props 只是传递一个初始值，子组件把它当做一个局部变量来使用，这种情况一般定义一个本地的 data 属性，将 props 的值赋值给它。如下：

```js
props: [ 'initialCounter' ],
data: function () {
   return  {
     counter:  this .initialCounter
   }
}
```

2、这个 props 的值以原始数据传入，但是子组件对其需要转换。这种情况，最好使用 computed 来定义一个计算属性，如下：

```js
props: ['size'],
computed: {
  normalizedSize: function () {
    return this.size.trim().toLowerCase()
  }
}
```

以上两种情况，传递的值都是基本数据类型，但是大多数情况下，我们需要向子组件传递一个引用类型数据，那么问题就来了

JavaScript 中对象和数组是通过引用传入的，所以对于一个数组或对象类型的 prop 来说，在子组件中改变这个对象或数组本身将会影响到父组件的状态。

比如，在父组件中有一个列表，双击其中一个元素进行编辑，该元素的数据作为 props 传递给一个子组件，在子组件中需要对该数据进行编辑，你会发现如上所说，编辑后父组件的值也发生了变化。**实际上我们想父组件影响子组件，但是子组件修改不要影响父组件**

对于仅仅是复制了引用（地址），换句话说，复制了之后，原来的变量和新的变量指向同一个东西，彼此之间的操作会互相影响，为 **浅拷贝**。

而如果是在堆中重新分配内存，拥有不同的地址，但是值是一样的，复制后的对象与原来的对象是完全隔离，互不影响，为 **深拷贝**。

所以 props 的传递应该是浅拷贝

虽然通过拷贝 props 数据解决了问题，但是拷贝后修改新数据的属性并不会触发 vue 的更新机制，需要强制更新$forceUpdate()

#### 单向绑定 `vs` 双向绑定

单双向绑定，指的是`View`层和`Model`层之间的映射关系。
`react`采取单向绑定

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsnyXa5egWtK1iG8A.webp)

在`React`中，当`View`层发生更改时，用户通过发出`Actions`进行处理，`Actions`中通过`setState`对`State`进行更新，`State`更新后触发`View`更新。可以看出，`View`层不能直接修改`State`，必须要通过`Actions`来进行操作，这样更加清晰可控

单向绑定的方式的优点在于清晰可控，缺点则在于会有一些模板代码，`Vue`则同时支持单向绑定和双向绑定

- 单向绑定：插值形式`{{data}}`，`v-bind`也是单向绑定
- 双向绑定：表单的`v-model`，用户对`View`层的更改会直接同步到`Model`层

实际上`v-model`只是`v-bind:value` 和 `v-on:input`的语法糖，我们也可以采取类似`react`的单向绑定。两者各有利弊，单向绑定清晰可控，但是模板代码过多，双向绑定可以简化开发，但是也会导致数据变化不透明，优缺点共存，大家可以根据情况使用。

#### 单向数据流 `vs` 双向数据流

数据流指的是组件之间的数据流动。
`Vue`与`React`都是单向数据流的模型，虽然`vue`有双向绑定`v-model`，但是`vue`和`react`父子组件之间数据传递，仍然还是遵循单向数据流的，父组件可以向子组件传递`props`，但是子组件不能修改父组件传递来的`props`，子组件只能通过事件通知父组件进行数据更改

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsOcgMQGnyUfeXZbd.webp)

通过单向数据流的模型，所有状态的改变可记录、可跟踪，相比于双向数据流可加容易维护与定位问题

#### 为什么说`v-model`只是语法糖

> 你可以用 `v-model` 指令在表单 `<input>`、`<textarea>` 及 `<select>` 元素上创建双向数据绑定。它会根据控件类型自动选取正确的方法来更新元素。尽管有些神奇，但 `v-model` 本质上不过是语法糖。它负责监听用户的输入事件以更新数据，并对一些极端场景进行一些特殊处理

正如上面所述，`Vue`文档中说`v-model`只是语法糖

```javascript
<input v-model=“phoneInfo.phone”/>

//在组件中使用时，实际相当于下面的简写
<input :value="PhoneInfo.phone" @input="val => { PhoneInfo.phone = val }"
```

那么问题来了，为什么说`v-model`不是真正的双向数据流呢？按照这道理，是不是可以认为`model->view`的单向数据流也是语法糖啊，也是`vue`作者通过一定方法实现的而已
真正的原因上面已经说了，**数据绑定是`View`与`Model`之间的映射关系，数据流指的是组件之间的数据流动**
`v-model`不是真正的双向数据流，是因为它不能直接修改父组件的值，比如你在`v-model`中绑定`props`中的值是会报错的，它只能绑定组件的值
而真正的双向数据流，比如`AngularJs`，是允许在子组件中直接更新父组件的值的，这就是为什么说`v-model`只是语法糖的原因

#### 总结

总得来说，单双向数据绑定与数据流是两个不同维度的概念，数据绑定是`View`与`Model`之间的映射关系，数据流指的是组件之间的数据流动。因此，单向数据流也可有双向绑定，双向数据流也可以有双向绑定，两者不应该混为一谈

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsq3NVdyOxcBLACDb.webp)

### 27.vue 自定义指令

[vue 中如何自定义指令](https://blog.csdn.net/weixin_58032613/article/details/122759818)

#### 指令使用的几种方式

```js
//会实例化一个指令，但这个指令没有参数
`v-xxx` // -- 将值传到指令中
`v-xxx="value"` // -- 将字符串传入到指令中，如`v-html="'<p>内容</p>'"`
`v-xxx="'string'"` // -- 传参数（`arg`），如`v-bind:class="className"`
`v-xxx:arg="value"` // -- 使用修饰符（`modifier`）
`v-xxx:arg.modifier="value"`;
```

#### 如何自定义指令

注册一个自定义指令有全局注册与局部注册

全局注册注册主要是用过**Vue.directive**方法进行注册

**Vue.directive**第一个参数是**指令的名字**（不需要写上 v-前缀），第二个参数可以是**对象数据**，也可以是一个**指令函数**

```js
// 注册一个全局自定义指令 `v-focus`
Vue.directive("focus", {
  // 当被绑定的元素插入到 DOM 中时……
  inserted: function (el) {
    // 聚焦元素
    el.focus(); // 页面加载完成之后自动让输入框获取到焦点的小功能
  },
});
```

局部注册通过在组件 options 选项中设置 directive 属性 是定义在组件内部的，只能在当前组件中使用

```js
directives: {
  focus: {
    // 指令的定义
    inserted: function (el) {
      el.focus() // 页面加载完成之后自动让输入框获取到焦点的小功能
    }
  }
}
```

然后你可以在模板中任何元素上使用新的 v-focus property，如下：

```js
<input v-focus />
```

**钩子函数**

自定义指令也像组件那样存在钩子函数：

bind：只调用一次，指令第一次绑定到元素时调用。在这里可以进行一次性的初始化设置
inserted：被绑定元素插入父节点时调用 (仅保证父节点存在，但不一定已被插入文档中)
update：所在组件的 VNode 更新时调用，但是可能发生在其子 VNode 更新之前。指令的值可能发生了改变，也可能没有。但是你可以通过比较更新前后的值来忽略不必要的模板更新
componentUpdated：指令所在组件的 VNode 及其子 VNode 全部更新后调用
unbind：只调用一次，指令与元素解绑时调用

所有的钩子函数的参数都有以下：

- el：指令所绑定的元素，可以用来直接操作 DOM
- binding：一个对象，包含以下 property：

`name`：指令名，不包括 v- 前缀。

`value`：指令的绑定值，例如：v-my-directive="1 + 1" 中，绑定值为 2。

`oldValue`：指令绑定的前一个值，仅在 update 和 componentUpdated 钩子中可用。无论值是否改变都可用。

`expression`：字符串形式的指令表达式。例如 v-my-directive="1 + 1" 中，表达式为 "1 + 1"。

`arg`：传给指令的参数，可选。例如 v-my-directive:foo 中，参数为 "foo"。

`modifiers`：一个包含修饰符的对象。例如：v-my-directive.foo.bar 中，修饰符对象为 { foo: true, bar: true }

`vnode`：Vue 编译生成的虚拟节点

`oldVnode`：上一个虚拟节点，仅在 update 和 componentUpdated 钩子中可用

除了 el 之外，其它参数都应该是只读的，切勿进行修改。如果需要在钩子之间共享数据，建议通过元素的 dataset 来进行

```js
<div v-demo="{ color: 'white', text: 'hello!' }"></div>
<script>
    Vue.directive('demo', function (el, binding) {
    console.log(binding.value.color) // "white"
    console.log(binding.value.text)  // "hello!"
    })
</script>
```

#### 批量注册使用

批量注册指令，新建 `directives/index.js` 文件

```js
import copy from "./copy";
import longpress from "./longpress";
// 自定义指令
const directives = {
  copy,
  longpress,
};

export default {
  install(Vue) {
    Object.keys(directives).forEach((key) => {
      Vue.directive(key, directives[key]);
    });
  },
};
```

在 `main.js` 引入并调用

```js
import Vue from "vue";
import Directives from "./JS/directives";
Vue.use(Directives);
```

#### 实现 v-lazyload

背景：在类电商类项目，往往存在大量的图片，如 banner 广告图，菜单导航图，美团等商家列表头图等。图片众多以及图片体积过大往往会影响页面加载速度，造成不良的用户体验，所以进行图片懒加载优化势在必行。

需求：实现一个图片懒加载指令，只加载浏览器可见区域的图片。

思路：

1. 图片懒加载的原理主要是判断当前图片是否到了可视区域这一核心逻辑实现的
2. 拿到所有的图片 Dom ，遍历每个图片判断当前图片是否到了可视区范围内
3. 如果到了就设置图片的 `src` 属性，否则显示默认图片

图片懒加载有两种方式可以实现，一是绑定 `srcoll` 事件进行监听，二是使用 `IntersectionObserver` 判断图片是否到了可视区域，但是有浏览器兼容性问题。

下面封装一个懒加载指令兼容两种方法，判断浏览器是否支持 `IntersectionObserver` API，如果支持就使用 `IntersectionObserver` 实现懒加载，否则则使用 `srcoll` 事件监听 + 节流的方法实现

```js
const LazyLoad = {
  // install方法
  install(Vue, options) {
    const defaultSrc = options.default;
    Vue.directive("lazy", {
      bind(el, binding) {
        LazyLoad.init(el, binding.value, defaultSrc);
      },
      inserted(el) {
        if (IntersectionObserver) {
          LazyLoad.observe(el);
        } else {
          LazyLoad.listenerScroll(el);
        }
      },
    });
  },
  // 初始化
  init(el, val, def) {
    el.setAttribute("data-src", val);
    el.setAttribute("src", def);
  },
  // 利用IntersectionObserver监听el
  observe(el) {
    var io = new IntersectionObserver((entries) => {
      const realSrc = el.dataset.src;
      if (entries[0].isIntersecting) {
        if (realSrc) {
          el.src = realSrc;
          el.removeAttribute("data-src");
        }
      }
    });
    io.observe(el);
  },
  // 监听scroll事件
  listenerScroll(el) {
    const handler = LazyLoad.throttle(LazyLoad.load, 300);
    LazyLoad.load(el);
    window.addEventListener("scroll", () => {
      handler(el);
    });
  },
  // 加载真实图片
  load(el) {
    const windowHeight = document.documentElement.clientHeight;
    const elTop = el.getBoundingClientRect().top;
    const elBtm = el.getBoundingClientRect().bottom;
    const realSrc = el.dataset.src;
    if (elTop - windowHeight < 0 && elBtm > 0) {
      if (realSrc) {
        el.src = realSrc;
        el.removeAttribute("data-src");
      }
    }
  },
  // 节流
  throttle(fn, delay) {
    let timer;
    let prevTime;
    return function (...args) {
      const currTime = Date.now();
      const context = this;
      if (!prevTime) prevTime = currTime;
      clearTimeout(timer);

      if (currTime - prevTime > delay) {
        prevTime = currTime;
        fn.apply(context, args);
        clearTimeout(timer);
        return;
      }

      timer = setTimeout(function () {
        prevTime = Date.now();
        timer = null;
        fn.apply(context, args);
      }, delay);
    };
  },
};

export default LazyLoad;
```

使用，将组件内标签的 `src` 换成 `v-LazyLoad`

```js
<img v-LazyLoad="xxx.jpg" />
```

#### 实现一个 v-debounce

背景：在开发中，有些提交保存按钮有时候会在短时间内被点击多次，这样就会多次重复请求后端接口，造成数据的混乱，比如新增表单的提交按钮，多次点击就会新增多条重复的数据。

需求：防止按钮在短时间内被多次点击，使用防抖函数限制规定时间内只能点击一次。

思路：

1. 定义一个延迟执行的方法，如果在延迟时间内再调用该方法，则重新计算执行时间。
2. 将事件绑定在 click 方法上。

```js
const debounce = {
  inserted: function (el, binding) {
    let timer;
    el.addEventListener("click", () => {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        binding.value();
      }, 1000);
    });
  },
};

export default debounce;
```

使用：给 Dom 加上 `v-debounce` 及回调函数即可

```html
<template>
  <button v-debounce="debounceClick">防抖</button>
</template>

<script>
  export default {
    methods: {
      debounceClick() {
        console.log("只触发一次");
      },
    },
  };
</script>
```

#### 常用案例

- 代码复用和抽象的主要形式是组件。
- 当需要对普通 DOM 元素进行底层操作，此时就会用到自定义指令
- 但是，对于大幅度的 DOM 变动，还是应该使用组件

##### 输入框自动聚焦

```vue
输入框自动聚焦
// 注册一个全局自定义指令 `v-focus`
Vue.directive('focus', {
  // 当被绑定的元素插入到 DOM 中时
  inserted: function (el) {
    // 聚焦元素
    el.focus()
  }
})
//<input v-focus>
```

##### 下拉菜单

点击下拉菜单本身不会隐藏菜单
点击下拉菜单以外的区域隐藏菜单

```js
<script>
Vue.directive('clickoutside', {
  bind(el, binding) {
    function documentHandler(e) {
      if (el.contains(e.target)) {
       return false
      }

      if (binding.expression) {
        binding.value(e)
      }
    }

    el.__vueMenuHandler__ = documentHandler
    document.addEventListener('click', el.__vueMenuHandler__)
  },
  unbind(el) {
    document.removeEventListener('click', el.__vueMenuHandler__)
    delete el.__vueMenuHandler__
  }
})

new Vue({
  el: '#app',
  data: {
    show: false
  },
  methods: {
    handleHide() {
      this.show = false
    }
  }
})
</script>
<div class="main" v-menu="handleHide">
  <button @click="show = !show">点击显示下拉菜单</button>
  <div class="dropdown" v-show="show">
    <div class="item"><a href="#">选项 1</a></div>
    <div class="item"><a href="#">选项 2</a></div>
    <div class="item"><a href="#">选项 3</a></div>
  </div>
</div>

```

##### 相对时间转换

类似微博、朋友圈发布动态后的相对时间，比如刚刚、两分钟前等等

```js
<span v-relativeTime="time"></span>
<script>
new Vue({
  el: '#app',
  data: {
    time: 1565753400000
  }
})

Vue.directive('relativeTime', {
  bind(el, binding) {
    // Time.getFormatTime() 方法，自行补充
    el.innerHTML = Time.getFormatTime(binding.value)
    el.__timeout__ = setInterval(() => {
      el.innerHTML = Time.getFormatTime(binding.value)
    }, 6000)
  },
  unbind(el) {
    clearInterval(el.innerHTML)
    delete el.__timeout__
  }
})
</script>
```

##### 输入框防抖

防抖这种情况设置一个 v-throttle 自定义指令来实现

```js
// 1.设置v-throttle自定义指令
Vue.directive('throttle', {
  bind: (el, binding) => {
    let throttleTime = binding.value; // 防抖时间
    if (!throttleTime) { // 用户若不设置防抖时间，则默认2s
      throttleTime = 2000;
    }
    let cbFun;
    el.addEventListener('click', event => {
      if (!cbFun) { // 第一次执行
        cbFun = setTimeout(() => {
          cbFun = null;
        }, throttleTime);
      } else {
        event && event.stopImmediatePropagation();
      }
    }, true);
  },
});
// 2.为button标签设置v-throttle自定义指令
<button @click="sayHello" v-throttle>提交</button>
```

##### 一键 Copy 的功能

```js
import { Message } from "ant-design-vue";

const vCopy = {
  //
  /*
    bind 钩子函数，第一次绑定时调用，可以在这里做初始化设置
    el: 作用的 dom 对象
    value: 传给指令的值，也就是我们要 copy 的值
  */
  bind(el, { value }) {
    el.$value = value; // 用一个全局属性来存传进来的值，因为这个值在别的钩子函数里还会用到
    el.handler = () => {
      if (!el.$value) {
        // 值为空的时候，给出提示，我这里的提示是用的 ant-design-vue 的提示，你们随意
        Message.warning("无复制内容");
        return;
      }
      // 动态创建 textarea 标签
      const textarea = document.createElement("textarea");
      // 将该 textarea 设为 readonly 防止 iOS 下自动唤起键盘，同时将 textarea 移出可视区域
      textarea.readOnly = "readonly";
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      // 将要 copy 的值赋给 textarea 标签的 value 属性
      textarea.value = el.$value;
      // 将 textarea 插入到 body 中
      document.body.appendChild(textarea);
      // 选中值并复制
      textarea.select();
      // textarea.setSelectionRange(0, textarea.value.length);
      const result = document.execCommand("Copy");
      if (result) {
        Message.success("复制成功");
      }
      document.body.removeChild(textarea);
    };
    // 绑定点击事件，就是所谓的一键 copy 啦
    el.addEventListener("click", el.handler);
  },
  // 当传进来的值更新的时候触发
  componentUpdated(el, { value }) {
    el.$value = value;
  },
  // 指令与元素解绑的时候，移除事件绑定
  unbind(el) {
    el.removeEventListener("click", el.handler);
  },
};

export default vCopy;
```

##### 拖拽

```js
<div ref="a" id="bg" v-drag></div>

  directives: {
    drag: {
      bind() {},
      inserted(el) {
        el.onmousedown = (e) => {
          let x = e.clientX - el.offsetLeft;
          let y = e.clientY - el.offsetTop;
          document.onmousemove = (e) => {
            let xx = e.clientX - x + "px";
            let yy = e.clientY - y + "px";
            el.style.left = xx;
            el.style.top = yy;
          };
          el.onmouseup = (e) => {
            document.onmousemove = null;
          };
        };
      },
    },
  }
```

### 28.vue 中的 vm 和 VueComponent

关于 vm 和 vc,vm 为 Vue 的实例对象，vc 为 VueComponent 的是对象

#### 1、Vue 的实例对象，以后简称 vm。

(1) vm 的隐式原型属性指向 Vue 的原型对象。

(2) VueComponent 的原型对象的隐式原型属性指向 Vue 的原型对象。

#### 2、Vue 解析时会帮我们创建 school 组件的实例对象

我们只需要写`<school></school>`，，
即 Vue 帮我们执行的：new VueComponent(options)

#### 3、**特别注意**：

每次调用 Vue.extend，返回的都是一个全新的 VueComponent

```js
//定义school组件
const school = Vue.extend({
	name: 'school',
	data(){
		name:'ycu',
		address:'学府路576号',
	},
	methods:{}
})
```

在非单文件组件中，组件可以定义多个

#### 4、关于 this 指向

##### 1.组件配置中：

data 函数、methods 中的函数、watch 中的函数、computed 中的函数 它们的 this 均是 VueComponent 实例对象（也就是天禹老师课堂上的 vc，也可称之为组件实例对象）。

###### (1)：VueComponent 的实例对象，我们暂且记为 vc。

![在这里插入图片描述](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs0277b0039eb545ef98c9e58288b88986.png)

###### (2)：Vue 的实例对象 vm

![在这里插入图片描述](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs62b50a8434594125b290afd86fa9b467.png)

##### 2.new Vue(options)配置中：

data 函数、methods 中的函数、watch 中的函数、computed 中的函数 它们的 this 均是 Vue 实例对象。

#### 5、vc 与 vm 的区别：

vm 和 vc 在某种程度上确实有很多相像之处，但又有着本质的区别，vc 差不多像是 vm 的小弟，可以理解为类似生活中的一对双胞胎，一个稍微早出生几分钟的是大哥，也就是 vm，另外一个就是小弟 vc，虽然会很像，但是还是有区别的。

总体上来说，vm 身上有的，vc 基本也有。

data 函数、methods 中的函数、watch 中的函数、computed 中的函数在 vm 和 vc 里边都有，生命周期也都是一样的，以及相同的数据代理模式。

**vc 有的 vm 都有，vm 可以通过 el 决定为哪一个容器服务，但是 vc 是没有 el 的！且 vc 的 data 要写成函数式，在 vm 中的 data 写成对象或者函数都行**

#### 6、Vue 和 VueComponent 的内置关系

VueComponent.prototype.**proto** === Vue.prototype (这里的 proto 前后都是有\_\_的，编辑器误以为是加粗的标识了)

**即构造函数的显示原型属性 === 实例对象的隐式原型属性**

![在这里插入图片描述](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsf76c327ba18b49f391b9cafd498a7d03.png)

### 29.vue 组件化的理解

![在这里插入图片描述](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/Imgs/d8f19e37fa4345db8e20190da1b3f02e.png)
如果要编写一个页面，需要结构（html），样式（css），交互（js）。

1. 如果上图，如果要编写第一个页面，需要 html 文件编写顶部、导航、内容、底部的 html 结构，并且引入渲染顶部、导航、内容、底部的四个 css 文件，最后引入控制顶部、导航、内容、底部交互的四个 js 文件，至此，页面 1 完成。
2. 编写页面 2，顶部、商品列表，底部，编写一个顶部、商品列表，底部结构的 html 文件，编写一个新的控制商品列表样式的 css 文件，并引入已有的顶部和底部的 css 文件，编写一个控制商品列表交互的 js 文件，并引入已有的控制顶部和底部交互的 js 文件，页面 2 编写完成。

但是这样会有一点小问题： 1.为了让 css 和 js 文件达到足够高的复用率，需要把 css 和 js 文件写的粒度比较细，这样会导致有很多的 css 和 js 文件，并且会使得网页的依赖关系变得复杂（一旦所依赖的 css 和 js 文件达到一个数量级），不好维护。 2.代码的复用率不算很高，主要指的是 html 代码的复用，因为像上面两个页面，顶部和底部的 html 代码重复了。

不过总的来说，传统的编程方式还是问题不大的。

介绍完传统的编程方式，再来讲讲 vue 的组件化。
![在这里插入图片描述](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/Imgs/2badabefa02e48968f7748b1a1d9f11f.png)
使用 vue 组件化重新编写刚刚传统编程方式编写的两个页面。

1. 第一个页面包含顶部、内容、导航、底部，这次不再编写 html 文件再引入对应的 css 和 js 文件了，而是编写四个组件，顶部组件、内容组件、导航组件、底部组件，然后直接进行组装，就形成了一个页面 1，组件包含了：html、css、html 以及其他的东西，直接把这些东西封装到一个组件里面，组件就是一个个页面，然后就像搭积木那样搭成我们想要的最终页面。
2. 然后编写第二个页面，直接再编写一个商品列表组件，再将其与之前编写的顶部、底部组件像搭积木那样组装起来就是页面 2 了。

好处：

1.依赖关系不再复杂，之后我们编写前端实际上编写一个个组件，然后将他们进行组装就行，比如我们想要一个页面 3，包含顶部、导航、商品列表，都不用编写代码了，直接创建一个父组件，直接引入 3 个子组件，页面就编写好了。

2.代码高度复用，你可以发现，连相较于传统编程方法，它连 html 代码都复用了。

组件的定义：
组件就是实现应用中局部功能的代码和资源的集合，代码指的是 html、css、js，资源指的是音频、视频、图片等资源。也就是说一个组件就是一个局部功能的所有，注意，是局部功能，组件要划分得足够细才有较高的复用率，比如我编写了一个包含顶部和底部的组件，但是我的同事只要想顶部，那么我的这个组件他就复用不了了，因为他不想要底部，如果引入我的这个组件，就必须要有顶部和底部。

### 30.vue2 this 为什么能够直接获取到 data 和 methods

```js
在平时使用vue来开发项目的时候，对于下面这一段代码，我们可能每天都会见到：

const vm = new Vue({
  data: {
      name: '我是pino',
  },
  methods: {
      print(){
          console.log(this.name);
      }
  },
});
console.log(vm.name); // 我是pino
vm.print(); // 我是pino

但是我们自己实现一个构造函数却实现不了这种效果呢？

function Super(options){}

const p = new Super({
    data: {
        name: 'pino'
    },
    methods: {
        print(){
            console.log(this.name);
        }
    }
});

console.log(p.name); // undefined
p.print(); // p.print is not a function
```

#### 源码

首先可以找到 vue2 的入口文件：

```js
src / core / instance / index;
function Vue(options) {
  if (process.env.NODE_ENV !== "production" && !(this instanceof Vue)) {
    warn("Vue is a constructor and should be called with the `new` keyword");
  }
  this._init(options);
}

// 初始化操作是在这个函数完成的
initMixin(Vue);

stateMixin(Vue);
eventsMixin(Vue);
lifecycleMixin(Vue);
renderMixin(Vue);

export default Vue;
```

接下来看`initMixin`文件中是如何实现的

```js
export function initMixin(Vue: Class<Component>) {
  Vue.prototype._init = function (options?: Object) {
    const vm: Component = this;
    // a uid
    vm._uid = uid++;

    let startTag, endTag;
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== "production" && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`;
      endTag = `vue-perf-end:${vm._uid}`;
      mark(startTag);
    }

    // a flag to avoid this being observed
    vm._isVue = true;
    // merge options
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options);
    } else {
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      );
    }
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== "production") {
      initProxy(vm);
    } else {
      vm._renderProxy = vm;
    }
    // expose real self
    vm._self = vm;
    initLifecycle(vm);
    initEvents(vm);
    initRender(vm);
    callHook(vm, "beforeCreate");
    initInjections(vm); // resolve injections before data/props

    // 初始化data/methods...
    initState(vm);
    initProvide(vm); // resolve provide after data/props
    callHook(vm, "created");
  };
}
```

其实仅仅关注`initState`这个函数就好了，这个函数初始化了`props`, `methods`, `watch`, `computed`

- 使用`initProps`初始化了`props`
- 使用`initMethods`初始化了`methods`
- 使用`initData`初始化了`data`
- 使用`initComputed`初始化了`computed`
- 使用`initWatch`初始化了`watch`

```js
function initState(vm) {
  vm._watchers = [];
  var opts = vm.$options;
  // 判断props属性是否存在，初始化props
  if (opts.props) {
    initProps(vm, opts.props);
  }
  // 有传入 methods，初始化方法methods
  if (opts.methods) {
    initMethods(vm, opts.methods);
  }
  // 有传入 data，初始化 data
  if (opts.data) {
    initData(vm);
  } else {
    observe((vm._data = {}), true /* asRootData */);
  }
  // 初始化computed
  if (opts.computed) {
    initComputed(vm, opts.computed);
  }
  // 初始化watch
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch);
  }
}
```

在这里只关注`initMethods`和`initData`

#### initMethods

```js
function initMethods(vm, methods) {
  var props = vm.$options.props;
  for (var key in methods) {
    {
      // 判断是否为函数
      if (typeof methods[key] !== "function") {
        warn(
          'Method "' +
            key +
            '" has type "' +
            typeof methods[key] +
            '" in the component definition. ' +
            "Did you reference the function correctly?",
          vm
        );
      }

      // 判断props存在且props中是否有同名属性
      if (props && hasOwn(props, key)) {
        warn('Method "' + key + '" has already been defined as a prop.', vm);
      }
      // 判断实例中是否有同名属性，而且是方法名是保留的 _ $ （在JS中一般指内部变量标识）开头
      if (key in vm && isReserved(key)) {
        warn(
          'Method "' +
            key +
            '" conflicts with an existing Vue instance method. ' +
            "Avoid defining component methods that start with _ or $."
        );
      }
    }
    // 将methods中的每一项的this指向绑定至实例
    // bind的作用就是用于绑定指向，作用同js原生的bind
    vm[key] =
      typeof methods[key] !== "function" ? noop : bind(methods[key], vm);
  }
}
```

其实整个`initMethods`方法核心就是将`this`绑定到了实例身上，因为`methods`里面都是函数，所以只需要遍历将所有的函数在调用的时候将`this`指向实例就可以实现通过`this`直接调用的效果。

其他的大部分代码都是用于一些边界条件的判断：

- 如果不为函数 -> 报错
- `props`存在且`props`中是否有同名属性 -> 报错
- 实例中是否有同名属性，而且是方法名是保留的 -> 报错

**bind 函数**

```js
function polyfillBind(fn, ctx) {
  function boundFn(a) {
    var l = arguments.length;
    // 判断参数的个数来分别使用call/apply进行调用
    return l
      ? l > 1
        ? fn.apply(ctx, arguments)
        : fn.call(ctx, a)
      : fn.call(ctx);
  }

  boundFn._length = fn.length;
  return boundFn;
}

function nativeBind(fn, ctx) {
  return fn.bind(ctx);
}
// 判断是否支持原生的bind方法
var bind = Function.prototype.bind ? nativeBind : polyfillBind;
```

`bind`函数中主要是做了兼容性的处理，如果不支持原生的`bind`函数，则根据参数个数的不同分别使用`call/apply`来进行`this`的绑定，而`call/apply`最大的区别就是传入参数的不同，一个分别传入参数，另一个接受一个数组。

**hasOwn** 用于判断是否为对象本身所拥有的对象，上文通过此函数来判断是否在`props`中存在相同的属性

```js
// 只判断是否为本身拥有，不包含原型链查找
var hasOwnProperty = Object.prototype.hasOwnProperty;
function hasOwn(obj, key) {
  return hasOwnProperty.call(obj, key);
}

hasOwn({}, "toString"); // false
hasOwn({ name: "pino" }, "name"); // true
```

**isReserved**

判断是否为内部私有命名（以`$`或`_`开头）

```js
function isReserved(str) {
  var c = (str + "").charCodeAt(0);
  return c === 0x24 || c === 0x5f;
}
isReserved("_data"); // true
isReserved("data"); // false
```

#### initData

```js
function initData(vm) {
  var data = vm.$options.data;
  // 判断data是否为函数，如果是函数，在getData中执行函数
  data = vm._data = typeof data === "function" ? getData(data, vm) : data || {};
  // 判断是否为对象
  if (!isPlainObject(data)) {
    data = {};
    warn(
      "data functions should return an object:\n" +
        "https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function",
      vm
    );
  }
  // proxy data on instance
  // 取值 props/methods/data的值
  var keys = Object.keys(data);
  var props = vm.$options.props;
  var methods = vm.$options.methods;
  var i = keys.length;
  // 判断是否为props/methods存在的属性
  while (i--) {
    var key = keys[i];
    {
      if (methods && hasOwn(methods, key)) {
        warn(
          'Method "' + key + '" has already been defined as a data property.',
          vm
        );
      }
    }
    if (props && hasOwn(props, key)) {
      warn(
        'The data property "' +
          key +
          '" is already declared as a prop. ' +
          "Use prop default value instead.",
        vm
      );
    } else if (!isReserved(key)) {
      // 代理拦截
      proxy(vm, "_data", key);
    }
  }
  // observe data
  // 监听数据
  observe(data, true /* asRootData */);
}
```

**getData**

如果`data`为函数时，调用此函数对`data`进行执行

```js
function getData(data, vm) {
  // #7573 disable dep collection when invoking data getters
  pushTarget();
  try {
    // 将this绑定至实例
    return data.call(vm, vm);
  } catch (e) {
    handleError(e, vm, "data()");
    return {};
  } finally {
    popTarget();
  }
}
```

**proxy**

代理拦截，当使用`this.xxx`访问某个属性时，返回`this.data.xxx`

```js
// 一个纯净函数
function noop(a, b, c) {}

// 代理对象
var sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop,
};

function proxy(target, sourceKey, key) {
  // get拦截
  sharedPropertyDefinition.get = function proxyGetter() {
    return this[sourceKey][key];
  };
  // set拦截
  sharedPropertyDefinition.set = function proxySetter(val) {
    this[sourceKey][key] = val;
  };
  // 使用Object.defineProperty对对象进行拦截
  Object.defineProperty(target, key, sharedPropertyDefinition);
}
```

其实对`data`的处理就是将`data`中的属性的`key`遍历绑定至实例`vm`上，然后使用`Object.defineProperty`进行拦截，将真实的数据操作都转发到`this.data`上。

**Object.defineProperty 对象属性**

```js
value：属性的默认值。
writable：该属性是否可写。
enumerable：该属性是否可被枚举。
configurable：该属性是否可被删除。
set()：该属性的更新操作所调用的函数。
get()：获取属性值时所调用的函数。
```

#### 简略实现

```js
function Person(options) {
  let vm = this;
  vm.$options = options;

  if (options.data) {
    initData(vm);
  }
  if (options.methods) {
    initMethods(vm, options.methods);
  }
}

function initData(vm) {
  let data = (vm._data = vm.$options.data);

  let keys = Object.keys(data);

  let len = keys.length;
  while (len--) {
    let key = keys[len];
    proxy(vm, "_data", key);
  }
}

var sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop,
};

function proxy(target, sourceKeys, key) {
  sharedPropertyDefinition.get = function () {
    return this[sourceKeys][key];
  };

  sharedPropertyDefinition.set = function (val) {
    this[sourceKeys][key] = val;
  };

  Object.defineProperty(target, key, sharedPropertyDefinition);
}

function noop(a, b, c) {}

function initMethods(vm, methods) {
  for (let key in methods) {
    vm[key] = typeof methods[key] === "function" ? methods[key].bind(vm) : noop;
  }
}

let p1 = new Person({
  data: {
    name: "pino",
    age: 18,
  },
  methods: {
    sayName() {
      console.log("I am" + this.name);
    },
  },
});

console.log(p1.name); // pino
p1.sayName(); // 'I am pino'
```

#### 总结

所以就可以回答题目的问题了：

通过`this`直接访问到`methods`里面的函数的原因是：因为`methods`里的方法通过 `bind` 指定了`this`为 `new Vue`的实例(`vm`)。

通过 `this` 直接访问到 `data` 里面的数据的原因是：data 里的属性最终会存储到`new Vue`的实例（`vm`）上的 `_data`对象中，访问 `this.xxx`，是访问`Object.defineProperty`代理后的 `this._data.xxx`。

### 31.vue 在 beaforeCreate 时获取 data 中的数据

众所周知，vue 在 beforecreate 时期是获取不到 data 中的 数据的

但是通过一些方法可以实现在 beforecreate 时获取到 data 中的数据

暂时想到两种放发可以实现，vue 在 beforecreate 时获得 data 中的数据

1.异步获取即：通过`$this.$nextTick`或者 setTimeout，这连 dom 都可以拿出来

```js
beforeCreate() {
      this.$nextTick(function() {
      console.log(this.属性名);
})
}
```

2.同步获取：在 beforeCreate 之前，所有的 iptions 都会先存到`vm.$options`中，
也就是说使用`this.$options.data`就行了

### 32.vue 中`$`符号

挂载在 this 上的 vue 内部属性
一个特殊标记。增强区分的，来说明这是内置的实例方法属性

这些只是 Vue 的命名规则，为了区分普通变量属性，避免我们自己声明或者添加自定义属性导致覆盖

内部 api 的命名空间
带 $ 的是 VUE 框架（或插件）定义的属性方法

vue 中所有带$的方法

```js
<div id="example">
    <p ref="myp">{{msg}}</p>
    <div ref="warp">
       <div v-for="a in arr" ref="mydiv">a</div>
    </div>
</div>
let vm = new Vue({
        el:'#example',

        data:{msg:'hello',arr:[1,2,3]},
        mounted(){
            this.$nextTick(()=>{
                console.log(vm);
            })

         console.log(this.$refs.myp)//无论有多少个只能拿到一个

         console.log(this.$refs.mydiv)//可以拿到一个数组

         this.arr=[1,2,3,4]
        console.log(this.$refs.wrap)
        debugger
//这里debugger的话只能看到warp打印出来的是有3个，因为dom渲染是异步的。
//所以如果数据变化后想获取真实的数据的话需要等页面渲染完毕后在获取，就用$nextTick
} })
vm.$watch('msg', function (newValue, oldValue) {  // 这个回调将在 `vm.msg` 改变后调用 })
//this.$data: vm上的数据

//this.$el:当前el元素

//this.$nextTick :异步方法，等待渲染dom完成后来获取vm

 //this.$watch:监控

//this.$set:后加的属性实现响应式变化

//this.$refs:被用来给元素或子组件注册引用信息。引用信息将会注册在父组件的 $refs 对象上。

//如果在普通的 DOM 元素上使用，引用指向的就是 DOM 元素；如果用在子组件上，引用就指向组件实例
```
