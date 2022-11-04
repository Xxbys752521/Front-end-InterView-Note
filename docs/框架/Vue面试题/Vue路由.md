---
sidebar_position: 4
description: Vue路由
---

## 路由

### 1.hash 和 history 模式区别

从⽤户的⾓度看，前端路由主要实现了两个功能（使⽤ ajax 更新页⾯状态的情况下）：

1. 记录当前页⾯的状态（保存或分享当前页的 url，再次打开该 url 时，⽹页还是保存（分享）时的状态）；
2. 可以使⽤浏览器的前进后退功能（如点击后退按钮，可以使页⾯回到使⽤ ajax 更新页⾯之前的状态，url 也回到之前的状态）；

作为开发者，要实现这两个功能，我们需要做到：

1.改变 url 且不让浏览器向服务器发出请求；

2.监测 url 的变化；

3.截获 url 地址，并解析出需要的信息来匹配路由规则。
我们路由常⽤的 hash 模式和 history 模式实际上就是实现了上⾯的功能

Vue-Router 有两种模式：**hash 模式**和**history 模式**。默认的路由模式是 hash 模式。

#### 1. hash 模式

**简介：** hash 模式是开发中默认的模式，它的 URL 带着一个#，例如：`www.abc.com/#/vue`，它的 hash 值就是`#/vue`。

**特点**：hash 值会出现在 URL 里面，但是不会出现在 HTTP 请求中，对后端完全没有影响。所以改变 hash 值，不会重新加载页面。这种模式的浏览器支持度很好，低版本的 IE 浏览器也支持这种模式。hash 路由被称为是前端路由，已经成为 SPA（单页面应用）的标配。

**原理：** hash 模式的主要原理就是**onhashchange()事件**：

使⽤到的 api：

```js
window.location.hash = "qq"; // 设置 url 的 hash，会在当前url后加上 '#qq'
var hash = window.location.hash; // '#qq'
window.addEventListener("hashchange", function () {
  // 监听hash变化，点击浏览器的前进后退会触发
});
```

```javascript
window.onhashchange = function (event) {
  console.log(event.oldURL, event.newURL);
  let hash = location.hash.slice(1);
};
```

使用 onhashchange()事件的好处就是，在页面的 hash 值发生变化时，无需向后端发起请求，window 就可以监听事件的改变，并按规则加载相应的代码。除此之外，hash 值变化对应的 URL 都会被浏览器记录下来，这样浏览器就能实现页面的前进和后退。虽然是没有请求后端服务器，但是页面的 hash 值和对应的 URL 关联起来了。

#### 2. history 模式

**简介：** history 模式的 URL 中没有#，它使用的是传统的路由分发模式，即用户在输入一个 URL 时，服务器会接收这个请求，并解析这个 URL，然后做出相应的逻辑处理。 **特点：** 当使用 history 模式时，URL 就像这样：`abc.com/user/id`。相比 hash 模式更加好看。但是，history 模式需要后台配置支持。如果后台没有正确配置，访问时会返回 404。 **API：** history api 可以分为两大部分，切换历史状态和修改历史状态：

- **修改历史状态**：包括了 HTML5 History Interface 中新增的 `pushState()` 和 `replaceState()` 方法，这两个方法应用于浏览器的历史记录栈，提供了对历史记录进行修改的功能。只是当他们进行修改时，虽然修改了 url，但浏览器不会立即向后端发送请求。如果要做到改变 url 但又不刷新页面的效果，就需要前端用上这两个 API。
- **切换历史状态：** 包括`forward()`、`back()`、`go()`三个方法，对应浏览器的前进，后退，跳转操作。

history.state 用于存储 2 个方法的 data 数据，不同浏览器的读写权限不一样

响应 pushState 或者 replaceState 的调用

history.pushState 方法接受三个参数，依次为：

> state：一个与指定网址相关的状态对象，popstate 事件触发时，该对象会传入回调函数。如果不需要这个对象，此处可以填 null。
> title：新页面的标题，但是所有浏览器目前都忽略这个值，因此这里可以填 null。
> url：新的网址，必须与当前页面处在同一个域。浏览器的地址栏将显示这个网址。
> 假定当前网址是 example.com/1.html，我们使用 pushState 方法在浏览记录（history 对象）中添加一个新记录。

每当活动的历史记录项发生变化时， `popstate` 事件都会被传递给 window 对象。如果当前活动的历史记录项是被 `pushState` 创建的，或者是由 `replaceState` 改变的，那么 `popstate` 事件的状态属性 `state` 会包含一个当前历史记录状态对象的拷贝

```js
window.history.pushState(state, title, url);
// state：需要保存的数据，这个数据在触发popstate事件时，可以在event.state⾥获取
// title：标题，基本没⽤，⼀般传 null
// url：设定新的历史记录的 url。新的 url 与当前 url 的 origin 必须是⼀樣的，否则会抛出错误。url可以是绝对路径，也可以是相对路径。
//如当前url是 https://www.baidu.com/a/,执⾏history.pushState(null, null, './qq/')，则变成 https://www.baidu.com/a/qq/，
//执⾏history.pushState(null, null, '/qq/')，则变成 https://www.baidu.com/qq/
window.history.replaceState(state, title, url);
// 与 pushState 基本相同，但她是修改当前历史记录，⽽ pushState 是创建新的历史记录
window.addEventListener("popstate", function () {
  // 监听浏览器前进后退事件，pushState 与 replaceState ⽅法不会触发
});
window.history.back(); // 后退
window.history.forward(); // 前进
window.history.go(1); // 前进⼀步，-2为后退两步，window.history.lengthk可以查看当前历史堆栈中页⾯的数量
```

虽然 history 模式丢弃了丑陋的#。但是，它也有自己的缺点，就是在刷新页面的时候，如果没有相应的路由或资源，就会刷出 404 来。

history 模式改变 url 的⽅式会导致浏览器向服务器发送请求，这不是我们想看到的，我们需要在服务器端做处理：如果匹配不到任何静态资源，则应该始终返回同⼀个 html 页⾯。

如果想要切换到 history 模式，就要进行以下配置（后端也要进行配置）：

