export default class Vector {
  x: number
  y: number

  constructor (x: number = .0, y: number = .0) {
    this.x = x
    this.y = y
  }

  clone (): Vector {
    return new Vector(this.x, this.y)
  }

  size (): number {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }

  add (v: Vector): Vector {
    return new Vector(this.x + v.x, this.y + v.y)
  }

  sub (v: Vector): Vector {
    return new Vector(this.x - v.x, this.y - v.y)
  }

  mul (r: number): Vector {
    return new Vector(this.x * r, this.y * r)
  }

  div (r: number): Vector {
    return new Vector(this.x / r, this.y / r)
  }

  normalize (): Vector {
    return this.div(this.size())
  }

  rotate (rad: number): Vector {
    const c = Math.cos(rad)
    const s = Math.sin(rad)
    return new Vector(
      this.x * c - this.y * s,
      this.x * s + this.y * c
    )
  }

  lerp (v: Vector, r: number): Vector {
    return new Vector(
      this.x * (1 - r) + v.x * r,
      this.y * (1 - r) + v.y * r
    )
  }
}
