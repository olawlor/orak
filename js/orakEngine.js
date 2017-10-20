/*
 The orak javascript game engine.
 Public Domain 2017
*/
"use strict";

/**
 This is the class used for the orakEngine singleton.
*/
var orakEngineClass=function() {
	this.version="2017-10-18 Pre-alpha"; ///< Version of game engine.
	this.allTypesUsed={};  ///< Every known type
	this.factories={}; ///< Registered factory functions, indexed by URL and family name.
	this.factoriesLoading={}; ///< factory URLs currently being loaded
	this.postponedCreates={}; ///< Arrays of types waiting to be created
	this.debugPrint=10; ///< Debug messages at or above this level will be printed
	this.printDiv=null;
};

/** Debug tracing function: */
orakEngineClass.prototype.debug=function(debugLevel,string) {
	if (debugLevel>=this.debugPrint)
		console.log("debug> "+string);
}

/** Print function: */
orakEngineClass.prototype.print=function(string) {
	console.log("print> "+string);
	if (this.printDiv) this.printDiv.innerHTML+=string+"<br>";
}

/**
Create a new object from a type string.
An object's "orakType" string is specified as:
	- The URL for its .js code.
	- A question mark character (like cgi, but not sent to server)
	- A family name string, which is passed directly to the factory callback.

Example relative URL:
	testMonster.js?mooschior
Example absolute URL:
	https://olawlor.github.io/orak/2017/forest.js?sq'Urel

Example call to createObject:
\code
orakEngine.createObject("https://olawlor.github.io/orak/2017/forest.js?sq'Urel",
	{}, 
	function(newSquirrel) {
		orakEngine.creatures.push(newSquirrel);
	}
);
\endcode
*/
orakEngineClass.prototype.createObject=function(orakType,options,next)
{
	// Break orakType into URL and family name
	var split=orakType.split("?");
	if (split.length!=2) throw ("orakEngine.createObject called with invalid type "+orakType);
	var url=split[0];
	var name=split[1];

	// Always add the type, url, and name to the options:
	options.orakType=orakType;
	options.orakTypeURL=url;
	options.orakTypeName=name;
	
	if (!this.factories[url]) 
	{ // That URL has no factory yet
		orakEngine.debug(7,"createObject postponed until load: "+orakType);

		// We will need to postpone the create call
		options.next=next;
		if (!this.postponedCreates[url])
			this.postponedCreates[url]=[];
		this.postponedCreates[url].push(options);
		
		if (!this.factoriesLoading[url]) 
		{ // Start loading that URL:
			orakEngine.debug(9,"loading js from URL "+url);
			this.factoriesLoading[url]=name;
			var loader=document.createElement('script');
			loader.setAttribute('type','text/javascript');
			loader.setAttribute('src',url);
			document.head.appendChild(loader);
		}
		return;
	}
	
	orakEngine.debug(3,"createObject "+orakType);
	this.createObjectAtFactory(options,next);
}

/** 
 Internal function to create an object at an existing factory.
*/
orakEngineClass.prototype.createObjectAtFactory=function(options,next)
{
	var url=options.orakTypeURL;
	var name=options.orakTypeName;
	
	if (!this.factories[url]) 
	{ 
		throw("orakEngine.createObjectAtFactory passed invalid URL "+url);
	}
	if (!this.factories[url][name]) 
	{ 
		throw("orakEngine.createObjectAtFactory passed invalid URL?name "+url+"?"+name);
	}
	this.allTypesUsed[options.orakType]=options;
	
	this.factories[url][name](name,options,next);
}


/**
A JavaScript file that defines new object types should call this
to register the "factory" functions that creates each new object type.

This is the classic call to registerFactory:

\code
orakEngine.registerFactories("testMonster.js", {
"sq'Urel" : function(familyNameString,options,next) {
		return next(new sqUrel(options));
	}
});
\endcode
*/
orakEngineClass.prototype.registerFactories=function(relativeUrl,nameToFactory)
{
	// Disambiguate URL based on loaded factories:
	var url=null;
	for (var absoluteUrl in this.factoriesLoading) {
		if (absoluteUrl.endsWith(relativeUrl)) {
			url=absoluteUrl;
			delete this.factoriesLoading[url];
		}
	}
	orakEngine.debug(9,"register new factories for "+relativeUrl+" = "+url);
	
	if (!url) {
		throw ("orakEngineClass.registerFactories received an invalid relative URL "+relativeUrl);
	}

	if (this.factories[url]) {
		throw ("orakEngineClass.registerFactories registration of duplicate factory "+url);
	}
	
	this.factories[url]=nameToFactory;

	// Check for waiting creates:
	if (this.postponedCreates[url]) {
		var options;
		while (options=this.postponedCreates[url].shift()) {
			orakEngine.debug(7,"finally creating postponed object "+options.orakType);
			this.createObjectAtFactory(options,options.next);
		}
		delete this.postponedCreates[url];
	}
}

/**
 The engine can be called like "orakEngine" from anywhere.
*/
window.orakEngine=new orakEngineClass();


