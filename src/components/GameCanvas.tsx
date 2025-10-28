import { useEffect, useRef, useState } from 'react';
import { Balloon, Tower, Projectile, Position, Explosion } from '@/types/game';

interface GameCanvasProps {
  balloons: Balloon[];
  towers: Tower[];
  projectiles: Projectile[];
  explosions: Explosion[];
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

const GameCanvas = ({ balloons, towers, projectiles, explosions, selectedTower, onPlaceTower }: GameCanvasProps) => {
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

    // Draw beach (bottom and right edges)
    ctx.fillStyle = 'hsl(45, 60%, 80%)';
    ctx.fillRect(0, CANVAS_HEIGHT - 80, CANVAS_WIDTH, 80);
    ctx.fillRect(CANVAS_WIDTH - 60, 0, 60, CANVAS_HEIGHT);

    // Draw water at edges
    ctx.fillStyle = 'hsl(200, 80%, 60%)';
    ctx.fillRect(0, CANVAS_HEIGHT - 20, CANVAS_WIDTH, 20);
    ctx.fillRect(CANVAS_WIDTH - 20, 0, 20, CANVAS_HEIGHT);

    // Draw decorative trees
    const trees = [
      { x: 50, y: 50 }, { x: 120, y: 30 }, { x: 700, y: 50 },
      { x: 730, y: 150 }, { x: 50, y: 350 }, { x: 100, y: 450 },
      { x: 550, y: 30 }, { x: 680, y: 250 }
    ];
    
    trees.forEach(tree => {
      // Tree trunk
      ctx.fillStyle = 'hsl(30, 40%, 30%)';
      ctx.fillRect(tree.x - 5, tree.y + 10, 10, 20);
      
      // Tree foliage
      ctx.fillStyle = 'hsl(142, 60%, 35%)';
      ctx.beginPath();
      ctx.arc(tree.x, tree.y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(tree.x - 8, tree.y + 5, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(tree.x + 8, tree.y + 5, 12, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw rocks
    const rocks = [
      { x: 200, y: 50, size: 15 }, { x: 500, y: 80, size: 12 },
      { x: 300, y: 150, size: 18 }, { x: 550, y: 150, size: 10 },
      { x: 150, y: 320, size: 14 }, { x: 450, y: 480, size: 16 },
      { x: 600, y: 350, size: 13 }
    ];
    
    rocks.forEach(rock => {
      ctx.fillStyle = 'hsl(0, 0%, 50%)';
      ctx.beginPath();
      ctx.ellipse(rock.x, rock.y, rock.size, rock.size * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Rock highlight
      ctx.fillStyle = 'hsl(0, 0%, 65%)';
      ctx.beginPath();
      ctx.ellipse(rock.x - 3, rock.y - 2, rock.size * 0.4, rock.size * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
    });

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

      // Draw tower base
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

      // Draw turret for dart tower
      if (tower.type === 'dart' && tower.rotation !== undefined) {
        ctx.save();
        ctx.translate(tower.position.x, tower.position.y);
        ctx.rotate(tower.rotation);
        
        // Turret barrel
        ctx.fillStyle = 'hsl(210, 100%, 40%)';
        ctx.fillRect(0, -6, 25, 12);
        
        // Turret barrel outline
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, -6, 25, 12);
        
        // Turret tip
        ctx.fillStyle = 'hsl(210, 100%, 30%)';
        ctx.fillRect(22, -4, 6, 8);
        
        ctx.restore();
      }

      // Draw catapult for bomb tower
      if (tower.type === 'bomb' && tower.rotation !== undefined) {
        ctx.save();
        ctx.translate(tower.position.x, tower.position.y);
        ctx.rotate(tower.rotation);
        
        // Catapult arm
        ctx.fillStyle = 'hsl(30, 60%, 40%)';
        ctx.fillRect(-5, -3, 30, 6);
        
        // Catapult basket
        ctx.fillStyle = 'hsl(30, 60%, 30%)';
        ctx.beginPath();
        ctx.arc(25, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Bomb in basket
        ctx.fillStyle = 'hsl(0, 0%, 10%)';
        ctx.beginPath();
        ctx.arc(25, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      }

      // Draw tower icon (for ice tower only)
      if (tower.type === 'ice') {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('❄', tower.position.x, tower.position.y);
      }
    });

    // Draw explosions
    explosions.forEach(explosion => {
      // Outer explosion ring (fire)
      const gradient = ctx.createRadialGradient(
        explosion.position.x, explosion.position.y, 0,
        explosion.position.x, explosion.position.y, explosion.radius
      );
      gradient.addColorStop(0, `rgba(255, 200, 0, ${explosion.opacity * 0.8})`);
      gradient.addColorStop(0.5, `rgba(255, 100, 0, ${explosion.opacity * 0.6})`);
      gradient.addColorStop(1, `rgba(255, 50, 0, ${explosion.opacity * 0.2})`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(explosion.position.x, explosion.position.y, explosion.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner bright core
      if (explosion.radius < explosion.maxRadius * 0.5) {
        ctx.fillStyle = `rgba(255, 255, 200, ${explosion.opacity})`;
        ctx.beginPath();
        ctx.arc(explosion.position.x, explosion.position.y, explosion.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Smoke particles
      ctx.fillStyle = `rgba(80, 80, 80, ${explosion.opacity * 0.4})`;
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i) / 6;
        const smokeX = explosion.position.x + Math.cos(angle) * explosion.radius * 0.8;
        const smokeY = explosion.position.y + Math.sin(angle) * explosion.radius * 0.8;
        ctx.beginPath();
        ctx.arc(smokeX, smokeY, explosion.radius * 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw projectiles
    projectiles.forEach(projectile => {
      if (projectile.type === 'bomb') {
        // Draw bomb projectile
        ctx.fillStyle = 'rgba(40, 40, 40, 0.9)';
        ctx.beginPath();
        ctx.arc(projectile.position.x, projectile.position.y, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Fuse spark
        ctx.fillStyle = 'rgba(255, 150, 0, 0.9)';
        ctx.beginPath();
        ctx.arc(projectile.position.x - 2, projectile.position.y - 4, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Draw regular projectile
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(projectile.position.x, projectile.position.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
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
  }, [balloons, towers, projectiles, explosions, selectedTower, hoverPos]);

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