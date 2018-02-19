(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.EpiValentine = factory());
}(this, (function () { 'use strict';

const π = Math.PI;
const τ = 2 * π;

// Fix the modulo operator (no negative return values)
const mod = m => n => {
  const v = n % m;
  return v >= 0 ? v : v + m;
};

// normalize an angle 0 <= a < τ
const normalAngle = mod(τ);

// center an angle -π <= a < π
const centeredAngle = a => normalAngle(a + π) - π;

const degrees = a => a * 180 / π;

// An array of numbers from start .. end-1
const range = (end, start=0) =>
  [...Array(end - start)].map((v, i) => i + start);

// Convert a number to a fixed-point (3-decimal digit) string
const fixed3 = num => num.toFixed(3);

/**
 * `flatten` accepts one argument, which must be an array. This does not recurse;
 * it only flattens one level of nesting.
 */
const flatten = arr => [].concat(...arr);

/**
 * The arguments to unnest can be any combination of scalars and
 * arrays. This recurses until a flat array of scalars obtains.
 */
const unnest = (...arr) =>
  arr.length === 1 ? (
    !Array.isArray(arr[0]) ? [arr[0]] : unnest(...arr[0])
  ) :
  flatten(arr.map(item => unnest(item)));

const pointDensity = 50;

class EpiCycloid {
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

var SvgElement = class {
  constructor(tag, ...args) {
    this.elem = document.createElementNS('http://www.w3.org/2000/svg', tag);

    const [attrs, kids] =
          args.length > 0 &&
          typeof args[0] === 'object' &&
          args[0] !== null &&
          !(args[0] instanceof Node) &&
          !(args[0] instanceof SvgElement)
        ? [args[0], args.slice(1)]
        : [{}, args];
    this.setAttrs(attrs);
    unnest(kids).filter(k => typeof k !== 'undefined' && k !== null)
      .forEach(kid =>
        this.elem.appendChild(SvgElement.toNode(kid))
      );
  }

  setAttr(attr, val) {
    this.elem.setAttribute(attr, val);
  }

  setAttrs(attrs) {
    Object.keys(attrs).forEach(k => {
      this.elem.setAttribute(k, attrs[k]);
    });
  }

  appendChild(kid) {
    this.elem.appendChild(SvgElement.toNode(kid));
  }

  appendChildren(...kids) {
    kids.forEach(kid => this.appendChild(kid));
  }

  static appendChild(parent, kid) {
    const p = SvgElement.toNode(parent);
    if (typeof kid === 'undefined') { // curry
      return kid => p.appendChild(SvgElement.toNode(kid));
    }
    else {
      p.appendChild(SvgElement.toNode(kid));
    }
  }

  static appendChildren(parent, ...kids) {
    kids.forEach(SvgElement.appendChild(parent));
  }

  static toNode(arg) {
    return arg instanceof SvgElement ? arg.elem :
      arg instanceof Node ? arg :
        document.createTextNode(arg);
  }
};

// Shortcut functions to create specific SVG elements
const [Circle, G, Path, Rect, Svg] = ['circle', 'g', 'path', 'rect', 'svg']
  .map(tag => (...args) => new SvgElement(tag, ...args));

/**
 * Encapsulates an SVG g element, allowing the setting of transformation
 * parameters a la carte. Uses radians instead of degress for rotation.
 */

class SvgContext extends SvgElement {
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

/**
 * Encapsulates the SVG elements associated with one epicycloid.
 */
function EpiSetClass(parent, maxCusps, finalAngle) {
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

// run states:
const [PAUSED, RUNNING, DONE] = [0, 1, 2, 3];
const stateNames = ['PAUSED', 'RUNNING', 'DONE'];


class EpiValentine {
  static get defaults() {
    return {
      debug: false,
      width: 600,
      height: 600,
      margin: 20,
      maxCusps: 20,
      duration: 10000,
      stepSize: 50,
    };
  }

  log(...args) {
    if (this.debug) console.log(...args);
  }

  get stateName() {
    return stateNames[this.state];
  }

  constructor(document, opts) {
    this.initialized = false;
    this.runState = PAUSED;
    this.document = document;
    this.header = document.getElementById('header');
    Object.assign(this, EpiValentine.defaults, opts);
    this.elapsed = 0;
  }

  // Having a separate initialize method allows changing parameters after
  // construction but before starting animation.
  initialize() {
    const {document, margin, width, height, effWidth, effHeight,
      scale, maxCusps, scaledMargin, scaledWidth, finalAngle} = this;

    const drawing = this.drawing = new SvgContext;
    SvgElement.appendChildren(document.body,
      Svg({width: width, height: height},
        Rect({
          'class': 'border',
          x: margin,
          y: margin,
          width: effWidth,
          height: effHeight,
        }),
        G({transform: `scale(${scale} ${-scale}) ` +
            `translate(${scaledWidth - 2 + scaledMargin}, ` +
                      `${-scaledWidth / 2 - scaledMargin}) ` +
            `rotate(90 ${-maxCusps} 0)`},
          drawing)
      )
    );
    const EpiSet = this.EpiSet = EpiSetClass(drawing, maxCusps, finalAngle);
    this.epiSets = range(maxCusps + 1, 1).reverse().map(
      cusps => new EpiSet(cusps));

    this.initialized = true;
  }

  set finalAngle(v) {
    this._finalAngle = v;
  }

  get finalAngle() {
    if (typeof this._finalAngle === 'undefined')
      this._finalAngle = τ * (Math.random() + 0.7);
    return this._finalAngle;
  }

  get effWidth() {
    return this.width - 2 * this.margin;
  }

  get effHeight() {
    return this.height - 2 * this.margin;
  }

  get scaledWidth() {
    return 2 * this.maxCusps + 4;
  }

  get scale() {
    return this.effWidth / this.scaledWidth;
  }

  get scaledMargin() {
    return this.margin / this.scale;
  }

  get spinTarget() {
    return centeredAngle(this.finalAngle * (this.maxCusps - 1))
  }

  stepper(delta) {
    const _delta = !this.initialized ? () => 0 : delta;

    window.requestAnimationFrame(time => {
      if (!this.initialized) this.initialize();
      this.elapsed = Math.min(this.duration, this.elapsed + _delta(time));

      this.log('inside stepper step\n' +
               '  lastWindowTime: ' + this.lastWindowTime + '\n' +
               '  time: ' + time + '\n' +
               '  elapsed: ' + this.elapsed + '\n');
      this.setAnimation(this.elapsed / this.duration);
      this.lastWindowTime = time;
      if (this.elapsed === this.duration) {
        this.runState = DONE;
        this.log('Done.');
        return;
      }
      if (this.runState === RUNNING) this.stepper(time => time - this.lastWindowTime);
    });
  }

  setAnimation(p) {
    header.style.opacity = p;
    this.drawing.transform({
      rot: this.spinTarget * p,
      cx: -this.maxCusps,
    });
    this.epiSets.forEach(this.EpiSet.update(p));
  }

  step(delta = this.stepSize) {
    if (this.runState === PAUSED) {
      this.stepper(() => delta);
      return;
    }
    if (this.runState === RUNNING) {
      this.log('Switching to PAUSED state');
      this.runState = PAUSED;
      return;
    }
    console.error('Already done!');
  }

  run() {
    if (this.runState === PAUSED) {
      this.runState = RUNNING;
      this.stepper(time => time - this.lastWindowTime);
      return;
    }
    if (this.runState === RUNNING) {
      console.error('Already running!');
      return;
    }
    console.error('Already done!');
  }

  pause() {
    if (this.runState === PAUSED) {
      console.error('Already paused!');
      return;
    }
    if (this.runState === RUNNING) {
      this.runState = PAUSED;
      return;
    }
    console.error('Already done!');
  }
}

Object.assign(EpiValentine, {
  SvgElement,
  SvgContext,
  EpiSetClass,
  PAUSED, RUNNING, DONE,
  stateNames,
});

return EpiValentine;

})));
