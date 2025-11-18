import { SolarSystem, Planet, PlanetType, AsteroidBelt, Moon } from '../types';

// Helper for random range
const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateName = () => {
  const prefixes = ['Kep', 'Gliese', 'Trappist', 'Proxima', 'Sol', 'Vega', 'Altair', 'Deneb', 'K2', 'HD'];
  const suffixes = ['Prime', 'Major', 'Minor', 'b', 'c', 'd', 'x', 'Zeta', 'I', 'II', 'III'];
  return `${prefixes[randomInt(0, prefixes.length - 1)]}-${randomInt(10, 999)} ${suffixes[randomInt(0, suffixes.length - 1)]}`;
};

const toRoman = (num: number) => {
  const roms = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  return roms[num - 1] || num.toString();
};

const generateColor = (type: string): string => {
  // Simple HSL generation instead of D3 to avoid dependency issues
  const hue = (min: number, max: number) => randomInt(min, max);
  const sat = (min: number, max: number) => randomInt(min, max);
  const lig = (min: number, max: number) => randomInt(min, max);

  switch (type) {
    case PlanetType.ROCKY:
       // Earth-like (green/blue) or Mars-like (red/orange)
       if (Math.random() > 0.5) {
         return `hsl(${hue(100, 220)}, ${sat(40, 80)}%, ${lig(30, 60)}%)`; // Green/Blue
       } else {
         return `hsl(${hue(0, 40)}, ${sat(50, 90)}%, ${lig(40, 70)}%)`; // Red/Orange
       }
    case PlanetType.GAS_GIANT:
      return `hsl(${hue(20, 50)}, ${sat(60, 90)}%, ${lig(50, 80)}%)`; // Orange/Beige
    case PlanetType.ICE_GIANT:
      return `hsl(${hue(180, 260)}, ${sat(60, 90)}%, ${lig(60, 85)}%)`; // Blue/Cyan
    case PlanetType.DWARF:
      return `hsl(${hue(0, 0)}, ${sat(0, 10)}%, ${lig(40, 80)}%)`; // Grey/White
    case 'STAR':
      return `hsl(${hue(30, 60)}, ${sat(80, 100)}%, ${lig(50, 80)}%)`; // Yellow/Orange Star
    default:
      return '#888';
  }
};

