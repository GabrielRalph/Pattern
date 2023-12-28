import {SvgPlus} from "../SvgPlus/4.js"

function size(v){
  let lines = v.split("\n");
  let max = 0;
  for (let l of lines) if (l.length > max) max = l.length;
  return [lines.length, max];
}

function makeStartDelim(syntax) {
  let delim = Object.keys(syntax).filter(key => key !== "regexp")
    .map(key => `${key} = "${syntax[key]}"`).join(" ");
  return `<hl ${delim}>`
}

class CodeEditor extends SvgPlus {
  constructor(el){
    super(el);

    if (!this.syntaxes) this.syntaxes = [];
    this._timeout = null;
    this.i = 0;
  }

  onconnect(){
    this.innerHTML = "";
    let rel1 = this.createChild("div", {class: "rel"})
    let rel2 = rel1.createChild("div", {class: "rel"})
    this.output = rel2.createChild("div", {class: "output"});
    let input = rel2.createChild("textarea", {spellcheck: "false"});
    this.info = rel1.createChild("div", {class: "info"})
    this.input = input;
    this.rows = 20;
    this.cols = 50;

    input.oninput = () => this.inputChange();
  }

  inputChange(timeout = 250){
    this.updateSize();
    this.applySyntax();


    if (this._timeout !== null) {
      clearTimeout(this._timeout);
    }
    this._timeout = setTimeout(() => {
      this._timeout = null;
      this.changeEnd();
    }, timeout)
  }

  showInfo(value){
    this.info.innerHTML = value;
  }

  onmousemove(e){
    let els = document.elementsFromPoint(e.x, e.y);
    for (let el of els) {
      // console.log(el.tagName);
      if (el.tagName == "HL") {
        // console.log(el);
        let value = el.getAttribute("value");
        if (value) {
          this.showInfo(value);
        }
        break;
      }
    }
  }

  updateSize(value = this.input.value){
    [this.rows, this.cols] = size(value);
    if (!this.updatingsize) {
      this.updatingsize = true;
      window.requestAnimationFrame(() => {
        let {clientWidth, clientHeight} = this.input;
        this.output.styles = {
          width: clientWidth + "px",
          height: clientHeight + "px"
        }
        this.updatingsize = false;
      })
    }
  }

  set rows(rows){
    if (rows < 20) rows = 20;
    this.input.props = {rows: rows}
    this._rows = rows;
  }
  get rows(){return this._rows;}
  set cols(cols){
    if (cols < 50) cols = 50;
    this.input.props = {cols: cols}
    this._cols = cols;
  }
  get cols(){return this._cols;}

  applySyntax(text = this.input.value) {
    let intervals = []
    let si = 0;
    for (let syntax of this.syntaxes) {
      switch (typeof syntax.regexp) {
        case "string":
          let matches = text.matchAll(new RegExp(syntax.regexp, "gm"));
          for (let match of matches) {
            console.log(syntax.regexp, match);
            let start = match.index;
            let end = start + match[0].length;
            intervals.push([start, si, 0]);
            intervals.push([end, si, 1]);
          }
          break;
        case "object":
          try{
            let [start, end] = syntax.regexp;
            intervals.push([start, si, 0]);
            intervals.push([end, si, 1]);
          } catch(e){}
        break;
      }
      si++;
    }
    if (intervals.length > 0) {
      intervals.sort((a, b) => a[0] == b[0] ? (a[2] < b[2] ? 1 : -1) : (a[0] > b[0] ? 1 : -1));

      let start = 0;
      let split = [];
      for (let [idx, si] of intervals) {
        let end = text.length;
        let h1 = text.slice(0, idx - start);
        split.push(h1);
        text = text.substring(idx - start, end);
        start = idx;
      }
      split.push(text);

      let newText = split.shift();
      for (let i = 0; i < split.length; i++) {
        let delim = "</hl>";
        if (intervals[i][2] == 0) {
          delim = makeStartDelim(this.syntaxes[intervals[i][1]]);
        }
        newText += delim + split[i]
      }
      text = newText;
    }

    this.output.innerHTML = text;
  }

  changeEnd(){
    if (this.onchangeend instanceof Function) this.onchangeend(this.input.value);
    const event = new Event("changeend");
    this.dispatchEvent(event);
    this.applySyntax();
  }


}

SvgPlus.defineHTMLElement(CodeEditor);
