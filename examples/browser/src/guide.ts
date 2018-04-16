import * as luacoro from 'luacoro'
import Vector from './vector'

let request: number = null
let coro: luacoro.ComposedCoroutine<{}>

export function start () {
  coro = luacoro.concurrent([ guide() ])

  function update () {
    coro.resume()
    request = requestAnimationFrame(update)
  }

  request = requestAnimationFrame(update)
}

export function stop () {
  if (request) cancelAnimationFrame(request)
  request = null
  coro = null
  reset()
}

///////////////////////////////////////////////////////////////////////////
// Event handlers

function updateTitle () {
  const e = document.getElementById('guide-form-title') as HTMLInputElement
  document.getElementById('guide-preview-title').textContent = e.value
}
document.getElementById('guide-form-title').addEventListener('input', updateTitle)

function updateBgColor () {
  const r = parseFloat((document.getElementById('guide-form-color-r') as HTMLInputElement).value)
  const g = parseFloat((document.getElementById('guide-form-color-g') as HTMLInputElement).value)
  const b = parseFloat((document.getElementById('guide-form-color-b') as HTMLInputElement).value)
  document.getElementById('guide-preview').style.backgroundColor = `rgb(${r}, ${g}, ${b})`
}
document.getElementById('guide-form-color-r').addEventListener('input', updateBgColor)
document.getElementById('guide-form-color-g').addEventListener('input', updateBgColor)
document.getElementById('guide-form-color-b').addEventListener('input', updateBgColor)

function showSettingsDialog () {
  document.getElementById('guide-dialog').style.display = 'block'
}
document.getElementById('guide-open').addEventListener('click', showSettingsDialog)

function hideSettingsDialog () {
  document.getElementById('guide-dialog').style.display = 'none'
}
document.getElementById('guide-form-ok').addEventListener('click', hideSettingsDialog)

///////////////////////////////////////////////////////////////////////////
// Helpers

function showCursor () {
  document.getElementById('guide-cursor').style.display = 'block'
}

function reset () {
  document.getElementById('guide-message').style.display = 'none'
  document.getElementById('guide-cursor').style.display = 'none'
  document.getElementById('guide-dialog').style.display = 'none'
}

function updateHover (p: Vector, isFocused: boolean) {
  let e = document.elementFromPoint(p.x, p.y)
  while (e && e.id !== 'guide') {
    if (isFocused) {
      e.classList.add('hover')
    } else {
      e.classList.remove('hover')
    }
    e = e.parentElement
  }
}

function getElementPos (id: string, anchorX?: number, anchorY?: number): Vector {
  const e = document.getElementById(id) as HTMLElement
  if (anchorX == null) anchorX = .5
  if (anchorY == null) anchorY = .5
  const rect = e.getBoundingClientRect()
  return new Vector(
    window.pageXOffset + rect.left + rect.width * anchorX,
    window.pageYOffset + rect.top + rect.height * anchorY
  )
}

const sliderThumbSize = 12

function getSliderPos (id: string, value?: number): Vector {
  const e = document.getElementById(id) as HTMLInputElement
  if (value == null) value = parseFloat(e.value)
  const rect = e.getBoundingClientRect()
  const w = rect.width - sliderThumbSize
  const min = parseFloat(e.min)
  const max = parseFloat(e.max)
  const r = (value - min) / (max - min)
  return new Vector(
    window.pageXOffset + rect.left + sliderThumbSize * .5 + w * r,
    window.pageYOffset + rect.top + rect.height * .5
  )
}

function setSliderPos (id: string, x: number) {
  const e = document.getElementById(id) as HTMLInputElement
  const rect = e.getBoundingClientRect()
  const w = rect.width - sliderThumbSize
  const x0 = window.pageXOffset + rect.left + sliderThumbSize * .5
  const r = Math.max(0, Math.min((x - x0) / w, 1))
  const min = parseFloat(e.min)
  const max = parseFloat(e.max)
  e.value = `${min + (max - min) * r}`
}

let lastCursorPos: Vector = null
function setCursorPos (pos: Vector) {
  const e = document.getElementById('guide-cursor') as HTMLElement
  e.style.left = `${pos.x}px`
  e.style.top = `${pos.y}px`
  if (lastCursorPos) updateHover(lastCursorPos, false)
  updateHover(pos, true)
  lastCursorPos = pos.clone()
}

