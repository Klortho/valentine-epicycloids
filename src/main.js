import {π, τ, centeredAngle, range} from './utils';
import EpiSetClass from './epi-set';
import SvgElement, {G, Rect, Svg} from './svg-element';
import SvgContext from './svg-context';

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

export default EpiValentine;

Object.assign(EpiValentine, {
  SvgElement,
  SvgContext,
  EpiSetClass,
  PAUSED, RUNNING, DONE,
  stateNames,
});
