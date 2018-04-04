import spirit from 'spirit-product';

function styleElement(element, nextSibling) {
    let elemName = element.tagName.toLowerCase();
    let nextName = nextSibling && nextSibling.tagName.toLowerCase();
    let kgStyle = elemName;

    if (nextName) {
        if (/^h\d$/.test(nextName)) {
            nextName = 'h';
        } else if (nextName === 'div') {
            let card = nextSibling.querySelector('.__mobiledoc-card > div > div');
            if (card) {
                let cardElement = card.childNodes[0].tagName.toLowerCase();
                if (cardElement === 'figure' || cardElement === 'iframe') {
                    nextName = 'media';
                }
            }
        }

        kgStyle = `${elemName}-${nextName}`;
    }

    let classes = spirit.koenig(kgStyle);
    if (classes) {
        classes.split(' ').forEach((cls) => {
            element.classList.add(cls);
        });
    }
}

export default function kgStyleDom(dom) {
    for (let i = 0; i < dom.childNodes.length; i++) {
        styleElement(dom.childNodes[i], dom.childNodes[i + 1]);
    }
}
