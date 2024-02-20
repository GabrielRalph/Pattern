import { SvgPlus } from "../SvgPlus/4.js"

let svg = new SvgPlus("svg");
document.body.appendChild(svg);
svg.styles = {position: "fixed", "z-index": -10, "opacity": 0}

export function getPath(elem) {

  let path = new SvgPlus('path');
  switch (elem.type) {
    case "line":
      path.props = { d: `M${elem[0]},L${elem[1]}` }
      break;

    case "cubic":
      path.props = { d: `M${elem[0]},C${elem[1]},${elem[2]},${elem[3]}` }
      break;

    case "arc":
      path.props = { d: `M${value[0]}A${value[1]},${value[2].x},${value[3]},${value[4]}` };
      break;

    case "rectangle":
      path = new SvgPlus("rect");
      if (!elem[2]) elem[2] = {x: 0, y: 0}
      path.props = {x: elem[0].x, y: elem[0].y, width: elem[1].x, height: elem[1].y, rx: elem[2].x, ry: elem[2].y}

  }

  return path;
}
export function getLength(elem) {
  let path = getPath(elem)
  svg.appendChild(path);
  window.requestAnimationFrame(() => path.remove())
  return path.getTotalLength();
}
