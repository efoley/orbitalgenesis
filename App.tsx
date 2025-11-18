import React, { useState, useMemo } from 'react';
import SolarSystemCanvas from './components/SolarSystemCanvas';
import { generateSolarSystem } from './utils/generator';
import { Planet, Entity, Moon } from './types';
import { RefreshCw, Play, Pause, ZoomIn, ZoomOut, Eye, EyeOff } from 'lucide-react';

const App: React.FC = () => {
  const [systemId, setSystemId] = useState(0);
  
  // Memoize system generation so it doesn't regenerate on UI updates
  const system = useMemo(() => {
    return generateSolarSystem(window.innerWidth, window.innerHeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemId]);

  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const [zoom, setZoom] = useState(0.3);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showOrbits, setShowOrbits] = useState(true);

  // Hover state
  const [hoveredEntity, setHoveredEntity] = useState<Entity | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleGenerate = () => {
    setSystemId(prev => prev + 1);
    setPan({ x: 0, y: 0 }); // Reset view
  };

  const handleHover = (entity: Entity | null, x: number, y: number) => {
    setHoveredEntity(entity);
    if (entity) {
      setTooltipPos({ x, y });
    }
  };

  // Type guard to check if entity is a Planet
  const isPlanet = (entity: Entity): entity is Planet => {
    return (entity as Planet).type !== undefined;
  };

  // Helper to get parent name if it's a moon
  const getParentName = (moon: Moon) => {
    const parent = system.planets.find(p => p.id === moon.parentId);
    return parent ? parent.name : 'Unknown';
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      
      {/* The Canvas Layer */}
      <SolarSystemCanvas 
        system={system}
        speedMultiplier={speed}
        paused={paused}
        zoom={zoom}
        pan={pan}
        setZoom={setZoom}
        setPan={setPan}
        showOrbits={showOrbits}
        onHover={handleHover}
      />

      {/* UI Overlay: Top Left - Title */}
      <div className="absolute top-6 left-6 pointer-events-none">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 tracking-tighter">
          ORBITAL<span className="text-white">GENESIS</span>
        </h1>
        <p className="text-blue-200/60 text-sm mt-1 uppercase tracking-widest">Procedural System Visualizer</p>
      </div>

      {/* UI Overlay: Bottom Center - Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-gray-900/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl z-10">
        
        <button 
          onClick={handleGenerate}
          className="p-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all active:scale-95 group"
          title="Generate New System"
        >
          <RefreshCw size={20} className={`group-hover:rotate-180 transition-transform duration-500`} />
        </button>

        <div className="w-px h-8 bg-white/10 mx-2"></div>

        <button 
          onClick={() => setPaused(!paused)}
          className="p-3 rounded-xl hover:bg-white/10 text-white transition-all active:scale-95"
        >
          {paused ? <Play size={20} /> : <Pause size={20} />}
        </button>

        <div className="flex items-center bg-black/40 rounded-lg px-2">
          <span className="text-xs text-gray-400 px-2 font-mono">SPEED</span>
          {[0.5, 1, 2, 5].map(s => (
            <button 
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-3 py-2 text-sm font-mono transition-colors ${speed === s ? 'text-cyan-400' : 'text-gray-500 hover:text-white'}`}
            >
              {s}x
            </button>
          ))}
        </div>

        <div className="w-px h-8 bg-white/10 mx-2"></div>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => setZoom(z => Math.max(0.1, z - 0.1))}
            className="p-3 rounded-xl hover:bg-white/10 text-white transition-all"
          >
            <ZoomOut size={20} />
          </button>
          <span className="text-xs font-mono text-gray-400 w-12 text-center">{(zoom * 100).toFixed(0)}%</span>
          <button 
            onClick={() => setZoom(z => Math.min(5, z + 0.1))}
            className="p-3 rounded-xl hover:bg-white/10 text-white transition-all"
          >
            <ZoomIn size={20} />
          </button>
        </div>

        <div className="w-px h-8 bg-white/10 mx-2"></div>

        <button 
          onClick={() => setShowOrbits(!showOrbits)}
          className={`p-3 rounded-xl transition-all active:scale-95 ${showOrbits ? 'text-cyan-400 bg-cyan-400/10' : 'text-gray-400 hover:bg-white/10'}`}
          title="Toggle Orbits"
        >
          {showOrbits ? <Eye size={20} /> : <EyeOff size={20} />}
        </button>
      </div>

      {/* Tooltip */}
      {hoveredEntity && (
        <div 
          className="absolute pointer-events-none z-50 transform -translate-x-1/2 -translate-y-full mb-4 transition-opacity duration-75"
          style={{ left: tooltipPos.x, top: tooltipPos.y - 15 }}
        >
          <div className="bg-gray-900/90 backdrop-blur border border-white/20 p-4 rounded-lg shadow-xl min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: hoveredEntity.color }}></div>
              <h3 className="font-bold text-white">{hoveredEntity.name}</h3>
            </div>
            
            {isPlanet(hoveredEntity) ? (
              <div className="space-y-1 text-xs text-gray-300 font-mono">
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="text-white">{hoveredEntity.type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Moons:</span>
                  <span className="text-white">{hoveredEntity.moons.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Orbit Radius:</span>
                  <span className="text-white">{(hoveredEntity.orbit.a / 100).toFixed(2)} AU</span>
                </div>
                <div className="flex justify-between">
                  <span>Orbital Period:</span>
                  <span className="text-white">{hoveredEntity.orbit.period.toFixed(1)} units</span>
                </div>
                <div className="flex justify-between">
                  <span>Eccentricity:</span>
                  <span className="text-white">{hoveredEntity.orbit.e.toFixed(3)}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1 text-xs text-gray-300 font-mono">
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="text-white">Moon</span>
                </div>
                <div className="flex justify-between">
                  <span>Orbiting:</span>
                  <span className="text-white">{getParentName(hoveredEntity as Moon)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Distance:</span>
                  <span className="text-white">{(hoveredEntity.orbit.a).toFixed(1)} units</span>
                </div>
                 <div className="flex justify-between">
                  <span>Orbital Period:</span>
                  <span className="text-white">{hoveredEntity.orbit.period.toFixed(1)} units</span>
                </div>
              </div>
            )}
          </div>
          {/* Arrow */}
          <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-gray-900/90 absolute left-1/2 -translate-x-1/2 top-full"></div>
        </div>
      )}

      {/* System Stats (Top Right) */}
      <div className="absolute top-6 right-6 bg-black/20 backdrop-blur-sm p-4 rounded-xl border border-white/5 text-right pointer-events-none">
        <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">System Stats</div>
        <div className="font-mono text-sm text-white">
          <div><span className="text-cyan-400">{system.planets.length}</span> Planets</div>
          <div><span className="text-cyan-400">{system.planets.reduce((acc, p) => acc + p.moons.length, 0)}</span> Moons</div>
          <div><span className="text-cyan-400">{system.asteroidBelts.length}</span> Asteroid Belts</div>
        </div>
      </div>
    </div>
  );
};

export default App;