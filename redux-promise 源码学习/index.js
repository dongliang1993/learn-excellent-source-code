// 用法
// //action types
// const GET_DATA = 'GET_DATA';

// //action creator
// const getData = function(id) {
//     return {
//         type: GET_DATA,
//         payload: api.getData(id) //payload为promise对象
//     }
// }

// //reducer
// function reducer(oldState, action) {
//     switch(action.type) {
//     case GET_DATA: 
//         if (action.status === 'success') {
//             return successState
//         } else {
//                return errorState
//         }
//     }
// }



import isPromise from 'is-promise';
import { isFSA } from 'flux-standard-action';

export default function promiseMiddleware({ dispatch }) {
  return next => action => {
    if (!isFSA(action)) {
      return isPromise(action) ? action.then(dispatch) : next(action);
    }

    return isPromise(action.payload)
      ? action.payload
          // 如果 action.payload 是一个 promise ，那就注册 then 和 catch
          // 成功时，payload 返回成功的数据
          // 失败时，返回失败的原因 
          .then(result => dispatch({ ...action, payload: result }))
          .catch(error => {
            dispatch({ ...action, payload: error, error: true });
            return Promise.reject(error);
          })
      // 如果不是 promise ，直接放行
      : next(action);
  };
}