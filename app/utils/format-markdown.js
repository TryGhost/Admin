/* global Showdown, html_sanitize*/
import cajaSanitizers from './caja-sanitizers';

// eslint-disable-next-line new-cap
let showdown = new Showdown.converter({extensions: ['ghostgfm', 'footnotes', 'highlight']});

export default function formatMarkdown(_markdown) {
    let markdown = _markdown || '';
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

    return escapedhtml;
}
