function computed(getterOrOptions) {
    // getter 函数 
    let getter
    // setter 函数 
    let setter
    // 标准化参数 
    if (isFunction(getterOrOptions)) {
        // 表面传入的是 getter 函数，不能修改计算属性的值 
        getter = getterOrOptions
        setter = () => { console.warn('Write operation failed: computed value is readonly') };
    } else {
        getter = getterOrOptions.get
        setter = getterOrOptions.set
    }
    const cRef = new ComputedRefImpl(getter, setter);
    return cRef;
}

class ComputedRefImpl {
    constructor(getter, _setter) {
        this._setter = _setter;
        this.dep = undefined;
        // 数据是否脏的 如果是脏的 则需要执行runner获取最新的数据
        this._dirty = true;
        this.__v_isRef = true;
        this.effect = new ReactiveEffect(getter, () => {
            if (!this._dirty) {
                this._dirty = true;
                // 派发通知，通知运行访问该计算属性的 activeEffect 
                triggerRefValue(this);
            }
        });
    }
    get value() {
        const self = toRaw(this);
        trackRefValue(self);
        if (self._dirty) {
            self._dirty = false;
            self._value = self.effect.run();
        }
        return self._value;
    }
    set value(newValue) {
        this._setter(newValue);
    }
}

class ReactiveEffect {
    constructor(fn, scheduler = null) {
        this.fn = fn;
        this.scheduler = scheduler;
        this.active = true;
        this.deps = [];
    }
    run() {
        if (!this.active) {
            return this.fn();
        }
        activeEffect = this
        return this.fn();
    }
    stop() {
        if (this.active) {
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}

function trackRefValue(ref) {
    ref = toRaw(ref);
    if (!ref.dep) {
        ref.dep = createDep();
    }
    {
        trackEffects(ref.dep, {
            target: ref,
            type: "get" /* GET */,
            key: 'value'
        });
    }
}

function trackEffects(dep, debuggerEventExtraInfo) {
    dep.add(activeEffect);
    // if (activeEffect.onTrack) {
    //     activeEffect.onTrack(Object.assign({
    //         effect: activeEffect
    //     }, debuggerEventExtraInfo));
    // }
}

function triggerRefValue(ref, newVal) {
    ref = toRaw(ref);
    if (ref.dep) {
        {
            triggerEffects(ref.dep, {
                target: ref,
                type: "set" /* SET */,
                key: 'value',
                newValue: newVal
            });
        }
    }
}

function triggerEffects(dep, debuggerEventExtraInfo) {
    // spread into array for stabilization
    for (const effect of isArray(dep) ? dep : [...dep]) {
        // if (effect.onTrigger) {
        //     effect.onTrigger(Object.assign({
        //         effect: activeEffect
        //     }, debuggerEventExtraInfo));
        // }
        // 调度执行
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}