```javascript
const router = new VueRouter({
  mode: 'history',
  routes: [...]
})
```

#### 3. 两种模式对比

调用 history.pushState() 相比于直接修改 hash，存在以下优势:

- pushState() 设置的新 URL 可以是与当前 URL 同源的任意 URL；而 hash 只可修改 # 后面的部分，因此只能设置与当前 URL 同文档的 URL；
- pushState() 设置的新 URL 可以与当前 URL 一模一样，这样也会把记录添加到栈中；而 hash 设置的新值必须与原来不一样才会触发动作将记录添加到栈中；
- pushState() 通过 stateObject 参数可以添加任意类型的数据到记录中；而 hash 只可添加短字符串；
- pushState() 可额外设置 title 属性供后续使用。
- hash 模式下，仅 hash 符号之前的 url 会被包含在请求中，后端如果没有做到对路由的全覆盖，也不会返回 404 错误；history 模式下，前端的 url 必须和实际向后端发起请求的 url 一致，如果没有对用的路由处理，将返回 404 错误。

hash 模式和 history 模式都有各自的优势和缺陷，还是要根据实际情况选择性的使用。

### 2.前端路由和后端路由的区别

1.什么是路由

路由是根据不同的 url 展示不同的内容或页面。

2.什么是前端路由

特点：不向后台发送请求，不刷新页面，前后端分离

前端路由即响应页面内容的任务是由前端来做的，根据不同的 url 更新页面的内容，随着 SPA（单页面应用）的普遍使用，前后端开发分离，项目中基本都使用前端路由，通过路由实现页面的变化。例如，通过 vue 开发的 SPA 中，切换路由，并不刷新页面，而是根据路由在虚拟 DOM 中加载所需要的数据，实现页面内容的改变。

3.什么是后端路由

特点：向服务器发送请求，会刷新页面，前后端不能分离

在浏览器的地址栏中切换不同的 url 时，每次都向后台服务器发出请求，服务器根据不同的响应不同的数据，浏览器接收到数据后再进行渲染，所以后端路由会刷新页面，如果网速慢的话，就会看到一个空白页面等待服务端返回数据，后台路由最大的问题就是不能前后端分离。

4.什么时候使用前端路由

在单页面应用中，大部分页面结构不变，只改变部分内容时使用

5.前端路由的优缺点

优点：

1.用户体验好，页面初始化后，只需要根据路由变换页面内容，不需要再向服务器发送请求，内容变换速度快。

2.可以在浏览器中输入指定想要访问的 url

3.实现了前后端分离，方便开发。

缺点：

1.使用浏览器的前进、后退键的时候会重新发送请求，没有合理的利用缓存

2.单页面无法记住之前滚动的位置，无法在前进、后退的时候记住滚动的位置

### 3.如何获取页面的 hash 变化

**（1）监听$route 的变化**

```javascript
// 监听,当路由发生变化的时候执行
watch: {
  $route: {
    handler: function(val, oldVal){
      console.log(val);
    },
    // 深度观察监听
    deep: true
  }
},
```

**（2）window.location.hash 读取#值** window.location.hash 的值可读可写，读取来判断状态是否改变，写入时可以在不重载网页的前提下，添加一条历史访问记录。

### 4.route 和 router 的区别

- $route 是“路由信息对象”，包括 path，params，hash，query，fullPath，matched，name 等路由信息参数
- $router 是“路由实例”对象包括了路由的跳转方法，钩子函数等

### 5.params 和 query 的区别

#### 1.跳转方式不同

query 可以使用 name 或者 path 方式跳转

```js
//query传参，使用name跳转
this.$router.push({
  name: "second",
  query: {
    queryId: "20180822",
    queryName: "query",
  },
});

//query传参，使用path跳转
this.$router.push({
  path: "second",
  query: {
    queryId: "20180822",
    queryName: "query",
  },
});

//query传参接收
this.queryName = this.$route.query.queryName;
this.queryId = this.$route.query.queryId;
```

params 只能使用 name 方式进行跳转引入

```js
//params传参 使用name
this.$router.push({
  name: "second",
  params: {
    id: "20180822",
    name: "query",
  },
});

//params接收参数
this.id = this.$route.params.id;
this.name = this.$route.params.name;
```

#### 2.浏览器 url 显示的不同

```js
//使用params时
//路由
{
    path: '/second/:id/:name',
    name: 'second',
    component: () => import('@/view/second')
}
//传参
this.$router.push({
    name: 'second',
    params: {
        id: '1245314',
        name: 'wendy'
    }
})
//浏览器url地址 页面刷新时参数不会丢失
localhost:8080/second/1245314/wendy
//如果路由后面没有 /:id/:name效果如下图，注意：地址栏没有参数,页面一刷新参数就会丢失
localhost:8080/second
//接收参数
this.$route.params.id
this.$route.params.name
复制代码
//使用query时
//传参
this.$router.push({
    name:'second',
    query: {
        queryId:'20180822',
        queryName: 'query'
    }
})
//浏览器url地址
localhost:8080?queryId='20180822'&queryName='query'
//页面刷新时参数不会丢失，因为参数写在地址栏上了
```

#### params:

1.params 是路由的一部分，因此使用 params 传参，路由上必须写对应的参数； 2.进行路由跳转的时候要传值，否则会跳转页面失败；
3.params 只能使用 name 来传参；
4.params 相当于 post 请求，参数对用来说是不可见的

#### Query:

1.query 传参可以使用 path,也可以使用 name;
2.query 相当于 get 请求，参数拼接在路由的后面；
3.query 是拼接在路由后面的，因此有没有没关系；

### 6.动态路由怎么定义

什么是动态路由

**（1）param 方式**

- 配置路由格式：`/router/:id`
- 传递的方式：在 path 后面跟上对应的值
- 传递后形成的路径：`/router/123`

1）路由定义

```javascript
//在APP.vue中
<router-link :to="'/user/'+userId" replace>用户</router-link>

//在index.js
{
   path: '/user/:userid',
   component: User,
},
```

2）路由跳转

```javascript
// 方法1：
<router-link :to="{ name: 'users', params: { uname: wade }}">按钮</router-link

// 方法2：
this.$router.push({name:'users',params:{uname:wade}})

// 方法3：
this.$router.push('/user/' + wade)
```

