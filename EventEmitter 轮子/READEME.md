几个实用的API:

| 方法名                                | 方法描述    |
| --------                             | -----:   |
| addListener(event, listener)         | 为指定事件添加一个监听器到监听器数组的尾部。 |
| prependListener(event,listener)      | 与addListener相对，为指定事件添加一个监听器到监听器数组的头部。      |
| on(event, listener)                  | 其实就是addListener的别名      |
| once(event, listener)                | 为指定事件注册一个单次监听器，即 监听器最多只会触发一次，触发后立刻解除该监听器|
| removeListener(event, listener)      | 移除指定事件的某个监听器 |
| off(event, listener)                 | removeListener的别名|
| removeAllListeners([event])          | 移除所有事件的所有监听器， 如果指定事件，则移除指定事件的所有监听器。|
| setMaxListeners(n)	                | 默认情况下， EventEmitters 如果你添加的监听器超过 10 个就会输出警告信息。 setMaxListeners 函数用于提高监听器的默认限制的数量。|
| listeners(event)                     | 返回指定事件的监听器数组。|
| emit(event, [arg1], [arg2], [...])   | 按参数的顺序执行每个监听器，如果事件有注册监听返回 true，否则返回 false。|
