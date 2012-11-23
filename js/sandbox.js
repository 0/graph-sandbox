/**********
 *  Misc  *
 **********/

// Assume that Function.bind doesn't exist.
function bind(context, name) {
	return function () {
		return context[name].apply(context, arguments);
	};
}

/*************
 *  Toolbox  *
 *************/

// Make a separate layer for the toolbox.
var default_layer = project.activeLayer;
var toolbox_layer = new Layer();
toolbox_layer.moveAbove(default_layer);
default_layer.activate();

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
var tool_cleanup = {};

var tool_help_text = new PointText(toolbox_button_posn + new Point(button_size.width + 10, 15));
tool_help_text.characterStyle.fillColor = 'white';

function make_button(label, hotkey, posn) {
	var rectangle = new Rectangle(posn, button_size);

	toolbox_layer.activate();

	var button = new Path.RoundRectangle(rectangle, button_corners);
	button.fillColor = button_color_inactive;

	var label_text = new PointText(rectangle.point + button_text_offset);
	label_text.content = label;
	label_text.characterStyle.fillColor = 'white';

	var hotkey_text = new PointText(rectangle.point + button_hotkey_offset);
	if (hotkey) {
		hotkey_text.content = '[' + hotkey.toUpperCase() + ']';
	}
	hotkey_text.characterStyle.fillColor = 'white';

	var g = new Group([button, label_text, hotkey_text]);

	default_layer.activate();

	return g;
}

