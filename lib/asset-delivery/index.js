/* eslint-disable */
module.exports = {
    name: 'asset-delivery',
    postBuild: function (results) {
        var fs = this.project.require('fs-extra'),
            walkSync = this.project.require('walk-sync'),
            assetsIn = results.directory + '/assets',
            enginesIn = results.directory + '/engines-dist',
            templateOut = '../server/views/default.hbs',
            assetsOut = '../built/assets',
            enginesOut = '../built/engines-dist',
            assets = walkSync(assetsIn),
            engines = walkSync(enginesIn);

        fs.ensureDirSync(assetsOut);

        fs.copySync(results.directory + '/index.html', templateOut, {clobber: true});

        assets.forEach(function (relativePath) {
            if (relativePath.slice(-1) === '/') { return; }

            fs.copySync(assetsIn + '/' + relativePath, assetsOut + '/' + relativePath, {clobber:true});
        });

        engines.forEach(function (relativePath) {
            if (relativePath.slice(-1) === '/') { return; }

            fs.copySync(enginesIn + '/' + relativePath, enginesOut + '/' + relativePath, {clobber:true});
        });
    }
};
