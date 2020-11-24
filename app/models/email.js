import Model, {attr, belongsTo} from '@ember-data/model';
import {computed} from '@ember/object';
import {equal} from '@ember/object/computed';

export default Model.extend({
    error: attr('string'),
    html: attr('string'),
    plaintext: attr('string'),
    stats: attr('json-string'),
    status: attr('string'),
    subject: attr('string'),
    submittedAtUTC: attr('moment-utc'),
    uuid: attr('string'),
    recipientFilter: attr('string'),

    emailCount: attr('number'),
    deliveredCount: attr('number'),
    openedCount: attr('number'),
    failedCount: attr('number'),

    trackOpens: attr('boolean'),

    createdAtUTC: attr('moment-utc'),
    createdBy: attr('string'),
    updatedAtUTC: attr('moment-utc'),
    updatedBy: attr('string'),

    post: belongsTo('post'),

    isSuccess: equal('status', 'submitted'),
    isFailure: equal('status', 'failed'),

    openRate: computed('deliveredCount', 'openedCount', function () {
        let {deliveredCount, openedCount} = this;
        return openedCount / deliveredCount * 100;
    }),

    retry() {
        return this.store.adapterFor('email').retry(this);
    }
});