3）参数获取 通过 `$route.params.userid` 获取传递的值

**（2）query 方式**

- 配置路由格式：`/router`，也就是普通配置
- 传递的方式：对象中使用 query 的 key 作为传递方式
- 传递后形成的路径：`/route?id=123`

1）路由定义

```javascript
//方式1：直接在router-link 标签上以对象的形式
<router-link :to="{path:'/profile',query:{name:'why',age:28,height:188}}">档案</router-link>

// 方式2：写成按钮以点击事件形式
<button @click='profileClick'>我的</button>

profileClick(){
  this.$router.push({
    path: "/profile",
    query: {
        name: "kobi",
        age: "28",
        height: 198
    }
  });
}
```

2）跳转方法

```javascript
// 方法1：
<router-link :to="{ name: 'users', query: { uname: james }}">按钮</router-link>

// 方法2：
this.$router.push({ name: 'users', query:{ uname:james }})

// 方法3：
<router-link :to="{ path: '/user', query: { uname:james }}">按钮</router-link>

// 方法4：
this.$router.push({ path: '/user', query:{ uname:james }})

// 方法5：
this.$router.push('/user?uname=' + jsmes)
```

3）获取参数

```javascript
通过$route.query 获取传递的值
```

### 7.VueRouter 和 Location.href 跳转方式的区别

- 使用 `location.href= /url `来跳转，简单方便，但是刷新了页面；
- 使用 `history.pushState( /url )` ，无刷新页面，静态跳转；
- 引进 router ，然后使用 `router.push( /url )` 来跳转，使用了 `diff` 算法，实现了按需加载，减少了 dom 的消耗。其实使用 router 跳转和使用 `history.pushState()` 没什么差别的，因为 vue-router 就是用了 `history.pushState()` ，尤其是在 history 模式下。

### 8.Vue-Router 的懒加载如何实现

非懒加载：

```javascript
import List from "@/components/list.vue";
const router = new VueRouter({
  routes: [{ path: "/list", component: List }],
});
```

（1）方案一(常用)：使用箭头函数+import 动态加载

```javascript
const List = () => import("@/components/list.vue");
const router = new VueRouter({
  routes: [{ path: "/list", component: List }],
});
```

（2）方案二：使用箭头函数+require 动态加载

```javascript
const router = new Router({
  routes: [
    {
      path: "/list",
      component: (resolve) => require(["@/components/list"], resolve),
    },
  ],
});
```

（3）方案三：使用 webpack 的 require.ensure 技术，也可以实现按需加载。 这种情况下，多个路由指定相同的 chunkName，会合并打包成一个 js 文件。

```javascript
// r就是resolve
const List = r => require.ensure([], () => r(require('@/components/list')), 'list');
// 路由也是正常的写法  这种是官方推荐的写的 按模块划分懒加载
const router = new Router({
  routes: [
  {
    path: '/list',
    component: List,
    name: 'list'
  }
 ]
}))
```

### 9.路由导航守卫

- 全局前置/钩子：beforeEach、beforeResolve、afterEach
- 路由独享的守卫：beforeEnter
- 组件内的守卫：beforeRouteEnter、beforeRouteUpdate、beforeRouteLeave

### 10.两种路由的工作原理

`Hash`模式的工作原理。

- `URL`中`#`后面的内容作为路径地址，当地址改变的时候不会向服务器发送请求，但是会触发`hashchange`事件。
- 监听`hashchange`事件，在该事件中记录当前的路由地址，然后根据路由地址找到对应组件。
- 根据当前路由地址找到对应组件重新渲染。

`History`模式

- 通过`history.pushState()`方法改变地址栏，并且将当前地址记录到浏览器的历史记录中。当前浏览器不会向服务器发送请求
- 监听`popstate`事件，可以发现浏览器历史操作的变化，记录改变后的地址，单击前进或者是后退按钮的时候触发该事件
- 根据当前路由地址找到对应组件重新渲染

### 11.单页面应用实现无刷新更新原理

> 目前主流的前端 SPA 框架如：React/Vue 是通过 Hash 和 History 两种方式实现无刷新路由。
> 无刷新更新页面本质上是改变页面的 DOM，而不是跳转到新页面

#### 问题

##### 1、如何改变 URL 不引起页面刷新。

Hash 模式：更新 window.location.hash, \#是用来指导浏览器动作的，http 请求中是不包括#部分的，不会发送到服务器端。因此改变 location.hash 部分，浏览器不会发送请求重新加载页面
History 模式：通过 pushState 或 replaceState 方法改变浏览器的 URL 不会引起页面刷新

pushState 在用户访问页面后面添加一个访问记录， replaceState 则是直接替换了当前访问记录

##### 2、如何监控 URL 的变化。

在 Hash 模式下可以通过**监听 Hashchange 事件来监控 URL 的变化**。

在 History 模式只有**浏览器的前进和后退会触发 popstate 事件**， History API 提供的 pushState 和 replaceState 并不会触发相关事件。故需要劫持 pushState / replaceState 方法，再手动触发事件。

既然 History 这么麻烦，那为什么还要用 History 模式呢？

来先看下完整 URL 的组成：

```ruby
protocol://hostname:port/pathname?search#hash
```

- protocol：通信协议，常用的有 http、https、ftp、mailto 等。
- hostname：主机域名或 IP 地址。
- port：端口号，可选。省略时使用协议的默认端口，如 http 默认端口为 80。
- pathname：路径由零或多个"/"符号隔开的字符串组成，一般用来表示主机上的一个目录或文件地址。
- search：查询，可选。用于传递参数，可有多个参数，用"&“符号隔开，每个参数的名和值用”="符号隔开。
- hash：信息片断字符串，也称为锚点。用于指定网络资源中的片断。

可以看到 Hash 前面固定有一个井号 "#"，即不美观，也不符合一般我们对路由认知，如：

```ruby
https://www.test.com/#/home
https://www.test.com/#/about
```

而 History 就可以解决这个问题，它可以直接修改 **pathname** 部分的内容：

```cpp
https://www.test.com/home
https://www.test.com/about
```

