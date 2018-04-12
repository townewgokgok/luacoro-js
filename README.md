# luacoro-js

[![Build Status][travisci-image]][travisci-url]
[![npm][npm-image]][npm-url]
[![Dependency Status][dependencies-image]][dependencies-url]
[![MIT License][license-image]][license-url]

[npm-image]: https://badge.fury.io/js/luacoro.svg
[npm-url]: https://badge.fury.io/js/luacoro

[travisci-image]: https://travis-ci.org/townewgokgok/luacoro-js.svg?branch=master
[travisci-url]: https://travis-ci.org/townewgokgok/luacoro-js

[dependencies-image]: https://david-dm.org/townewgokgok/luacoro-js.svg
[dependencies-url]: https://david-dm.org/townewgokgok/luacoro-js

[license-image]: https://img.shields.io/badge/License-MIT-blue.svg
[license-url]: https://opensource.org/licenses/MIT

Lua-like pseudo-coroutine for JavaScript/TypeScript using generator.
[Demo](https://townewgokgok.github.io/luacoro-js/)

TOC

<!-- TOC depthFrom:2 updateOnSave:true -->

- [Installation](#installation)
- [Examples](#examples)
    - [Basic](#basic)
    - [Concurrent](#concurrent)
    - [Recursion](#recursion)
    - [Inn (something like an RPG scenario)](#inn-something-like-an-rpg-scenario)
- [Error handling](#error-handling)
- [Golang-like defer](#golang-like-defer)
- [Functions](#functions)
    - [Function `create`](#function-create)
    - [Function `all`](#function-all)
    - [Function `race`](#function-race)
    - [Function `forever`](#function-forever)
    - [Function `defer`](#function-defer)
- [Class Coroutine<T>](#class-coroutinet)
    - [Method `resume`](#method-resume)
    - [Method `stop`](#method-stop)
    - [Accessor `isAlive`](#accessor-isalive)

<!-- /TOC -->
<!-- generated by https://marketplace.visualstudio.com/items?itemName=AlanWalk.markdown-toc -->

## Installation

```bash
npm install --save luacoro
```

```typescript
import * as luacoro from 'luacoro'
// or
const luacoro = require('luacoro')
```

## Examples

Compare these with the [demo](https://townewgokgok.github.io/luacoro-js/)

### Basic

Source: [examples/browser/src/basic.ts](./examples/browser/src/basic.ts)

```typescript
const bpm = 160 // tempo
const n8 = Math.round(60 * 60 / bpm / 2) // frame count of 8th note
const n4 = n8 * 2
const n4d = n8 * 3
const n1 = n8 * 8

interface MessageFrame {
  text: string
  wait: number
}

function* maryHadA (): luacoro.Iterator<MessageFrame> {
  yield { text: 'Ma', wait: n4d } // `resume()` returns this value and
                                  // wait `n4d` frames with suspending here
  yield { text: 'ry ', wait: n8 }
  yield { text: 'had ', wait: n4 }
  yield { text: 'a ', wait: n4 }
}

function* littleLamb (withoutRest?: boolean): luacoro.Iterator<MessageFrame> {
  yield { text: 'lit', wait: n4 }
  yield { text: 'tle ', wait: n4 }
  yield { text: 'lamb ', wait: n4 }
  if (!withoutRest) {
    yield n4
  }
}

function* maryHadALittleLamb (): luacoro.Iterator<MessageFrame> {
  yield maryHadA() // To go to another iterator and come back, just yield it
  yield littleLamb()
  yield littleLamb()
  yield littleLamb()
  yield maryHadA()
  yield littleLamb(true)
  yield { text: 'its ', wait: n4 }
  yield { text: 'fleece ', wait: n4 }
  yield { text: 'was ', wait: n4 }
  yield { text: 'white ', wait: n4 }
  yield { text: 'as ', wait: n4 }
  yield { text: 'snow ', wait: n1 }
}

const coro = luacoro.create(maryHadALittleLamb())

function update () {
  const v = coro.resume()
  if (v && v.text) {
    textarea.textContent += v.text
  }
  if (coro.isAlive) {
    requestAnimationFrame(update)
  }
}

requestAnimationFrame(update)
```

### Concurrent

Source: [examples/browser/src/concurrent.ts](./examples/browser/src/concurrent.ts)

```typescript
const absoluteVelocity = 3

class Sprite {

  // ...

  *move (to: Vector): luacoro.Iterator<{}> {
    const distance = to.sub(this.pos)
    const direction = distance.normalize()
    const velocity = direction.mul(absoluteVelocity)
    const division = Math.ceil(distance.size() / absoluteVelocity)
    for (let i = 1; i < division; i++) {
      this.pos = this.pos.add(velocity)
      yield // wait 1 frame
    }
    this.pos = to.clone()
    yield // wait 1 frame
  }

  *goRound (): luacoro.Iterator<{}> {
    yield this.move(topRight) // To go to another iterator and come back, just yield it
    yield this.move(bottomRight)
    yield this.move(bottomLeft)
    yield this.move(topLeft)
  }

  *backAndForth (): luacoro.Iterator<{}> {
    yield this.move(bottomRight)
    yield this.move(topLeft)
  }

}

const redSprite = new Sprite('red', topLeft)
const blueSprite = new Sprite('blue', topLeft)

const coro = luacoro.all([
  luacoro.forever(redSprite.goRound.bind(redSprite)),
  luacoro.forever(blueSprite.backAndForth.bind(blueSprite))
])

function update () {
  coro.resume()
  repaint()
  requestAnimationFrame(update)
}

requestAnimationFrame(update)
```

### Recursion

Source: [examples/browser/src/recursion.ts](./examples/browser/src/recursion.ts)

```typescript
const eps = 2.0
const size = 300

function* koch (v: Vector): luacoro.Iterator<Vector> {
  if (v.size() <= eps) {
    yield v // resume() returns v and wait 1 frame
            // (different from `return v`, be careful)
    return // back to the caller iterator (with no return value)
  }
  const t = v.mul(1.0 / 3.0)
                                       // ＿/\＿
  yield koch(t)                        // ＿
  yield koch(t.rotate(-Math.PI / 3.0)) //   /
  yield koch(t.rotate(Math.PI / 3.0))  //    \
  yield koch(t)                        //     ＿
  // back to the caller iterator (with no return value)
}

let pos = new Vector(0, size * .8)
const vec = new Vector(size, 0)
const coro = luacoro.create(koch(vec))

function update () {
  const v = coro.resume()
  drawLine(pos, pos.add(v))
  pos = pos.add(v)
  if (coro.isAlive) {
    requestAnimationFrame(update)
  }
}

requestAnimationFrame(update)
```

### Inn (something like an RPG scenario)

Source: [examples/browser/src/inn.ts](./examples/browser/src/inn.ts)

```typescript
function* inn (): luacoro.Iterator<string> {
  message('Welcome to the traveler\'s Inn.')
  message('Room and board is 6 GOLD per night.')
  message('Dost thou want a room? (Y/N)')
  const key = yield waitKey(['y', 'n'])

  if (key === 'y') {
    message('Good night.')
    yield waitFrame(30)
    yield waitFadeOut()
    yield waitFrame(30)
    // player.money -= 6
    // player.hp = player.maxHP
    // player.mp = player.maxMP
    yield waitFadeIn()
    message('Good morning.')
    message('Thou hast had a good night\'s sleep I hope.')
    yield waitKey()
  }

  message('I shall see thee again.')
  yield waitKey()
}
```

## Error handling

Can handle errors just like normal functions.

See [src/index.spec.ts](./src/index.spec.ts#L100-L123)

```typescript
it('handles error', () => {
  let result = ''

  function* second (): luacoro.Iterator<{}> {
    throw new Error('an error')
  }

  function* first (): luacoro.Iterator<{}> {
    try {
      yield second()
    } catch (e) {
      result += 'caught '
    }
    yield second()
  }

  const c = luacoro.create(first())
  try {
    c.resume()
  } catch (e) {
    result += e.message
  }
  expect(result).toEqual('caught an error')
})
```

## Golang-like defer

`luacoro.defer` works like [Golang's defer](https://golang.org/ref/spec#Defer_statements).
Useful to clean up scene scoped resources.

Defer functions must be normal functions.
Not `yield`able within them.

See [src/index.spec.ts](./src/index.spec.ts#L193-L228)

```typescript
function* sub (out: string[]) {
  luacoro.defer(() => out.push('sd'))
  out.push('s')
}

function* main (i: number, out: string[]) {
  luacoro.defer(() => out.push('d1'))
  out.push('1')
  if (i === 0) return
  yield sub(out)
  if (i === 1) throw new Error('error')
  luacoro.defer(() => out.push('d2'))
  out.push('2')
}

function* test () {
  const result = []
  yield main(0, result)
  yield result.join(' ')
  result.push('|')
  try {
    yield main(1, result)
  } catch (e) {
    yield result.join(' ')
    result.push('|')
  }
  yield main(2, result)
  return result.join(' ')
}

it('works', () => {
  const c = luacoro.create(test())
  expect(c.resume()).toEqual('1 d1')
  expect(c.resume()).toEqual('1 d1 | 1 s sd d1')
  expect(c.resume()).toEqual('1 d1 | 1 s sd d1 | 1 s sd 2 d2 d1')
})
```

## Functions

### Function `create`

```typescript
create<T> (start?: Coroutinizable<T>): Coroutine<T>
```

Create a new coroutine to iterate `start` first.
`start` normally must be an iterator generated by a generator
implemented to `yield` (or `return`) values of the following 3 types:

- `o`: An instance of arbitary class or plain `object` | `string` | `Array`
  - `resume()` returns `o`.
  - If `o` has a `wait` field, `resume()` returns `null`
    through `o.wait - 1` frames after that.
    The iterator is not resumed while this, which means that
    this coroutine waits `n` frames including the current frame.

- `n`: A `number`
  - `resume()` returns `null`.
  - After that, `resume()` returns `null` through `n - 1` frames.
    The iterator is not resumed while this, which means that
    this coroutine waits `n` frames including the current frame.

- `i`: An `Iterator` of the same type as `start`
  - When `i` is `return`ed, the current iterator is terminated
    and `i` is immediately started to iterate as the replacement.
  - When `i` is `yield`ed, the current iterator is paused and pushed onto the stack,
    and `i` is immediately started to iterate.
    After `i` is terminated, the caller iterator is popped from the stack
    and continued to be iterated.
    At this time, the return value of `i` can be got.

### Function `all`

```typescript
all<T> (coroutines: Coroutinizable<T>[]): Coroutine<T[]>
```

Create a new coroutine to iterate all `coroutines`
concurrently until the all of them are dead.

### Function `race`

```typescript
race<T> (coroutines: Coroutinizable<T>[]): Coroutine<T[]>
```

Create a new coroutine to iterate all `coroutines`
concurrently until one of them is dead.

### Function `forever`

```typescript
forever<T> (generator: SimpleGenerator<T>): Coroutine<T>
```

Create a new coroutine that repeats
generating iterator and iterating it forever.

### Function `defer`

```typescript
defer (fn: () => void)
```

Register `fn` to be invoked when exiting the caller iterator.
Works like [Golang's defer](https://golang.org/ref/spec#Defer_statements).

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
