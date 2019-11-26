import Component from '@ember/component';
import md5 from 'blueimp-md5';
import request from 'ember-ajax/request';
import validator from 'validator';
import {computed} from '@ember/object';
import {htmlSafe} from '@ember/string';
import {inject as service} from '@ember/service';
import {task, timeout} from 'ember-concurrency';

const ANIMATION_TIMEOUT = 1000;

const stringToHslColor = function (str, saturation, lightness) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    var h = hash % 360;
    return 'hsl(' + h + ', ' + saturation + '%, ' + lightness + '%)';
};

export default Component.extend({
    config: service(),

    tagName: '',
    email: '',
    size: 180,
    debounce: 300,

    member: null,
    placeholderStyle: htmlSafe('background-image: url()'),
    avatarStyle: htmlSafe('display: none'),

    initialsClass: computed('sizeClass', function () {
        return this.sizeClass || 'gh-member-list-avatar';
    }),

    backgroundStyle: computed('member.{name,email}', function () {
        let name = this.member.name || this.member.email || 'NM';
        if (name) {
            let color = stringToHslColor(name, 55, 55);
            return htmlSafe(`background-color: ${color}`);
        }

        return htmlSafe('');
    }),

    initials: computed('member.{name,email}', function () {
        let name = this.member.name || this.member.email;
        if (name) {
            let names = name.split(' ');
            let intials = names.length > 1 ? [names[0][0], names[names.length - 1][0]] : [names[0][0]];
            return intials.join('').toUpperCase();
        }

        // New Member initials
        return 'NM';
    }),

    didReceiveAttrs() {
        this._super(...arguments);

        if (this.get('config.useGravatar')) {
            this.setGravatar.perform();
        }
    },

    setGravatar: task(function* () {
        yield timeout(this.debounce);

        let email = this.member.email;

        if (validator.isEmail(email || '')) {
            let size = this.size;
            let gravatarUrl = `//www.gravatar.com/avatar/${md5(email)}?s=${size}&d=404`;

            try {
                // HEAD request is needed otherwise jquery attempts to process
                // binary data as JSON and throws an error
                yield request(gravatarUrl, {type: 'HEAD'});
                // gravatar exists so switch style and let browser load it
                this._setAvatarImage(gravatarUrl);
                // wait for fade-in animation to finish before removing placeholder
                yield timeout(ANIMATION_TIMEOUT);
                this._setPlaceholderImage('');
            } catch (e) {
                // gravatar doesn't exist so make sure we're still showing the placeholder
                this._setPlaceholderImage(this._defaultImageUrl);
                // then make sure the avatar isn't visible
                this._setAvatarImage('');
            }
        }
    }).restartable(),

    _setPlaceholderImage(url) {
        this.set('placeholderStyle', htmlSafe(`background-image: url(${url});`));
    },

    _setAvatarImage(url) {
        let display = url ? 'block' : 'none';
        this.set('avatarStyle', htmlSafe(`background-image: url(${url}); display: ${display}`));
    }
});
