/* global Showdown, html_sanitize*/
import cajaSanitizers from './caja-sanitizers';
import {helper} from '@ember/component/helper';
import {htmlSafe} from '@ember/string';

// eslint-disable-next-line new-cap
let showdown = new Showdown.converter({extensions: ['ghostgfm', 'footnotes', 'highlight']});

export function formatMarkdown(params) {
    if (!params || !params.length) {
        return;
    }

    let markdown = params[0] || '';
    let escapedhtml = '';

    // convert markdown to HTML
    escapedhtml = showdown.makeHtml(markdown);

    // replace script and iFrame
    escapedhtml = escapedhtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        '<pre class="js-embed-placeholder">Embedded JavaScript</pre>');
    escapedhtml = escapedhtml.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        '<pre class="iframe-embed-placeholder">Embedded iFrame</pre>');

    // sanitize html
    // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
    escapedhtml = html_sanitize(escapedhtml, cajaSanitizers.url, cajaSanitizers.id);
    // jscs:enable requireCamelCaseOrUpperCaseIdentifiers

    return htmlSafe(escapedhtml);
}

export default helper(formatMarkdown);
