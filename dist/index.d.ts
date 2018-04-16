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
    protected pushIterator(iter?: Iterator<T>): void;
    private defer(fn);
    private popStack();
}
/**
 * Register `fn` to be invoked when exiting the caller iterator.
 * Works like [Golang's defer](https://golang.org/ref/spec#Defer_statements).
 *
 * @param fn Callback
 */
export declare function defer(fn: () => void): void;
/**
 * Generator with no argument.
 */
export declare type SimpleGenerator<T> = () => Iterator<T>;
/**
 * Iterator or generator to be coroutine, or coroutine itself.
 */
export declare type Coroutinizable<T> = Coroutine<T> | Iterator<T> | SimpleGenerator<T>;
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
export declare function create<T>(start?: Coroutinizable<T>): Coroutine<T>;
/**
 * Coroutine that wraps multiple iterators and yields results in an array.
 */
export declare class ComposedCoroutine<T> extends Coroutine<T[]> {
    private children;
    /**
     * Create a new coroutine to iterate all `coroutines`.
     * Read `all<T>` and `race<T>` for details.
     *
     * @param coroutines Coroutines or iterators
     * @param fnAlive Callback to judge this coroutine is alive or not
     */
    constructor(coroutines: Coroutine<T>[], fnAlive: (children: Coroutine<T>[]) => boolean);
    /**
     * Add a `coroutine` to iterate together.
     * @param c Coroutine or iterator
     */
    add(coroutine: Coroutinizable<T>): void;
    private main(fnAlive);
}
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
export declare function concurrent<T>(coroutines: Coroutinizable<T>[]): ComposedCoroutine<T>;
/**
 * Create a new coroutine to iterate all `coroutines`
 * concurrently until the all of them are dead.
 *
 * @param coroutines Coroutines or iterators
 * @returns Composed coroutine
 */
export declare function all<T>(coroutines: Coroutinizable<T>[]): ComposedCoroutine<T>;
/**
 * Create a new coroutine to iterate all `coroutines`
 * concurrently until one of them is dead.
 *
 * @param coroutines Coroutines or iterators
 * @returns Composed coroutine
 */
export declare function race<T>(coroutines: (Coroutinizable<T>)[]): ComposedCoroutine<T>;
/**
 * Create a new coroutine that repeats
 * generating iterator and iterating it forever.
 *
 * @param generator Generator (instance methods must be `bind`ed, be careful)
 * @returns Composed coroutine
 */
export declare function forever<T>(generator: SimpleGenerator<T>): Coroutine<T>;
