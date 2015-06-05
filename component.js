module.exports = function(){
    var _ = require('underscore');
    this.init = function(config) {
        var that = this;
        this.params = _.defaults(config||{}, defaults)
        process.on('user:register', function(pin){
        	console.log('clonq/revo-user: user:register: ', pin)
        	var pout = {
        		success: {
        			message: "user has been registered successfuly"
        		}
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
