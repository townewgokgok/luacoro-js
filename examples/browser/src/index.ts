import * as basic from './basic'
import * as concurrent from './concurrent'
import * as recursion from './recursion'
import * as inn from './inn'

interface Demo {
  start (): void
  stop (): void
}

const examples: {[name: string]: Demo} = {
  basic,
  concurrent,
  recursion,
  inn
}

const buttons = document.getElementById('buttons') as HTMLDivElement
buttons.innerHTML = ''

for (let name in examples) {
  const button = document.createElement('button') as HTMLButtonElement
  button.textContent = name
  buttons.appendChild(button)
  let currentDemo: Demo = null
  button.addEventListener('click', function (button: HTMLButtonElement, name: string, demo: Demo, e: Event) {
    button.blur()
    const divs = document.getElementsByClassName('example')
    for (let i = 0; i < divs.length; i++) {
      divs[i].classList.remove('visible')
    }
    document.getElementById(name).classList.add('visible')
    if (currentDemo) currentDemo.stop()
    demo.start()
    currentDemo = demo
  }.bind(null, button, name, examples[name]))
}
