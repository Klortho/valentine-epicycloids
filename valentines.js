// Parameters

const width = 600;
const height = 600;
const margin = 20;
const numSets = 15;
const drawDur = 10000;  // time to draw all the curves
const spinDur = (Math.random() + 0.7) * drawDur;
const rotateDur = drawDur / 4;

//---------------------------------------------------------------------
// Utility functions

// Fix the modulo operator (no negative return values)
const mod = m => n => {
  const v = n % m;
  return v >= 0 ? v : v + m;
};

// normalize an angle 0 <= a < 360
const deg = mod(360);

// An array of numbers from 0 .. n-1
const range = n => [...Array(n)].map((v, i) => i);

// Convert a number to a fixed-point (3-decimal digit) string
const toFixed3 = num => num.toFixed(3);

// Create a new SVG element
const svgElem = (tag, attrs, kids) => {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  setAttrs(el, attrs);
  const _kids = typeof kids === 'undefined' ? null :
                Array.isArray(kids) ? kids :
                [kids];
  if (_kids !== null) _kids.forEach(kid => el.appendChild(kid));
  return el;
};

// Set attributes of an element
const setAttrs = (elem, attrs) => {
  Object.keys(attrs).forEach(k => {
    elem.setAttribute(k, attrs[k]);
  });
};

// Shortcut functions to create specific SVG elements
const [circle, g, path, rect, svg] = ['circle', 'g', 'path', 'rect', 'svg']
  .map(tag => (attrs, kids) => svgElem(tag, attrs, kids));

//---------------------------------------------------------------------
// The EpiSet class encapsulates all the elements associated with one
// epicycloid

class EpiSet {
  constructor(drawing, rank) {
    this.rank = rank;
    this._t = 0;  // initial parameter value

    const hue = Math.floor(rank * 360 / numSets);
    const circleColor = `hsla(${hue}, 50%, 80%, 0.2)`;
    this.circle0 = circle({
      r: rank + 1,
      cx: -rank,
      cy: 0,
      stroke: circleColor,
    });
    this.circle1 = circle({
      r: 1,
      cx: 2,
      cy: 0,
      stroke: circleColor,
    });

    this.dot = circle({'class': 'dot', r: 0.1});

    this.curveStr = 'M ' + this.dotPosStr();
    this.curve = path({
      d: this.curveStr,
      fill: 'none',
      stroke: `hsl(${hue}, 100%, 50%)`,
    });

    this.g = g(
      { transform: `translate(${0}, ${0}) rotate(${0})` },
      [ this.circle0,
        this.circle1,
        this.dot,
        this.curve, ]
    );
    drawing.appendChild(this.g);
  }

  dotPos() {
    const rank = this.rank,
          r2 = rank + 2,
          t = this._t;
    return [
      r2 * Math.cos(t) - Math.cos(r2 * t) - rank,
      r2 * Math.sin(t) - Math.sin(r2 * t)
    ];
  }

  dotPosStr() {
    return this.dotPos().map(toFixed3).join(' ');
  }

  update(t) {
    this._t = t;
    const r2 = this.rank + 2;
    setAttrs(this.circle1, {
      cx: r2 * Math.cos(t) - this.rank,
      cy: r2 * Math.sin(t),
    });

    const pos = this.dotPos();
    setAttrs(this.dot, {cx: pos[0], cy: pos[1]});
    this.curveStr += ' L ' + this.dotPosStr();
    this.curve.setAttribute('d', this.curveStr);
  }
}

//---------------------------------------------------------------------
// Draw

const effWidth = width - margin;     // effective width
const effHeight = height - margin;
const newWidth = 2 * numSets + 4;
const scale = effWidth / newWidth;
const sMargin = margin / scale;

const drawing = g({ transform: `rotate(0)` });
document.body.appendChild(
  svg({width: width, height: height},
    g({transform: `scale(${scale} ${-scale}) ` +
        `translate(${2 * numSets + 1 + sMargin}, ${-newWidth / 2 - sMargin}) ` +
        `rotate(90 ${1 - numSets} 0)`},
      drawing)));

const epiSets = range(numSets).map(rank => new EpiSet(drawing, rank));

//---------------------------------------------------------------------
// Animate

const finalAngle = deg(-360 * spinDur / drawDur * (numSets - 1) + 180) - 180;

const step = (_startTime, _lastPhase) => thisTime => {
  const startTime = typeof _startTime !== 'undefined' ? _startTime : thisTime;
  const lastPhase = typeof _lastPhase !== 'undefined' ? _lastPhase : 'none';
  const elapsed = thisTime - startTime;

  const phase =
    (lastPhase === 'none' || elapsed < startTime + drawDur) ? 'draw' :
    (lastPhase === 'draw' || elapsed < startTime + drawDur + spinDur) ? 'spin' :
    'done';

  if (phase === 'draw') {
    const t = elapsed;
    const a = 2 * Math.PI * t / drawDur;
    epiSets.forEach(s => s.update(a));
  }

  else if (phase === 'spin') {
    if (lastPhase === 'draw') {
      epiSets.forEach(s => {
        s.circle1.remove();
        s.dot.remove();
      });
    }
    const t = elapsed - drawDur;
    spinner(t / spinDur);
  }

  else {
    spinner(1);
    epiSets.forEach(s => s.circle0.remove());
  }

  if (phase !== 'done') window.requestAnimationFrame(step(startTime, phase));
};

function spinner(anim) {
  const animS = anim * spinDur / drawDur;
  const aRad = 2 * Math.PI * animS;
  const aDeg = 360 * animS;

  epiSets.forEach(s => {
    const rank = s.rank;
    const C = numSets - rank - 1;
    const rot = -aDeg * (numSets / (rank + 1) - 1);
    s.g.setAttribute('transform',
      `translate(${C * Math.cos(aRad) - C} ${C * Math.sin(aRad)}) ` +
      `rotate(${rot} ${-rank} 0)`);
    s.circle0.setAttribute('opacity', 1 - anim);
  });

  drawing.setAttribute('transform',
    `rotate(${-finalAngle * anim} ${-numSets + 1} 0)`);
  epiSets[0].curve.setAttribute('fill', `hsla(0, 100%, 50%, ${anim})`);

  document.getElementById('header').style.opacity = anim;
}

window.setTimeout(() => window.requestAnimationFrame(step()), 5000);
