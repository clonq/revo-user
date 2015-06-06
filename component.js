module.exports = function(){
    var _ = require('underscore');
    var validate = require('jsonschema').validate;
    var userSchema = require('bonsens-models').user;
    this.init = function(config) {
        var that = this;
        this.params = _.defaults(config||{}, defaults)
        process.on('user:register', function(pin){
            console.log('clonq/revo-user: user:register: ', pin);
            // userSchema.required = ['name', 'email', 'password'];
            var pout = {
                error: {}
            }
            var errors = validate(pin, userSchema).errors;
            if(errors.length == 0) {
                pout = {
                    success: {
                        message: "user has been registered successfully"
                    }
                }
            } else {
                pout.error.message = errors[0].message;
            }
            process.emit('user:register.response', pout);
        })
    }
}

var defaults = module.exports.defaults = {
    listen: 'user:register',
    models: {
        user: {
            supportedMethods: ['register']
        }
    }
}
