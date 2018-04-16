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
 * Check if the value is an iterator.
 *
 * @param v The value to check
 */
function isIterator (v: any): boolean {
  if (v == null || typeof v !== 'object') { return false }
  return 'next' in v && typeof v.next === 'function'
}

let runningCoroutine: any = null

interface StackFrame<T> {
  iterator: Iterator<T>
  deferFns: (() => void)[]
}

/**
 * The Lua-like pseudo-coroutine that wraps iterators.
 */
export class Coroutine<T> {

  private iteratorStack: StackFrame<T>[]
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
      this.iteratorStack.push({ iterator: start, deferFns: [] })
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
      let exception: any
      while (0 < this.iteratorStack.length) {
        // get the next value `yield`ed from the current iterator
        let frame = this.iteratorStack[this.iteratorStack.length - 1]
        let { iterator } = frame
        let r: IteratorResult<T | number | Iterator<T>> = null
        let ex: any = null
        runningCoroutine = this
        try {
          if (exception != null) {
            if (!iterator.throw) {
              throw exception
            }
            r = iterator.throw(exception)
          } else {
            r = iterator.next(resumeValue)
          }
        } catch (e) {
          ex = e
        }
        exception = null
        runningCoroutine = null
        if (ex != null) {
          const e = this.popStack()
          if (e != null) ex = e // TODO: composed error
          exception = ex
          continue
        }
        resumeValue = undefined
        if (r.done) {
          const ex = this.popStack()
          if (ex != null) {
            exception = ex
            continue
          }
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
          const iterator = y as Iterator<T>
          this.iteratorStack.push({ iterator, deferFns: [] })
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
      if (exception != null) {
        throw exception
      }
      this.waitingFrames = Math.ceil(wait)
    }
    return result
  }

  protected pushIterator (iter?: Iterator<T>) {
    this.iteratorStack.push({ iterator: iter, deferFns: [] })
  }

  private defer (fn: () => void) {
    if (this.iteratorStack.length === 0) {
      throw new Error('luacoro.defer() must be called from within a coroutine')
    }
    this.iteratorStack[this.iteratorStack.length - 1].deferFns.push(fn)
  }

  private popStack (): any {
    if (this.iteratorStack.length === 0) return null
    const { deferFns } = this.iteratorStack.pop()
    let ex: any = null
    // TODO: call all deferFns and return composed error
    try {
      for (let i = deferFns.length - 1; 0 <= i; i--) {
        deferFns[i]()
      }
    } catch (e) {
      ex = e
    }
    return ex
  }

}

/**
 * Register `fn` to be invoked when exiting the caller iterator.
 * Works like [Golang's defer](https://golang.org/ref/spec#Defer_statements).
 *
 * @param fn Callback
 */
export function defer (fn: () => void) {
  if (!runningCoroutine) {
    throw new Error('luacoro.defer() must be called from within a coroutine')
  }
  runningCoroutine.defer(fn)
}

/**
 * Generator with no argument.
 */
export type SimpleGenerator<T> = () => Iterator<T>

/**
 * Iterator or generator to be coroutine, or coroutine itself.
 */
export type Coroutinizable<T> = Coroutine<T> | Iterator<T> | SimpleGenerator<T>

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
export function create<T> (start?: Coroutinizable<T>): Coroutine<T> {
  if (start instanceof Coroutine) {
    return start
  }
  if (isIterator(start)) {
    return new Coroutine(start as Iterator<T>)
  }
  return new Coroutine((start as SimpleGenerator<T>)())
}

/**
 * Coroutine that wraps multiple iterators and yields results in an array.
 */
export class ComposedCoroutine<T> extends Coroutine<T[]> {

  private children: Coroutine<T>[]

  /**
   * Create a new coroutine to iterate all `coroutines`.
   * Read `all<T>` and `race<T>` for details.
   *
   * @param coroutines Coroutines or iterators
   * @param fnAlive Callback to judge this coroutine is alive or not
   */
  constructor (coroutines: Coroutine<T>[], fnAlive: (children: Coroutine<T>[]) => boolean) {
    super()
    this.children = [].concat(coroutines)
    this.pushIterator(this.main(fnAlive))
  }

  /**
   * Add a `coroutine` to iterate together.
   * @param c Coroutine or iterator
   */
  public add (coroutine: Coroutinizable<T>) {
    this.children.push(create(coroutine))
  }

  private *main (fnAlive: (children: Coroutine<T>[]) => boolean): Iterator<T[]> {
    while (true) {
      const result = []
      for (let coro of [].concat(this.children)) {
        result.push(coro.resume())
      }
      if (!fnAlive(this.children)) return result
      yield result
    }
  }

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
export function concurrent<T> (coroutines: Coroutinizable<T>[]): ComposedCoroutine<T> {
  return new ComposedCoroutine(
    coroutines.map(c => create(c)),
    (children: Coroutine<T>[]): boolean => {
      for (let i = children.length - 1; 0 <= i; i--) {
        if (!children[i].isAlive) children.splice(i, 1)
      }
      return true
    }
  )
}

/**
 * Create a new coroutine to iterate all `coroutines`
 * concurrently until the all of them are dead.
 *
 * @param coroutines Coroutines or iterators
 * @returns Composed coroutine
 */
export function all<T> (coroutines: Coroutinizable<T>[]): ComposedCoroutine<T> {
  return new ComposedCoroutine(
    coroutines.map(c => create(c)),
    (children: Coroutine<T>[]): boolean => {
      for (let coro of children) {
        if (coro.isAlive) return true
      }
      return false
    }
  )
}

/**
 * Create a new coroutine to iterate all `coroutines`
 * concurrently until one of them is dead.
 *
 * @param coroutines Coroutines or iterators
 * @returns Composed coroutine
 */
export function race<T> (coroutines: (Coroutinizable<T>)[]): ComposedCoroutine<T> {
  return new ComposedCoroutine(
    coroutines.map(c => create(c)),
    (children: Coroutine<T>[]): boolean => {
      if (children.length === 0) return false
      for (let coro of children) {
        if (!coro.isAlive) return false
      }
      return true
    }
  )
}

/**
 * Create a new coroutine that repeats
 * generating iterator and iterating it forever.
 *
 * @param generator Generator (instance methods must be `bind`ed, be careful)
 * @returns Composed coroutine
 */
export function forever<T> (generator: SimpleGenerator<T>): Coroutine<T> {
  return new Coroutine(function* (): Iterator<T> {
    let coro
    while (true) {
      let isNew = false
      if (!(coro && coro.isAlive)) {
        coro = new Coroutine(generator())
        isNew = true
      }
      const v = coro.resume()
      if (!coro.isAlive && v == null && !isNew) {
        continue
      }
      yield v
    }
  }())
}
