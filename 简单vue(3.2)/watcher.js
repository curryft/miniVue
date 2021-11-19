const EMPTY_OBJ = Object.freeze({})
function watch(source, cb, options) {
    return doWatch(source, cb, options);
}
function watchEffect(effect, options) {
    return doWatch(effect, null, options);
}
function doWatch(source, cb, { immediate, deep, flush, onTrack, onTrigger } = EMPTY_OBJ) {
    let getter;
    let isMultiSource = false;
    // 标准化 source 
    if (isRef(source)) {
        getter = () => source.value;
    }
    else if (isReactive(source)) {
        getter = () => source;
        deep = true;
    }
    else if (isArray(source)) {
        isMultiSource = true;
        getter = () => source.map(s => {
            if (isRef(s)) {
                return s.value;
            }
            else if (isReactive(s)) {
                return traverse(s);
            }
            else if (isFunction(s)) {
                return s()
            }
        });
    }
    else if (isFunction(source)) {
        if (cb) {
            // getter with cb
            getter = () => source()
        }else{
            // no cb -> simple effect 
            // watchEffect
            getter = () => {
                if (cleanup) {
                    cleanup();
                }
                return source(onInvalidate);
            };
        }
    }
    if (cb && deep) {
        const baseGetter = getter;
        getter = () => traverse(baseGetter());
    }
    let cleanup;
    let onInvalidate = (fn) => {
        cleanup = effect.onStop = () => {
            return fn();
        };
    };
    let oldValue = isMultiSource ? [] : {};
    // 构造 applyCb 回调函数 
    const job = () => {
        if (cb) {
            // watch(source, cb)
            // immediate为true的时候收集依赖
            const newValue = effect.run();
            // 为什么要加deep？？
            // 因为当deep为true的时候就是代表着watcher的是一个对象，
            // 然后在进行新旧数据对比的时候新旧对象都是一个地址的所以会永远相等，就认为没有改变了
            // 如果不加的话就不会执行到这里面
            if (deep || (isMultiSource ?
                newValue.some((v, i) => hasChanged(v, oldValue[i])) :
                hasChanged(newValue, oldValue))) {
                // cleanup before running cb again
                if (cleanup) {
                    cleanup();
                }
                cb(newValue, oldValue === {} ? undefined : oldValue, onInvalidate)
                oldValue = newValue;
            }
        }
        else {
            // watchEffect
            effect.run();
        }
    };
    let scheduler;
    // 创建 scheduler 时序执行函数 省略了flush为post和sync
    scheduler = () => {
        job();
    };
    const effect = new ReactiveEffect(getter, scheduler);
    {
        effect.onTrack = onTrack;
        effect.onTrigger = onTrigger;
    }
    // initial run
    if (cb) {
        if (immediate) {
            job();
        }
        else {
            // immediate为false的时候收集依赖
            oldValue = effect.run();
        }
    }else {
        effect.run();
    }
    return () => {
        effect.stop();
    };
}


function traverse(value, seen = new Set()) {
    if (!isObject(value)) {
        return value;
    }
    seen = seen || new Set();
    if (seen.has(value)) {
        return value;
    }
    seen.add(value);
    if (isRef(value)) {
        traverse(value.value, seen);
    }
    else if (isArray(value)) {
        for (let i = 0; i < value.length; i++) {
            traverse(value[i], seen);
        }
    }
    else if (isSet(value) || isMap(value)) {
        value.forEach((v) => {
            traverse(v, seen);
        });
    }
    else if (isPlainObject(value)) {
        for (const key in value) {
            traverse(value[key], seen);
        }
    }
    return value;
}