import * as inn from './inn'
import * as guide from './guide'
import * as basic from './basic'
import * as concurrent from './concurrent'
import * as coffeebreak from './coffeebreak'
import * as recursion from './recursion'

interface Demo {
  start (): void
  stop (): void
}

const examples: {[name: string]: Demo} = {
  inn,
  guide,
  basic,
  concurrent,
  coffeebreak,
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
  document.getElementById(name).classList.add('visible')
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
onHashChange()
