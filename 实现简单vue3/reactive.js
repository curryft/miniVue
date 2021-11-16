let activeEffect
let targetMap = new Map()
const rawToReactive = new WeakMap()
const reactiveToRaw = new WeakMap()

// traps
// 深度侦测数据
// 当对多层级的对象操作时，set 并不能感知到，但是 get 会触发，
// 于此同时，利用 Reflect.get() 返回的“多层级对象中内层” ，再对“内层数据”做一次代理。
function createGetter() {
    return function get(target, key, receiver) {
        console.log('get');
        const res = Reflect.get(target, key, receiver)
        // 依赖收集
        track(target, key)
        return isObject(res) ? reactive(res) : res
    }
}

function createSetter(target, key, val, receiver) {
    return function set(target, key, val, receiver) {
        console.log(target, key, val)
        const hadKey = hasOwn(target, key)
        const oldValue = target[key]
        // 如果目标的原型链也是一个 proxy，通过 Reflect.set 修改原型链上的属性会再次触发 setter，这种情况下就没必要触发两次 trigger 了
        val = reactiveToRaw.get(val) || val
        const result = Reflect.set(target, key, val, receiver)

        if (!hadKey) {
            console.log('trigger ... is a add OperationType')
            trigger(target, "add" /* ADD */, key, val)
        } else if (val !== oldValue) {
            console.log('trigger ... is a set OperationType')
            trigger(target, "set" /* SET */, key, val, oldValue)
        }

        return result
    }
}

// handler
const mutableHandlers = {
    get: createGetter(),
    set: createSetter(),
}

// entry
function reactive(target) {
    return createReactiveObject(
        target,
        rawToReactive,
        reactiveToRaw,
        mutableHandlers,
    )
}

function createReactiveObject(target, toProxy, toRaw, baseHandlers) {
    let observed = toProxy.get(target)
    // 原数据已经有相应的可响应数据, 返回可响应数据
    if (observed !== void 0) {
        return observed
    }
    // 原数据已经是可响应数据
    if (toRaw.has(target)) {
        return target
    }
    observed = new Proxy(target, baseHandlers)
    toProxy.set(target, observed)
    toRaw.set(observed, target)
    return observed
}

// 依赖收集
function track(target, key) {
    let depMap = targetMap.get(target)
    if (!depMap) {
        targetMap.set(target, (depMap = new Map()))
    }
    let dep = depMap.get(key)
    if (!dep) {
        depMap.set(key, (dep = new Set()))
    }
    if (!dep.has(activeEffect)) {
        dep.add(activeEffect)
    }
}

// 派发更新
function trigger(target, type, key, newValue, oldValue, oldTarget) {
    // 通过 targetMap 拿到 target 对应的依赖集合
    let depMap = targetMap.get(target)
    if (!depMap) return

    // 创建运行的 effects 集合
    const effects = new Set()
    // 添加 effects 的函数
    const add = (effectsToAdd) => {
        if (effectsToAdd) {
            effectsToAdd.forEach(effect => {
                effects.add(effect)
            })
        }
    }
    // SET | ADD | DELETE 操作之一，添加对应的 effects
    if (key !== void 0) {
        add(depMap.get(key))
    }

    const run = (effect) => {
        // 调度执行
        if (effect.options && effect.options.scheduler) {
            effect.options.scheduler(effect)
        } else {
            // 直接运行
            effect()
        }
    }

    effects.forEach((effect) => {
        run(effect)
    })
}

function watchEffect(cb) {
    console.log("watchEffect");
    activeEffect = cb
    cb()
}