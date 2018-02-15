// Parameters

const width = 600;
const height = 600;
const margin = 20;
const numSets = 15;

const curveDur = 10000;  // time it takes to draw all the curves
const spinDur = (Math.random() + 0.7) * curveDur;

// `true` means curve and spin phases are combined.
const combinePhases = false;

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
    this.hue = Math.floor(rank * 360 / numSets);

    const circleColor = `hsl(${this.hue}, 50%, 80%)`;
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

    this.dot = circle({'class': 'dot', r: 0.1});

    this.curveStr = 'M ' + this.dotPosStr(0);
    this.curve = path({
      d: this.curveStr,
      fill: 'none',
      stroke: this.curveColor(),
    });

    this.g = g(
      { transform: `translate(${0}, ${0}) rotate(${0})` },
      [ ...this.circles,
        this.dot,
        this.curve, ]
    );
    drawing.appendChild(this.g);
  }
  curveColor() {
    return `hsl(${this.hue}, 100%, 50%)`;
  }

  dotPos(angle) {
    const rank = this.rank,
          r2 = rank + 2;
    return [
      r2 * Math.cos(angle) - Math.cos(r2 * angle) - rank,
      r2 * Math.sin(angle) - Math.sin(r2 * angle)
    ];
  }

  dotPosStr(angle) {
    return this.dotPos(angle).map(toFixed3).join(' ');
  }

  // p is the animation parameter, 0 <= p <= 1
  update(p) {
    const angle = 2 * Math.PI * p;
    const r2 = this.rank + 2;
    setAttrs(this.circles[1], {
      cx: r2 * Math.cos(angle) - this.rank,
      cy: r2 * Math.sin(angle),
    });

    // the rolling circle fades away
    this.circles[1].setAttribute('opacity', 1 - p);

    const pos = this.dotPos(angle);
    setAttrs(this.dot, {cx: pos[0], cy: pos[1]});
    this.curveStr += ' L ' + this.dotPosStr(angle);
    this.curve.setAttribute('d', this.curveStr);
  }
}

EpiSet.update = p => epiSet => epiSet.update(p);

//---------------------------------------------------------------------
// Draw

const header = document.getElementById('header');
const effWidth = width - margin;
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

const finalAngle = deg(-360 * spinDur / curveDur * (numSets - 1) + 180) - 180;

const firstStep = _startTime => {
  const step = (lastPhase, startTime) => thisTime => {
    const elapsed = thisTime - startTime;

    const phase =
      (lastPhase === 'none' || elapsed < startTime + curveDur) ? 'curve' :
      ( !combinePhases &&
        (lastPhase === 'curve' || elapsed < startTime + curveDur + spinDur)
      ) ? 'spin' :
      'done';

    if (phase === 'curve') {
      const p = Math.max(0, Math.min(1, elapsed/curveDur));
      curver(p);
      if (combinePhases) spinner(p);
    }

    else if (!combinePhases && phase === 'spin') {
      if (lastPhase === 'curve') {
        curver(1);
        epiSets.forEach(s => {
          s.circles[1].remove();
          s.dot.remove();
        });
      }
      const p = Math.max(0, Math.min(1, (elapsed - curveDur) / spinDur));
      spinner(p);
    }

    else {
      spinner(1);
      epiSets.forEach(s => s.circle0.remove());
    }

    if (phase !== 'done') window.requestAnimationFrame(step(phase, startTime));
  };

  step('none', _startTime)(_startTime);
};


// 0 <= p < 1
function curver(p) {
  epiSets.forEach(EpiSet.update(p));
}

function spinner(p) {
  const animS = p * spinDur / curveDur;
  const aRad = 2 * Math.PI * animS;
  const aDeg = 360 * animS;

  epiSets.forEach(s => {
    const rank = s.rank;
    const C = numSets - rank - 1;
    const rot = -aDeg * (numSets / (rank + 1) - 1);
    s.g.setAttribute('transform',
      `translate(${C * Math.cos(aRad) - C} ${C * Math.sin(aRad)}) ` +
      `rotate(${rot} ${-rank} 0)`);
    s.circles[0].setAttribute('opacity', 1 - p);
  });

  drawing.setAttribute('transform',
    `rotate(${-finalAngle * p} ${-numSets + 1} 0)`);
  epiSets[0].curve.setAttribute('fill', `hsla(0, 100%, 50%, ${p})`);
  header.style.opacity = p;
}

window.requestAnimationFrame(firstStep);
