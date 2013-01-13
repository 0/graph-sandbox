// Find the square of the minimum distance from the point p1 to the point p2.
//
// Each of the arguments should be an object with x and y properties.
function distanceToPoint(p1, p2) {
	var dx = p2.x - p1.x;
	var dy = p2.y - p1.y;

	return dx * dx + dy * dy;
}

// Find the square of the minimum distance from the point p to the line segment
// with endpoints s1 and s2.
//
// Each of the arguments should be an object with x and y properties.
function distanceToLineSegment(s1, s2, p) {
	if (s1.x == s2.x && s1.y == s2.y) {
		// Point.
		return distanceToPoint(s1, p);
	} else if (s1.y == s2.y) {
		// Horizontal.
		var left, right;

		if (s1.x < s2.x) {
			left = s1;
			right = s2;
		} else {
			left = s2;
			right = s1;
		}

		if (left.x <= p.x && p.x <= right.x) {
			// Point is above or below the segment.
			var dy = p.y - s1.y;

			return dy * dy;
		} else if (p.x < left.x) {
			// Point is to the left.
			return distanceToPoint(left, p);
		} else {
			// Point is to the right.
			return distanceToPoint(right, p);
		}
	} else if (s1.x == s2.x) {
		// Vertical.
		var up, down;

		if (s1.y < s2.y) {
			up = s1;
			down = s2;
		} else {
			up = s2;
			down = s1;
		}

		if (up.y <= p.y && p.y <= down.y) {
			// Point is left or right of the segment.
			var dx = p.x - s1.x;

			return dx * dx;
		} else if (p.y < up.y) {
			// Point is above.
			return distanceToPoint(up, p);
		} else {
			// Point is below.
			return distanceToPoint(down, p);
		}
	} else {
		// Arbitary slope.

		// Slope of normal to line segment.
		var n = (s1.x - s2.x) / (s2.y - s1.y);

		// Bounds on the "good" y value of p.
		var min, max;
		var y1 = s1.y + n * (p.x - s1.x);
		var y2 = s2.y + n * (p.x - s2.x);

		if (y1 < y2) {
			min = s1;
			max = s2;
		} else {
			min = s2;
			max = s1;

			var temp = y1;
			y1 = y2;
			y2 = temp;
		}

		if (y1 <= p.y && p.y <= y2) {
			// Point is within the region where the normal crosses the line
			// segment.
			var m = -1 / n;
			var k = m * (p.x - s1.x) - (p.y - s1.y);

			return (k * k) / (m * m + 1);
		} else if (p.y < y1) {
			// Point is above.
			return distanceToPoint(min, p);
		} else {
			// Point is below.
			return distanceToPoint(max, p);
		}
	}
}
