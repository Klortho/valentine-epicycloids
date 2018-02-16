import {τ} from './utils';
import EpiCycloid from './epi-cycloid';
import {Circle, Path} from './svg-element';
import SvgContext from './svg-context';

/**
 * Encapsulates the SVG elements associated with one epicycloid.
 */
export default function EpiSetClass(parent, maxCusps, finalAngle) {
  return class {
    constructor(cusps) {
      this.cusps = cusps;
      const hue = this.hue = Math.floor((this.cusps - 1) * 360 / maxCusps);
      const circleColor = `hsl(${hue}, 50%, 80%)`;

      this.epiCycloid = new EpiCycloid(cusps);

      this.hubContext = new SvgContext({x: -cusps});
      this.hub = Circle({
        r: cusps,
        cx: 0,
        cy: 0,
        stroke: circleColor,
      });

      this.rollerContext = new SvgContext({x: cusps + 1});
      this.roller = Circle({
        r: 1,
        cx: 0,
        cy: 0,
        stroke: circleColor,
      });
      this.pen = Circle({
        'class': 'pen',
        r: 0.1,
        cx: -1,
        cy: 0,
      });
      this.rollerContext.appendChildren(this.roller, this.pen);
      this.hubContext.appendChildren(this.hub, this.rollerContext);

      this.curve = Path({
        d: this.epiCycloid.pathTo(τ),
        fill: 'none',
        stroke: `hsl(${hue}, 100%, 50%)`,
      });
      this.hubContext.appendChild(this.curve);

      parent.appendChild(this.hubContext);
    }

    // Roll the roller around the outside of the hub
    rollTo(angle) {
      const rg = this.rollerContext;
      const r = 1 + this.cusps;
      rg.transform({
        pos: [r * Math.cos(angle), r * Math.sin(angle)],
        rot: (this.cusps + 1) * angle,
      });
    }

    // Spin the hub inside the largest epicycloid's hub
    spinTo(angle) {
      const {hubContext} = this;
      const r = maxCusps - this.cusps;
      hubContext.transform({
        pos: [-maxCusps + r * Math.cos(angle), r * Math.sin(angle)],
        rot: -(maxCusps / this.cusps - 1) * angle,
      });
    }

    // p is the animation parameter, 0 <= p <= 1
    update(p) {
      const {cusps, hue, hub, roller, pen, curve, g} = this;

      const curveAngle = this.curveAngle = τ * p;
      this.rollTo(curveAngle);
      const spinAngle = this.spinAngle = finalAngle * p;
      this.spinTo(spinAngle);

      this.curve.setAttrs({
        d: this.epiCycloid.pathTo(τ * p),
        fill: `hsla(${hue}, 100%, 50%, ${p * ((maxCusps - cusps + 1) / maxCusps)})`,
      });

      this.hub.setAttr('opacity', 1-p);
      this.roller.setAttr('opacity', 1-p);
      this.pen.setAttr('opacity', 1-p);
    }

    static update(p) {
      return instance => instance.update(p);
    }
  };
}
