export interface Position {
  x: number;
  y: number;
}

export interface Balloon {
  id: string;
  type: 'red' | 'blue' | 'green' | 'yellow';
  position: Position;
  pathProgress: number;
  health: number;
  maxHealth: number;
  speed: number;
  reward: number;
}

export interface Tower {
  id: string;
  type: 'dart' | 'bomb' | 'ice';
  position: Position;
  range: number;
  fireRate: number;
  lastFired: number;
  damage: number;
  cost: number;
  level: number;
  rotation?: number;
}

export interface Projectile {
  id: string;
  position: Position;
  target: Position;
  speed: number;
  damage: number;
  type: string;
}

export interface GameState {
  money: number;
  lives: number;
  wave: number;
  isPlaying: boolean;
  selectedTower: Tower['type'] | null;
}
