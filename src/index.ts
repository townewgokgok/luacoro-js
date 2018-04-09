/**
 * The iterator interface with methods with type parameter
 * extended to be able to return the iterator itself.
 */
export interface Iterator<T> {
  next (value?: any): IteratorResult<T | number | Iterator<T>>
  return? (value?: any): IteratorResult<T | number | Iterator<T>>
  throw? (e?: any): IteratorResult<T | number | Iterator<T>>
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
export function create<T> (start?: Iterator<T>): Coroutine<T> {
  return new Coroutine(start)
}

/**
 * Check if the value is an iterator.
 *
 * @param v The value to check
 */
function isIterator (v: any): boolean {
  if (v == null || typeof v !== 'object') { return false }
  return 'next' in v && typeof v.next === 'function'
}

/**
 * The Lua-like pseudo-coroutine that wraps iterators.
 */
export class Coroutine<T> {

  private iteratorStack: Iterator<T>[]
  private waitingFrames: number

  /**
   * Create a new coroutine to iterate `start` first.
   * Read `create<T>` for details.
   *
   * @param start Iterator to be started to iterate first
   */
  constructor (start?: Iterator<T>) {
    this.waitingFrames = 0
    this.iteratorStack = []
    if (start) {
      this.iteratorStack.push(start)
    }
  }

  /**
   * Whether this coroutine is alive.
   */
  get isAlive (): boolean {
    return 0 < this.iteratorStack.length
  }

  /**
   * Stop this coroutine.
   */
  stop () {
    this.iteratorStack = []
  }

  /**
   * Resume the current iterator and receive the yielded value at the next frame.
   * This method will return nulls forever after the coroutine stops.
   *
   * @returns The value at the next frame
   */
  resume (resumeValue?: T): T {
    let result: T = null
    if (--this.waitingFrames < 1) {
      if (this.iteratorStack.length === 0) { return null }
      let wait = 1 // will be set waitingFrames
      while (0 < this.iteratorStack.length) {
        // get the next value `yield`ed from the current iterator
        const iter = this.iteratorStack[this.iteratorStack.length - 1]
        const r = iter.next(resumeValue)
        resumeValue = undefined
        if (r.done) {
          this.iteratorStack.pop()
        }
        let y = r.value
        if (typeof y === 'undefined') {
          if (r.done) {
            // bare `return` (continue the caller iterator on the stack top)
            continue
          }
          // bare `yield` (wait 1 frame)
          y = null
        }
        if (isIterator(y)) {
          // pause and save the current iterator and start the `yield`ed iterator
          const iter = y as Iterator<T>
          this.iteratorStack.push(iter)
          continue
        } else if (typeof y === 'number') {
          // wait `y` frames
          wait = y as number
          break
        } else {
          // `y` is a value of `T`
          if (r.done && 0 < this.iteratorStack.length) {
            // y is `return`ed from the current iterator so it has been stopped,
            // and y is to be the value of `yield` expression in the caller iterator
            resumeValue = y as T
            continue
          }
          // y is the `resume()` value of the current frame
          result = y as T
          wait = 1
          if (result && typeof (result as any).wait === 'number') {
            wait = (result as any).wait as number
          }
          break
        }
      }
      this.waitingFrames = Math.ceil(wait)
    }
    return result
  }

}