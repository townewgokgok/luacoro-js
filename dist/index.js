"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Check if the value is an iterator.
 *
 * @param v The value to check
 */
function isIterator(v) {
    if (v == null || typeof v !== 'object') {
        return false;
    }
    return 'next' in v && typeof v.next === 'function';
}
var runningCoroutine = null;
/**
 * The Lua-like pseudo-coroutine that wraps iterators.
 */
var Coroutine = /** @class */ (function () {
    /**
     * Create a new coroutine to iterate `start` first.
     * Read `create<T>` for details.
     *
     * @param start Iterator to be started to iterate first
     */
    function Coroutine(start) {
        this.waitingFrames = 0;
        this.iteratorStack = [];
        if (start) {
            this.iteratorStack.push({ iterator: start, deferFns: [] });
        }
    }
    Object.defineProperty(Coroutine.prototype, "isAlive", {
        /**
         * Whether this coroutine is alive.
         */
        get: function () {
            return 0 < this.iteratorStack.length;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Stop this coroutine.
     */
    Coroutine.prototype.stop = function () {
        this.iteratorStack = [];
    };
    /**
     * Resume the current iterator and receive the yielded value at the next frame.
     * This method will return nulls forever after the coroutine stops.
     *
     * @returns The value at the next frame
     */
    Coroutine.prototype.resume = function (resumeValue) {
        var result = null;
        if (--this.waitingFrames < 1) {
            if (this.iteratorStack.length === 0) {
                return null;
            }
            var wait = 1; // will be set waitingFrames
            var exception = void 0;
            while (0 < this.iteratorStack.length) {
                // get the next value `yield`ed from the current iterator
                var frame = this.iteratorStack[this.iteratorStack.length - 1];
                var iterator = frame.iterator;
                var r = null;
                var ex = null;
                runningCoroutine = this;
                try {
                    if (exception != null) {
                        if (!iterator.throw) {
                            throw exception;
                        }
                        r = iterator.throw(exception);
                    }
                    else {
                        r = iterator.next(resumeValue);
                    }
                }
                catch (e) {
                    ex = e;
                }
                exception = null;
                runningCoroutine = null;
                if (ex != null) {
                    var e = this.popStack();
                    if (e != null)
                        ex = e; // TODO: composed error
                    exception = ex;
                    continue;
                }
                resumeValue = undefined;
                if (r.done) {
                    var ex_1 = this.popStack();
                    if (ex_1 != null) {
                        exception = ex_1;
                        continue;
                    }
                }
                var y = r.value;
                if (typeof y === 'undefined') {
                    if (r.done) {
                        // bare `return` (continue the caller iterator on the stack top)
                        continue;
                    }
                    // bare `yield` (wait 1 frame)
                    y = null;
                }
                if (isIterator(y)) {
                    // pause and save the current iterator and start the `yield`ed iterator
                    var iterator_1 = y;
                    this.iteratorStack.push({ iterator: iterator_1, deferFns: [] });
                    continue;
                }
                else if (typeof y === 'number') {
                    // wait `y` frames
                    wait = y;
                    break;
                }
                else {
                    // `y` is a value of `T`
                    if (r.done && 0 < this.iteratorStack.length) {
                        // y is `return`ed from the current iterator so it has been stopped,
                        // and y is to be the value of `yield` expression in the caller iterator
                        resumeValue = y;
                        continue;
                    }
                    // y is the `resume()` value of the current frame
                    result = y;
                    wait = 1;
                    if (result && typeof result.wait === 'number') {
                        wait = result.wait;
                    }
                    break;
                }
            }
            if (exception != null) {
                throw exception;
            }
            this.waitingFrames = Math.ceil(wait);
        }
        return result;
    };
    Coroutine.prototype.pushIterator = function (iter) {
        this.iteratorStack.push({ iterator: iter, deferFns: [] });
    };
    Coroutine.prototype.defer = function (fn) {
        if (this.iteratorStack.length === 0) {
            throw new Error('luacoro.defer() must be called from within a coroutine');
        }
        this.iteratorStack[this.iteratorStack.length - 1].deferFns.push(fn);
    };
    Coroutine.prototype.popStack = function () {
        if (this.iteratorStack.length === 0)
            return null;
        var deferFns = this.iteratorStack.pop().deferFns;
        var ex = null;
        // TODO: call all deferFns and return composed error
        try {
            for (var i = deferFns.length - 1; 0 <= i; i--) {
                deferFns[i]();
            }
        }
        catch (e) {
            ex = e;
        }
        return ex;
    };
    return Coroutine;
}());
exports.Coroutine = Coroutine;
/**
 * Register `fn` to be invoked when exiting the caller iterator.
 * Works like [Golang's defer](https://golang.org/ref/spec#Defer_statements).
 *
 * @param fn Callback
 */
function defer(fn) {
    if (!runningCoroutine) {
        throw new Error('luacoro.defer() must be called from within a coroutine');
    }
    runningCoroutine.defer(fn);
}
exports.defer = defer;
/**
 * Create a new coroutine to iterate `start` first.
 *
 * `start` normally must be an iterator generated by a generator
 * implemented to `yield` (or `return`) values of the following 3 types:
 *
 * - `o`: An instance of arbitary class or plain `object` | `string` | `Array`
 *   - `resume()` returns `o`.
 *   - If `o` has a `wait` field, `resume()` returns `null`
 *     through `o.wait - 1` frames after that.
 *     The iterator is not resumed while this, which means that
 *     this coroutine waits `n` frames including the current frame.
 *
 * - `n`: A `number`
 *   - `resume()` returns `null`.
 *   - After that, `resume()` returns `null` through `n - 1` frames.
 *     The iterator is not resumed while this, which means that
 *     this coroutine waits `n` frames including the current frame.
 *
 * - `i`: An `Iterator` of the same type as `start`
 *   - When `i` is `return`ed, the current iterator is terminated
 *     and `i` is immediately started to iterate as the replacement.
 *   - When `i` is `yield`ed, the current iterator is paused and pushed onto the stack,
 *     and `i` is immediately started to iterate.
 *     After `i` is terminated, the caller iterator is popped from the stack
 *     and continued to be iterated.
 *     At this time, the return value of `i` can be got.
 *
 * @param start Iterator to be started to iterate first
 */
function create(start) {
    if (start instanceof Coroutine) {
        return start;
    }
    if (isIterator(start)) {
        return new Coroutine(start);
    }
    return new Coroutine(start());
}
exports.create = create;
/**
 * Coroutine that wraps multiple iterators and yields results in an array.
 */
var ComposedCoroutine = /** @class */ (function (_super) {
    __extends(ComposedCoroutine, _super);
    /**
     * Create a new coroutine to iterate all `coroutines`.
     * Read `all<T>` and `race<T>` for details.
     *
     * @param coroutines Coroutines or iterators
     * @param fnAlive Callback to judge this coroutine is alive or not
     */
    function ComposedCoroutine(coroutines, fnAlive) {
        var _this = _super.call(this) || this;
        _this.children = [].concat(coroutines);
        _this.pushIterator(_this.main(fnAlive));
        return _this;
    }
    /**
     * Add a `coroutine` to iterate together.
     * @param c Coroutine or iterator
     */
    ComposedCoroutine.prototype.add = function (coroutine) {
        this.children.push(create(coroutine));
    };
    ComposedCoroutine.prototype.main = function (fnAlive) {
        var result, _i, _a, coro;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!true) return [3 /*break*/, 2];
                    result = [];
                    for (_i = 0, _a = [].concat(this.children); _i < _a.length; _i++) {
                        coro = _a[_i];
                        result.push(coro.resume());
                    }
                    if (!fnAlive(this.children))
                        return [2 /*return*/, result];
                    return [4 /*yield*/, result];
                case 1:
                    _b.sent();
                    return [3 /*break*/, 0];
                case 2: return [2 /*return*/];
            }
        });
    };
    return ComposedCoroutine;
}(Coroutine));
exports.ComposedCoroutine = ComposedCoroutine;
/**
 * Create a new coroutine to iterate all `coroutines` concurrently.
 * This coroutine will never die.
 *
 * Additional coroutines can be added by `add<T>()`.
 * Dead coroutines will be removed automatically.
 *
 * @param coroutines Coroutines or iterators
 * @returns Composed coroutine
 */
