import Component from '@ember/component';
import layout from '../templates/components/koenig-editor';
import {MOBILEDOC_VERSION} from 'mobiledoc-kit/renderers/mobiledoc';

// blank doc contains a single empty paragraph so that there's some content for
// the cursor to start in
export const BLANK_DOC = {
    version: MOBILEDOC_VERSION,
    markups: [],
    atoms: [],
    cards: [],
    sections: [
        [1, 'p', [
            [0, [], 0, '']
        ]]
    ]
};

export default Component.extend({
    layout,

    classNames: ['koenig-editor'],

    // public attrs
    mobiledoc: null,
    placeholder: '',
    autofocus: false,
    spellcheck: true,

    // internal properties

    // closure actions
    didCreateEditor() {},
    onChange() {},

    actions: {
        // actions
    }

    /* public methods ------------------------------------------------------- */

    /* internal methods ----------------------------------------------------- */
});
