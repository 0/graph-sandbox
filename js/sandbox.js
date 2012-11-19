/*************
 *  Toolbox  *
 *************/

var current_tool;
var tools_enabled = true;

var button_color_inactive = new HsbColor(250, 0.6, 0.45);
var button_color_active = new HsbColor(120, 0.6, 0.45);

var button_size = new Size(180, 25);
var button_corners = new Size(5, 5);
var button_text_offset = new Point(10, 17);
var button_hotkey_offset = new Point(button_size.width - 30, button_text_offset.y);

var toolbox_buttons = {};
var toolbox_button_posn = new Point(10, 10);

var tool_help = {};
var tool_hotkey_actions = {};

var tool_help_text = new PointText(toolbox_button_posn + new Point(button_size.width + 10, 15));
tool_help_text.characterStyle.fillColor = 'white';

function make_button(label, hotkey, posn) {
	var rectangle = new Rectangle(posn, button_size);

	var button = new Path.RoundRectangle(rectangle, button_corners);
	button.fillColor = button_color_inactive;

	var label_text = new PointText(rectangle.point + button_text_offset);
	label_text.content = label;
	label_text.characterStyle.fillColor = 'white';

	var hotkey_text = new PointText(rectangle.point + button_hotkey_offset);
	hotkey_text.content = '[' + hotkey.toUpperCase() + ']';
	hotkey_text.characterStyle.fillColor = 'white';

	return new Group([button, label_text, hotkey_text]);
}

function add_toolbox_button(name, label, hotkey, help_text) {
	toolbox_buttons[name] = make_button(label, hotkey, toolbox_button_posn);
	tool_hotkey_actions[hotkey] = name;
	tool_help[name] = help_text;

	toolbox_button_posn.y += button_size.height + 5;
}

function add_toolbox_spacer() {
	toolbox_button_posn.y += 10;
}

add_toolbox_button('add_vertex', 'Add vertex', 'v', 'Click.');
add_toolbox_button('move_vertex', 'Move vertex', 'm', 'Drag a vertex.');
add_toolbox_button('remove_vertex', 'Remove vertex', 'r', 'Click. Shift-click to clear.');
add_toolbox_button('add_edge', 'Add edge', 'e', 'Drag from vertex to vertex.');
add_toolbox_button('delete_edge', 'Delete edge', 'd', 'Drag from vertex to vertex.');
add_toolbox_spacer();
add_toolbox_button('run_dfs', 'Depth-first search', 'z', 'Click initial vertex.');
add_toolbox_button('run_bfs', 'Breadth-first search', 'x', 'Click initial vertex.');
add_toolbox_spacer();
add_toolbox_button('insert_binary_tree', 'Insert binary tree', 'b', 'Click.');

function set_button_color(button, color) {
	button.firstChild.fillColor = color;
}

function draw_help_text(text) {
	tool_help_text.content = text;
}

function set_active_tool(name) {
	if (current_tool) {
		set_button_color(toolbox_buttons[current_tool], button_color_inactive);
	}

	current_tool = name;
	set_button_color(toolbox_buttons[current_tool], button_color_active);

	if (tool_help[name]) {
		draw_help_text(tool_help[name]);
	} else {
		draw_help_text('');
	}
}

function toggle_tool_status(enabled) {
	for (var i in toolbox_buttons) {
		toolbox_buttons[i].opacity = enabled ? 1.0 : 0.7;
	}
}

function enable_tools() {
	tools_enabled = true;
	toggle_tool_status(tools_enabled);
}

function disable_tools() {
	tools_enabled = false;
	toggle_tool_status(tools_enabled);
}

set_active_tool('add_vertex');

/***********
 *  Graph  *
 ***********/

// Array of Group objects corresponding to the vertices.
var vertices = [];

// Object of Path objects. The keys are of the form 'eA:B' where A and B are
// indices into the vertices array, and A < B. The first point of the path is
// always at A, and the last is always at B.
var edges = {};

// Make a separate layer for the edges.
var default_layer = project.activeLayer;
var edge_layer = new Layer();
edge_layer.moveBelow(default_layer);
default_layer.activate();

function make_edge_name(vertex1, vertex2) {
	return 'e' + Math.min(vertex1, vertex2) + ':' + Math.max(vertex1, vertex2);
}

function parse_edge_name(name) {
	var colon = name.indexOf(':');

	return [parseInt(name.substring(1, colon), 10), parseInt(name.substring(colon+1), 10)];
}

function vertex_circle(vertex) {
	return vertices[vertex].children[0];
}

function vertex_label(vertex) {
	return vertices[vertex].children[1];
}

function set_default_vertex_appearance(vertex) {
	c = vertex_circle(vertex);
	c.strokeColor = 'black';
	c.strokeWidth = 0;
}

function set_default_edge_appearance(name) {
	edges[name].strokeColor = 'grey';
	edges[name].strokeWidth = 2;
}

