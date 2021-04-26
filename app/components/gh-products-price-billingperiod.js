import Component from '@glimmer/component';
import {inject as service} from '@ember/service';
import {action} from '@ember/object';

const PERIODS = [
    {label: 'Monthly', period: 'month'},
    {label: 'Yearly', period: 'year'}
];

export default class GhProductsPriceBillingPeriodComponent extends Component {
    @service feature;
    @service session;
    @service settings;

    constructor(owner, args) {
        super(...arguments);
        this.availablePeriods = PERIODS;
    }

    get value() {
        const {value} = this.args;
        return value;
    }
    get disabled() {
        const {disabled} = this.args;
        return false;
    }

    @action
    updatePeriod(newPeriod) {
        if (this.args.updatePeriod) {
            this.args.updatePeriod(this.args.value, newPeriod);
        }
    }
}
