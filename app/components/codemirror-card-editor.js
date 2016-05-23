/* global CodeMirror */
import Ember from 'ember';

const {
    $,
    Component,
    RSVP,
    inject: {service},
    run
} = Ember;

export default Component.extend({

    classNames: ['codemirror-card-editor'],

    cdn: '//cdnjs.cloudflare.com/ajax/libs/codemirror/5.13.2',
    modeUrl: '/mode/%N/%N.min.js',

    scripts: {
        'CodeMirror': '/codemirror.min.js',
        'CodeMirror.modeInfo': '/mode/meta.min.js',
        'CodeMirror.requireMode': '/addon/mode/loadmode.min.js'
    },

    ajax: service(),

    _loadScripts() {
        let scripts = this.get('scripts');
        let promises = [];

        Object.keys(scripts).forEach((key) => {
            let url = scripts[key];
            let [object, method] = key.split('.', 1);

            if (!method && typeof window[object] === 'undefined') {
                promises.pushObject(this._loadScript(url));
            } else if (!window[object] || window[object] && typeof window[object][method] === 'undefined') {
                promises.pushObject(this._loadScript(url));
            }
        });

        return RSVP.all(promises);
    },

    _loadScript(url) {
        let ajax = this.get('ajax');
        let cdn = this.get('cdn');

        return ajax.request(`${cdn}${url}`, {
            dataType: 'script',
            cache: true
        });
    },

    _loadStyles() {
        if (!$('#codemirror-styles').length) {
            let $style = $('<link rel="stylesheet" id="codemirror-styles" />');
            $style.attr('href', `${this.cdn}/codemirror.min.css`);
            $('head').append($style);
        }
    },

    _initCodeMirror() {
        // TODO: fill me in
    },

    didInsertElement() {
        this._super(...arguments);

        this._loadStyles();

        this._loadScripts().then(() => {
            run.scheduleOnce('afterRender', this, function () {
                this._initCodeMirror();
            });
        });

        run.scheduleOnce('afterRender', this, function () {
            this.$().closest('.__mobiledoc-card').addClass('__mobiledoc-card--edit');
            // this needs to be done here rather than willDestroyElement because
            // the element is removed/re-used before the class changes take effect
            this.$().closest('.__mobiledoc-card').removeClass('__mobiledoc-card--preview');
        });
    },

    actions: {
        save() {
            let newPayload = this.get('payload');
            newPayload.code = this._codemirror.value();
            this.attrs.saveCard(newPayload);
        },

        cancel() {
            this.attrs.cancelCard();
        }
    }

});
