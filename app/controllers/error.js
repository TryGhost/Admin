import Controller from '@ember/controller';
import {computed} from '@ember/object';
import {readOnly} from '@ember/object/computed';
import {inject as service} from '@ember/service';

export default Controller.extend({
    i18n: service(),

    stack: false,
    error: readOnly('model'),

    code: computed('error.status', function () {
        return this.get('error.status') > 200 ? this.get('error.status') : 500;
    }),

    message: computed('error.statusText', function () {
        if (this.get('code') === 404) {
            return this.get('i18n').t('Page not found');
        }

        return this.get('error.statusText') !== 'error' ? this.get('error.statusText') : this.get('i18n').t('Internal Server Error');
    })
});
