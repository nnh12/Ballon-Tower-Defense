import { useState, useEffect, useCallback } from 'react';
import GameCanvas, { getPathPosition } from '@/components/GameCanvas';
import GameUI from '@/components/GameUI';
import { Balloon, Tower, Projectile, GameState, Position } from '@/types/game';
import { toast } from 'sonner';

const INITIAL_MONEY = 650;
const INITIAL_LIVES = 20;

const TOWER_CONFIGS = {
  dart: { cost: 200, range: 120, fireRate: 1000, damage: 1 },
  bomb: { cost: 400, range: 100, fireRate: 1500, damage: 3 },
  ice: { cost: 300, range: 90, fireRate: 2000, damage: 1 },
};

const BALLOON_CONFIGS = {
  red: { health: 1, speed: 0.0005, reward: 10 },
  blue: { health: 2, speed: 0.00045, reward: 15 },
  green: { health: 3, speed: 0.0004, reward: 20 },
  yellow: { health: 4, speed: 0.00035, reward: 25 },
};

const Index = () => {
  const [gameState, setGameState] = useState<GameState>({
    money: INITIAL_MONEY,
    lives: INITIAL_LIVES,
    wave: 0,
    isPlaying: false,
    selectedTower: null,
  });

  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);

  // Start a new wave
  const startWave = useCallback(() => {
    if (gameState.isPlaying) return;

    setGameState(prev => ({ ...prev, isPlaying: true, wave: prev.wave + 1 }));
    
    const wave = gameState.wave + 1;
    const balloonCount = 10 + wave * 5;
    
    // Spawn balloons with delay
    let spawnedCount = 0;
    const spawnInterval = setInterval(() => {
      if (spawnedCount >= balloonCount) {
        clearInterval(spawnInterval);
        return;
      }

      const types: (keyof typeof BALLOON_CONFIGS)[] = ['red', 'blue', 'green', 'yellow'];
      const maxTypeIndex = Math.min(Math.floor(wave / 3), types.length - 1);
      const type = types[Math.floor(Math.random() * (maxTypeIndex + 1))];
      const config = BALLOON_CONFIGS[type];

      const newBalloon: Balloon = {
        id: `balloon-${Date.now()}-${spawnedCount}`,
        type,
        position: getPathPosition(0),
        pathProgress: 0,
        health: config.health,
        maxHealth: config.health,
        speed: config.speed,
        reward: config.reward,
      };

      setBalloons(prev => [...prev, newBalloon]);
      spawnedCount++;
    }, 800);

    toast.success(`Wave ${wave} started!`);
  }, [gameState.wave, gameState.isPlaying]);

  // Place tower
  const handlePlaceTower = useCallback((position: Position, type: Tower['type']) => {
    const config = TOWER_CONFIGS[type];
    
    if (gameState.money < config.cost) {
      toast.error('Not enough money!');
      return;
    }

    // Check if too close to path or other towers
    const tooClose = towers.some(t => 
      Math.hypot(t.position.x - position.x, t.position.y - position.y) < 50
    );

    if (tooClose) {
      toast.error('Too close to another tower!');
      return;
    }

    const newTower: Tower = {
      id: `tower-${Date.now()}`,
      type,
      position,
      range: config.range,
      fireRate: config.fireRate,
      lastFired: 0,
      damage: config.damage,
      cost: config.cost,
      level: 1,
    };

    setTowers(prev => [...prev, newTower]);
    setGameState(prev => ({ 
      ...prev, 
      money: prev.money - config.cost,
      selectedTower: null 
    }));
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} tower placed!`);
  }, [gameState.money, towers]);

  // Game loop
  useEffect(() => {
    const gameLoop = setInterval(() => {
      const now = Date.now();

      // Move balloons
      setBalloons(prev => {
        const updated = prev.map(balloon => {
          const newProgress = balloon.pathProgress + balloon.speed;
          const newPosition = getPathPosition(newProgress);
          
          return {
            ...balloon,
            pathProgress: newProgress,
            position: newPosition,
          };
        }).filter(balloon => {
          if (balloon.pathProgress >= 1) {
            setGameState(gs => ({ ...gs, lives: gs.lives - 1 }));
            toast.error('A balloon escaped!');
            return false;
          }
          return true;
        });

        // Check if wave is complete
        if (updated.length === 0 && gameState.isPlaying) {
          setGameState(prev => ({ ...prev, isPlaying: false }));
          toast.success('Wave complete!');
        }

        return updated;
      });

      // Tower shooting
      setTowers(prev => {
        const updatedTowers = prev.map(tower => {
          // Find nearest balloon in range
          const target = balloons.find(balloon => {
            const dist = Math.hypot(
              balloon.position.x - tower.position.x,
              balloon.position.y - tower.position.y
            );
            return dist <= tower.range;
          });

          // Calculate rotation towards target
          let rotation = tower.rotation || 0;
          if (target) {
            const dx = target.position.x - tower.position.x;
            const dy = target.position.y - tower.position.y;
            rotation = Math.atan2(dy, dx);
          }

          // Shoot if cooldown is ready
          if (now - tower.lastFired >= tower.fireRate && target) {
            const projectile: Projectile = {
              id: `proj-${Date.now()}-${Math.random()}`,
              position: { ...tower.position },
              target: { ...target.position },
              speed: 5,
              damage: tower.damage,
              type: tower.type,
            };
            setProjectiles(p => [...p, projectile]);
            return { ...tower, lastFired: now, rotation };
          }

          return { ...tower, rotation };
        });
        return updatedTowers;
      });

      // Move projectiles and check hits
      setProjectiles(prev => {
        const updated = prev.map(proj => {
          const dx = proj.target.x - proj.position.x;
          const dy = proj.target.y - proj.position.y;
          const dist = Math.hypot(dx, dy);

          if (dist < proj.speed) {
            // Hit! Damage balloon
            setBalloons(balloons => balloons.map(balloon => {
              const hitDist = Math.hypot(
                balloon.position.x - proj.position.x,
                balloon.position.y - proj.position.y
              );
              
              if (hitDist < 20) {
                const newHealth = balloon.health - proj.damage;
                if (newHealth <= 0) {
                  setGameState(gs => ({ ...gs, money: gs.money + balloon.reward }));
                  return { ...balloon, health: 0 };
                }
                return { ...balloon, health: newHealth };
              }
              return balloon;
            }).filter(b => b.health > 0));
            
            return null;
          }

          const angle = Math.atan2(dy, dx);
          return {
            ...proj,
            position: {
              x: proj.position.x + Math.cos(angle) * proj.speed,
              y: proj.position.y + Math.sin(angle) * proj.speed,
            },
          };
        }).filter((p): p is Projectile => p !== null);

        return updated;
      });
    }, 16);

    return () => clearInterval(gameLoop);
  }, [balloons, gameState.isPlaying]);

  // Game over check
  useEffect(() => {
    if (gameState.lives <= 0) {
      toast.error('Game Over!');
      // Reset game
      setTimeout(() => {
        setGameState({
          money: INITIAL_MONEY,
          lives: INITIAL_LIVES,
          wave: 0,
          isPlaying: false,
          selectedTower: null,
        });
        setBalloons([]);
        setTowers([]);
        setProjectiles([]);
      }, 2000);
    }
  }, [gameState.lives]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-game-sky-start to-game-sky-end p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold text-center mb-2 text-primary drop-shadow-lg">
          Balloon Tower Defense
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          Defend your territory from the balloon invasion!
        </p>
        
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <div className="flex justify-center">
            <GameCanvas
              balloons={balloons}
              towers={towers}
              projectiles={projectiles}
              selectedTower={gameState.selectedTower}
              onPlaceTower={handlePlaceTower}
            />
          </div>
          
          <div>
            <GameUI
              gameState={gameState}
              onSelectTower={(type) => setGameState(prev => ({ ...prev, selectedTower: type }))}
              onStartWave={startWave}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;