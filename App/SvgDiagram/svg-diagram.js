import {SvgPlus, Vector} from "../SvgPlus/4.js";
import {DotNote} from "./dot-note.js";
import {ViewBox} from "./ViewBox.js"



class SvgDiagram extends SvgPlus {
  constructor(el){
    super(el);
  }

  onconnect(){
    this.innerHTML = "";
    let svg = this.createChild("svg");
    let viewBox = new ViewBox(svg);
    viewBox.displayRealSize();
    viewBox.addPanAndZoomEvents(svg);
    viewBox.update = () => {
      this.render_flag = true;
    }
    this.viewBox = viewBox;
    this.svg = svg;
    this.start_renderer();
  }

  set data(value){
    this.render_flag = true;
    this._data = value;
  }
  get data(){
    let data = this._data;
    if (!Array.isArray(data)) data = [];
    return data;
  }

  start_renderer(){
    let next = () => {
      if (this.render_flag) {
        this.render();
        this.viewBox.updateViewBox();
        this.render_flag = false;
      }
      if (!this.stop_render) {
        window.requestAnimationFrame(next);
      }
    }
    window.requestAnimationFrame(next);
  }

  render() {
    this.svg.innerHTML = "";
    let data = this.data;

    let errors = [];
    for (let value of data) {
      let render_method = "render_" + value.type;
      if (render_method in this && this[render_method] instanceof Function) {
        try {
          this[render_method](value);
        } catch(e) {
          errors.push(value);
        }
      }
    }
  }

  getName(data) {
    let name = data.name;
    if (name[0] == "_") name = "";
    return name;
  }

  render_point(data) {
    this.svg.appendChild(new DotNote({
      dotRadius: 1,
      text: this.getName(data),
      position: data.params.mul(1, -1),
      textSize: 5,
    }))
  }

  render_line(data) {
    let p1 = data.params[0].mul(1, -1);
    let p2 = data.params[1].mul(1, -1);
    let offset = p2.sub(p1);

    this.svg.appendChild(new DotNote({
      position: p1,
      offset: p2.sub(p1),
      strokeWidth: 1,
    }));
    let text = this.getName(data);
    if (text !== "") {
      let angle = ((new Vector(1, 0)).angleBetween(offset) * 180 / Math.PI) % 180;
      console.log(angle);
      let o1 = (new Vector(2, 0)).rotate((angle + 90) * Math.PI / 180).mul(1, -1);
      o1 = o1.add(p1.add(p2).div(2));
      this.svg.appendChild(new DotNote({
        text: text,
        textAnchor: "middle",
        textSize: 5,
        rotation: angle,
        position: o1
      }))
    }
  }

  render_cubic_curve(data) {
    let points = []
    for (let i = 0; i < 4; i++) {
      let v = data.params[i];
      // console.log(v);
      points.push(v.mul(1, -1));
    }

    this.svg.createChild("path", {
      d: `M${points[0]}C${points[1]},${points[2]},${points[3]}`,
      stroke: "black",
      fill: "none",

    });
  }
}

SvgPlus.defineHTMLElement(SvgDiagram);
export {SvgDiagram}
