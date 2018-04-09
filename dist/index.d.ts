/**
 * The iterator interface with methods with type parameter
 * extended to be able to return the iterator itself.
 */
export interface Iterator<T> {
    next(value?: any): IteratorResult<T | number | Iterator<T>>;
    return?(value?: any): IteratorResult<T | number | Iterator<T>>;
    throw?(e?: any): IteratorResult<T | number | Iterator<T>>;
}
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
export declare function create<T>(start?: Iterator<T>): Coroutine<T>;
/**
 * The Lua-like pseudo-coroutine that wraps iterators.
 */
export declare class Coroutine<T> {
    private iteratorStack;
    private waitingFrames;
    /**
     * Create a new coroutine to iterate `start` first.
     * Read `create<T>` for details.
     *
     * @param start Iterator to be started to iterate first
     */
    constructor(start?: Iterator<T>);
    /**
     * Whether this coroutine is alive.
     */
    readonly isAlive: boolean;
    /**
     * Stop this coroutine.
     */
    stop(): void;
    /**
     * Resume the current iterator and receive the yielded value at the next frame.
     * This method will return nulls forever after the coroutine stops.
     *
     * @returns The value at the next frame
     */
    resume(resumeValue?: T): T;
}
export declare function all<T>(iterators: Iterator<T>[]): Coroutine<T[]>;
export declare function race<T>(iterators: Iterator<T>[]): Coroutine<T[]>;
export declare function forever<T>(generator: () => Iterator<T>): Coroutine<T>;
