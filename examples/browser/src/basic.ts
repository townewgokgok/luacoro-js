import * as luacoro from 'luacoro'

export default function start () {
  const textarea = document.getElementById('basic-textarea') as HTMLTextAreaElement
  textarea.textContent = ''

  interface MessageFrame {
    text: string
    wait: number
  }

  const bpm = 160 // tempo
  const n8 = Math.round(60 * 60 / bpm / 2) // frame count of 8th note
  const n4 = n8 * 2
  const n4d = n8 * 3
  const n1 = n8 * 8

  function* maryHadA (): luacoro.Iterator<MessageFrame> {
    yield { text: 'Ma', wait: n4d } // `resume()` returns this value and
                                    // wait `n4d` frames with suspending here
    yield { text: 'ry ', wait: n8 }
    yield { text: 'had ', wait: n4 }
    yield { text: 'a ', wait: n4 }
  }

  function* littleLamb (withoutRest?: boolean): luacoro.Iterator<MessageFrame> {
    yield { text: 'lit', wait: n4 }
    yield { text: 'tle ', wait: n4 }
    yield { text: 'lamb ', wait: n4 }
    if (!withoutRest) {
      yield n4
    }
  }

  function* maryHadALittleLamb (): luacoro.Iterator<MessageFrame> {
    yield maryHadA() // To go to another iterator and come back, just yield it
    yield littleLamb()
    yield littleLamb()
    yield littleLamb()
    yield maryHadA()
    yield littleLamb(true)
    yield { text: 'its ', wait: n4 }
    yield { text: 'fleece ', wait: n4 }
    yield { text: 'was ', wait: n4 }
    yield { text: 'white ', wait: n4 }
    yield { text: 'as ', wait: n4 }
    yield { text: 'snow ', wait: n1 }
  }

  const coro = luacoro.create(maryHadALittleLamb())

  function update () {
    const v = coro.resume()
    if (v && v.text) {
      textarea.textContent += v.text
    }
    if (coro.isAlive) {
      requestAnimationFrame(update)
    }
  }

  requestAnimationFrame(update)
}
