import * as koch from './koch'

const size = 500

const info = document.createElement('div') as HTMLDivElement
info.style.fontFamily = 'monospace'
document.body.appendChild(info)

const canvas = document.createElement('canvas') as HTMLCanvasElement
canvas.width = size
canvas.height = size
document.body.appendChild(canvas)

const ctx = canvas.getContext('2d')
ctx.fillStyle = '#eeeeee'
ctx.fillRect(0, 0, canvas.width, canvas.height)

koch.start(canvas, info)
