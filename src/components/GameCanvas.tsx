import { useEffect, useRef, useState } from 'react';
import { Balloon, Tower, Projectile, Position } from '@/types/game';

interface GameCanvasProps {
  balloons: Balloon[];
  towers: Tower[];
  projectiles: Projectile[];
  selectedTower: Tower['type'] | null;
  onPlaceTower: (position: Position, type: Tower['type']) => void;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

// Define the path for balloons to follow
const PATH_POINTS: Position[] = [
  { x: -20, y: 100 },
  { x: 150, y: 100 },
  { x: 150, y: 250 },
  { x: 400, y: 250 },
  { x: 400, y: 100 },
  { x: 650, y: 100 },
  { x: 650, y: 400 },
  { x: 350, y: 400 },
  { x: 350, y: 500 },
  { x: CANVAS_WIDTH + 20, y: 500 },
];

export const getPathPosition = (progress: number): Position => {
  const totalSegments = PATH_POINTS.length - 1;
  const segment = Math.floor(progress * totalSegments);
  const segmentProgress = (progress * totalSegments) - segment;
  
  if (segment >= totalSegments) {
    return PATH_POINTS[PATH_POINTS.length - 1];
  }
  
  const start = PATH_POINTS[segment];
  const end = PATH_POINTS[segment + 1];
  
  return {
    x: start.x + (end.x - start.x) * segmentProgress,
    y: start.y + (end.y - start.y) * segmentProgress,
  };
};

const GameCanvas = ({ balloons, towers, projectiles, selectedTower, onPlaceTower }: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverPos, setHoverPos] = useState<Position | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, 'hsl(200, 80%, 85%)');
    gradient.addColorStop(1, 'hsl(210, 100%, 95%)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grass
    ctx.fillStyle = 'hsl(142, 76%, 45%)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw path
    ctx.strokeStyle = 'hsl(45, 30%, 75%)';
    ctx.lineWidth = 60;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    PATH_POINTS.forEach((point, i) => {
      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();

    // Draw towers
    towers.forEach(tower => {
      // Draw range circle when hovering
      if (hoverPos && Math.hypot(tower.position.x - hoverPos.x, tower.position.y - hoverPos.y) < 30) {
        ctx.beginPath();
        ctx.arc(tower.position.x, tower.position.y, tower.range, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw tower
      const colors = {
        dart: 'hsl(210, 100%, 50%)',
        bomb: 'hsl(0, 84%, 60%)',
        ice: 'hsl(180, 100%, 45%)',
      };
      
      ctx.fillStyle = colors[tower.type];
      ctx.beginPath();
      ctx.arc(tower.position.x, tower.position.y, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw tower icon
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const icons = { dart: '→', bomb: '💣', ice: '❄' };
      ctx.fillText(icons[tower.type], tower.position.x, tower.position.y);
    });

    // Draw projectiles
    projectiles.forEach(projectile => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(projectile.position.x, projectile.position.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw balloons
    balloons.forEach(balloon => {
      const colors = {
        red: 'hsl(0, 100%, 50%)',
        blue: 'hsl(210, 100%, 50%)',
        green: 'hsl(142, 76%, 45%)',
        yellow: 'hsl(50, 100%, 50%)',
      };

      // Balloon body
      ctx.fillStyle = colors[balloon.type];
      ctx.beginPath();
      ctx.arc(balloon.position.x, balloon.position.y, 15, 0, Math.PI * 2);
      ctx.fill();
      
      // Balloon highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(balloon.position.x - 5, balloon.position.y - 5, 5, 0, Math.PI * 2);
      ctx.fill();

      // Balloon string
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(balloon.position.x, balloon.position.y + 15);
      ctx.lineTo(balloon.position.x, balloon.position.y + 25);
      ctx.stroke();
    });

    // Draw hover preview
    if (selectedTower && hoverPos) {
      const towerConfigs = {
        dart: { range: 120, color: 'hsl(210, 100%, 50%)' },
        bomb: { range: 100, color: 'hsl(0, 84%, 60%)' },
        ice: { range: 90, color: 'hsl(180, 100%, 45%)' },
      };
      
      const config = towerConfigs[selectedTower];
      
      // Draw range
      ctx.beginPath();
      ctx.arc(hoverPos.x, hoverPos.y, config.range, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw tower preview
      ctx.fillStyle = config.color;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(hoverPos.x, hoverPos.y, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }, [balloons, towers, projectiles, selectedTower, hoverPos]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedTower) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    onPlaceTower({ x, y }, selectedTower);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setHoverPos({ x, y });
  };

  const handleMouseLeave = () => {
    setHoverPos(null);
  };

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="border-4 border-card rounded-lg shadow-2xl cursor-crosshair"
    />
  );
};

export default GameCanvas;
