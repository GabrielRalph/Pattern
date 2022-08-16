import {Vector, CPoint, DPath} from "./4.js"

/* cubic equation solver
    credits:
        Shril Kumar [(shril.iitdhn@gmail.com),(github.com/shril)]
        Devojoyti Halder [(devjyoti.itachi@gmail.com),(github.com/devojoyti)]

        https://github.com/shril/CubicEquationSolver/blob/master/CubicEquationSolver.py
        https://www.1728.org/cubic2.htm

    adapted for JS by Gabriel Ralph
*/
function findF(a, b, c) {
  return ((3.0 * c / a) - (Math.pow(b, 2.0) / Math.pow(a, 2.0))) / 3.0;
}

function findG(a, b, c, d){
  return (((2.0 * Math.pow(b, 3.0)) / Math.pow(a, 3.0)) - ((9.0 * b * c) / Math.pow(a, 2.0)) + (27.0 * d / a)) /27.0;
}

function findH(g, f) {
  return (Math.pow(g, 2.0) / 4.0 + Math.pow(f, 3.0) / 27.0)
}

function solveCubic(a, b, c, d){
  // linear
  if (a == 0 && b == 0){
    return [(-d * 1.0) / c]

    //quadratic
  } else if (a == 0) {
    let x1, x2;
    let D = c * c - 4.0 * b * d;
    if (D >= 0) {
      D = Math.sqrt(D);
      x1 = (-c + D) / (2.0 * b);
      x2 = (-c - D) / (2.0 * b);
    } else {
      D = Math.sqrt(-D);
      x1 = (-c + D * 1) / (2.0 * b);
      x2 = (-c - D * 1) / (2.0 * b);
      x1 += "j";
      x2 += "j";
    }

    return [x1, x2];

    // cubic
  } else {
    let f = findF(a, b, c)                          // Helper Temporary Variable
    let g = findG(a, b, c, d)                       // Helper Temporary Variable
    let h = findH(g, f)                             // Helper Temporary Variable

    // All 3 Roots are Real and Equal
    if (f == 0 && g == 0 && h == 0) {
      let x;
      if (d / a >= 0){
        x = Math.pow(d / (1.0 * a), 1 / 3.0) * -1;
      }else{
        x = Math.pow(-d / (1.0 * a), 1 / 3.0) * -1;
      }
      return [x, x, x]

      // All Roots real
    } else if (h <= 0) {
      let i = Math.sqrt((Math.pow(g, 2.0) / 4.0) - h)   // Helper Temporary Variable
      let j = Math.pow(i, 1 / 3.0)                    // Helper Temporary Variable
      let k = Math.acos(-(g / (2 * i)))           // Helper Temporary Variable
      let L = j * -1                              // Helper Temporary Variable
      let M = Math.cos(k / 3.0)                   // Helper Temporary Variable
      let N = Math.sqrt(3) * Math.sin(k / 3.0)    // Helper Temporary Variable
      let P = (b / (3.0 * a)) * -1                // Helper Temporary Variable

      let x1 = 2 * j * Math.cos(k / 3.0) - (b / (3.0 * a))
      let x2 = L * (M + N) + P
      let x3 = L * (M - N) + P

      return [x1, x2, x3]

    }else if (h > 0) {                               // One Real Root and two Complex Roots
      let R = -(g / 2.0) + Math.sqrt(h);           // Helper Temporary Variable
      let S = R >= 0 ? Math.pow(R, 1 / 3.0) : -1 * Math.pow(-R, 1 / 3.0);              // Helper Temporary Variable
      let T = -(g / 2.0) - Math.sqrt(h)
      let U = T >= 0 ? Math.pow(T, 1 / 3.0) : -1 * Math.pow(-T, 1 / 3.0);              // Helper Temporary Variable

      let x1 = (S + U) - (b / (3.0 * a))
      let x2 = -(S + U) / 2 - (b / (3.0 * a)) + (S - U) * Math.sqrt(3) * 0.5;
      x2 += "j"
      let x3 = -(S + U) / 2 - (b / (3.0 * a)) - (S - U) * Math.sqrt(3) * 0.5;
      x3 += "j"

      return [x1, x2, x3]         // Returning One Real Root and two Complex Roots as numpy array.
    }
  }
}

function findTvalue(a, b, c, d) {
  let soln = solveCubic(a,b,c,d);
  let valid = null;
  for (let sol of soln)
    if (typeof sol === "number" && sol >= 0 && sol <= 1)
      valid = sol;

  if (valid == null) {
    throw "No solution"
  }

  return valid;
}

// get cubic coefficients from cubic bezier points
function getCoefs(p0, p1, p2, p3, key) {
  let a = p3[key] - 3 * p2[key] + 3 * p1[key] - p0[key];
  let b = 3 * (p2[key] - 2 * p1[key] + p0[key]);
  let c =  3 * (p1[key] - p0[key]);
  let d = p0[key];
  return [a,b,c,d];
}

function find(value, p0, p1, p2, p3, key) {
  let op_key = key == "x" ? "y" : "x";
  let [a,b,c,d] = getCoefs(p0, p1, p2, p3, key);
  d -= value;
  let t = findTvalue(a,b,c,d);
  [a, b, c, d] = getCoefs(p0,p1,p2,p3, op_key);
  let x = t*t*t*a + t*t*b + t*c + d;
  return x;
}


class Segment {
  constructor(cp1, cp2 = null){
    let p0, p1, p2, p3, mode;
    if (cp2 == null) {
      cp2 = cp1;
      cp1 = cp1.last;
    }
    if (cp1 instanceof Vector && cp2 instanceof Vector) {
      p0 = cp1.clone();
      p1 = cp2.clone();
      mode = "line";
    } else if (cp1 instanceof CPoint && cp2 instanceof CPoint) {
      cp2 = cp2.c;
      p0 = cp1.p;
      p1 = cp2.c1;
      p2 = cp2.c2;
      p3 = cp2.p;
      mode = "segment"
    }
    Object.defineProperty(this, "p0", {get: () => p0.clone()})
    Object.defineProperty(this, "p1", {get: () => p1.clone()})
    Object.defineProperty(this, "p2", {get: () => p2.clone()})
    Object.defineProperty(this, "p3", {get: () => p3.clone()})
    Object.defineProperty(this, "mode", {get: () => mode})
  }

  get lineCoefs(){
    let m = this.p1.sub(this.p0);
    m = m.y / m.x;

    // b = y - mx
    let b = this.p0.y - m * this.p0.x;

    return [m, b]
  }

  x(y) {
    if (this.mode == "line") {
      let [m, b] = this.lineCoefs;
      return (y - b) / m;
    } else {
      return find(y, this.p0, this.p1, this.p2, this.p3, "y");
    }
  }

  y(x) {
    if (this.mode == "line") {
      let [m, b] = this.lineCoefs;
      return m*x + b;
    } else {
      return find(x, this.p0, this.p1, this.p2, this.p3, "x");
    }
  }

  intersection(segment) {
    let int = null
    if (segment.mode == "line" && this.mode == "line") {
      let [m2, b2] = segment.lineCoefs;
      let [m, b] = this.lineCoefs;
      let x = (b2 - b)/(m - m2);
      let y = m * x + b;
      int = new Vector(x, y);
    }

    // intersection of line and segment
    // TODO complex

    // intersection of two segments
    // TODO most complex

    return int;
  }
}

export {solveCubic, Segment}
