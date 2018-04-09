"use strict";
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
//# sourceMappingURL=index.js.map