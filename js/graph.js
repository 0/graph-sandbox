function Vertex() {
	this.uid = this.generate_uid();

	// Object of Vertex objects.
	this.neighbours = {};

	this.degree = 0;
}

Vertex.prototype = {
	toString: function () {
		return 'v' + this.uid;
	},
	generate_uid: make_uid_function(),
	add_neighbour: function (v) {
		if (v in this.neighbours) {
			return null;
		}

		this.neighbours[v] = v;

		this.degree++;

		return v;
	},
	remove_neighbour: function (v) {
		if (!(v in this.neighbours)) {
			return null;
		}

		delete this.neighbours[v];

		this.degree--;

		return v;
	},
	list_neighbours: function () {
		var result = [];

		for (var i in this.neighbours) {
			result.push(this.neighbours[i]);
		}

		return result;
	}
};

function Edge(v1, v2) {
	this.v1 = v1;
	this.v2 = v2;

	this.min_weight = 0;
	this.max_weight = Infinity;

	// A non-negative, potentially bounded, integral weight.
	this.weight = 0;
}

Edge.prototype = {
	generate_name: function (v1, v2) {
		v1 = v1.toString();
		v2 = v2.toString();

		// Ensure that v1 <= v2.
		if (v2 < v1) {
			var tmp = v2;
			v2 = v1;
			v1 = tmp;
		}

		return v1 + ':' + v2;
	},
	toString: function () {
		return this.generate_name(this.v1, this.v2);
	},
	lighter: function (amount) {
		if (amount === undefined) {
			amount = 1;
		}

		this.weight -= amount;

		if (this.weight < this.min_weight) {
			this.weight = this.min_weight;
		}

		return this;
	},
	heavier: function (amount) {
		if (amount === undefined) {
			amount = 1;
		}

		this.weight += amount;

		if (this.weight > this.max_weight) {
			this.weight = this.max_weight;
		}

		return this;
	}
};


function Graph(vertex_class, edge_class) {
	// Allow the user to subclass Vertex and Edge.
	this.vertex_class = vertex_class;
	this.edge_class = edge_class;

	// Object of Vertex objects.
	this.vertices = {};

	this.num_vertices = 0;

	// Object of Edge objects.
	this.edges = {};

	this.num_edges = 0;
}

Graph.prototype = {
	add_vertex: function () {
		var v = new this.vertex_class();

		this.vertices[v] = v;

		this.num_vertices++;

		return v;
	},
	remove_vertex: function (v) {
		// Not if it doesn't exist.
		if (!(v in this.vertices)) {
			return null;
		}

		// Remove all the edges connected to this vertex.
		for (var i in v.neighbours) {
			this.remove_edge(v, v.neighbours[i]);
		}

		delete this.vertices[v];

		this.num_vertices--;

		return v;
	},
	add_edge: function (v1, v2) {
		var name = Edge.prototype.generate_name(v1, v2);

		// Not if it already exists or if it connects a vertex with itself.
		if (name in this.edges || v1 == v2) {
			return null;
		}

		var e = new this.edge_class(v1, v2);

		this.edges[e] = e;

		v1.add_neighbour(v2);
		v2.add_neighbour(v1);

		this.num_edges++;

		return e;
	},
	get_edge: function (v1, v2) {
		var name = Edge.prototype.generate_name(v1, v2);

		return this.edges[name];
	},
	remove_edge: function (v1, v2) {
		var name = Edge.prototype.generate_name(v1, v2);

		// Not if it doesn't exist.
		if (!(name in this.edges)) {
			return null;
		}

		var e = this.edges[name];

		delete this.edges[name];

		v1.remove_neighbour(v2);
		v2.remove_neighbour(v1);

		this.num_edges--;

		return e;
	},
	insert_binary_tree: function (depth) {
		var vertices = [];

		var parents = [];
		var next_parents = [];

		for (var i = 0; i < depth; i++) {
			for (var j = 0; j < Math.pow(2, i); j++) {
				var cur = this.add_vertex();
				vertices.push(cur);
				next_parents.push(cur);

				// The root doesn't have any parents.
				if (parents.length > 0) {
					this.add_edge(cur, parents[Math.floor(j / 2)]);
				}
			}

			parents = next_parents;
			next_parents = [];
		}

		return vertices;
	},
	_insert_potentially_complete_graph: function (n, edge_prob) {
		var vertices = [];

		for (var i = 0; i < n; i++) {
			vertices.push(this.add_vertex());
		}

		for (var i = 0; i < vertices.length; i++) {
			for (var j = i + 1; j < vertices.length; j++) {
				if (edge_prob !== undefined && Math.random() > edge_prob) {
					continue;
				}

				this.add_edge(vertices[i], vertices[j]);
			}
		}

		return vertices;
	},
	insert_complete_graph: function (n) {
		return this._insert_potentially_complete_graph(n);
	},
	insert_random_graph: function (max_n) {
		if (max_n < 2) {
			return [];
		}

		// [1, max_n]
		var n = 1 + Math.floor(Math.random() * max_n);

		return this._insert_potentially_complete_graph(n, 0.5);
	},
	dfs: function (start, target, neighbour_f, backtrack_f, end_f) {
		var visited_vertices = {};
		var vertex_stack = [start];

		// Go through a single step of DFS.
		return function () {
			// Visit the top-most vertex on the stack.
			var current_vertex = vertex_stack[vertex_stack.length - 1];
			visited_vertices[current_vertex] = true;

			if (target == current_vertex) {
				// We've found it, so report the path.
				end_f(vertex_stack);

				return;
			}

			// Go to the next neighbour.
			var neighbours = current_vertex.list_neighbours();

			for (var i = 0; i < neighbours.length; i++) {
				if (!(neighbours[i] in visited_vertices)) {
					neighbour_f(current_vertex, neighbours[i]);

					vertex_stack.push(neighbours[i]);

					return;
				}
			}

			// All neighbours have been visited, so backtrack.
			vertex_stack.pop();

			if (vertex_stack.length > 0) {
				backtrack_f(current_vertex, vertex_stack[vertex_stack.length - 1]);
			} else {
				// We're done with the search, having found nothing.
				end_f();
			}
		};
	},
	bfs: function (start, target, neighbour_f, visit_f, end_f) {
		var visited_vertices = {};
		visited_vertices[start] = true;
		var vertex_queue = [[start]];

		// Go through a single step of BFS.
		return function () {
			if (vertex_queue.length == 0) {
				// We're done with the search, having found nothing.
				end_f();

				return;
			}

			// Visit the first vertex in the queue.
			var current_path = vertex_queue.shift();
			var current_vertex = current_path[current_path.length - 1];
			visit_f(current_vertex);

			if (target == current_vertex) {
				// We've found it, so report the path.
				end_f(current_path);

				return;
			}

			// Queue all the neighbours.
			var neighbours = current_vertex.list_neighbours();

			for (var i = 0; i < neighbours.length; i++) {
				if (!(neighbours[i] in visited_vertices)) {
					neighbour_f(current_vertex, neighbours[i]);

					var new_path = current_path.slice(0);
					new_path.push(neighbours[i]);
					vertex_queue.push(new_path);

					// Make sure that it doesn't get queued again.
					visited_vertices[neighbours[i]] = true;
				}
			}
		};
	}
};
