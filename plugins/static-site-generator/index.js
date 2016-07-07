/*!
 * static-site-generator
 */

"use strict";

/*!
 * Module dependencies
 */
var contentstack = require('contentstack-express');
var path = require('path');
var fs = require('fs');
var Q = require('q');
var config = contentstack.config;
var temppath = config._config.path.templates;
var basePath = config._config.path.base;

module.exports = function StaticSiteGenerator() {

    var options = StaticSiteGenerator.options;
    var expressApp;
    var staticFolderPath;
    var staticFolderName;

    if (options.staticfoldername) {
        staticFolderName = options.staticfoldername;
    } else {
        staticFolderName = "static";
    }

    if (options.staticfolderpath) {
        if (fs.existsSync(options.staticfolderpath)) {
            staticFolderPath = options.staticfolderpath;
        } else {
            staticFolderPath = basePath;
        }
    } else {
        staticFolderPath = basePath;
    }

    StaticSiteGenerator.templateExtends = function (engine) {
    };

    StaticSiteGenerator.serverExtends = function (app) {
        expressApp = app;
        var locals=config._config.languages;
        var alllocals = locals.map(function (locale, instanceIndex) {
            app.use(locale.relative_url_prefix, contentstack.static(path.join(staticFolderPath, staticFolderName,locale.code, 'home'),{setHeaders: function (res, path, stat){
                res.set('x-static', "serving static file");
            }}))
            app.use(locale.relative_url_prefix, contentstack.static(path.join(staticFolderPath, staticFolderName, locale.code), {
                 setHeaders: function (res, path, stat) {
                    res.set('x-static', "serving static file");
                }
            }))
        })

        //Code to serve static file
      /*  app.use("/", contentstack.static(path.join(staticFolderPath, staticFolderName, 'en-us', 'home'),{setHeaders: function (res, path, stat){
         res.set('x-static', "serving static");
         }}))
        app.use("/", contentstack.static(path.join(staticFolderPath, staticFolderName, 'en-us'), {
             index: ["index.html"], setHeaders: function (res, path, stat) {
                res.set('x-static', "serving static");

            }
        }))*/


        app.extends().use(function (req, res, next) {
            console.log("Custom Static creation");
            var template = req.contentstack.get('template');
            var entry = req.contentstack.get('entry');
            var content_type = req.contentstack.get('content_type');
            var lang = req.contentstack.get('lang');
            var mainurl;
            if (req.contentstack.get('url') == "/") {
                mainurl = "/home"
            } else {
                mainurl = req.contentstack.get('url');
            }
            if (template && entry && content_type) {
                res.render(template, {
                    entry: entry
                }, function (err, html) {
                    if (!err) {
                        var filePath = createStaticFile(mainurl,lang,html)
                        res.sendFile(filePath)
                    } else {
                        console.log("Render Error:", err)
                        next()
                    }
                })

            } else {
                next()
            }
        })

    };

    StaticSiteGenerator.beforePublish = function (data, next) {
        if (data.content_type) {
            var lang = data.language;
            if (data.content_type.options.is_page) {
                var template = path.join(temppath, "pages", data.content_type.uid, "index.html");
                var content = data.entry;
                var mainurl = data.entry.url;
                if (mainurl == "/") {
                    mainurl = "/home"
                }
                if (fs.existsSync(template)) {
                    expressApp.render(template, {entry: content}, function (err, html) {
                        if (!err) {
                            var filePath = createStaticFile(mainurl,lang,html)
                            next()
                        } else {
                            console.log("Render Error:", err)
                            next()
                        }
                    })

                } else {
                    console.log("Template is not present", JSON.stringify(data))
                    next()
                }
            } else {
                deleteFolderRecursive(path.join(staticFolderPath, staticFolderName, lang.code))
                next()
            }
        } else {
            console.log("Asset:::::::", JSON.stringify(data))
            next()
        }
    };

    StaticSiteGenerator.beforeUnpublish = function (data, next) {
        var lang = data.language;
        if (data.content_type.options.is_page) {
            var mainurl = data.entry.url;
            if (mainurl == "/") {
                mainurl = "/home"
            }
            if (fs.existsSync(path.join(staticFolderPath, staticFolderName, lang.code, mainurl, 'index.html'))) {
                fs.unlinkSync(path.join(staticFolderPath, staticFolderName, lang.code, mainurl, 'index.html'));
            }
            //deleteFolderRecursive(path.join(staticFolderPath, staticFolderName, lang.code, mainurl))
            next();
        } else {
            deleteFolderRecursive(path.join(staticFolderPath, staticFolderName, lang.code))
            next()
        }
    };

    var createStaticFile = function (mainurl,lang, html) {
        var url = mainurl.split("/");
        if (!fs.existsSync(path.join(staticFolderPath, staticFolderName)))
            fs.mkdirSync(path.join(staticFolderPath, staticFolderName));
        if (!fs.existsSync(path.join(staticFolderPath, staticFolderName, lang.code)))
            fs.mkdirSync(path.join(staticFolderPath, staticFolderName, lang.code));
        if (url.length == 2) {
            if (!fs.existsSync(path.join(staticFolderPath, staticFolderName, lang.code, url[1])))
                fs.mkdirSync(path.join(staticFolderPath, staticFolderName, lang.code, url[1]));
            fs.writeFileSync(path.join(staticFolderPath, staticFolderName, lang.code, url[1], 'index.html'), html, "utf-8");
            console.log("Static File Created ")
            return path.join(staticFolderPath, staticFolderName, lang.code, url[1], 'index.html')
        } else {
            var mainpath = path.join(staticFolderPath, staticFolderName, lang.code);
            url.splice(0, 1);
            var folders = url.map(function (folderName, instanceIndex) {
                var deferred = Q.defer();
                mainpath = path.join(mainpath, folderName);
                if (!fs.existsSync(mainpath))
                    fs.mkdirSync(mainpath);
                deferred.resolve();
                return deferred.promise
            })
            return Q.all(folders)
                .then(function () {
                    console.log("Static File Created Sucessfully");
                    fs.writeFileSync(path.join(mainpath, 'index.html'), html, "utf-8");
                    return path, join(mainpath, 'index.html')
                })
        }

    }

    var deleteFolderRecursive = function (dirPath) {
        if (fs.existsSync(dirPath)) {
            fs.readdirSync(dirPath).forEach(function (file, index) {
                var curPath = path.join(dirPath, file);

                if (fs.lstatSync(curPath).isDirectory()) { // recurse
                    if ((fs.readdirSync(curPath)).length == 0) {
                        fs.rmdirSync(curPath)
                    } else {
                        deleteFolderRecursive(curPath);
                    }
                } else { // delete file
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(dirPath);
        }
    };
};