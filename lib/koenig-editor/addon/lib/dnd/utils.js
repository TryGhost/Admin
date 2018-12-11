export function getParent(element, value) {
    if (!element) {
        return null;
    }

    let selector = value;
    let callback = value;

    let isSelector = typeof value === 'string';
    let isFunction = typeof value === 'function';

    function matches(currentElement) {
        if (!currentElement) {
            return currentElement;
        } else if (isSelector) {
            return currentElement.matches(selector);
        } else if (isFunction) {
            return callback(currentElement);
        }
    }

    let current = element;

    do {
        if (matches(current)) {
            return current;
        }

        current = current.parentNode;
    } while (current && current !== document.body && current !== document);
}

export function applyUserSelect(element, value) {
    element.style.webkitUserSelect = value;
    element.style.mozUserSelect = value;
    element.style.msUserSelect = value;
    element.style.oUserSelect = value;
    element.style.userSelect = value;
}
