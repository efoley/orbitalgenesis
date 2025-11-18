import React, { useRef, useEffect, useState, useCallback } from 'react';
import { SolarSystem, Planet } from '../types';
import { getPositionOnOrbit } from '../utils/physics';

interface SolarSystemCanvasProps {
  system: SolarSystem;
  speedMultiplier: number;
  paused: boolean;
  zoom: number;
  pan: { x: number, y: number };
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  setPan: React.Dispatch<React.SetStateAction<{ x: number, y: number }>>;
  showOrbits: boolean;
  onPlanetHover: (planet: Planet | null, screenX: number, screenY: number) => void;
}

const SolarSystemCanvas: React.FC<SolarSystemCanvasProps> = ({ 
  system, 
  speedMultiplier, 
  paused, 
  zoom, 
  pan,
  setZoom,
  setPan,
  showOrbits,
  onPlanetHover
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | undefined>(undefined);
  const timeRef = useRef<number>(0);
  
  // To track planet positions for hover detection
  const planetPositionsRef = useRef<Map<string, {x: number, y: number, r: number, planet: Planet}>>(new Map());

  // Mouse tracking
  const mouseRef = useRef<{x: number, y: number}>({x: 0, y: 0});
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{x: number, y: number}>({x: 0, y: 0});

  // Handle Mouse Move (Hover & Drag)
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    mouseRef.current = { x: mouseX, y: mouseY };

    // Handle Pan
    if (isDraggingRef.current) {
      const dx = mouseX - dragStartRef.current.x;
      const dy = mouseY - dragStartRef.current.y;
      
      setPan(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));

      // Reset drag start for continuous delta updates
      dragStartRef.current = { x: mouseX, y: mouseY };
    }
  }, [setPan]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDraggingRef.current = true;
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      dragStartRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // Handle Scroll Zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      // Calculate zoom factor
      const scaleAmount = -e.deltaY * 0.001;
      const newZoom = Math.min(Math.max(0.1, zoom * (1 + scaleAmount)), 5);
      
      if (newZoom !== zoom) {
        // Calculate mouse position relative to canvas center
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        // Zoom towards mouse pointer logic:
        // 1. Get world coordinates of mouse before zoom
        const worldX = (mouseX - cx - pan.x) / zoom;
        const worldY = (mouseY - cy - pan.y) / zoom;

        // 2. Calculate new pan such that world coordinates match mouse position after zoom
        // mouseX = cx + newPanX + worldX * newZoom
        const newPanX = mouseX - cx - (worldX * newZoom);
        const newPanY = mouseY - cy - (worldY * newZoom);

        setZoom(newZoom);
        setPan({ x: newPanX, y: newPanY });
      }
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [zoom, pan, setZoom, setPan]);


  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;

    // Clear screen
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, width, height);
    
    // Render Background Stars
    ctx.fillStyle = '#FFFFFF';
    for(let i=0; i<100; i++) {
        // Parallax effect for stars (optional, currently simple static)
        // To make them move slightly with pan, we can use modulus
        const sx = (i * 1337 + pan.x * 0.05) % width;
        const sy = (i * 7331 + pan.y * 0.05) % height;
        
        // Handle negative wrap
        const finalSx = sx < 0 ? sx + width : sx;
        const finalSy = sy < 0 ? sy + height : sy;

        const opacity = ((i * 997) % 100) / 100;
        ctx.globalAlpha = opacity * 0.5;
        ctx.fillRect(finalSx, finalSy, 1, 1);
    }
    ctx.globalAlpha = 1.0;

    // Update Time
    if (!paused) {
      timeRef.current += 0.05 * speedMultiplier;
    }

    // Apply Zoom/Pan Transform
    ctx.save();
    // Translate to center + pan offset
    ctx.translate(cx + pan.x, cy + pan.y);
    // Apply scale
    ctx.scale(zoom, zoom);

    // Draw Star
    const { star } = system;
    const starGradient = ctx.createRadialGradient(0, 0, star.radius * 0.2, 0, 0, star.radius * 3);
    starGradient.addColorStop(0, star.color);
    starGradient.addColorStop(0.4, star.color);
    starGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = starGradient;
    ctx.beginPath();
    ctx.arc(0, 0, star.radius * 3, 0, Math.PI * 2);
    ctx.fill();

    // Solid Core
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(0, 0, star.radius * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Reset positions map for this frame
    planetPositionsRef.current.clear();

    // Draw Asteroids
    system.asteroidBelts.forEach(belt => {
        ctx.fillStyle = '#555';
        belt.particles.forEach(p => {
            const angle = p.angle + (p.speed * timeRef.current * 0.001);
            const ax = Math.cos(angle) * p.radius;
            const ay = Math.sin(angle) * p.radius;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            // Adjust size based on zoom so they don't disappear
            const displaySize = Math.max(p.size, 0.5 / zoom);
            ctx.arc(ax, ay, displaySize, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;
    });

    // Draw Planets & Orbits
    system.planets.forEach(planet => {
      // 1. Draw Orbit Path
      if (showOrbits) {
          ctx.strokeStyle = '#ffffff20';
          ctx.lineWidth = 1 / zoom; // Constant width regardless of zoom
          ctx.beginPath();
          
          const c = planet.orbit.a * planet.orbit.e;
          const centerX = -c * Math.cos(planet.orbit.omega);
          const centerY = -c * Math.sin(planet.orbit.omega);
          const b = planet.orbit.a * Math.sqrt(1 - planet.orbit.e ** 2);

          ctx.ellipse(
              centerX, 
              centerY, 
              planet.orbit.a, 
              b, 
              planet.orbit.omega, 
              0, 
              2 * Math.PI
          );
          ctx.stroke();
      }

      // 2. Calculate Position
      const pos = getPositionOnOrbit(planet.orbit, timeRef.current);

      // 3. Draw Planet
      ctx.fillStyle = planet.color;
      
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, planet.radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw Moons
      planet.moons.forEach(moon => {
          const mPosLocal = getPositionOnOrbit(moon.orbit, timeRef.current);
          const mx = pos.x + mPosLocal.x;
          const my = pos.y + mPosLocal.y;

          // Moon Orbit
          if (showOrbits && zoom > 0.5) {
             ctx.strokeStyle = '#ffffff10';
             ctx.lineWidth = 0.5 / zoom;
             ctx.beginPath();
             ctx.arc(pos.x, pos.y, moon.orbit.a, 0, Math.PI * 2);
             ctx.stroke();
          }

          ctx.fillStyle = moon.color;
          ctx.beginPath();
          const moonSize = Math.max(moon.radius, 0.5 / zoom);
          ctx.arc(mx, my, moonSize, 0, Math.PI * 2);
          ctx.fill();
      });

      // Store screen coordinates for hover
      // Transform world space (pos.x, pos.y) to screen space
      // Screen = (World * Zoom) + Center + Pan
      const screenX = (pos.x * zoom) + cx + pan.x;
      const screenY = (pos.y * zoom) + cy + pan.y;
      planetPositionsRef.current.set(planet.id, { x: screenX, y: screenY, r: planet.radius * zoom, planet });
    });

    ctx.restore();

    // Check Hover
    if (!isDraggingRef.current) { // Only check hover if not dragging
        let foundPlanet: Planet | null = null;
        let hX = 0;
        let hY = 0;

        for (const [_, pData] of planetPositionsRef.current) {
           const dx = mouseRef.current.x - pData.x;
           const dy = mouseRef.current.y - pData.y;
           const hitRadius = Math.max(pData.r, 15); // Generous hit area
           if (dx*dx + dy*dy < hitRadius*hitRadius) {
               foundPlanet = pData.planet;
               hX = pData.x;
               hY = pData.y;
               break; 
           }
        }
        onPlanetHover(foundPlanet, hX, hY);
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [system, speedMultiplier, paused, zoom, pan, showOrbits, onPlanetHover]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
        if (canvasRef.current) {
            canvasRef.current.width = window.innerWidth;
            canvasRef.current.height = window.innerHeight;
        }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Init
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      className={`absolute inset-0 w-full h-full ${isDraggingRef.current ? 'cursor-grabbing' : 'cursor-grab'}`}
    />
  );
};

export default SolarSystemCanvas;