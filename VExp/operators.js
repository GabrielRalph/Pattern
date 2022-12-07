import {Vector} from "../SvgPlus/vector.js"

function sqrt(v){return Math.sqrt(v)}
function cos(x) {return Math.cos(x);}
function sin(x) {return Math.sin(x);}
function pow(x, y) {return Math.pow(x, y);}
function round(n, dp) {return Math.round(n * Math.pow(10, dp))/Math.pow(10, dp)}

function clean(text) {
  text = text.replace(/^(\s*\({0,1})/, "");
  text = text.replace(/(\){0,1}\s*)$/, "");
  return text;
}


class Operator {
  static OPERATORS = {
    // piece wise equations
    "+": "add",
    "-": "subtract",
    "*": "multiply",
    "/": "devide",
    "^": "power",

    // vector math
    "×": "crossproduct",
    "dot": "dot",

    // additional functions
    "left": "left",   // subtract from x axis
    "right": "right", // add to x axis
    "up": "up",       // add to y axis
    "down": "down",   // subtract from y axis

    "horizontal": "horizontal", // set x axis
    "vertical": "vertical",     // set y axis
  }
  static SPEC_CHARS = {
    "*": true,
    "/": true,
    "+": true,
    "|": true,
    "^": true,
  }
  static TEXT_OPERATORS = {
    "dot": true,
    "vertical": true,
    "horizontal": true,
  }
  static MAX_ORDER = 3;
  static ORDERS = {
    // piece wise equations
    "+": 3,
    "-": 3,
    "*": 2,
    "/": 2,
    "^": 1,

    // vector math
    "dot": 2,
    "×": 2,

    // additional functions
    "left": 3,
    "right": 3,
    "up": 3,
    "down": 3,

    "horizontal": 3,
    "vertical": 3,
  };
  static OPERATIONS = {
    "*": (a, b) => new Vector(a.x * b.x, a.y * b.y),
    "+": (a, b) => new Vector(a.x + b.x, a.y + b.y),
    "-": (a, b) => new Vector(a.x - b.x, a.y - b.y),
    "/": (a, b) => new Vector(a.x / b.x, a.y / b.y),
    "^": (a, b) => new Vector(pow(a.x, b.x), pow(a.y, b.y)),

    "dot": (a, b) => {
      let dot = a.x * b.x + a.y * b.y;
      return new Vector(dot, dot);
    },
    "×": (a, b) => {
      console.log(a, b);
      return new Vector(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
    },

    "left": (a, b) => new Vector(a.x - b.x, a.y),
    "right": (a, b) => new Vector(a.x + b.x, a.y),
    "up": (a, b) => new Vector(a.x, a.y + b.y),
    "down": (a, b) => new Vector(a.x, a.y - b.y),

    "horizontal": (a, b) => new Vector(a.x, b.y),
    "vertical": (a, b) => new Vector(b.x, a.y),
  };

  static split(text) {
    let splitt = text.split(Operator.regexp);
    let split = [];
    for (let el of splitt) {
      let cel = clean(el);
      if (cel.length > 0) {
        split.push(cel);
      }
    }
    return split;
  }

  static operate(a, b, name) {
    let res = Operator.OPERATIONS[name](a, b);
    return res;
  }

  static order(text) {
    return Operator.ORDERS[text]
  }

  static getMinOrderIndex(line) {
    let min = null;
    let mini = null;
    let i = 0;
    for (let node of line) {
      if (Operator.is(node)) {
        let order = Operator.order(node);
        if (min == null || order < min) {
          min = order;
          mini = i;
        }
      }
      i++;
    }
    return mini;
  }

  static isNegation(value) {
    return Operator.OPERATORS[value] === "subtract"
  }

  static is(value) {
    return value in Operator.OPERATORS;
  }

  static doubleOpRegExp(op1, op2) {
    let t1 = "";
    if (op1 in Operator.SPEC_CHARS) {
      t1 = "\\" + op1;
    } else {
      t1 = "(?:\\W|^)" + op1;
    }

    let t2 = "";
    if (op2 in Operator.SPEC_CHARS) {
      t2 = "\\" + op2;
    } else {
      t2 = op2 + "(?:\\W|$)";
    }

    return new RegExp(t1 + "\\s*" + t2);
  }

  static get regexp(){
    let op_regex = "";
    for (let op in Operator.OPERATORS) {
      if (op_regex != "") op_regex += "|";
      if (op in Operator.SPEC_CHARS) {
        op_regex += `\\${op}`;
      } else if (op in Operator.TEXT_OPERATORS){
        op_regex += `(?:\\W|^)${op}(?:\\W|$)`
      } else {
        op_regex += op;
      }
    }
    op_regex = `(${op_regex}|~\\w\\d+~)`;
    return new RegExp(op_regex, "g");
  }
}


export {Operator, Vector}
