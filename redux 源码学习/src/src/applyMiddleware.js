import compose from './compose.js'

/**
 * Creates a store enhancer that applies middleware to the dispatch method
 * of the Redux store. This is handy for a variety of tasks, such as expressing
 * asynchronous actions in a concise manner, or logging every action payload.
 *
 * 创建一个 enhancer，这个 enhancer 会应用到 Redux store 上 dispatch 函数
 * 
 * See `redux-thunk` package as an example of the Redux middleware.
 *
 * Because middleware is potentially asynchronous, this should be the first
 * store enhancer in the composition chain.
 *
 * 因为 middleware 可能是异步的，
 * 
 * Note that each middleware will be given the `dispatch` and `getState` functions
 * as named arguments.
 *
 * @param {...Function} middlewares The middleware chain to be applied.
 * @returns {Function} A store enhancer applying the middleware.
 * 一个应用了 middleware 后的 store enhancer。
 */

// 1. 如何写一个 redux middleware
// 首先上代码，然后一步步分析
// function logger({ dispatch, getState }) {
//   return function wrapDispatchToAddLogging(next) {
//     return function dispatchAndLog(action) {
//       console.log('dispatching', action)
//       let result = next(action)
//       console.log('next state', store.getState())
//       return result
//     }
//   }
// }
// const thunk = ({ dispatch, getState }) => next => action => {
//   if (typeof action === 'function') {
//     return action(dispatch, getState, extraArgument);
//   }
//   return next(action);
// };

// 每个 middleware 都是一个高阶函数，接受一个 object 作为参数，上面有 dispatch 和 getState 函数
// 这是第一层

// 第二层是第一层返回的函数，我们暂且取名为 wrapDispatch
// 该函数会被传入被称为 next ，用来控制中间件流程
// next 其实是前一个 middleware 的包装后的 dispatch 方法
// 这是第二层

// 最内层这个函数可以直接调用 next(action)，或者在其他需要的时刻调用，甚至根本不去调用它。

// 调用链中第一个 middleware 会接受真实的 store 的 dispatch 方法作为 next 参数，并借此结束调用链。所以，middleware 的函数签名是 ({ getState, dispatch }) => next => action。

// 可以让你像 dispatch 一般的 actions 那样 dispatch 异步 actions。
// 用法 applyMiddleware(thunk, promise, logger)
// 中间件是从右到左依次执行的
// applyMiddleware 最后返回的是一个函数 enhancer
// 大概的流程如下

// applyMiddleware(thunk, promise, logger)(createStore)(reducer, [initState])

export default function applyMiddleware(...middlewares) {
  // 返回的是一个 enhancer 
  return createStore => (...args) => {
    // 在这里面生成了 store
    // 作用其实就是提供 dispath 和 getState 这两个函数
    const store = createStore(...args)
    
    // 用闭包来保存了 dispatch ，实现了下面代码里面所有地方的公用
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
    // 一开始 middlewares 里面每一项都是包裹了两层函数的高阶函数
    // 这时候 middlewares 依次执行，传进去 middlewareAPI
    // 注意，这个时候 middlewareAPI 的 dispatch 其实是 throw new Error 那个
    // 依次执行后，chain 里面的每一项还是一个高阶函数，即 第二层 的 wrapDispatch，接受 next
    const chain = middlewares.map(middleware => middleware(middlewareAPI))

    // compose(...chain) 返回一个高阶函数，如果调用的话，会从右到左执行chain 里面所有的函数
    // 然后又传进去 store.dispatch，这个时候终于把 middlewares 最里面的函数给返回了
    // 一层层增强 dispatch
    // compose 最后生成的是一个函数
    // (...arg) => thunk(promise(logger(...arg)))
    // 执行栈就变成这种:
    // temp1 = logger(store.dispatch) = function dispatchAndLog(action) {
    //   console.log('dispatching', action)
    //   let result = next(action)
    //   console.log('next state', store.getState())
    //   return result
    // }
    // next 就是 store.dispatch，它是第一个中间件，所以得到的是最原始的 dispatch
    
    // temp2 = thunk(temp1) = action => {
    //   if (typeof action === 'function') {
    //     return action(dispatch, getState, extraArgument);
    //   }
    //   return next(action);
    // };
    // next 就是 temp1，也就是经过 logger 增强的 dispatch 
    // dispatch 是我们最终的 dispatch，因为引用是一样的
    // 听起来有点绕，我们举个例子，比如我们就只有这两个中间件，那么 dispatch = temp2
    

    dispatch = compose(...chain)(store.dispatch)

    return {
      ...store,
      dispatch
    }
  }
}


