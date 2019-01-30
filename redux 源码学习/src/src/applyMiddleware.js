import compose from './compose.js'

/**
 * Creates a store enhancer that applies middleware to the dispatch method
 * of the Redux store. This is handy for a variety of tasks, such as expressing
 * asynchronous actions in a concise manner, or logging every action payload.
 *
 * See `redux-thunk` package as an example of the Redux middleware.
 *
 * Because middleware is potentially asynchronous, this should be the first
 * store enhancer in the composition chain.
 *
 * Note that each middleware will be given the `dispatch` and `getState` functions
 * as named arguments.
 *
 * @param {...Function} middlewares The middleware chain to be applied.
 * @returns {Function} A store enhancer applying the middleware.
 * 一个应用了 middleware 后的 store enhancer。
 */

// 每个 middleware 接受 Store 的 dispatch 和 getState 函数作为命名参数，并返回一个函数。
// 该函数会被传入被称为 next 的下一个 middleware 的 dispatch 方法，
// 并返回一个接收 action 的新函数，这个函数可以直接调用 next(action)，或者在其他需要的时刻调用，甚至根本不去调用它。
// 调用链中最后一个 middleware 会接受真实的 store 的 dispatch 方法作为 next 参数，并借此结束调用链。所以，middleware 的函数签名是 ({ getState, dispatch }) => next => action。

// function logger(store) {
//   return function wrapDispatchToAddLogging(next) {
//     return function dispatchAndLog(action) {
//       console.log('dispatching', action)
//       let result = next(action)
//       console.log('next state', store.getState())
//       return result
//     }
//   }
// }

// 可以让你像 dispatch 一般的 actions 那样 dispatch 异步 actions。
export default function applyMiddleware(...middlewares) {
  // 返回的是一个 enhancer 
  return createStore => (...args) => {
    // 在这里面又生成了一遍 store
    const store = createStore(...args)
    let dispatch = () => {
      throw new Error(
        `Dispatching while constructing your middleware is not allowed. ` +
          `Other middleware would not be applied to this dispatch.`
      )
    }

    const middlewareAPI = {
      getState: store.getState,
      dispatch: (...args) => dispatch(...args)
    }
    // 这时候 chain 里面的每一项都是一个高阶函数，接受 next（dispatch）
    const chain = middlewares.map(middleware => middleware(middlewareAPI))
    // compose(...chain) 返回一个高阶函数，如果调用的话，会从右到左执行chain 里面所有的函数
    // 然后又传进去 store.dispatch，这个时候终于把 middlewares 最里面的函数给返回了
    // 一层层增强 dispatch
    dispatch = compose(...chain)(store.dispatch)

    return {
      ...store,
      dispatch
    }
  }
}