export const generateSolarSystem = (width: number, height: number): SolarSystem => {
  const system: SolarSystem = {
    star: {
      radius: randomRange(5, 8), // Significantly smaller star (1/4 size)
      color: generateColor('STAR'),
      mass: 1,
    },
    planets: [],
    asteroidBelts: [],
  };

  // Generate Planets
  const numPlanets = randomInt(7, 12); 
  
  // We track the outer boundary of the previous orbit to ensure no overlaps.
  // Start close to the star to allow inner planets at ~0.35 AU (35px).
  // Star radius is ~6.5, +5 buffer = ~11.5 start.
  let previousAphelion = system.star.radius + 5;

  for (let i = 0; i < numPlanets; i++) {
    // Logic to ensure orbits don't cross:
    // The Perihelion (closest point) of the NEW planet must be > Aphelion (furthest point) of OLD planet
    // plus some safety gap.
    
    const isInnerSystem = i < 4;
    
    // Define Gap
    // Inner planets are closer together, outer planets have vast distances
    // Reduced minGap for inner system to 20 to allow closest orbit to be ~35px (0.35 AU)
    const minGap = isInnerSystem ? 20 : 80;
    const maxGap = isInnerSystem ? 60 : 200;
    const gap = randomRange(minGap, maxGap);

    // Determine Orbit Eccentricity first
    const eccentricity = randomRange(0.01, 0.2);

    // Calculate Position
    // Perihelion distance = a * (1 - e)
    // We want Perihelion = previousAphelion + gap
    // Therefore: a = (previousAphelion + gap) / (1 - e)
    const perihelion = previousAphelion + gap;
    const semiMajorAxis = perihelion / (1 - eccentricity);
    
    // Determine type based on distance (Frost Line) and sequence
    let type = PlanetType.ROCKY;
    const roll = Math.random();

    // "Frost Line" logic: Outer planets are likely Gas/Ice Giants
    if (semiMajorAxis > 400 || i > 4) {
      if (roll > 0.55) type = PlanetType.GAS_GIANT;
      else if (roll > 0.25) type = PlanetType.ICE_GIANT;
      else if (roll > 0.1) type = PlanetType.ROCKY; // Occasional rocky world far out
      else type = PlanetType.DWARF;
    } else {
      // Inner system: mostly rocky or dwarf
      if (roll < 0.15) type = PlanetType.DWARF;
      else type = PlanetType.ROCKY;
    }

    const radius = type === PlanetType.GAS_GIANT ? randomRange(10, 16) :
                   type === PlanetType.ICE_GIANT ? randomRange(7, 11) :
                   type === PlanetType.DWARF ? randomRange(1.5, 2.5) :
                   randomRange(3, 6);

    // Color based on type
    const color = generateColor(type);

    // Orbital parameters
    // Kepler's 3rd law approximation for period: T^2 proportional to a^3
    const period = Math.pow(semiMajorAxis, 1.5) * 0.005; 

    const planetName = generateName();
    const planet: Planet = {
      id: `planet-${i}`,
      name: planetName,
      type,
      radius,
      color,
      description: `A ${type} planet.`,
      moons: [],
      orbit: {
        a: semiMajorAxis,
        e: eccentricity, 
        omega: randomRange(0, Math.PI * 2),
        period: period,
        meanAnomaly0: randomRange(0, Math.PI * 2),
      }
    };

    // Calculate this planet's Aphelion to serve as boundary for next planet
    // Aphelion = a * (1 + e)
    previousAphelion = semiMajorAxis * (1 + eccentricity);

    // Generate Moons
    if (type !== PlanetType.DWARF) {
        // Giants have more moons
        let numMoons = 0;
        if (type === PlanetType.GAS_GIANT) numMoons = randomInt(3, 8);
        else if (type === PlanetType.ICE_GIANT) numMoons = randomInt(2, 5);
        else numMoons = randomInt(0, 2); // Rocky

        for (let m = 0; m < numMoons; m++) {
            const moonDist = radius + randomRange(5, 15) + (m * randomRange(4, 8));
            const moon: Moon = {
                id: `moon-${i}-${m}`,
                name: `${planetName} ${toRoman(m + 1)}`,
                parentId: planet.id,
                radius: randomRange(0.8, 1.8),
                color: '#ccc',
                orbit: {
                    a: moonDist,
                    e: randomRange(0, 0.1),
                    omega: randomRange(0, Math.PI * 2),
                    period: Math.pow(moonDist, 1.5) * 0.15, 
                    meanAnomaly0: randomRange(0, Math.PI * 2),
                }
            };
            planet.moons.push(moon);
        }
    }

    system.planets.push(planet);
  }

  // --- Generate Inner Asteroid Belts ---
  // Find all valid gaps between planets where a belt can physically fit
  const validGaps: number[] = [];

  for (let i = 0; i < system.planets.length - 1; i++) {
    const p1 = system.planets[i];
    const p2 = system.planets[i+1];

    const p1Aphelion = p1.orbit.a * (1 + p1.orbit.e);
    const p2Perihelion = p2.orbit.a * (1 - p2.orbit.e);
    const safetyMargin = 15; 
    const minBeltWidth = 20;

    // Check if there is enough physical space for a belt + safety margins
    if (p2Perihelion > p1Aphelion + (safetyMargin * 2) + minBeltWidth) {
        validGaps.push(i);
    }
  }

  // Determine how many inner belts to generate based on probabilities
  const roll = Math.random();
  let numInnerBelts = 1; // Always at least 1
  if (roll < 0.05) {
    numInnerBelts = 3; // 5% chance
  } else if (roll < 0.25) {
    numInnerBelts = 2; // 20% chance (cumulatively with the 5%)
  }

  // We can't generate more belts than we have valid gaps
  numInnerBelts = Math.min(numInnerBelts, validGaps.length);

  // Shuffle valid gaps to pick random locations
  for (let i = validGaps.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [validGaps[i], validGaps[j]] = [validGaps[j], validGaps[i]];
  }

  // Select the gaps and generate belts
  const selectedGaps = validGaps.slice(0, numInnerBelts);

  selectedGaps.forEach(idx => {
      const p1 = system.planets[idx];
      const p2 = system.planets[idx+1];
      
      const p1Aphelion = p1.orbit.a * (1 + p1.orbit.e);
      const p2Perihelion = p2.orbit.a * (1 - p2.orbit.e);
      const safetyMargin = 15;
      
      const minR = p1Aphelion + safetyMargin;
      const maxR = p2Perihelion - safetyMargin;
      
      const count = Math.floor((maxR - minR) * 20); 
      const particles = [];
      for(let k=0; k<count; k++) {
        const r = randomRange(minR, maxR);
        particles.push({
            angle: randomRange(0, Math.PI * 2),
            radius: r,
            speed: (1 / Math.sqrt(r)) * 5,
            size: randomRange(0.5, 1.5)
        });
      }
      system.asteroidBelts.push({ minRadius: minR, maxRadius: maxR, count, particles });
  });

  // --- Generate Outer Kuiper Belt (Always) ---
  const hasOuterBelt = true;
  if (hasOuterBelt) {
    // Kuiper belt analogue - outside the last planet
    const lastPlanet = system.planets[system.planets.length - 1];
    const pAphelion = lastPlanet.orbit.a * (1 + lastPlanet.orbit.e);
    
    const minR = pAphelion + 40; // Safe distance from last planet's furthest point
    const maxR = minR + randomRange(80, 150);
    
    const count = 2500;
    const particles = [];
    for(let k=0; k<count; k++) {
      const r = randomRange(minR, maxR);
      particles.push({
          angle: randomRange(0, Math.PI * 2),
          radius: r,
          speed: (1 / Math.sqrt(r)) * 5,
          size: randomRange(0.5, 1.5)
      });
    }
    system.asteroidBelts.push({ minRadius: minR, maxRadius: maxR, count, particles });
  }

  return system;
};
