---
sidebar_position: 7
description: Virtual DOM
---

## Virtual DOM

所谓的 virtual dom，也就是虚拟节点。它通过 JS 的 Object 对象模拟 DOM 中的节点，然后再通过特定的 render 方法将其渲染成真实的 DOM 节点 dom diff 则是通过 JS 层面的计算，返回一个 patch 对象，即补丁对象，在通过特定的操作解析 patch 对象，完成页面的重新渲染![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs/202208202301988.webp)

### 1.如何理解虚拟 DOM

从本质上来说，Virtual Dom 是一个 JavaScript 对象，通过对象的方式来表示 DOM 结构。将页面的状态抽象为 JS 对象的形式，配合不同的渲染工具，使跨平台渲染成为可能。通过事务处理机制，将多次 DOM 修改的结果一次性的更新到页面上，从而有效的减少页面渲染的次数，减少修改 DOM 的重绘重排次数，提高渲染性能。**保障了性能的下限**

虚拟 DOM 是对 DOM 的抽象，这个对象是更加轻量级的对 DOM 的描述。它设计的最初目的，**就是更好的跨平台**，比如 Node.js 就没有 DOM，如果想实现 SSR，那么一个方式就是借助虚拟 DOM，因为虚拟 DOM 本身是 js 对象。 在代码渲染到页面之前，vue 会把代码转换成一个对象（虚拟 DOM）。以对象的形式来描述真实 DOM 结构，最终渲染到页面。在每次数据发生变化前，虚拟 DOM 都会缓存一份，变化之时，现在的虚拟 DOM 会与缓存的虚拟 DOM 进行比较。在 vue 内部封装了 diff 算法，通过这个算法来进行比较，渲染时修改改变的变化，原先没有发生改变的通过原先的数据进行渲染。

另外现代前端框架的一个基本要求就是无须手动操作 DOM，一方面是因为手动操作 DOM 无法保证程序性能，多人协作的项目中如果 review 不严格，可能会有开发者写出性能较低的代码，另一方面更重要的是省略手动 DOM 操作可以大大提高开发效率。

**为什么使用 Virtual DOM**

- 手动操作 `DOM` 比较麻烦，还需要考虑浏览器兼容性问题，虽然有 `jQuery` 等库简化 `DOM` 操作，但是随着项目的复杂 DOM 操作复杂提升
- 为了简化 `DOM` 的复杂操作于是出现了各种 `MVVM` 框架，`MVVM` 框架解决了视图和状态的同步问题
- 为了简化视图的操作我们可以使用模板引擎，但是模板引擎没有解决跟踪状态变化的问题，于是`Virtual DOM` 出现了
- `Virtual DOM` 的好处是当状态改变时不需要立即更新 DOM，只需要创建一个虚拟树来描述`DOM`，`Virtual DOM` 内部将弄清楚如何有效(`diff`)的更新 `DOM`
- 虚拟 `DOM` 可以维护程序的状态，跟踪上一次的状态
- 通过比较前后两次状态的差异更新真实 `DOM`

**为什么 Svelte 不使用虚拟 dom,性能却好？**

Svelte 是一个构建 web 应用程序的工具，与 React 和 Vue 等 JavaScript 框架类似，都怀揣着一颗让构建交互式用户界面变得更容易的心。

但是有一个关键的区别：**Svelte 在 _构建/编译阶段_ 将你的应用程序转换为理想的 JavaScript 应用，而不是在 _运行阶段_ 解释应用程序的代码**。这意味着你不需要为框架所消耗的性能付出成本，并且在应用程序首次加载时没有额外损失。

许多人在学习 react 或者 vue 时可能听说过诸如“虚拟 dom 很快”之类的言论，所以看到这里就会疑惑，svelte 没有虚拟 dom，为什么反而更快呢？

这其实是一个误区，**react 和 vue 等框架实现虚拟 dom 的最主要的目的不是性能，而是为了掩盖底层 dom 操作，让用户通过声明式的、基于状态驱动 UI 的方式去构建我们的应用程序，提高代码的可维护性**。

另外 react 或者 vue 所说的虚拟 dom 的性能好，**是指我们在没有对页面做特殊优化的情况下，框架依然能够提供不错的性能保障**。例如以下场景，我们每次从服务端接收数据后就重新渲染列表，如果我们通过普通 dom 操作不做特殊优化，每次都重新渲染所有列表项，性能消耗比较高。而像 react 等框架会通过 key 对列表项做标记，只对发生变化的列表项重新渲染，如此一来性能便提高了。

如果我们操作真实 dom 时也对列表项做标记，只对发生变化的列表项重新渲染，省去了虚拟 dom diff 等环节，那么性能是比虚拟 dom 还要高的。

svelte 便实现了这种优化，通过将数据和真实 dom 的映射关系，在编译的时候通过 ast 计算并保存起来，数据发生变动时直接更新 dom，由于不依赖虚拟 dom，初始化和更新时都都十分迅速

> 真实 DOM 结构

```html
<div class="container">
  <p>哈哈</p>
  <ul class="list">
    <li>1</li>
    <li>2</li>
  </ul>
</div>
```

```js


{
  // 选择器
  "sel": "div",
  // 数据
  "data": {
    "class": { "container": true }
  },
  // DOM
  "elm": undefined,
  // 和 Vue :key 一样是一种优化
  "key": undefined,
  // 子节点
  "children": [
    {
      "elm": undefined,
      "key": undefined,
      "sel": "p",
      "data": { "text": "哈哈" }
    },
    {
      "elm": undefined,
      "key": undefined,
      "sel": "ul",
      "data": {
        "class": { "list": true }
      },
      "children": [
        {
          "elm": undefined,
          "key": undefined,
          "sel": "li",
          "data": {
            "text": "1"
          },
          "children": undefined
        },
        {
          "elm": undefined,
          "key": undefined,
          "sel": "li",
          "data": {
            "text": "1"
          },
          "children": undefined
        }
      ]
    }
  ]
}


```

#### VNode 的实例对象

一个 VNode 的实例对象包含了以下属性

- `tag`: 当前节点的标签名
- `data`: 当前节点的数据对象，具体包含哪些字段可以参考 vue 源码`types/vnode.d.ts`中对`VNodeData`的定义
  ![clipboard.png](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs6lpF9OrxEYutqI7.png)
- `children`: 数组类型，包含了当前节点的子节点
- `text`: 当前节点的文本，一般文本节点或注释节点会有该属性
- `elm`: 当前虚拟节点对应的真实的 dom 节点
- `ns`: 节点的 namespace
- `context`: 编译作用域
- `functionalContext`: 函数化组件的作用域
- `key`: 节点的 key 属性，用于作为节点的标识，有利于 patch 的优化
- `componentOptions`: 创建组件实例时会用到的选项信息
- `child`: 当前节点对应的组件实例
- `parent`: 组件的占位节点
- `raw`: raw html
- `isStatic`: 静态节点的标识
- `isRootInsert`: 是否作为根节点插入，被`<transition>`包裹的节点，该属性的值为`false`
- `isComment`: 当前节点是否是注释节点
- `isCloned`: 当前节点是否为克隆节点
- `isOnce`: 当前节点是否有`v-once`指令

#### VNode 分类

![clipboard.png](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs/202208202301734.png)

`VNode`可以理解为 vue 框架的虚拟 dom 的基类，通过`new`实例化的`VNode`大致可以分为几类

- `EmptyVNode`: 没有内容的注释节点
- `TextVNode`: 文本节点
- `ElementVNode`: 普通元素节点
- `ComponentVNode`: 组件节点
- `CloneVNode`: 克隆节点，可以是以上任意类型的节点，唯一的区别在于`isCloned`属性为`true`

#### 虚拟 DOM 和 AST 区别和联系

ST 语法树概念

> 象语法树 (Abstract Syntax Tree)，简称 AST，它是源代码语法结构的一种抽象表示。 它以树状的形式表现编程语言的语法结构，树上的每个节点都表示源代码中的一种结构。

虚拟 DOM 概念

> Virtual DOM (虚拟 DOM)，是由**普通的 JS 对象来描述 DOM 对象**，因为不是真实的 DOM 对象，所以叫 Virtual DOM

通过概念可以总结：AST 是对原生语法结构的描述，虚拟 DOM 是对于 DOM 节点的描述，两者共同点都是使用对象来进行描述

现在有这个一段 HTML

```html
<div id="app">
  <p>{{name}}</p>
</div>
```

在`Vue`中生成的对应 AST

