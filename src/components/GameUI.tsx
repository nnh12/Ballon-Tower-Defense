import { GameState, Tower } from '@/types/game';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Heart, Coins, Waves } from 'lucide-react';

interface GameUIProps {
  gameState: GameState;
  onSelectTower: (type: Tower['type']) => void;
  onStartWave: () => void;
}

const TOWER_INFO = {
  dart: { cost: 200, name: 'Dart Tower', icon: '🎯', range: 120, damage: 1 },
  bomb: { cost: 400, name: 'Bomb Tower', icon: '💣', range: 100, damage: 3 },
  ice: { cost: 300, name: 'Ice Tower', icon: '❄️', range: 90, damage: 1 },
};

const GameUI = ({ gameState, onSelectTower, onStartWave }: GameUIProps) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Stats */}
      <Card className="p-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-accent" />
            <div>
              <div className="text-xs text-muted-foreground">Money</div>
              <div className="text-xl font-bold text-accent">${gameState.money}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-destructive" />
            <div>
              <div className="text-xs text-muted-foreground">Lives</div>
              <div className="text-xl font-bold text-destructive">{gameState.lives}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Waves className="w-5 h-5 text-primary" />
            <div>
              <div className="text-xs text-muted-foreground">Wave</div>
              <div className="text-xl font-bold text-primary">{gameState.wave}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tower Selection */}
      <Card className="p-4">
        <h3 className="font-bold text-lg mb-3">Towers</h3>
        <div className="grid grid-cols-1 gap-2">
          {Object.entries(TOWER_INFO).map(([type, info]) => (
            <Button
              key={type}
              onClick={() => onSelectTower(type as Tower['type'])}
              variant={gameState.selectedTower === type ? 'default' : 'outline'}
              disabled={gameState.money < info.cost}
              className="justify-start h-auto py-3"
            >
              <div className="flex items-center gap-3 w-full">
                <span className="text-2xl">{info.icon}</span>
                <div className="flex-1 text-left">
                  <div className="font-semibold">{info.name}</div>
                  <div className="text-xs opacity-70">
                    ${info.cost} • Range: {info.range} • DMG: {info.damage}
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </Card>

      {/* Wave Control */}
      <Button
        onClick={onStartWave}
        disabled={gameState.isPlaying}
        size="lg"
        className="w-full"
      >
        {gameState.isPlaying ? 'Wave In Progress...' : `Start Wave ${gameState.wave + 1}`}
      </Button>

      {/* Instructions */}
      <Card className="p-4 text-sm text-muted-foreground">
        <h4 className="font-semibold mb-2 text-foreground">How to Play:</h4>
        <ul className="space-y-1 list-disc list-inside">
          <li>Select a tower and click to place it</li>
          <li>Towers automatically shoot nearby balloons</li>
          <li>Don't let balloons reach the end!</li>
          <li>Earn money by popping balloons</li>
        </ul>
      </Card>
    </div>
  );
};

export default GameUI;
