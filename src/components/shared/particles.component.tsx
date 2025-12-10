import { useCallback, useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";

type Circle = {
  x: number;
  y: number;
  translateX: number;
  translateY: number;
  size: number;
  alpha: number;
  targetAlpha: number;
  dx: number;
  dy: number;
  magnetism: number;
};

export interface ParticlesProps {
  className?: string;
  quantity?: number;
  staticity?: number;
  ease?: number;
  size?: number;
  refresh?: boolean;
  color?: string;
  vx?: number;
  vy?: number;
}

function hexToRgb(hex: string): number[] {
  const sanitized = hex.replace("#", "");
  const fullHex =
    sanitized.length === 3
      ? sanitized
          .split("")
          .map((c) => c + c)
          .join("")
      : sanitized;
  const int = Number.parseInt(fullHex, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function remapValue(
  value: number,
  start1: number,
  end1: number,
  start2: number,
  end2: number,
): number {
  if (end1 === start1) return start2;
  return Math.max(
    ((value - start1) * (end2 - start2)) / (end1 - start1) + start2,
    0,
  );
}

export const Particles: React.FC<ParticlesProps> = ({
  className = "",
  quantity = 100,
  staticity = 50,
  ease = 50,
  size = 0.4,
  refresh = false,
  color = "#ffffff",
  vx = 0,
  vy = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const circlesRef = useRef<Circle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const canvasSizeRef = useRef({ w: 0, h: 0 });
  const animationIdRef = useRef<number | null>(null);

  const dpr = globalThis.window ? window.devicePixelRatio || 1 : 1;
  const rgb = useMemo(() => hexToRgb(color), [color]);

  // Create a single particle
  const createParticle = useCallback((): Circle => {
    const x = Math.floor(Math.random() * canvasSizeRef.current.w);
    const y = Math.floor(Math.random() * canvasSizeRef.current.h);
    const particleSize = Math.random() * 1.5 + size;
    const alpha = 0;
    const targetAlpha = Number.parseFloat(
      (Math.random() * 0.6 + 0.1).toFixed(2),
    );
    const dx = (Math.random() - 0.5) * 0.2;
    const dy = (Math.random() - 0.5) * 0.2;
    const magnetism = 0.1 + Math.random() * 4;

    return {
      x,
      y,
      translateX: 0,
      translateY: 0,
      size: particleSize,
      alpha,
      targetAlpha,
      dx,
      dy,
      magnetism,
    };
  }, [size]);

  // Clear canvas
  const clear = useCallback(() => {
    if (
      contextRef.current &&
      canvasSizeRef.current.w &&
      canvasSizeRef.current.h
    ) {
      contextRef.current.clearRect(
        0,
        0,
        canvasSizeRef.current.w,
        canvasSizeRef.current.h,
      );
    }
  }, []);

  // Resize canvas to container size with DPR support
  const resizeCanvas = useCallback(() => {
    if (!canvasContainerRef.current || !canvasRef.current) return;

    const { offsetWidth, offsetHeight } = canvasContainerRef.current;
    canvasSizeRef.current.w = offsetWidth;
    canvasSizeRef.current.h = offsetHeight;

    canvasRef.current.width = offsetWidth * dpr;
    canvasRef.current.height = offsetHeight * dpr;
    canvasRef.current.style.width = `${offsetWidth}px`;
    canvasRef.current.style.height = `${offsetHeight}px`;

    if (contextRef.current) {
      contextRef.current.setTransform(1, 0, 0, 1, 0, 0);
      contextRef.current.scale(dpr, dpr);
    }
  }, [dpr]);

  // Draw a single circle
  const drawCircle = useCallback(
    (circle: Circle) => {
      if (!contextRef.current) return;

      const { x, y, translateX, translateY, size, alpha } = circle;
      contextRef.current.save();
      contextRef.current.translate(translateX, translateY);
      contextRef.current.beginPath();
      contextRef.current.arc(x, y, size, 0, Math.PI * 2);
      contextRef.current.fillStyle = `rgba(${rgb.join(", ")}, ${alpha})`;
      contextRef.current.fill();
      contextRef.current.restore();
    },
    [rgb],
  );

  // Initialize particles
  const initParticles = useCallback(() => {
    clear();
    circlesRef.current = [];
    for (let i = 0; i < quantity; i++) {
      circlesRef.current.push(createParticle());
    }
  }, [quantity, createParticle, clear]);

  // Main animation loop
  const animate = useCallback(() => {
    clear();

    for (let i = circlesRef.current.length - 1; i >= 0; i--) {
      const circle = circlesRef.current[i];

      // Distance to nearest edge
      const edges = [
        circle.x + circle.translateX - circle.size,
        canvasSizeRef.current.w - (circle.x + circle.translateX + circle.size),
        circle.y + circle.translateY - circle.size,
        canvasSizeRef.current.h - (circle.y + circle.translateY + circle.size),
      ];
      const closestEdge = Math.min(...edges);
      const remappedEdge = Number.parseFloat(
        remapValue(closestEdge, 0, 20, 0, 1).toFixed(2),
      );

      // Fade in/out near edges
      if (remappedEdge > 1) {
        circle.alpha += 0.02;
        if (circle.alpha > circle.targetAlpha)
          circle.alpha = circle.targetAlpha;
      } else {
        circle.alpha = circle.targetAlpha * remappedEdge;
      }

      // Movement
      circle.x += circle.dx + vx;
      circle.y += circle.dy + vy;

      // Mouse interaction
      circle.translateX +=
        (mouseRef.current.x / (staticity / circle.magnetism) -
          circle.translateX) /
        ease;
      circle.translateY +=
        (mouseRef.current.y / (staticity / circle.magnetism) -
          circle.translateY) /
        ease;

      // Draw
      drawCircle(circle);

      // Remove if out of bounds and replace
      if (
        circle.x < -circle.size ||
        circle.x > canvasSizeRef.current.w + circle.size ||
        circle.y < -circle.size ||
        circle.y > canvasSizeRef.current.h + circle.size
      ) {
        circlesRef.current[i] = createParticle();
      }
    }

    // eslint-disable-next-line react-hooks/immutability
    animationIdRef.current = requestAnimationFrame(animate);
  }, [clear, createParticle, drawCircle, ease, staticity, vx, vy]);

  // Initialize canvas (resize + particles)
  const initCanvas = useCallback(() => {
    resizeCanvas();
    initParticles();
  }, [resizeCanvas, initParticles]);

  // Start animation & handle resize
  useEffect(() => {
    if (!canvasRef.current) return;
    contextRef.current = canvasRef.current.getContext("2d");
    if (!contextRef.current) return;

    initCanvas();
    animationIdRef.current = requestAnimationFrame(animate);

    const handleResize = () => initCanvas();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
    };
  }, [initCanvas, animate]);

  // Re-init particles when refresh prop changes
  useEffect(() => {
    if (refresh) {
      initParticles();
    }
  }, [refresh, initParticles]);

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current || !canvasContainerRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - canvasSizeRef.current.w / 2;
      const y = e.clientY - rect.top - canvasSizeRef.current.h / 2;

      const inside =
        Math.abs(x) < canvasSizeRef.current.w / 2 &&
        Math.abs(y) < canvasSizeRef.current.h / 2;

      if (inside) {
        mouseRef.current.x = x;
        mouseRef.current.y = y;
      }
    };

    globalThis.addEventListener("mousemove", handleMouseMove, {
      passive: true,
    });
    return () => globalThis.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      ref={canvasContainerRef}
      className={cn("pointer-events-none absolute inset-0", className)}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="size-full pointer-events-none" />
    </div>
  );
};

Particles.displayName = "Particles";
