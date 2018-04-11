///////////////////////////////////////////////////////////////////////////
// Main game system and API implementations

let mode: string

let limitKeys: string[]
let lastKey: string
window.addEventListener('keydown', (e: KeyboardEvent) => {
  if (mode !== 'waitKey') return
  if (limitKeys && limitKeys.indexOf(e.key) < 0) return
  lastKey = e.key
  mode = 'normal'
  limitKeys = null
})

let luminance: number
function updateLuminance () {
  const e = document.getElementById('inn')
  e.style.background = `rgb(${luminance}, ${luminance}, ${luminance})`
}

function message (msg: string) {
  const e = document.createElement('div') as HTMLDivElement
  e.textContent = msg
  document.getElementById('inn').appendChild(e)
}

let waitingFrames: number

let request: number = null

export function start () {
  mode = 'normal'
  limitKeys = null
  lastKey = null
  luminance = 255
  updateLuminance()
  waitingFrames = 0
  document.getElementById('inn').innerHTML = ''

  let iter = inn()
  let frame = 0

  function update () {
    request = null

    let r
    const e = document.getElementById('inn')
    e.classList.remove('showCursor')
    switch (mode) {
      case 'waitKey':
        if (frame % 60 < 30) {
          e.classList.add('showCursor')
        }
        break

      case 'waitFrame':
        waitingFrames--
        if (waitingFrames <= 0) {
          mode = 'normal'
        }
        break

      case 'waitFadeOut':
        luminance -= 5
        if (luminance <= 0) {
          luminance = 0
          mode = 'normal'
        }
        updateLuminance()
        break

      case 'waitFadeIn':
        luminance += 5
        if (255 <= luminance) {
          luminance = 255
          mode = 'normal'
        }
        updateLuminance()
        break

      default:
        r = iter.next()
        if (r.value) mode = r.value
    }
    frame++
    if (!(r && r.done)) {
      request = requestAnimationFrame(update)
    }
  }

  request = requestAnimationFrame(update)
}

export function stop () {
  if (request) cancelAnimationFrame(request)
  request = null
}

///////////////////////////////////////////////////////////////////////////
// Scenario implementations

function* inn () {
  message('Welcome to the traveler\'s Inn.')
  message('Room and board is 6 GOLD per night.')
  message('Dost thou want a room? (Y/N)')
  limitKeys = ['y', 'n']
  yield 'waitKey'

  if (lastKey === 'y') {
    message('Good night.')
    waitingFrames = 30
    yield 'waitFrame'
    yield 'waitFadeOut'
    waitingFrames = 30
    yield 'waitFrame'
    // player.money -= 6
    // player.hp = player.maxHP
    // player.mp = player.maxMP
    yield 'waitFadeIn'
    message('Good morning.')
    message('Thou hast had a good night\'s sleep I hope.')
    yield 'waitKey'
  }

  message('I shall see thee again.')
  yield 'waitKey'
}
