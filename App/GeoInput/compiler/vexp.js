import {Operator, Vector} from "./operators.js"
function sqrt(v){return Math.sqrt(v)}
function cos(x) {return Math.cos(x);}
function asin(x) {return Math.asin(x);}
function acos(x) {return Math.acos(x);}
function abs(x) {return Math.abs(x);}
function sin(x) {return Math.sin(x);}
function pow(x, y) {return Math.pow(x, y);}


const BRACKETS = {
  open: {
    "(": true,
    "{": true,
    "[": true,
  },
  close: {
    ")": true,
    "}": true,
    "]": true,
  }
}
const FUNCTIONS = {
  "sin": (a, data) => {
    let v = solveVector(a, data);
    return new Vector(sin(v.x), sin(v.y))
  },
  "asin": (a, data) => {
    let v = solveVector(a, data);
    return new Vector(asin(v.x), asin(v.y))
  },

  "cos": (a, data) => {
    let v = solveVector(a, data);
    return new Vector(cos(v.x), cos(v.y))
  },
  "acos": (a, data) => {
    let v = solveVector(a, data);
    return new Vector(acos(v.x), acos(v.y))
  },

  "abs": (a, data) => {
    let v = solveVector(a, data);
    return new Vector(abs(v.x), abs(v.y))
  },

  "sqrt": (a, data) => {
    let v = solveVector(a, data);
    return new Vector(sqrt(v.x), sqrt(v.y))
  },

  "rotate": (a, data) => {
    let split = parse_expression(a);
    split = split_expressions(split);
    let p1 = solve_expression(split[0], data);
    let p2 = solveVector(split[1], data);
    console.log(p2 + "  " + p2.x);
    let res = p1.rotate(p2.x);
    return res;
  },

  "intersection": (a, data) => {
    let lines = a.split(/\s*,\s*/g);
    let l0 = data[lines[0]];
    let l1 = data[lines[1]];
    let res = null;
    if (l0.type == "line" && l1.type == "line") {
      res = Vector.intersection(l0[0], l0[1], l1[0], l1[1]);
    }
    return res;
  },

  "unit": (a, data) => {
    let v = solveVector(a, data);
    return v.dir();
  },

  "argument": (a, data) => {
    let v = solveVector(a, data);
    let angle = (new Vector(1, 0)).angleBetween(v);
    return new Vector(angle, angle);
  },

  "dist": (a, data) => {
    let split = parse_expression(a);
    split = split_expressions(split);
    let p1 = solve_expression(split[0], data);
    let p2 = solve_expression(split[1], data);
    return new Vector(p1.dist(p2));
  },

  "dir": (a, data) => {
    let v = solveVector(a, data);
    return new Vector(cos(v.x), sin(v.x))
  },

  "x": (a, data) => {
    let v = solveVector(a, data);
    return new Vector(v.x, v.x)
  },

  "y": (a, data) => {
    let v = solveVector(a, data);
    return new Vector(v.y, v.y)
  }
}

let f_regex = "";
// /(sin|cos|abs|sqrt|dir)/g
for (let key in FUNCTIONS) {
  if (f_regex != "") f_regex += "|"
  f_regex += key;
}
f_regex = new RegExp(`(${f_regex})\\s*(~b\\d+~)`, 'g');

const CM = 28.35;
const UNITS = {
  '"': 2.54 * CM,
  "'": 12 * 2.54 * CM,
  "inch": 2.54 * CM,
  "mm": 0.1 * CM,
  "cm": CM,
  "deg": Math.PI/180,
  "rad": 1,
}

class ExpError extends Error {
  constructor(type, message) {
    super(message);
    this.type = type;
  }
}

function get_unit_number(line){
  line = line.replace(/\s/g, "")
  let num = parseFloat(line);
  if (!Number.isNaN(num)) {
    let unit = line.replace(""+num, "");
    if (unit in UNITS) num *= UNITS[unit];
  } else {
    num = null;
  }
  return num;
}

// works similar to replace but using an array of intervals
function replace_intervals(text, intvs, value, soffset = 1, eoffset = 1) {
  let temp = {};

  // invalid check
  if (intvs.length == 0) {
    return text;
  }

  intvs.push(0);
  intvs.push(text.length);
  intvs.sort((a,b) => a > b ? 1 : -1);

  let res = "";
  for (let i = 0, j = 0; i < intvs.length - 1; i+=2, j++) {
    let id = value(j);
    let s = intvs[i];
    let e = intvs[i + 1];
    let be = intvs[i + 2];

    if (be) {
      let tbefore = "";
      if (e > s) tbefore = text.slice(s, e);
      res += tbefore + id;
      temp[id] = text.slice(e + soffset, be - eoffset);
    } else if (e > s) {
      res += text.slice(s, e);
    }
  }

  return [res, temp]
}

