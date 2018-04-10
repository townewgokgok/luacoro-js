import basic from './basic'
import concurrent from './concurrent'
import recursion from './recursion'

const examples: {[name: string]: () => void} = {
  basic,
  concurrent,
  recursion
}

for (let name in examples) {
  const button = document.createElement('button') as HTMLButtonElement
  button.textContent = name
  document.getElementById('buttons').appendChild(button)
  button.addEventListener('click', function (name: string, fn: Function, e: Event) {
    const divs = document.getElementsByClassName('example')
    for (let i = 0; i < divs.length; i++) {
      (divs[i] as HTMLElement).style.display = 'none'
    }
    document.getElementById(name).style.display = 'block'
    fn()
  }.bind(null, name, examples[name]))
}
