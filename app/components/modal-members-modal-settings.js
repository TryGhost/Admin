import ModalComponent from 'ghost-admin/components/modal-base';
import {computed} from '@ember/object';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';

export default ModalComponent.extend({
    customViews: service(),
    router: service(),
    settings: service(),

    confirm() {},
    close() {},

    isFreeChecked: computed('settings.membersjsAllowedPlans.[]', function () {
        const allowedPlans = this.settings.get('membersjsAllowedPlans') || [];
        return allowedPlans.includes('free');
    }),

    isMonthlyChecked: computed('settings.membersjsAllowedPlans.[]', function () {
        const allowedPlans = this.settings.get('membersjsAllowedPlans') || [];
        return allowedPlans.includes('monthly');
    }),

    isYearlyChecked: computed('settings.membersjsAllowedPlans.[]', function () {
        const allowedPlans = this.settings.get('membersjsAllowedPlans') || [];
        return allowedPlans.includes('yearly');
    }),

    init() {
        this._super(...arguments);
    },

    actions: {
        toggleAllowedPlan(plan) {
            const allowedPlans = this.settings.get('membersjsAllowedPlans') || [];
            if (allowedPlans.includes(plan)) {
                this.settings.set('membersjsAllowedPlans', allowedPlans.filter(p => p !== plan));
            } else {
                allowedPlans.push(plan);
                this.settings.set('membersjsAllowedPlans', [...allowedPlans]);
            }
        },
        toggleBeaconSetting(showBeacon) {
            this.settings.set('membersjsShowBeacon', showBeacon);
        },

        toggleSignupName(showSignupName) {
            this.settings.set('membersjsShowSignupName', showSignupName);
        },

        confirm() {
            return this.saveTask.perform();
        },

        isPlanSelected(plan) {
            const allowedPlans = this.settings.get('membersjsAllowedPlans');
            return allowedPlans.includes(plan);
        }
    },

    saveTask: task(function* () {
        yield this.settings.save();
        this.closeModal();
    }).drop()
});