##### 3、如何根据 URL 改变页面内容。

文章开头说了，**\*无刷新更新页面本质上是改变页面的 DOM，而不是跳转到新页面**。\* 我们也知道了如何监控 URL 的变化，那最简单粗暴的方式就是直接通过 innerHTML 改变 DOM 内容。

根据当前路由地址找到对应组件重新更新渲染。

当然主流的 SPA 框架如：React/Vue 是通过 **虚拟 DOM(Virtual DOM)** 结合优化后的 **diff 策略** 实现最小 DOM 操作来更新页面。

#### 路由的实现

##### 1、路由的需求和解决思路

- 如何生成路由
  创建一个 **Router** 类，传入一个类似 Vue-router 的路由参数数组 **routes** 来配置路由：

  ```dart
  const routes = [
    {
        path: '/',
        redirect: '/home',
    },
    {
        path: '/home',
        page: home,
    },
    {
        path: '/about',
        page: about,
    },
    {
        path: '/about/me',
        page: aboutMe,
    }
    // ...
  ];
  export { routes };
  ```

- 如何跳转地址
  使用 History API 提供的 **pushState 和 replaceState** 方法：

  ```dart
  // 本质上只是改变了浏览器的 URL 显示
  window.history.pushState({}, '', '/someurl');
  window.history.replaceState({}, '', '/someurl');
  ```

- 如何监听 URL 变化
  由于**pushState 和 replaceState** 并不会触发相应事件，故需劫持 pushState 和 replaceState 方法，手动触发事件：

  触发事件, 让 addEventListener 可以监听到

  ```tsx
  bindHistoryEventListener(type: string): any {
        const historyFunction: Function = (<any>history)[type];
        return function() {
            const newHistoryFunction = historyFunction.apply(history, arguments);
            const e = new Event(type);
            (<any>e).arguments = arguments;
            // 触发事件, 让 addEventListener 可以监听到
            window.dispatchEvent(e);
            return newHistoryFunction;
        };
    };
  ```

  然后就可以监听相关事件了

  ```tsx
  window.history.pushState = this.bindHistoryEventListener("pushState");
  window.addEventListener("pushState", () => {
    // ...
  });
  window.history.replaceState = this.bindHistoryEventListener("replaceState");
  window.addEventListener("replaceState", () => {
    // ...
  });
  ```

- **/about 和 /about/me 是两个不同的页面**
  转换 pathname 为数组，再判断数组长度来区分：

  ```tsx
  // 浏览器 URL 的 pathname 转化为数组
  // browserPath 为 window.location.pathname
  const browserPathQueryArray: Array<string> = browserPath
    .substring(1)
    .split("/");
  // routes的 path 属性转化为数组
  // route 为 routes 遍历后的单个元素
  const routeQueryArray: Array<string> = route.path.substring(1).split("/");
  // 对两者比长度
  if (routeQueryArray.length !== browserPathQueryArray.length) {
    return false;
  }
  ```

- **/blogs/:id 可以动态匹配 /blogs/1、 /blogs/99**
  转换 pathname 为数组，字符串判断以冒号 ":" 开头，则为动态属性，把其加入到全局变量 $route 中：

  ```ruby
  for (let i = 0; i < routeQueryArray.length; i++) {
      if (routeQueryArray[i].indexOf(':') === 0) {
         // :id 可以用 $router.id 访问
         (<any>window).$route[routeQueryArray[i].substring(1)] = pathQueryArray[i];
      }
  }
  ```

- **路由有的地址会 \*跳转 / 重新定向\* 到其他地址上**
  在路由参数中约定 redirect 属性为 跳转 / 重新定向 的目标地址，查找中再次遇到 redirect 属性则重新查找新的目标地址，直到找到最终地：

  ```kotlin
  // Router 类 的 redirect 方法
  if (this.routes[index].redirect !== undefined && this.routes[index].redirect !== '') {
      this.redirect(this.routes[index].redirect);
  } else {
      // 更新 URL 为最终的地址
      window.history.pushState({}, '', window.location.origin + this.routes[index].path);
      // 然后执行更新页面逻辑 ...
  }
  ```

##### 2、History 路由的实现

1、路由参数 routes.ts：

```dart
// 该数组会作为参数传给路由器的实例，其中 page 参数接收一个 Page 对象，该对象包含一些页面更新的方法，可以是 innerHTML 也可以是 虚拟 DOM 更新，这里不重要，只要知道可以调用它的方法更新页面就行

// 甚至可以把 page 参数改为接收 HTML 字符串，路由器直接把这些 HTML 字符串通过 innerHTML 更新进页面

const routes = [
    {
        // 地址
        path: '/',
        // redirect 为要重新定向的地址
        redirect: '/home',
    },
    {
        path: '/home',
        page: homePage,
    },
    {
        path: '/about',
        page: aboutPage,
    },
    {
        path: '/about/me',
        page: aboutMePage,
    },
    {
        path: '/blogs/:id',
        page: blogsPage,
    },
    {
        path: '/404',
        page: pageNotFound,
    },
];
export { routes };
```

2、路由 router.ts：

