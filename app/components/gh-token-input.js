/* global key */
import Component from '@ember/component';
import Ember from 'ember';
import fallbackIfUndefined from '../utils/computed-fallback-if-undefined';
import {A, isArray} from '@ember/array';
import {action, computed, get} from '@ember/object';
import {
    advanceSelectableOption,
    defaultMatcher,
    filterOptions
} from 'ember-power-select/utils/group-utils';
import {htmlSafe} from '@ember/string';
import {isBlank} from '@ember/utils';
import {tagName} from '@ember-decorators/component';
import {task} from 'ember-concurrency';

const {Handlebars} = Ember;

const BACKSPACE = 8;
const TAB = 9;

@tagName('')
class GhTokenInput extends Component {
    // public attrs
    @fallbackIfUndefined(true) allowCreation
    @fallbackIfUndefined(false) closeOnSelect
    @fallbackIfUndefined('name') labelField
    @fallbackIfUndefined(defaultMatcher) matcher
    @fallbackIfUndefined('name') searchField
    @fallbackIfUndefined('gh-token-input/trigger') triggerComponent
    @fallbackIfUndefined('power-select-vertical-collection-options') optionsComponent

    @computed('options.[]', 'selected.[]')
    get optionsWithoutSelected() {
        return this.optionsWithoutSelectedTask.perform();
    }

    // actions -----------------------------------------------------------------

    @action
    handleKeydown(select, event) {
        // On backspace with empty text, remove the last token but deviate
        // from default behaviour by not updating search to match last token
        if (event.keyCode === BACKSPACE && isBlank(event.target.value)) {
            let lastSelection = select.selected[select.selected.length - 1];

            if (lastSelection) {
                this.onChange(select.selected.slice(0, -1), select);
                select.actions.search('');
                select.actions.open(event);
            }

            // prevent default
            return false;
        }

        // Tab should work the same as Enter if there's a highlighted option
        if (event.keyCode === TAB && !isBlank(event.target.value) && select.highlighted) {
            if (!select.selected || select.selected.indexOf(select.highlighted) === -1) {
                select.actions.choose(select.highlighted, event);
                event.preventDefault(); // keep focus in search
                return false;
            }
        }

        // fallback to default
        return true;
    }

    @action
    handleFocus() {
        key.setScope('gh-token-input');

        if (this.onFocus) {
            this.onFocus(...arguments);
        }
    }

    @action
    handleBlur() {
        key.setScope('default');

        if (this.onBlur) {
            this.onBlur(...arguments);
        }
    }

    @action
    searchAndSuggest(term, select) {
        return this.searchAndSuggestTask.perform(term, select);
    }

    @action
    selectOrCreate(selection, select, keyboardEvent) {
        // allow tokens to be created with spaces
        if (keyboardEvent && keyboardEvent.code === 'Space') {
            select.actions.search(`${select.searchText} `);
            return;
        }

        // guard against return being pressed when nothing is selected
        if (!isArray(selection)) {
            return;
        }

        let suggestion = selection.find(option => option.__isSuggestion__);

        if (suggestion) {
            this.onCreate(suggestion.__value__, select);
        } else {
            this.onChange(selection, select);
        }

        // clear select search
        select.actions.search('');
    }

    // tasks -------------------------------------------------------------------

    @task(function* () {
        let options = yield this.options;
        let selected = yield this.selected;
        return options.filter(o => !selected.includes(o));
    })
    optionsWithoutSelectedTask;

    @task(function* (term, select) {
        let newOptions = (yield this.optionsWithoutSelected).toArray();

        if (term.length === 0) {
            return newOptions;
        }

        let searchAction = this.search;
        if (searchAction) {
            let results = yield searchAction(term, select);

            if (results.toArray) {
                results = results.toArray();
            }

            this._addCreateOption(term, results);
            return results;
        }

        newOptions = this._filter(A(newOptions), term);
        this._addCreateOption(term, newOptions);

        return newOptions;
    })
    searchAndSuggestTask;

    // internal ----------------------------------------------------------------

    // always select the first item in the list that isn't the "Add x" option
    defaultHighlighted(select) {
        let {results} = select;
        let option = advanceSelectableOption(results, undefined, 1);

        if (results.length > 1 && option.__isSuggestion__) {
            option = advanceSelectableOption(results, option, 1);
        }

        return option;
    }

    // private -----------------------------------------------------------------

    _addCreateOption(term, options) {
        if (this._shouldShowCreateOption(term, options)) {
            options.unshift(this._buildSuggestionForTerm(term));
        }
    }

    _shouldShowCreateOption(term, options) {
        if (!this.allowCreation) {
            return false;
        }

        if (this.showCreateWhen) {
            return this.showCreateWhen(term, options);
        } else {
            return this._hideCreateOptionOnSameTerm(term, options);
        }
    }

    _buildSuggestionForTerm(term) {
        return {
            __isSuggestion__: true,
            __value__: term,
            text: this._buildSuggestionLabel(term)
        };
    }

    _hideCreateOptionOnSameTerm(term, options) {
        let searchField = this.searchField;
        let existingOption = options.findBy(searchField, term);
        return !existingOption;
    }

    _filter(options, searchText) {
        let matcher;
        if (this.searchField) {
            matcher = (option, text) => this.matcher(get(option, this.searchField), text);
        } else {
            matcher = (option, text) => this.matcher(option, text);
        }
        return filterOptions(options || [], searchText, matcher);
    }

    _buildSuggestionLabel(term) {
        if (this.buildSuggestion) {
            return this.buildSuggestion(term);
        }
        return htmlSafe(`Add <strong>"${Handlebars.Utils.escapeExpression(term)}"...</strong>`);
    }
}

export default GhTokenInput;