function message (msg: string) {
  const e = document.getElementById('guide-message') as HTMLDivElement
  e.textContent = msg
  e.style.display = 'block'
}

function easingIn (v: number): number {
  return v * v * v
}

function easingOut (v: number): number {
  return 1 - easingIn(1 - v)
}

function easingInOut (v: number): number {
  if (.5 < v) return 1 - easingInOut(1 - v)
  return easingIn(v * 2) * .5
}

///////////////////////////////////////////////////////////////////////////
// Guide implementations

const waitFrames = 30
const longWaitFrames = 120
const baseMoveFrames = 15
const moveFramesPerDistance = .15
const beforeTypeFrames = 20
const typeFrames = 4
const clickEffectFrames = 30
const exampleTitles = [
  'JavaScript tutorial',
  'My diary'
]
const exampleColors = [
  [ 128, 192, 255 ],
  [ 255, 255, 128 ]
]
let trial = 0

function *moveTo (to: Vector, fn?: (r: number, p: Vector) => void): luacoro.Iterator<{}> {
  const from = lastCursorPos.clone()
  const distance = to.sub(from).size()
  const frames = baseMoveFrames + distance * moveFramesPerDistance
  for (let i = 0; i < frames; i++) {
    const r = easingInOut(i / (frames - 1))
    const p = from.lerp(to, r)
    setCursorPos(p)
    if (fn) fn(r, p)
    yield // wait 1 frame
  }
}

function *moveSlider (id: string, valueTo: number, fn: () => void) {
  yield moveTo(getSliderPos(id))
  yield moveTo(getSliderPos(id, valueTo), (r: number, p: Vector) => {
    setSliderPos(id, p.x)
    if (fn) fn()
  })
}

function *inputText (id: string, text: string, fn?: (e: HTMLInputElement, text: string) => void): luacoro.Iterator<{}> {
  const e = document.getElementById(id) as HTMLInputElement
  e.focus()
  e.setSelectionRange(0, e.value.length)
  yield beforeTypeFrames
  for (let i = 1; i <= text.length; i++) {
    e.value = text.substr(0, i)
    if (fn) fn(e, e.value)
    yield typeFrames
  }
}

function addClickEffect () {
  coro.add(function* (): luacoro.Iterator<{}> {
    const e = document.createElement('div')
    e.classList.add('guide-click-effect')
    document.getElementById('guide').appendChild(e)
    luacoro.defer(() => {
      e.remove()
    })
    e.style.left = `${lastCursorPos.x}px`
    e.style.top = `${lastCursorPos.y}px`

    for (let i = 1; i <= clickEffectFrames; i++) {
      const s = easingOut(i / clickEffectFrames)
      e.style.transform = `translate(-50%, -50%) scale(${s}, ${s})`
      e.style.opacity = `${1 - s}`
      yield
    }
  })
}

function* guide (): luacoro.Iterator<{}> {
  reset()
  setCursorPos(getElementPos('guide'))
  showCursor()
  yield waitFrames

  message('To customize theme, click the gear icon at top-right.')
  yield waitFrames
  yield moveTo(getElementPos('guide-open'))
  yield waitFrames
  addClickEffect()
  showSettingsDialog()
  message('The settings dialog is appeared.')
  yield longWaitFrames

  message('Input your blog title.')
  yield waitFrames
  yield moveTo(getElementPos('guide-form-title', .9))
  yield waitFrames
  const title = exampleTitles[trial % exampleTitles.length]
  addClickEffect()
  yield inputText('guide-form-title', title, () => updateTitle())
  yield waitFrames

  message('Change background color.')
  yield waitFrames
  const color = exampleColors[trial % exampleColors.length]
  yield moveSlider('guide-form-color-r', color[0], () => updateBgColor())
  yield moveSlider('guide-form-color-g', color[1], () => updateBgColor())
  yield moveSlider('guide-form-color-b', color[2], () => updateBgColor())
  trial++
  yield waitFrames

  message('Click "OK" button.')
  yield waitFrames
  yield moveTo(getElementPos('guide-form-ok'))
  yield waitFrames
  addClickEffect()
  hideSettingsDialog()
  yield longWaitFrames

  reset()
}
