/* eslint-env node */
module.exports = {
    'framework': 'mocha',
    'test_page': 'tests/index.html?hidepassed',
    'disable_watching': true,
    'parallel': 2,
    'launch_in_ci': [
        'Chrome',
        'Firefox'
    ],
    'launch_in_dev': [
        'Chrome',
        'Firefox'
    ]
};
