// Order-independent array comparison.
function _setEqual(f, actual, expected, message) {
	var a = actual.slice();
	var e = expected.slice();

	a.sort();
	e.sort();

	return f(a, e, message);
}

function setEqual(actual, expected, message) {
	return _setEqual(deepEqual, actual, expected, message);
}

function notSetEqual(actual, expected, message) {
	return _setEqual(notDeepEqual, actual, expected, message);
}

test('setEqual', function () {
	setEqual([], []);
	setEqual([1], [1]);
	setEqual([1, 2], [1, 2]);
	setEqual([1, 2], [2, 1]);

	notSetEqual([], [1]);
	notSetEqual([2], [1]);
	notSetEqual([1, 2], [1]);
});
