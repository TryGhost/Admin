/* global showdown, html_sanitize */
import {helper} from 'ember-helper';
import {htmlSafe} from 'ember-string';
import cajaSanitizers from 'ghost-admin/utils/caja-sanitizers';

// eslint-disable-next-line new-cap
let converter = new showdown.Converter({
    extensions: ['ghostimagepreview', 'showdown-ghost-extra', 'footnotes', 'highlight'],
    omitExtraWLInCodeBlocks: true,
    parseImgDimensions: true,
    simplifiedAutoLink: true,
    excludeTrailingPunctuationFromURLs: true,
    literalMidWordUnderscores: true,
    strikethrough: true,
    tables: true,
    tablesHeaderId: true,
    ghCodeBlocks: true,
    tasklists: true,
    smoothLivePreview: true,
    simpleLineBreaks: true,
    requireSpaceBeforeHeadingText: true,
    ghMentions: false,
    encodeEmails: true
});

export function formatMarkdown(params) {
    if (!params || !params.length) {
        return;
    }

    let markdown = params[0] || '';
    let escapedhtml = '';

    // convert markdown to HTML
    escapedhtml = converter.makeHtml(markdown);

    // replace script and iFrame
    escapedhtml = escapedhtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        '<pre class="js-embed-placeholder">Embedded JavaScript</pre>');
    escapedhtml = escapedhtml.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        '<pre class="iframe-embed-placeholder">Embedded iFrame</pre>');

    // sanitize html
    /* eslint-disable-next-line camelcase */
    escapedhtml = html_sanitize(escapedhtml, cajaSanitizers.url, cajaSanitizers.id);

    return htmlSafe(escapedhtml);
}

export default helper(formatMarkdown);
