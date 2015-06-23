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
            process.emit('http.route:create', { path:'/activate/:activationKey', trigger:'user:activate', webpage:'/'});
        }, 500)
        process.on('user:login', function(pin){
            var pout = {};
            daoImpl
            .user
            .findOne({email: pin.email})
            .then(function(user){
                if(user) {
                    console.log(user)
                    //todo: do proper password checking
                    if(user.password === pin.password) {
                        delete user.password;
                        delete user.activationKey;
                        delete user.inviteCode;
                        pout.user = user;
                    } else {
                        pout.error = { message: 'Invalid credentials' };
                    }
                } else {
                    pout.error = { message: 'No such user' };
                }
                process.emit('user:login.response', pout);
            })
            .catch(function(err){
                pout.error = { message: err.message };
                process.emit('user:login.response', pout);
            })
        });
        process.on('user:activate', function(pin){
            var pout = {};
            daoImpl.user.findOne({activationKey: pin.activationKey})
            .then(function(user){
                user.status = 'active';
                daoImpl.user.update(user)
                .then(function(){
                    process.emit('web:flow', { action: 'user:activated'} );
                })
                .catch(function(err){
                    pout.error = { message: err.message };
                    process.emit('user:activate.response', pout);
                });
            })
            .catch(function(err){
                pout.error = { message: err.message };
                process.emit('user:activate.response', pout);
            });
        });
        // process.on('user:update', function(user){
        // });
        process.on('user:findOne', function(criteria){
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
                    user.status = 'pending activation';
                    // set activation key and trigger send confirm email 
                    user.activationKey = user.$id.replace(/\-/g, '');
                    daoImpl
                    .user
                    .update(pin)
                    .then(function(user){
                        process.emit('notification:email', {
                            template: 'confirmEmail',
                            data: {
                                to: user.email,
                                activationKey: user.activationKey
                            }
                        });
                        //todo listen to email response event
                        process.emit('web:flow', { action: 'user:confirm' });
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
            supportedMethods: ['activate', 'find', 'findOne', 'register']
        }
    }
}
