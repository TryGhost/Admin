import Component from '@glimmer/component';
import config from 'ghost-admin/config/environment';
import {formatPostTime} from 'ghost-admin/helpers/gh-format-post-time';
import {get} from '@ember/object';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency-decorators';
import {timeout} from 'ember-concurrency';
import {tracked} from '@glimmer/tracking';

export default class GhEditorPostStatusComponent extends Component {
    @service clock;
    @service settings;

    @tracked _isSaving = false;

    // this.args.isSaving will only be true briefly whilst the post is saving,
    // we want to ensure that the "Saving..." message is shown for at least
    // a few seconds so that it's noticeable so we use autotracking to trigger
    // a task that sets _isSaving to true for 3 seconds
    get isSaving() {
        if (this.args.isSaving) {
            this.showSavingMessage.perform();
        }

        return this._isSaving;
    }

    get scheduledText() {
        // force a recompute every second
        get(this.clock, 'second');

        let text = [];
        const sendEmailWhenPublished = this.args.post.emailRecipientFilter;
        if (sendEmailWhenPublished && sendEmailWhenPublished !== 'none') {
            text.push(`and sent to ${sendEmailWhenPublished} members`);
        }

        let formattedTime = formatPostTime(
            this.args.post.publishedAtUTC,
            {timezone: this.settings.get('timezone'), scheduled: true}
        );
        text.push(formattedTime);

        return text.join(' ');
    }

    @task({drop: true})
    *showSavingMessage() {
        this._isSaving = true;
        yield timeout(config.environment === 'test' ? 0 : 3000);

        if (!this.isDestroyed && !this.isDestroying) {
            this._isSaving = false;
        }
    }
}
