module.exports = function(){
    var _ = require('underscore');
    this.init = function(config) {
        var that = this;
        this.params = _.defaults(config||{}, defaults)
    }
}

var defaults = module.exports.defaults = {
    models: [user]
}
