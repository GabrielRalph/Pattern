import {SvgPlus} from "../SvgPlus/4.js"


export function getPath(){
  let path = new SvgPlus('path');
  if (arguments.length == 4) {
    path.props = {
      d: `M${arguments[0]},C${arguments[1]},${arguments[2]},${arguments[3]}`
    }
  } else {
    path.props = {
      d: `M${arguments[0]},L${arguments[1]}`
    }
  }
  return path;
}
export function getLength() {
  let path = getPath.apply(null, arguments);
  return path.getTotalLength();
}
