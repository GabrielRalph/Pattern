import {parse_expression, solve_expression, solveVector, Vector} from "./vector-expression/str-compiler.js"
import {SvgPlus} from "../SvgPlus/4.js"

class VExp extends SvgPlus {
  constructor(el = "v-exp") {
    super(el);
    this.placeholderEl = this.createChild("div", {class: "placeholder"});
    this.input = this.createChild("input");
    this.literalEl = this.createChild("div", {class: "literal"})
    this.input.addEventListener("focusout", () => {
      this.parseInput();
    })
    this.input.addEventListener("focusin", () => {
      this.clearError();
    })

    this.input.addEventListener("input", () => {
      const event = new Event("input");
      this.dispatchEvent(event);
    })
  }

  get type(){
    return "vexp";
  }

  get value(){
    return this.input.value;
  }

  getVector(data) {
    this.clearError();
    try {
      let vector = solve_expression(this.exp, data);
      this.literal = vector;
      return vector;
    } catch(e) {
      this.error(e);
      return null;
    }
  }

  set placeholder(value){
    this.placeholderEl.innerHTML = value;
  }

  set literal(value){
    this.literalEl.innerHTML = value.toString(1, ', ');
  }

  vectorFunc(input, name) {
    let data = {};
    data[name] = new Vector(input.x, input.y);
    return this.getVector(data)
  }

  parseInput(){
    this.clearError();
    try {
      this.exp = parse_expression(`(${this.input.value})`);
    } catch (e) {
      this.error(e);
    }
  }

  clearError(error) {
    this.toggleAttribute("literal", false);
    this.setAttribute("error", "none");
    this.placeholder = "";
    this.literal = "";
  }

  error(e) {
    this.setAttribute("error", e.type);
    let ph = this.input.value;
    if (e.type === "variable") {
      ph = ph.replace(e.vname, (a) => `<span class = 'highlight'>${a}</span>`)
    } else if (e.type === "operator") {
      ph = ph.replace(e.regexp, (a) => `<span class = 'highlight'>${a}</span>`)
    }
    this.placeholder = ph;
    const event = new Event("error");
    event.error = e;
    this.dispatchEvent(event);
  }
}

export {VExp, solveVector, Vector}
