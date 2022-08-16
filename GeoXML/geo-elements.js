import {VExp} from "../vexp/v-exp.js"
import {SvgPlus} from "../4.js"
import {Icon} from "./icons.js"

function round(n, dp) {return Math.round(n * Math.pow(10, dp))/Math.pow(10, dp)}

function resizeInput(el){
  let content = el.value.replace(/\s/g, "&nbsp;");
  let div = document.createElement("span");

  div.innerHTML = content;
  document.body.appendChild(div);
  window.requestAnimationFrame(() => {
    let width = div.getBoundingClientRect();
    width = width.width;
    if (width < 15) width = 15;
    console.log(width);
    el.setAttribute("style", `--width: ${round(width, 2)}px`)
    div.remove()
  })
}

function addContentResizer(el) {
  el.classList.add("resize")
  el.addEventListener("input", () => {
    resizeInput(el);
  })
}

const VECTOR_PARAMS = ["name", "vexp"];
const VECTOR_PARAM_SOLVE = (data, geoEl) => {
  let [name, vexp] = point.params;
  data[name] = vexp.getVector(data);
}

const GeoElements = {
  "point": {
    params: ["vexp"],
  },
  "hline": {
    params: ["vexp"],
  },
  "vline": {
    params: ["vexp"],
  },
  "line": {
    params: ["vexp", "vexp"]
  },
  "circle": {
    params: ["vexp", "vexp"]
  },
  "rect": {
    params: ["vexp", "vexp"]
  },
  "cubic_curve": {
    params: ["vexp", "vexp", "vexp", "vexp"]
  },
}


class GeoElement extends SvgPlus {
  solve(data = {}, renderData = []) {
    let name = this.name

    // solve all parameters
    let obj = {}
    let index = 0;
    let unsolvp = {};
    for (let param of this.params) {
      let value = param.value;
      let unsolv = value;

      if (param.type == "vexp") {
        value = param.getVector(data);
        unsolv = param.value;
      } else if (value in data){
        value = data[value];
      }

      let pname = param.name;
      if (pname == null || pname.length <= 0) {
        pname =  index;
        index++;
      }
      obj[pname] = value;
      unsolvp[pname] = unsolv;
    }

    // add to data and render data
    let keys = Object.keys(obj);
    if (keys.length > 0) {
      // single param  name: value
      if (keys.length == 1) {
        obj = obj[keys[0]]

      // multiple params name: {type, paramName1, paramName2, ...}
      } else {
        obj.type = rdata.type;
      }
      data[name] = obj;
      renderData.push({
        type: this.type,
        textvalue: unsolvp,
        params: obj,
        name: name,
        styling: element.styling
      });
    }

    return renderData;
  }

  build_reset(){
    this.innerHTML = "";
    this.params = [];
    let name = this.createChild("input", {class: "resize", name: ""});
    name.addEventListener("input", () => {
      let value = name.value;
      value = value.replace(/\s+$/, "");
      name.value = value;
      this.name = value;
    });

    this.createChild("span", {class: "color-orange",content: ":"});
  }

  build_params(type){
    this.build_reset();
    this.prepend(new Icon(type));

    let geo = GeoElements[type];

    for (let param of geo.params) {
      if (param === "vexp") {
        this.make_vexp_param();

        // selection of options
      } else if (Array.isArray(param)) {
        this.make_selection_param(param);

        // string input
      } else if (typeof param === "string"){
        this.make_string_input();
      }
    }
  }

  make_string_input(){
    input = new SvgPlus("input");
    input.type = "string";
    this.add_param_input(input);
  }

  make_selection_param(selection) {
    input = new SvgPlus("select");
    input.type = "selection";
    for (let option of selection) {
      input.createChild("option", {value: option, content: option})
    }
    this.add_param_input(input);
  }

  make_vexp_param(){
    this.add_param_input(new VExp);
  }

  add_param_input(param_input) {
    let n = this.params.length;

    // add comma if there is already another paramater
    if (n > 0) {
      this.createChild("span", {class: "color-orange",content: ","});
    }

    param_input.index = n;
    this.appendChild(param_input);
    this.params.push(param_input)
  }


  set name(value) {
    this.setAttribute("name", value)
  }
  get name(){
    return this.getAttribute("name")
  }

  set type(type) {
    if (this.type != type) {
      this.setAttribute("type", type);
      this.build_params(type);
    }
  }
  get type(){
    return this.getAttribute("type");
  }
}

class GeoGroup extends SvgPlus {

  solve(data = {}, renderData = []) {
    let rdata = [];
    let name = this.name
    for (let child of group.children) {
      child.solve(data, rdata);
    }

    if (rdata.length > 0) {
      if (rdata.length == 1) {
        rdata = rdata[0]
      }
      renderData.push(rdata);
    }

    return renderData;
  }

  set name(value) {
    if (value != this.name) {
      this.setAttribute("name", value)

    }
  }
  get name(){
    return this.getAttribute("name")
  }

  get solution(){
    let data = {};
    let rdata = [];
    this.solve(data, rdata)
    return rdata
  }

}

SvgPlus.defineHTMLElement(GeoElement)
SvgPlus.defineHTMLElement(GeoGroup)