```js
{
  "type": 1,
  "tag": "div",
  "attrsList": [
    {
      "name": "id",
      "value": "app",
      "start": 5,
      "end": 13
    }
  ],
  "attrsMap": {
    "id": "app"
  },
  "rawAttrsMap": {
    "id": {
      "name": "id",
      "value": "app",
      "start": 5,
      "end": 13
    }
  },
  "children": [
    {
      "type": 1,
      "tag": "p",
      "attrsList": [],
      "attrsMap": {},
      "rawAttrsMap": {},
      "parent": "[Circular ~]",
      "children": [
        {
          "type": 2,
          "expression": "_s(name)",
          "tokens": [
            {
              "@binding": "name"
            }
          ],
          "text": "{{name}}",
          "start": 22,
          "end": 30,
          "static": false
        }
      ],
      "start": 19,
      "end": 34,
      "plain": true,
      "static": false,
      "staticRoot": false
    }
  ],
  "start": 0,
  "end": 41,
  "plain": false,
  "attrs": [
    {
      "name": "id",
      "value": "\"app\"",
      "start": 5,
      "end": 13
    }
  ],
  "static": false,
  "staticRoot": false
}
```

在`Vue`中生成的对应`render`函数

```js
_c(
  "div",
  {
    attrs: {
      id: "app",
    },
  },
  [_c("p", [_v(_s(name))])]
);
```

虚拟 DOM 通过调用`render`函数中的`_c`、`_v`等函数创建,最终形式如下图

![image.png](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs/202208202302640.webp)

### 2.Diff 算法

[精简版](https://juejin.cn/post/6986463124358430756)

#### 基本比较

在新老虚拟 DOM 对比时：

- 首先，对比节点本身，判断是否为同一节点，如果不为相同节点，则删除该节点重新创建节点进行替换
- 如果为相同节点，进行 patchVnode，判断如何对该节点的子节点进行处理，先判断一方有子节点一方没有子节点的情况(如果新的 children 没有子节点，将旧的子节点移除)
- 比较如果都有子节点，则进行 updateChildren，判断如何对这些新老节点的子节点进行操作（diff 核心）。
- 匹配时，找到相同的子节点，递归比较子节点

在 diff 中，只对同层的子节点进行比较，放弃跨级的节点比较，使得时间复杂从 O(n3)降低值 O(n)，也就是说，只有当新旧 children 都为多个子节点时才需要用核心的 Diff 算法进行同层级比较。

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs/202208202302417.webp)

> Diff 算法真的很美，整个流程如下图所示：

![diffvue2](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs/202208202302162.png)

**一、 首先比较一下新旧节点是不是同一个节点（可通过比较 sel（选择器）和 key（唯一标识）值是不是相同），不是同一个节点则进行暴力删除（注：先以旧节点为基准插入新节点，然后再删除旧节点）。**

**二、 若是同一个节点则需要进一步比较**

1. 完全相同，不做处理
2. 新节点内容为文本，直接替换完事
3. 新节点有子节点，这个时候就要仔细考虑一下了:若老节点没有子元素，则直接清空老节点，将新节点的子元素插入即可；若老节点有子元素则就需要按照上述的更新策略老搞定了

我们把旧节点的一个元素称为旧前节点 旧节点的最后一个元素称为旧后节点
新节点的一个元素称为新前节点 新节点的最后一个元素称为新后节点
精细化比较主要分为五种情况

1. 旧前节点 === 新前节点
2. 旧后节点 === 新后节点
3. 新后节点 === 旧前节点
4. 新前节点 === 旧后节点
5. 以上四种情况都不满足，遍历旧节点所有子元素，寻找是否有新节点的元素

以上五种情况顺序执行。满足其中一种情况，后续的就不在比较，就会去下一个节点进行比较

#### vue2 双端比较

所谓`双端比较`就是**新列表**和**旧列表**两个列表的头与尾互相对比，，在对比的过程中指针会逐渐向内靠拢，直到某一个列表的节点全部遍历过，对比停止。

我们先用四个指针指向两个列表的头尾

```js
function vue2Diff(prevChildren, nextChildren, parent) {
  let oldStartIndex = 0,
    oldEndIndex = prevChildren.length - 1;
  (newStartIndex = 0), (newEndIndex = nextChildren.length - 1);
  let oldStartNode = prevChildren[oldStartIndex],
    oldEndNode = prevChildren[oldEndIndex],
    newStartNode = nextChildren[nextStartIndex],
    newEndNode = nextChildren[nextEndIndex];
}
```

我们根据四个指针找到四个节点，然后进行对比，那么如何对比呢？我们按照以下四个步骤进行对比

1.  使用**旧列表**的头一个节点`oldStartNode`与**新列表**的头一个节点`newStartNode`对比
2.  使用**旧列表**的最后一个节点`oldEndNode`与**新列表**的最后一个节点`newEndNode`对比
3.  使用**旧列表**的头一个节点`oldStartNode`与**新列表**的最后一个节点`newEndNode`对比
4.  使用**旧列表**的最后一个节点`oldEndNode`与**新列表**的头一个节点`newStartNode`对比

使用以上四步进行对比，去寻找`key`相同的可复用的节点，当在某一步中找到了则停止后面的寻找。具体对比顺序如下图

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs/202208202302431.webp)

对比顺序代码结构如下:

```js
function vue2Diff(prevChildren, nextChildren, parent) {
  let oldStartIndex = 0,
    oldEndIndex = prevChildren.length - 1;
  (newStartIndex = 0), (newEndIndex = nextChildren.length - 1);
  let oldStartNode = prevChildren[oldStartIndex],
    oldEndNode = prevChildren[oldEndIndex],
    newStartNode = nextChildren[newStartIndex],
    newEndNode = nextChildren[newEndIndex];

  if (oldStartNode.key === newStartNode.key) {
  } else if (oldEndNode.key === newEndNode.key) {
  } else if (oldStartNode.key === newEndNode.key) {
  } else if (oldEndNode.key === newStartNode.key) {
  }
}
```

当对比时找到了可复用的节点，我们还是先`patch`给元素打补丁，然后将指针进行`前/后移`一位指针。

根据对比节点的不同，我们移动的**指针**和**方向**也不同，具体规则如下：

1.  当**旧列表**的头一个节点`oldStartNode`与**新列表**的头一个节点`newStartNode`对比时`key`相同。那么**旧列表**的头指针`oldStartIndex`与**新列表**的头指针`newStartIndex`同时向**后**移动一位。 **旧前比新前 后移**
2.  当**旧列表**的最后一个节点`oldEndNode`与**新列表**的最后一个节点`newEndNode`对比时`key`相同。那么**旧列表**的尾指针`oldEndIndex`与**新列表**的尾指针`newEndIndex`同时向**前**移动一位。 **旧后比新后 前移**
3.  当**旧列表**的头一个节点`oldStartNode`与**新列表**的最后一个节点`newEndNode`对比时`key`相同。那么**旧列表**的头指针`oldStartIndex`向**后**移动一位；**新列表**的尾指针`newEndIndex`向**前**移动一位。 **旧前比新后** 远离
4.  当**旧列表**的最后一个节点`oldEndNode`与**新列表**的头一个节点`newStartNode`对比时`key`相同。那么**旧列表**的尾指针`oldEndIndex`向**前**移动一位；**新列表**的头指针`newStartIndex`向**后**移动一位。 **旧后比新前** 靠近

在小节的开头，提到了要让指针向内靠拢，所以我们需要循环。循环停止的条件是当其中一个列表的节点全部遍历完成，代码如下

```js
function vue2Diff(prevChildren, nextChildren, parent) {
  let oldStartIndex = 0,
    oldEndIndex = prevChildren.length - 1,
    newStartIndex = 0,
    newEndIndex = nextChildren.length - 1;
  let oldStartNode = prevChildren[oldStartIndex],
    oldEndNode = prevChildren[oldEndIndex],
    newStartNode = nextChildren[newStartIndex],
    newEndNode = nextChildren[newEndIndex];
  while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
    if (oldStartNode.key === newStartNode.key) {
      patch(oldStartNode, newStartNode, parent);

      oldStartIndex++;
      newStartIndex++;
      oldStartNode = prevChildren[oldStartIndex];
      newStartNode = nextChildren[newStartIndex];
    } else if (oldEndNode.key === newEndNode.key) {
      patch(oldEndNode, newEndNode, parent);

      oldEndIndex--;
      newndIndex--;
      oldEndNode = prevChildren[oldEndIndex];
      newEndNode = nextChildren[newEndIndex];
    } else if (oldStartNode.key === newEndNode.key) {
      patch(oldvStartNode, newEndNode, parent);

      oldStartIndex++;
      newEndIndex--;
      oldStartNode = prevChildren[oldStartIndex];
      newEndNode = nextChildren[newEndIndex];
    } else if (oldEndNode.key === newStartNode.key) {
      patch(oldEndNode, newStartNode, parent);

      oldEndIndex--;
      newStartIndex++;
      oldEndNode = prevChildren[oldEndIndex];
      newStartNode = nextChildren[newStartIndex];
    }
  }
}
```

