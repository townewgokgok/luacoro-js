import * as luacoro from 'luacoro'
import './assets'

import sprites_ai_run_0 from './assets/sprites-ai_run-0.png'
import sprites_ai_run_1 from './assets/sprites-ai_run-1.png'
import sprites_ai_thank_0 from './assets/sprites-ai_thank-0.png'
import sprites_ai_yay_0 from './assets/sprites-ai_yay-0.png'
import sprites_ai_yay_1 from './assets/sprites-ai_yay-1.png'
import sprites_boss_0 from './assets/sprites-boss-0.png'
import sprites_boss_1 from './assets/sprites-boss-1.png'
import sprites_boss_gj_0 from './assets/sprites-boss_gj-0.png'
import sprites_boss_gj_1 from './assets/sprites-boss_gj-1.png'
import bonus_bou_1 from './assets/bonus-bou-1.png'
import bonus_nasu_0 from './assets/bonus-nasu-0.png'

let stage: HTMLDivElement

function* awardBonus (): luacoro.Iterator<{}> {
  const cx = (stage.clientWidth >> 1) - 8
  const y0 = stage.clientHeight - 40

  const bonus = document.createElement('img') as HTMLImageElement
  stage.appendChild(bonus)
  bonus.style.visibility = 'hidden'

  const player = document.createElement('img') as HTMLImageElement
  stage.appendChild(player)

  const boss = document.createElement('img') as HTMLImageElement
  stage.appendChild(boss)

  for (let x = cx; 0 <= x; x--) {
    const f = x % 14 < 7 ? 1 : 0
    player.style.left = `${cx - 20 - x}px`
    player.style.top = `${y0}px`
    boss.style.left = `${cx + 20 + x}px`
    boss.style.top = `${y0}px`
    player.src = f ? sprites_ai_run_1 : sprites_ai_run_0
    boss.src = f ? sprites_boss_1 : sprites_boss_0
    yield
  }

  player.src = sprites_ai_thank_0
  boss.src = sprites_boss_gj_0

  yield 15
  for (let tex of [bonus_bou_1, bonus_nasu_0]) {
    bonus.src = tex
    bonus.style.visibility = 'visible'
    bonus.style.top = `${y0 + 4}px`
    for (let x = 16; -16 <= x; x--) {
      bonus.style.left = `${cx + x}px`
      yield 2
    }
    bonus.style.visibility = 'hidden'
    yield 15
  }

  boss.src = sprites_boss_gj_1

  while (true) {
    player.style.top = `${y0}px`
    player.src = sprites_ai_yay_1
    yield 15
    player.src = sprites_ai_yay_0
    for (let y = 1; y < 16; y++) {
      player.style.top = `${y0 - y}px`
      yield
    }
    for (let y = 16; 0 < y; y--) {
      player.style.top = `${y0 - y}px`
      yield
    }
  }
}

let request: number = null

export function start () {
  stage = document.getElementById('coffeebreak1-content') as HTMLDivElement
  const coro = new luacoro.Coroutine(awardBonus())
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
