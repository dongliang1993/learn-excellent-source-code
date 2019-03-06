/*!
  Copyright (c) 2018 Jed Watson.
  Licensed under the MIT License (MIT), see
  http://jedwatson.github.io/classnames
*/
/* global define */

// 最外层用了一个自执行的函数，用来模拟块级作用域
(function () {
  // 开启严格模式
	'use strict';

  // 缓存关键函数，这样用起来的时候，就不会按照作用域链不断向上找，节约时间
  // 虽然我觉得并没有什么卵用 /(ㄒoㄒ)/~~
	var hasOwn = {}.hasOwnProperty;

	function classNames () {
		var classes = [];

    // arguments 也是有坑的地方，比如，是和形参同步的。。。
    // 这里用到 arguments 主要还是因为参数个数不确定
		for (var i = 0; i < arguments.length; i++) {

      // 文档中有这样一段话，放在下边：
      // The classNames function takes any number of arguments which can be a string or object. 
      // The argument 'foo' is short for { foo: true }. 
      // If the value associated with a given key is falsy, 
      // that key won't be included in the output.
      大概意思是说
      // 1. classNames 可以接受 string / 对象，个数不限
      // 2. 如果是 falsy 值，那么不会出现在输出中

      // 下面主要是实现 2
			var arg = arguments[i];
			if (!arg) continue;

      // 获取参数的类型
			var argType = typeof arg;

      // 如果是字符串/数字类型，直接放到结果数组中。0 和 '' 已经在上面过滤掉了
			if (argType === 'string' || argType === 'number') {
				classes.push(arg);
      } else if (Array.isArray(arg) && arg.length) { // 如果是数组，且非空
        // 递归
        var inner = classNames.apply(null, arg);
        // 同样是过滤掉 falsy 值
				if (inner) {
					classes.push(inner);
        }
      } else if (argType === 'object') { // 如果是 object 
				for (var key in arg) {
          // 常规的取出 object 上所有的 key/value 
          // 注意，hasOwn 表示只对自己对象上的 key/value 进行迭代
					if (hasOwn.call(arg, key) && arg[key]) {
						classes.push(key);
					}
				}
			}
		}

    // 最后用空格连接，导出
		return classes.join(' ');
	}

  // 用来处理不同平台的导出问题
  // module && module.exports 一般是用在 node 环境中
  // 因为我们最后是直接导出一个函数
  // 在 node 环境中，直接把 module.exports 指向我们的函数即可
	if (typeof module !== 'undefined' && module.exports) {
		classNames.default = classNames;
    module.exports = classNames;
    // 下面是 amd cmd 的规范，现在应该已经很少用到了，不看也罢
	} else if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {
		// register as 'classnames', consistent with npm package name
		define('classnames', [], function () {
			return classNames;
		});
	} else {
    // 如果不是上述两种情况，那么就是浏览器了
    // 直接挂载在 window 上就行
		window.classNames = classNames;
	}
}());