##### 非理想情况

有一种特殊情况，当四次对比都**没找到**复用节点时，我们只能拿**新列表**的第一个节点去**旧列表**中找与其`key`相同的节点

```js
function vue2Diff(prevChildren, nextChildren, parent) {
  //...
  while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
    if (oldStartNode.key === newStartNode.key) {
      //...
    } else if (oldEndNode.key === newEndNode.key) {
      //...
    } else if (oldStartNode.key === newEndNode.key) {
      //...
    } else if (oldEndNode.key === newStartNode.key) {
      //...
    } else {
      // 在旧列表中找到 和新列表头节点key 相同的节点
      let newKey = newStartNode.key,
        oldIndex = prevChildren.findIndex((child) => child.key === newKey);
    }
  }
}
```

找节点的时候其实会有两种情况：一种在**旧列表**中找到了，另一种情况是没找到

当我们在旧列表中找到对应的`VNode`，我们只需要将找到的节点的`DOM`元素，移动到开头就可以了。这里的逻辑其实和`第四步`的逻辑是一样的，只不过`第四步`是移动的尾节点，这里是移动找到的节点。`DOM`移动后，由我们将**旧列表**中的节点改为`undefined`，这是**至关重要**的一步，因为我们已经做了节点的移动了所以我们不需要进行再次的对比了。最后我们将头指针`newStartIndex`向后移一位

如果在**旧列表**中没有找到复用节点呢？很简单，直接创建一个新的节点放到最前面就可以了，然后后**移头指针`newStartIndex`**。

最后当**旧列表**遍历到`undefind`时就跳过当前节点。

```javascript
if (newStartVNode.key === oldStartVNode.key) {
  // 第一步
} else if (newEndVNode.key === oldEndVNode.key) {
  // 第二步
} else if (newEndVNode.key === oldStartVNode.key) {
  // 第三步
} else if ((newStartVNode.key = oldEndVNode.key)) {
  // 第四步
} else {
  // 特殊情况
  const idxInOld = oldChildren.findIndex(
    (node) => node.key === newStartVNode.key
  );
  if (idxInOld > 0) {
    const vnodeToMove = oldChildren[idxInOld];
    patch(vnodeToMove, newStartVNode, container); // 补丁修改不同
    insert(vnodeToMove.el, container, oldStartVNode.el); // 移动dom到旧节点第一个前面
    oldChildren[idxInOld] = undefined; // 将旧节点设置为undefined
    newStartVNode = newChildren[++newStartIdx]; // 更新索引值，指向下一个节点
  }
}
```

##### 添加节点

此时`oldEndIndex`以及小于了`oldStartIndex`，但是**新列表**中还有剩余的节点，我们只需要将剩余的节点依次插入到`oldStartNode`的`DOM`之前就可以了。为什么是插入`oldStartNode`之前呢？原因是剩余的节点在**新列表**的位置是位于`oldStartNode`之前的，如果剩余节点是在`oldStartNode`之后，`oldStartNode`就会先行对比，这个需要思考一下，其实还是与`第四步`的思路一样。

##### 移除节点

与上一小节的情况相反，当**新列表**的`newEndIndex`小于`newStartIndex`时，我们将**旧列表**剩余的节点删除即可。这里我们需要注意，**旧列表**的`undefind`。在第二小节中我们提到过，当头尾节点都不相同时，我们会去**旧列表**中找**新列表**的第一个节点，移动完 DOM 节点后，将**旧列表**的那个节点改为`undefind`。所以我们在最后的删除时，需要注意这些`undefind`，遇到的话跳过当前循环即可。

#### vue3 最长递增子序列

其实就简单的看一眼我们就能发现，这两段文字是有**一部分是相同**的，**这些文字是不需要修改也不需要移动的**，真正需要进行修改中间的几个字母，所以`diff`就变成以下部分

```js
text1: "llo";
text2: "y";
```

接下来换成`vnode`，我们以下图为例。

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs/202208202302522.webp)

图中的**被绿色框起来的节点，他们是不需要移动的，只需要进行打补丁`patch`就可以了**。我们把该逻辑写成代码。

```js
function vue3Diff(prevChildren, nextChildren, parent) {
  let j = 0,
    prevEnd = prevChildren.length - 1,
    nextEnd = nextChildren.length - 1,
    prevNode = prevChildren[j],
    nextNode = nextChildren[j];
  while (prevNode.key === nextNode.key) {
    patch(prevNode, nextNode, parent);
    j++;
    prevNode = prevChildren[j];
    nextNode = nextChildren[j];
  }

  prevNode = prevChildren[prevEnd];
  nextNode = prevChildren[nextEnd];

  while (prevNode.key === nextNode.key) {
    patch(prevNode, nextNode, parent);
    prevEnd--;
    nextEnd--;
    prevNode = prevChildren[prevEnd];
    nextNode = prevChildren[nextEnd];
  }
}
```

这时候，我们就需要考虑边界情况了，这里有两种情况。一种是`j > prevEnd`；另一种是`j > nextEnd`。

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs/202208202302866.webp)

我们以这张图为例，**此时`j > prevEnd`且`j <= nextEnd`，我们只需要把新列表中`j`到`nextEnd`之间剩下的节点插入进去就可以了。相反， 如果`j > nextEnd`时，我们把旧列表中`j`到`prevEnd`之间的节点删除**就可以了。

```js
function vue3Diff(prevChildren, nextChildren, parent) {
  // ...
  if (j > prevEnd && j <= nextEnd) {
    let nextpos = nextEnd + 1,
      refNode =
        nextpos >= nextChildren.length ? null : nextChildren[nextpos].el;
    while (j <= nextEnd) mount(nextChildren[j++], parent, refNode);
  } else if (j > nextEnd && j <= prevEnd) {
    while (j <= prevEnd) parent.removeChild(prevChildren[j++].el);
  }
}
```

我们再继续思考，在我们`while`循环时，指针是从两端向内逐渐靠拢的，所以我们应该在循环中就应该去判断边界情况，我们使用`label`语法，当我们触发边界情况时，退出全部的循环，直接进入判断。代码如下：

```js
function vue3Diff(prevChildren, nextChildren, parent) {
  let j = 0,
    prevEnd = prevChildren.length - 1,
    nextEnd = nextChildren.length - 1,
    prevNode = prevChildren[j],
    nextNode = nextChildren[j];
  // label语法
  outer: {
    while (prevNode.key === nextNode.key) {
      patch(prevNode, nextNode, parent);
      j++;
      // 循环中如果触发边界情况，直接break，执行outer之后的判断
      if (j > prevEnd || j > nextEnd) break outer;
      prevNode = prevChildren[j];
      nextNode = nextChildren[j];
    }

    prevNode = prevChildren[prevEnd];
    nextNode = prevChildren[nextEnd];

    while (prevNode.key === nextNode.key) {
      patch(prevNode, nextNode, parent);
      prevEnd--;
      nextEnd--;
      // 循环中如果触发边界情况，直接break，执行outer之后的判断
      if (j > prevEnd || j > nextEnd) break outer;
      prevNode = prevChildren[prevEnd];
      nextNode = prevChildren[nextEnd];
    }
  }

  // 边界情况的判断
  if (j > prevEnd && j <= nextEnd) {
    let nextpos = nextEnd + 1,
      refNode =
        nextpos >= nextChildren.length ? null : nextChildren[nextpos].el;
    while (j <= nextEnd) mount(nextChildren[j++], parent, refNode);
  } else if (j > nextEnd && j <= prevEnd) {
    while (j <= prevEnd) parent.removeChild(prevChildren[j++].el);
  }
}
```

##### 判断是否需要移动

其实几个算法看下来，套路已经很明显了，**就是找到移动的节点，然后给他移动到正确的位置。把该加的新节点添加好，把该删的旧节点删了，整个算法就结束了**。这个算法也不例外，我们接下来看一下它是如何做的。

当`前/后置`的预处理结束后，我们进入真正的`diff`环节。首先，我们先根据**新列表**剩余的节点数量，创建一个`source`数组，并将数组填满`-1`。

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs/202208202302428.webp)

我们先写这块逻辑。

