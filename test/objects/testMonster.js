var sqUrel=function(options) {
	console.log("Created sqUrel");
}

orakEngine.registerFactories("testMonster.js", {
"sq'Urel" : function(familyNameString,options,next) {
		return next(new sqUrel(options));
	}
});