function add_toolbox_button(name, label, hotkey, help_text) {
	toolbox_buttons[name] = make_button(label, hotkey, toolbox_button_posn);
	if (hotkey) {
		tool_hotkey_actions[hotkey] = name;
	}
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
add_toolbox_button('show_adjacent', 'Adjacent vertices', null, 'Hover.');
add_toolbox_button('show_incident', 'Incident edges', null, 'Hover.');
add_toolbox_spacer();
add_toolbox_button('run_dfs', 'Depth-first search', 'z', 'Click initial vertex.');
add_toolbox_button('run_bfs', 'Breadth-first search', 'x', 'Click initial vertex.');
add_toolbox_spacer();
add_toolbox_button('insert_binary_tree', 'Insert binary tree', 't', 'Click.');

tool_cleanup['show_adjacent'] = function () {
	G.unhighlight_all();
};

tool_cleanup['show_incident'] = function () {
	G.unhighlight_all();
};

function set_button_color(button, color) {
	button.firstChild.fillColor = color;
}

function draw_help_text(text) {
	tool_help_text.content = text;
}

function set_active_tool(name) {
	if (current_tool) {
		set_button_color(toolbox_buttons[current_tool], button_color_inactive);

		if (current_tool in tool_cleanup) {
			tool_cleanup[current_tool]();
		}
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
	tools_enabled = enabled;
	tool_help_text.visible = enabled;

	for (var i in toolbox_buttons) {
		toolbox_buttons[i].opacity = enabled ? 1.0 : 0.7;
	}
}

function enable_tools() {
	toggle_tool_status(true);
}

function disable_tools() {
	toggle_tool_status(false);
}

set_active_tool('add_vertex');

/***********
 *  Graph  *
 ***********/

// Make a separate layer for the edges.
var edge_layer = new Layer();
edge_layer.moveBelow(default_layer);
default_layer.activate();

function Vertex(point, label) {
	var circle = new Path.Circle(0, 20);
	circle.fillColor = new HsbColor(Math.random() * 360, 0.7, 0.5);

	var label_text = new PointText(circle.position);
	label_text.content = label;
	label_text.characterStyle.fillColor = 'white';
	// Attempt to center the label in the vertex.
	label_text.position.y += 4;
	label_text.justification = 'center';

	var group = new Group([circle, label_text]);
	group.position = point;

	this.image = group;

	this.set_default_appearance();
};

Vertex.prototype.get_circle = function () {
	return this.image.children[0];
};

Vertex.prototype.get_label = function () {
	return this.image.children[1];
};

Vertex.prototype.get_position = function () {
	return this.image.position;
};

Vertex.prototype.set_position = function (point) {
	this.image.position = point;

	return this;
};

Vertex.prototype.set_default_appearance = function () {
	this.get_circle().strokeColor = 'black';
	this.get_circle().strokeWidth = 0;

	return this;
};

Vertex.prototype.set_label = function (text) {
	this.get_label().content = text;

	return this;
};

Vertex.prototype.highlight = function () {
	this.get_circle().strokeColor = new HsbColor(this.get_circle().fillColor);
	this.get_circle().strokeColor.hue += 180;

	this.get_circle().strokeWidth = 5;

	return this;
};

Vertex.prototype.unhighlight = function () {
	this.set_default_appearance();

	return this;
};

Vertex.prototype.destroy = function () {
	this.image.remove();

	return this;
};

function Edge(v1, v2, point1, point2) {
	edge_layer.activate();

	var path = new Path();
	path.add(point1);
	path.add(point2);

	default_layer.activate();

	this.v1 = v1;
	this.v2 = v2;
	this.image = path;

	this.set_default_appearance();
}

Edge.prototype.set_default_appearance = function () {
	this.image.strokeColor = 'grey';
	this.image.strokeWidth = 2;

	return this;
};

Edge.prototype.move_end = function (v, point) {
	var im = this.image;

	if (this.v1 == v) {
		im.removeSegment(0);
		im.insert(0, point);
	} else if (this.v2 == v) {
		last_segment = im.segments.length - 1;

		im.removeSegment(last_segment);
		im.insert(last_segment, point);
	}

	return this;
};

Edge.prototype.highlight = function () {
	this.image.strokeColor = 'white';
	this.image.strokeWidth = 3;

	return this;
};

Edge.prototype.unhighlight = function () {
	this.set_default_appearance();

	return this;
};

Edge.prototype.destroy = function () {
	this.image.remove();

	return this;
};

function Graph() {
	// Array of Group objects corresponding to the vertices.
	this.vertices = [];

	// Array of objects of Edge objects, implementing an adjacency list.
	//
	// Each element corresponds to the element of the vertices array with the same
	// index. The keys of each element are also indices into the vertices array,
	// where the presence of a key signifies the existence of an edge between the
	// two vertices.
	//
	// The values of each element are the Edge objects for the edges. Note that
	// each is stored twice (once in the list of each vertex incident to the edge).
	this.edges = [];
}

Graph.prototype.add_vertex = function (point) {
	var n = this.vertices.length;
	var v = new Vertex(point, n);

	this.vertices.push(v);
	this.edges.push({});

	return n;
};

Graph.prototype.get_vertex = function (v) {
	return this.vertices[v];
};

Graph.prototype.move_vertex = function (v, point) {
	this.vertices[v].set_position(point);

	for (var i in this.edges[v]) {
		this.edges[v][i].move_end(v, point);
	}

	return this;
};

Graph.prototype.remove_vertex = function (v) {
	// Get rid of the vertex by shuffling all the vertices that have greater
	// indices.
	this.vertices[v].destroy();
	this.vertices.splice(v, 1);

	// Update all the labels on the later vertices.
	for (var i = v; i < this.vertices.length; i++) {
		this.vertices[i].set_label(i);
	}

	// Remove all the edges connected to this vertex.
	for (var i in this.edges[v]) {
		this.edges[v][i].destroy();

		delete this.edges[i][v];
	}

	this.edges.splice(v, 1);

	// Adjust all the later vertex indices.
	for (var i = 0; i < this.edges.length; i++) {
		var new_edge = {};

		for (var j in this.edges[i]) {
			var edge = this.edges[i][j];

			new_edge[j > v ? j - 1 : j] = edge;

			// Only update each Edge object once.
			if (i < j) {
				if (edge.v1 > v) {
					edge.v1--;
				}

				if (edge.v2 > v) {
					edge.v2--;
				}
			}
		}

		this.edges[i] = new_edge;
	}

	return this;
};

Graph.prototype.add_edge = function (v1, v2) {
	// Not if it already exists or if it connects a vertex with itself.
	if (v2 in this.edges[v1] || v1 == v2) {
		return;
	}

	var e = new Edge(v1, v2, this.vertices[v1].get_position(), this.vertices[v2].get_position());

	this.edges[v1][v2] = e;
	this.edges[v2][v1] = e;

	return this;
};

Graph.prototype.get_edge = function (v1, v2) {
	return this.edges[v1][v2];
};

Graph.prototype.remove_edge = function (v1, v2) {
	// Not if it doesn't exist.
	if (!(v2 in this.edges[v1])) {
		return;
	}

	this.edges[v1][v2].destroy();

	delete this.edges[v1][v2];
	delete this.edges[v2][v1];

	return this;
};

Graph.prototype.neighbours = function (v) {
	var result = [];

	for (var i in this.edges[v]) {
		result.push(i);
	}

	return result;
};

// Remove all vertices and edges.
Graph.prototype.clear = function () {
	while (this.vertices.length > 0) {
		this.remove_vertex(0);
	}

	return this;
}

// Get the vertex sitting at the given position, if there is one.
Graph.prototype.vertex_at_position = function (point) {
	for (var i = this.vertices.length - 1; i >= 0; i--) {
		if (this.vertices[i].image.hitTest(point)) {
			return i;
		}
	}

	return false;
};

Graph.prototype.unhighlight_all = function () {
	for (var i = 0; i < this.vertices.length; i++) {
		this.vertices[i].unhighlight();

		for (var j in this.edges[i]) {
			this.edges[i][j].unhighlight();
		}
	}

	return this;
};

var G = new Graph();

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
	path.add(G.get_vertex(start_vertex).get_position());

	dragFunction = function (point) {
		path.add(point);
		path.smooth();
	}

	releaseFunction = function (point) {
		path.remove();

		var end_vertex = G.vertex_at_position(point);

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

	frameFunction = function () {
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
			var cur = G.add_vertex(root_position + new Point(left_pos, 50 * i));
			next_parents.push(cur);

			// The root doesn't have any parents.
			if (parents.length > 0) {
				G.add_edge(cur, parents[Math.floor(j / 2)]);
			}

			left_pos += depth_step;
		}

		parents = next_parents;
		next_parents = [];
	}
}

function onMouseMove(event) {
	if (!tools_enabled) {
		return;
	}

	switch (current_tool) {
		case 'show_adjacent':
			var vertex = G.vertex_at_position(event.point);

			if (vertex === false) {
				break;
			}

			tool_cleanup['show_adjacent']();

			var neighbours = G.neighbours(vertex);

			for (var i = 0; i < neighbours.length; i++) {
				G.get_vertex(neighbours[i]).highlight();
			}

			break;

		case 'show_incident':
			var vertex = G.vertex_at_position(event.point);

			if (vertex === false) {
				break;
			}

			tool_cleanup['show_incident']();

			var neighbours = G.neighbours(vertex);

			for (var i = 0; i < neighbours.length; i++) {
				G.get_edge(vertex, neighbours[i]).highlight();
			}

			break;
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
			G.add_vertex(event.point);
			break;

		case 'move_vertex':
			var vertex = G.vertex_at_position(event.point);

			if (vertex === false) {
				break;
			}

			dragFunction = function (point) {
				G.move_vertex(vertex, point);
			}

			releaseFunction = function (point) {
				dragFunction = false;
				releaseFunction = false;
			}
			break;

		case 'remove_vertex':
			if (Key.isDown('shift')) {
				G.clear();
			} else {
				var vertex = G.vertex_at_position(event.point);

				if (vertex !== false) {
					G.remove_vertex(vertex);
				}
			}
			break;

		case 'add_edge':
			var vertex = G.vertex_at_position(event.point);

			if (vertex !== false) {
				start_edge_action(vertex, '#00ff00', bind(G, 'add_edge'));
			}
			break;

		case 'delete_edge':
			var vertex = G.vertex_at_position(event.point);

			if (vertex !== false) {
				start_edge_action(vertex, '#ff0000', bind(G, 'remove_edge'));
			}
			break;

		case 'run_dfs':
			var vertex = G.vertex_at_position(event.point);

			if (vertex === false) {
				break;
			}

			var visited_vertices = {};
			var vertex_stack = [vertex];

			G.get_vertex(vertex).highlight();

			function dfs_step() {
				// Are we done with the search?
				if (vertex_stack.length == 0) {
					G.unhighlight_all();

					stop_search();

					return;
				}

				// Visit the top-most vertex on the stack.
				var current_vertex = vertex_stack[vertex_stack.length - 1];
				visited_vertices[current_vertex] = true;

				// Visit the next neighbour.
				var neighbours = G.neighbours(current_vertex);

				for (var i = 0; i < neighbours.length; i++) {
					if (!(neighbours[i] in visited_vertices)) {
						G.get_vertex(neighbours[i]).highlight();
						G.get_edge(neighbours[i], current_vertex).highlight();

						vertex_stack.push(neighbours[i]);

						return;
					}
				}

				// All neighbours have been visited, so backtrack.
				vertex_stack.pop();

				if (vertex_stack.length > 0) {
					// Unhighlight the edge along which we're backtracking.
					G.get_edge(current_vertex, vertex_stack[vertex_stack.length - 1]).unhighlight();
				}
			}

			start_search(dfs_step);
			break;

		case 'run_bfs':
			var vertex = G.vertex_at_position(event.point);

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
					G.unhighlight_all();

					stop_search();

					return;
				}

				// Visit the first vertex in the queue.
				var current_vertex = vertex_queue.splice(0, 1)[0];
				G.get_vertex(current_vertex).highlight();

				// Unhighlight the edge that caused it to be visited.
				if (highlighted_edges.length > 0) {
					var edge = highlighted_edges.splice(0, 1)[0];
					G.get_edge(edge[0], edge[1]).unhighlight();
				}

				// Queue all the neighbours.
				var neighbours = G.neighbours(current_vertex);

				for (var i = 0; i < neighbours.length; i++) {
					if (!(neighbours[i] in visited_vertices)) {
						G.get_edge(neighbours[i], current_vertex).highlight();
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
