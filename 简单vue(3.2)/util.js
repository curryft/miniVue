const isFunction = (val) => typeof val === 'function';

const isObject = (val) => typeof val === 'object';

const hasChanged = (value, oldValue) => !Object.is(value, oldValue);

function hasOwn(val, key) {
    const hasOwnProperty = Object.prototype.hasOwnProperty
    return hasOwnProperty.call(val, key)
}

function isRef(r) {
    return Boolean(r && r.__v_isRef === true);
}

// 取出原始数据
function toRaw(observed) {
    const raw = observed && observed["__v_raw" /* RAW */];
    return raw ? toRaw(raw) : observed;
}

const createDep = (effects) => {
    const dep = new Set(effects);
    dep.w = 0;
    dep.n = 0;
    return dep;
};

const isArray = Array.isArray;