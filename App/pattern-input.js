import {SvgPlus, Vector} from "../SvgPlus/4.js"
import {parse_expression, solve_expression} from "../VExp/vexp.js"

const types = {
  variable: {
    params: 1,
  },
  point: {
    params: 1,
  },
  line: {
    params: 2,
  },
  cubic: {
    params: 4,
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

    this.text = localStorage.getItem("pattern") || "";
  }



  parsePatternText(text) {
    let lines = text.split("\n");
    let data = {};
    let parami = 0;
    let currentVar = [];
    // console.log(currentVar.type);
    let texthtml = "";
    for (let line of lines) {
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
            if (params == 1) {
              value.type = type;
              data[name] = value;
              parami = 0;
            } else {
              currentVar.push(value);
              parami = params;
              data[name] = currentVar;
            }
            texthtml += line;
            if (type == "variable") texthtml += " = " + Math.round(data[name].x*100)/100 ;
            texthtml += "\n"
          } catch (e) {
            texthtml += "<error>"+ line + "</error>\n";
            parami = 0;
          }
        }
      } else if (currentVar.type in types){
        try {
          let vexp = parse_expression(line);
          let value = solve_expression(vexp, data);
          currentVar.push(value);
          if (currentVar.length == parami) {
            parami = 0;
          }
          texthtml += line + "\n";
        } catch (e) {
          parami = 0;
          texthtml += "<error>"+ line + "</error>\n";

        }
      }
    }
    this.display.innerHTML = texthtml;
    return data
  }


  get data(){
    let text = this.text;
    let data = this.parsePatternText(text);
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
