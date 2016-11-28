/* eslint-env node */
module.exports = {
    'framework': 'mocha',
    'parallel': 2,
    'test_page': 'tests/index.html?hidepassed',
    'disable_watching': true,
    'launch_in_ci': [
        'Chrome',
        'Firefox'
    ],
    'launch_in_dev': [
        'Chrome',
        'Firefox'
    ]
};
