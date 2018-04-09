"use strict";
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
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
 * Create a new coroutine to iterate `start` first.
 *
 * `start` must be implemented to `yield` (or `return`) values of the following 3 types:
 *
 * - `o`: An object of an arbitary class
 *   - `resume()` returns `o`.
 *   - If `o` has a `wait` field, `resume()` returns `null` through `o.wait - 1` frames after that.
 *     The iterator is not resumed while this, which means that
 *     this coroutine waits `n` frames including the current frame.
 *   - In principle, values of this type must be `yield`ed.
 *     If a value of this type is `return`ed, the coroutine will be stopped.
 *
 * - `n`: A number
 *   - `resume()` returns `null`.
 *   - After that, `resume()` returns `null` through `n - 1` frames.
 *     The iterator is not resumed while this, which means that
 *     this coroutine waits `n` frames including the current frame.
 *
 * - `i`: An iterator of the same type as `start`
 *   - When `i` is `return`ed, the current iterator is terminated
 *     and `i` is immediately started to iterate as the replacement.
 *   - When `i` is `yield`ed, the current iterator is paused and pushed onto the stack,
 *     and `i` is immediately started to iterate.
 *     After `i` is terminated, the caller iterator is popped from the stack and continued.
 *
 * @param start Iterator to be started to iterate first
 */
function create(start) {
    return new Coroutine(start);
}
exports.create = create;
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
            this.iteratorStack.push(start);
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
            while (0 < this.iteratorStack.length) {
                // get the next value `yield`ed from the current iterator
                var iter = this.iteratorStack[this.iteratorStack.length - 1];
                var r = iter.next(resumeValue);
                resumeValue = undefined;
                if (r.done) {
                    this.iteratorStack.pop();
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
                    var iter_1 = y;
                    this.iteratorStack.push(iter_1);
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
            this.waitingFrames = Math.ceil(wait);
        }
        return result;
    };
    return Coroutine;
}());
exports.Coroutine = Coroutine;
function all(iterators) {
    return new Coroutine(function (coros) {
        var isAlive, result, _i, coros_1, coro;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!true) return [3 /*break*/, 2];
                    isAlive = false;
                    result = [];
                    for (_i = 0, coros_1 = coros; _i < coros_1.length; _i++) {
                        coro = coros_1[_i];
                        result.push(coro.resume());
                        if (coro.isAlive) {
                            isAlive = true;
                        }
                    }
                    if (!isAlive) {
                        return [2 /*return*/, result];
                    }
                    return [4 /*yield*/, result];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 0];
                case 2: return [2 /*return*/];
            }
        });
    }(iterators.map(function (i) { return new Coroutine(i); })));
}
exports.all = all;
function race(iterators) {
    return new Coroutine(function (coros) {
        var isAlive, result, _i, coros_2, coro;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!true) return [3 /*break*/, 2];
                    isAlive = true;
                    result = [];
                    for (_i = 0, coros_2 = coros; _i < coros_2.length; _i++) {
                        coro = coros_2[_i];
                        result.push(coro.resume());
                        if (!coro.isAlive) {
                            isAlive = false;
                        }
                    }
                    if (!isAlive) {
                        return [2 /*return*/, result];
                    }
                    return [4 /*yield*/, result];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 0];
                case 2: return [2 /*return*/];
            }
        });
    }(iterators.map(function (i) { return new Coroutine(i); })));
}
exports.race = race;
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