```tsx
// 路由参数就是 Route 的数组
interface Route {
  path: string;
  page?: Page;
  redirect?: string;
}

// 路由器接收的参数
interface Config {
  // 内容区容器 ID
  container: HTMLElement;
  routes: Route[];
}

class Router {
  // 页面需要更新的区域
  container: HTMLElement;
  routes: Route[];
  constructor(config: Config) {
    this.routes = config.routes;
    this.container = config.container;

    // 先执行一次，初始化页面
    this.monitor();

    // 劫持 pushState
    window.history.pushState = this.bindHistoryEventListener("pushState");
    window.addEventListener("pushState", () => {
      this.monitor();
    });
    window.addEventListener("popstate", () => {
      this.monitor();
    });
  }

  // 根据路由地址查找相应的参数
  monitor(): void {
    let index: number = this.routes.findIndex((item: Route) => {
      return this.verifyPath(item, window.location.pathname);
    });

    // 找到结果
    if (index >= 0) {
      if (
        this.routes[index].redirect !== undefined &&
        this.routes[index].redirect !== ""
      ) {
        // 重新定向
        this.redirect(this.routes[index].redirect);
      } else {
        // 不需重新定向，执行更新页面的方法
        this.updatePage(index);
      }
    } else {
      // 没找到结果跳转到 /404 地址
      window.history.pushState({}, "", "/404");
      console.log("404!");
    }
  }

  // 重新定向
  redirect(redirectPath: string): void {
    let index: number = this.routes.findIndex((item: Route) => {
      return redirectPath === item.path;
    });
    // 定向到的地址还是 redirect 则继续找最终 path
    if (
      this.routes[index].redirect !== undefined &&
      this.routes[index].redirect !== ""
    ) {
      this.redirect(this.routes[index].redirect);
    } else {
      // 更新 URL 为最终的地址
      window.history.pushState(
        {},
        "",
        window.location.origin + this.routes[index].path
      );
      this.updatePage(index);
    }
  }

  // 更新页面
  updatePage(index: number): void {
    // 向全局变量 $route 加入动态属性
    const pathQueryArray: Array<string> = window.location.pathname
      .substring(1)
      .split("/");
    const routeQueryArray: Array<string> = this.routes[index].path
      .substring(1)
      .split("/");
    for (let i = 0; i < routeQueryArray.length; i++) {
      if (routeQueryArray[i].indexOf(":") === 0) {
        (<any>window).$route[routeQueryArray[i].substring(1)] =
          pathQueryArray[i];
      }
    }

    // 这里假设 Page 有 create 方法可以更新页面内容，而不用纠结它的具体实现
    this.routes[index].page.create(this.container);
  }

  // 对比路由地址
  verifyPath(route: Route, browserPath: string): boolean {
    const browserPathQueryArray: Array<string> = browserPath
      .substring(1)
      .split("/");
    const routeQueryArray: Array<string> = route.path.substring(1).split("/");
    // 先核对长度
    if (routeQueryArray.length !== browserPathQueryArray.length) {
      return false;
    }
    for (let i = 0; i < routeQueryArray.length; i++) {
      // 判断是否以冒号开头, 如 :id
      // 不是, 则将其与路由 path进行比对
      if (routeQueryArray[i].indexOf(":") !== 0) {
        if (routeQueryArray[i] !== browserPathQueryArray[i]) {
          return false;
        }
      }
    }
    return true;
  }

  // 劫持 pushState / popState
  bindHistoryEventListener(type: string): any {
    const historyFunction: Function = (<any>history)[type];
    return function () {
      const newHistoryFunction = historyFunction.apply(history, arguments);
      const e = new Event(type);
      (<any>e).arguments = arguments;
      // 触发事件, 让 addEventListener 可以监听到
      window.dispatchEvent(e);
      return newHistoryFunction;
    };
  }
}

export { Router };
```

3、使用路由器

```jsx
import { routes } from "routes.js";
import { Router } from "router.js";
new Router({
  // 更新页面 div#app 中的内容
  container: document.getElementById("app"),
  routes: routes,
});
```

### 12.单页面应用和多页面应用

#### 单页面应用（SinglePage Web Application，SPA）

只有一张 Web 页面的应用，是一种从 Web 服务器加载的富客户端，单页面跳转仅刷新局部资源 ，公共资源(js、css 等)仅需加载一次，常用于 PC 端官网、购物等网站

![单页面应用结构视图](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs/202208202301546.webp)

#### 多页面应用（MultiPage Application，MPA）

多页面跳转刷新所有资源，每个公共资源(js、css 等)需选择性重新加载，常用于 app 或 客户端等

![多页面应用结构视图](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs/202208202301146.webp)

#### 具体对比分析：

|                   | 单页面应用（SinglePage Web Application，SPA）                           | 多页面应用（MultiPage Application，MPA）     |
| ----------------- | ----------------------------------------------------------------------- | -------------------------------------------- |
| 组成              | 一个外壳页面和多个页面片段组成                                          | 多个完整页面构成                             |
| 资源共用(css,js)  | 共用，只需在外壳部分加载                                                | 不共用，每个页面都需要加载                   |
| 刷新方式          | 页面局部刷新或更改                                                      | 整页刷新                                     |
| url 模式          | a.com/#/pageone a.com/#/pagetwo                                         | a.com/pageone.html a.com/pagetwo.html        |
| 用户体验          | 页面片段间的切换快，用户体验良好                                        | 页面切换加载缓慢，流畅度不够，用户体验比较差 |
| 转场动画          | 容易实现                                                                | 无法实现                                     |
| 数据传递          | 容易                                                                    | 依赖 url 传参、或者 cookie 、localStorage 等 |
| 搜索引擎优化(SEO) | 需要单独方案、实现较为困难、不利于 SEO 检索 可利用服务器端渲染(SSR)优化 | 实现方法简易                                 |
| 试用范围          | 高要求的体验度、追求界面流畅的应用                                      | 适用于追求高度支持搜索引擎的应用             |
| 开发成本          | 较高，常需借助专业的框架                                                | 较低 ，但页面重复代码多                      |
| 维护成本          | 相对容易                                                                | 相对复杂                                     |

单页面应用程序将所有的活动局限于一个 Web 页面中，在该 Web 页面初始化时加载相应的 HTML、JavaScript 和 CSS。一旦页面加载完成，单页面应用不会因为用户的操作而进行页面的重新加载或跳转。取而代之的是利用 JavaScript 动态的变换 HTML 的内容，从而实现 UI 与用户的交互。由于避免了页面的重新加载，单页面应用可以提供较为流畅的用户体验。

#### 单页面应用的优点

- 良好的交互体验

单页应用的内容的改变不需要重新加载整个页面，获取数据也是通过 Ajax 异步获取，没有页面之间的切换，就不会出现“白屏现象”,也不会出现假死并有“闪烁”现象，页面显示流畅

- 良好的前后端工作分离模式

后端不再负责模板渲染、输出页面工作，后端 API 通用化，即同一套后端程序代码，不用修改就可以用于 Web 界面、手机、平板等多种客户端

- 减轻服务器压力

单页应用相对服务器压力小，服务器只用出数据就可以，不用管展示逻辑和页面合成，吞吐能力会提高几倍