```js
function vue3Diff(prevChildren, nextChildren, parent) {
  //...
  outer: {
    // ...
  }

  // 边界情况的判断
  if (j > prevEnd && j <= nextEnd) {
    // ...
  } else if (j > nextEnd && j <= prevEnd) {
    // ...
  } else {
    let prevStart = j,
      nextStart = j,
      nextLeft = nextEnd - nextStart + 1, // 新列表中剩余的节点长度
      source = new Array(nextLeft).fill(-1); // 创建数组，填满-1
  }
}
```

那么这个`source`数组，是要做什么的呢？他就是来做新旧节点的对应关系的，我们将**新节点**在**旧列表**的位置存储在该数组中，我们在根据`source`计算出它的`最长递增子序列`用于移动 DOM 节点。为此，我们先建立一个对象存储当前**新列表**中的`节点`与`index`的关系，再去**旧列表**中去找位置。

在找节点时要注意，**如果旧节点在新列表中没有的话，直接删除就好**。除此之外，我们还需要一个数量表示记录我们已经`patch`过的节点，如果数量已经与**新列表**剩余的节点数量一样，那么剩下的`旧节点`我们就直接删除了就可以了

```js
function vue3Diff(prevChildren, nextChildren, parent) {
  //...
  outer: {
    // ...
  }

  // 边界情况的判断
  if (j > prevEnd && j <= nextEnd) {
    // ...
  } else if (j > nextEnd && j <= prevEnd) {
    // ...
  } else {
    let prevStart = j,
      nextStart = j,
      nextLeft = nextEnd - nextStart + 1, // 新列表中剩余的节点长度
      source = new Array(nextLeft).fill(-1), // 创建数组，填满-1
      nextIndexMap = {}, // 新列表节点与index的映射
      patched = 0; // 已更新过的节点的数量

    // 保存映射关系
    for (let i = nextStart; i <= nextEnd; i++) {
      let key = nextChildren[i].key;
      nextIndexMap[key] = i;
    }

    // 去旧列表找位置
    for (let i = prevStart; i <= prevEnd; i++) {
      let prevNode = prevChildren[i],
        prevKey = prevNode.key,
        nextIndex = nextIndexMap[prevKey];
      // 新列表中没有该节点 或者 已经更新了全部的新节点，直接删除旧节点
      if (nextIndex === undefind || patched >= nextLeft) {
        parent.removeChild(prevNode.el);
        continue;
      }
      // 找到对应的节点
      let nextNode = nextChildren[nextIndex];
      patch(prevNode, nextNode, parent);
      // 给source赋值
      source[nextIndex - nextStart] = i;
      patched++;
    }
  }
}
```

![img](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs/202208202302039.webp)

找到位置后，我们观察这个重新赋值后的`source`，我们可以看出，如果是全新的节点的话，其在`source`数组中对应的值就是初始的`-1`，通过这一步我们可以区分出来哪个为全新的节点，哪个是可复用的。

其次，我们要判断是否需要移动。那么如何判断移动呢？很简单，和`React`一样我们用递增法，如果我们找到的`index`是一直递增的，说明不需要移动任何节点。我们通过设置一个变量来保存是否需要移动的状态。

```js
function vue3Diff(prevChildren, nextChildren, parent) {
  //...
  outer: {
    // ...
  }

  // 边界情况的判断
  if (j > prevEnd && j <= nextEnd) {
    // ...
  } else if (j > nextEnd && j <= prevEnd) {
    // ...
  } else {
    let prevStart = j,
      nextStart = j,
      nextLeft = nextEnd - nextStart + 1, // 新列表中剩余的节点长度
      source = new Array(nextLeft).fill(-1), // 创建数组，填满-1
      nextIndexMap = {}, // 新列表节点与index的映射
      patched = 0,
      move = false, // 是否移动
      lastIndex = 0; // 记录上一次的位置

    // 保存映射关系
    for (let i = nextStart; i <= nextEnd; i++) {
      let key = nextChildren[i].key;
      nextIndexMap[key] = i;
    }

    // 去旧列表找位置
    for (let i = prevStart; i <= prevEnd; i++) {
      let prevNode = prevChildren[i],
        prevKey = prevNode.key,
        nextIndex = nextIndexMap[prevKey];
      // 新列表中没有该节点 或者 已经更新了全部的新节点，直接删除旧节点
      if (nextIndex === undefind || patched >= nextLeft) {
        parent.removeChild(prevNode.el);
        continue;
      }
      // 找到对应的节点
      let nextNode = nextChildren[nextIndex];
      patch(prevNode, nextNode, parent);
      // 给source赋值
      source[nextIndex - nextStart] = i;
      patched++;

      // 递增方法，判断是否需要移动
      if (nextIndex < lastIndex) {
        move = false;
      } else {
        lastIndex = nextIndex;
      }
    }

    if (move) {
      // 需要移动
    } else {
      //不需要移动
    }
  }
}
```

然而在`vue3.0`中，我们需要的是最长递增子序列在原本数组中的索引。所以我们还需要在创建一个数组用于保存每个值的最长子序列所对应在数组中的`index`

在 vue2 中是通过对旧节点列表建立一个 `{ key, oldVnode }`的映射表，然后遍历新节点列表的剩余节点，根据`newVnode.key`在旧映射表中寻找可复用的节点，然后打补丁并且移动到正确的位置。

而在 vue3 中是**建立一个存储新节点数组中的剩余节点在旧节点数组上的索引的映射关系数组**，建立完成这个数组后也即找到了**可复用的节点**，然后通过这个**数组计算得到最长递增子序列**，这个序列中的节点保持不动，然后将**新节点数组中的剩余节点移动到正确的位置**。

##### DOM 如何移动

判断完是否需要移动后，我们就需要考虑如何移动了。一旦需要进行 DOM 移动，我们首先要做的就是找到`source`的**最长递增子序列**。

从后向前进行遍历`source`每一项。此时会出现三种情况：

1. 当前的值为`-1`，这说明该节点是全新的节点，又由于我们是**从后向前**遍历，我们直接创建好 DOM 节点插入到队尾就可以了。
2. 当前的索引为`最长递增子序列`中的值，也就是`i === seq[j]`，这说说明该节点不需要移动
3. 当前的索引不是`最长递增子序列`中的值，那么说明该 DOM 节点需要移动，这里也很好理解，我们也是直接将 DOM 节点插入到队尾就可以了，因为队尾是排好序的。

![image.png](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs/202208202302120.webp)

```js
function vue3Diff(prevChildren, nextChildren, parent) {
  //...
  if (move) {
	const seq = lis(source); // [0, 1]
    let j = seq.length - 1;  // 最长子序列的指针
    // 从后向前遍历
    for (let i = nextLeft - 1； i >= 0; i--) {
      let pos = nextStart + i, // 对应新列表的index
        nextNode = nextChildren[pos],	// 找到vnode
      	nextPos = pos + 1，    // 下一个节点的位置，用于移动DOM
        refNode = nextPos >= nextChildren.length ? null : nextChildren[nextPos].el, //DOM节点
        cur = source[i];  // 当前source的值，用来判断节点是否需要移动

      if (cur === -1) {
        // 情况1，该节点是全新节点
      	mount(nextNode, parent, refNode)
      } else if (cur === seq[j]) {
        // 情况2，是递增子序列，该节点不需要移动
        // 让j指向下一个
        j--
      } else {
        // 情况3，不是递增子序列，该节点需要移动
        parent.insetBefore(nextNode.el, refNode)
      }
    }
  } else {
    //不需要移动: 我们只需要判断是否有全新的节点【其在source数组中对应的值就是初始的-1】，给他添加进去
    for (let i = nextLeft - 1； i >= 0; i--) {
      let cur = source[i];  // 当前source的值，用来判断节点是否需要移动

      if (cur === -1) {
       let pos = nextStart + i, // 对应新列表的index
          nextNode = nextChildren[pos],	// 找到vnode
          nextPos = pos + 1，    // 下一个节点的位置，用于移动DOM
          refNode = nextPos >= nextChildren.length ? null : nextChildren[nextPos].el, //DOM节点
      	mount(nextNode, parent, refNode)
      }
    }
  }
}
```

#### vue3 diff 的优化

- 事件缓存：将事件缓存，可以理解为变成静态的了
- 添加静态标记：Vue2 是全量 Diff，Vue3 是静态标记 + 非全量 Diff
- 静态提升：创建静态节点时保存，后续直接复用
- 使用最长递增子序列优化了对比流程：Vue2 里在 updateChildren() 函数里对比变更，在 Vue3 里这一块的逻辑主要在 patchKeyedChildren() 函数里，具体看下面

