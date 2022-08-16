import {SvgPlus} from "../4.js"

const ICONS = {
	point: '<circle class="icon-point" cx="50" cy="50" r="5.012"/>',
  vline: '<line class="icon-guide" x1="50" y1="0" x2="50" y2="100"/>',
  hline: '<line class="icon-guide" x1="100" y1="50" x2="0" y2="50"/>',
  line: `<line class="icon-line" x1="85.4" y1="14.6" x2="14.6" y2="85.4"/>
         <circle class="icon-point" cx="85.4" cy="14.6" r="5"/>
         <circle class="icon-point" cx="15.9" cy="84.1" r="5"/>`,
  cubic_curve: `<path class="icon-line" d="M14.7,14.7C58,29.4,45,75.4,85.4,85.4"/>
								<line class="icon-tangent" x1="50.1" y1="79" x2="85.4" y2="85.4"/>
								<line class="icon-tangent" x1="14.7" y1="14.7" x2="49.5" y2="19.6"/>
                <circle class="icon-point" cx="85.4" cy="85.4" r="5"/>
                <circle class="icon-point" cx="50.1" cy="79" r="5"/>
                <circle class="icon-point" cx="49.5" cy="19.6" r="5"/>
                <circle class="icon-point" cx="14.6" cy="14.6" r="5"/>`,
  path: `<path class="icon-line" d="M26.8,24.6c-32.9,26.1,35,21.8-3.6,56.6"/>
         <path class="icon-line" d="M77.5,25.7c-32.9,26.1-12.2-35.8-50.8-1"/>
         <circle class="icon-point" cx="26.8" cy="24.6" r="5"/>
         <circle class="icon-point" cx="23.2" cy="81.3" r="5"/>
         <circle class="icon-point" cx="77.5" cy="25.7" r="5"/>`,
  circle: `<circle class="icon-point" cx="50" cy="50" r="5"/>
           <circle class="icon-line" cx="50" cy="50" r="40.4"/>
           <circle class="icon-point" cx="76.6" cy="19.7" r="5"/>`,
  rect: `<rect x="24.1" y="20.4" class="icon-line" width="51.7" height="59.2"/>
         <circle class="icon-point" cx="75.9" cy="79.6" r="5"/>
         <circle class="icon-point" cx="24.1" cy="20.4" r="5"/>`
}

let onchild = (mutation) => {
  for (let el of document.querySelectorAll("svg[icon]")) {
		let name = el.getAttribute("icon");
		console.log(name);
		if (!SvgPlus.is(el, Icon)) {
			new Icon(name, el);
		}
	}
}
let mutationObserver = new MutationObserver(onchild)
mutationObserver.observe(document.body, {childList: true, subtree: true});

class Icon extends SvgPlus{
	constructor(name, el = "svg") {
		super(el);
		this.setAttribute("viewBox", "0 0 100 100");
		this.name = name;
	}
	set name(value) {
		if (value in ICONS) {
			this.innerHTML = ICONS[value];
			this.setAttribute("icon", value)
		}
	}
}

onchild();

export {Icon}
