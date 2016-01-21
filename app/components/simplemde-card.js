/* global markdownit */
import Ember from 'ember';

const {
    $,
    Component,
    RSVP: {Promise},
    String: {htmlSafe},
    computed,
    run
} = Ember;

export default Component.extend({

    classNames: ['simplemde-card'],

    parserLoaded: false,

    renderedHTML: computed('payload.markdown', 'parserLoaded', function () {
        if (this.get('parserLoaded')) {
            let html = markdownit().render(this.get('payload.markdown'));
            return htmlSafe(html);
        }
    }),

    _loadScript() {
        return new Promise((resolve, reject) => {
            if (typeof markdownit === 'undefined') {
                $.ajax({
                    url: '//cdn.jsdelivr.net/markdown-it/5.1.0/markdown-it.min.js',
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

    didInsertElement() {
        this._super(...arguments);
        this._loadScript().then(() => {
            run.scheduleOnce('afterRender', this, function () {
                this.set('parserLoaded', true);
            });
        });
    },

    click() {
        this.attrs.editCard();
    }
});