**事件缓存**

```javascript
<button @click="handleClick">按钮</button>

编译后结果
export function render(_ctx, _cache, $props, $setup, $data, $options) {
  return (_openBlock(), _createElementBlock("button", {
    onClick: _cache[0] || (_cache[0] = (...args) => (_ctx.handleClick && _ctx.handleClick(...args)))
  }, "按钮"))
}

```

onClick 会先读取缓存，如果缓存没有的话，就把传入的事件存到缓存里，都可以理解为变成静态节点了

**静态标记**

```javascript
export const enum PatchFlags {
  TEXT = 1 ,  // 动态文本节点
  CLASS = 1 << 1,  // 2   动态class
  STYLE = 1 << 2,  // 4   动态style
  PROPS = 1 << 3,  // 8   除去class/style以外的动态属性
  FULL_PROPS = 1 << 4,       // 16  有动态key属性的节点，当key改变时，需进行完整的diff比较
  HYDRATE_EVENTS = 1 << 5,   // 32  有监听事件的节点
  STABLE_FRAGMENT = 1 << 6,  // 64  一个不会改变子节点顺序的fragment (一个组件内多个根元素就会用fragment包裹)
  KEYED_FRAGMENT = 1 << 7,   // 128 带有key属性的fragment或部分子节点有key
  UNKEYEN_FRAGMENT = 1 << 8, // 256  子节点没有key的fragment
  NEED_PATCH = 1 << 9,       // 512  一个节点只会进行非props比较
  DYNAMIC_SLOTS = 1 << 10,   // 1024   动态slot
  HOISTED = -1,  // 静态节点
  BAIL = -2      // 表示 Diff 过程中不需要优化
}

<div id="app">
    <div>jeff</div>
    <p>{{ age }}</p>
</div>

编译结果为:
const _hoisted_1 = { id: "app" }
const _hoisted_2 = /*#__PURE__*/_createElementVNode("div", null, "jeff", -1 /* HOISTED */)

export function render(_ctx, _cache, $props, $setup, $data, $options) {
  return (_openBlock(), _createElementBlock("div", _hoisted_1, [
    _hoisted_2,
    _createElementVNode("p", null, _toDisplayString(_ctx.age), 1 /* TEXT */)
  ]))
}
```

看到上面编译结果中的 -1 和 1 了吗，这就是静态标记，这是在 Vue2 中没有的，patch 过程中就会判断这个标记来 Diff 优化流程，跳过一些静态节点对比

**静态提升**
在 Vue2 里每当触发更新的时候，不管元素是否参与更新，每次都会全部重新创建
而在 Vue3 中会把这个不参与更新的元素保存起来，只创建一次，之后在每次渲染的时候不停地复用，比如上面例子中的静态的创建一次保存起来

```javascript
const _hoisted_1 = { id: "app" };
const _hoisted_2 = /*#__PURE__*/ _createElementVNode(
  "div",
  null,
  "jeff",
  -1 /* HOISTED */
);
```

然后每次更新 age 的时候，就只创建这个动态的内容，复用上面保存的静态内容

```javascript
export function render(_ctx, _cache, $props, $setup, $data, $options) {
  return (
    _openBlock(),
    _createElementBlock("div", _hoisted_1, [
      _hoisted_2,
      _createElementVNode("p", null, _toDisplayString(_ctx.age), 1 /* TEXT */),
    ])
  );
}
```

**patchKeyedChildren**
在 Vue2 里 updateChildren 会进行

- 头和头比
- 尾和尾比
- 头和尾比
- 尾和头比
- 都没有命中的对比

在 Vue3 里 patchKeyedChildren 为

- 头和头比
- 尾和尾比
- 基于最长递增子序列进行移动/添加/删除

看个例子，比如

- 老的 children：[ a, b, c, d, e, f, g ]
- 新的 children：[ a, b, f, c, d, e, h, g ]

1、先进行头和头比，发现不同就结束循环，得到 [ a, b ]
2、再进行尾和尾比，发现不同就结束循环，得到 [ g ]
3、再保存没有比较过的节点 [ f, c, d, e, h ]，并通过 newIndexToOldIndexMap 拿到在数组里对应的下标，生成数组 [ 5, 2, 3, 4, -1 ]，-1 是老数组里没有的就说明是新增
4、然后再拿取出数组里的最长递增子序列，也就是 [ 2, 3, 4 ] 对应的节点 [ c, d, e ]
5、然后只需要把其他剩余的节点，基于 [ c, d, e ] 的位置进行移动/新增/删除就可以了

### 3.虚拟 DOM 怎么解析

![DOM的流程图 (1).png](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs/202208202303863.webp)

虚拟 DOM 的解析过程：

- 首先对将要插入到文档中的 DOM 树结构进行分析，使用 js 对象将其表示出来，比如一个元素对象，包含 TagName、props 和 Children 这些属性。然后将这个 js 对象树给保存下来，最后再将 DOM 片段插入到文档中。
- 当页面的状态发生改变，需要对页面的 DOM 的结构进行调整的时候，首先根据变更的状态，重新构建起一棵对象树，然后将这棵新的对象树和旧的对象树进行比较，记录下两棵树的的差异。
- 最后将记录的有差异的地方应用到真正的 DOM 树中去，这样视图就更新了。

### 4.patch 原理

一个 Vue 组件是如何运行起来的.

- template 模板通过编译生成 AST 树
- AST 树生成 Vue 的 render 渲染函数 有 with 的那种
- render 渲染函数结合数据返回生成 vNode(Virtual DOM Node)树
- Diff 和 Patch 后生新的 UI 界面(真实 DOM 渲染)

patch

当节点发生变化时, 对比新旧节点并进行更新。**以新的 VNode 为基准，改造旧的 oldVNode 使之成为跟新的 VNode 一样**

```js
<div>
  <h3 class="box" title="标题" data-type="3">
    你好
  </h3>
  <ul>
    <li>A</li>
    <li>B</li>
    <li>C</li>
  </ul>
</div>
```

`patch`函数的定义在`src/core/vdom/patch.js`中，我们先来看下这个函数的逻辑

`patch`函数接收 6 个参数：

- `oldVnode`: 旧的虚拟节点或旧的真实 dom 节点
- `vnode`: 新的虚拟节点
- `hydrating`: 是否要跟真是 dom 混合
- `removeOnly`: 特殊 flag，用于`<transition-group>`组件
- `parentElm`: 父节点
- `refElm`: 新节点将插入到`refElm`之前

`patch`的策略是：

1. 如果`vnode`不存在但是`oldVnode`存在，说明意图是要销毁老节点，那么就调用`invokeDestroyHook(oldVnode)`来进行销毁

2. 如果`oldVnode`不存在但是`vnode`存在，说明意图是要创建新节点，那么就调用`createElm`来创建新节点

3. 当`vnode`和`oldVnode`都存在时

   - 如果`oldVnode`和`vnode`是同一个节点，就调用`patchVnode`来进行`patch`
   - 当`vnode`和`oldVnode`不是同一个节点时，如果`oldVnode`是真实 dom 节点或`hydrating`设置为`true`，需要用`hydrate`函数将虚拟 dom 和真是 dom 进行映射，然后将`oldVnode`设置为对应的虚拟 dom，找到`oldVnode.elm`的父节点，根据 vnode 创建一个真实 dom 节点并插入到该父节点中`oldVnode.elm`的位置

   这里面值得一提的是`patchVnode`函数，因为真正的 patch 算法是由它来实现的（patchVnode 中更新子节点的算法其实是在`updateChildren`函数中实现的，为了便于理解，我统一放到`patchVnode`中来解释）。

`patchVnode`算法是：

