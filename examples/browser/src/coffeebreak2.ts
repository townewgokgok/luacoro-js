import * as luacoro from 'luacoro'
import './assets'

import sprites_attacker_bot_0 from './assets/sprites-attacker_bot-0.png'
import sprites_attacker_bot_1 from './assets/sprites-attacker_bot-1.png'
import sprites_attacker_bot2_0 from './assets/sprites-attacker_bot2-0.png'
import sprites_attacker_bot2_1 from './assets/sprites-attacker_bot2-1.png'
import sprites_ai_run_0 from './assets/sprites-ai_run-0.png'
import sprites_ai_run_1 from './assets/sprites-ai_run-1.png'
import sprites_boss_0 from './assets/sprites-boss-0.png'
import sprites_boss_1 from './assets/sprites-boss-1.png'
import bonus_takoyaki_0 from './assets/bonus-takoyaki-0.png'
import bonus_takoyaki_1 from './assets/bonus-takoyaki-1.png'
import bg_misc_dot from './assets/bg_misc-dot.png'
import bg_misc_sweat from './assets/bg_misc-sweat.png'

let stage: HTMLDivElement
let bgLayer: HTMLDivElement
let effectLayer: HTMLDivElement

class Sprite {

  el: HTMLImageElement
  private px: number
  private py: number
  private ax: number
  private ay: number
  private sx: number
  private sy: number

  constructor (src: string) {
    this.el = document.createElement('img') as HTMLImageElement
    this.el.src = src
    this.el.style.transformOrigin = `0 0`
    this.px = .0
    this.py = .0
    this.ax = .0
    this.ay = .0
    this.sx = 1.0
    this.sy = 1.0
    this.updateTransform()
  }

  set visible (v: boolean) {
    this.el.style.visibility = v ? 'visible' : 'hidden'
  }

  get x (): number {
    return this.px
  }
  set x (v: number) {
    this.px = v
    this.el.style.left = `${this.px}px`
  }

  get y (): number {
    return this.py
  }
  set y (v: number) {
    this.py = v
    this.el.style.top = `${this.py}px`
  }

  set anchorX (v: number) {
    this.ax = v
    this.updateTransform()
  }
  set anchorY (v: number) {
    this.ay = v
    this.updateTransform()
  }

  set scaleX (v: number) {
    this.sx = v
    this.updateTransform()
  }
  set scaleY (v: number) {
    this.sy = v
    this.updateTransform()
  }

  private updateTransform () {
    this.el.style.transform = `scale(${this.sx}, ${this.sy}) translate(${-this.ax * 100.0}%, ${-this.ay * 100.0}%)`
  }

}

export default function* dotEater (): luacoro.Iterator<{}> {
  const x0 = -16
  const x1 = stage.clientWidth
  const y0 = stage.clientHeight - 32
  const dy = 10
  const ty = 4
  const pitch = 16
  let stop = false
  let turn = false

  function* robo (textures: string[], delay: number = 0): luacoro.Iterator<{}> {
    yield delay
    const enemy = new Sprite(textures[1])
    stage.appendChild(enemy.el)
    enemy.x = x0
    enemy.y = y0
    enemy.anchorX = 1
    enemy.scaleX = -1
    let f = 0
    while (!stop) {
      for (let j = 0; j < 16; j++) {
        enemy.x++
        const g = f % 20 < 10 ? 0 : 1
        enemy.el.src = textures[g]
        yield
        f++
      }
      yield 16
    }
    while (!turn) {
      yield
    }
    enemy.anchorX = 0
    enemy.scaleX = 1
    while (-16 < enemy.x) {
      enemy.x -= 2
      const g = f % 10 < 5 ? 0 : 1
      enemy.el.src = textures[g]
      yield
      f++
    }
  }

  const player = new Sprite('sprites-ai_run-1.png')
  stage.appendChild(player.el)
  player.x = -16
  player.y = y0

  const coro1 = new luacoro.Coroutine(robo([sprites_attacker_bot_0, sprites_attacker_bot_1]))
  const coro2 = new luacoro.Coroutine(robo([sprites_attacker_bot2_0, sprites_attacker_bot2_1], 40))

  let i = 0

  let takoyaki: Sprite
  const dots = []

  player.anchorX = 1
  player.scaleX = -1
  for (let x = x0; x <= x1; x += 2) {
    const f = (x - x0) % 20 < 10 ? 1 : 0
    player.x = x
    player.el.src = f ? sprites_boss_1 : sprites_boss_0
    if (0 <= x && x % pitch === 0) {
      const dot = new Sprite(bg_misc_dot)
      dots.push(dot)
      bgLayer.appendChild(dot.el)
      dot.x = player.x
      dot.y = y0 + dy
      if (x === stage.clientWidth * 3 >> 2) {
        takoyaki = dot
        dot.el.src = bonus_takoyaki_0
        dot.x -= 4
        dot.y = y0 + ty
      }
    }
    if (takoyaki) {
      const g = i % 4 < 2 ? 0 : 1
      takoyaki.el.src = g ? bonus_takoyaki_1 : bonus_takoyaki_0
    }
    yield
    i++
  }

  player.anchorX = 0
  player.scaleX = 1
  for (let x = x0; x <= x1; x += 2) {
    const f = (x - x0) % 20 < 10 ? 1 : 0
    player.x = x
    player.el.src = f ? sprites_ai_run_1 : sprites_ai_run_0
    if ((x + 4) % pitch === 0) {
      const dot = dots.shift()
      bgLayer.removeChild(dot.el)
      if (dot === takoyaki) {
        takoyaki = null
        break
      }
    }
    if (takoyaki) {
      const g = i % 4 < 2 ? 0 : 1
      takoyaki.el.src = g ? bonus_takoyaki_1 : bonus_takoyaki_0
      coro1.resume()
      coro2.resume()
    }
    yield
    i++
  }

  for (let i = 0; i <= 8; i++) {
    coro1.resume()
    coro2.resume()
    yield
  }

  stop = true

  player.anchorX = .5
  player.anchorY = 1
  player.x += 8
  player.y += 24

  for (let i = 0; i <= 24; i++) {
    const s = i % 4 < 1 + (i >> 3) ? 2 : 1
    player.scaleX = s
    player.scaleY = s
    coro1.resume()
    coro2.resume()
    yield
  }

  for (let i = 0; i <= 48; i++) {
    coro1.resume()
    coro2.resume()
    if (i === 24) {
      player.scaleX = -2
    }
    yield
  }

  turn = true

  while (coro1.isAlive || coro2.isAlive) {
    coro1.resume()
    coro2.resume()
    yield
  }

  yield 15

  const sweat = new Sprite(bg_misc_sweat)
  effectLayer.appendChild(sweat.el)
  sweat.x = player.x + 16
  sweat.y = player.y - 50
  sweat.scaleX = -2
  sweat.scaleY = 2

  for (let i = 0; true; i++) {
    sweat.visible = i % 20 < 10
    yield
  }
}

let request: number = null

export function start () {
  stage = document.getElementById('coffeebreak2-content') as HTMLDivElement
  bgLayer = stage
  effectLayer = stage
  const coro = new luacoro.Coroutine(dotEater())
  function update () {
    coro.resume()
    request = requestAnimationFrame(update)
  }
  request = requestAnimationFrame(update)
}

export function stop () {
  if (request) cancelAnimationFrame(request)
  const nodes = stage.childNodes
  for (let i = nodes.length - 1; 0 <= i; i--) nodes[i].remove()
  request = null
}
