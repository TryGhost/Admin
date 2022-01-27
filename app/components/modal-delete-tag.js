import ModalComponent from 'ghost-admin/components/modal-base';
import classic from 'ember-classic-decorator';
import {action, computed} from '@ember/object';
import {alias} from '@ember/object/computed';
import {task} from 'ember-concurrency';

@classic
export default class ModalDeleteTag extends ModalComponent {
    // Allowed actions
    confirm = () => {};

    @alias('model')
    tag;

    @computed('tag.count.posts')
    get postInflection() {
        return this.get('tag.count.posts') > 1 ? 'posts' : 'post';
    }

    @action
    confirm() {
        this.deleteTag.perform();
    }

    @(task(function* () {
        try {
            yield this.confirm();
        } finally {
            this.send('closeModal');
        }
    }).drop())
    deleteTag;
}