1. 如果`oldVnode`跟`vnode`完全一致，那么不需要做任何事情
2. 如果`oldVnode`跟`vnode`都是静态节点，且具有相同的`key`，当`vnode`是克隆节点或是`v-once`指令控制的节点时，只需要把`oldVnode.elm`和`oldVnode.child`都复制到`vnode`上，也不用再有其他操作
3. 否则，如果`vnode`不是文本节点或注释节点
   - 如果`oldVnode`和`vnode`都有子节点，且 2 方的子节点不完全一致，就执行更新子节点的操作（这一部分其实是在`updateChildren`函数中实现），算法如下
     - 分别获取`oldVnode`和`vnode`的`firstChild`、`lastChild`，赋值给`oldStartVnode`、`oldEndVnode`、`newStartVnode`、`newEndVnode`
     - 如果`oldStartVnode`和`newStartVnode`是同一节点，调用`patchVnode`进行`patch`，然后将`oldStartVnode`和`newStartVnode`都设置为下一个子节点，重复上述流程
       ![clipboard.png](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs/202208202303863.webp)
     - 如果`oldEndVnode`和`newEndVnode`是同一节点，调用`patchVnode`进行`patch`，然后将`oldEndVnode`和`newEndVnode`都设置为上一个子节点，重复上述流程
       ![clipboard.png](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgsYaKR9NTWAMDEuwZ.png)
     - 如果`oldStartVnode`和`newEndVnode`是同一节点，调用`patchVnode`进行`patch`，如果`removeOnly`是`false`，那么可以把`oldStartVnode.elm`移动到`oldEndVnode.elm`之后，然后把`oldStartVnode`设置为下一个节点，`newEndVnode`设置为上一个节点，重复上述流程
       ![clipboard.png](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs/202208202303851.png)
     - 如果`newStartVnode`和`oldEndVnode`是同一节点，调用`patchVnode`进行`patch`，如果`removeOnly`是`false`，那么可以把`oldEndVnode.elm`移动到`oldStartVnode.elm`之前，然后把`newStartVnode`设置为下一个节点，`oldEndVnode`设置为上一个节点，重复上述流程
       ![clipboard.png](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs/202208202303304.png)
     - 如果以上都不匹配，就尝试在`oldChildren`中寻找跟`newStartVnode`具有相同`key`的节点，如果找不到相同`key`的节点，说明`newStartVnode`是一个新节点，就创建一个，然后把`newStartVnode`设置为下一个节点
     - 如果上一步找到了跟`newStartVnode`相同`key`的节点，那么通过其他属性的比较来判断这 2 个节点是否是同一个节点，如果是，就调用`patchVnode`进行`patch`，如果`removeOnly`是`false`，就把`newStartVnode.elm`插入到`oldStartVnode.elm`之前，把`newStartVnode`设置为下一个节点，重复上述流程
       ![clipboard.png](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs/202208202303574.png)
     - 如果在`oldChildren`中没有寻找到`newStartVnode`的同一节点，那就创建一个新节点，把`newStartVnode`设置为下一个节点，重复上述流程
     - 如果`oldStartVnode`跟`oldEndVnode`重合了，并且`newStartVnode`跟`newEndVnode`也重合了，这个循环就结束了
   - 如果只有`oldVnode`有子节点，那就把这些节点都删除
   - 如果只有`vnode`有子节点，那就创建这些子节点
   - 如果`oldVnode`和`vnode`都没有子节点，但是`oldVnode`是文本节点或注释节点，就把`vnode.elm`的文本设置为空字符串
4. 如果`vnode`是文本节点或注释节点，但是`vnode.text != oldVnode.text`时，只需要更新`vnode.elm`的文本内容就可以

### 5.虚拟 DOM 性能真的好吗

- MVVM 框架解决视图和状态同步问题

- 模板引擎可以简化视图操作,没办法跟踪状态

- 虚拟 DOM 跟踪状态变化

- 参考 github 上 virtual-dom 的动机描述

  - 虚拟 DOM 可以维护程序的状态,跟踪上一次的状态
  - 通过比较前后两次状态差异更新真实 DOM

- 跨平台使用

  - 浏览器平台渲染 DOM
  - 服务端渲染 SSR(Nuxt.js/Next.js),前端是 vue 向,后者是 react 向
  - 原生应用(Weex/React Native)
  - 小程序(mpvue/uni-app)等

- 真实 DOM 的属性很多，创建 DOM 节点开销很大

- 虚拟 DOM 只是普通 JavaScript 对象，描述属性并不需要很多，创建开销很小

- **复杂视图情况下提升渲染性能**(操作 dom 性能消耗大,减少操作 dom 的范围可以提升性能)

- **复杂视图情况下提升渲染性能**,因为`虚拟DOM+Diff算法`可以精准找到 DOM 树变更的地方,减少 DOM 的操作(重排重绘)

**（1）保证性能下限，在不进行手动优化的情况下，提供过得去的性能** 看一下页面渲染的流程：**解析 HTML -> 生成 DOM -> 生成 CSSOM -> Layout -> Paint -> Compiler** 下面对比一下修改 DOM 时真实 DOM 操作和 Virtual DOM 的过程，来看一下它们重排重绘的性能消耗 ∶

- 真实 DOM∶ 生成 HTML 字符串＋重建所有的 DOM 元素
- 虚拟 DOM∶ 生成 vNode+ DOMDiff ＋必要的 dom 更新

Virtual DOM 的更新 DOM 的准备工作耗费更多的时间，也就是 JS 层面，相比于更多的 DOM 操作它的消费是极其便宜的。尤雨溪在社区论坛中说道 ∶ 框架给你的保证是，你不需要手动优化的情况下，依然可以给你提供过得去的性能。

**（2）跨平台** Virtual DOM 本质上是 JavaScript 的对象，它可以很方便的跨平台操作，比如服务端渲染、uniapp 等。

- 首次渲染大量 DOM 时，由于多了一层虚拟 DOM 的计算，会比 innerHTML 插入慢。
- 正如它能保证性能下限，在真实 DOM 操作的时候进行针对性的优化时，还是更快的。

### 6.Vue key 的作用是什么，为什么不建议 index 做 key

vue 中 key 值的作用可以分为两种情况来考虑：

- 第一种情况是 v-if 中使用 key。由于 Vue 会尽可能高效地渲染元素，通常会复用已有元素而不是从头开始渲染。因此当使用 v-if 来实现元素切换的时候，如果切换前后含有相同类型的元素，那么这个元素就会被复用。如果是相同的 input 元素，那么切换前后用户的输入不会被清除掉，这样是不符合需求的。因此可以通过使用 key 来唯一的标识一个元素，这个情况下，使用 key 的元素不会被复用。这个时候 key 的作用是用来标识一个独立的元素。
- 第二种情况是 v-for 中使用 key。用 v-for 更新已渲染过的元素列表时，它默认使用“就地复用”的策略。如果数据项的顺序发生了改变，Vue 不会移动 DOM 元素来匹配数据项的顺序，而是简单复用此处的每个元素。因此通过为每个列表项提供一个 key 值，来以便 Vue 跟踪元素的身份，从而高效的实现复用。这个时候 key 的作用是为了高效的更新渲染虚拟 DOM。

key 是为 Vue 中 vnode 的唯一标记，通过这个 key，diff 操作可以更准确、更快速

- 更准确：因为带 key 就不是就地复用了，在 sameNode 函数 a.key === b.key 对比中可以避免就地复用的情况。所以会更加准确。
- 更快速：利用 key 的唯一性生成 map 对象来获取对应节点，比遍历方式更快

使用 index 作为 key 和没写基本上没区别，因为不管数组的顺序怎么颠倒，index 都是 0, 1, 2...这样排列，导致 Vue 会复用错误的旧子节点，做很多额外的工作。

### 7.vnode 的挂载和更新流程

在视图的渲染过程中，Vue 是如何把 vnode 解析并挂载到页面中的。我们通过一个最简单的例子来分析主要流程：

```html
<div id="app">{{someVar}}</div>

<script type="text/javascript">
  new Vue({
    el: "#app",

    data: {
      someVar: "init",
    },

    mounted() {
      setTimeout(() => (this.someVar = "changed"), 3000);
    },
  });
</script>
```

页面初始会显示 "init" 字符串，3 秒钟之后，会更新为 "changed" 字符串。

为了便于理解，将流程分为两个阶段：

1. 首次渲染，生成 vnode，并将其挂载到页面中
2. 再次渲染，根据更新后的数据，再次生成 vnode，并将其更新到页面中

#### 第一阶段

##### 流程

vm.$mount(vm.$el) => **render = compileToFunctions(template).render** => updateComponent() => **vnode = render()** => vm.\_update(vnode) => **patch(vm.$el, vnode)**

##### 说明

由 render() 方法生成 vnode，然后由 patch() 方法挂载到页面中。

##### render() 方法

render() 方法根据当前 vm 的数据生成 vnode。

该方法可以是新建 Vue 实例时传入的 render() 方法，也可以由 Vue 的 compiler 模块根据传入的 template 自动生成。

本例中该方法是由 el 属性对应的 template 生成的，代码如下：

```javascript
(function() {
    with (this) {
        return _c('div', {
            attrs: {
                "id": "app"
            }
        }, [_v("
            " + _s(someVar) + "
        ")])
    }
})
```

实例化 Vue 时传入这样的参数可以达到相似的效果（区别在于变量两边的空格）：

