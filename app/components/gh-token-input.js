import Component from '@ember/component';
import {computed} from '@ember/object';
import {defaultMatcher} from 'ember-power-select/utils/group-utils';
import {isBlank} from '@ember/utils';
import {task} from 'ember-concurrency';

const BACKSPACE = 8;

export default Component.extend({

    // public attrs
    labelPath: 'name',
    matcher: defaultMatcher,
    options: null,
    searchField: 'name',
    selected: null,
    tagName: '',

    // closure actions
    onchange() {},
    oncreate() {},

    optionsWithoutSelected: computed('options.[]', 'selected.[]', function () {
        return this.get('optionsWithoutSelectedTask').perform();
    }),

    optionsWithoutSelectedTask: task(function* () {
        let options = yield this.get('options');
        let selected = yield this.get('selected');
        return options.filter((o) => !selected.includes(o));
    }),

    actions: {
        hideCreateOptionOnSameTerm(term) {
            let searchField = this.get('searchField');
            let existingOption = this.get('options').findBy(searchField, term);
            return !existingOption;
        },

        onchange(options) {
            this._update(options);
        },

        oncreate(term, select) {
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

    _update(options) {
        if (this.attrs.onChange) {
            this.onChange(options);
        } else {
            this.set('selected', options);
        }
    }

});
