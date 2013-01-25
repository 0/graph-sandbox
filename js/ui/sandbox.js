var store = get_local_storage();

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
var tool_setup = {};
var tool_data = {};
var tool_cleanup = {};

toolbox_layer.activate();
var tool_help_text = new PointText(toolbox_button_posn + new Point(button_size.width + 10, 15));
default_layer.activate();

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
add_toolbox_button('move_vertex', 'Move vertex', 'm', 'Drag a vertex. Selection is moved together.');
add_toolbox_button('remove_vertex', 'Remove vertex', 'r', 'Click. Selection is removed together.');
add_toolbox_button('add_edge', 'Add edge', 'e', 'Drag from vertex to vertex.');
add_toolbox_button('delete_edge', 'Delete edge', 'd', 'Drag from vertex to vertex.');
add_toolbox_button('change_weight', 'Change edge weight', 'w', 'Click (with shift) to make heavier (lighter).');
add_toolbox_spacer();
add_toolbox_button('select', 'Select', 's', 'Click or drag. Hold shift to toggle (click) or add (drag).');
add_toolbox_button('show_neighbours', 'Neighbours', 'n', 'Hover.');
add_toolbox_spacer();
add_toolbox_button('run_dfs', 'Depth-first search', 'z', 'Click initial vertex. Optionally drag to target.');
add_toolbox_button('run_bfs', 'Breadth-first search', 'x', 'Click initial vertex. Optionally drag to target.');
add_toolbox_button('run_dijkstra', "Dijkstra's algorithm", 'j', 'Click initial vertex. Optionally drag to target.');
add_toolbox_button('run_prim_jarnik', "Prim-Jarnik algorithm", 'p', 'Click initial vertex.');
add_toolbox_button('run_kruskal', "Kruskal's algorithm", 'k', 'Click just about anywhere.');
add_toolbox_spacer();
add_toolbox_button('insert_binary_tree', 'Insert binary tree', '1', 'Click.');
add_toolbox_button('insert_complete_graph', 'Insert complete graph', '2', 'Click.');
add_toolbox_button('insert_random_graph', 'Insert random graph', '3', 'Click.');

var extra_instructions_offset = new Point(5, 20);

function add_extra_instructions(contents) {
	var text = new PointText(toolbox_button_posn + extra_instructions_offset);

	text.fillColor = 'white';
	text.content = contents;

	extra_instructions_offset.y += 20;
}

add_extra_instructions('[L]: none, ID, degree');
add_extra_instructions('[del]: remove selection');
add_extra_instructions('[ctrl/apple + A]: select all');
add_extra_instructions('(ctrl/apple + drag) to pan');
add_extra_instructions('(ctrl/apple + shift + drag) to scale/rotate');

tool_setup['change_weight'] = function () {
	tool.minDistance = 2;
};

tool_cleanup['change_weight'] = function () {
	tool.minDistance = default_minDistance;

	G.unhighlight_all();
};

tool_cleanup['show_neighbours'] = function () {
	G.unhighlight_all();
};

tool_cleanup['run_dfs'] = function () {
	G.unhighlight_all();
};

tool_cleanup['run_bfs'] = function () {
	G.unhighlight_all();
};

tool_cleanup['run_dijkstra'] = function () {
	G.unhighlight_all();
};

tool_cleanup['run_prim_jarnik'] = function () {
	G.unhighlight_all();
};

