// Obtain the local storage object if it is available.
//
// Returns null otherwise.
function get_local_storage() {
	try {
		var k = 'This seems like a silly key to want to store.';
		// Only works for string values.
		var v1 = '5';
		var v2;

		localStorage.setItem(k, v1);
		v2 = localStorage.getItem(k);
		localStorage.removeItem(k);

		if (v1 === v2) {
			return localStorage;
		}
	} catch (e) {
	}

	return null;
}
