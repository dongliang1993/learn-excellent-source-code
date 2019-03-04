class EventEmitter {
  constructor() {
    this._events = Object.create(null) // 定义事件对象
    // this.maxListeners = 0 // 最大事件监听个数
  }

  // 设置同类型事件监听最大个数
  setMaxListeners(count) {
    EventEmitter.defaultMaxListeners = count
  }

  // 获取同类型事件监听最大个数
  getMaxListeners() {
    return EventEmitter.defaultMaxListeners;
  }

  on(type, listener, prepend = false) {
    // 兼容继承不存在 _events 的情况
    if (!this._events) {
      this._events = Object.create(null)
    }

    // 在on方法的参数中，第三个参数用于指定是在相应事件类型属性所对应的数组头部添加还是尾部添加，
    // 不传的情况下实在尾部添加，如果指定prepend为true，则相同事件类型的新的监听事件会添加到事件数组的头部

    const events = this._events
    let existing = events[type] // 判断相应的 type 的方法是否存在

    if (existing === undefined) {
      // 如果相应的type的方法不存在，这新增一个相应 type 的事件
      existing = events[type] = [listener]
    } else {
      const maxListeners = this.getMaxListeners();
      // 判断 type 类型的事件是否超出最大监听个数，超出打印警告信息
      if (existing.length === maxListeners) {
        console.error(`MaxListenersExceededWarning: ${maxListeners + 1} ${type} listeners added`);
        return
      }
      if (prepend) {
        existing.unshift(listener)
      } else {
        existing.push(listener)
      }
    }
    // 为了可以链式的调用我们返回了EventEmitter模块的实例化本身
    return this
  }
  // 添加事件监听，只能执行一次
  once(type, callback, flag) {
    function wrap(...args) {
      callback(...args);
      // 执行 callback 后立即从数组中移除 callback
      this.removeListener(type, wrap)
    }

    // 存储 callback，确保单独使用 removeListener 删除传入的 callback 时可以被删除掉
    wrap.realCallback = callback

    // 调用 on 添加事件监听
    this.on(type, wrap, flag)
  }
  emit(eventName, ...arg) {
    if (this._events[eventName]) {
      this._events[eventName].forEach(callback => {
        callback.call(this, ...arg)
      })
    }
  }
  addListener(type, listener, prepend = false) {
    return this.on(type, listener, prepend = false)
  }
  prependListener(type, listener) {
    return this.on(type, listener, true)
  }
  // 添加事件监听，从数组的前面追加，只执行一次
  prependOnceListener(type, listener) {
    // 第三个参数为 true 表示从 _events 对应事件类型的数组前面添加 callback
    this.once(type, listener, true)
  }
  removeListener(type, listener) {
    const events = this._events
    events[type] = events[type].filter(event => event !== listener && event.realCallback !== listener)
    if (events.removeListener !== undefined) {
      this.emit('removeListener', type, listener)
    }
    return this
  }
  removeAllListeners(type) {
    // 存在 type 清空 _events 对应的数组，否则直接清空 _events
    if (type) {
      this._events[type] = []
    } else {
      this._events = Object.create(null)
    }
  }
  // 获取事件类型对应的数组
  listeners(type) {
    return this._events[type]
  }
}

EventEmitter.defaultMaxListeners = 10

module.exports = EventEmitter