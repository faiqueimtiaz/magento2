/**
 * Copyright © 2015 Magento. All rights reserved.
 * See COPYING.txt for license details.
 */
define([
    'jquery',
    'ko',
    'underscore',
    'mage/template',
    'text!ui/template/tooltip/tooltip.html',
    '../template/renderer'
], function ($, ko, _, template, tooltipTmpl, renderer) {
    'use strict';

    var tooltip,
        defaults,
        positions,
        transformProp,
        checkedPositions = {};

    defaults = {
        tooltipWrapper: '[data-tooltip=tooltip-wrapper]',
        tooltipContentBlock: 'data-tooltip-content',
        closeButtonClass: 'action-close',
        action: 'click',
        step: 20,
        delay: 0,
        track: false,
        position: 'top',
        closeButton: false,
        showed: false
    };

    /**
     * Polyfill for css transform
     */
    transformProp = (function () {
        var style = document.createElement('div').style,
            base = 'Transform',
            vendors = ['webkit', 'moz', 'ms', 'o'],
            vi = vendors.length,
            property;

        if (typeof style.transform != 'undefined') {
            return 'transform';
        }

        while (vi--) {
            property = vendors[vi] + base;

            if (typeof style[property] != 'undefined') {
                return property;
            }
        }
    })();

    positions = {
        map: {
            horizontal: {
                s: 'w',
                p: 'left'
            },
            vertical: {
                s: 'h',
                p: 'top'
            }
        },

        /**
         * Wrapper function to get tooltip data (position, className, etc)
         *
         * @param {Object} winSize - screen size
         * @param {Object} wrapSize - tooltip size
         * @param {Object} elemSize - trigger size
         * @param {Object} elemPos - trigger position
         * @param {Object} scrollPos - scroll position
         * @returns {Object} tooltip data (position, className, etc)
         */
        top: function (winSize, wrapSize, elemSize, elemPos, scrollPos) {
            checkedPositions.top = true;

            return positions._topLeftChecker(winSize, wrapSize, elemSize, elemPos, scrollPos, 'vertical', 'horizontal',
                'right', 'left', '_bottom', 'top', positions.map);
        },

        /**
         * Wrapper function to get tooltip data (position, className, etc)
         *
         * @param {Object} winSize - screen size
         * @param {Object} wrapSize - tooltip size
         * @param {Object} elemSize - trigger size
         * @param {Object} elemPos - trigger position
         * @param {Object} scrollPos - scroll position
         * @returns {Object} tooltip data (position, className, etc)
         */
        right: function (winSize, wrapSize, elemSize, elemPos, scrollPos) {
            checkedPositions.right = true;

            return positions._bottomRightChecker(winSize, wrapSize, elemSize, elemPos, scrollPos, 'horizontal',
                'vertical', 'bottom', 'top', '_left', 'right', positions.map);
        },

        /**
         * Wrapper function to get tooltip data (position, className, etc)
         *
         * @param {Object} winSize - screen size
         * @param {Object} wrapSize - tooltip size
         * @param {Object} elemSize - trigger size
         * @param {Object} elemPos - trigger position
         * @param {Object} scrollPos - scroll position
         * @returns {Object} tooltip data (position, className, etc)
         */
        bottom: function (winSize, wrapSize, elemSize, elemPos, scrollPos) {
            checkedPositions.bottom = true;

            return positions._bottomRightChecker(winSize, wrapSize, elemSize, elemPos, scrollPos, 'vertical',
                'horizontal', 'left', 'right', '_top', 'bottom', positions.map);
        },

        /**
         * Wrapper function to get tooltip data (position, className, etc)
         *
         * @param {Object} winSize - screen size
         * @param {Object} wrapSize - tooltip size
         * @param {Object} elemSize - trigger size
         * @param {Object} elemPos - trigger position
         * @param {Object} scrollPos - scroll position
         * @returns {Object} tooltip data (position, className, etc)
         */
        left: function (winSize, wrapSize, elemSize, elemPos, scrollPos) {
            checkedPositions.left = true;

            return positions._topLeftChecker(winSize, wrapSize, elemSize, elemPos, scrollPos,
                'horizontal', 'vertical', 'top', 'bottom', '_right', 'left', positions.map);
        },

        /**
         * Check can be tooltip setted to transmitted position
         *
         * @param {Object} winSize - screen size
         * @param {Object} wrapSize - tooltip size
         * @param {Object} elemSize - trigger size
         * @param {Object} elemPos - trigger position
         * @param {Object} scrollPos - scroll position
         * @param {String} direction - direction position for map (vertical/horizontal)
         * @param {String} directionDep - direction position for map, used for try set to next position
         * @param {String} delegateFirst - priority position if tooltip can't be setted in current
         * @param {String} delegateSecond - secondary position if tooltip can't be setted in current
         * @param {String} className - class name for tooltip if tooltip can be setted in current position
         * @param {String} side - current side position
         * @param {Object} map - map for directions
         * @returns {Object} tooltip data (position, className, etc)
         */
        _bottomRightChecker: function (winSize, wrapSize, elemSize, elemPos, scrollPos, direction, directionDep,
                                       delegateFirst, delegateSecond, className, side, map) {
            var result = {
                position: {}
            };

            if (elemPos[map[direction].p] + elemSize[map[direction].s] + wrapSize[map[direction].s] <
                winSize[map[direction].s] + scrollPos[map[direction].p]) {
                // If tooltip can be setted in left position
                result.position[map[direction].p] = elemPos[map[direction].p] + elemSize[map[direction].s] +
                    defaults.step;
                result.className = className;
                result.side = side;
                result = positions._normalize(winSize, wrapSize, elemSize, elemPos, scrollPos, directionDep,
                    delegateFirst, delegateSecond, result, map);
            } else if (!checkedPositions[delegateFirst]) {
                result = positions[delegateFirst].apply(null, arguments);
            } else {
                result.position = scrollPos;
            }

            return result;
        },

        /**
         * Check can be tooltip setted to transmitted position
         *
         * @param {Object} winSize - screen size
         * @param {Object} wrapSize - tooltip size
         * @param {Object} elemSize - trigger size
         * @param {Object} elemPos - trigger position
         * @param {Object} scrollPos - scroll position
         * @param {String} direction - direction position for map (vertical/horizontal)
         * @param {String} directionDep - direction position for map, used for try set to next position
         * @param {String} delegateFirst - priority position if tooltip can't be setted in current
         * @param {String} delegateSecond - secondary position if tooltip can't be setted in current
         * @param {String} className - class name for tooltip if tooltip can be setted in current position
         * @param {String} side - current side position
         * @param {Object} map - map for directions
         * @returns {Object} tooltip data (position, className, etc)
         */
        _topLeftChecker: function (winSize, wrapSize, elemSize, elemPos, scrollPos, direction, directionDep,
                                   delegateFirst, delegateSecond, className, side, map) {
            var result = {
                position: {}
            };

            if (elemPos[map[direction].p] - wrapSize[map[direction].s] > scrollPos[map[direction].p]) {
                // If tooltip can be setted in left position
                result.position[map[direction].p] = elemPos[map[direction].p] - wrapSize[map[direction].s] -
                    defaults.step;
                result.className = className;
                result.side = side;
                result = positions._normalize(winSize, wrapSize, elemSize, elemPos, scrollPos, directionDep,
                    delegateFirst, delegateSecond, result, map);
            } else if (!checkedPositions[delegateFirst]) {
                result = positions[delegateFirst].apply(null, arguments);
            } else {
                result.position = scrollPos;
            }

            return result;
        },

        /**
         * Check can be tooltip setted to transmitted position
         *
         * @param {Object} winSize - screen size
         * @param {Object} wrapSize - tooltip size
         * @param {Object} elemSize - trigger size
         * @param {Object} elemPos - trigger position
         * @param {Object} scrollPos - scroll position
         * @param {String} direction - direction position for map (vertical/horizontal)
         * @param {String} delegateFirst - priority position if tooltip can't be setted in current
         * @param {String} delegateSecond - secondary position if tooltip can't be setted in current
         * @param {Object} data - available data
         * @param {Object} map - map for directions
         * @returns {Object} tooltip data (position, className, etc)
         */
        _normalize: function (winSize, wrapSize, elemSize, elemPos, scrollPos, direction, delegateFirst, delegateSecond,
                              data, map) {
            var depResult,
                centerPosition = elemPos[map[direction].p] -
                    (wrapSize[map[direction].s] - elemSize[map[direction].s]) / 2;

            if (elemSize[map[direction].s] > wrapSize[map[direction].s]) {
                // If tooltip width less then handler width
                data.position[map[direction].p] = (elemSize[map[direction].s] -
                    wrapSize[map[direction].s]) / 2 + elemPos[map[direction].p];
            } else if (centerPosition + wrapSize[map[direction].s] <
                winSize[map[direction].s] + scrollPos[map[direction].p] &&
                centerPosition > scrollPos[map[direction].p]) {
                // If tooltip width more then handler width but placed in viewport
                data.position[map[direction].p] = centerPosition;
            } else {
                // If tooltip width more then handler width and can't be placed in viewport by left side
                /*eslint-disable no-lonely-if*/
                if (!checkedPositions[delegateFirst]) {
                    depResult = positions[delegateFirst].apply(null, arguments);
                    depResult.hasOwnProperty('className') ?
                        data = depResult : data.position[map[direction].p] = scrollPos[map[direction].p];
                } else if (!checkedPositions[delegateSecond]) {
                    depResult = positions[delegateSecond].apply(null, arguments);
                    depResult.hasOwnProperty('className') ?
                        data = depResult : data.position[map[direction].p] = scrollPos[map[direction].p];
                } else {
                    data.position[map[direction].p] = scrollPos[map[direction].p];
                }
            }

            return data;
        }
    };

    tooltip = {

        /**
         * Create tooltip and append to DOM
         *
         * @param {Object} config - tooltip config
         * @returns {Object} tooltip element
         */
        createTooltip: function (config) {
            var body = $('body');

            config = _.extend(defaults, config);

            $(template(tooltipTmpl, {
                data: config
            })).appendTo(body);

            tooltip.showed = true;
            tooltip.element = $(config.tooltipWrapper);

            return tooltip.element;
        },

        /**
         * Set data/handlers/position to tooltip
         *
         * @param {Object} elem - tooltip element
         * @param {Object} viewModel - tooltip viewModel
         * @param {Object} config - tooltip config
         * @param {Object} bindingCtx - tooltip bindingCtx
         * @param {Object} event - current event
         */
        setContent: function (elem, viewModel, config, bindingCtx, event) {
            var html = $(elem).html(),
                tooltipElement;

            config = _.extend(defaults, config);

            if (tooltip.showed && tooltip.trigger && tooltip.trigger[0] === event.currentTarget && config.action === 'click') {
                tooltip.destroy(config);

                return tooltip.trigger = false;
            }

            if (config.action === 'click') {
                tooltip.event = event;
            }

            tooltip.destroy(config);
            tooltip.trigger = $(event.currentTarget);
            tooltip.targetElement = false;
            $(document).on('mousemove', tooltip.setTargetData);

            tooltip.timeout = _.delay(function () {
                $(document).off('mousemove', tooltip.setTargetData);

                if (!tooltip.targetElement || tooltip.trigger[0] === tooltip.targetElement) {
                    event.stopPropagation();
                    tooltipElement = tooltip.createTooltip(config);
                    tooltipElement.find('.' + config.tooltipContentBlock).append(html);
                    tooltipElement.applyBindings(bindingCtx);
                    tooltip.setHandlers(config);
                    tooltip.setPosition(elem, tooltipElement, config, event);
                }
            }, config.delay);
        },

        /**
         * Set target element
         *
         * @param {Object} event - current event
         */
        setTargetData: function (event) {
            tooltip.targetElement = event.target;
            tooltip.event = event;
        },

        /**
         * Set handlers to tooltip
         *
         * @param {Object} config - tooltip config
         */
        setHandlers: function (config) {

            if (config.track && config.action === 'hover') {
                tooltip.trigger.on('mousemove', tooltip.track);
            }

            if (config.action === 'click') {
                $(document).on('click', tooltip.outerClick.bind(null, config));
            }

            if (config.closeButton) {
                $('.' + config.closeButtonClass).on('click', tooltip.destroy.bind(null, config));
            }

            $(window).on('resize', tooltip.outerClick.bind(null, config));
        },

        /**
         * Change tooltip position when track is enabled
         *
         * @param {Object} event - current event
         */
        track: function (event) {
            var inequality = {};

            if (tooltip.side === 'bottom' || tooltip.side === 'top') {
                inequality.x = event.pageX - (tooltip.position.left + tooltip.element.outerWidth()/2);

                if (tooltip.position.left + inequality.x + tooltip.sizeData.wrapperSize.w >
                    tooltip.sizeData.windowSize.w + tooltip.sizeData.scrollPosition.left ||
                    inequality.x + tooltip.position.left < tooltip.sizeData.scrollPosition.left) {

                    return false;
                }

                tooltip.element[0].style[transformProp] = 'translateX(' + inequality.x + 'px)';
            } else if (tooltip.side === 'left' || tooltip.side === 'right' ) {
                inequality.y = event.pageY - (tooltip.position.top + tooltip.element.outerHeight()/2);

                if (tooltip.position.top + inequality.x + tooltip.sizeData.wrapperSize.h >
                    tooltip.sizeData.windowSize.h + tooltip.sizeData.scrollPosition.top ||
                    inequality.h + tooltip.position.top < tooltip.sizeData.scrollPosition.top) {

                    return false;
                }

                tooltip.element[0].style[transformProp] = 'translateY(' + inequality.y + 'px)';
            }
        },

        /**
         * Remove tooltip handlers
         *
         * @param {Object} config - tooltip config
         */
        removeHandlers: function (config) {
            if (config.track && tooltip.trigger) {
                tooltip.trigger.off('mousemove', tooltip.track);
            }

            if (config.action === 'click') {
                $(document).off('click', tooltip.outerClick);
            }

            if (config.closeButton) {
                $('.' + config.closeButtonClass).off('click', tooltip.destroy);
            }

            $(window).off('resize', tooltip.outerClick);
        },

        /**
         * Outer click handler to close tooltip
         *
         * @param {Object} config - tooltip config
         * @param {Object} event - current event
         */
        outerClick: function (config, event) {
            var tooltipElement = $(event.target).parents(config.tooltipWrapper)[0];

            if (tooltip.showed && tooltipElement !== tooltip.element[0]) {
                tooltip.destroy(config);
            }
        },

        /**
         * Set position to tooltip
         *
         * @param {Object} element - tooltip trigger
         * @param {Object} tooltipElement - tooltip element
         * @param {Object} config - tooltip config
         * @param {Object} event - current event
         */
        setPosition: function (element, tooltipElement, config) {
            tooltip.sizeData = {
                windowSize: {
                    h: $(window).outerHeight(),
                    w: $(window).outerWidth()
                },
                scrollPosition: {
                    top: $(window).scrollTop(),
                    left: $(window).scrollLeft()
                },
                wrapperSize: {
                    h: tooltipElement.outerHeight(),
                    w: tooltipElement.outerWidth()
                },
                elementSize: {
                    h: tooltip.trigger.outerHeight(),
                    w: tooltip.trigger.outerWidth()
                },
                elementPosition: tooltip.trigger.offset()
            };

            _.extend(tooltip,
                positions[config.position](tooltip.sizeData.windowSize, tooltip.sizeData.wrapperSize,
                    tooltip.sizeData.elementSize, tooltip.sizeData.elementPosition, tooltip.sizeData.scrollPosition));
            checkedPositions = {};
            tooltip._setPositionShift(config, tooltip.sizeData.windowSize, tooltip.sizeData.wrapperSize,
                tooltip.sizeData.elementSize, tooltip.sizeData.elementPosition, tooltip.sizeData.scrollPosition);
            tooltipElement.css(tooltip.position);
            tooltipElement.addClass(tooltip.className);
        },

        /**
         * Set shift to position if track is enabled
         *
         * @param {Object} config - tooltip config
         * @param {Object} windowSize - window size
         * @param {Object} wrapperSize - tooltip size
         * @param {Object} elementSize - trigger size
         * @param {Object} elementPosition - trigger position
         * @param {Object} scrollPosition - scroll position
         */
        _setPositionShift: function (config, windowSize, wrapperSize, elementSize, elementPosition, scrollPosition) {
            var shift;

            if (config.track && tooltip.event && (tooltip.side === 'bottom' || tooltip.side === 'top')) {
                shift = tooltip.position.left - (elementSize.w / 2 -
                    ($(tooltip.event.target).offset().left - tooltip.trigger.offset().left + tooltip.event.offsetX));

                if (shift + wrapperSize.w > windowSize.w + scrollPosition.left) {
                    shift = windowSize.w + scrollPosition.left - wrapperSize.w;
                } else if (shift < scrollPosition.left) {
                    shift = scrollPosition.left;
                }
                tooltip.position.left = shift;
            } else if (config.track && tooltip.event && (tooltip.side === 'left' || tooltip.side === 'right')) {
                shift = tooltip.position.top - (elementSize.h / 2 -
                    ($(tooltip.event.target).offset().top - tooltip.trigger.offset().top + tooltip.event.offsetY));

                if (shift + wrapperSize.h > windowSize.h + scrollPosition.top) {
                    shift = windowSize.h + scrollPosition.top - wrapperSize.h;
                } else if (shift < scrollPosition.top) {
                    shift = scrollPosition.top;
                }

                tooltip.position.top = shift;
            }
        },

        /**
         * Destroy tooltip instance
         *
         * @param {Object} config - tooltip config
         */
        destroy: function (config) {
            config = config || {};
            clearTimeout(tooltip.timeout);

            if (tooltip.element) {
                tooltip.element.remove();
                tooltip.showed = false;
            }

            tooltip.removeHandlers(config);
        }
    };

    ko.bindingHandlers.tooltip = {

        /**
         * Initialize tooltip
         *
         * @param {Object} element - tooltip DOM element
         * @param {Function} valueAccessor - ko observable property, tooltip data
         * @param {Object} allBindings - all bindings on current element
         * @param {Object} viewModel - current element viewModel
         * @param {Object} bindingCtx - current element binding context
         */
        init: function (element, valueAccessor, allBindings, viewModel, bindingCtx) {
            var config = _.extend(defaults, valueAccessor()),
                trigger = config.trigger,
                action = config.action,
                $parentScope =  $(element).addClass('hidden').parent();

            if (config.parentScope) {
                $parentScope = $(config.parentScope);
            }

            if (action === 'hover') {
                $parentScope.on('mouseenter', trigger,
                    tooltip.setContent.bind(null, element, viewModel, valueAccessor(), bindingCtx));
                $parentScope.on('mouseleave', trigger, tooltip.destroy.bind(null, config));
            } else if (action === 'click') {
                $parentScope.on('click', trigger,
                    tooltip.setContent.bind(null, element, viewModel, valueAccessor(), bindingCtx));
            }

            return {
                controlsDescendantBindings: true
            };
        }
    };

    renderer.addAttribute('tooltip');
});