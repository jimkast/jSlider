(function($) {


    $.fn.jSlider = function(options) {

        // Check if browser supports CSS property 'p'
        var transition = propertySupport('transition');
        var all = this;

        var defaults = {
            prevArrow: '.prev',
            nextArrow: '.next',
            pager: '.paging',
            mask: '.mask',
            obj: '.nowrap',
            speed: 600,
            rotate: false,
            start: 0,
            responsive: true
        };


        var settings = $.extend({}, defaults, options);


        return all.each(function(index) {
            // Setup
            var $elem = all.eq(index);
            $elem.data('jSlider', new makeSlider($elem, settings));
        });

    }




    function propertySupport(p) {
        var b = document.body || document.documentElement;
        var s = b.style;
        if (typeof s[p] == 'string') {
            return true;
        }

        // Tests for vendor specific prop
        v = ['Moz', 'Webkit', 'Khtml', 'O', 'ms'],
            p = p.charAt(0).toUpperCase() + p.substr(1);
        for (var i = 0; i < v.length; i++) {
            if (typeof s[v[i] + p] == 'string') {
                return true;
            }
        }
        return false;
    };



    function makeSlider($elem, settings) {

        var that = this;


        var $mask;
        var $obj;
        var $pager;
        var $prevArrows;
        var $nextArrows;

        var supportsTransitions;
        var animationSpeed;
        var state = {};
        var slideTimeout;
        var resizeInterval = 100;


        // var defaults = {
        settings = {
            prevSelector: '.prev',
            nextSelector: '.next',
            pagerSelector: '.paging',
            maskSelector: '.mask',
            slidesSelector: '.mask > .nowrap',
            activeClass: 'current',
            speed: 600,
            rotate: false,
            start: 0,
            responsive: true
        };

        var callbacks = {

            beforeSlide: function() {},
            afterSlide: function() {},
            onStartBound: function() {},
            onEndBound: function() {}

        };


        function buildPager() {
            var str = '';
            for (var i = 1; i <= total; i++)
                str += '<li' + (i == this.current + 1 ? ' class="active"' : '') + '><a href="">' + i + '</a></li>';
            return str;
        };


        function activateArrows($arrow) {
            $arrow.removeClass('inactive');
        };

        function deactivateArrows($arrow) {
            $arrow.addClass('inactive');
        };


        function animate(index, callback) {

            var animationSpeed = supportsTransitions ? 0 : settings.speed;

            var animAttrs = {};

            animAttrs.left = -1 * Math.min(state.elementsPositions[index].left, state.endBound.left);
            animAttrs.top = -1 * Math.min(state.elementsPositions[index].top, state.endBound.top);

            state.animating = true;

            $obj.stop().animate(animAttrs, animationSpeed, function() {
                state.animating = false;
            });
        };



        function calcElementPositions() {
            var arr = [];
            for (var i = 0; i < state.total; i++) {
                arr.push(getDomItem(i).position());
            }
            return arr;
        };

        function getMaskSize() {
            return {
                width: $mask.width(),
                height: $mask.height()
            }
        };

        function calcEndBound() {

            var attr;
            var endBound;
            var searching = true;
            var lastElement = getDomItem(state.total - 1);
            var lastElementPosition = state.elementsPositions[state.elementsPositions.length - 1];


            endBound = {
                left: Math.max(Math.round(lastElementPosition.left + lastElement.outerWidth() - state.maskSize.width), 0),
                top: Math.max(Math.round(lastElementPosition.top + lastElement.outerHeight() - state.maskSize.height), 0)
            };


            for (var i = state.total - 1; i >= 0 && searching; i--) {
                if (Math.round(state.elementsPositions[i].left) <= endBound.left && Math.round(state.elementsPositions[i].top) <= endBound.top) {
                    searching = false;
                    endBound.index = i;
                }
            }

            if(!endBound.index || endBound.index < 0){
                endBound.index = 0;
            }

            return endBound;
        };


        function calculateSizes() {
            state.maskSize = getMaskSize();
            state.elementsPositions = calcElementPositions();
            state.endBound = calcEndBound();
        };



        function setupDOMElements() {

            $mask = $elem.find(settings.maskSelector);
            $obj = $elem.find(settings.slidesSelector).css('transition', 'left ' + settings.speed + 'ms ease, top ' + settings.speed + 'ms ease');
            $pager = $elem.find(settings.pagerSelector);
            $prevArrows = $elem.find(settings.prevSelector);
            $nextArrows = $elem.find(settings.nextSelector);

            if ($pager.length) {
                $pager.html(buildPager());
            }

            $prevArrows.click(function(e) {
                e.preventDefault();
                that.prev();
            });

            $nextArrows.click(function(e) {
                e.preventDefault();
                that.next();
            });


            $elem.on('click', settings.pagerSelector + ' a', function(e) {
                e.preventDefault();
                that.goTo($(this).closest('li').index());
            });



        };


        function getDomItem(index) {
            var idx;

            if (settings.rotate) {
                idx = index + 1;
            } else {
                idx = index;
            }
            return $obj.children().eq(idx);
        };


        function init() {

            settings = $.extend(settings, $elem.data());

            supportsTransitions = propertySupport('transition');

            setupDOMElements();

            state.current = -1;
            state.total = $obj.children().length;

            calculateSizes();
            that.goTo(settings.start);

            if (settings.responsive) {
                $(window).resize(function() {
                    clearTimeout(slideTimeout);
                    slideTimeout = setTimeout(slidersResponsiveUpdate, resizeInterval);

                });
            }

            that.state = state;

        };



        function slidersResponsiveUpdate() {
            calculateSizes();
            that.goTo(state.current);
        };

        function reachedAtEnd() {
            return state
        };


        function updateArrows() {
            if (!settings.rotate) {

                if (state.current === 0) {
                    deactivateArrows($prevArrows);
                } else {
                    activateArrows($prevArrows);
                }

                if (state.current >= state.endBound.index) {
                    deactivateArrows($nextArrows);
                } else {
                    activateArrows($nextArrows);
                }
            }
        };



        this.goTo = function(index) {

            if (index < 0) {
                index = 0;
            }

            if (index > state.endBound.index) {
                index = state.endBound.index;
            }

            if (that.inactive /* || state.current === index*/ ) {
                return;
            }

            getDomItem(state.current).removeClass(settings.activeClass);
            getDomItem(index).addClass(settings.activeClass);


            animate(index, callbacks.afterSlide);

            state.current = index;

            updateArrows();
        };


        this.prev = function() {
            var next;
            if (settings.rotate && state.current === 0) {
                next = state.total - 1;
            } else {
                next = state.current - 1;
            }

            that.goTo(next);
        };

        this.next = function() {
            var next;
            if (settings.rotate && state.current === state.total - 1) {
                next = 0;
            } else {
                next = state.current + 1;
            }

            that.goTo(next);
        };

        init();

    };


}(jQuery));
