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
