/*jshint node:true */
/* jscs:disable disallowVar, disallowMultipleVarDecl */
/* jscs:disable requireTemplateStringsForConcatenation, requireCamelCaseOrUpperCaseIdentifiers */

module.exports = {
    framework: 'mocha',
    test_page: 'tests/index.html?hidepassed&hideskipped&timeout=150000',
    disable_watching: true,
    parallel: 4,
    launchers: {
        SL_Chrome_Current: {
            command: "npm run sauce:launch -- -b chrome --no-ct -u '<url>'",
            protocol: 'tap'
        },
        SL_Firefox_Current: {
            command: "npm run sauce:launch -- -b firefox -v 45 --no-ct -u '<url>'",
            protocol: 'tap'
        },
        SL_Safari_Current: {
            command: "npm run sauce:launch -- -b safari -v 9 --no-ct -u '<url>'",
            protocol: 'tap'
        },
        SL_MS_Edge: {
            command: "npm run sauce:launch -- -b 'microsoftedge' --no-ct -u '<url>'",
            protocol: 'tap'
        },
        SL_IE_11: {
            command: "npm run sauce:launch -- -b 'internet explorer' --no-ct -u '<url>'",
            protocol: 'tap'
        }
    },
    launch_in_dev: ['PhantomJS'],
    launch_in_ci: [
        'SL_Chrome_Current',
        'SL_Firefox_Current',
        'SL_Safari_Current',
        'SL_MS_Edge',
        'SL_IE_11'
    ]
};
