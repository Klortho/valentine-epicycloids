import {unnest} from './utils';

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

export default SvgElement;


// Shortcut functions to create specific SVG elements
const [Circle, G, Path, Rect, Svg] = ['circle', 'g', 'path', 'rect', 'svg']
  .map(tag => (...args) => new SvgElement(tag, ...args));


export { Circle, G, Path, Rect, Svg };
