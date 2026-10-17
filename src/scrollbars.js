// Keep the scrolling area stable; reveal its themed scrollbar only during use.
const idleTimers = new Map();

document.addEventListener("scroll", event => {
  const scroller = event.target === document ? document.documentElement : event.target;
  if (!(scroller instanceof Element)) return;
  clearTimeout(idleTimers.get(scroller));
  scroller.classList.add("is-scrolling");
  idleTimers.set(scroller, setTimeout(() => {
    scroller.classList.remove("is-scrolling");
    idleTimers.delete(scroller);
  }, 700));
}, { capture: true, passive: true });
