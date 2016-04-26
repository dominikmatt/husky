/**
 * This file is part of Husky frontend development framework.
 *
 * (c) MASSIVE ART WebServices GmbH
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 *
 */
(function() {

    'use strict';

    require.config({
        paths: {
            ckeditor: 'bower_components/ckeditor/ckeditor',
            jqueryAdapter: 'bower_components/ckeditor/adapters/jquery'
        },
        shim: {
            jqueryAdapter: {
                deps: ['jquery', 'ckeditor']
            }
        }
    });

    define(['ckeditor', 'jqueryAdapter'], function() {

        var getConfig = function() {
            return {
                format_tags: 'p;h1;h2;h3;h4;h5;h6',
                width: '100%',
                defaultLanguage: 'en',
                removeButtons: '',
                removePlugins: 'elementspath,magicline',
                removeDialogTabs: 'image:advanced;link:advanced',
                extraAllowedContent: 'img(*)[*]; span(*)[*]; div(*)[*]',
                resize_enabled: false,
                enterMode: 'P',
                uiColor: '#ffffff',
                skin: 'husky'
            };
        };

        return {

            name: 'ckeditor',

            initialize: function(app) {

                var toolbar = {
                        semantics: ['Format'],
                        basicstyles: ['Superscript', 'Subscript', 'Italic', 'Bold', 'Underline', 'Strike'],
                        blockstyles: ['JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock'],
                        list: ['NumberedList', 'BulletedList']
                    },
                    plugins = ['justify', 'format', 'sourcearea', 'link', 'table', 'pastefromword', 'autogrow'];

                app.sandbox.ckeditor = {

                    addPlugin: function(toolbarName, button, name, plugin) {
                        if (!toolbar[toolbarName]) {
                            toolbar[toolbarName] = [];
                        }

                        toolbar[toolbarName].push(button);
                        plugins.push(name);

                        CKEDITOR.plugins.add(name, plugin);
                    },

                    getToolbar: function() {
                        return _.map(toolbar, function(items, name) {
                            return {name: name, items: items};
                        });
                    },

                    // callback when editor is ready
                    init: function(selector, callback, config) {
                        var configuration = app.sandbox.util.extend(true, {}, getConfig.call(), config), $editor;
                        configuration.extraPlugins = plugins.join(',');

                        if (!!callback && typeof callback === 'function') {
                            $editor = $(selector).ckeditor(callback, configuration);
                        } else {
                            $editor = $(selector).ckeditor(configuration);
                        }

                        // customize ckeditor dialog appearance on 'dialogDefinition' (=> open)
                        // and filter link/target options
                        CKEDITOR.on('dialogDefinition', function(ev) {
                            // take the dialog name and its definition from the event
                            // data.
                            var dialogName = ev.data.name,
                                dialogDefinition = ev.data.definition;

                            // check if the definition is from the dialog we're
                            // interested in (the "Link" dialog).
                            if (dialogName == 'link') {
                                    // get a reference to the "Link Info" and "Target" tab.
                                var infoTab = dialogDefinition.getContents('info'),
                                    targetTab = dialogDefinition.getContents('target'),

                                    // get a reference to the link type
                                    linkOptions = infoTab.get('linkType'),
                                    targetOptions = targetTab.get('linkTargetType'),

                                    // list of included link options
                                    includedLinkOptions = [
                                        'url',
                                        'email'
                                    ],
                                    selectedLinkOption = [],

                                    // list of included link target options
                                    includedTargetOptions = [
                                        'notSet',
                                        '_blank',
                                        '_self'
                                    ],
                                    selectedTargetOptions = [];

                                // just show included link options
                                for (var i = 0; i < linkOptions.items.length; i++) {
                                    if (includedLinkOptions.indexOf(linkOptions.items[i][1]) !== -1) {
                                        selectedLinkOption.push(linkOptions.items[i]);
                                    }
                                }

                                // just show included target options
                                for (var i = 0; i < targetOptions.items.length; i++) {
                                    if (includedTargetOptions.indexOf(targetOptions.items[i][1]) !== -1) {
                                        selectedTargetOptions.push(targetOptions.items[i]);
                                    }
                                }

                                linkOptions.items = selectedLinkOption;
                                targetOptions.items = selectedTargetOptions;
                            }
                        });

                        return $editor.editor;
                    },

                    getInstance: function(id) {
                        var instance = CKEDITOR.instances[id];

                        if (!!instance) {
                            return instance;
                        }
                    }
                };
            }

        };
    });
})();
