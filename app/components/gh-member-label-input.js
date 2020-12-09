import Component from '@glimmer/component';
import {action} from '@ember/object';
import {inject as service} from '@ember/service';
import {tracked} from '@glimmer/tracking';

export default class GhMemberLabelInput extends Component {
    @service
    store;

    @tracked
    selectedLabels = [];

    get availableLabels() {
        return this._availableLabels.toArray().sort((labelA, labelB) => {
            return labelA.name.localeCompare(labelB.name, undefined, {ignorePunctuation: true});
        });
    }

    constructor(...args) {
        super(...args);
        // perform a background query to fetch all users and set `availableLabels`
        // to a live-query that will be immediately populated with what's in the
        // store and be updated when the above query returns
        this.store.query('label', {limit: 'all'});
        this._availableLabels = this.store.peekAll('label');
        this.selectedLabels = this.args.labels || [];
    }

    get availableLabelNames() {
        return this.availableLabels.map(label => label.name.toLowerCase());
    }

    willDestroy() {
        this._availableLabels.forEach((label) => {
            if (label.get('isNew')) {
                this.store.deleteRecord(label);
            }
        });
    }

    @action
    hideCreateOptionOnMatchingLabel(term) {
        return !this.availableLabelNames.includes(term.toLowerCase());
    }

    @action
    updateLabels(newLabels) {
        let currentLabels = this.selectedLabels;

        // destroy new+unsaved labels that are no longer selected
        currentLabels.forEach(function (label) {
            if (!newLabels.includes(label) && label.get('isNew')) {
                label.destroyRecord();
            }
        });

        // update labels
        this.selectedLabels = newLabels;
        this.args.onChange(newLabels);
    }

    @action
    createLabel(labelName) {
        let currentLabels = this.selectedLabels;
        let currentLabelNames = currentLabels.map(label => label.get('name').toLowerCase());
        let labelToAdd;

        labelName = labelName.trim();

        // abort if label is already selected
        if (currentLabelNames.includes(labelName.toLowerCase())) {
            return;
        }

        // find existing label if there is one
        labelToAdd = this._findLabelByName(labelName);

        // create new label if no match
        if (!labelToAdd) {
            labelToAdd = this.store.createRecord('label', {
                name: labelName
            });
        }

        // push label onto member relationship
        currentLabels.pushObject(labelToAdd);
        this.args.onChange(currentLabels);
    }

    _findLabelByName(name) {
        let withMatchingName = function (label) {
            return label.name.toLowerCase() === name.toLowerCase();
        };
        return this.availableLabels.find(withMatchingName);
    }
}
