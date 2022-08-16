

function resizeInput(el){
  let content = el.value;
  let div = document.createElement("span");

  div.innerHTML = content;
  document.body.appendChild(div);
  window.requestAnimationFrame(() => {
    let width = div.getBoundingClientRect();
    width = width.width;
    if (width < 15) width = 15;
    el.setAttribute("style", `--width: ${width}px`)
    div.remove()
  })
}
function addContentResizer(el) {
  el.addEventListener("input", () => {
    resizeInput(el);
  })
}
