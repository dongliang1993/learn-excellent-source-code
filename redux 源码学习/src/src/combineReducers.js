import ActionTypes from './utils/actionTypes.js'
import warning from './utils/warning.js'
import isPlainObject from './utils/isPlainObject.js'

function getUndefinedStateErrorMessage(key, action) {
  const actionType = action && action.type
  const actionDescription =
    (actionType && `action "${String(actionType)}"`) || 'an action'

  return (
    `Given ${actionDescription}, reducer "${key}" returned undefined. ` +
    `To ignore an action, you must explicitly return the previous state. ` +
    `If you want this reducer to hold no value, you can return null instead of undefined.`
  )
}

function getUnexpectedStateShapeWarningMessage(
  inputState,
  reducers,
  action,
  unexpectedKeyCache
) {
  const reducerKeys = Object.keys(reducers)
  const argumentName =
    action && action.type === ActionTypes.INIT
      ? 'preloadedState argument passed to createStore'
      : 'previous state received by the reducer'

  if (reducerKeys.length === 0) {
    return (
      'Store does not have a valid reducer. Make sure the argument passed ' +
      'to combineReducers is an object whose values are reducers.'
    )
  }

  if (!isPlainObject(inputState)) {
    return (
      `The ${argumentName} has unexpected type of "` +
      {}.toString.call(inputState).match(/\s([a-z|A-Z]+)/)[1] +
      `". Expected argument to be an object with the following ` +
      `keys: "${reducerKeys.join('", "')}"`
    )
  }

  const unexpectedKeys = Object.keys(inputState).filter(
    key => !reducers.hasOwnProperty(key) && !unexpectedKeyCache[key]
  )

  unexpectedKeys.forEach(key => {
    unexpectedKeyCache[key] = true
  })

  if (action && action.type === ActionTypes.REPLACE) return

  if (unexpectedKeys.length > 0) {
    return (
      `Unexpected ${unexpectedKeys.length > 1 ? 'keys' : 'key'} ` +
      `"${unexpectedKeys.join('", "')}" found in ${argumentName}. ` +
      `Expected to find one of the known reducer keys instead: ` +
      `"${reducerKeys.join('", "')}". Unexpected keys will be ignored.`
    )
  }
}

function assertReducerShape(reducers) {
  Object.keys(reducers).forEach(key => {
    const reducer = reducers[key]
    const initialState = reducer(undefined, { type: ActionTypes.INIT })

    if (typeof initialState === 'undefined') {
      throw new Error(
        `Reducer "${key}" returned undefined during initialization. ` +
          `If the state passed to the reducer is undefined, you must ` +
          `explicitly return the initial state. The initial state may ` +
          `not be undefined. If you don't want to set a value for this reducer, ` +
          `you can use null instead of undefined.`
      )
    }

    if (
      typeof reducer(undefined, {
        type: ActionTypes.PROBE_UNKNOWN_ACTION()
      }) === 'undefined'
    ) {
      throw new Error(
        `Reducer "${key}" returned undefined when probed with a random type. ` +
          `Don't try to handle ${
            ActionTypes.INIT
          } or other actions in "redux/*" ` +
          `namespace. They are considered private. Instead, you must return the ` +
          `current state for any unknown actions, unless it is undefined, ` +
          `in which case you must return the initial state, regardless of the ` +
          `action type. The initial state may not be undefined, but can be null.`
      )
    }
  })
}

