import * as luacoro from 'luacoro'
import Vector from './vector'

const eps = 2.0
const size = 300

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
  return koch(t)                       //     ＿
}

function start () {
  const main = document.getElementById('main') as HTMLMainElement
  main.innerHTML = ''

  const info = document.createElement('div') as HTMLDivElement
  info.style.fontFamily = 'monospace'
  main.appendChild(info)

  const canvas = document.createElement('canvas') as HTMLCanvasElement
  canvas.width = size
  canvas.height = size
  main.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#eeeeee'
  ctx.fillRect(0, 0, size, size)

  let frame = 0
  function drawLine (from: Vector, to: Vector) {
    ctx.beginPath()
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 1
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
    info.textContent = `frame: ${frame} / position: (${Math.round(to.x)}, ${Math.round(to.y)})`
    frame++
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
}

const button = document.createElement('button') as HTMLButtonElement
button.textContent = 'recursion'
document.getElementById('buttons').appendChild(button)
button.addEventListener('click', e => start())
