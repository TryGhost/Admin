import Component from '@ember/component';
import {computed} from '@ember/object';
import {inject as service} from '@ember/service';

export default Component.extend({

    intl: service(),
    settings: service(),
    feature: service(),

    // public attrs
    post: null,

    selectedVisibility: computed('post.visibility', function () {
        return this.get('post.visibility') || this.settings.get('defaultContentVisibility');
    }),

    init() {
        this._super(...arguments);
        this.availableVisibilities = [
            {label: this.intl.t('Manual.Settings.Public'), name: 'public'},
            {label: this.intl.t('Manual.Settings.Members_only'), name: 'members'},
            {label: this.intl.t('Manual.Settings.Paid-members_only'), name: 'paid'}
        ];
        if (this.feature.get('multipleProducts')) {
            this.availableVisibilities.push(
                {label: this.intl.t('Manual.Others.Specific_tier_s'), name: 'filter'}
            );
        }
    },

    actions: {
        updateVisibility(newVisibility) {
            this.post.set('visibility', newVisibility);
            if (newVisibility !== 'filter') {
                this.post.set('visibilityFilter', null);
            }
        }
    }
});