tool_cleanup['run_kruskal'] = function () {
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

		tool_data = {};
	}

	current_tool = name;
	set_button_color(toolbox_buttons[current_tool], button_color_active);

	if (tool_help[name]) {
		draw_help_text(tool_help[name]);
	} else {
		draw_help_text('');
	}

	if (current_tool in tool_setup) {
		tool_setup[current_tool]();
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

function set_animation_delay(value) {
	animation_delay = value;

	// Assume both buttons are active again.
	set_animation_control_button_color('slower', animation_control_button_color_active);
	set_animation_control_button_color('faster', animation_control_button_color_active);

	// Deal with edge cases.
	if (animation_delay >= animation_delay_max) {
		animation_delay = animation_delay_max;

		set_animation_control_button_color('slower', animation_control_button_color_inactive);
	} else if (animation_delay <= animation_delay_min) {
		animation_delay = animation_delay_min;

		set_animation_control_button_color('faster', animation_control_button_color_inactive);
	}

	if (store) {
		store.setItem('animation_delay', animation_delay);
	}
}

if (store && store.getItem('animation_delay')) {
	set_animation_delay(parseInt(store.getItem('animation_delay')));
}

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
			set_animation_delay(animation_delay * animation_delay_factor);

			return;
		case 'faster':
			set_animation_delay(animation_delay / animation_delay_factor);

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

function VisualVertex() {
	Vertex.call(this);

	var circle = new Path.Circle(new Point(0, 0), circle_radius);
	circle.fillColor = new HsbColor(Math.random() * 360, 0.5 + Math.random() * 0.3, 0.3 + Math.random() * 0.5);

	var label_text = new PointText(circle.position);
	label_text.characterStyle.fillColor = 'white';
	// Attempt to center the label in the vertex.
	label_text.position.y += 4;
	label_text.justification = 'center';

	vertex_layer.activate();
	this.image = new Group([circle, label_text]);
	default_layer.activate();

	// Zero-indexed unique display ID.
	this.id = null;

	this.selected = false;

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
	select: function () {
		this.image.selected = true;
		this.selected = true;

		return this;
	},
	unselect: function () {
		this.image.selected = false;
		this.selected = false;

		return this;
	},
	toggle_selection: function () {
		if (this.selected) {
			return this.unselect();
		} else {
			return this.select();
		}
	},
	destroy: function () {
		this.image.remove();

		return this;
	}
});


function VisualEdge(v1, v2) {
	Edge.call(this, v1, v2);

	// Make sure edges don't disappear or get too fat.
	this.min_weight = 1;
	this.max_weight = 30;
	// Start out with a nice thickness.
	this.weight = 3;

	edge_layer.activate();
	this.image = new Path();
	default_layer.activate();

	this.image.add(new Point());
	this.image.add(new Point());

	this.set_default_appearance();
}