#### 缺点

- 首屏加载慢

解决方案： 1，vue-router 懒加载

Vue-router 懒加载就是按需加载组件，只有当路由被访问时才会加载对应的组件，而不是在加载首页的时候就加载，项目越大，对首屏加载的速度提升得越明显

2，使用 CDN 加速

在做项目时，我们会用到很多库，采用 cdn 加载可以加快加载速度。

3，异步加载组件

4，服务端渲染

服务端渲染还能对 seo 优化起到作用，有利于搜索引擎抓取更多有用的信息（如果页面纯前端渲染，搜索引擎抓取到的就只是空页面）

- 不利于 SEO

seo 本质是一个服务器向另一个服务器发起请求，解析请求内容。但一般来说搜索引擎是不会去执行请求到的 js 的。也就是说，搜索引擎的基础爬虫的原理就是抓取 url，然后获取 html 源代码并解析。 如果一个单页应用，html 在服务器端还没有渲染部分数据数据，在浏览器才渲染出数据，即搜索引擎请求到的 html 是模型页面而不是最终数据的渲染页面。 这样就很不利于内容被搜索引擎搜索到

解决方案：1，服务端渲染

服务器合成完整的 html 文件再输出到浏览器

2，页面预渲染

3，路由采用 h5 history 模式

- 不适合开发大型项目

大型项目中可能会涉及大量的 DOM 操作、复杂的动画效果，也就不适合使用 Vue、react 框架进行开发

#### seo 怎么做

##### 1. TKD 设置

指对网站中的 title 标签(标题)、keywords 标签(关键词)、description 标签(描述)进行 seo 优化设置

页面 TKD 要包含品牌词及业务词，提升页面排名

例如：掘金的 TKD

Title：掘金 - 代码不止，掘金不停

Keywords：掘金,稀土,Vue.js,前端面试题,nginx 配置,Kotlin,RxJava,React Native,敏捷开发,Python

Description：掘金是一个帮助开发者成长的社区,是给开发者用的 `Hacker News`,给设计师用的 `Designer News`,和给产品经理用的 `Medium`。掘金的技术文章由稀土上聚集的技术大牛和极客共同编辑为你筛选出最优质的干货,其中包括：`Android、iOS`、前端、后端等方面的内容。用户每天都可以在这里找到技术世界的头条内容。与此同时,掘金内还有沸点、掘金翻译计划、线下活动、专栏文章等内容。即使你是 `GitHub、StackOverflow、`开源中国的用户,我们相信你也可以在这里有所收获。

![image.png](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs/202208202301134.webp)

##### 2. 页面内容优化

（1）网页代码语义化调整：多使用语义话标签，便于爬虫检索。

（2）页面内容关键词强化：在页面大小标题和文案中重复关键词，以达到内容强化目的；关键词汇避免使用图片，便于爬虫检索，收录。

（3）img 添加 alt 属性，用 h1 标签去写内容关键字

##### 3. 引导链接

网站底部推荐部分保留产品介绍、常见问题汇总等降低跳出率的引导，提高页面留存与转化；或者与所推荐页面形成互链形式，以稳定页面流量权重。

##### 4. 移动端优化

设置移动页面，或将 pc 页面设置为自适应，增加移动端搜索的体验和留存转化。

移动页面设计需注意以下规则：

（1）页面字体、字符大小、文本行间距等设计，应适合手机用户阅读，不可明显过大过小，正文文本字号不小于 10pt。

（2）首屏主体内容必须占屏幕的 50%以上。

（3）主体内容应与其他板块有明显区分，且位于屏幕的中心位置，使用户获取信息时不受任何干扰。

（4）导航的功能与位置明确，避免用户使用过程中被误导。

（5）除以上提到的内容外，网站还应避免其他影响页面内容辨识的情况，例如页面出现大面积空白、文本无任何排版、段落/图片排版错乱不整齐、主体内容展示不全等。

##### 5. 站外优化

（1）在搜素引擎排名较高的公众平台（百家号 ，知道，贴吧、搜狐、知乎等）发布正面网站信息，以建设良好口碑 ；负面信息排名较高的需删除或者屏蔽处理。

（2）百度，互动，搜狗等百科的创建更新与维护，(互动百科在今日头条有着较高的排名，现在今日头条也在发展搜素引擎)，百科对树立品牌形象较为重要。

（3）公关舆情传播，宣传新闻源发布。

（4）站外推广与外链建设。

根据竞争对手及品牌业务分析，拓展高质量、高权重的外链渠道、科技论坛、自媒体平台、分类信息网等，发布高质量锚文本外链，另进行友情链接交换，以提高关键词排名及自然流量。

### 13.Js 实现 history 路由变化监听

通过 history 的改变，进行 js 操作加载页面，然而 history 并不像 hash 那样简单，因为 history 的改变，除了浏览器的几个前进后退（使用 history.back(), history.forward()和 history.go() 方法来完成在用户历史记录中向后和向前的跳转。）等操作会主动触发 popstate 事件，pushState，replaceState 并不会触发 popstate 事件

首先完成一个订阅-发布模式，然后重写 history.pushState, history.replaceState,并添加消息通知，这样一来只要 history 的无法实现监听函数就被我们加上了事件通知，只不过这里用的不是浏览器原生事件，而是通过我们创建的 event-bus 来实现通知，然后触发事件订阅函数的执行。

#### 订阅-发布模式示例

```javascript
class Dep {
  // 订阅池
  constructor(name) {
    this.id = new Date(); //这里简单的运用时间戳做订阅池的ID
    this.subs = []; //该事件下被订阅对象的集合
  }
  defined() {
    // 添加订阅者
    Dep.watch.add(this);
  }
  notify() {
    //通知订阅者有变化
    this.subs.forEach((e, i) => {
      if (typeof e.update === "function") {
        try {
          e.update.apply(e); //触发订阅者更新函数
        } catch (err) {
          console.warr(err);
        }
      }
    });
  }
}
Dep.watch = null;

class Watch {
  constructor(name, fn) {
    this.name = name; //订阅消息的名称
    this.id = new Date(); //这里简单的运用时间戳做订阅者的ID
    this.callBack = fn; //订阅消息发送改变时->订阅者执行的回调函数
  }
  add(dep) {
    //将订阅者放入dep订阅池
    dep.subs.push(this);
  }
  update() {
    //将订阅者更新方法
    var cb = this.callBack; //赋值为了不改变函数内调用的this
    cb(this.name);
  }
}
```