// find the idicies of all highest order open and close brackets
//  throws error if bracket mismatch occurs
function find_bracket_intervals(text) {
  let open = 0;
  let intvs = [];
  for (let i = 0; i < text.length; i++) {
    let newOpen = open;
    if (text[i] in BRACKETS.open){
      newOpen += 1;
    }
    if (text[i] in BRACKETS.close) {
      newOpen -= 1;
    }

    // opening
    if (newOpen == 1 && open == 0) {
      intvs.push(i);

    // closing
    } else if (newOpen == 0 && open == 1) {
      intvs.push(i + 1);
    }

    open = newOpen;

  }

  if (open < 0) {
    throw new ExpError("bracket", "bracket missmatch, to many closing brackets");
  }else if (open > 0) {
    throw new ExpError("bracket", "bracket missmatch, to many opening brackets");
  }


  return intvs;
}

// splits a expression by delimeter
function split_expressions(exp, delim = ",") {
  let subExps = [];


  // string case
  if (typeof exp === "string") {
    subExps = exp.split(delim);

  // expression case
  } else {
    let subExpTexts = exp.text.split(delim);

    // for every sub expression text formed from the split
    for (let subExpText of subExpTexts) {
      let subExp = subExpText; // default plain text exp

      // for every tempory value type in the original expression
      for (let tempType in exp) {
        if (tempType != "text") {

          // for every temp value of the original expressions temp type
          // check to see if its id is referenced in the split expression
          // if so store it in temp
          let temp = null;
          for (let id in exp[tempType]) {
            if (subExpText.indexOf(id) != -1) {
              if (temp == null) temp = {};
              temp[id] = exp[tempType][id];
            }
          }

          // if there are temp variables store them in the sub expression
          if (temp != null) {
            if (typeof subExp === "string") {
              subExp = {text: subExpText};
            }
            subExp[tempType] = temp;
          }

        }
      }
      subExps.push(subExp);
    }

  }

  return subExps;
}

// parse expression ------------------------------------------------------------

// finds bracket intervals, if any it constructs an expression reduced by
// brackets
function bracket_insert(text) {
  let exp = text;
  let intervals = find_bracket_intervals(text);

  if (intervals.length > 0) {
    let [ntext, bracketTemps] = replace_intervals(text, intervals, (i) => `~b${i}~`);
    exp = {
      text: ntext,
      brackets: bracketTemps
    }
  }

  return exp;
}

// finds functions and inserts them into an expression
function function_insert(exp) {
  let text = exp.text;
  let brackets = exp.brackets;
  let i = 0;

  let funcs = {};
  text = text.replace(f_regex, (a, fname, id) => {
    let params = brackets[id];
    let fid = `~f${i}~`;
    delete brackets[id];
    funcs[fid] = {name: fname, params: params}
    i++;
    return fid;
  });

  if (i > 0) {
    exp.functions = funcs;
    exp.text = text;
  }
  return exp;
}

// finds vectors and inserts them into an expression
function vector_insert(exp){
  let vectors = {};
  let i = 0;
  for (let id in exp.brackets) {
    let v = split_expressions(exp.brackets[id]);
    if (v.length == 2) {
      let vid = `~v${i}~`
      exp.text = exp.text.replace(id, vid);
      delete exp.brackets[id];
      vectors[vid] = v;
      i++;
    }
  }
  if (i > 0) {
    exp.vectors = vectors;
  }
  return exp;
}

/* parse_expression, given text recursively breaks a string
   into simple algerbraic expressions that reference vectors,
   functions or brackets (i.e. another expression).

   for example given '3 * (2 * 4, 5 ^ 1.5) + sin(35deg) * (point2 / 3)'
   {
      text: "3 * ~v0~ + ~f0~ * ~b2~",
      brackets: {
          "~b2~": "point2 / 3"
      },
      functions: {
          "~f0~": {
              "name": "sin",
              "params": "35deg"
          }
      },
      vectors: {
          "~v0~": [
              "2 * 4",
              " 5 ^ 1.5"
          ]
      }
   }
*/
function parse_expression(text){

  // insert brackets
  let exp = bracket_insert(text);

  // if there are brackets
  if (exp.brackets) {

    // search for functions
    exp = function_insert(exp);

    // recurse on brackets
    for (let id in exp.brackets) {
      exp.brackets[id] = parse_expression(exp.brackets[id])
    }

    exp = vector_insert(exp);
  }

  return exp;
}

