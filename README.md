# luacoro-js

[![Build Status][travisci-image]][travisci-url] [![Dependency Status][dependencies-image]][dependencies-url] [![MIT License][license-image]][license-url]

[travisci-image]: https://travis-ci.org/townewgokgok/luacoro-js.svg?branch=master
[travisci-url]: https://travis-ci.org/townewgokgok/luacoro-js

[dependencies-image]: https://david-dm.org/townewgokgok/luacoro-js.svg
[dependencies-url]: https://david-dm.org/townewgokgok/luacoro-js

[license-image]: https://img.shields.io/badge/License-MIT-blue.svg
[license-url]: https://opensource.org/licenses/MIT

Lua-like coroutine for JavaScript using generator

## Examples

### Self recursion

```typescript
const eps = 2.0

function* koch (v: Vector): luacoro.Iterator<Vector> {
  if (v.size() <= eps) {
    yield v // resume() returns v and wait 1 frame (different from `return v`, be careful)
    return // back to the caller iterator
  }
  const t = v.mul(1.0 / 3.0)
                                       // ＿/\＿
  yield koch(t)                        // ＿
  yield koch(t.rotate(-Math.PI / 3.0)) //   /
  yield koch(t.rotate(Math.PI / 3.0))  //    \
  yield koch(t)                        //     ＿
}

let pos = new Vector(0, 400)
const vec = new Vector(500, 0)
const coro = luacoro.create(koch(vec))

function update () {
  const v = coro.resume()

  // draw line from pos to pos.add(v)
  // ...

  pos = pos.add(v)
  requestAnimationFrame(update)
}

requestAnimationFrame(update)
```

## Functions

### Function `create`

```typescript
create<T> (start?: Iterator<T>): Coroutine<T>
```

Create a new coroutine to iterate `start` first.
`start` must be implemented to `yield` (or `return`) values of the following 3 types:

- `o`: An object of an arbitary class
  - `resume()` returns `o`.
  - If `o` has a `wait` field, `resume()` returns `null` through `o.wait - 1` frames after that.
    The iterator is not resumed while this, which means that
    this coroutine waits `n` frames including the current frame.
  - In principle, values of this type must be `yield`ed.
    If a value of this type is `return`ed, the coroutine will be stopped.
- `n`: A number
  - `resume()` returns `null`.
  - After that, `resume()` returns `null` through `n - 1` frames.
    The iterator is not resumed while this, which means that
    this coroutine waits `n` frames including the current frame.
- `i`: An iterator of the same type as `start`
  - When `i` is `return`ed, the current iterator is terminated
    and `i` is immediately started to iterate as the replacement.
  - When `i` is `yield`ed, the current iterator is paused and pushed onto the stack,
    and `i` is immediately started to iterate.
    After `i` is terminated, the caller iterator is popped from the stack and continued.

### Function `all`

```typescript
all<T> (iterators: Iterator<T>[]): Coroutine<T[]>
```

Create a new coroutine to iterate all `iterators`
concurrently until the all of them are dead.

### Function `race`

```typescript
race<T> (iterators: Iterator<T>[]): Coroutine<T[]>
```

Create a new coroutine to iterate all `iterators`
concurrently until one of them is dead.

### Function `forever`

```typescript
forever<T> (generator: () => Iterator<T>): Coroutine<T>
```

Create a new coroutine that repeats
generating iterator and iterating it forever.

## Class Coroutine<T>

### Method `resume`

```typescript
resume(resumeValue?: T): T
```

Resume the current iterator and receive the yielded value at the next frame.
This method will return nulls forever after the coroutine stops.

### Method `stop`

```typescript
stop(): void
```

Stop this coroutine.

### Accessor `isAlive`

```typescript
get isAlive(): boolean
```

Whether this coroutine is alive.
