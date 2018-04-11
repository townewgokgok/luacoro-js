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

function* inn () {
  message('ひとばん　6ゴールドですが　おとまりに　なりますか？ (Y/N)')
  limitKeys = ['y', 'n']
  yield 'waitKey'

  if (lastKey === 'y') {
    message('では　おやすみなさいませ')
    waitingFrames = 30
    yield 'waitFrame'
    yield 'waitFadeOut'
    waitingFrames = 30
    yield 'waitFrame'
    // player.money -= 6
    // player.hp = player.maxHP
    // player.mp = player.maxMP
    yield 'waitFadeIn'
    message('おはよう　ございます')
    message('ゆうべは　おたのしみでしたね')
    yield 'waitKey'
  }

  message('では　また　どうぞ')
  yield 'waitKey'
}

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
