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
            return new $.validator(this, options);
        },
        validate: function(options) {
            var validator = _methods.init.apply(this);
            this.valid    = validator.validate(options);

            return this;
        },
        min: function(msg, params) {
            return validate(
                $(this),
                function(obj) {
                    if($(obj).val().trim()) {
                        return $(obj).val().trim().length >= params;
                    }

                    return false;
                },
                msg || $(this).data('min') || $.validator.settings.messages.min,
                {
                    field: $(this).attr('name'),
                    min: params
                }
            );
        }
    };

    $.validator = function(element, options) {
        var validator  = this,
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
                // Validate form on submission.
                autoValidate: true,
                messages:{
                    required: '${field} is required.',
                    email   : 'Email format not valid.',
                    min     : '${field} requires to be at least ${min} characters long'
                },
                rules: {},
                emailRE: /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i
            };
        
        validator.version     = _VERSION;
        validator.initialized = false;
        validator.settings    = {};
        validator.el          = element;
        validator.$el         = $element;
        validator.valid       = true;
        validator.$inputs     = {};
        validator.inputs      = {};
        validator.out         = '';

        validator.init = function() {
            $.validator.settings = validator.settings = $.extend({}, defaults, options);
            var inputs           = validator.$el.find(validator.settings.elements.join(', '));

            // Get all inputs and attach them the rules passed in the element's class attribute.
            validator.$inputs = {};
            validator.rules   = $.validator.settings.rules;

            // Export $inputs array.
            $.validator.inputs = {};

            for(var i = 0, len = inputs.length; i < len; i += 1) {
                validator.$inputs[inputs[i].id]  = inputs[i];
                
                $.validator.inputs[inputs[i].id] = {
                    name      : inputs[i].id,
                    hasErrors : false,
                    rules     : []
                };
            }

            // If element is a form, prevent submission before validation.
            if(element.tagName.toLowerCase() === 'form') {
                $(element).on('submit', function() {
                    return false;
                }).on('submit', function() {
                    validator.validate();
                });
            }
            
            $.validator.initialized = true;
        };

        validator.init();
    };

    $.validator.prototype = {
        validate: function(options) {
            this.clearErrors();
            return this._validate();
        },

        /**
         * Get rules from data-validation attribute.
         * 
         * @param  Array validations Array of validations rules.
         * @return Object validations rules object generated.
         */
        getRules: function(validations) {
            var rulesObj = {},
                rules    = [];
            
            validations = validations.match(/validator\[(.*)\]/)[1];
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
            // Rease hasError flag in inputs.
            if($.validator.inputs) {
                for(var i in $.validator.inputs) {
                    $.validator.inputs[i].hasErrors = false;
                }
            }

            $('.validator.error, .error-list').remove();
        },
        _validate: function() {
            // Assume everything is OK.
            var valid = true;

            if(!this.$inputs) {
                throw new Error('No inputs to validate.');
                return false;
            }

            for(var r in this.rules) {
                // If there is a rule defined for this field, then validate it.
                if(this.$inputs[r]) {
                    var input  = this.$inputs[r],
                        $input = $(input),
                        rules  = this.rules[r];

                    for(var i = 0, len = rules.length; i < len; i += 1) {
                        var ruleObj   = rules[i];
                        var rule      = null;
                        var message   = '';
                        var validator = null;
                        var params    = null;

                        if($.isPlainObject(ruleObj)) {
                            $.each(ruleObj, function(r, v) {
                                rule      = r;

                                if($.isPlainObject(v)) {
                                    message   = v.message || '';
                                    validator = v.validate || null;
                                }
                                else {
                                    params = v;
                                }
                            });
                        }
                        else {
                            rule = ruleObj;
                        }

                        if(validator && $.type(validator) === 'function') {
                            valid = validate(
                                $input,
                                validator,
                                message || $input.data('required') || $.validator.settings.messages.required
                            );
                        }
                        else {
                            switch(rule) {
                                case 'required':
                                    valid = $input.required(message);
                                    break;
                                case 'email':
                                    valid = $input.email(message);
                                    break;
                                case 'min':
                                    valid = $input.validate('min', message, params);
                                    break;
                            }
                        }

                        // Just run the first rule.
                        if(valid && ($.validator.settings.validationMode === 'all' || $.validator.settings.validationMode === 'single_all')) {
                            continue;
                        }
                        else {
                            break;
                        }
                    }
                }

                if(!valid && ($.validator.settings.validationMode === 'single' || $.validator.settings.validationMode === 'single_all')) {
                    break;
                }
            }

            return valid;
        }
    };

    $.fn.extend({
        validate: function(method) {
            var args = arguments;

            return this.each(function() {
                if(_methods[method]) {
                    return _methods[method].apply(this, Array.prototype.slice.call(args, 1));
                }
                else if(typeof method === 'object' || !method) {
                    // Only applies to form elements.
                    if($.inArray(this.tagName.toLowerCase(), ['form', 'input']) > -1) {
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
                msg || $(this).data('required') || $.validator.settings.messages.required
            );
        },
        email: function(msg) {
            return validate(
                this,
                function(obj) {
                    if($(obj).val()) {
                        return $(obj).val() !== null && $(obj).val().trim().match($.validator.settings.emailRE) !== null;
                    }

                    return $(obj).required();
                },
                msg || $(this).data('email') || $.validator.settings.messages.email
            );
        }
    });

    function validate($obj, validation, message, replacement) {
        if(!$.validator.initialized) $obj.validator();

        // Clear previous error messages.
        $('.' + $obj.attr('name') + '.validator.error').remove();

        if(!validation($obj)) {
            throwError($obj, message, replacement);
            return false;
        }

        return true;
    }

    function throwError(obj, message, replacement) {
        if($.validator.settings.outputMode === 'inline') {
            var $error = $('<li><span class="' + $(obj).attr('name') + ' validator error">' + format(obj, message, replacement) + '</span></li>');
            var $ul    = null;

            if($.validator.inputs[$(obj).attr('name')].hasErrors === false) {
                $ul = $('<ul class="error-list" data-id="' + $(obj).attr('name') + '-errors"></ul>');
                $(obj).after($ul);
            }
            else {
                $ul = $('ul.error-list[data-id="' + $(obj).attr('name') + '-errors"]');
            }

            $ul.append($error);
            $error.hide().show().fadeOut(0).fadeIn('fast');

            $.validator.inputs[$(obj).attr('name')].hasErrors = true;
        }
    }

    function format(obj, text, replacement) {
        if(replacement){
            for(var i in replacement) {
                var re = new RegExp("\\${(" + i + ")}", 'gi');

                if(i === 'field') {
                    text = text.replace(re, capitalize(replacement[i]));
                }
                else {
                    text = text.replace(re, replacement[i]);
                }
            }

            return text;
        }

        return text.replace(/\${(field)}/, capitalize($(obj).attr('name')));
    }

    function capitalize(text) {
        return text.substring(0, 1).toUpperCase() + text.substring(1);
    }
});