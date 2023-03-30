import {SvgPlus, Vector} from "../SvgPlus/4.js"
import {parseVExp, parse_expression, parseVArgs, solve_expression, UNITS} from "../VExp/vexp.js"

const demo = `// Dimensions that may change with anthro measurements
sl = 102cm   //  side length
cd = 29cm    //  crotch depth
hips = 90cm  //  hip circumference
waist = 65cm //  waist circumference
hd = 15cm  //  hip depth

// Design parameters
wla = 3deg      // wide leg angle
fls = 15cm      // flared leg size
fla = 9deg      // flared leg angle
rd = fls - 2cm  // fillet length
dis = 14cm      // intake start
sf = 87/84      // stretch factor across warp


bh = (hips/2 + 2cm)/2 // back hips
fh = hips/2 - bh      // front hips
bw = waist/(4 * sf)   // back waist
fw = waist/(4 * sf)   // front waist

fcext = fh/4 // front crotch extension
bcext = bh/2  // back crotch extension

// Uncomment for front
//bw = fw
//bh = fh
//bcext = fcext

// calculate dart intake
di = roundcm(2 * (bh - bw) / 2.5) / 2 // dart intake
tint = ((bh - bw) - di) / 2 //           total req. intake
bsa = atan(tint * 2 / cd) //             back to seat angle

// Draft Wide Leg with Flare
point) a = 0
point) b = a down sl
point) c = a down cd right 0.5cm
point) d = a down hd

point) e = a left bh
point) f = e horizontal c
point) g = f left bcext
point) x = (f + e)/2
point) h = f left tan(bsa) * dist(x, f)
point) i = x + unit(x - h) * (dist(x, h))
point) w = i right (di + bw) horizontal a

point) _c = c right 0cm

fll = (sl - cd - fls)
point) j = g + fll * dir(270deg - wla)
point) k = _c + fll * dir(270deg + wla)
point) l = j + fls * dir(270deg - fla)
point) m = k + fls * dir(270deg + fla)



r = dist(l, m) / (2 * sin(fla))



r2 = rd / tan((fla - wla) / 2)

point) _ap11 = j + rd * unit(l - j)
point) _ap12 = j + rd * unit(g - j)
point) _ap21 = k + rd * unit(m - k)
point) _ap22 = k + rd * unit(_c - k)


cubic) _s23 = _c
c + unit(_c - k) * cd*0.7
w
w


point) _w = pointoncurve(_s23, length(_s23) - 1mm)

point) c1 = intercept((-dis, 0), (0, 1cm), w, unit(w - _w))
point) d1 = c1 down dist(c1, w)
point) d2 = d1 left 3 * di / 2


point) c2 = intercept(i, unit(i - x), d2, (0, 1))
point) i2 = c2 + unit(i - c2) * dist(d2, c2)

t1 = 0.2
cubic) _cs2 = x
x * t1 + h *(1-t1)
g * t1 + h * ( 1-t1)
g

arc) _a1 = _ap11
r2
0
0
_ap12
arc) _a2 = _ap22
r2
0
0
_ap21

line) _s11 = l
_ap11
line) _s12 = _ap12
g
line
line) _s21 = m
_ap21
line) _s22 = _ap22
_c

arc) _a4 = i2
dist(d2, c2)
0
0
d2

arc) _a5 = d1
dist(c1, w)
0
0
w


arc) _ah = l // hem
r
0
0,0
m


line) _cs1 = i2
x
line) _pleat = d2
d1
line) _p1 = d2
d2 down 3cm
line) _p2 = d1
d1 down 3cm
line) _p3 = d2 right di/2
d2 right di/2 down 3cm
line) _p4 = d1 left di/2
d1 left di/2 down 3cm

line) __ = (l + m)/2
(l + m)/2 up sl`

const types = {
  variable: {
    params: 1,
    make: () => {

    }
  },
  point: {
    params: 1,
  },
  line: {
    params: 2,
  },
  cubic: {
    params: 4,
  },
  arc: {
    params: 5
  }
}

class PatternInput extends SvgPlus {
  constructor(el){
    super(el)
  }