function add_vertex(coords) {
	var circle = new Path.Circle(0, 20);
	circle.fillColor = new HsbColor(Math.random() * 360, 0.7, 0.5);

	var label_text = new PointText(circle.position);
	label_text.content = vertices.length;
	label_text.characterStyle.fillColor = 'white';

	var group = new Group([circle, label_text]);
	group.position = coords;

	vertices.push(group);

	set_default_vertex_appearance(vertices.length - 1);

	return vertices.length - 1;
}

function move_vertex(vertex, point) {
	// Move the vertex itself.
	vertices[vertex].position = point;

	// Move all the edges incident to the vertex.
	for (var i in edges) {
		var edge_vertices = parse_edge_name(i);

		if (edge_vertices[0] == vertex) {
			edges[i].removeSegment(0);
			edges[i].insert(0, point);
		} else if (edge_vertices[1] == vertex) {
			last_segment = edges[i].segments.length - 1;

			edges[i].removeSegment(last_segment);
			edges[i].insert(last_segment, point);
		}
	}
}

function remove_vertex(vertex) {
	// Get rid of the vertex by shuffling all the vertices that have greater
	// indices.
	vertices[vertex].remove();
	vertices.splice(vertex, 1);

	// Update all the labels on the later vertices.
	for (var i = vertex; i < vertices.length; i++) {
		vertex_label(i).content = i;
	}

	// Keep track of all the edges that will need to be re-created with new
	// end-points.
	var temp_edges = [];

	for (var i in edges) {
		var edge_vertices = parse_edge_name(i);

		if (edge_vertices[0] == vertex || edge_vertices[1] == vertex) {
			// This edge doesn't exist anymore, so just remove it.
			delete_edge(edge_vertices[0], edge_vertices[1]);
		} else if (edge_vertices[0] > vertex || edge_vertices[1] > vertex) {
			// This edge still exists, but at least one of the vertices has had
			// its index decremented.
			var v1 = edge_vertices[0] - (edge_vertices[0] > vertex ? 1 : 0);
			var v2 = edge_vertices[1] - (edge_vertices[1] > vertex ? 1 : 0);

			temp_edges.push([v1, v2]);

			delete_edge(edge_vertices[0], edge_vertices[1]);
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

function vertex_neighbours(vertex) {
	var result = [];

	for (var i in edges) {
		var edge_vertices = parse_edge_name(i);

		if (edge_vertices[0] == vertex) {
			result.push(edge_vertices[1]);
		} else if (edge_vertices[1] == vertex) {
			result.push(edge_vertices[0]);
		}
	}

	return result;
}

function highlight_vertex(vertex) {
	vertex_circle(vertex).strokeColor = new HsbColor(vertex_circle(vertex).fillColor);
	vertex_circle(vertex).strokeColor.hue += 180;

	vertex_circle(vertex).strokeWidth = 5;
}

function unhighlight_vertex(vertex) {
	set_default_vertex_appearance(vertex);
}

function add_edge(start, end) {
	var name = make_edge_name(start, end);

	// Not if it already exists or if it connects a vertex with itself.
	if (edges[name] || start == end) {
		return;
	}

	// Make sure the path is always in the same direction as the edge name.
	if (start > end) {
		temp = start;
		start = end;
		end = temp;
	}

	edge_layer.activate();

	var path = new Path();
	path.strokeColor = 'grey';

	path.add(vertex_circle(start).position);
	path.add(vertex_circle(end).position);

	edges[name] = path;

	default_layer.activate();

	set_default_edge_appearance(name);
}

function delete_edge(start, end) {
	var name = make_edge_name(start, end);

	// Not if it doesn't exist.
	if (!edges[name]) {
		return;
	}

	edges[name].remove();
	delete edges[name];
}

function highlight_edge(vertex1, vertex2) {
	var name = make_edge_name(vertex1, vertex2);

	edges[name].strokeColor = 'white';
	edges[name].strokeWidth = 3;
}

function unhighlight_edge(vertex1, vertex2) {
	var name = make_edge_name(vertex1, vertex2);

	set_default_edge_appearance(name);
}

/*****************
 *  Interaction  *
 *****************/

// Don't draw too many points.
tool.minDistance = 20;

// Number of milliseconds to sleep between animation frames.
var animation_delay = 500;

// Callbacks, configured elsewhere.
var dragFunction;
var releaseFunction;
var frameFunction;

function get_time() {
	return new Date().getTime();
}

// Start an edge action at a vertices, draw a path following the mouse, and
// call the completion callback end_function when the mouse is released.
function start_edge_action(start_vertex, color, end_function) {
	var path = new Path();
	path.strokeColor = color;
	path.add(vertex_circle(start_vertex).position);

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

// Start a search animation with the given step function.
function start_search(search_step) {
	disable_tools();

	var next_frame = get_time() + animation_delay;

	frameFunction = function() {
		if (get_time() < next_frame) {
			return;
		} else {
			next_frame = get_time() + animation_delay;
		}

		search_step();
	}
}

function stop_search() {
	enable_tools();
	frameFunction = false;
}

function onKeyDown(event) {
	if (event.key in tool_hotkey_actions) {
		set_active_tool(tool_hotkey_actions[event.key]);

		return;
	}
}

function insert_binary_tree(depth, root_position) {
	var step = 60;
	var parents = [];
	var next_parents = [];

	for (var i = 0; i < depth; i++) {
		var depth_step = step * Math.pow(2, depth - i - 1);
		var left_pos = -1 * depth_step * (Math.pow(2, i - 1) - 1 / 2);

		for (var j = 0; j < Math.pow(2, i); j++) {
			var cur = add_vertex(root_position + new Point(left_pos, 50 * i));
			next_parents.push(cur);

			// The root doesn't have any parents.
			if (parents.length > 0) {
				add_edge(cur, parents[Math.floor(j / 2)]);
			}

			left_pos += depth_step;
		}

		parents = next_parents;
		next_parents = [];
	}
}

function onMouseDown(event) {
	if (!tools_enabled) {
		return;
	}

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

		case 'move_vertex':
		var vertex = vertex_at_posn(event.point);

		if (vertex === false) {
			break;
		}

		dragFunction = function(point) {
			move_vertex(vertex, point);
		}

		releaseFunction = function(point) {
			dragFunction = false;
			releaseFunction = false;
		}
		break;

		case 'remove_vertex':
		if (Key.isDown('shift')) {
			while (vertices.length > 0) {
				remove_vertex(0);
			}
		} else {
			var vertex = vertex_at_posn(event.point);

			if (vertex !== false) {
				remove_vertex(vertex);
			}
		}
		break;

		case 'add_edge':
		var vertex = vertex_at_posn(event.point);

		if (vertex !== false) {
			start_edge_action(vertex, '#00ff00', add_edge);
		}
		break;

		case 'delete_edge':
		var vertex = vertex_at_posn(event.point);

		if (vertex !== false) {
			start_edge_action(vertex, '#ff0000', delete_edge);
		}
		break;

		case 'run_dfs':
		var vertex = vertex_at_posn(event.point);

		if (vertex === false) {
			break;
		}

		var visited_vertices = {};
		var vertex_stack = [vertex];

		highlight_vertex(vertex);

		function dfs_step() {
			// Are we done with the search?
			if (vertex_stack.length == 0) {
				// Unhighlight all vertices.
				for (var i in visited_vertices) {
					unhighlight_vertex(i);
				}

				stop_search();

				return;
			}

			// Visit the top-most vertex on the stack.
			var current_vertex = vertex_stack[vertex_stack.length - 1];
			visited_vertices[current_vertex] = true;

			// Visit the next neighbour.
			var neighbours = vertex_neighbours(current_vertex);

			for (var i = 0; i < neighbours.length; i++) {
				if (!(neighbours[i] in visited_vertices)) {
					highlight_vertex(neighbours[i]);
					highlight_edge(neighbours[i], current_vertex);
					vertex_stack.push(neighbours[i]);

					return;
				}
			}

			// All neighbours have been visited, so backtrack.
			vertex_stack.pop();

			if (vertex_stack.length > 0) {
				// Unhighlight the edge along which we're backtracking.
				unhighlight_edge(current_vertex, vertex_stack[vertex_stack.length - 1]);
			}
		}

		start_search(dfs_step);
		break;

		case 'run_bfs':
		var vertex = vertex_at_posn(event.point);

		if (vertex === false) {
			break;
		}

		var visited_vertices = {};
		visited_vertices[vertex] = true;
		var highlighted_edges = [];
		var vertex_queue = [vertex];

		function bfs_step() {
			// Are we done with the search?
			if (vertex_queue.length == 0) {
				// Unhighlight all vertices and edges.
				for (var i in visited_vertices) {
					unhighlight_vertex(i);
				}

				for (var i = 0; i < highlighted_edges.length; i++) {
					unhighlight_edge(highlighted_edges[i][0], highlighted_edges[i][1]);
				}

				stop_search();

				return;
			}

			// Visit the first vertex in the queue.
			var current_vertex = vertex_queue.splice(0, 1);
			highlight_vertex(current_vertex);

			// Queue all the neighbours.
			var neighbours = vertex_neighbours(current_vertex);

			for (var i = 0; i < neighbours.length; i++) {
				if (!(neighbours[i] in visited_vertices)) {
					highlight_edge(neighbours[i], current_vertex);
					highlighted_edges.push([neighbours[i], current_vertex]);

					vertex_queue.push(neighbours[i]);

					// Make sure that it doesn't get queued again.
					visited_vertices[neighbours[i]] = true;
				}
			}
		}

		start_search(bfs_step);
		break;

		case 'insert_binary_tree':
		insert_binary_tree(4, event.point);
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

function onFrame(event) {
	if (frameFunction) {
		frameFunction();
	}
}
