// 导入 symbol 类型的 observable (symbol类型的属性，是对象的私有属性)
import $$observable from 'symbol-observable.js'
// redux 内部自己的 ActionTypes，是保留的，外部不能用
import ActionTypes from './utils/actionTypes.js'
// 判断是否是普通(plain)对象
import isPlainObject from './utils/isPlainObject.js'

/**
 * Creates a Redux store that holds the state tree.
 * The only way to change the data in the store is to call `dispatch()` on it.
 * 创建一个 Redux store 来存放 state tree。修改 store 中的数据的唯一方法是调用 dispatch() 函数
 *
 * There should only be a single store in your app. To specify how different
 * parts of the state tree respond to actions, you may combine several reducers
 * into a single reducer function by using `combineReducers`.
 * 应用中有且只有一个store。如果想要根 action 来相应 state 中不同的部分，需要用 combineReducers 
 * 把几个 reducer 合成一个
 * 
 * @param {Function} reducer A function that returns the next state tree, given
 * the current state tree and the action to handle.
 * reducer 是一个函数，它接受当前的 state 和action 来返回新的 state 树
 * 
 * @param {any} [preloadedState] The initial state. You may optionally specify it
 * to hydrate the state from the server in universal apps, or to restore a
 * previously serialized user session.
 * If you use `combineReducers` to produce the root reducer function, this must be
 * an object with the same shape as `combineReducers` keys.
 * 初始化时的state。在应用中，你可以把服务端传来经过处理后的 state
 * 传给它。如果你使用 combineReducers 创建 reducer，它必须是一个普通对象，与传入
 * 的 keys 保持同样的结构。否则，你可以自由传入任何 reducer 可理解的内容。
 * 
 * @param {Function} [enhancer] The store enhancer. You may optionally specify it
 * to enhance the store with third-party capabilities such as middleware,
 * time travel, persistence, etc. The only store enhancer that ships with Redux
 * is `applyMiddleware()`.
 *
 * @returns {Store} A Redux store that lets you read the state, dispatch actions
 * and subscribe to changes.
 * 返回值是一个对象，能提供读取 state、派发 dispatch 和订阅变化的功能
 */
