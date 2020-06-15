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

    isFreeChecked: computed('settings.allowedPlans.[]', function () {
        const allowedPlans = this.settings.get('allowedPlans') || [];
        return allowedPlans.includes('free');
    }),

    isMonthlyChecked: computed('settings.allowedPlans.[]', function () {
        const allowedPlans = this.settings.get('allowedPlans') || [];
        return allowedPlans.includes('monthly');
    }),

    isYearlyChecked: computed('settings.allowedPlans.[]', function () {
        const allowedPlans = this.settings.get('allowedPlans') || [];
        return allowedPlans.includes('yearly');
    }),

    init() {
        this._super(...arguments);
    },

    actions: {
        toggleAllowedPlan(plan) {
            const allowedPlans = this.settings.get('allowedPlans') || [];
            if (allowedPlans.includes(plan)) {
                this.settings.set('allowedPlans', allowedPlans.filter(p => p !== plan));
            } else {
                allowedPlans.push(plan);
                this.settings.set('allowedPlans', [...allowedPlans]);
            }
        },
        toggleBeaconSetting(showBeacon) {
            this.settings.set('showBeacon', showBeacon);
        },

        toggleSignupName(showSignupName) {
            this.settings.set('showSignupName', showSignupName);
        },

        confirm() {
            return this.saveTask.perform();
        },

        isPlanSelected(plan) {
            const allowedPlans = this.settings.get('allowedPlans');
            return allowedPlans.includes(plan);
        }
    },

    saveTask: task(function* () {
        yield this.settings.save();
        this.closeModal();
    }).drop()
});
