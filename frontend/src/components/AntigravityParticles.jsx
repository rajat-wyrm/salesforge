import { useEffect, useRef } from "react";
import { useTheme } from "@/context/ThemeContext";

class Particle {
  constructor(canvas, darkMode) {
    this.canvas = canvas;
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 3 + 1;
    this.speedX = (Math.random() - 0.5) * 0.5;
    this.speedY = (Math.random() - 0.5) * 0.5;
    this.opacity = Math.random() * 0.5 + 0.2;
    this.darkMode = darkMode;
    this.pulse = Math.random() * Math.PI * 2;
    this.pulseSpeed = Math.random() * 0.02 + 0.01;
    this.connectionDistance = 120;
    this.gravity = 0.02;
    this.bounce = 0.8;
    this.friction = 0.99;
  }

  update(mouse) {
    this.pulse += this.pulseSpeed;

    this.speedY += this.gravity;
    this.speedX *= this.friction;
    this.speedY *= this.friction;

    if (mouse.x && mouse.y) {
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 200) {
        const force = (200 - dist) / 200;
        this.speedX += (dx / dist) * force * 0.5;
        this.speedY += (dy / dist) * force * 0.5;
      }
    }

    this.x += this.speedX;
    this.y += this.speedY;

    if (this.x < 0 || this.x > this.canvas.width) {
      this.speedX *= -this.bounce;
      this.x = Math.max(0, Math.min(this.canvas.width, this.x));
    }
    if (this.y < 0 || this.y > this.canvas.height) {
      this.speedY *= -this.bounce;
      this.y = Math.max(0, Math.min(this.canvas.height, this.y));
    }
  }

  draw(ctx, particles) {
    const currentOpacity = this.opacity * (0.7 + 0.3 * Math.sin(this.pulse));
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.darkMode
      ? `rgba(139, 92, 246, ${currentOpacity})`
      : `rgba(139, 92, 246, ${currentOpacity * 0.6})`;
    ctx.fill();

    particles.forEach((p) => {
      const dx = this.x - p.x;
      const dy = this.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.connectionDistance) {
        const lineOpacity = (1 - dist / this.connectionDistance) * 0.15;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = this.darkMode
          ? `rgba(139, 92, 246, ${lineOpacity})`
          : `rgba(139, 92, 246, ${lineOpacity * 0.5})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    });
  }
}

export default function AntigravityParticles({ count = 50, className = "" }) {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: null, y: null });
  const { theme } = useTheme();
  const darkMode = theme === "dark";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let particles = [];
    let animId;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      particles = Array.from({ length: count }, () => new Particle(canvas, darkMode));
    };

    const onMouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onMouseLeave = () => {
      mouseRef.current = { x: null, y: null };
    };

    resize();
    window.addEventListener("resize", resize);
    canvas.addEventListener("mousemove", onMouse);
    canvas.addEventListener("mouseleave", onMouseLeave);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.update(mouseRef.current);
        p.draw(ctx, particles);
      });
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMouse);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [count, darkMode]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 ${className}`}
    />
  );
}
