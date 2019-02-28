function createThunkMiddleware(extraArgument) {
  return ({ dispatch, getState }) => next => action => {
    // 如果 action 是一个函数，执行 action，并把 dispatch 传进去
    if (typeof action === 'function') {
      // 为什么穿进去的是 dispatch 不是 next 呢？
      // 因为可能 action 里面 又 dispatch 一个函数
      return action(dispatch, getState, extraArgument);
    }
    // 否则，直接 next
    return next(action);
  };
}

const thunk = createThunkMiddleware();
thunk.withExtraArgument = createThunkMiddleware;

export default thunk;