```javascript
new Vue({
  data: {
    someVar: "init",
  },
  render: function (createElement) {
    return createElement(
      "div",
      {
        attrs: {
          id: "app",
        },
      },
      [this.someVar]
    );
  },
  mounted() {
    setTimeout(() => (this.someVar = "changed"), 3000);
  },
}).$mount("#app");
```

##### Vnode() 类

Vnode 是虚拟 DOM 节点类，其实例 vnode 是一个包含着渲染 DOM 节点所需要的一切信息的普通对象。

上述的 render() 方法调用后会生成 vnode 对象，这是第一次生成，将其称为 initVnode，结构如下（选取部分属性）：

```javascript
{
    children: [
        {
            children: undefined,
            data: undefined,
            elm: undefined,
            tag: undefined,
            text: 'init'
        }
    ],
    data: {
        attrs: {
            id: 'app'
        }
    },
    elm: undefined,
    tag: 'div',
    text: undefined
}
```

简要介绍其属性：

1. children 是当前 vnode 的子节点（VNodes）数组，当前只有一个文本子节点
2. data 是当前 vnode 代表的节点的各种属性，是 createElement() 方法的第二个参数
3. elm 是根据 vnode 生成 HTML 元素挂载到页面中后对应的 DOM 节点，此时还没有挂载，所以为空
4. tag 是当前 vnode 对应的 html 标签
5. text 是当前 vnode 对应的文本或者注释

children 和 text 是互斥的，不会同时存在。

生成了 vnode 之后，就要根据其属性生成 DOM 元素并挂载到页面中了，这是 patch() 方法要做的事情，下面看其内部的流程：

patch(vm.$el, vnode) => createElm(vnode, [], parentElm, nodeOps.nextSibling(oldElm)) => removeVnodes(parentElm, [oldVnode], 0, 0)

##### patch(oldVnode, vnode) 方法

根据参数的不同，该方法的处理方式也不同，oldVnode 有这几种可能的取值：undefined、ELEMENT_NODE、VNode，vnode 有这几种可能的取值：undefined、VNode，所以组合起来一共是 3 \* 2 = 6 种处理方式：

| oldVnode     | vnode     | 操作                                    |
| ------------ | --------- | --------------------------------------- |
| undefined    | undefined | -                                       |
| ELEMENT_NODE | undefined | invokeDestroyHook(oldVnode)             |
| Vnode        | undefined | invokeDestroyHook(oldVnode)             |
| undefined    | Vnode     | createElm(vnode, [], parentElm, refElm) |
| ELEMENT_NODE | Vnode     | createElm(vnode, [], parentElm, refElm) |
| Vnode        | Vnode     | patchVnode(oldVnode, vnode)             |

可以看到，处理方式可以分为 3 种情况：

1. 如果 vnode 为 undefined，就要删除节点
2. 如果 oldVnode 是 undefined 或者是 DOM 节点，vnode 是 VNode 实例的话，表示是第一次渲染 vnode，调用 createElm() 方法创建新节点
3. 如果 oldVnode 和 vnode 都是 VNode 类型的话，就要调用 patchVnode() 方法来对 oldVnode 和 vnode 做进一步处理了，第二阶段流程会介绍这种情况

本阶段流程是首次渲染，符合第 2 种情况，下面看 createElm() 方法的实现：

##### createElm(vnode, [], parentElm, refElm) 方法

该方法根据 vnode 的属性创建组件或者普通 DOM 元素，有如下几种处理方式：

1. 调用 createComponent() 方法对 component 做处理，这里就不再展开讨论。
2. vnode.tag 存在：
   1. 调用 nodeOps.createElement(tag, vnode) 创建 DOM 元素，
   2. 调用 createChildren() 方法递归创建子节点。
   3. 调用 invokeCreateHooks() 方法调用生命周期相关的 create 钩子处理 vnode.data 数据
3. vnode 是文本类型，调用 nodeOps.createTextNode(vnode.text) 创建文本元素

对于 2，3 这两种情况，最后都会调用 insert() 方法将生成的 DOM 元素挂载到页面中。此时，页面的 DOM 结构如下：

```html
<body>
  <div id="app">{{someVar}}</div>
  <div id="app">init</div>
</body>
```

可以看到，原始的 DOM 元素还保留在页面中，所以在 createElm() 方法调用之后，还会调用 removeVnodes() 方法，将原始的 DOM 元素删除掉。

这样，就完成了首次视图的渲染。在这个过程中，Vue 还会做一些额外的操作：

1. 将 vnode 保存到 vm.\_vnode 属性上，供再次渲染视图时与新 vnode 做比较
2. vnode 会更新一些属性：

```javascript
{
    children: [
        {
            children: undefined,
            data: undefined,
            elm: Text, // text
            tag: undefined,
            text: 'init'
        }
    ],
    data: {
        attrs: {
            id: 'app'
        }
    },
    elm: HTMLDivElement, // div#app
    tag: 'div',
    text: undefined
}
```

可以看到，vnode 及其子节点的 elm 属性更新为了页面中对应的 DOM 节点，不再是 undefined，也是为了再次渲染时使用。

#### 第二阶段

##### 流程

updateComponent() => **vnode = render()** => vm.\_update(vnode) => **patch(oldVnode, vnode)**

第二阶段渲染时，会根据更新后的 vm 数据，再次生成 vnode 节点，称之为 updateVnode，结构如下：

```javascript
{
    children: [
        {
            children: undefined,
            data: undefined,
            elm: undefined,
            tag: undefined,
            text: 'changed'
        }
    ],
    data: {
        attrs: {
            id: 'app'
        }
    },
    elm: undefined,
    tag: 'div',
    text: undefined
}
```

可以看到， updateVnode 与 最初生成的 initVnode 的区别就是子节点的 text 属性由 init 变为了 changed，正是符合我们预期的变化。

生成新的 vnode 之后，还是要调用 patch 方法对 vnode 做处理，不过这次参数发生了变化，第一个参数不再是要挂载的 DOM 节点，而是 initVnode，本次 patch() 方法调用的流程如下：

patch(oldVnode, vnode) => patchVnode(oldVnode, vnode) => updateChildren(elm, oldCh, ch) => patchVnode(oldCh, ch) => nodeOps.setTextContent(elm, vnode.text)

其中 oldVnode 就是第一阶段保存的 vm.\_vnode，elm 就是第一阶段更新的 elm 属性。

根据上面对 patch() 方法的分析，此时 oldVnode 和 vnode 都是 VNode 类型，所以调用 patchVnode() 方法做进一步处理。

##### patchVnode(oldVnode, vnode) 方法

该方法包含两个主要流程：

1. 更新自身属性，调用 Vue 内置的组件生命周期 update 阶段的钩子方法更新节点自身的属性，类似之前的 invokeCreateHooks() 方法，这里不再展开说明
2. 更新子节点，根据子节点的不同类型调用不同的方法

根据 vnode 的 children 和 text 属性的取值，子节点有 3 种可能：

1. children 不为空，text 为空
2. children 为空，text 不为空
3. children 和 text 都为空

由于 oldVnode 和 vnode 的子节点都有 3 种可能：undefined、children 或 text，所以一共有 3 \* 3 = 9 种操作：

| oldCh     | ch        | 操作                                                                |
| --------- | --------- | ------------------------------------------------------------------- |
| children  | text      | nodeOps.setTextContent(elm, vnode.text)                             |
| text      | text      | nodeOps.setTextContent(elm, vnode.text)                             |
| undefined | text      | nodeOps.setTextContent(elm, vnode.text)                             |
| children  | children  | updateChildren(elm, oldCh, ch)                                      |
| text      | children  | setTextContent(elm, ''); addVnodes(elm, null, ch, 0, ch.length - 1) |
| undefined | children  | addVnodes(elm, null, ch, 0, ch.length - 1)                          |
| children  | undefined | removeVnodes(elm, oldCh, 0, oldCh.length - 1)                       |
| text      | undefined | nodeOps.setTextContent(elm, '')                                     |
| undefined | undefined | -                                                                   |

可以看到，大概分为这几类处理方式：

1. 如果 ch 是 text ，那么就对 DOM 节点直接设置新的文本；
2. 如果 ch 为 undefined 了，那么就清空 DOM 节点的内容
3. 如果 ch 是 children 类型，而 oldCh 是 文本或者为 undefined ，那么就是在 DOM 节点内新增节点
4. ch 和 oldCh 都是 children 类型，那么就要调用 updateChildren() 方法来更新 DOM 元素的子节点

##### updateChildren(elm, oldCh, ch) 方法

updateChildren() 方法是 Vnode 处理方法中最复杂也是最核心的方法，它主要做两件事情：

