import { useRef, useEffect } from 'react';
export default function InteractiveBG({ theme }) {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });
  const orbs = useRef([]);
  const frame = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;

    orbs.current = [
      { x: W * 0.2, y: H * 0.3, vx: 0.15, vy: 0.08, r: 320, color: "80,60,200" },
      { x: W * 0.7, y: H * 0.6, vx: -0.12, vy: 0.1, r: 280, color: "20,180,120" },
      { x: W * 0.5, y: H * 0.8, vx: 0.08, vy: -0.15, r: 260, color: "200,60,120" },
      { x: W * 0.85, y: H * 0.2, vx: -0.1, vy: 0.12, r: 240, color: "40,140,220" },
    ];

    const onResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMove);

    const isLight = theme === "light";
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = isLight ? "#f4f5fa" : "#06060e";
      ctx.fillRect(0, 0, W, H);

      orbs.current.forEach((o, i) => {
        o.x += o.vx + (mouse.current.x - W / 2) * 0.00015 * (i % 2 === 0 ? 1 : -1);
        o.y += o.vy + (mouse.current.y - H / 2) * 0.00015 * (i % 2 === 0 ? -1 : 1);
        if (o.x < -o.r) o.x = W + o.r;
        if (o.x > W + o.r) o.x = -o.r;
        if (o.y < -o.r) o.y = H + o.r;
        if (o.y > H + o.r) o.y = -o.r;
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        g.addColorStop(0, `rgba(${o.color},${isLight ? 0.12 : 0.18})`);
        g.addColorStop(1, `rgba(${o.color},0)`);
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      });

      // grid noise
      ctx.strokeStyle = isLight ? "rgba(11,13,23,0.03)" : "rgba(255,255,255,0.018)";
      ctx.lineWidth = 0.5;
      const gStep = 60;
      for (let x = 0; x < W; x += gStep) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += gStep) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      if (!reduceMotion) frame.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(frame.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
    };
  }, [theme]);

  return (
    <canvas aria-hidden="true" ref={canvasRef} style={{
      position: "fixed", inset: 0, width: "100%", height: "100%",
      zIndex: 0, pointerEvents: "none",
    }} />
  );
}
