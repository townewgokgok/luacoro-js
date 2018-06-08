import * as inn from './inn'
import * as guide from './guide'
import * as basic from './basic'
import * as concurrent from './concurrent'
import * as coffeebreak1 from './coffeebreak1'
import * as coffeebreak2 from './coffeebreak2'
import * as recursion from './recursion'

import sprites_ai_run_0 from './assets/sprites-ai_run-0.png'
import sprites_ai_run_1 from './assets/sprites-ai_run-1.png'
import sprites_ai_thank_0 from './assets/sprites-ai_thank-0.png'
import sprites_ai_yay_0 from './assets/sprites-ai_yay-0.png'
import sprites_ai_yay_1 from './assets/sprites-ai_yay-1.png'
import sprites_boss_0 from './assets/sprites-boss-0.png'
import sprites_boss_1 from './assets/sprites-boss-1.png'
import sprites_boss_gj_0 from './assets/sprites-boss_gj-0.png'
import sprites_boss_gj_1 from './assets/sprites-boss_gj-1.png'
import sprites_attacker_bot_0 from './assets/sprites-attacker_bot-0.png'
import sprites_attacker_bot_1 from './assets/sprites-attacker_bot-1.png'
import sprites_attacker_bot2_0 from './assets/sprites-attacker_bot2-0.png'
import sprites_attacker_bot2_1 from './assets/sprites-attacker_bot2-1.png'
import bonus_takoyaki_0 from './assets/bonus-takoyaki-0.png'
import bonus_takoyaki_1 from './assets/bonus-takoyaki-1.png'
import bonus_bou_1 from './assets/bonus-bou-1.png'
import bonus_nasu_0 from './assets/bonus-nasu-0.png'
import bg_misc_dot from './assets/bg_misc-dot.png'
import bg_misc_sweat from './assets/bg_misc-sweat.png'

const preloader = document.getElementById('preloader')
for (let src of [
  sprites_ai_run_0,
  sprites_ai_run_1,
  sprites_ai_thank_0,
  sprites_ai_yay_0,
  sprites_ai_yay_1,
  sprites_boss_0,
  sprites_boss_1,
  sprites_boss_gj_0,
  sprites_boss_gj_1,
  sprites_attacker_bot_0,
  sprites_attacker_bot_1,
  sprites_attacker_bot2_0,
  sprites_attacker_bot2_1,
  bonus_takoyaki_0,
  bonus_takoyaki_1,
  bonus_bou_1,
  bonus_nasu_0,
  bg_misc_dot,
  bg_misc_sweat
]) {
  const img = document.createElement('img') as HTMLImageElement
  img.src = src
  preloader.appendChild(img)
}

interface Demo {
  start (): void
  stop (): void
}

const examples: {[name: string]: Demo} = {
  coffeebreak1,
  coffeebreak2,
  inn,
  guide,
  basic,
  concurrent,
  recursion
}

const buttons = document.getElementById('buttons') as HTMLDivElement
buttons.innerHTML = ''
let currentDemo: Demo = null

for (let name in examples) {
  const button = document.createElement('button') as HTMLButtonElement
  button.textContent = name
  buttons.appendChild(button)
  button.addEventListener('click', function (button: HTMLButtonElement, name: string) {
    button.blur()
    startDemo(name)
  }.bind(null, button, name))
}

function startDemo (name: string) {
  if (window.location.hash.length < 2 || window.location.hash.substr(1) !== name) {
    window.location.hash = '#' + name
  }
  const demo = examples[name]
  const divs = document.getElementsByClassName('example')
  for (let i = 0; i < divs.length; i++) {
    divs[i].classList.remove('visible')
  }
  document.getElementById('example-' + name).classList.add('visible')
  if (currentDemo) currentDemo.stop()
  demo.start()
  currentDemo = demo
}

function onHashChange () {
  if (2 <= window.location.hash.length) {
    const name = window.location.hash.substr(1)
    for (let n in examples) {
      if (name === n) {
        startDemo(name)
        break
      }
    }
  }
}
window.addEventListener('hashchange', onHashChange)

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('buttons').style.display = 'block'
  document.getElementById('loading').remove()
  onHashChange()
})
