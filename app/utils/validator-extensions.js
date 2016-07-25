export default {
    init() {
        validator.extend('notContains', function (str, badString) {
            return str.indexOf(badString) === -1;
        });
    }
};
