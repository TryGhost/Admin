import Controller, {inject as controller} from '@ember/controller';
import windowProxy from 'ghost-admin/utils/window-proxy';
import {alias} from '@ember/object/computed';
import {inject as service} from '@ember/service';

export default Controller.extend({
    tagsController: controller('tags'),
    notifications: service(),
    router: service(),

    showDeleteTagModal: false,

    tag: alias('model'),
    isMobile: alias('tagsController.isMobile'),

    actions: {
        setProperty(propKey, value) {
            this._saveTagProperty(propKey, value);
        },

        toggleDeleteTagModal() {
            this.toggleProperty('showDeleteTagModal');
        },

        deleteTag() {
            return this._deleteTag();
        }
    },

    _saveTagProperty(propKey, newValue) {
        let tag = this.tag;
        let isNewTag = tag.get('isNew');
        let currentValue = tag.get(propKey);

        if (newValue) {
            newValue = newValue.trim();
        }

        // Quit if there was no change
        if (newValue === currentValue) {
            return;
        }

        tag.set(propKey, newValue);
        // TODO: This is required until .validate/.save mark fields as validated
        tag.get('hasValidated').addObject(propKey);

        tag.save().then((savedTag) => {
            // replace 'new' route with 'tag' route
            this.replaceRoute('tags.tag', savedTag);

            // update the URL if the slug changed
            if (propKey === 'slug' && !isNewTag) {
                let currentPath = window.location.hash;

                let newPath = currentPath.split('/');
                newPath[newPath.length - 1] = savedTag.get('slug');
                newPath = newPath.join('/');

                windowProxy.replaceState({path: newPath}, '', newPath);
            }
        }).catch((error) => {
            if (error) {
                this.notifications.showAPIError(error, {key: 'tag.save'});
            }
        });
    },

    _deleteTag() {
        let tag = this.tag;

        return tag.destroyRecord().then(() => {
            this._deleteTagSuccess();
        }, (error) => {
            this._deleteTagFailure(error);
        });
    },

    _deleteTagSuccess() {
        let currentRoute = this.router.currentRouteName || '';

        if (currentRoute.match(/^tags/)) {
            this.transitionToRoute('tags.index');
        }
    },

    _deleteTagFailure(error) {
        this.notifications.showAPIError(error, {key: 'tag.delete'});
    }
});