extend_class(Edge, VisualEdge, {
	_update_width: function () {
		this.image.strokeWidth = this.weight;
	},
	set_default_appearance: function () {
		this.image.strokeColor = 'grey';
		this._update_width();

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
	lighter: function (amount) {
		Edge.prototype.lighter.call(this, amount);

		this._update_width();

		return this;
	},
	heavier: function (amount) {
		Edge.prototype.heavier.call(this, amount);

		this._update_width();

		return this;
	},
	highlight: function (color) {
		if (color === undefined) {
			color = 'white';
		}

		this.image.strokeColor = color;

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

	if (store && store.getItem('vertex_label_mode')) {
		this.vertex_label_mode = parseInt(store.getItem('vertex_label_mode'));
	}
}

extend_class(Graph, VisualGraph, {
	add_vertex: function (point) {
		var v = Graph.prototype.add_vertex.call(this);

		if (point !== undefined) {
			v.set_position(point);
		}

		v.id = this.num_vertices - 1;

		this.set_vertex_label(v);

		return v;
	},
	move_vertex: function (v, point) {
		v.set_position(point);

		for (var i in v.neighbours) {
			this.get_edge(v, v.neighbours[i]).move_end(v, point);
		}

		return this;
	},
	remove_vertex: function (v) {
		var id = v.id;

		v = Graph.prototype.remove_vertex.call(this, v);

		if (v !== null) {
			v.destroy();

			// Update all the labels on the later vertices.
			for (var i in this.vertices) {
				if (this.vertices[i].id > id) {
					this.vertices[i].id--;
					this.set_vertex_label(this.vertices[i]);
				}
			}
		}

		return v;
	},
	remove_selected: function () {
		vertices = this.selected_vertices();

		for (var i = 0; i < vertices.length; i++) {
			this.remove_vertex(vertices[i]);
		}
	},
	set_vertex_label: function (v, mode) {
		if (mode === undefined) {
			mode = this.vertex_label_mode;
		}

		switch (mode) {
			case 0:
				v.set_label('');
				break;
			case 1:
				v.set_label(v.id);
				break;
			case 2:
				v.set_label(v.degree);
				break;
		}

		return this;
	},
	set_all_vertex_labels: function (mode) {
		for (var i in this.vertices) {
			this.set_vertex_label(this.vertices[i], mode);
		}
	},
	add_edge: function (v1, v2) {
		var e = Graph.prototype.add_edge.call(this, v1, v2);

		if (e !== null) {
			e.move_end(v1, v1.get_position());
			e.move_end(v2, v2.get_position());

			this.set_vertex_label(v1);
			this.set_vertex_label(v2);
		}

		return e;
	},
	remove_edge: function (v1, v2) {
		var e = Graph.prototype.remove_edge.call(this, v1, v2);

		if (e !== null) {
			e.destroy();

			this.set_vertex_label(v1);
			this.set_vertex_label(v2);
		}

		return e;
	},
	// Get the vertex sitting at the given position, if there is one.
	vertex_at_position: function (point) {
		var max_v = null;

		for (var i in this.vertices) {
			var v = this.vertices[i];

			if (v.image.hitTest(point)) {
				// Prefer the one with the highest UID, since that one will be
				// on top and is the one actually clicked.
				if (max_v === null || v.uid > max_v.uid) {
					max_v = v;
				}
			}
		}

		return max_v;
	},
	// Get the edge closest to the given position.
	edge_at_position: function (point) {
		var min_edge = null, min_d = null;

		for (var i in this.edges) {
			var edge = this.edges[i];
			var d = distanceToLineSegment(edge.v1.get_position(), edge.v2.get_position(), point);

			if (min_d === null || d < min_d) {
				min_edge = edge;
				min_d = d;
			}
		}

		return min_edge;
	},
	unhighlight_all: function () {
		for (var i in this.vertices) {
			this.vertices[i].unhighlight();
		}

		for (var i in this.edges) {
			this.edges[i].unhighlight();
		}

		return this;
	},
	// Highlight the given vertices and edges.
	//
	// If vertices is null, all the vertices incident to the edges are used. If
	// edges is null, all the edges between consecutive vertices in the list
	// are used. If both are null, nothing happens.
	highlight_subgraph: function (vertices, edges) {
		if (vertices === null && edges === null) {
			return;
		} else if (vertices === null) {
			// Check every edge, taking both vertices. This list may include
			// duplicates, but that's not very computationally expensive later.
			vertices = [];

			for (var i = 0; i < edges.length; i++) {
				vertices.push(edges[i].v1);
				vertices.push(edges[i].v2);
			}
		} else if (edges === null) {
			edges = [];

			// Follow the path, extracting edges.
			for (var i = 1; i < vertices.length; i++) {
				var e = G.get_edge(vertices[i - 1], vertices[i]);

				// If there is an edge missing, ignore it and keep going.
				if (e !== null) {
					edges.push(e);
				}
			}
		}

		for (var i = 0; i < vertices.length; i++) {
			vertices[i].highlight();
		}

		for (var i = 0; i < edges.length; i++) {
			edges[i].highlight('red');
		}
	},
	select_all: function () {
		for (var i in this.vertices) {
			this.vertices[i].select();
		}

		return this;
	},
	selected_vertices: function () {
		var result = [];

		for (var i in this.vertices) {
			if (this.vertices[i].selected) {
				result.push(this.vertices[i])
			}
		}

		return result;
	},
	unselect_all: function () {
		for (var i in this.vertices) {
			this.vertices[i].unselect();
		}

		return this;
	},
	toggle_vertex_label_mode: function () {
		this.vertex_label_mode = (this.vertex_label_mode + 1) % 3;

		if (store) {
			store.setItem('vertex_label_mode', this.vertex_label_mode);
		}

		this.set_all_vertex_labels();

		return this;
	},
	insert_binary_tree: function (depth, root_position) {
		var vertices = Graph.prototype.insert_binary_tree.call(this, depth);

		if (vertices.length > 0 && root_position !== undefined) {
			var step = 60;
			var k = 0;

			for (var i = 0; i < depth; i++) {
				var depth_step = step * Math.pow(2, depth - i - 1);
				var left_pos = -1 * depth_step * (Math.pow(2, i - 1) - 1 / 2);

				for (var j = 0; j < Math.pow(2, i); j++) {
					var pos = root_position + new Point(left_pos, 50 * i)
					this.move_vertex(vertices[k], pos);

					left_pos += depth_step;
					k++;
				}
			}
		}

		return vertices;
	},
	// Arrange the given vertices in the shape of a regular polygon.
	_arrange_polygonally: function (vertices, center_position) {
		var angle_step, radius;

		if (vertices.length == 1) {
			angle_step = 0;
			radius = 0;
		} else {
			angle_step = 2 * Math.PI / vertices.length;
			radius = 1.5 * circle_radius / Math.sin(angle_step / 2);
		}

		var angle = 0;

		for (var i = 0; i < vertices.length; i++) {
			var x = radius * Math.sin(angle);
			var y = -1 * radius * Math.cos(angle);

			this.move_vertex(vertices[i], center_position + new Point(x, y));

			angle += angle_step;
		}

		return this;
	},
	insert_complete_graph: function (n, center_position) {
		var vertices = Graph.prototype.insert_complete_graph.call(this, n);

		if (center_position !== undefined) {
			this._arrange_polygonally(vertices, center_position);
		}

		return vertices;
	},
	insert_random_graph: function (max_n, center_position) {
		var vertices = Graph.prototype.insert_random_graph.call(this, max_n);

		if (center_position !== undefined) {
			this._arrange_polygonally(vertices, center_position);
		}

		return vertices;
	}
});

var G = new VisualGraph(VisualVertex, VisualEdge);

/*****************
 *  Interaction  *
 *****************/

// Don't draw too many points.
var default_minDistance = 20;
tool.minDistance = default_minDistance;

// Callbacks, configured elsewhere.
var drag_function;
var release_function;

// Start an edge action at a vertices, draw a path following the mouse, and
// call the completion callback end_function when the mouse is released.
function vertex_pair_action(start_vertex, color, end_function, allow_endless) {
	var path = new Path();
	path.strokeColor = color;
	path.add(start_vertex.get_position());

	drag_function = function (point) {
		path.add(point);
		path.smooth();
	}

	release_function = function (point) {
		path.remove();

		var end_vertex = G.vertex_at_position(point);

		if (end_vertex !== null || allow_endless) {
			end_function(start_vertex, end_vertex);
		}

		drag_function = false;
		release_function = false;
	}
}

// Start a search animation with the given step and cleanup functions.
function start_search(search_step, cleanup) {
	disable_tools();
	animation_setup();

	animation_frame = function () {
		search_step();
	}

	animation_end = function () {
		G.unhighlight_all();

		if (cleanup !== undefined) {
			cleanup();
		}

		enable_tools();
	}
}

function end_search() {
	animation_teardown();
}

function onKeyDown(event) {
	if (tools_enabled) {
		if (event.key in tool_hotkey_actions) {
			set_active_tool(tool_hotkey_actions[event.key]);

			return;
		}

		if (Key.isDown('control') || Key.isDown('command')) {
			switch (event.key) {
				case 'a':
				// Opera seems to report the resulting control character.
				case '\x01':
					G.select_all();
					event.preventDefault();
					return;
			}
		} else {
			switch (event.key) {
				case 'l':
					G.toggle_vertex_label_mode();
					return;
				case 'delete':
					G.remove_selected();
			}
		}
	}

	if (animating) {
		if (event.key in animation_control_hotkey_actions) {
			animation_action_dispatch(animation_control_hotkey_actions[event.key]);
			event.preventDefault();

			return;
		}
	}
}

function onMouseMove(event) {
	if (!tools_enabled) {
		return;
	}

	switch (current_tool) {
		case 'change_weight':
			var edge = G.edge_at_position(event.point);

			G.unhighlight_all();

			if (edge === null) {
				delete tool_data['edge'];
				return;
			}

			tool_data['edge'] = edge;
			edge.highlight();

			return;

		case 'show_neighbours':
			var vertex = G.vertex_at_position(event.point);

			G.unhighlight_all();

			if (vertex === null) {
				return;
			}

			var neighbours = vertex.list_neighbours();

			for (var i = 0; i < neighbours.length; i++) {
				neighbours[i].highlight();
				G.get_edge(vertex, neighbours[i]).highlight();
			}

			return;
	}
}

function onMouseDown(event) {
	if (Key.isDown('control') || Key.isDown('command')) {
		var h_line = new Path.Line(new Point(0, event.point.y), new Point(view.viewSize.width, event.point.y));
		var v_line = new Path.Line(new Point(event.point.x, 0), new Point(event.point.x, view.viewSize.height));

		h_line.strokeColor = v_line.strokeColor = '#aa5500';

		var guides = new Group([h_line, v_line]);
		guides.moveBelow(graph_group);

		if (Key.isDown('shift')) {
			// Scale/rotate.
			var root_point = event.point;

			// Only use the selected vertices.
			var vertices = G.selected_vertices();

			if (vertices.length === 0) {
				// If nothing is selected, use all vertices.
				for (var i in G.vertices) {
					vertices.push(G.vertices[i]);
				}
			}

			var original_offsets = [];

			for (var i = 0; i < vertices.length; i++) {
				original_offsets.push(vertices[i].get_position() - root_point);
			}

			drag_function = function (point) {
				var scaling = 1, rotation = 0;

				if (Math.abs(root_point.y - point.y) > 10) {
					scaling = Math.exp((root_point.y - point.y) / 500);
				}

				if (Math.abs(point.x - root_point.x) > 10) {
					rotation = (point.x - root_point.x) / 2;
				}

				for (var i = 0; i < vertices.length; i++) {
					var pos = (root_point + original_offsets[i] * scaling).rotate(rotation, root_point);

					G.move_vertex(vertices[i], pos);
				}
			}
		} else {
			// Pan.
			var root_point = graph_group.position - event.point;

			drag_function = function (point) {
				graph_group.position = root_point + point;
			}
		}

		release_function = function (point) {
			guides.remove();

			drag_function = false;
			release_function = false;
		}

		return;
	}

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
				var clicked = G.vertex_at_position(event.point);
				var vertices;

				if (clicked === null) {
					// Nothing to do.
					return;
				} else if (clicked.selected) {
					// Move all selected vertices together.
					vertices = G.selected_vertices();
				} else {
					vertices = [clicked];
				}

				var offsets = [];

				for (var i = 0; i < vertices.length; i++) {
					offsets[i] = vertices[i].get_position() - event.point;
				}

				drag_function = function (point) {
					for (var i = 0; i < vertices.length; i++) {
						G.move_vertex(vertices[i], point + offsets[i]);
					}
				}

				release_function = function (point) {
					drag_function = false;
					release_function = false;
				}
				return;

			case 'remove_vertex':
				var clicked = G.vertex_at_position(event.point);

				if (clicked === null) {
					// Nothing to do.
					return;
				} else if (clicked.selected) {
					G.remove_selected();
				} else {
					G.remove_vertex(clicked);
				}
				return;

			case 'add_edge':
				var vertex = G.vertex_at_position(event.point);

				if (vertex !== null) {
					vertex_pair_action(vertex, '#00ff00', bind(G, 'add_edge'), false);
				}
				return;

			case 'delete_edge':
				var vertex = G.vertex_at_position(event.point);

				if (vertex !== null) {
					vertex_pair_action(vertex, '#ff0000', bind(G, 'remove_edge'), false);
				}
				return;

			case 'change_weight':
				if ('edge' in tool_data) {
					edge = tool_data['edge'];

					if (Key.isDown('shift')) {
						edge.lighter();
					} else {
						edge.heavier();
					}
				}
				return;

			case 'select':
				var root_point = event.point;

				var selection_rectangle = null;
				var selection_path = null;

				var clear_rectangle = function () {
					if (selection_rectangle) {
						selection_rectangle = null;
					}

					if (selection_path) {
						selection_path.remove();
						selection_path = null;
					}
				}

				drag_function = function (point) {
					clear_rectangle();

					selection_rectangle = new Rectangle(root_point, point);

					selection_path = new Path.Rectangle(selection_rectangle);
					selection_path.strokeColor = '#009dec';
					selection_path.dashArray = [4, 2];
				}

				release_function = function (point) {
					if (!Key.isDown('shift')) {
						G.unselect_all();
					}

					if (selection_rectangle) {
						for (var i in G.vertices) {
							if (selection_rectangle.contains(G.vertices[i].get_position())) {
								G.vertices[i].select();
							}
						}
					} else {
						var v = G.vertex_at_position(point);

						if (v) {
							v.toggle_selection();
						}
					}

					clear_rectangle();

					drag_function = false;
					release_function = false;
				}
				return;

			case 'run_dfs':
				var vertex = G.vertex_at_position(event.point);

				if (vertex === null) {
					return;
				}

				vertex_pair_action(vertex, '#ffff00', function (start, target) {
					if (start == target) {
						target = null;
					}

					G.unhighlight_all();

					var dfs_step = G.dfs(start, target, function (n, e) {
						// Highlight the next neighbour.
						n.highlight();
						e.highlight();
					}, function (e) {
						// Unhighlight the edge along which we're backtracking.
						e.unhighlight();
					}, function (path) {
						end_search();

						G.highlight_subgraph(path, null);
					});

					start.highlight();

					start_search(dfs_step);
				}, true);

				return;

			case 'run_bfs':
				var vertex = G.vertex_at_position(event.point);

				if (vertex === null) {
					return;
				}

				var highlighted_edges = [];

				vertex_pair_action(vertex, '#ffff00', function (start, target) {
					if (start == target) {
						target = null;
					}

					G.unhighlight_all();

					var bfs_step = G.bfs(start, target, function (e) {
						e.highlight();
						highlighted_edges.push(e);
					}, function (c) {
						c.highlight();

						// Unhighlight the edge that caused it to be visited.
						if (highlighted_edges.length > 0) {
							var e = highlighted_edges.shift();

							e.unhighlight();
						}
					}, function (path) {
						end_search();

						G.highlight_subgraph(path, null);
					});

					start_search(bfs_step);
				}, true);

				return;

			case 'run_dijkstra':
				var vertex = G.vertex_at_position(event.point);

				if (vertex === null) {
					return;
				}

				vertex_pair_action(vertex, '#ffff00', function (start, target) {
					if (start == target) {
						target = null;
					}

					G.unhighlight_all();

					// Ensure that all vertices start out blank.
					G.set_all_vertex_labels(0);

					var dijkstra_step = G.dijkstra(start, target, function (v, d) {
						v.set_label(d);
					}, function (e) {
						e.highlight();
					}, function (c) {
						c.highlight();
					}, function (path) {
						end_search();

						G.highlight_subgraph(path, null);
					});

					start_search(dijkstra_step, function () {
						// Restore vertex labels.
						G.set_all_vertex_labels();
					});
				}, true);

				return;

			case 'run_prim_jarnik':
				var vertex = G.vertex_at_position(event.point);

				if (vertex === null) {
					return;
				}

				G.unhighlight_all();
				vertex.highlight();

				var prim_jarnik_step = G.prim_jarnik(vertex, function (v, e) {
					v.highlight();
					e.highlight();
				}, function (vertices, edges) {
					end_search();

					G.highlight_subgraph(vertices, edges);
				});

				start_search(prim_jarnik_step);

				return;

			case 'run_kruskal':
				G.unhighlight_all();

				var kruskal_step = G.kruskal(function (e) {
					e.highlight();

					e.v1.highlight();
					e.v2.highlight();
				}, function (vertices, edges) {
					end_search();

					G.highlight_subgraph(vertices, edges);
				});

				start_search(kruskal_step);

				return;

			case 'insert_binary_tree':
				G.insert_binary_tree(4, event.point);
				return;

			case 'insert_complete_graph':
				G.insert_complete_graph(7, event.point);
				return;

			case 'insert_random_graph':
				G.insert_random_graph(8, event.point);
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
