/**
 * Composes single-argument functions from right to left. The rightmost
 * function can take multiple arguments as it provides the signature for
 * the resulting composite function.
 *
 * @param {...Function} funcs The functions to compose.
 * 返回一个 function
 * 
 * @returns {Function} A function obtained by composing the argument functions
 * from right to left. For example, compose(f, g, h) is identical to doing
 * (...args) => f(g(h(...args))).
 * 返回一个 function，这个份函数执行的时候，从右到左执行 funcs ，依次把返回值作为下一个函数的参数
 */

// compose(promise,chunk,logger)
// 返回
// => (...arg) => chunk(logger(...arg))
// 第一次，a = promise, b = chunk
// 返回的的新箭头函数为 c = (...args) => promise(chunk(...args))
// 第二次，a = c = (...args) => promise(chunk(...args))
// b = logger
// 返回的的新箭头函数为 d = (...args) => c(logger(...args))
// => (...args) => promise(chunk(logger(...args)))
// 第一次看确实懵逼
export default function compose(...funcs) {
  if (funcs.length === 0) {
    return arg => arg
  }

  if (funcs.length === 1) {
    return funcs[0]
  }

  return funcs.reduce((a, b) => (...args) => a(b(...args)))
}
