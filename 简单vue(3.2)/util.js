const isFunction = (val) => typeof val === 'function';
const isObject = (val) => typeof val === 'object';
const hasChanged = (value, oldValue) => !Object.is(value, oldValue);
const isArray = Array.isArray;
const objectToString = Object.prototype.toString;
const toTypeString = (value) => objectToString.call(value);
const isMap = (val) => toTypeString(val) === '[object Map]';
const isSet = (val) => toTypeString(val) === '[object Set]';
const isPlainObject = (val) => toTypeString(val) === '[object Object]';
const isSymbol = (val) => typeof val === 'symbol';
const builtInSymbols = new Set(Object.getOwnPropertyNames(Symbol)
    .map(key => Symbol[key])
    .filter(isSymbol));
const isNonTrackableKeys = makeMap(`__proto__,__v_isRef,__isVue`);

function makeMap(str, expectsLowerCase) {
    const map = Object.create(null);
    const list = str.split(',');
    for (let i = 0; i < list.length; i++) {
        map[list[i]] = true;
    }
    return expectsLowerCase ? val => !!map[val.toLowerCase()] : val => !!map[val];
}

function hasOwn(val, key) {
    const hasOwnProperty = Object.prototype.hasOwnProperty
    return hasOwnProperty.call(val, key)
}

function isRef(r) {
    return Boolean(r && r.__v_isRef === true);
}

function isReactive(value) {
    return !!(value && value["__v_isReactive" /* IS_REACTIVE */]);
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