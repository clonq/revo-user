module.exports = function(){
    var _ = require('underscore');
    this.init = function(config) {
        var that = this;
        this.params = _.defaults(config||{}, defaults)
        process.on('user:register', function(payload){
        	console.log('clonq/revo-user: user:register: ', payload)
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
