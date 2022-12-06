import {SvgPlus, Vector} from "./SvgPlus/4.js"
import {SvgDiagram} from "./SvgDiagram/svg-diagram.js"
import {GeoGroupInput} from "./GeoInput/geo-group-input.js"
import {fireUser} from "./FireUser/fire-user.js"


if (fireUser) {
  fireUser.addEventListener("user", () => {
    fireUser.loaded = true;
  });
  fireUser.addEventListener("leave", () => {
    fireUser.loaded = true;
  })
}

class PatternApp extends SvgPlus {
  onconnect() {
    this.build_reset();
    this.add_mouse_handlers();
    this.add_key_handlers();
  }

  get fileRoot(){
    return "patterns";
  }

  animatePatternVariable(name, min, max, unit = "cm", totalFrames = 40) {
    let {geoInput} = this;
    let value = geoInput.value;
    let i = 0;
    let index = null;
    for (let e of value.elements) {
      if (e.name == name) {
        index = i;
        break;
      }
      i++;
    }

    if (index != null) {
      let inc = -1;
      let frames = totalFrames;

      let next = () => {
        let p = frames / totalFrames;
        let x  = min * p + max * (1 - p);
        x = Math.round(x*10)/10;
        value.elements[i][0] = x + unit;
        geoInput.value = value;

        frames += inc;
        if (frames == 0) inc = 1;
        if (frames < totalFrames) window.requestAnimationFrame(next)
      }

      window.requestAnimationFrame(next)
    }


  }
  async openPattern(fileKey) {
    if (fileKey === "local") {
      let value = window.localStorage.getItem("pattern");
      this.geoInput.deserialize(value);
    } else {
      await this.sync_fire_file(fileKey)
    }
    this._fileKey = fileKey;
  }

  updateWorkspace() {
    let solution = this.geoInput.solution;
    if (solution != null) {
      this.svgDiagram.data = solution;
      this.savePattern();
    }
  }
  savePattern(fileKey = this._fileKey) {
    let {geoInput} = this;
    let value = geoInput.serialize();
    this.lastSave = value;

    if (fileKey === "local") {
      window.localStorage.setItem("pattern", value);
    } else if (typeof fileKey === "string" && fileKey !== ""){
      this.save_fire_file(fileKey, value);
    }
  }

  get fileKey(){return this._fileKey;}

  // build functions
  get metaCmds() {
    return {
      "l": () => {
        this.openPattern("local");
      },
      "k": () => {
        // this.clearPattern();
      }
    }
  }
  get shiftCmds() {
    return {
      " ": () => {
        this.animatePatternVariable("AHD", 13, 19)
      },
      ArrowUp: () => {
        this.move_selected_element(false);

      },
      ArrowDown: () => {
        this.move_selected_element(true);
      }
    }
  }
  build_reset(){
    this.innerHTML = "";

    let geoInput = SvgPlus.make("geo-group-input");
    this.geoInput = geoInput;
    geoInput.addEventListener("update", () => {
      this.updateWorkspace();
    })

    let svgDiagram = SvgPlus.make("svg-diagram");
    this.svgDiagram = svgDiagram;

    this.appendChild(svgDiagram);
    this.appendChild(geoInput);
  }
  add_key_handlers() {
    let meta = false;
    let shift = false;
    window.onkeydown = (e) => {
      let key = e.key;
      if (key === "Shift") {
        shift = true;
      }else if (key === "Meta") {
        meta = true;
      } else if (meta) {
        if (key in this.metaCmds) {
          this.metaCmds[key]();
          e.preventDefault();
        }
      } else if (shift) {
        if (key in this.shiftCmds) {
          this.shiftCmds[key]();
          e.preventDefault();
        }
      }
    }

    window.onkeyup = (e) => {
      if (e.key === "Shift") shift = false;
      meta = false;
    }
  }
  add_mouse_handlers() {
    window.onmousemove = (e) => {
      this.mousePosition = new Vector(e);
    }
  }

  move_selected_element(dir) {
    let el = document.querySelector(":focus");
    let input = el;

    while (el != document.body) {
      if (el.classList.contains("geo-element-input")) {
        break;
      }
      el = el.parentNode;
    }

    if (el != document.body) {
      let next = el[dir ? "nextSibling" : "previousSibling"];
      if (next != null) {
        next[dir ? "after" : "before"](el);
        this.updateWorkspace();
        input.focus();
      }
    }
  }

  get_element_at_mouse(svgClass) {
    let v = this.mousePosition;
    if (v instanceof Vector) {
      let el = document.elementFromPoint(v.x, v.y);
      while (el != document.body) {
        if (SvgPlus.is(el, svgClass)) {
          return el;
        }
        el = el.parentNode;
      }
    }
    return null;
  }

  get fireUser(){
    if (fireUser && fireUser.user) {
      return fireUser;
    } else {
      return null;
    }
  }
  get_file_new_key(){
    let {fireUser} = this;
    if (fireUser == null) {
      return null;
    }
    return fireUser.push(this.fileRoot);
  }
  save_fire_file(fileKey, value) {
    let {fireUser} = this;
    if (fireUser != null) {
      fireUser.set(this.fileRoot + "/" + fileKey, value);
    }
  }
  sync_fire_file(fileKey) {
    let {fireUser} = this;
    if (fireUser != null) {
      let path = this.fileRoot + "/" + fileKey;
      if (this.stop_sync instanceof Function) this.stop_sync();

      return new Promise((resolve, reject) => {
        this.stop_sync = fireUser.onValue(path, (e) => {
          let value = e.val();
          if (value != this.lastSave) {
            this.geoInput.deserialize(value);
            this._fileKey = fileKey;
          }
          resolve();
        })
      });
    }
  }
}

SvgPlus.defineHTMLElement(PatternApp);
