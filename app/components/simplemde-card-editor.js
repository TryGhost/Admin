/* global SimpleMDE */
import Ember from 'ember';

const {
    $,
    Component,
    RSVP: {Promise},
    run
} = Ember;

export default Component.extend({

    classNames: ['simplemde-card-editor'],

    _simplemde: null,

    _initSimpleMDE() {
        /* jscs:disable requireArrayDestructuring */
        let textarea = this.$('textarea')[0];
        /* jscs:enable requireArrayDestructuring */

        this._simplemde = new SimpleMDE({
            element: textarea
        });
        this._simplemde.value(this.get('payload.markdown'));
    },

    // TODO: can we move script/style loading into a parent class?
    // it could be possible to specify them as properties, eg:
    // scripts: ['//cdn.jsdelivr.net/simplemde/...', '...'],
    // styles: ['//cdn.jsdelivr.net/simplmde/...']
    _loadScript() {
        return new Promise((resolve, reject) => {
            if (typeof SimpleMDE === 'undefined') {
                $.ajax({
                    url: '//cdn.jsdelivr.net/simplemde/latest/simplemde.min.js',
                    dataType: 'script',
                    cache: true,
                    success: (response) => {
                        resolve(response);
                    },
                    error: (reason) => {
                        reject(reason);
                    }
                });
            } else {
                resolve();
            }
        });
    },

    _loadStyles() {
        if (!$('#simplemde-styles').length) {
            let $style = $('<link rel="stylesheet" />');
            $style.attr('href', '//cdn.jsdelivr.net/simplemde/latest/simplemde.min.css');
            $('head').append($style);
        }
    },

    didInsertElement() {
        this._super(...arguments);

        this._loadStyles();

        this._loadScript().then(() => {
            run.scheduleOnce('afterRender', this, function () {
                this._initSimpleMDE();
            });
        });
    },

    actions: {
        save() {
            let newPayload = this.get('payload');
            newPayload.markdown = this._simplemde.value();
            this.attrs.saveCard(newPayload);
        },

        cancel() {
            this.attrs.cancelCard();
        }
    }

});
