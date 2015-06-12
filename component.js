module.exports = function(){
    var _ = require('underscore');
    var schemaValidator = require('jsonschema');
    var userSchema = require('bonsens-models').user;
    var dao = require('daoi');

    this.init = function(config) {
        var that = this;
        this.params = _.defaults(config||{}, defaults)
        process.on('user:register', function(pin){
            console.log('clonq/revo-user: user:register: ', pin);
            var pout = {};
            var errors = validate(pin);
            if(errors.length == 0) {
                var impl = dao.use(dao.MEMORY);
                dao.register('user');
                impl.user.create(pin)
                .then(function(user){
                    pout = {
                        user: user,
                        success: {
                            message: "user has been registered successfully"
                        }
                    }
                    process.emit('user:register.response', pout);
                })
                .catch(function(err){
                    done(err);
                })
            } else {
                pout.error = { message: errors[0].message };
                process.emit('user:register.response', pout);
            }
        })
    }

    function validate(payload) {
        // userSchema.required = ['name', 'email', 'password'];
        var schemaErrors = schemaValidator.validate(payload, userSchema).errors;
        if(schemaErrors.length > 0) return schemaErrors;
        var dataErrors = [];
        if(payload.name.length == 0) dataErrors.push({message:'name is mandatory'});
        if(payload.email.length == 0) dataErrors.push({message:'email is mandatory'});
        if(payload.password.length == 0) dataErrors.push({message:'password is mandatory'});
        return dataErrors
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
