/* eslint-env node */
module.exports = {
    root: true,
    parser: 'babel-eslint',
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
        ecmaFeatures: {
          legacyDecorators: true
        }
    },
    plugins: [
        'ghost'
    ],
    extends: [
        'plugin:ghost/ember'
    ],
    rules: {
        // disable linting of `this.get` until there's a reliable autofix
        'ghost/ember/use-ember-get-and-set': 'off'
    }
};
