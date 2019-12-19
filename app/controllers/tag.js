import Controller from '@ember/controller';
import EmberObject from '@ember/object';
import boundOneWay from 'ghost-admin/utils/bound-one-way';
import {alias} from '@ember/object/computed';
import {computed, defineProperty} from '@ember/object';
import {inject as service} from '@ember/service';
import {slugify} from '@tryghost/string';
import {task} from 'ember-concurrency';

const SCRATCH_PROPS = ['name', 'slug', 'description', 'metaTitle', 'metaDescription'];

export default Controller.extend({
    notifications: service(),
    router: service(),

    showDeleteTagModal: false,

    tag: alias('model'),

    scratchTag: computed('tag', function () {
        let scratchTag = EmberObject.create({tag: this.tag});
        SCRATCH_PROPS.forEach(prop => defineProperty(scratchTag, prop, boundOneWay(`tag.${prop}`)));
        return scratchTag;
    }),

    actions: {
        setProperty(propKey, value) {
            this._saveTagProperty(propKey, value);
        },

        toggleDeleteTagModal() {
            this.toggleProperty('showDeleteTagModal');
        },

        deleteTag() {
            return this.tag.destroyRecord().then(() => {
                return this.transitionToRoute('tags');
            }, (error) => {
                return this.notifications.showAPIError(error, {key: 'tag.delete'});
            });
        },

        save() {
            return this.save.perform();
        },

        toggleUnsavedChangesModal(transition) {
            let leaveTransition = this.leaveScreenTransition;

            if (!transition && this.showUnsavedChangesModal) {
                this.set('leaveScreenTransition', null);
                this.set('showUnsavedChangesModal', false);
                return;
            }

            if (!leaveTransition || transition.targetName === leaveTransition.targetName) {
                this.set('leaveScreenTransition', transition);

                // if a save is running, wait for it to finish then transition
                if (this.save.isRunning) {
                    return this.save.last.then(() => {
                        transition.retry();
                    });
                }

                // we genuinely have unsaved data, show the modal
                this.set('showUnsavedChangesModal', true);
            }
        },

        leaveScreen() {
            this.tag.rollbackAttributes();
            return this.leaveScreenTransition.retry();
        }
    },

    save: task(function* () {
        let {tag, scratchTag} = this;

        // if Cmd+S is pressed before the field loses focus make sure we're
        // saving the intended property values
        let scratchProps = scratchTag.getProperties(SCRATCH_PROPS);
        tag.setProperties(scratchProps);

        try {
            yield tag.save();

            // replace 'new' route with 'tag' route
            this.replaceRoute('tag', tag);

            return tag;
        } catch (error) {
            if (error) {
                this.notifications.showAPIError(error, {key: 'tag.save'});
            }
        }
    }),

    fetchTag: task(function* (slug) {
        this.set('isLoading', true);

        yield this.store.queryRecord('tag', {slug}).then((tag) => {
            this.set('tag', tag);
            this.set('isLoading', false);
            return tag;
        });
    }),

    _saveTagProperty(propKey, newValue) {
        let tag = this.tag;
        let currentValue = tag.get(propKey);

        if (newValue) {
            newValue = newValue.trim();
        }

        // avoid modifying empty values and triggering inadvertant unsaved changes modals
        if (newValue !== false && !newValue && !currentValue) {
            return;
        }

        // Quit if there was no change
        if (newValue === currentValue) {
            return;
        }

        tag.set(propKey, newValue);

        // Generate slug based on name for new tag when empty
        if (propKey === 'name' && !tag.slug && tag.isNew) {
            let slugValue = slugify(newValue);
            if (/^#/.test(newValue)) {
                slugValue = 'hash-' + slugValue;
            }
            tag.set('slug', slugValue);
        }

        // TODO: This is required until .validate/.save mark fields as validated
        tag.get('hasValidated').addObject(propKey);
    }
});
