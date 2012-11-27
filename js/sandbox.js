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

var button_size = new Size(190, 25);
var button_corners = new Size(5, 5);
var button_text_offset = new Point(10, 17);
var button_hotkey_offset = new Point(button_size.width - 30, button_text_offset.y);

toolbox_layer.activate();
var toolbox_buttons_group = new Group();
default_layer.activate();

var toolbox_buttons = {};
var toolbox_button_posn_init = new Point(5, 5);
var toolbox_button_posn = new Point(toolbox_button_posn_init);

var tool_help = {};
var tool_hotkey_actions = {};
var tool_cleanup = {};

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
	if (hotkey) {
		hotkey_text.content = '[' + hotkey.toUpperCase() + ']';
	}
	hotkey_text.characterStyle.fillColor = 'white';

	return new Group([button, label_text, hotkey_text]);
}

function add_toolbox_button(name, label, hotkey, help_text) {
	toolbox_buttons[name] = make_button(label, hotkey, toolbox_button_posn);
	toolbox_buttons_group.addChild(toolbox_buttons[name]);

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
add_toolbox_button('pan_view', 'Pan', 'p', 'Drag.');
add_toolbox_button('show_neighbours', 'Neighbours', 'n', 'Hover.');
add_toolbox_spacer();
add_toolbox_button('run_dfs', 'Depth-first search', 'z', 'Click initial vertex.');
add_toolbox_button('run_bfs', 'Breadth-first search', 'x', 'Click initial vertex.');
add_toolbox_spacer();
add_toolbox_button('insert_binary_tree', 'Insert binary tree', 't', 'Click.');
add_toolbox_button('insert_complete_graph', 'Insert complete graph', null, 'Click.');
add_toolbox_button('insert_random_graph', 'Insert random graph', null, 'Click.');

var label_instructions = new PointText(toolbox_button_posn + new Point(5, 20));
label_instructions.fillColor = 'white';
label_instructions.content = '[L]: none, ID, degree';

tool_cleanup['show_neighbours'] = function () {
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

/***********************
 *  Animation control  *
 ***********************/

// Number of milliseconds to sleep between animation frames.
var animation_delay = 512;
var animation_delay_factor = 2;
var animation_delay_min = 1;
var animation_delay_max = 2048;

var animating = false;
var next_frame;

// Callbacks to execute at various points in the animation.
var animation_frame;
var animation_end;

// A reference to the animation_frame function for when we're paused.
var animation_frame_paused;

var animation_control_button_color_active = new HsbColor(200, 0.6, 0.5);
var animation_control_button_color_inactive = new HsbColor(200, 0.5, 0.3);

var animation_control_button_size = new Size(60, 50);
var animation_control_button_text_offset = new Point(animation_control_button_size.width / 2, 19);
var animation_control_button_hotkey_offset = new Point(animation_control_button_size.width / 2, animation_control_button_text_offset.y + 20);

toolbox_layer.activate();
var animation_control_buttons_group = new Group();
animation_control_buttons_group.visible = false;
default_layer.activate();

var animation_control_buttons = {};
var animation_control_button_posn = new Point(toolbox_button_posn_init.x + button_size.width + 10, toolbox_button_posn_init.y);

var animation_control_hotkey_actions = {};

function hotkey_display(hotkey) {
	if (hotkey == 'space') {
		return 'Space';
	} else {
		return hotkey.toUpperCase();
	}
}

function make_animation_control_button(label, hotkey, posn) {
	var rectangle = new Rectangle(posn, animation_control_button_size);

	var button = new Path.RoundRectangle(rectangle, button_corners);
	button.fillColor = animation_control_button_color_active;

	var label_text = new PointText(rectangle.point + animation_control_button_text_offset);
	label_text.justification = 'center';
	label_text.content = label;
	label_text.characterStyle.fillColor = 'white';

	var hotkey_text = new PointText(rectangle.point + animation_control_button_hotkey_offset);
	if (hotkey) {
		hotkey_text.content = '[' + hotkey_display(hotkey) + ']';
	}
	hotkey_text.justification = 'center';
	hotkey_text.characterStyle.fillColor = 'white';

	return new Group([button, label_text, hotkey_text]);
}

function add_animation_control_button(name, label, hotkey, alternate_hotkeys) {
	animation_control_buttons[name] = make_animation_control_button(label, hotkey, animation_control_button_posn);
	animation_control_buttons_group.addChild(animation_control_buttons[name]);

	if (hotkey) {
		animation_control_hotkey_actions[hotkey] = name;
	}

	if (alternate_hotkeys) {
		for (var i = 0; i < alternate_hotkeys.length; i++) {
			animation_control_hotkey_actions[alternate_hotkeys] = name;
		}
	}

	animation_control_button_posn.x += animation_control_button_size.width + 5;
}

function add_animation_control_spacer() {
	animation_control_button_posn.x += 10;
}

function set_animation_control_button_color(name, color) {
	animation_control_buttons[name].firstChild.fillColor = color;
}

function set_animation_control_button_label(name, label) {
	animation_control_buttons['play_pause'].children[1].content = label;
}

add_animation_control_button('stop', 'Stop', 'q');
add_animation_control_button('play_pause', 'Pause', 'space');
add_animation_control_spacer();
add_animation_control_button('slower', 'Slower', '-', ['_']);
add_animation_control_button('faster', 'Faster', '=', ['+']);

function get_time() {
	return new Date().getTime();
}

function animation_setup() {
	next_frame = get_time();

	animating = true;
	animation_control_buttons_group.visible = true;

	animation_unpause();
}

function animation_teardown() {
	if (animation_end) {
		animation_end();
	}

	animating = false;
	animation_control_buttons_group.visible = false;

	animation_frame = false;
	animation_end = false;
}

function animation_pause() {
	animation_frame_paused = animation_frame;
	animation_frame = false;

	set_animation_control_button_label('play_pause', 'Play');
}

function animation_unpause() {
	animation_frame = animation_frame_paused;
	animation_frame_paused = false;

	set_animation_control_button_label('play_pause', 'Pause');
}

function toggle_animation_pause() {
	if (animation_frame_paused) {
		animation_unpause();
	} else {
		animation_pause();
	}
}

function animation_action_dispatch(name) {
	switch (name) {
		case 'stop':
			animation_teardown();
			return;
		case 'play_pause':
			toggle_animation_pause();
			return;
		case 'slower':
			animation_delay *= animation_delay_factor;

			set_animation_control_button_color('faster', animation_control_button_color_active);

			if (animation_delay >= animation_delay_max) {
				animation_delay = animation_delay_max;

				set_animation_control_button_color('slower', animation_control_button_color_inactive);
			}

			return;
		case 'faster':
			animation_delay /= animation_delay_factor;

			set_animation_control_button_color('slower', animation_control_button_color_active);

			if (animation_delay <= animation_delay_min) {
				animation_delay = animation_delay_min;

				set_animation_control_button_color('faster', animation_control_button_color_inactive);
			}

			return;
	}
}

function onFrame(event) {
	if (animating && animation_frame) {
		if (get_time() < next_frame + animation_delay) {
			return;
		}

		animation_frame();

		next_frame = get_time();
	}
}

/***********
 *  Graph  *
 ***********/

// The size of the visual representation of a vertex.
var circle_radius = 20;

// Make separate layers for the vertices and edges and put them in a group.
var vertex_layer = new Layer();
var edge_layer = new Layer();
default_layer.activate();

var graph_group = new Group([edge_layer, vertex_layer]);

function VisualVertex(point) {
	Vertex.call(this);

	var circle = new Path.Circle(0, circle_radius);
	circle.fillColor = new HsbColor(Math.random() * 360, 0.5 + Math.random() * 0.3, 0.3 + Math.random() * 0.5);

	var label_text = new PointText(circle.position);
	label_text.characterStyle.fillColor = 'white';
	// Attempt to center the label in the vertex.
	label_text.position.y += 4;
	label_text.justification = 'center';

	vertex_layer.activate();
	this.image = new Group([circle, label_text]);
	default_layer.activate();

	this.image.position = point;
	this.set_default_appearance();
};

extend_class(Vertex, VisualVertex, {
	get_circle: function () {
		return this.image.children[0];
	},
	get_label: function () {
		return this.image.children[1];
	},
	get_position: function () {
		return this.image.position;
	},
	set_position: function (point) {
		this.image.position = point;

		return this;
	},
	set_default_appearance: function () {
		this.get_circle().strokeColor = 'black';
		this.get_circle().strokeWidth = 0;

		return this;
	},
	set_label: function (text) {
		this.get_label().content = text;

		return this;
	},
	highlight: function () {
		this.get_circle().strokeColor = new HsbColor(0, 0.85, 0.85);
		this.get_circle().strokeColor.hue = this.get_circle().fillColor.hue + 180;

		this.get_circle().strokeWidth = 5;

		return this;
	},
	unhighlight: function () {
		this.set_default_appearance();

		return this;
	},
	destroy: function () {
		this.image.remove();

		return this;
	}
});


function VisualEdge(v1, v2) {
	Edge.call(this, v1, v2);

	edge_layer.activate();
	this.image = new Path();
	default_layer.activate();

	this.image.add(new Point());
	this.image.add(new Point());

	this.set_default_appearance();
}

extend_class(Edge, VisualEdge, {
	set_default_appearance: function () {
		this.image.strokeColor = 'grey';
		this.image.strokeWidth = 2;

		return this;
	},
	move_end: function (v, point) {
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
	},
	highlight: function () {
		this.image.strokeColor = 'white';
		this.image.strokeWidth = 3;

		return this;
	},
	unhighlight: function () {
		this.set_default_appearance();

		return this;
	},
	destroy: function () {
		this.image.remove();

		return this;
	}
});


function VisualGraph(vertex_class, edge_class) {
	Graph.call(this, vertex_class, edge_class);

	// 0: none, 1: index, 2: degree
	this.vertex_label_mode = 0;
}

extend_class(Graph, VisualGraph, {
	add_vertex: function (point) {
		var n = Graph.prototype.add_vertex.call(this);

		this.get_vertex(n).set_position(point);
		this.set_vertex_label(n);

		return n;
	},
	move_vertex: function (v, point) {
		this.vertices[v].set_position(point);

		for (var i in this.edges[v]) {
			this.edges[v][i].move_end(v, point);
		}

		return this;
	},
	set_vertex_label: function (v) {
		var vertex = this.get_vertex(v);

		switch (this.vertex_label_mode) {
			case 0:
				vertex.set_label('');
				break;
			case 1:
				vertex.set_label(v);
				break;
			case 2:
				vertex.set_label(vertex.degree);
				break;
		}

		return this;
	},
	add_edge: function (v1, v2) {
		var edge = Graph.prototype.add_edge.call(this, v1, v2);

		if (!edge) {
			return false;
		}

		edge.move_end(v1, this.get_vertex(v1).get_position());
		edge.move_end(v2, this.get_vertex(v2).get_position());

		this.set_vertex_label(v1);
		this.set_vertex_label(v2);

		return edge;
	},
	remove_edge: function (v1, v2) {
		var edge = Graph.prototype.remove_edge.call(this, v1, v2);

		if (!edge) {
			return false;
		}

		edge.destroy();

		this.set_vertex_label(v1);
		this.set_vertex_label(v2);

		return edge;
	},
	// Get the vertex sitting at the given position, if there is one.
	vertex_at_position: function (point) {
		for (var i = this.vertices.length - 1; i >= 0; i--) {
			if (this.vertices[i].image.hitTest(point)) {
				return i;
			}
		}

		return false;
	},
	unhighlight_all: function () {
		for (var i = 0; i < this.vertices.length; i++) {
			this.vertices[i].unhighlight();

			for (var j in this.edges[i]) {
				this.edges[i][j].unhighlight();
			}
		}

		return this;
	},
	toggle_vertex_label_mode: function () {
		this.vertex_label_mode = (this.vertex_label_mode + 1) % 3;

		for (var i = 0; i < this.vertices.length; i++) {
			this.set_vertex_label(i);
		}

		return this;
	}
});

var G = new VisualGraph(VisualVertex, VisualEdge);

/*****************
 *  Interaction  *
 *****************/

// Don't draw too many points.
tool.minDistance = 20;

// Callbacks, configured elsewhere.
var drag_function;
var release_function;

// Start an edge action at a vertices, draw a path following the mouse, and
// call the completion callback end_function when the mouse is released.
function start_edge_action(start_vertex, color, end_function) {
	var path = new Path();
	path.strokeColor = color;
	path.add(G.get_vertex(start_vertex).get_position());

	drag_function = function (point) {
		path.add(point);
		path.smooth();
	}

	release_function = function (point) {
		path.remove();

		var end_vertex = G.vertex_at_position(point);

		if (end_vertex !== false) {
			end_function(start_vertex, end_vertex);
		}

		drag_function = false;
		release_function = false;
	}
}

// Start a search animation with the given step function.
function start_search(search_step) {
	disable_tools();
	animation_setup();

	animation_frame = function () {
		search_step();
	}

	animation_end = function () {
		G.unhighlight_all();

		enable_tools();
	}
}

function onKeyDown(event) {
	if (tools_enabled) {
		if (event.key in tool_hotkey_actions) {
			set_active_tool(tool_hotkey_actions[event.key]);

			return;
		}
	}

	if (animating) {
		if (event.key in animation_control_hotkey_actions) {
			animation_action_dispatch(animation_control_hotkey_actions[event.key]);

			return;
		}
	}

	switch (event.key) {
		case 'l':
			G.toggle_vertex_label_mode();
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

function insert_complete_graph(n, center_position, vertex_prob, edge_prob) {
	if (n <= 0) {
		return;
	}

	var angle_step, radius;

	if (n == 1) {
		angle_step = 0;
		radius = 0;
	} else {
		angle_step = 2 * Math.PI / n;
		radius = 1.5 * circle_radius / Math.sin(angle_step / 2);
	}

	var angle = -1 * angle_step;
	var vertices = [];

	for (var i = 0; i < n; i++) {
		angle += angle_step;

		if (vertex_prob !== undefined && Math.random() > vertex_prob) {
			continue;
		}

		var x = radius * Math.sin(angle);
		var y = -1 * radius * Math.cos(angle);

		vertices.push(G.add_vertex(center_position + new Point(x, y)));
	}

	for (var i = 0; i < vertices.length; i++) {
		for (var j = i + 1; j < vertices.length; j++) {
			if (edge_prob !== undefined && Math.random() > edge_prob) {
				continue;
			}

			G.add_edge(vertices[i], vertices[j]);
		}
	}
}

function insert_random_graph(max_n, center_position) {
	insert_complete_graph(max_n, center_position, 0.5, 0.5);
}

function onMouseMove(event) {
	if (!tools_enabled) {
		return;
	}

	switch (current_tool) {
		case 'show_neighbours':
			var vertex = G.vertex_at_position(event.point);

			tool_cleanup['show_neighbours']();

			if (vertex === false) {
				return;
			}

			var neighbours = G.neighbours(vertex);

			for (var i = 0; i < neighbours.length; i++) {
				G.get_vertex(neighbours[i]).highlight();
				G.get_edge(vertex, neighbours[i]).highlight();
			}

			return;
	}
}

function onMouseDown(event) {
	if (tools_enabled) {
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
				return;

			case 'move_vertex':
				var vertex = G.vertex_at_position(event.point);

				if (vertex === false) {
					return;
				}

				drag_function = function (point) {
					G.move_vertex(vertex, point);
				}

				release_function = function (point) {
					drag_function = false;
					release_function = false;
				}
				return;

			case 'remove_vertex':
				if (Key.isDown('shift')) {
					G.clear();
				} else {
					var vertex = G.vertex_at_position(event.point);

					if (vertex !== false) {
						G.remove_vertex(vertex);
					}
				}
				return;

			case 'add_edge':
				var vertex = G.vertex_at_position(event.point);

				if (vertex !== false) {
					start_edge_action(vertex, '#00ff00', bind(G, 'add_edge'));
				}
				return;

			case 'delete_edge':
				var vertex = G.vertex_at_position(event.point);

				if (vertex !== false) {
					start_edge_action(vertex, '#ff0000', bind(G, 'remove_edge'));
				}
				return;

			case 'pan_view':
				var root_point = graph_group.position - event.point;

				drag_function = function (point) {
					graph_group.position = root_point + point;
				}

				release_function = function (point) {
					drag_function = false;
					release_function = false;
				}
				return;

			case 'run_dfs':
				var vertex = G.vertex_at_position(event.point);

				if (vertex === false) {
					return;
				}

				var visited_vertices = {};
				var vertex_stack = [vertex];

				G.get_vertex(vertex).highlight();

				function dfs_step() {
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
					} else {
						// We're done with the search.
						animation_teardown();
					}
				}

				start_search(dfs_step);
				return;

			case 'run_bfs':
				var vertex = G.vertex_at_position(event.point);

				if (vertex === false) {
					return;
				}

				var visited_vertices = {};
				visited_vertices[vertex] = true;
				var highlighted_edges = [];
				var vertex_queue = [vertex];

				function bfs_step() {
					// Are we done with the search?
					if (vertex_queue.length == 0) {
						animation_teardown();

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
				return;

			case 'insert_binary_tree':
				insert_binary_tree(4, event.point);
				return;

			case 'insert_complete_graph':
				insert_complete_graph(7, event.point);
				return;

			case 'insert_random_graph':
				insert_random_graph(12, event.point);
				return;
		}
	}

	if (animating) {
		for (var i in animation_control_buttons) {
			if (animation_control_buttons[i].hitTest(event.point)) {
				animation_action_dispatch(i);

				return;
			}
		}
	}
}

function onMouseDrag(event) {
	if (drag_function) {
		drag_function(event.point);
	}
}

function onMouseUp(event) {
	if (release_function) {
		release_function(event.point);
	}
}
