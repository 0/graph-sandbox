function Point(xy, invert) {
	if (invert) {
		this.x = xy[1];
		this.y = xy[0];
	} else {
		this.x = xy[0];
		this.y = xy[1];
	}
}

var tolerance = 1e-3;

function run_dtp_test(p1, p2, d) {
	var result = distance_to_point(new Point(p1), new Point(p2));
	var diff = Math.abs(result - d);

	ok(diff < tolerance, d + ':' + result);
}

test('distance_to_point', function () {
	run_dtp_test([2, 2], [2, 2], 0);
	run_dtp_test([2, 2], [2, 1], 1);
	run_dtp_test([2, 2], [1, 2], 1);
	run_dtp_test([2, 2], [1, 1], 2);
	run_dtp_test([2, 2], [0, 0], 8);
});

function _run_dtls_test(s1, s2, p, d, invert) {
	var s1p = new Point(s1, invert);
	var s2p = new Point(s2, invert);
	var pp = new Point(p, invert);

	var result = distance_to_line_segment(s1p, s2p, pp);
	var diff = Math.abs(result - d);

	ok(diff < tolerance, d + ':' + result + ' (' + (invert ? '' : 'non-') + 'inverted)');
}

function run_dtls_test(s1, s2, p, d) {
	_run_dtls_test(s1, s2, p, d, false);
	_run_dtls_test(s1, s2, p, d, true);
}

test('distance_to_line_segment', function () {
	// Line segment is a point.
	run_dtls_test([2, 2], [2, 2], [2, 2], 0);
	run_dtls_test([2, 2], [2, 2], [2, 3], 1);
	run_dtls_test([2, 2], [2, 2], [1, 2], 1);
	run_dtls_test([2, 2], [2, 2], [1, 1], 2);
	run_dtls_test([2, 2], [2, 2], [0, 9], 53);

	// Horizontal/vertical line segment.
	run_dtls_test([2, 2], [8, 2], [0, 2], 4);
	run_dtls_test([2, 2], [8, 2], [0, 3], 5);
	run_dtls_test([2, 2], [8, 2], [1, 2], 1);

	run_dtls_test([2, 2], [8, 2], [2, 2], 0);
	run_dtls_test([2, 2], [8, 2], [5, 2], 0);
	run_dtls_test([2, 2], [8, 2], [5, 0], 4);
	run_dtls_test([8, 2], [2, 2], [5, 2], 0);
	run_dtls_test([2, 2], [8, 2], [8, 2], 0);

	run_dtls_test([2, 2], [8, 2], [9, 2], 1);
	run_dtls_test([2, 2], [8, 2], [10, 2], 4);
	run_dtls_test([8, 2], [2, 2], [10, 2], 4);
	run_dtls_test([8, 2], [2, 2], [10, 1], 5);

	// Sloped line segments.
	run_dtls_test([1, 1], [5, 7], [1, 1], 0);
	run_dtls_test([1, 1], [5, 7], [3, 4], 0);
	run_dtls_test([1, 1], [5, 7], [5, 7], 0);

	run_dtls_test([1, 1], [2, 2], [0, 0], 2);
	run_dtls_test([1, 1], [2, 2], [1, 2], 0.5);
	run_dtls_test([1, 1], [2, 2], [4, 4], 8);

	run_dtls_test([0, 0], [10, 2], [-0.2, 1], 1.04);
	run_dtls_test([0, 0], [10, 2], [4.8, 2], 1.04);
	run_dtls_test([0, 0], [10, 2], [5.2, 0], 1.04);
	run_dtls_test([0, 0], [10, 2], [10.2, 1], 1.04);

	run_dtls_test([0, 0], [10, 2], [-1, 5], 26);
	run_dtls_test([0, 0], [10, 2], [4, 6], 26);
	run_dtls_test([0, 0], [10, 2], [6, -4], 26);
	run_dtls_test([0, 0], [10, 2], [11, -3], 26);

	run_dtls_test([0, 0], [10, 2], [-2, 10], 104);
	run_dtls_test([0, 0], [10, 2], [3, 11], 104);
	run_dtls_test([0, 0], [10, 2], [7, -9], 104);
	run_dtls_test([0, 0], [10, 2], [12, -8], 104);

	run_dtls_test([0, 1], [30, 0], [20, 0], 0.111);
});
