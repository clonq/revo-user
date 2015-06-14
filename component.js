module.exports = function(){
    var _ = require('underscore');
    var schemaValidator = require('jsonschema');
    var userSchema = require('bonsens-models').user;
    var dao = require('daoi');

    this.init = function(config) {
        var self = this;
        var daoImpl = dao.use(dao.MEMORY);
        this.params = _.defaults(config||{}, defaults)
        process.on('user:update', function(user){
console.log('user:update', user);
        });
        process.on('user:find', function(criteria){
console.log('user:find', criteria);
            // fake search result
            process.emit('user:find.by.email.'+criteria.email+'.response', {fake: 'user'});//todo
            // daoImpl.user.find(pin)
            // .then(function(user){
            // })
            // .catch(function(err){
            // })
        });
        process.on('user:register', function(pin){
            console.log('clonq/revo-user: user:register: ', pin);
            var pout = {};
            var errors = validate(pin);
            if(errors.length == 0) {
                dao.register('user');
                daoImpl.user.create(pin)
                .then(function(user){
                    if(!!user.inviteCode) {
                        var invitationPayload = {
                            code: user.inviteCode,
                            email: user.email
                        };
                        process.emit('invitation:process', invitationPayload);
                    }
                    // pout = {
                    //     user: user,
                    //     success: {
                    //         message: "user has been registered successfully"
                    //     }
                    // }
                    // process.emit('user:register.response', pout);
                })
                .catch(function(err){
                    pout.error = { message: err.message };
                    process.emit('user:register.response', pout);
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
    models: {
        user: {
            supportedMethods: ['register', 'find']
        }
    }
}
