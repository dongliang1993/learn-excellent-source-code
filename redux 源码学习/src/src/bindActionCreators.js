// dispath 绑定到 action 上
function bindActionCreator(actionCreator, dispatch) {
  // 返回一个可以直接调用的 dispath 函数
  return function() {
    // 返回一个可以直接调用的 dispath 函数
    return dispatch(actionCreator.apply(this, arguments))
  }
}

/**
 * Turns an object whose values are action creators, into an object with the
 * same keys, but with every function wrapped into a `dispatch` call so they
 * may be invoked directly. This is just a convenience method, as you can call
 * `store.dispatch(MyActionCreators.doSomething())` yourself just fine.
 * 把一个 value 为不同 action creator 的对象，转成拥有同名 key 的对象。
 * 同时使用 dispatch 对每个 action creator 进行包装，以便可以直接调用它们
 * 
 * For convenience, you can also pass a single function as the first argument,
 * and get a function in return.
 *
 * @param {Function|Object} actionCreators An object whose values are action
 * creator functions. One handy way to obtain it is to use ES6 `import * as`
 * syntax. You may also pass a single function.
 * 一个action creator 函数,或者键值是 action creatores 的对象
 * 
 * @param {Function} dispatch The `dispatch` function available on your Redux
 * store.
 * dipath 函数 ，由 Redux 提供
 * 
 * @returns {Function|Object} The object mimicking the original object, but with
 * every action creator wrapped into the `dispatch` call. If you passed a
 * function as `actionCreators`, the return value will also be a single
 * function.
 * 一个与原对象类似的对象，只不过这个对象中的的每个函数值都可以直接 dispatch action。
 * 如果传入的是一个函数作为 actionCreators，返回的也是一个函数。
 */
// {
//   addTodo: Function, // Function 是 actionCreator
//   removeTodo: Function
// }
export default function bindActionCreators(actionCreators, dispatch) {
  // 判断 actionCreators 是一个函数
  if (typeof actionCreators === 'function') {
    // 调用 bindActionCreator ， 返回包装后的 actionCreators , 包装后 actionCreators 可以直接 dispath
    return bindActionCreator(actionCreators, dispatch)
  }

  // 如果 actionCreators 传入的不是 Object 或者 Function 抛出异常
  if (typeof actionCreators !== 'object' || actionCreators === null) {
    throw new Error(
      `bindActionCreators expected an object or a function, instead received ${
        actionCreators === null ? 'null' : typeof actionCreators
      }. ` +
        `Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?`
    )
  }

  // 获取 actionCreators 所有的 key
  const keys = Object.keys(actionCreators)
  // 用来保存新 转换后的 actionCreators
  const boundActionCreators = {}
  // 遍历 所有的 actionCreators keys
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    // 获取当前的 actionCreator
    const actionCreator = actionCreators[key]
    // 当前的 actionCreator 是一个函数
    if (typeof actionCreator === 'function') {
      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch)
    }
  }
  // 返回经过 dispath 包装过后的 actionCreators
  return boundActionCreators
}