export default function createStore(reducer, preloadedState, enhancer) {
  // 下面这几行代码主要的作用是用来判断和修正参数位置的, 因为一部分参数可选，所以出现的情况就会比较多

  // 1. 只传入了 reducer, enhancer，没有指定初始的 State
  // createStore(reducer, enhancer)
  if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
    enhancer = preloadedState
    preloadedState = undefined
  }

  // 如果有 enhancer，需要走 enhancer 的流程
  if (typeof enhancer !== 'undefined') {
    // 判断 enhancer 是不是一个函数
    if (typeof enhancer !== 'function') {
      // 抛出一个异常 (enhancer 必须是一个函数)
      throw new Error('Expected the enhancer to be a function.')
    }
    // 调用 enhancer ,返回一个新强化过的 store creator
    // 其实 enhancer 就是经过 applyMiddleware ，返回的一个函数
    return enhancer(createStore)(reducer, preloadedState)
  }

  // 判断 reducer 不是一个函数
  if (typeof reducer !== 'function') {
    throw new Error('Expected the reducer to be a function.')
  }

  let currentReducer = reducer // 把 reducer 赋值给 currentReducer
  let currentState = preloadedState // 把 preloadedState 赋值给 currentState，默认是 undefined
  let currentListeners = [] // 初始化 listeners 数组
  let nextListeners = currentListeners // nextListeners 和 currentListeners 指向同一个引用
  let isDispatching = false // 标记是否正在进行 dispatch，其实就是 **锁** 的概念

  // 保存一份订阅的快照
  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice()
    }
  }

  /**
   * Reads the state tree managed by the store.
   * 获取 store 中管理的当前 state tree
   * 
   * @returns {any} The current state tree of your application.
   * 返回应用中当前的state tree
   */

  function getState() {
    // 比如，我现在正在执行 dispatch，那么执行完成后我的 state 可能会变化
    // 所以这个时候的 state 是不确定的，读取无意义
    if (isDispatching) {
      throw new Error(
        'You may not call store.getState() while the reducer is executing. ' +
          'The reducer has already received the state as an argument. ' +
          'Pass it down from the top reducer instead of reading it from the store.'
      )
    }

    // 当前的state tree
    return currentState
  }

  /**
   * Adds a change listener. It will be called any time an action is dispatched,
   * and some part of the state tree may potentially have changed. You may then
   * call `getState()` to read the current state tree inside the callback.
   * 添加一个 listener. 当 dispatch 一个 action 的时候会执行，这时 sate tree 可能已经发生了一些变化，
   * 你可以在 listener 函数调用 getState() 方法获取当前的 state
   * 
   * You may call `dispatch()` from a change listener, with the following
   * caveats:
   * 你可以在 listener 改变的时候调用 dispatch ，要注意
   *
   * 1. The subscriptions are snapshotted just before every `dispatch()` call.
   * If you subscribe or unsubscribe while the listeners are being invoked, this
   * will not have any effect on the `dispatch()` that is currently in progress.
   * However, the next `dispatch()` call, whether nested or not, will use a more
   * recent snapshot of the subscription list.
   *
   * 1. 订阅器（subscriptions） 在每次 dispatch() 调用之前都会保存一份快照。
   *    所以当 listener 正在执行的时候，订阅(subscribe)或者去掉订阅（unsubscribe），
   *    对当前的 dispatch() 不会有任何影响。但是对于下一次的 dispatch()，无论嵌套与否，
   *    都会使用订阅列表里最近的一次快照。
   * 
   * 2. The listener should not expect to see all state changes, as the state
   * might have been updated multiple times during a nested `dispatch()` before
   * the listener is called. It is, however, guaranteed that all subscribers
   * registered before the `dispatch()` started will be called with the latest
   * state by the time it exits.
   * 2. 订阅器不应该关注所有 state 的变化，在订阅器被调用之前，往往由于嵌套的 dispatch()
   *    导致 state 发生多次的改变，我们应该保证所有的监听都注册在 dispath() 之前。
   * @param {Function} listener A callback to be invoked on every dispatch. 要监听的函数
   * @returns {Function} A function to remove this change listener. 一个可以移除监听的函数
   */
  function subscribe(listener) {
    // 判断 listener 不是一个函数
    if (typeof listener !== 'function') {
      // 抛出一个异常 (listener 必须是一个函数)
      throw new Error('Expected the listener to be a function.')
    }

    if (isDispatching) {
      throw new Error(
        'You may not call store.subscribe() while the reducer is executing. ' +
          'If you would like to be notified after the store has been updated, subscribe from a ' +
          'component and invoke store.getState() in the callback to access the latest state. ' +
          'See https://redux.js.org/api-reference/store#subscribe(listener) for more details.'
      )
    }

    // 标记有订阅的 listener
    let isSubscribed = true

    // 保存一份快照
    ensureCanMutateNextListeners()
    nextListeners.push(listener)

    // 返回一个取消订阅的函数
    return function unsubscribe() {
      if (!isSubscribed) {
        return
      }

      if (isDispatching) {
        throw new Error(
          'You may not unsubscribe from a store listener while the reducer is executing. ' +
            'See https://redux.js.org/api-reference/store#subscribe(listener) for more details.'
        )
      }

      isSubscribed = false

      ensureCanMutateNextListeners()
      // 找到当前的 listener
      const index = nextListeners.indexOf(listener)
      // 移除当前的 listener
      nextListeners.splice(index, 1)
    }
  }

  /**
   * Dispatches an action. It is the only way to trigger a state change.
   * dispath 一个 action。这是触发 state 变化的惟一方法
   * 
   * The `reducer` function, used to create the store, will be called with the
   * current state tree and the given `action`. Its return value will
   * be considered the **next** state of the tree, and the change listeners
   * will be notified.
   * 用来创建 store 的 reducer 函数会被传进两个参数：当前的 state、action。
   * 它的返回值就是下一个 state 树，listeners 也会被通知调用
   * 
   * The base implementation only supports plain object actions. If you want to
   * dispatch a Promise, an Observable, a thunk, or something else, you need to
   * wrap your store creating function into the corresponding middleware. For
   * example, see the documentation for the `redux-thunk` package. Even the
   * middleware will eventually dispatch plain object actions using this method.
   * 
   * @param {Object} action A plain object representing “what changed”. It is
   * a good idea to keep actions serializable so you can record and replay user
   * sessions, or use the time travelling `redux-devtools`. An action must have
   * a `type` property which may not be `undefined`. It is a good idea to use
   * string constants for action types.
   *
   * @returns {Object} For convenience, the same action object you dispatched.
   * 为了方便，会返回 dispatch 的 action
   * Note that, if you use a custom middleware, it may wrap `dispatch()` to
   * return something else (for example, a Promise you can await).
   * 注意: 如果你要用自定义的中间件， 它可能包装 `dispatch()`
   *       返回一些其它东西，如( Promise )
   */
  function dispatch(action) {
    // 判断 action 不是普通对象。也就是说该对象由 Object 构造函数创建
    if (!isPlainObject(action)) {
      // 抛出一个异常(actions 必须是一个普通对象. 或者用自定义的中间件来处理异步 actions)
      throw new Error(
        'Actions must be plain objects. ' +
          'Use custom middleware for async actions.'
      )
    }

    // 判断 action 对象是否存在的 type 属性
    // action 内必须使用一个字符串类型的 type 字段来表示将要执行的动作
    if (typeof action.type === 'undefined') {
      throw new Error(
        'Actions may not have an undefined "type" property. ' +
          'Have you misspelled a constant?'
      )
    }

    // 判断 dispahch 是否正在运行
    // 如果 Reducer 在处理的时候，是不能执行 dispatch 的
    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions.')
    }

    try {
      // 标记 dispatch 正在运行
      isDispatching = true
      // 执行当前 Reducer 函数返回新的 state
      currentState = currentReducer(currentState, action)
    } finally {
      isDispatching = false
    }

    // 所有的的监听函数赋值给 listeners
    const listeners = (currentListeners = nextListeners)
    // 遍历所有的监听函数
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i]
      // 执行每一个监听函数
      listener()
    }

    return action
  }

  /**
   * Replaces the reducer currently used by the store to calculate the state.
   * 替换当前使用用来计算 state 的 reducer
   * 
   * You might need this if your app implements code splitting and you want to
   * load some of the reducers dynamically. You might also need this if you
   * implement a hot reloading mechanism for Redux.
   * 只有在你需要实现代码分隔，而且需要立即加载一些 reducer 的时候才可能会用到它。
   * 在实现 Redux 热加载机制的时候也可能会用到。
   * 
   * @param {Function} nextReducer The reducer for the store to use instead.
   * @returns {void}
   */
  function replaceReducer(nextReducer) {
    if (typeof nextReducer !== 'function') {
      throw new Error('Expected the nextReducer to be a function.')
    }

    currentReducer = nextReducer
    dispatch({ type: ActionTypes.REPLACE })
  }

  /**
   * Interoperability point for observable/reactive libraries.
   * @returns {observable} A minimal observable of state changes.
   * For more information, see the observable proposal:
   * https://github.com/tc39/proposal-observable
   */
  function observable() {
    const outerSubscribe = subscribe
    return {
      /**
       * The minimal observable subscription method.
       * @param {Object} observer Any object that can be used as an observer.
       * The observer object should have a `next` method.
       * @returns {subscription} An object with an `unsubscribe` method that can
       * be used to unsubscribe the observable from the store, and prevent further
       * emission of values from the observable.
       */
      subscribe(observer) {
        if (typeof observer !== 'object' || observer === null) {
          throw new TypeError('Expected the observer to be an object.')
        }

        function observeState() {
          if (observer.next) {
            observer.next(getState())
          }
        }

        observeState()
        const unsubscribe = outerSubscribe(observeState)
        return { unsubscribe }
      },

      [$$observable]() {
        return this
      }
    }
  }

  // When a store is created, an "INIT" action is dispatched so that every
  // reducer returns their initial state. This effectively populates
  // the initial state tree.
  // reducer 返回其初始状态 
  // 初始化 store 里的 state tree
  // 你的 reducer 里面是没有这个 INIT action的
  // 所以会走到默认的 switch case
  // 这也是为啥它要求你不能省略 default
  dispatch({ type: ActionTypes.INIT })

  return {
    dispatch,
    subscribe,
    getState,
    replaceReducer,
    [$$observable]: observable
  }
}
