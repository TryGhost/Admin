// adapted from draggable.js Scrollable plugin (MIT)
// https://github.com/Shopify/draggable/blob/master/src/Draggable/Plugins/Scrollable/Scrollable.js

import {
    getDocumentScrollingElement,
    getParentScrollableElement
} from './utils';

export const defaultOptions = {
    speed: 6,
    sensitivity: 50
};

export default class ScrollHandler {
    constructor() {
        this.options = Object.assign({}, defaultOptions);

        this.currentMousePosition = null;
        this.findScrollableElementFrame = null;
        this.scrollableElement = null;
        this.scrollAnimationFrame = null;

        // bind `this` so methods can be passed to requestAnimationFrame
        this._scroll = this._scroll.bind(this);
    }

    dragStart(draggableInfo) {
        this.findScrollableElementFrame = requestAnimationFrame(() => {
            this.scrollableElement = getParentScrollableElement(draggableInfo.element);
        });
    }

    dragMove(draggableInfo) {
        this.findScrollableElementFrame = requestAnimationFrame(() => {
            this.scrollableElement = getParentScrollableElement(draggableInfo.target);
        });

        if (!this.scrollableElement) {
            return;
        }

        this.currentMousePosition = {
            clientX: draggableInfo.mousePosition.x,
            clientY: draggableInfo.mousePosition.y
        };

        this.scrollAnimationFrame = requestAnimationFrame(this._scroll);
    }

    dragStop() {
        cancelAnimationFrame(this.scrollAnimationFrame);
        cancelAnimationFrame(this.findScrollableElementFrame);

        this.currentMousePosition = null;
        this.findScrollableElementFrame = null;
        this.scrollableElement = null;
        this.scrollAnimationFrame = null;
    }

    _scroll() {
        if (!this.scrollableElement || !this.currentMousePosition) {
            return;
        }

        cancelAnimationFrame(this.scrollAnimationFrame);

        let {speed, sensitivity} = this.options;

        // TODO: this doesn't work in our case but examining scrollHeight should
        let rect = this.scrollableElement.getBoundingClientRect();
        let bottomCutOff = parseInt(rect.bottom) > window.innerHeight;
        let topCutOff = parseInt(rect.top) < 0;
        let cutOff = topCutOff || bottomCutOff;

        let documentScrollingElement = getDocumentScrollingElement();
        let scrollableElement = this.scrollableElement;
        let clientX = this.currentMousePosition.clientX;
        let clientY = this.currentMousePosition.clientY;

        if (scrollableElement !== document.body && scrollableElement !== document.documentElement && !cutOff) {
            let {offsetHeight, offsetWidth} = scrollableElement;

            if (rect.top + offsetHeight - clientY < sensitivity) {
                scrollableElement.scrollTop += speed;
            } else if (clientY - rect.top < sensitivity) {
                scrollableElement.scrollTop -= speed;
            }

            if (rect.left + offsetWidth - clientX < sensitivity) {
                scrollableElement.scrollLeft += speed;
            } else if (clientX - rect.left < sensitivity) {
                scrollableElement.scrollLeft -= speed;
            }
        } else {
            let {innerHeight, innerWidth} = window;

            if (clientY < sensitivity) {
                documentScrollingElement.scrollTop -= speed;
            } else if (innerHeight - clientY < sensitivity) {
                documentScrollingElement.scrollTop += speed;
            }

            if (clientX < sensitivity) {
                documentScrollingElement.scrollLeft -= speed;
            } else if (innerWidth - clientX < sensitivity) {
                documentScrollingElement.scrollLeft += speed;
            }
        }

        this.scrollAnimationFrame = requestAnimationFrame(this._scroll);
    }
}
