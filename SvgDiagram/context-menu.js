
import { SvgPlus, Vector } from '../SvgPlus/4.js';
let rootContextMenus = []

window.addEventListener("click", () => {
    rootContextMenus.forEach(menu => menu.close());
    rootContextMenus = [];
});

class ContextMenuItem extends SvgPlus {
    constructor(value, pos, scale, isLeft) {
        super("div");
        this.props = {
            class: "context-menu-item",
            styles: {
                "width": `calc(100%- ${scale}px)`,
                "height": (scale) + "px",
                "cursor": "pointer",
                "padding": (scale / 2) + "px",
                "line-height": (scale) + "px",
                "border-radius": scale/2 + "px",
            },
            events: {
                click: this.onClick.bind(this),
                mouseenter: this.onMouseEnter.bind(this),
                mouseleave: this.onMouseLeave.bind(this)
            }
        };
        this.pos = pos;
        this.scale = scale;
        this.isLeft = isLeft;
        this.textValue = this.createChild("span");
        this.value = value;
    }

    set titleValue(text) {
        this.value.title = text;
        this.textValue.innerHTML = text;
    }

    set value(value) {
        this._value = value;
        this.textValue.innerHTML = value.title;
    }

    get value() {
        return this._value
    }

    onMouseLeave() {
        this.close();
    }

    onMouseEnter() {    
        let item = this.value;
        if (item.submenu) {
            let submenu = new ContextMenu(this.pos, item.submenu, this.scale, false, this.isLeft);
            this.subMenu = submenu;
            this.appendChild(submenu);
        }
    }

    onClick() {
        if (this.value.action) {
            this.value.action(this);
        }
    }

    close() {
        if (this.subMenu) {
            this.subMenu.close();
            this.subMenu = null;
        }
    }
}
export class ContextMenu extends SvgPlus {
    constructor(pos, list, scale, isRoot = true, isLeft) {
        
        let max = new Vector(window.innerWidth, window.innerHeight);
        let min = new Vector(0, 0);

        let maxLen = Math.max(...list.map(item => item.title.length));
        let size = new Vector(maxLen * scale + scale, list.length * scale * 2 + scale);

       
        if (isLeft === undefined) {
             isLeft = false;
            if (pos.x + size.x > max.x) {
                isLeft = true;
                if (pos.x - size.x > min.x) {
                    pos.x -= size.x;
                } else {
                    pos.x = max.x - size.x;
                }
            }
        } else if (isLeft) {
            pos.x -= size.x;
        }

        if (pos.y + size.y > max.y) {
            if (pos.y - size.y > min.y) {
                pos.y -= size.y;
            } else {
                pos.y = max.y - size.y;
            }
        }

        super("context-menu");
        if (isRoot) {
            rootContextMenus.forEach(menu => menu.close());
            rootContextMenus = [this];
        }
        this.isLeft = isLeft;
        this.pos = pos;
        this.size = size;
        this.scale = scale;
        this.styles = {
            "font-family": "Monospace",
            "position": "fixed",
            "left": pos.x + "px",
            "top": pos.y + "px",
            "width": size.x-scale + "px",
            "height": size.y-scale + "px",
            "padding": (scale/2) + "px",
            "background-color": "#eeee",
            "z-index": 1000,
            "display": "flex",
            "border-radius": scale+ "px",
            "flex-direction": "column",
        }

        this.onclick = (e) => {
            e.stopImmediatePropagation();
        }

        this.itemButtons = list.map((item, i) =>  {
            let bpos = this.pos.add(new Vector(this.isLeft ? scale/2 : size.x - scale/2, i * scale * 2));
            return this.createChild(ContextMenuItem, {}, item, bpos, scale, isLeft)
        })
    }

    close() {
        this.itemButtons.forEach(b => b.close());
        this.remove();
    }
}