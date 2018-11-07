Element.prototype.Animation = function(keyframes, options, cb){
    let element = this;
    let callback;

    if(cb){
        if(options && options.iterations && options.iterations == 1) {
            callback = setTimeout(function(){
                cb();
            }, options.duration ? options.duration : 0);
        } else if(options.iterations > 1 && options.iterations !== 'Infinity'){
            var runTime = 0;
            callback = setInterval(function(){
                runTime++;
                cb();

                if(runTime == options.iterations) {
                    clearInterval(callback);
                }
            }, options.duration ? options.duration : 0);
        } else {
            callback = setInterval(function(){
                cb();
            }, options.duration ? options.duration : 0);
        }
    }

    return this.animate(
        keyframes,
        options
    );
}