1. 递归调用 patchVnode 方法处理更下一级子节点
2. 根据各种判断条件，对页面上的 DOM 节点进行**尽可能少**的添加、移动和删除操作

下面分析方法的具体实现：

oldCh 和 ch 是代表旧和新两个 Vnode 节点序列，oldStartIdx、newStartIdx、oldEndIdx、newEndIdx 是 4 个指针，指向 oldCh 和 ch 未处理节点序列中的的开始和结束节点，指向的节点命名为 oldStartVnode、newStartVnode、oldEndVnode、newEndVnode。指针在序列中从两边向中间移动，直到 oldCh 或 ch 中的某个序列中的全部节点都处理完毕，这时，如果另一个序列尚有未处理完毕的节点，会再对这些节点进行添加或删除。

先看 while 循环，在 oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx 条件下，分为这几种情况：

1. isUndef(oldStartVnode) 和 isUndef(oldEndVnode) 在第一次循环时是不会触发的，需要后续条件才可能触发，下面会分析到
2. sameVnode(oldStartVnode, newStartVnode) 和 sameVnode(oldEndVnode, newEndVnode) 情况下不用移动 DOM 节点，只移动指针，比如：[A, B] => [A, C]
3. sameVnode(oldStartVnode, newEndVnode) 情况下，是要将 oldStartVnode 向右移动到 oldEndIdx 对应的节点后面，比如：[A, B] => [C, A]
4. sameVnode(oldEndVnode, newStartVnode) 情况下，是要将 oldEndVnode 向左移动到 oldStartIdx 对应的节点前面，比如：[A, B] => [B, C]
5. 在以上条件都不满足的情况下，就要根据 newStartVnode 的 key 属性来进一步处理：
   1. 如果 newStartVnode 没有对应到 oldCh 中的某个元素，比如：[A, B] => [C]，说明这个节点是新增加的，那么就调用 createElm() 新建节点及其子节点
   2. 如果 newStartVnode 对应到了 oldCh 中的某个元素，比如：[A, B, C] => [B, A, E]，那么就直接移动该元素到 oldStartIdx 对应的节点前面，同时还会将 oldCh 中对应的节点置为 undefined，表示元素已经处理过了，此时，oldCh == [A, undefined, C]，这样，在后续的循环中，就可以触发 isUndef(oldStartVnode) 或 isUndef(oldEndVnode) 条件了
   3. 另外，还可能会有重复 key 或者 key 相同但是 tag 等属性不同的情况，比如：[A, B, C] => [B, A, A, C]，对于这类情况，newStartVnode 也会被作为新元素处理

循环结束时，必然会满足 oldStartIdx > oldEndIdx 或 newStartIdx > newEndIdx 两种情况之一，所以对这两种情况需要进一步处理：

1. oldStartIdx > oldEndIdx 的情况，比如 [A] => [A, B, C]，循环结束时，ch 中的 B 和 C 都还没有添加到页面中，这时就会调用 addVnodes() 方法将他们依次添加
2. newStartIdx > newEndIdx 的情况，比如 [A, B, C] => [D]，循环结束时，A, B, C 都还保留在页面中，这时需要调用 removeVnodes() 将他们从页面中移除

如果循环结束时，新旧序列中的节点全部都处理完毕了，如：[A, B] => [B, A]，那么，虽然也会触发这两种逻辑之一，但是并不会对 DOM 产生实际的影响。

下面通过一些例子来展示该方法对 DOM 节点的操作流程：

[A, B] => [A, C]

| 序号 | 说明                                                                   | oldStartIdx | oldEndIdx | newStartIdx | newEndIdx | DOM     |
| ---- | ---------------------------------------------------------------------- | ----------- | --------- | ----------- | --------- | ------- |
| 0    | 初始状态                                                               | 0           | 1         | 0           | 1         | A, B    |
| 1    | 第一次循环，满足 sameVnode(oldStartVnode, newStartVnode)， 无 DOM 操作 | 1           | 1         | 1           | 1         | A, B    |
| 2    | 第二次循环，满足 isUndef(idxInOld) 条件，新增 C 到 B 之前              | 1           | 1         | 2           | 1         | A, C, B |
| 2    | 循环结束，满足 newStartIdx > newEndIdx，将 B 移除                      | 1           | 1         | 2           | 1         | A, C    |

[A, B] => [C, A]

| 序号 | 说明                                                                      | oldStartIdx | oldEndIdx | newStartIdx | newEndIdx | DOM     |
| ---- | ------------------------------------------------------------------------- | ----------- | --------- | ----------- | --------- | ------- |
| 0    | 初始状态                                                                  | 0           | 1         | 0           | 1         | A, B    |
| 1    | 第一次循环，满足 sameVnode(oldStartVnode, newEndVnode) ，移动 A 到 B 之后 | 1           | 1         | 0           | 0         | B, A    |
| 2    | 第二次循环，满足 isUndef(idxInOld) 条件，新增 C 到 B 之前                 | 1           | 1         | 1           | 0         | C, B, A |
| 2    | 循环结束，满足 newStartIdx > newEndIdx，将 B 移除                         | 1           | 1         | 1           | 0         | C, A    |

[A, B, C] => [B, A, E]

| 序号 | 说明                                                                   | oldCh             | oldStartIdx | oldEndIdx | ch        | newStartIdx | newEndIdx | DOM        |
| ---- | ---------------------------------------------------------------------- | ----------------- | ----------- | --------- | --------- | ----------- | --------- | ---------- |
| 0    | 初始状态                                                               | [A, B, C]         | 0           | 2         | [B, A, E] | 0           | 2         | A, B, C    |
| 1    | 第一次循环，满足 sameVnode(elmToMove, newStartVnode)，移动 B 到 A 之前 | [A, undefined, C] | 0           | 2         | [B, A, E] | 1           | 2         | B, A, C    |
| 2    | 第二次循环，满足 sameVnode(oldStartVnode, newStartVnode)，无 DOM 操作  | [A, undefined, C] | 1           | 2         | [B, A, E] | 2           | 2         | B, A, C    |
| 3    | 第三次循环，满足 isUndef(oldStartVnode)，无 DOM 操作                   | [A, undefined, C] | 2           | 2         | [B, A, E] | 2           | 2         | B, A, C    |
| 4    | 第四次循环，满足 isUndef(idxInOld)，新增 E 到 C 之前                   | [A, undefined, C] | 2           | 2         | [B, A, E] | 3           | 2         | B, A, E, C |
| 5    | 循环结束，满足 newStartIdx > newEndIdx，将 C 移除                      | [A, undefined, C] | 2           | 2         | [B, A, E] | 3           | 2         | B, A, E    |

[A] => [B, A]

| 序号 | 说明                                                                | oldStartIdx | oldEndIdx | newStartIdx | newEndIdx | DOM  |
| ---- | ------------------------------------------------------------------- | ----------- | --------- | ----------- | --------- | ---- |
| 0    | 初始状态                                                            | 0           | 0         | 0           | 1         | A    |
| 1    | 第一次循环，满足 sameVnode(oldStartVnode, newEndVnode)，无 DOM 操作 | 1           | 0         | 0           | 0         | A    |
| 2    | 循环结束，满足 oldStartIdx > oldEndIdx ，新增 B 到 A 之前           | 1           | 0         | 0           | 1         | B, A |

[A, B] => [B, A]

| 序号 | 说明                                                                       | oldStartIdx | oldEndIdx | newStartIdx | newEndIdx | DOM  |
| ---- | -------------------------------------------------------------------------- | ----------- | --------- | ----------- | --------- | ---- |
| 0    | 初始状态                                                                   | 0           | 1         | 0           | 1         | A, B |
| 1    | 第一次循环，满足 sameVnode(oldStartVnode, newEndVnode)，移动 A 到 B 之后   | 1           | 1         | 0           | 0         | B, A |
| 2    | 第二次循环，满足 sameVnode(oldStartVnode, newStartVnode) 条件，无 DOM 操作 | 2           | 1         | 1           | 0         | B, A |
| 3    | 循环结束，满足 oldStartIdx > oldEndIdx ，无 DOM 操作                       | 2           | 1         | 1           | 0         | B, A |

通过以上流程，视图再次得到了更新。同时，新的 vnode 和 elm 也会被保存，供下一次视图更新时使用。

以上分析了 Vnode 渲染和更新过程中的主要方法和流程，下面是本例中涉及到的主要方法的流程图：
![Vnode 流程图](https://femarkdownpicture.oss-cn-qingdao.aliyuncs.com/imgs/202208202303671.png)
