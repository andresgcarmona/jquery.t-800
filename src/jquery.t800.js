/**
 * A jQuery form validation plugin.
 * 
 */
;(function(factory) {
    'use strict';
    if(typeof define === 'function' && define.amd) {
        // AMD
        define(['jquery'], factory);
    }
    else if(typeof module !== 'undefined' && module.exports) {
        // CommonJS
        module.exports = factory(require('jquery'));
    }
    else {
        // Global
        factory(jQuery);
    }
})(function($) {
    'use strict';

    if(!String.prototype.trim) {
        String.prototype.trim = function(str) {
            return str.replace(/^\s+|\s+$/gm, '');
        };
    }

    if(!Array.prototype.map) {
        Array.prototype.map = function(callback, thisArg) {
            var T, A, k;

            if(this == null) {
                throw new TypeError(' this is null or not defined');
            }

            var O = Object(this);
            var len = O.length >>> 0;

            if(typeof callback !== 'function') {
                throw new TypeError(callback + ' is not a function');
            }

            if(arguments.length > 1) {
                T = thisArg;
            }

            A = new Array(len);
            k = 0;

            while(k < len) {
                var kValue, mappedValue;
                if(k in O) {
                    kValue = O[k];
                    mappedValue = callback.call(T, kValue, k, O);
                    A[k] = mappedValue;
                }
              
                k++;
            }

            return A;
        };
    }

    if(!Array.prototype.filter) {
        Array.prototype.filter = function(fun) {
            'use strict';

            if(this === void 0 || this === null) {
                throw new TypeError();
            }

            var t   = Object(this);
            var len = t.length >>> 0;
            if(typeof fun !== 'function') {
              throw new TypeError();
            }

            var res     = [];
            var thisArg = arguments.length >= 2 ? arguments[1] : void 0;

            for(var i = 0; i < len; i++) {
              if(i in t) {
                var val = t[i];
                if(fun.call(thisArg, val, i, t)) {
                    res.push(val);
                }
              }
            }

            return res;
        };
    }

    var _VERSION = '0.1.0';
    var _methods = {
        init: function(options) {
            return new $.parsely(this, options);
        },
        validate: function(options) {
            var parsely = _methods.init.apply(this);
            this.valid  = parsely.validate(options);

            return this;
        }
    };

    $.parsely = function(element, options) {
        var parsely  = this,
            $element = $(element),
            element  = element,
            defaults = {
                // Shows a tooltip with the error message. Posible values are: [inline, tooltip]
                outputMode: 'inline',
                // Validation mode defines if the validation plugin is going to validate field by field or all fields at once.
                validationMode: 'step',
                // Input's type supported elements.
                elements: [
                    ':text',
                    ':password',
                    ':radio',
                    ':checkbox',
                    'textarea',
                    'input[type="number"]',
                    'input[type="file"]',
                    'input[type="email"]',
                    'input[type="tel"]'
                ],
                messages:{
                    required: '${field} is required.',
                    email   : 'Email format not valid.'
                },
                emailRE: /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i
            };
        
        parsely.version     = _VERSION;
        parsely.initialized = false;
        parsely.settings    = {};
        parsely.el          = element;
        parsely.$el         = $element;
        parsely.valid       = true;
        parsely.$inputs     = [];
        parsely.out         = '';

        parsely.init = function() {
            $.parsely.settings    = parsely.settings = $.extend({}, defaults, options);
            $.parsely.initialized = true;
        };

        parsely.init();
    };

    $.parsely.prototype = {
        validate: function(options) {
            var self = this;

            // Get all inputs and attach them the rules passed in the element's class attribute.
            var $inputs = this.$el.find(this.settings.elements.join(', '));
            $inputs.each(function(index) {
                var $el = $(this);
                if($el.data('validation')) {
                    $inputs[index].rules = self.getRules($el.data('validation'));
                }
            });

            this.$inputs = $inputs;
            this.clearErrors();
            return this._do();
        },
        getRules: function(validations) {
            var rulesObj = {},
                rules    = [];
            
            validations = validations.match(/parsely\[(.*)\]/)[1];
            rules       = validations.match(/[^,\s]([^,]*)[^,\s]*/g);

            for(var i = 0, rule = null, len = rules.length; i < len; i+= 1) {
                if(rules[i].indexOf('[') !== -1) {
                    rule = rules[i].match(/(.*)\[(.*)\]/);
                    if(rule && rule[1] && rule[2]) {
                        rulesObj[rule[1]] = rule[2];
                    }
                }
                else {
                    rule = rules[i];
                    rulesObj[rule] = rule;
                }
            }

            return rulesObj;
        },
        clearErrors: function() {
            $('.parsely.error').remove();
        },
        _do: function() {
            // Assume everything is ok.
            var valid = true;

            if(!this.$inputs) {
                throw new Error('No inputs to validate.');
                return false;
            }

            for(var i = 0, len = this.$inputs.length; i < len; i += 1) {
                var input  = this.$inputs[i],
                    $input = $(input);

                if(input.rules) {
                    // First evaluate the required rule if it exists in the rules object.
                    if(input.rules['required'] && $input.val().trim() === '') {
                        if(!$input.required()) {
                            valid = false;

                            if($.parsely.settings.validationMode === 'all') continue;
                            else break;
                        }
                    }

                    for(var r in input.rules) {
                        var rule = input.rules[r];

                        switch(r) {
                            case 'email':
                                valid = $input.email();
                                break;
                        }

                        if(!valid) {
                            if($.parsely.settings.validationMode === 'all') continue;
                            else break;
                        }
                    }
                }

                if($.parsely.settings.validationMode === 'all') continue;
                else if(!valid) return valid;
            }

            return valid;
        }
    };

    $.fn.extend({
        parsely: function(method) {
            var args = arguments;

            return this.each(function() {
                if(_methods[method]) {
                    return _methods[method].apply(this, Array.prototype.slice.call(args, 1));
                }
                else if(typeof method === 'object' || !method) {
                    // Only applies to form elements.
                    if($.inArray(this.tagName.toLowerCase(), ['form', 'input'])) {
                        return _methods.init.apply(this, args);
                    }
                }
            });
        },
        required: function(msg) {
            return validate(
                this,
                function(obj) {
                    return $(obj).val() !== null && !!$(obj).val().length;
                },
                msg || $(this).data('required') || $.parsely.settings.messages.required
            );
        },
        email: function(msg) {
            return validate(
                this,
                function(obj) {
                    if($(obj).val()) {
                        return $(obj).val() !== null && $(obj).val().trim().match($.parsely.settings.emailRE) !== null;
                    }

                    return $(obj).required();
                },
                msg || $(this).data('email') || $.parsely.settings.messages.email
            );
        }
    });

    function validate($obj, validation, message) {
        if(!$.parsely.initialized) $obj.parsely();

        // Clear previous error messages.
        $('.' + $obj.attr('name') + '.parsely.error').remove();

        var $inputs = $obj.filter($.parsely.settings.elements.join(','));

        for(var i = 0, len = $inputs.length; i < len; i += 1) {
            // If validation is not passed throw error message.
            if(!validation($inputs[i])) {
                throwError($inputs[i], message);
                return false;
            }
        };

        return true;
    }

    function throwError(obj, message) {
        if($.parsely.settings.outputMode === 'inline') {
            var $error = $('<span class="' + $(obj).attr('name') + ' parsely error">' + format(obj, message) + '</span>');
            $(obj).after($error.hide());

            $error.show().fadeOut(0).fadeIn('fast');
        }
    }

    function format(obj, text) {
        return text.replace(/\${(.*)}/, capitalize($(obj).attr('name')));
    }

    function capitalize(text) {
        return text.substring(0, 1).toUpperCase() + text.substring(1);
    }
});