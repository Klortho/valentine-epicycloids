import {π, τ, range, fixed3} from './utils';

const pointDensity = 50;

export default class EpiCycloid {
  constructor(cusps) {
    this.cusps = cusps;
    const totalPoints = this.totalPoints = cusps * pointDensity;
    this.points = range(totalPoints)
      .map(n => this.point(τ * n / (totalPoints - 1)));
    this.pointStrs = this.points.map(p => p.map(fixed3).join(' '));
  }

  point(angle) {
    const rr = 1 + this.cusps;                // roll radius
    const penA = (1 + this.cusps) * angle - π;    // pen angle
    return [
      rr * Math.cos(angle) + Math.cos(penA),
      rr * Math.sin(angle) + Math.sin(penA),
    ];
  }

  // returns the SVG path string for all the points up to the given angle
  pathTo(angle) {
    // Since angle must be >= 0: this ensures 1 <= numPoints <= totalPoints
    const numPoints =
      Math.min(this.totalPoints, this.totalPoints * angle / τ + 1);
    return 'M ' + this.pointStrs.slice(0, numPoints).join(' L ');
  }
}

EpiCycloid.pointDensity = pointDensity;
