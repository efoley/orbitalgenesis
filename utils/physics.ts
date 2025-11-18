import { Orbit } from '../types';

/**
 * Solves Kepler's Equation M = E - e * sin(E) for E (Eccentric Anomaly)
 * using Newton-Raphson iteration.
 */
export const solveKepler = (M: number, e: number, tolerance = 1e-6): number => {
  let E = M; // Initial guess
  let delta = 1;
  const maxIter = 30;
  let iter = 0;

  while (Math.abs(delta) > tolerance && iter < maxIter) {
    delta = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E = E - delta;
    iter++;
  }
  return E;
};

/**
 * Calculates the 2D position relative to the orbit center (focus at 0,0).
 */
export const getPositionOnOrbit = (orbit: Orbit, time: number) => {
  const { a, e, omega, period, meanAnomaly0 } = orbit;
  
  // Mean motion n = 2 * PI / T
  const n = (2 * Math.PI) / period;
  
  // Mean anomaly M(t)
  let M = meanAnomaly0 + n * time;
  
  // Normalize M to 0..2PI
  M = M % (2 * Math.PI);
  
  // Solve for Eccentric Anomaly E
  const E = solveKepler(M, e);
  
  // Calculate coordinates in the orbital plane (PQ plane)
  // P points to periapsis, Q is perpendicular
  // x' = a * (cos E - e)
  // y' = a * sqrt(1 - e^2) * sin E
  const P = a * (Math.cos(E) - e);
  const Q = a * Math.sqrt(1 - e * e) * Math.sin(E);
  
  // Rotate by omega (Argument of Periapsis)
  const x = P * Math.cos(omega) - Q * Math.sin(omega);
  const y = P * Math.sin(omega) + Q * Math.cos(omega);
  
  return { x, y };
};