  onconnect(){
    let rel = this.createChild("div", {class: "rel"});
    this.display = rel.createChild("div", {class: "display"})
    this.textarea = rel.createChild("textarea", {name: "pattern", rows: 80, cols: 50});

    this.textarea.oninput = () => {
      localStorage.setItem("pattern", this.text);
      this.dispatchEvent(new Event("input"));
      if (this.oninput instanceof Function) this.oninput();
    }

    this.textarea.addEventListener("focus", () => {
      console.log("in");
      this.display.styles = {"pointer-events": "none"}//, "z-index": "0"}
      this.textarea.styles = {"pointer-events": "all"}

    });
    this.textarea.addEventListener("focusout", () => {
      this.display.styles = {"pointer-events": "all"}//, "z-index": "1000"}
      this.textarea.styles = {"pointer-events": "none"}
      console.log("out");
    })

    this.text = localStorage.getItem("pattern") || demo;
  }


  parsePatternText2(text) {
    // let exps = text.split(/(?<![({][^})]*)(,|\n)(?![^({})]*[})])/gm);
    // for (let i = 0; i++)
    // console.log(`^${Object.keys(types).join("|")})[)]?\s*(?:[\w)]+(?:\s+\w+)*)`, "g");

    let vexp = parseVExp(text);
    console.log(vexp);
  }
  parsePatternText(text) {
    let lines = text.split("\n");
    let data = {};
    let parami = 0;
    let currentVar = [];
    // console.log(currentVar.type);

    let html = new DocumentFragment();
    for (let line of lines) {
      let el = new SvgPlus("div");
      html.append(el);

      line = line.replace(/(\/\/|~~).*/g, "");

      if (parami == 0) {
        currentVar = [];
        let match = line.match(/^(?:(\w+)\))?\s*([\w\s]+?)\s*=(.*)/);
        if (match) {
          let [m, type, name, exp] = match;
          if (!type) type = "variable";
          currentVar.type = type;
          let params = types[type].params;
          // console.log(type, params);
          try {
            let vexp = parse_expression(exp);
            let value = solve_expression(vexp, data);
            // console.log(exp, value);
            if (params == 1) {
              value.type = type;
              data[name] = value;
              parami = 0;
            } else {
              currentVar.push(value);
              parami = params;
              data[name] = currentVar;
            }

            el.setAttribute("value", Math.round(value.x / UNITS.mm)/10 + "cm");
            // console.log(line);
            el.innerHTML = line;
          } catch (e) {
            el.createChild("error", {content: line})
            el.setAttribute("value", e)
            parami = 0;
          }
        } else {
          el.innerHTML = line;
        }
      } else if (currentVar.type in types){
        // console.log(line);
        try {
          let vexp = parse_expression(line);
          let value = solve_expression(vexp, data);
          currentVar.push(value);
          if (currentVar.length == parami) {
            parami = 0;
          }
          el.innerHTML = line;
        } catch (e) {
          // console.log(e
          parami = 0;
          el.createChild("error", {content: line})
        }
      } else {
        console.log(line);
      }

      if (el.innerHTML == "") {
        el.createChild("br");
      }
    }
    this.display.innerHTML = "";
    this.display.appendChild(html)
    return data
  }

  onclick(){
    this.textarea.focus();
  }


  get data(){
    let text = this.text;
    // let data = this.parsePatternText(text);
    this.display.innerHTML = "";
    let [data, display] = parseVExp(text);
    let i = 0;
    for (let line of text.split('\n')) {
      if (line === "") line = "<br>"
      let disp = display[i];
      let value = ""
      if (disp instanceof Error) {
        value = disp.message
        line = `<error>${line}</error>`
      } else if (disp) {
        value = disp;
      }
      this.display.createChild("div", {
        content: line,
        value: value,
      })
      i++;
    }


    return data;
  }


  get text(){
    return this.textarea.value;
  }

  set text(value) {
    this.textarea.value = value;
  }
}

SvgPlus.defineHTMLElement(PatternInput);

export {PatternInput};
