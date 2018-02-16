// Parameters

const width = 600;
const height = 600;
const margin = 20;
const numSets = 25;
const duration = 20000;
const π = Math.PI;
const τ = 2 * π;
const finalAngle = τ * (Math.random() + 0.7);

//---------------------------------------------------------------------
// Utility functions

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
    this.drawing = drawing;
    this.rank = rank;
    this.hue = Math.floor(rank * 360 / numSets);
  }

  static create(drawing) {
    return rank => new EpiSet(drawing, rank);
  }

  initialize() {
    const {drawing, rank, hue} = this;

    const circleColor = `hsl(${hue}, 50%, 80%)`;
    this.circles = [
      // the circle about which the smaller one rolls
      circle({
        r: rank + 1,
        cx: -rank,
        cy: 0,
        stroke: circleColor,
      }),
      // the rolling circle
      circle({
        r: 1,
        cx: 2,
        cy: 0,
        stroke: circleColor,
      }),
    ];

    this.dot = circle({
      'class': 'dot',
      r: 0.1,
      cx: 1,
      cy: 0,
    });

    this.curveStr = 'M ' + this.dotPosStr(0);
    this.curve = path({
      d: this.curveStr,
      fill: 'none',
      stroke: `hsl(${hue}, 100%, 50%)`,
    });

    this.g = g(
      { transform: `translate(${0}, ${0}) rotate(${0})` },
      [ ...this.circles,
        this.dot,
        this.curve, ]
    );
    drawing.appendChild(this.g);
  }

  addCurvePoint(angle) {
    this.curveStr += ' L ' + this.dotPosStr(angle);
    this.curve.setAttribute('d', this.curveStr);
  }

  dotPos(angle) {
    const rp2 = this.rank + 2;
    return [
      rp2 * Math.cos(angle) - Math.cos(rp2 * angle) - this.rank,
      rp2 * Math.sin(angle) - Math.sin(rp2 * angle)
    ];
  }

  dotPosStr(angle) {
    return this.dotPos(angle).map(fixed3).join(' ');
  }

  // p is the animation parameter, 0 <= p <= 1
  update(p) {
    if (p === 0) this.initialize();
    else {
      const {rank, hue, circles, dot, curve, g} = this;

      const curveAngle = τ * p;
      const r2 = rank + 2;
      setAttrs(circles[1], {
        cx: r2 * Math.cos(curveAngle) - rank,
        cy: r2 * Math.sin(curveAngle),
      });

      const pos = this.dotPos(curveAngle);
      setAttrs(dot, {cx: pos[0], cy: pos[1]});

      this.addCurvePoint(curveAngle);
      curve.setAttribute('fill', `hsla(${hue}, 100%, 50%, ${p * ((numSets - rank) / numSets)})`);


      const spinAngle = p * finalAngle;
      const C = numSets - rank - 1;
      const rot = -degrees(spinAngle) * (numSets / (rank + 1) - 1);
      if (p === 1 && rank === 0) console.log('final rot: ' + rot);
      g.setAttribute('transform',
        `translate(${C * Math.cos(spinAngle) - C} ${C * Math.sin(spinAngle)}) ` +
        `rotate(${rot} ${-rank} 0)`);
      circles[0].setAttribute('opacity', 1 - p);
      circles[1].setAttribute('opacity', 1 - p);
    }
  }

  static update(p) {
    return instance => instance.update(p);
  }
}


//---------------------------------------------------------------------
// Draw

const header = document.getElementById('header');
const effWidth = width - 2 * margin;
const effHeight = height - 2 * margin;
const newWidth = 2 * numSets + 4;
const scale = effWidth / newWidth;
const sMargin = margin / scale;

window.requestAnimationFrame(startTime => {
  const drawing = g({ transform: `rotate(0)` });
  document.body.appendChild(
    svg({width: width, height: height},
      g({transform: `scale(${scale} ${-scale}) ` +
          `translate(${2 * numSets + 1 + sMargin}, ${-newWidth / 2 - sMargin}) ` +
          `rotate(90 ${1 - numSets} 0)`},
        drawing)));

  const epiSets = range(numSets).reverse().map(EpiSet.create(drawing));
  epiSets.forEach(EpiSet.update(0));

  const spinTarget = degrees(centeredAngle(finalAngle * (numSets - 1)));

  const step = () => {
    window.requestAnimationFrame(thisTime => {
      const p = Math.min(1, (thisTime - startTime) / duration);
      epiSets.forEach(EpiSet.update(p));

      drawing.setAttribute('transform',
        `rotate(${spinTarget * p} ${-numSets + 1} 0)`);
      header.style.opacity = p;

      if (p === 1) {
        epiSets.forEach(s => s.dot.remove());
      }
      else step();
    });
  };
  step();
});
