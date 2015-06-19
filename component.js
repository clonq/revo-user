module.exports = function(){
    var _ = require('underscore');
    var schemaValidator = require('jsonschema');
    var userSchema = require('bonsens-models').user;
    var dao = require('daoi');

    this.init = function(config) {
        var self = this;
        var daoImpl = dao.use(dao.FILE);
        dao.register('user');
        this.params = _.defaults(config||{}, defaults)
        //todo: don't use setTimeout
        setTimeout(function(){
            process.emit('http.route:create', {path:'/activate/:activationKey', event:'user:activate'});
        }, 500)
        process.on('user:activate', function(pin){
console.log('user:activate', pin);
            impl.user.find({activationKey: pin.activationKey})
            .then(function(user){
console.log(user)
            })
            .catch(function(err){
console.log(err)
            });
        });
        process.on('user:update', function(user){
console.log('user:update', user);
        });
        process.on('user:findOne', function(criteria){
console.log('user:find', criteria);
            var searchKey = 'unknown';
            var searchValue = 'unknown';
            if(criteria instanceof Object) {
                searchKey = Object.keys(criteria);
                searchValue = criteria[searchKey];
            } else {
                console.log('TODO: "user:find" search by multiple criteria');
            }
            var eventOut = 'user:find.by.'+searchKey+'.'+searchValue+'.response';
            daoImpl.user.findOne(criteria)
            .then(function(user){
                process.emit(eventOut, user);
            })
            .catch(function(err){
                process.emit('user:find.error', err);
            })
        });
        process.on('user:register', function(pin){
            console.log('clonq/revo-user: user:register: ', pin);
            var pout = {};
            var errors = validate(pin);
            if(errors.length == 0) {
                daoImpl
                .user
                .create(pin)
                .then(function(user){
                    // set activation key and trigger send confirm email 
                    user.activationKey = user.$id.replace(/\-/g, '');
                    daoImpl
                    .user
                    .update(pin)
                    .then(function(user){
                        process.emit('email:send', {
                            template: 'confirmEmail',
                            data: {
                                to: user.email,
                                activationKey: user.activationKey
                            }
                        });
                    })
                    .catch(function(err){
                        pout.error = { message: err.message };
                        process.emit('user:register.response', pout);
                    })
                    // handle optional invite code
                    if(!!user.inviteCode) {
                        process.emit('invitation:process', {
                            code: user.inviteCode,
                            email: user.email
                        });
                    }
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
