/*************
 *  Toolbox  *
 *************/

var current_tool;

var button_color_inactive = new HsbColor(250, 0.6, 0.45);
var button_color_active = new HsbColor(120, 0.6, 0.45);

var button_size = new Size(150, 40);
var button_corners = new Size(5, 5);
var button_text_offset = new Point(10, 25);
var button_hotkey_offset = new Point(button_size.width - 30, 25);

function make_button(label, hotkey, x, y) {
	var rectangle = new Rectangle(new Point(x, y), button_size);

	var button = new Path.RoundRectangle(rectangle, button_corners);
	button.fillColor = button_color_inactive;

	var label_text = new PointText(rectangle.point + button_text_offset);
	label_text.content = label;
	label_text.characterStyle.fillColor = 'white';

	var hotkey_text = new PointText(rectangle.point + button_hotkey_offset);
	hotkey_text.content = '[' + hotkey + ']';
	hotkey_text.characterStyle.fillColor = 'white';

	return new Group([button, label_text, hotkey_text]);
}

var toolbox_buttons =
	{ add_vertex: make_button('Add vertex', 'V', 10, 10)
	, remove_vertex: make_button('Remove vertex', 'R', 10, 55)
	, add_edge: make_button('Add edge', 'E', 10, 100)
	, remove_edge: make_button('Remove edge', 'D', 10, 145)
}

function set_button_color(button, color) {
	button.firstChild.fillColor = color;
}

function set_active_tool(name) {
	if (current_tool) {
		set_button_color(toolbox_buttons[current_tool], button_color_inactive);
	}

	current_tool = name;
	set_button_color(toolbox_buttons[current_tool], button_color_active);
}

set_active_tool('add_vertex');

/***********
 *  Graph  *
 ***********/

// Array of Circle objects corresponding to the vertices.
var vertices = [];

// Object of Path objects. The keys are of the form 'eA:B' where A and B are
// indices into the vertices array, and A < B.
var edges = {};

function make_edge_name(vertex1, vertex2) {
	return 'e' + Math.min(vertex1, vertex2) + ':' + Math.max(vertex1, vertex2);
}

function parse_edge_name(name) {
	var colon = name.indexOf(':');

	return [parseInt(name.substring(1, colon), 10), parseInt(name.substring(colon+1), 10)];
}

function add_vertex(coords) {
	var vertex_circle = new Path.Circle(coords, 20);
	vertex_circle.fillColor = new HsbColor(Math.random() * 360, 0.7, 0.5);

	vertices.push(vertex_circle);
}

function remove_vertex(vertex) {
	// Get rid of the vertex by shuffling all the vertices that have greater
	// indices.
	vertices[vertex].remove();
	vertices.splice(vertex, 1);

	// Keep track of all the edges that will need to be re-created with new
	// end-points.
	var temp_edges = [];

	for (var i in edges) {
		var edge_vertices = parse_edge_name(i);

		if (edge_vertices[0] == vertex || edge_vertices[1] == vertex) {
			// This edge doesn't exist anymore, so just remove it.
			remove_edge(edge_vertices[0], edge_vertices[1]);
		} else if (edge_vertices[0] > vertex || edge_vertices[1] > vertex) {
			// This edge still exists, but at least one of the vertices has had
			// its index decremented.
			var v1 = edge_vertices[0] - (edge_vertices[0] > vertex ? 1 : 0);
			var v2 = edge_vertices[1] - (edge_vertices[1] > vertex ? 1 : 0);

			temp_edges.push([v1, v2]);

			remove_edge(edge_vertices[0], edge_vertices[1]);
		}
	}

	// Re-create the necessary edges.
	for (var i = 0; i < temp_edges.length; i++) {
		add_edge(temp_edges[i][0], temp_edges[i][1]);
	}
}

// Get the vertex sitting at the given position, if there is one.
function vertex_at_posn(point) {
	for (var i = 0; i < vertices.length; i++) {
		if (vertices[i].hitTest(point)) {
			return i;
		}
	}

	return false;
}

function add_edge(start, end) {
	var name = make_edge_name(start, end);

	// Not if it already exists.
	if (edges[name]) {
		return;
	}

	var path = new Path();
	path.strokeColor = 'white';

	path.add(vertices[start].position);
	path.add(vertices[end].position);

	edges[name] = path;
}

function remove_edge(start, end) {
	var name = make_edge_name(start, end);

	// Not if it doesn't exist.
	if (!edges[name]) {
		return;
	}

	edges[name].remove();
	delete edges[name];
}

/*****************
 *  Interaction  *
 *****************/

// Don't draw too many points.
tool.minDistance = 20;

// Callbacks configured on the initial mouse press.
var dragFunction;
var releaseFunction;

// Start an edge action at a vertices, draw a path following the mouse, and
// call the completion callback end_function when the mouse is released.
function start_edge_action(start_vertex, color, end_function) {
	var path = new Path();
	path.strokeColor = color;
	path.add(vertices[start_vertex].position);

	dragFunction = function(point) {
		path.add(point);
		path.smooth();
	}

	releaseFunction = function(point) {
		path.remove();

		var end_vertex = vertex_at_posn(point);

		if (end_vertex !== false) {
			end_function(start_vertex, end_vertex);
		}

		dragFunction = false;
		releaseFunction = false;
	}
}

function onKeyDown(event) {
	switch (event.key) {
		// Toggle tools using hotkeys.
		case 'v':
		set_active_tool('add_vertex');
		break;

		case 'r':
		set_active_tool('remove_vertex');
		break;

		case 'e':
		set_active_tool('add_edge');
		break;

		case 'd':
		set_active_tool('remove_edge');
		break;
	}
}

function onMouseDown(event) {
	// Toolbox buttons always take precedence.
	for (var i in toolbox_buttons) {
		if (toolbox_buttons[i].hitTest(event.point)) {
			set_active_tool(i);

			return;
		}
	}

	// Clicked elsewhere, so make use of the current tool.
	switch (current_tool) {
		case 'add_vertex':
		add_vertex(event.point);
		break;

		case 'remove_vertex':
		var vertex = vertex_at_posn(event.point);

		if (vertex !== false) {
			remove_vertex(vertex);
		}
		break;

		case 'add_edge':
		var vertex = vertex_at_posn(event.point);

		if (vertex !== false) {
			start_edge_action(vertex, '#00ff00', add_edge);
		}
		break;

		case 'remove_edge':
		var vertex = vertex_at_posn(event.point);

		if (vertex !== false) {
			start_edge_action(vertex, '#ff0000', remove_edge);
		}
		break;
	}
}

function onMouseDrag(event) {
	if (dragFunction) {
		dragFunction(event.point);
	}
}

function onMouseUp(event) {
	if (releaseFunction) {
		releaseFunction(event.point);
	}
}
