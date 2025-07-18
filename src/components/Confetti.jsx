import { useEffect, useRef } from 'react';

export default function Confetti({ active }) {
  const ref = useRef();

  useEffect(() => {
    if (!active) return;
    let canvas = ref.current;
    if (!canvas) return;
    let ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    let particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height * 0.3,
      r: Math.random() * 6 + 4,
      d: Math.random() * 100,
      color: `hsl(${Math.random() * 360}, 80%, 60%)`,
      tilt: Math.random() * 10 - 10,
      tiltAngle: 0,
      tiltAngleIncremental: Math.random() * 0.07 + 0.05
    }));
    let angle = 0;
    let animationFrame;
    function draw() {
      ctx.clearRect(0, 0, width, height);
      angle += 0.01;
      for (let i = 0; i < particles.length; i++) {
        let p = particles[i];
        p.y += (Math.cos(angle + p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(angle);
        p.tiltAngle += p.tiltAngleIncremental;
        p.tilt = Math.sin(p.tiltAngle) * 15;
        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 3, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r);
        ctx.stroke();
      }
      animationFrame = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      cancelAnimationFrame(animationFrame);
      ctx.clearRect(0, 0, width, height);
    };
  }, [active]);

  return active ? (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }} aria-hidden="true">
      <canvas ref={ref} style={{ width: '100vw', height: '100vh', display: 'block' }} />
    </div>
  ) : null;
} 