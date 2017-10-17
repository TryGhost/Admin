import Component from '@ember/component';
import {computed} from '@ember/object';
import {isBlank} from '@ember/utils';
import {task} from 'ember-concurrency';

const BACKSPACE = 8;

export default Component.extend({

    // public attrs
    availableTokens: null,
    labelPath: 'name',
    renderInPlace: false,
    searchField: 'name',
    selectedTokens: null,
    tagName: '',

    // closure actions
    onChange() {},
    onCreate() {},

    tokensWithoutSelected: computed('availableTokens.[]', 'selectedTokens.[]', function () {
        return this.get('tokensWithoutSelectedTask').perform();
    }),

    tokensWithoutSelectedTask: task(function* () {
        let tokens = yield this.get('availableTokens');
        let selected = yield this.get('selectedTokens');
        return tokens.filter((t) => !selected.includes(t));
    }),

    actions: {
        onChange(tokens) {
            this._update(tokens);
        },

        onCreate(term, select) {
            if (this.attrs.onCreate) {
                this.onCreate(term, select);

                // clear select search
                select.actions.search('');
            }
        },

        handleKeydown(select, event) {
            // On backspace with empty text, remove the last token but deviate
            // from default behaviour by not updating search to match last token
            if (event.keyCode === BACKSPACE && isBlank(event.target.value)) {
                let lastSelection = select.selected[select.selected.length - 1];

                if (lastSelection) {
                    this._update(select.selected.slice(0, -1));
                    select.actions.search('');
                    select.actions.open(event);
                }

                // prevent default
                return false;
            }

            // fallback to default
            return true;
        }
    },

    // methods

    _update(tokens) {
        if (this.attrs.onChange) {
            this.onChange(tokens);
        } else {
            this.set('selectedTokens', tokens);
        }
    }

});
