import Component from '@glimmer/component';
import {action} from '@ember/object';
import {tracked} from '@glimmer/tracking';

function ensureEndsWith(string, endsWith) {
    return string.endsWith(endsWith) ? string : string + endsWith;
}

function removeLeadingSlash(string) {
    return string.replace(/^\//, '');
}

export default class GhUrlInput extends Component {
    constructor(owner, args) {
        super(owner, args);
        this.baseUrl = ensureEndsWith(args.baseUrl, '/');
        this.value = args.value && args.value !== '/' ? (new URL(removeLeadingSlash(args.value), this.baseUrl)).href : '';
        this.setResult = args.setResult;
    }

    @tracked
    invalid = false;

    @action
    setValue(event) {
        this.value = event.target.value;
        const path = this.getPath();
        if (path === null) {
            this.invalid = true;
        } else {
            this.invalid = false;
            this.setResult(path);
        }
    }

    getPath() {
        const url = new URL(removeLeadingSlash(this.value), this.baseUrl);

        if (!url.href.startsWith(this.baseUrl)) {
            return null;
        }

        return '/' + url.href.replace(this.baseUrl, '');
    }
}
