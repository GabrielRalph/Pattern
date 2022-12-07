import {SvgPlus, SvgPath, Vector} from "./SvgPlus/4.js";

class DotNote extends SvgPlus {
  #line = new Vector;
  #pos = new Vector;
  #offset = new Vector;
  constructor(content, pos = new Vector, offset = new Vector, line = new Vector){
    super("g");
    this.class = "dot-note"
    this.dot = this.createChild(SvgPath);
    this.dot.styles = {"stroke-linecap": "round", "stroke": "black", "stroke-width": 3}
    this.text = this.createChild("text");
    this.tspan = this.text.createChild("tspan");
    this.pos = pos;
    this.offset = offset;
    this.content = content;
  }

  set content(c) {
    this.tspan.innerHTML = c;
  }
  get content(){
    return this.tspan.innerHTML;
  }

  set offset(v){
    if (typeof v === "string") v = new Vector(v.split(","));
    if (v instanceof Vector) {
      this.#offset = v;
      this.update();
    }
  }
  get offset() {
    return this.#offset.clone();
  }

  set pos(v){
    if (typeof v === "string") v = new Vector(v.split(","));
    if (v instanceof Vector) {
      this.#pos = v;
      this.update();
    }
  }
  get pos(){
    return this.#pos.clone();
  }

  set line(v){
    if (typeof v === "string") v = new Vector(v.split(","));
    if (v instanceof Vector) {
      this.#line = v;
      this.update();
    }
  }
  get line(){
    return this.#line.clone();
  }

  update(){
    let pos = this.pos;
    let line = this.line;
    let offset = this.offset;
    let tp = pos.add(line).add(offset);

    let align = "start";
    if (offset.x < 0) align = "end";

    // let h = this.getBBox().height;
    let baseline = "middle"
    if (offset.y > 0 && (offset.y > offset.x || offset.y > -offset.x)) baseline = "hanging";
    if (offset.y < 0 && (offset.y < offset.x || -offset.y > offset.x)) baseline = "";

    this.dot.d.clear();
    this.dot.M(pos).l(line);

    this.text.props = {
      x: tp.x,
      y: tp.y,
      "text-anchor": align,
    }
    this.tspan.props = {
      "alignment-baseline": baseline
    }
  }
}

class Notes extends SvgPlus {
  #dnotes = [];
  constructor() {
    super("g");
    this.class = "notes"
  }

  clear(){
    this.#dnotes = [];
    this.innerHTML = "";
  }

  contains(note, pos) {
    for (let dnote of this.#dnotes) {
      if (dnote.content == note && dnote.pos == pos) {
        return true;
      }
    }
    return false;
  }

  addNote(note = "A", pos = new Vector, offset = 2, line) {
    try{
      let dnote = new DotNote(note, pos, new Vector(offset/Math.sqrt(2)), line);
      this.appendChild(dnote);
      this.#dnotes.push(dnote);
      this.updateNoteOffsets();
    } catch(e) {
      console.log(e);
    }
  }

  updateNoteOffsets(){
    if (this.#dnotes.length < 2) return;
    let dnotes = [];
    for (let dnote of this.#dnotes) {
      dnotes.push(dnote);
    }


    for (let dnote of this.#dnotes) {
      dnotes.sort((a, b) => {
        let da = dnote.pos.dist(a.pos);
        let db = dnote.pos.dist(b.pos);
        return da > db ? 1 : -1;
      })
      let of = null;
      let mf = 1;
      for (let i = 1; i < dnotes.length; i++) {
        let dirv = dnote.pos.sub(dnotes[i].pos).dir().mul(mf);
        if (of == null) of = dirv;
        else of.add(dirv);
        mf *= 0.5;
      }
      if (of.norm() == 0) of = new Vector(1, -1);
      of = new Vector(1, 1);
      dnote.offset = of.dir().mul(dnote.offset.norm());
    }
  }
}

class VTangent extends SvgPlus {
  constructor(cpoint){
    super("g");
    this.cp1 = cpoint;
    this.cp2 = cpoint.next;
    this.path = this.createChild(SvgPath);
    this.circ1 = this.createChild("circle", {r: 0.25});
    this.circ2 = this.createChild("circle", {r: 0.25});
    this.update();
  }

  onmousemove(e){
    console.log("x");
    if (e.buttons == 1) {
      let delta = new Vector(e.deltaX, e.deltaY);
    }
  }

  update(){
    this.path.d.clear();
    let cp1 = this.cp1;
    let cp2 = this.cp2;
    let t1 = cp1.c2;
    let t2 = cp2.c1;
    let p = cp1.p;

    switch(cp2.cmd_type) {
      case "L":
        t2 = p;
        break;
      case "S":
        t2 = t1.sub(p).rotate(Math.PI).add(p);
        break;
    }

    switch (cp1.cmd_type) {
      case "L":
        t1 = p;
        break;
      case "M":
        t1 = p;
        t2 = p;
        break;
    }
    this.draw(t1, p, t2)
  }

  draw(t1, p, t2) {
    this.path.M(t1).L(p).L(t2);
    this.circ1.props = {
      cx: t1.x,
      cy: t1.y,
    };
    this.circ2.props = {
      cx: t2.x,
      cy: t2.y,
    };
  }
}

class SvgDiagram extends SvgPlus {
  #bleed = new Vector(0, 0);
  #paths = [];
  #size = new Vector(84.1, 118.9);

  constructor(el = "div") {
    super(el);
    this.svg = this.createChild("svg");
    this.notes = this.svg.createChild(Notes);
    this.paths = this.svg.createChild("g", {class: "paths"});
    this.hlines = this.svg.createChild("g", {class: "hlines"});
    this.vlines = this.svg.createChild("g", {class: "vlines"});
    this.tangents = this.svg.createChild("g", {class: "tangents"});
  }

  clear() {
    this.notes.clear();
    this.paths.innerHTML = "";
    this.hlines.innerHTML = "";
    this.vlines.innerHTML = "";
    this.tangents.innerHTML = "";
  }

  addTangent(cpoint){
    this.tangents.appendChild(new VTangent(cpoint))
  }

  hLine(name, y){
    let bbox = this.svg.getBBox();
    let xmin = bbox.x;
    let xmax = bbox.x + bbox.width;
    this.hlines.createChild(SvgPath).M(new Vector(xmin, y)).
    L(new Vector(xmax, y));
  }
  vLine(name, x){
    let bbox = this.svg.getBBox();
    let ymin = bbox.y;
    let ymax = bbox.y + bbox.height;
    this.vlines.createChild(SvgPath).M(new Vector(x, ymin)).
    L(new Vector(x, ymax));
  }

  addNote(note, pos, offset, line){
    this.notes.addNote(note, pos, offset, line);
  }

  getPath(){
    return this.paths.createChild(SvgPath);
  }

  crop(){
    let bbox = this.svg.getBBox();
    let size = new Vector(bbox.width, bbox.height);
    let pad = this.size.sub(this.#bleed).sub(size).div(2);
    let ox = bbox.x - pad.x;
    let oy = bbox.y - pad.y;
    let w = bbox.width + 2 * pad.x;
    let h = bbox.height + 2 * pad.y;
    this.svg.props = {
      viewBox: `${ox} ${oy} ${w} ${h}`
    }
  }

  set size(v){
    if (typeof v === "string") v = new Vector(v.split(" "));
    if (v instanceof Vector) {
      this.#size = v;
      this.crop();
    }
  }
  get size(){
    return this.#size.clone();
  }
}

SvgPlus.defineHTMLElement(SvgDiagram);
export {SvgDiagram}
