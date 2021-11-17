const convert = (val) => isObject(val) ? reactive(val) : val

function ref(value) {
    return createRef(value)
}

function createRef(rawValue) {
    if (isRef(rawValue)) {
        // 如果传入的就是一个 ref，那么返回自身即可，处理嵌套 ref 的情况。
        return rawValue
    }
    // 如果是对象或者数组类型，则转换一个 reactive 对象。
    let value = convert(rawValue)
    const r = {
        __v_isRef: true,
        get value() {
            // getter
            // 依赖收集，key 为固定的 value
            // ！！ 3.2 之后computed 和ref 都不添加进targetMap里了 直接放在ref.dep里 见（reactivity.cjs.js：trackRefValue）
            track(r, 'value')
            return value
        },
        set value(newVal) {
            // setter，只处理 value 属性的修改
            console.log('toRaw(newVal): ', toRaw(newVal));
            if (hasChanged(toRaw(newVal), rawValue)) {
                // 判断有变化后更新值
                rawValue = newVal
                value = convert(newVal)
                // 派发通知
                trigger(r, "set" /* SET */, 'value', void 0)
            }
        }
    }
    return r
}