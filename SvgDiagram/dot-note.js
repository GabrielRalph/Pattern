import {SvgPlus, Vector} from "../SvgPlus/4.js"

const DotNoteProps = [
  "text",
  "textSize",
  "position",
  "dotRadius",
  "offset",
  "offsetDotRadius",
  "startOffsetTangent",
  "endOffsetTangent",
  "textAnchor",
  "textLocation",
  "textColor",
  "strokeWidth",
  "color",
  "opacity",
  "rotation",
  "autoOffset",
  // "verticalAlign"
];

const SVG = new SvgPlus("svg");
function svgRect(x, y, width, height, svg = SVG) {
  let rect = svg.createSVGRect();
  rect.x = x;
  rect.y = y;
  rect.width = width;
  rect.height = height;
  return rect;
}

let fs_height = 7.3/7;
let fs_width = (21 / 4) / 7;

function getTextSize(fs, text) {
  return new Vector(fs_width * fs * text.length, fs_height * fs);
}

export class DotNote extends SvgPlus {
  constructor(dotNote){
    super("g");
    this.text = "note";
    this.textSize = 0;
    this.position = 0;
    this.dotRadius = 0;
    this.rotation = 0;
    this.offset = null;
    this.offsetDotRadius = 0;
    this.startOffsetTangent = 0;
    this.textLocation = 0.5;
    this.endOffsetTangent = 0;
    this.textAnchor = "start";
    this.textColor = "var(--c1)";
    this.autoOffset = false;
    this.color = "var(--c1)";
    this.class = "d-note";
    // this.verticalAlign = "middle"

    this.apply(dotNote);
  }

  get textBoxSize(){
    return getTextSize(this.textSize, this.text).rotate(Math.PI * this.rotation / 180)
  }

  apply(dotNote, render = true) {
    for (let key of DotNoteProps) {
      if (key in dotNote) {
        this[key] = dotNote[key];
      }
    }
    if (!this.offset.isNaN && !("textAnchor" in dotNote)) {
      this.textAnchor = this.offset;
    }

    if (render) this.render();
  }

  set text(text) {
    this._text = text + "";
  }
  get text(){
    return this._text;
  }

  set textSize(size) {
    if (typeof size !== "number") size = parseFloat(size);
    if (Number.isNaN(size)) size = 0;
    this._textSize = size;
  }
  get textSize(){return this._textSize;}

  set position(vector) {
    vector = new Vector(vector);
    this._position = vector;
  }
  get position(){return this._position;}

  set dotRadius(vector) {
    vector = new Vector(vector);
    this._dotRadius = vector;
  }
  get dotRadius(){return this._dotRadius;}

  set offset(vector) {
    vector = new Vector(vector);
    this._offset = vector;
  }
  get offset(){return this._offset;}

  set offsetDotRadius(vector) {
    vector = new Vector(vector);
    this._offsetDotRadius = vector;
  }
  get offsetDotRadius(){return this._offsetDotRadius;}

  set startOffsetTangent(vector) {
    vector = new Vector(vector);
    if (vector.isNaN) vector = new Vector(0);
    this._startOffsetTangent = vector;
  }
  get startOffsetTangent(){return this._startOffsetTangent;}

  set endOffsetTangent(vector) {
    vector = new Vector(vector);
    if (vector.isNaN) vector = new Vector(0);
    this._endOffsetTangent = vector;
  }
  get endOffsetTangent(){return this._endOffsetTangent;}

  set textAnchor(value){
    if (value instanceof Vector) {
      let {x, y} = value;
      if (x > 0) {
        value = "start"
      } else {
        value = "end";
      }
      if (y > 0 && Math.abs(x) < 1e-3){
        value = "middle";
      }
    }

    this._textAnchor = value;
  }
  get textAnchor(){return this._textAnchor;}

  set verticalAlign(value){
    if (value instanceof Vector) {
      this._verticalAlign = value;
    }
  }
  get verticalAlign(){return this._verticalAlign;}


  set autoOffset(value){


    this._autoOffset = value;
  }
  get autoOffset(){
    return this._autoOffset;
  }



  get centerTextRatio() {
    return 0.35;
  }

  render(){
    this.innerHTML = "";

    // make start dot is applicable
    let r = this.dotRadius;
    if (!r.isNaN && !r.isZero) {
      this.createChild("ellipse", {
        rx: r.x,
        ry: r.y,
        fill: this.color,
        opacity: this.opacity,
      });
    }

    // make offset line if applicable
    let textPos = new Vector();
    let offset = this.offset;
    if (!offset.isNaN && !offset.isZero) {
      this.createChild("path", {
        d: `M${textPos}c${this.startOffsetTangent},${offset.add(this.endOffsetTangent)},${offset}`,
        "stroke-width": this.strokeWidth,
        style: {
          stroke: this.color,
        },
        opacity: this.opacity
      })


      textPos = textPos.add(offset.mul(this.textLocation));

      // add offset dot if applicable
      let or = this.offsetDotRadius;
      if (!or.isNaN && !or.isZero) {
        this.createChild("ellipse", {
          rx: or.x,
          ry: or.y,
          style: {
            fill: this.color,
          },
          cx: textPos.x,
          cy: textPos.y,
          opacity: this.opacity
        });
        r = or;
      }
    }

    let textSize = this.textSize;
    if (textSize > 0) {
      if (textPos.isNaN || textPos.isZero) textPos = new Vector(0);
      textPos.y += textSize * this.centerTextRatio;

      let anchor = this.textAnchor;
      if (!r.isNaN && !r.isZero) {
        if (anchor == "start") {
          textPos.x += r.x * 2;
        } else if (anchor == "end") {
          textPos.x -= r.x * 2;
        } else {
          textPos.y += r.y * 2;
        }
      }

      let rot = this.rotation;
      let text = this.createChild("text", {
        content: this.text,
        "font-size": textSize,
        "text-anchor": anchor,
        style: {
          "fill": this.textColor,
        },
        transform: `rotate(${rot}) translate(${textPos})`
      });
    }

    let pos = this.position;
    this.props = {
      transform: `translate(${pos})`
    }

    // if (this.autoOffset) {
    //   setTimeout(() => {
    //     this.autoOffsetAdjust();
    //   }, 1000)
    // }
  }

  autoOffsetAdjust() {
    // let size = 3;
    // let recsize = new Vector(this.textSize);
    // let svg = this.ownerSVGElement;
    // for (let i = 0; i < size; i++) {
    //   for (let j = 0; j < size; j++) {
    //     let relp = new Vector((i - size/2), (j - size/2));
    //     let recp = this.position.add(relp.mul(recsize));
    //     let rect = svgRect(recp.x, recp.y, recsize.x, recsize.y, svg);
    //     // console.log(rect);
    //     // console.log(this.ownerSVGElement);
    //     let enclosed = svg.getIntersectionList(rect, svg);
    //     console.log(enclosed);
    //   }
    // }
  }
}
