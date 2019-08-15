import ModalComponent from 'ghost-admin/components/modal-base';
import {computed} from '@ember/object';
import {inject as service} from '@ember/service';

export default ModalComponent.extend({
    whatsNew: service(),

    confirm() {},

    changelogEntry: computed('whatsNew.hasNewMajor', function () {
        return this.whatsNew.hasNewMajor ? this.whatsNew.changelogMajorLatest : this.whatsNew.latest;
    })
});
