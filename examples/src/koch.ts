import * as luacoro from 'luacoro'

class Vector {
  x: number
  y: number

  constructor (x: number = .0, y: number = .0) {
    this.x = x
    this.y = y
  }

  size (): number {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }

  add (v: Vector): Vector {
    return new Vector(this.x + v.x, this.y + v.y)
  }

  mul (r: number): Vector {
    return new Vector(this.x * r, this.y * r)
  }

  rotate (rad: number): Vector {
    const c = Math.cos(rad)
    const s = Math.sin(rad)
    return new Vector(
      this.x * c - this.y * s,
      this.x * s + this.y * c
    )
  }
}

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

export function start (canvas: HTMLCanvasElement, info: HTMLDivElement) {

  let pos = new Vector(0, canvas.height * .8)
  const vec = new Vector(canvas.width, 0)
  const coro = luacoro.create(koch(vec))
  let frame = 0

  function update () {
    const v = coro.resume()
    if (v) {
      const ctx = canvas.getContext('2d')
      ctx.beginPath()
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 1
      ctx.moveTo(pos.x, pos.y)
      pos = pos.add(v)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
    }
    info.innerText = `frame: ${frame} / position: (${Math.round(pos.x)}, ${Math.round(pos.y)})`
    frame++
    if (coro.isAlive) {
      requestAnimationFrame(update)
    }
  }

  requestAnimationFrame(update)

}
