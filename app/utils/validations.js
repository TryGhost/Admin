import Mixin from 'ember-metal/mixin';
import {assert} from 'ember-metal/utils';

import Changeset from 'ghost-admin/changeset';

const ValidationMap = {};

export default function validations(type) {
    let validations = ValidationMap[type];

    assert(`The validations for \'${type}\' are not defined!`, validations);

    return Mixin.create({
        changeset: null,

        init() {
            this.set('changeset', new Changeset(this, validations));
        }
    });
}
