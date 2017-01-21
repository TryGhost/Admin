import Mixin from 'ember-metal/mixin';
import computed from 'ember-computed';
import Changeset from 'ember-changeset';
import lookupValidator from 'ember-changeset-validations';
import RSVP from 'rsvp';

import {ValidationError} from 'ghost-admin/utils/validation-error';

export default Mixin.create({
    changeset: computed('model', 'validationMap', function () {
        let model = this.get('model');
        let validationMap = this.get('validationMap');

        return new Changeset(model, lookupValidator(validationMap), validationMap);
    }),

    validate() {
        let changeset = this.get('changeset');

        return changeset.validate().then(() => {
            if (changeset.get('isInvalid')) {
                return RSVP.reject(new ValidationError(changeset.get('errors')));
            }
        });
    }
});
