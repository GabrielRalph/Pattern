import {SvgPlus, Vector} from "../SvgPlus/4.js";
import {DotNote} from "./dot-note.js";
import {ViewBox} from "./ViewBox.js"

function dispName(name) {
  if (name[0] == '-' || name[0] == "_") name = "";
  return name;
}
class SvgDiagram extends SvgPlus {
  constructor(el){
    super(el);
  }

  onconnect(){
    this.innerHTML = "";
    let svg = this.createChild("svg", {styles: {width: "100%", height: "100%"}});
    this.ondblclick = () => svg .saveSvg("pattern");
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
    // console.log(value);
    this.render_flag = true;
    this._data = value;
  }
  get data(){
    return this._data;
  }

  start_renderer(){
    let next = () => {
      if (this.render_flag) {
        this.render();
        this.viewBox.updateSize();
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
    for (let name in data) {
      let value = data[name];
      let render_method = "render_" + value.type;
      try {
        this[render_method](value, name);
      } catch(e) {
        // console.log(render_method, e);
        errors.push(value);
      }
    }
  }



  render_point(value, name) {
    let scale = this.viewBox.scale;
    let note = new DotNote({
      dotRadius: scale * 5,
      text: dispName(name),
      position: value.mul(1, -1),
      textSize: 40 * scale,
      autoOffset: true,
    });
    this.svg.appendChild(note);
  }

  render_arc(value, name) {
    let scale = this.viewBox.scale;

    let start = value[0].mul(1, -1);
    let end = value[4].mul(1, -1);

    this.svg.createChild("path", {
      d: `M${start}A${value[1]},${value[2].x},${value[3]},${end}`,
      style: {
        stroke: "var(--c1)",
        fill: "none",
      },
      "stroke-width": scale * 3
    });
  }

  render_line(value, name) {
    let scale = this.viewBox.scale;

    let p1 = value[0].mul(1, -1);
    let p2 = value[1].mul(1, -1);
    let offset = p2.sub(p1);

    this.svg.appendChild(new DotNote({
      position: p1,
      offset: p2.sub(p1),
      strokeWidth: 3 * scale,
    }));
    let text = dispName(name);
    if (text !== "") {
      offset.y *= -1;
      let angle = ((new Vector(1, 0)).angleBetween(offset) * 180 / Math.PI) ;
      console.log(angle);
      // console.log(angle);
      // angle = angle - 90;
      let o1 = (new Vector(15 * scale, 0)).rotate(((angle + 90)) * Math.PI / 180);
      o1 = o1.add(p1.add(p2).div(2));
      this.svg.appendChild(new DotNote({
        text: text,
        textAnchor: "middle",
        textSize: scale * 40,
        rotation: angle,
        position: o1
      }))
    }
  }

  render_cubic(value) {
    let scale = this.viewBox.scale;
    let points = []
    for (let i = 0; i < 4; i++) {
      let v = value[i];
      // console.log(v);
      points.push(v.mul(1, -1));
    }

    this.svg.createChild("path", {
      d: `M${points[0]}C${points[1]},${points[2]},${points[3]}`,
      style: {
        stroke: "var(--c1)",
        fill: "none",
      },
      "stroke-width": scale * 3
    });
  }
}

SvgPlus.defineHTMLElement(SvgDiagram);
export {SvgDiagram}
