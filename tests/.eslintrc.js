/* eslint-env node */
module.exports = {
    env: {
        embertest: true
    },
    rules: {
        'ghost/ember/no-invalid-debug-function-arguments': 'off',
        'no-shadow': ['error', {allow: ['hooks']}]
    },
    extends: ['plugin:qunit/recommended']
};
