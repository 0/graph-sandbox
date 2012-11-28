function Vertex() {
	this.degree = 0;
}

Vertex.prototype = {
	add_neighbour: function () {
		this.degree++;
	},
	remove_neighbour: function () {
		this.degree--;
	}
}


function Edge(v1, v2) {
	this.v1 = v1;
	this.v2 = v2;
}


function Graph(vertex_class, edge_class) {
	// Allow the user to subclass Vertex and Edge.
	this.vertex_class = vertex_class;
	this.edge_class = edge_class;

	// Array of Vertex objects corresponding to the vertices.
	this.vertices = [];

	// Array of objects of Edge objects, implementing an incidence list.
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

Graph.prototype = {
	add_vertex: function () {
		var n = this.vertices.length;
		var v = new this.vertex_class();

		this.vertices.push(v);
		this.edges.push({});

		return n;
	},
	get_vertex: function (v) {
		return this.vertices[v];
	},
	remove_vertex: function (v) {
		// Remove all the edges connected to this vertex.
		for (var i in this.edges[v]) {
			this.remove_edge(v, i);
		}

		// Get rid of the vertex by shuffling all the vertices that have greater
		// indices.
		this.vertices[v].destroy();
		this.vertices.splice(v, 1);

		// Update all the labels on the later vertices.
		for (var i = v; i < this.vertices.length; i++) {
			this.set_vertex_label(i);
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
	},
	add_edge: function (v1, v2) {
		// Not if it already exists or if it connects a vertex with itself.
		if (v2 in this.edges[v1] || v1 == v2) {
			return false;
		}

		var e = new this.edge_class(v1, v2);

		this.edges[v1][v2] = e;
		this.edges[v2][v1] = e;

		this.get_vertex(v1).add_neighbour();
		this.get_vertex(v2).add_neighbour();

		return e;
	},
	get_edge: function (v1, v2) {
		return this.edges[v1][v2];
	},
	remove_edge: function (v1, v2) {
		// Not if it doesn't exist.
		if (!(v2 in this.edges[v1])) {
			return false;
		}

		var e = this.edges[v1][v2];

		delete this.edges[v1][v2];
		delete this.edges[v2][v1];

		this.get_vertex(v1).remove_neighbour();
		this.get_vertex(v2).remove_neighbour();

		return e;
	},
	neighbours: function (v) {
		var result = [];

		for (var i in this.edges[v]) {
			result.push(i);
		}

		return result;
	},
	// Remove all vertices and edges.
	clear: function () {
		while (this.vertices.length > 0) {
			this.remove_vertex(0);
		}

		return this;
	},
	dfs: function (start_vertex, neighbour_f, backtrack_f, end_f) {
		var that = this;

		var visited_vertices = {};
		var vertex_stack = [start_vertex];

		// Go through a single step of DFS.
		return function () {
			// Visit the top-most vertex on the stack.
			var current_vertex = vertex_stack[vertex_stack.length - 1];
			visited_vertices[current_vertex] = true;

			// Go to the next neighbour.
			var neighbours = that.neighbours(current_vertex);

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
				// We're done with the search.
				end_f();
			}
		};
	},
	bfs: function (start_vertex, neighbour_f, visit_f, end_f) {
		var that = this;

		var visited_vertices = {};
		visited_vertices[start_vertex] = true;
		var vertex_queue = [start_vertex];

		// Go through a single step of BFS.
		return function () {
			// Are we done with the search?
			if (vertex_queue.length == 0) {
				end_f();

				return;
			}

			// Visit the first vertex in the queue.
			var current_vertex = vertex_queue.splice(0, 1)[0];
			visit_f(current_vertex);

			// Queue all the neighbours.
			var neighbours = that.neighbours(current_vertex);

			for (var i = 0; i < neighbours.length; i++) {
				if (!(neighbours[i] in visited_vertices)) {
					neighbour_f(current_vertex, neighbours[i]);

					vertex_queue.push(neighbours[i]);

					// Make sure that it doesn't get queued again.
					visited_vertices[neighbours[i]] = true;
				}
			}
		};
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
	insert_potentially_complete_graph: function (n, edge_prob) {
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
		return this.insert_potentially_complete_graph(n);
	},
	insert_random_graph: function (max_n) {
		if (max_n < 2) {
			return [];
		}

		var n = 1 + Math.floor(Math.random() * max_n);

		return this.insert_potentially_complete_graph(n, 0.5);
	}
};
