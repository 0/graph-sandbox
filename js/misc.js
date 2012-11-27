// Assume that Function.bind doesn't exist.
function bind(context, name) {
	return function () {
		return context[name].apply(context, arguments);
	};
}

// Make Sub a subclass of Sup with the additional properties.
function extend_class(Sup, Sub, properties) {
	// Avoid making an instance of Sub, since that would execute its
	// constructor.
	var temp = function () { };
	temp.prototype = Sup.prototype;

	Sub.prototype = new temp();
	Sub.prototype.constructor = Sub;

	for (var i in properties) {
		// Overwrite any conflicting properties.
		Sub.prototype[i] = properties[i];
	}
}
