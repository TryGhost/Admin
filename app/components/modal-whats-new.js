import ModalComponent from 'ghost-admin/components/modal-base';
import classic from 'ember-classic-decorator';
import {action} from '@ember/object';
import {inject as service} from '@ember/service';

@classic
export default class ModalWhatsNew extends ModalComponent {
    @service
    whatsNew;

    confirm() {}

    // noop - enter key shouldn't do anything
    @action
    confirm() {}
}