/**
 * Turns an object whose values are different reducer functions, into a single
 * reducer function. It will call every child reducer, and gather their results
 * into a single state object, whose keys correspond to the keys of the passed
 * reducer functions.
 * 把一个由多个不同 reducer 函数作为 value 的 object，合并成一个最终的 reducer 函数
 * 合并后的 reducer 可以调用各个子 reducer，并把它们返回的结果合并成一个 state 对象
 * 由 combineReducers() 返回的 state 对象，会将传入的每个 reducer 返回的 state 按其传递给 combineReducers() 时对应的 key 进行命名。
 * 
 * @param {Object} reducers An object whose values correspond to different
 * reducer functions that need to be combined into one. One handy way to obtain
 * it is to use ES6 `import * as reducers` syntax. The reducers may never return
 * undefined for any action. Instead, they should return their initial state
 * if the state passed to them was undefined, and the current state for any
 * unrecognized action.
 *
 * 接受一个 object，这个 object 的 values 就是拆分开的每一个 reducer
 * reducer 里面不能返回 undefined，所以你在写 reducer 的时候，一定要设置 initial state 和 default case
 * 
 * @returns {Function} A reducer function that invokes every reducer inside the
 * passed object, and builds a state object with the same shape.
 */
// rootReducer = combineReducers({potato: potatoReducer, tomato: tomatoReducer})
// // rootReducer 将返回如下的 state 对象
// {
//   potato: {
//     // ... potatoes, 和一些其他由 potatoReducer 管理的 state 对象 ...
//   },
//   tomato: {
//     // ... tomatoes, 和一些其他由 tomatoReducer 管理的 state 对象，比如说 sauce 属性 ...
//   }
// }
// 通过为传入对象的 reducer 命名不同的 key 来控制返回 state key 的命名
export default function combineReducers(reducers) {
  // 把 reducers 对象中可以枚举的属性转换成一个数组
  const reducerKeys = Object.keys(reducers)
  // 声明接受最终 reducers 对象 
  const finalReducers = {}
  for (let i = 0; i < reducerKeys.length; i++) {
    const key = reducerKeys[i]
    
    // 判断当前不是生产模式
    if (process.env.NODE_ENV !== 'production') {
      // 判断当前的 reducer 是 undefinded
      if (typeof reducers[key] === 'undefined') {
        warning(`No reducer provided for key "${key}"`)
      }
    }
    // 判断当前 reducer 是一个函数
    if (typeof reducers[key] === 'function') {
      finalReducers[key] = reducers[key]
    }
  }
  // 上面那一步其实是过滤作用，把 reducer 不是 function 的都过滤了
  const finalReducerKeys = Object.keys(finalReducers)

  let unexpectedKeyCache
  if (process.env.NODE_ENV !== 'production') {
    unexpectedKeyCache = {}
  }

  let shapeAssertionError
  try {
    // 判断 Reducer 是否符合规范
    assertReducerShape(finalReducers)
  } catch (e) {
    shapeAssertionError = e
  }

  // 返回结合起来的 Reducer
  // 如果是多个 reducer 组合在一起，那么 state 只能是一个 object
  return function combination(state = {}, action) {
    if (shapeAssertionError) {
      throw shapeAssertionError
    }

    if (process.env.NODE_ENV !== 'production') {
      const warningMessage = getUnexpectedStateShapeWarningMessage(
        state,
        finalReducers,
        action,
        unexpectedKeyCache
      )
      if (warningMessage) {
        warning(warningMessage)
      }
    }

    let hasChanged = false
    const nextState = {}
    for (let i = 0; i < finalReducerKeys.length; i++) {
      // 获取当前的 key
      const key = finalReducerKeys[i]
      // 获取当前 reducer
      const reducer = finalReducers[key]
      // 获取当前 key 的 state
      const previousStateForKey = state[key]
      // 给每一个 reducer 传进去的 state 都是它自己对应的
      // 执行 reducer ，获取 state
      const nextStateForKey = reducer(previousStateForKey, action)
      if (typeof nextStateForKey === 'undefined') {
        const errorMessage = getUndefinedStateErrorMessage(key, action)
        throw new Error(errorMessage)
      }
      nextState[key] = nextStateForKey
      // 判断 state 是否经过 Reducer 改变了
      // 有一个改变了，就返回新的 nextState
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey
    }
    return hasChanged ? nextState : state
  }
}
