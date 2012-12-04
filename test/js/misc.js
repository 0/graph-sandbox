test('bind', function () {
	var F = function (x) {
		this.x = x;
	};

	F.prototype.f = function () {
		return this.x;
	}

	var a1 = new F(2357);
	var a2 = new F(1113);

	equal(a1.f(), 2357);
	equal(a2.f(), 1113);

	equal(bind(a1, 'f')(), 2357);
	equal(bind(a2, 'f')(), 1113);
});

test('extend_class', function () {
	var A = function (x) {
		this.x = x;
	};

	A.prototype = {
		f: function () {
			return this.x;
		},
		h: function () {
			return 2 * this.x;
		}
	};

	var B = function (x, y) {
		A.call(this, x);

		this.y = y;
	};

	extend_class(A, B, {
		// New method.
		g: function () {
			return this.y;
		},
		// Override.
		h: function () {
			return 3 * this.x;
		}
	});

	var a = new A(1719);
	var b = new B(2329, 3137);

	ok(a instanceof A);
	ok(!(a instanceof B));
	ok(b instanceof A);
	ok(b instanceof B);

	equal(a.f(), 1719);
	equal(a.g, undefined);
	equal(a.h(), 3438);
	equal(b.f(), 2329);
	equal(b.g(), 3137);
	equal(b.h(), 6987);
});

test('make_uid_function', function () {
	var f1 = make_uid_function();
	var f2 = make_uid_function();

	var uids1 = {}, uids2 = {};

	for (var i = 0; i < 1000; i++) {
		var n1 = f1(), n2 = f2();

		ok(!(n1 in uids1), n1);
		ok(!(n2 in uids2), n2);

		uids1[n1] = true;
		uids2[n2] = true;
	}
});