function concurrent(coroutines) {
    return new ComposedCoroutine(coroutines.map(function (c) { return create(c); }), function (children) {
        for (var i = children.length - 1; 0 <= i; i--) {
            if (!children[i].isAlive)
                children.splice(i, 1);
        }
        return true;
    });
}
exports.concurrent = concurrent;
/**
 * Create a new coroutine to iterate all `coroutines`
 * concurrently until the all of them are dead.
 *
 * Dead coroutines will not be removed to keep array indexes of the `yield`ed value.
 * Adding coroutines by `add<T>()` is discouraged.
 *
 * @param coroutines Coroutines or iterators
 * @returns Composed coroutine
 */
function all(coroutines) {
    return new ComposedCoroutine(coroutines.map(function (c) { return create(c); }), function (children) {
        for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
            var coro = children_1[_i];
            if (coro.isAlive)
                return true;
        }
        return false;
    });
}
exports.all = all;
/**
 * Create a new coroutine to iterate all `coroutines`
 * concurrently until one of them is dead.
 *
 * Array indexes of the `yield`ed value will be keeped.
 * Adding coroutines by `add<T>()` is discouraged.
 *
 * @param coroutines Coroutines or iterators
 * @returns Composed coroutine
 */
function race(coroutines) {
    return new ComposedCoroutine(coroutines.map(function (c) { return create(c); }), function (children) {
        if (children.length === 0)
            return false;
        for (var _i = 0, children_2 = children; _i < children_2.length; _i++) {
            var coro = children_2[_i];
            if (!coro.isAlive)
                return false;
        }
        return true;
    });
}
exports.race = race;
/**
 * Create a new coroutine that repeats
 * generating iterator and iterating it forever.
 *
 * @param generator Generator (instance methods must be `bind`ed, be careful)
 * @returns Composed coroutine
 */
function forever(generator) {
    return new Coroutine(function () {
        var coro, isNew, v;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!true) return [3 /*break*/, 2];
                    isNew = false;
                    if (!(coro && coro.isAlive)) {
                        coro = new Coroutine(generator());
                        isNew = true;
                    }
                    v = coro.resume();
                    if (!coro.isAlive && v == null && !isNew) {
                        return [3 /*break*/, 0];
                    }
                    return [4 /*yield*/, v];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 0];
                case 2: return [2 /*return*/];
            }
        });
    }());
}
exports.forever = forever;
//# sourceMappingURL=index.js.map