// solve expression ------------------------------------------------------------

function solve_function(func, data) {
  return FUNCTIONS[func.name](func.params, data);
}


function log_exp(vExp, t){
  let str = "";
  for (let el of vExp) str += el + " ";
  // console.log(t + str);
}

function parse_vector_expression(vectorExp) {
  log_exp(vectorExp, "before");

  let parsed = [];
  let last = null;

  while(vectorExp.length > 0) {
    let value = vectorExp.shift();

    if (Operator.is(value) && last == null) {
      last = new Vector
      parsed.push(last);
    }

    if ((Operator.is(value) && last instanceof Vector) ||
        (Operator.is(last) && value instanceof Vector) ||
        (last == null && value instanceof Vector)) {
          parsed.push(value);
    } else if (last instanceof Vector && value instanceof Vector) {
      parsed.push("*");
      parsed.push(value);
    } else if (Operator.is(last) && Operator.isNegation(value)) {
      let next = vectorExp.shift();

      if (next instanceof Vector) {
        value = Operator.operate(next, new Vector(-1), "*");
      } else {
        let e = new ExpError("operator", "bad negation");
        e.regexp = Operator.doubleOpRegExp(last, value);
        throw e;
      }
      parsed.push(value);
    } else {
      let e = new ExpError("operator", "double operator");
      e.regexp = Operator.doubleOpRegExp(last, value);
      throw e;
    }

    last = value;
  }

  if (Operator.is(parsed[parsed.length - 1])) {
    parsed.push(new Vector);
  }

  log_exp(parsed, "after")
  return parsed;
}


// inserts data in place of variables
function make_vector_expression(text, tempData, data) {
  let vops = Operator.split(text);

  // replace variables
  let vectorExp = [];
  let stringRep = [];
  for (let vop of vops) {
    let vec = null;
    let strv = "v";
    // replace temp data
    if (tempData[vop] instanceof Vector) {
      vec = tempData[vop];

    // replace data
  } else if (data[vop] instanceof Vector) {
      vec = data[vop];

    // ignore operators
    } else if (Operator.is(vop)) {
      vec = vop;
      strv = Operator.isNegation(vop) ? "n" : "o"

    // finaly check for number otherwise throw error
    } else {
      let num = get_unit_number(vop);
      if (num == null) {
        let e = new ExpError("variable", `'${vop}' not a number, variable or operator`);
        e.vname = vop;
        throw  e;
      } else {
        vec = new Vector(num);
      }
    }
    vectorExp.push(vec);
    stringRep += strv;
  }

  return parse_vector_expression(vectorExp);
}

function solve_vector_expression(vExp) {

  let i = Operator.getMinOrderIndex(vExp);

  // while there are still operators
  while (i != null) {
    let n = vExp.length;
    let op = vExp[i];
    let ip1 = i - 1;
    let ip2 = i + 1;

    let p1 = vExp[ip1];
    let p2 = vExp[ip2];


    let vector = Operator.operate(p1, p2, op);

    // remove operated values, insert solution and repeat
    vExp.splice(ip1, ip2 - ip1 + 1, vector);
    i = Operator.getMinOrderIndex(vExp);
  }

  let result = vExp.pop();

  return result;
}

function solve_expression(exp, data){
  let tempData = {};
  let text = exp;

  // recursively solve all tempory values if expression has any
  if (typeof exp === "object") {
    text = exp.text;
    // console.log(text);

    let solvers = {
      vectors: (tempV) => {
        let a = solve_expression(tempV[0], data);
        let b = solve_expression(tempV[1], data);

        let value = new Vector(a.x, b.y);
        return value;
      },
      brackets: (tempB) => {
        return solve_expression(tempB, data)
      },
      functions: (tempF) => {
        return solve_function(tempF, data)
      }
    }

    for (let tempType in exp) {
      if (tempType != "text") {
        for (let id in exp[tempType]) {
          let value = solvers[tempType]( exp[tempType][id] );
          tempData[id] = value;
        }
      }
    }

    // console.log(tempData);
  }


  let vectorExp = make_vector_expression(text, tempData, data);

  let vector = solve_vector_expression(vectorExp)

  return vector;
}


function solveVector(params, data) {
  let exp = parse_expression(`(${params})`);
  let v = solve_expression(exp, data);
  return v;
}


export {solveVector, parse_expression, solve_expression, Vector, UNITS}
