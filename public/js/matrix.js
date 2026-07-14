export function startMatrixRain(canvas) {
  const ctx = canvas.getContext("2d");
  let width, height, columns, drops, fontSize;
  const glyphs = "01ABCDEFHKLMNPRSTUX$#*+-<>[]{}/\\";

  function resize() {
    width = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    height = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    fontSize = 15 * window.devicePixelRatio;
    columns = Math.floor(width / fontSize);
    drops = new Array(columns).fill(0).map(() => Math.random() * -50);
  }
  resize();
  window.addEventListener("resize", resize);

  let frame = 0;
  function draw() {
    frame++;
    if (frame % 2 === 0) {
      ctx.fillStyle = "rgba(4,5,10,0.12)";
      ctx.fillRect(0, 0, width, height);
      ctx.font = fontSize + "px monospace";
      for (let i = 0; i < columns; i++) {
        const text = glyphs[Math.floor(Math.random() * glyphs.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        const gradient = ctx.createLinearGradient(0, y - fontSize, 0, y);
        gradient.addColorStop(0, "rgba(34,211,238,0)");
        gradient.addColorStop(1, "rgba(94,234,212,0.55)");
        ctx.fillStyle = gradient;
        ctx.fillText(text, x, y);
        if (y > height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
}