#### 重写 history 方法，并添加 window.addHistoryListener 事件机制

下面我们只需要对 history 的方法进行重写，并添加 event-bus 即可，代码如下：

```js
var addHistoryMethod = (function () {
  var historyDep = new Dep();
  return function (name) {
    if (name === "historychange") {
      return function (name, fn) {
        var event = new Watch(name, fn);
        Dep.watch = event;
        historyDep.defined();
        Dep.watch = null; //置空供下一个订阅者使用
      };
    } else if (name === "pushState" || name === "replaceState") {
      var method = history[name];
      return function () {
        method.apply(history, arguments);
        historyDep.notify();
      };
    }
  };
})();

window.addHistoryListener = addHistoryMethod("historychange");
history.pushState = addHistoryMethod("pushState");
history.replaceState = addHistoryMethod("replaceState");
```

#### 测试 History 事件监听

上面我们给 window 添加了一个 addHistoryListener 事件监听，类似于 addEventListener 的方法，然后我们有做了 history 的 pushState， replaceState 的改写，接下来我们测试一下。

```javascript
window.addHistoryListener("history", function () {
  console.log("窗口的history改变了");
});
window.addHistoryListener("history", function () {
  console.log("窗口的history改变了-我也听到了");
});
history.pushState({ first: "first" }, "page2", "/first");
```

### 14.Js 实现 hash 路由

