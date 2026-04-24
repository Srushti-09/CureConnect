import { useEffect, useRef } from 'react';

export default function ECGLine({ color = '#00d4ff', width = '100%', height = 80, speed = 3 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    canvas.width = canvas.offsetWidth || 600;
    canvas.height = height;

    let offset = 0;
    let animId;

    const ecgPoints = [
      0, 0, 0, 0, 0, 0, 0, 0,
      0.1, 0.2, 0.1, 0,
      0, -0.1, -0.1, 0,
      0, 0, 0,
      0.8, 1.8, -1.5, 0.3, 0,
      0, 0, 0,
      0.2, 0.4, 0.2, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ];

    const drawECG = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Glow effect
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      const midY = canvas.height / 2;
      const amplitude = canvas.height * 0.35;
      const segW = 12;

      for (let x = 0; x < canvas.width + segW; x += segW) {
        const idx = Math.floor((x / segW + offset) % ecgPoints.length);
        const y = midY - ecgPoints[idx] * amplitude;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }

      ctx.stroke();
      ctx.shadowBlur = 0;

      // Fade overlay left/right
      const fadeLeft = ctx.createLinearGradient(0, 0, 80, 0);
      fadeLeft.addColorStop(0, 'rgba(3,7,18,1)');
      fadeLeft.addColorStop(1, 'rgba(3,7,18,0)');
      ctx.fillStyle = fadeLeft;
      ctx.fillRect(0, 0, 80, canvas.height);

      const fadeRight = ctx.createLinearGradient(canvas.width - 80, 0, canvas.width, 0);
      fadeRight.addColorStop(0, 'rgba(3,7,18,0)');
      fadeRight.addColorStop(1, 'rgba(3,7,18,1)');
      ctx.fillStyle = fadeRight;
      ctx.fillRect(canvas.width - 80, 0, 80, canvas.height);

      offset += speed * 0.05;
      animId = requestAnimationFrame(drawECG);
    };

    drawECG();
    return () => cancelAnimationFrame(animId);
  }, [color, height, speed]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, display: 'block' }}
    />
  );
}
