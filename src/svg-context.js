import {degrees} from './utils';
import SvgElement, {G} from './svg-element';

/**
 * Encapsulates an SVG g element, allowing the setting of transformation
 * parameters a la carte. Uses radians instead of degress for rotation.
 */

export default class SvgContext extends SvgElement {
  constructor(opts) {
    super('g', {});
    Object.assign(this, {x: 0, y: 0, rot: 0, cx: 0, cy: 0});
    this.transform(opts);
  }

  transform(opts) {
    Object.assign(this, SvgContext._xparams(opts));
    this._update();
  }

  static _xparams(opts) {
    const _opts = typeof opts === 'undefined' ? {} : opts;
    const xps = ['x', 'y', 'rot', 'cx', 'cy'].reduce((acc, param) => {
      if (param in _opts) acc[param] = _opts[param];
      return acc;
    }, {});
    if ('pos' in _opts) {
      xps.x = opts.pos[0];
      xps.y = opts.pos[1];
    }
    if ('c' in _opts) {
      xps.cx = opts.c[0];
      xps.cy = opts.c[1];
    }
    return xps;
  }

  _update() {
    const {x, y, rot, cx, cy} = this;
    this.setAttr('transform',
      `translate(${x} ${y}) rotate(${degrees(rot)} ${cx} ${cy})`);
  }
}