[原生 js 实现一个路由 hash router](http://t.zoukankan.com/littleboyck-p-13607016.html)

[手动实现 hash 模式前端路由](https://juejin.cn/post/6844903924206403591)

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>Document</title>
  </head>

  <body>
    <a href="#/" data-href="/">home</a>
    <a href="#/book" data-href="/">book</a>
    <a href="#/movie" data-href="/">movie</a>
    <div id="content"></div>
    <script src="https://cdn.bootcss.com/vue/2.6.10/vue.min.js"></script>
    <script>
      // window.onload = function (params) {
      //     window.location.href += '#/'
      // }

      const Home = {
        template: "<div>home</div>",
      };
      const Book = {
        template: "<div>book</div>",
      };
      const Movie = {
        template: "<div>movie</div>",
      };
      class Router {
        constructor(opts) {
          // this.path = opts.path;
          // this.component = opts.component;
          // this.routes = opts.routes;
          this.routes = {};
          // console.log(opts);

          opts.forEach((item) => {
            this.route(item.path, () => {
              document.getElementById("content").innerHTML = item.component;
            });
          });
          console.log(this.routes);

          this.init();
        }
        bindEvent() {}
        init() {
          window.addEventListener("load", this.updateView.bind(this));
          window.addEventListener("hashchange", this.updateView.bind(this));
        }
        updateView(e) {
          // console.log(e,'updated');
          // console.log(e.newURL.indexOf(e.oldURL));

          // console.log(e.newURL.substring(e.newURL.indexOf(e.oldURL)));
          const hashTag = window.location.hash.slice(1) || "/";
          console.log(window.location.hash.slice(1));
          this.routes[hashTag] && this.routes[hashTag]();
        }
        route(path, cb) {
          this.routes[path] = cb;
        }
      }
      new Router([
        {
          path: "/",
          component: "home",
        },
        {
          path: "/book",
          component: "book",
        },
        {
          path: "/movie",
          component: "movie",
        },
      ]);
    </script>
  </body>
</html>
```

### 15.vue router 基本原理

`Vue Router`的核心代码

```js
//注册插件
Vue.use(VueRouter);
//创建路由对象
const router = new VueRouter({
  routes: [{ name: "home", path: "/", component: homeComponent }],
});
// 创建Vue实例，注册router对象
new Vue({
  router,
  render: (h) => h(App),
}).$mount("#apps");
```

use`方法需要的参数可以是一个函数或者是对象，如果传递的是函数，`use`内部会直接调用该函数，

如果传递的是一个对象，那么在`use`内部会调用该对象的`install`方法。

![类图](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs/202208202301604.png)

上半部分是`VueRouter`的属性，而下半部分是`VueRouter`的方法

options`作用是记录构造函数中传入的对象, 我们在创建`Vue Router`的实例的时候，传递了一个对象，而该对象中定义了路由规则。而`options`就是记录传入的这个对象的。

`routeMap`:是一个对象，记录路由地址与组件的对应关系，也就是一个键值对的形式，后期会 options 中路由规则解析到`routeMap`中。

`data`是一个对象，该对象中有一个属性`current`,该属性用来记录当前的路由地址，`data`是一个响应式的对象，因为当前路由地址发生变化后，对应的组件要发生更新（_也就说当地址变化后，要加载对应组件_）

`install`是一个静态方法，用来实现`Vue`的插件机制。

`Constructor`是一个构造方法，该该构造方法中会初始化`options` ,`data`,`routeMap`这几个属性。

init 方法主要是用来调用下面的三个方法，也就把不同的代码分隔到不同的方法中去实现。

`initEvent`方法，用来注册`popstate`事件，

`createRouteMap`方法，该方法会把构造函数中传入进来的路由规则，转换成键值对的形式存储到`routeMap`中。 键就是路由的地址，值就是对应的组件

`initComponents`方法，主要作用是用来创建`router-link`和`router-view`这两个组件的。

#### install 方法实现

```js
let _Vue = null;
export default class VueRouter {
  //调用install方法的时候，会传递Vue的构造函数
  static install(Vue) {
    //首先判断插件是否已经被安装，如果已经被安装，就不需要重复安装。
    //1、判断当前插件是否已经被安装:
    if (VueRouter.install.installed) {
      //条件成立，表明插件已经被安装，什么都不要做。
      return;
    }
    VueRouter.install.installed = true;
    //2、把Vue构造函数记录到全局变量中。
    _Vue = Vue;

    //3、把创建Vue实例时候传入的router对象注入到Vue实例上。
    _Vue.mixin({
      beforeCreate() {
        //在创建Vue实例的时候
        // 也就是new Vue()的时候，才会有$options这个属性，
        //组件中是没有$options这个属性的。
        if (this.$options.router) {
          _Vue.prototype.$router = this.$options.router;
        }
      },
    });
  }
}
```

#### 构造函数

`Constructor`是一个构造方法，该该构造方法中会初始化`options` ,`data`,`routeMap`这几个属性

```js
 constructor(options) {

    this.options = options;

    this.routeMap = {};

    this.data = _Vue.observable({
      current: "/",
    });
  }
```

#### createRouteMap 方法实现

`createRouteMap`方法，该方法会把构造函数中传入进来的`options`参数中的路由规则，转换成键值对的形式存储到`routeMap`中。 键就是路由的地址，值就是对应的组件

```js
  createRouteMap() {

    this.options.routes.forEach((route) => {
      this.routeMap[route.path] = route.component;
    });
  }
```

#### initComponents 方法实现

initComponents`方法，主要作用是用来创建`router-link`和`router-view`这两个组件的。

下面先在这个方法中创建`router-link`这个组件。

`<router-link to="/users"> 用户管理</router-link>`

`router-link`这个组件最终会被渲染成`a`标签，同时`to`作为一个属性，其值会作为`a`标签中的`href`属性的值。同时还要获取`<router-link>`这个组件中的文本，作为最终超链接的文本

```js
 initComponents(Vue) {
    Vue.component("router-link", {
      props: {
        to: String,
      },
      template: '<a :href="to"><slot></slot></a>',
    });
  }
```

我们通过`Vue.component`来创建`router-link`这个组件，同时通过`props`接收`to`属性传递过来的值，并且对应的类型为字符串。

最终渲染的模板是一个`a`标签，**`href`属性绑定了`to`属性的值**，同时使用`<slot>`插槽作为占位符，用具体的文字内容填充该占位符。

在 VueRoute 对象创建成功后，并且将`VueRouter`对象注册到`Vue`的实例上的时候，调用这两个方法。

也就是在`beforeCreate`这个钩子函数中

当然为了调用这两个方便，在这里我们又定义了`init`方法，来做了一次封装处理。

```js
  init() {
    this.createRouteMap();
    this.initComponents(_Vue);
  }
```

对`init`方法的调用如下：

```js
   beforeCreate() {
        //在创建Vue实例的时候
        // 也就是new Vue()的时候，才会有$options这个属性，
        //组件中是没有$options这个属性的。
        if (this.$options.router) {
          _Vue.prototype.$router = this.$options.router;
            //调用init
          this.$options.router.init();
        }
      },
```

this.$options.router.init();

this`表示的就是Vue实例，`$options`表示的就是在创建`Vue`的实例的时候传递的选项，如下所示：

```js
const vm = new Vue({
  el: "#app",
  router,
});
```

传递过来的选项中是有 router

router 就是 VueRouter 类的实例

`init`方法就是`VueRouter`这个类的实例方法

可以通过`this.$options.router.init()`的方式来调用

#### render 函数

完整版中的编译器的作用就是将`template`模板转成`render`函数，所以在运行时版本中我们可以自己编写`render`函数

```js
 //该方法需要一个参数为Vue的构造函数。
  //当然也可以使用全局的_Vue.
  initComponents(Vue) {
    Vue.component("router-link", {
      props: {
        to: String,
      },
      // template: '<a :href="to"><slot></slot></a>',
      render(h) {

        return h(
          "a",
          {
            attrs: {
              href: this.to,
            },
          },
          [this.$slots.default]
        );
      },
    });
  }
```

#### 创建`router-view`组件

router-view`组件就是一个占位符。当根据路由规则找到组件后，会渲染到`router-view`的位置。

在`initComponents`方法中创建`router-view`组件

```js
 //该方法需要一个参数为Vue的构造函数。
  //当然也可以使用全局的_Vue.
  initComponents(Vue) {
    Vue.component("router-link", {
      props: {
        to: String,
      },
      // template: '<a :href="to"><slot></slot></a>',
      render(h) {

        return h(
          "a",
          {
            attrs: {
              href: this.to,
            },
          },
          [this.$slots.default]
        );
      },
    });
    const self = this;//修改this的指向
    Vue.component("router-view", {
      render(h) {
        //根据当前的路径从routeMap中查找对应的组件.
        const component = self.routeMap[self.data.current];
        //将组件转换成虚拟dom
        return h(component);
      },
    });
  }
```

当我们单击链接的时候，发现了浏览器进行了刷新操作。表明向服务器发送了请求，而我们单页面应用中是不希望向服务器发送请求。

```js
 //该方法需要一个参数为Vue的构造函数。
  //当然也可以使用全局的_Vue.
  initComponents(Vue) {
    Vue.component("router-link", {
      props: {
        to: String,
      },
      // template: '<a :href="to"><slot></slot></a>',
      render(h) {

        return h(
          "a",
          {
            attrs: {
              href: this.to,
            },
            on: {
              click: this.clickHandler,
            },
          },
          [this.$slots.default]
        );
      },
      methods: {
        clickHandler(e) {

          history.pushState({}, "", this.to);

          this.$router.data.current = this.to;

          //阻止向服务器发送器。
          e.preventDefault();
        },
      },
    });
    const self = this;
    Vue.component("router-view", {
      render(h) {
        //根据当前的路径从routeMap中查找对应的组件.
        const component = self.routeMap[self.data.current];
        //将组件转换成虚拟dom
        return h(component);
      },
    });
  }
```

#### initEvent 方法实现

当点击浏览器中的后退与前进按钮的时候，地址栏中的地址发生了变化，但是对应的组件没有发生变化。

这时候要解决这个问题， 就需要用到`popstate`事件

`popstate`事件，可以发现浏览器历史操作的变化，记录改变后的地址，单击前进或者是后退按钮的时候触发该事件

```js
initEvent() {
    window.addEventListener("popstate", () => {

      this.data.current = window.location.pathname;
    });
  }
```

```js
init() {
    this.createRouteMap();
    this.initComponents(_Vue);
    this.initEvent();
  }
```
