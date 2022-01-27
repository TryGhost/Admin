import ModalComponent from 'ghost-admin/components/modal-base';
import classic from 'ember-classic-decorator';
import {action} from '@ember/object';

@classic
export default class ModalMarkdownHelp extends ModalComponent {
    // noop - we don't want the enter key doing anything
    @action
    confirm() {}
}
