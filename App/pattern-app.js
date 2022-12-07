import {SvgPlus, Vector} from "../SvgPlus/4.js"
import {SvgDiagram} from "../SvgDiagram/svg-diagram.js"
import {PatternInput} from "./pattern-input.js"


class PatternApp extends SvgPlus {
  onconnect(){

    let pattern = document.createElement("pattern-input");
    let diagram = document.createElement("svg-diagram");
    this.appendChild(diagram);
    this.createChild("pre", {content: '×\n'})
    this.appendChild(pattern);
    diagram.data = pattern.data;
    pattern.oninput = () => {
      diagram.data = pattern.data;
    }

    this.pattern = pattern;
    this.diagram = diagram;
  }
}

SvgPlus.defineHTMLElement(PatternApp);
