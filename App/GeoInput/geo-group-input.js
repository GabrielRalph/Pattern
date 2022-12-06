import {VExp} from "./v-exp.js"
import {SvgPlus} from "../SvgPlus/4.js"
import {Icon} from "./icons.js"

function round(n, dp) {return Math.round(n * Math.pow(10, dp))/Math.pow(10, dp)}
const MIN_SIZE = 1;
function resizeInput(el){
  let num = MIN_SIZE;
  if (el.value && el.value.length > MIN_SIZE) {
    num = el.value.length;
  }
  el.style.setProperty("--size", num);
}
function addContentResizer(el) {
  el.classList.add("resize")
  el.addEventListener("input", () => {
    resizeInput(el);
  })
}
let data = {
    "type": "group",
    "name": "",
    "elements": [
        {
            "0": "0",
            "name": "a",
            "type": "point"
        },
        {
            "0": "65 down A",
            "name": "B",
            "type": "point"
        },
        {
            "0": "a + 35 * (sin(45deg), cos(20deg))",
            "1": "B",
            "name": "cool",
            "type": "line"
        }
    ]
}

class StandardGeoElementInput extends SvgPlus {
  constructor(type) {
    super("div");
    this.type = type;
  }

  // ###### KEY METHOD ################
  solve(data = {}, renderData = []) {
    let error_flag = false;
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

      if (value == null) {
        error_flag = true;
      }
      obj[pname] = value;
      unsolvp[pname] = unsolv;
    }

    // add to data and render data
    let keys = Object.keys(obj);
    let type = this.type;
    if (keys.length > 0) {
      // single param  name: value
      if (keys.length == 1) {
        obj = obj[keys[0]]

        // multiple params name: {type, paramName1, paramName2, ...}
      } else {
        obj.type = type;
      }

      data[name] = obj;
      renderData.push({
        type: type,
        textvalue: unsolvp,
        params: obj,
        name: name,
        styling: this.styling
      });
    }

    return error_flag;
  }


  build_reset(){
    this.innerHTML = "";
    this.params = [];
    let name = this.createChild("input", {class: "resize", name: ""});
    this.resizeName = (text = name.value) => {
      name.value = text;
      resizeInput(name);
    }
    name.addEventListener("input", () => {
      let value = name.value;
      value = value.replace(/\s+$/, "").replace(/^\s+/, "");
      this.name = value;
      this.resizeName();
      this.changeHandler();
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

    param_input.addEventListener("focusout", () => {
      this.changeHandler();
    })
    param_input.classList.add("param");
    addContentResizer(param_input);
    this.appendChild(param_input);
    this.params.push(param_input);
  }

  get value(){
    let value = {
      name: this.name,
      type: this.type,
    }
    for (let i = 0; i < this.params.length; i++) {
      value[i] = this.params[i].value;
    }
    return value;
  }
  set value(data){
    this.type = data.type;
    this.name = data.name;
    this.resizeName(this.name);
    for (let i = 0; i < this.params.length; i++) {
      if (i in data) {
        this.params[i].value = data[i];
        resizeInput(this.params[i]);
      }
    }
    this.changeHandler();
  }


  toString(){
    let str = "";
    for (let param of this.params) {
      let value = param.value;
      if (value === null || value === "") {
        return null;
      }
      if (str !== "") str += ",";
      str += value;
    }
    return this.name + ":" + str;
  }

  changeHandler(){
    let value = this + "";
    if (value != null && this.lastValue != value) {
      const event = new Event("update");
      this.dispatchEvent(event);
    }
    this.lastValue = value;
  }

  set name(value) {
    this.setAttribute("name", value)
  }
  get name(){
    let name = this.getAttribute("name");
    if (name == null) name = "";
    return name;
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
const GeoElements = {
  "point": {
    class: StandardGeoElementInput,
    params: ["vexp"],
  },
  "scaler": {
    class: StandardGeoElementInput,
    params: ["vexp"],
  },
  // "hline": {
  //   class: StandardGeoElementInput,
  //   params: ["vexp"],
  // },
  // "vline": {
  //   class: StandardGeoElementInput,
  //   params: ["vexp"],
  // },
  "line": {
    class: StandardGeoElementInput,
    params: ["vexp", "vexp"]
  },
  // "circle": {
  //   class: StandardGeoElementInput,
  //   params: ["vexp", "vexp"]
  // },
  // "rect": {
  //   class: StandardGeoElementInput,
  //   params: ["vexp", "vexp"]
  // },
  "cubic_curve": {
    class: StandardGeoElementInput,
    params: ["vexp", "vexp", "vexp", "vexp"]
  },
}
function makeGeoElementInput(type) {
  if (type in GeoElements) {
    return new GeoElements[type].class(type);
  } else {
    return null;
  }
}

class GeoGroupInput extends SvgPlus {
  onconnect(){
    this.innerHTML = "";
    this.addIcons = this.createChild("div", {class: "add-icons"});
    this.geoElementInputs = this.createChild("div", {class: "geo-element-inputs"});
    for (let type in GeoElements) {
      let icon = new Icon(type);
      icon.onclick = () => {
        this.addGeoElementInput(type);
      }
      this.addIcons.appendChild(icon);
    }
  }

  update(){
    const event = new Event("update");
    this.dispatchEvent(event);
  }

  clearGeoElementInputs(){
    this.geoElementInputs.innerHTML = "";
  }

  addGeoElementInput(type) {
    let input = null;
    let {geoElementInputs} = this;
    if (type in GeoElements) {
      input = makeGeoElementInput(type);
      geoElementInputs.appendChild(input);
      input.class = "geo-element-input";

      input.addEventListener("update", () => {
        this.update();
      })
    }
    return input;
  }

  solve(data = {}, renderData = []) {
    let name = this.name;
    let error_flag = false;
    for (let child of this.geoElementInputs.children) {
      error_flag |= child.solve(data, renderData);
    }
    return error_flag;
  }

  set name(value) {
    if (value != this.name) {
      this.setAttribute("name", value)

    }
  }
  get name(){
    return this.getAttribute("name")
  }

  get value(){
    let value = {
      type: "group",
      name: name,
      elements: [],
    }
    let elements = [...this.geoElementInputs.children];
    for (let i = 0; i < elements.length; i++) {
      value.elements[i] = elements[i].value;
    }
    return value;
  }
  set value(value){
    this.clearGeoElementInputs();
    if (value !== null) {
      this.name = data.name;
      for (let element of value.elements) {
        let el = this.addGeoElementInput(element.type);
        if (el != null) {
          el.value = element;
        }
      }
    }
  }

  get solution(){
    let data = {};
    let rdata = [];
    if (this.solve(data, rdata)) {
      return null;
    } else {
      return rdata;
    }
  }

  serialize(){
    return JSON.stringify(this.value);
  }
  deserialize(string){
    this.value = JSON.parse(string);
  }
}

SvgPlus.defineHTMLElement(GeoGroupInput);
export {GeoGroupInput}
