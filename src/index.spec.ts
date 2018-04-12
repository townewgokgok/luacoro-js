import * as luacoro from './index'

export interface Test {
  wait?: number
  value: number
}

function* first (): luacoro.Iterator<Test> {
  yield { value: 1, wait: 1 } // wait 1 frame with yielding an object at the first frame
  yield                       // wait 1 frame
  yield undefined             // wait 1 frame
  yield null                  // wait 1 frame
  yield { value: 2, wait: 2 } // wait 2 frames with yielding an object at the first frame
  return second()             // go to another iterator with terminating this iterator
}

function* second (): luacoro.Iterator<Test> {
  yield { value: 3 }
  yield third()      // go to another iterator and come back after it terminates
  yield { value: 6 }
  // returns to caller at the end of function
  // (but in this case, the iterator stops because 'first' is already terminated)
}

function* third (): luacoro.Iterator<Test> {
  const y = yield add(1, 2) // go to 'add' and come back with receiving the returned value
  y.value++
  yield y            // wait 1 frame with yielding an object at the first frame
  yield 2            // wait 2 frames
  yield { value: 5 } // wait 2 frames with yielding an object at the first frame
  // returns to caller at the end of function
}

function* add (a: number, b: number): luacoro.Iterator<Test> {
  return { value: a + b } // return value for 'third' (not for resume())
}

describe('Coroutine', () => {

  it('runs in the expected order', () => {
    const expected = [
      { value: 1, wait: 1 },
      null,
      null,
      null,
      { value: 2, wait: 2 },
      null,
      { value: 3 },
      { value: 4 },
      null,
      null,
      { value: 5 },
      { value: 6 },
      null, // 'second' is terminated
      null  // returns null forever after the coroutine stops
    ]

    const c = luacoro.create(first())
    for (let i = 0; i < expected.length; i++) {
      const msg = `iteration #${i}`
      if (i < expected.length - 1) {
        expect(c.isAlive).toBeTruthy(msg)
      } else {
        expect(c.isAlive).toBeFalsy(msg)
      }
      expect(c.resume()).toEqual(expected[i], msg)
    }
  })

  it('returns null after stopped', () => {
    const c = luacoro.create(first())
    expect(c.isAlive).toBeTruthy()
    expect(c.resume()).toBeTruthy()
    expect(c.isAlive).toBeTruthy()
    c.stop()
    expect(c.isAlive).toBeFalsy()
    expect(c.resume()).toBeNull()
    expect(c.isAlive).toBeFalsy()
    expect(c.resume()).toBeNull()
  })

  it('receives and returns the expected values', () => {
    let actual = ''
    function* g (): luacoro.Iterator<string> {
      actual += (yield '1')
      actual += (yield '2')
      actual += (yield '3')
    }
    const c = luacoro.create(g())
    expect(c.resume()).toEqual('1')
    expect(actual).toEqual('')
    expect(c.resume('a')).toEqual('2')
    expect(actual).toEqual('a')
    expect(c.resume('b')).toEqual('3')
    expect(actual).toEqual('ab')
    expect(c.resume('c')).toBeNull()
    expect(actual).toEqual('abc')
  })

  it('handles error', () => {
    let result = ''

    function* second (): luacoro.Iterator<{}> {
      throw new Error('an error')
    }

    function* first (): luacoro.Iterator<{}> {
      try {
        yield second()
      } catch (e) {
        result += 'caught '
      }
      yield second()
    }

    const c = luacoro.create(first())
    try {
      c.resume()
    } catch (e) {
      result += e.message
    }
    expect(result).toEqual('caught an error')
  })

})

const generators = [
  function* (): Iterator<string> {
    yield 'a'
    return 'b'
  },
  function* (): Iterator<string> {
    yield 'A'
    yield 'B'
    return 'C'
  },
  function* (): Iterator<string> {
    return '1'
  }
]

describe('Coroutine created by "all"', () => {

  it('runs until the all iterators are dead', () => {
    const c = luacoro.all(generators.map(g => luacoro.create(g())))
    const actual = []
    while (c.isAlive) {
      actual.push(c.resume().map(s => s || '-').join(''))
    }
    expect(actual.join(' ')).toEqual('aA1 bB- -C-')
  })

})

describe('Coroutine created by "race"', () => {

  it('runs until one of the iterators is dead', () => {
    const c = luacoro.race(generators.map(g => luacoro.create(g())))
    const actual = []
    while (c.isAlive) {
      actual.push(c.resume().map(s => s || '-').join(''))
    }
    expect(actual.join(' ')).toEqual('aA1')
  })

})

describe('Coroutine created by "forever"', () => {

  it('runs forever', () => {
    const c = luacoro.forever(function* (): Iterator<string> {
      yield '1'
      yield '2'
    })
    const actual = []
    for (let i = 0; i < 10; i++) {
      actual.push(c.resume())
    }
    expect(actual.join('')).toEqual('1212121212')
  })

  it('is prevented from the infinite loop without yielding', () => {
    const c = luacoro.forever(function* (): Iterator<string> {
      return
    })
    expect(c.resume()).toBeNull()
  })

})

describe('Defer', () => {

  function* sub (out: string[]) {
    luacoro.defer(() => out.push('sd'))
    out.push('s')
  }

  function* main (i: number, out: string[]) {
    luacoro.defer(() => out.push('d1'))
    out.push('1')
    if (i === 0) return
    yield sub(out)
    if (i === 1) throw new Error('error')
    luacoro.defer(() => out.push('d2'))
    out.push('2')
  }

  function* test () {
    const result = []
    yield main(0, result)
    yield result.join(' ')
    result.push('|')
    try {
      yield main(1, result)
    } catch (e) {
      yield result.join(' ')
      result.push('|')
    }
    yield main(2, result)
    return result.join(' ')
  }

  it('works', () => {
    const c = luacoro.create(test())
    expect(c.resume()).toEqual('1 d1')
    expect(c.resume()).toEqual('1 d1 | 1 s sd d1')
    expect(c.resume()).toEqual('1 d1 | 1 s sd d1 | 1 s sd 2 d2 d1')
  })

  it('handles error', () => {
    const c = luacoro.create(function* () {
      luacoro.defer(() => {
        throw new Error('error overridden by defer')
      })
      throw new Error('error')
    })
    let result = ''
    try {
      c.resume()
    } catch (e) {
      result = e.message
    }
    expect(result).toEqual('error overridden by defer')
  })

})
