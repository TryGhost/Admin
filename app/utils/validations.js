import Mixin from 'ember-metal/mixin';
import {assert} from 'ember-metal/utils';

import Changeset from 'ghost-admin/changeset';
import Validations from 'ghost-admin/validations';

export default function validations(type) {
    let validations = Validations[type];

    assert(`The validations for \'${type}\' are not defined!`, validations);

    return Mixin.create({
        changeset: null,

        init() {
            this.set('changeset', new Changeset(this, validations));

            return this._super(...arguments);
        }
    });
}
