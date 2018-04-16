import * as luacoro from 'luacoro'
import Vector from './vector'

const size = 300
const topLeft = new Vector(size * .3, size * .3)
const topRight = new Vector(size * .7, size * .3)
const bottomRight = new Vector(size * .7, size * .7)
const bottomLeft = new Vector(size * .3, size * .7)
const absoluteVelocity = 3

class Sprite {
  style: string
  pos: Vector

  constructor (style: string, pos: Vector) {
    this.style = style
    this.pos = pos.clone()
  }

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

  repaint (ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.style
    ctx.fillRect(this.pos.x - 8, this.pos.y - 8, 16, 16)
  }
}

let request: number = null

export function start () {
  const canvas = document.getElementById('concurrent-canvas') as HTMLCanvasElement
  canvas.width = size
  canvas.height = size

  const redSprite = new Sprite('red', topLeft)
  const blueSprite = new Sprite('blue', topLeft)

  function repaint () {
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#eeeeee'
    ctx.fillRect(0, 0, size, size)
    redSprite.repaint(ctx)
    blueSprite.repaint(ctx)
  }

  const coro = luacoro.concurrent([
    luacoro.forever(redSprite.goRound.bind(redSprite)),
    luacoro.forever(blueSprite.backAndForth.bind(blueSprite))
  ])

  function update () {
    coro.resume()
    repaint()
    request = requestAnimationFrame(update)
  }

  request = requestAnimationFrame(update)
}

export function stop () {
  if (request) cancelAnimationFrame(request)
  request = null
}
