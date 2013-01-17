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

		var get_edge = bind(this, 'get_edge');

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
				var n = neighbours[i];

				if (!(n in visited_vertices)) {
					var e = get_edge(current_vertex, n);

					neighbour_f(n, e);

					vertex_stack.push(n);

					return;
				}
			}

			// All neighbours have been visited, so backtrack.
			vertex_stack.pop();

			if (vertex_stack.length > 0) {
				var e = get_edge(current_vertex, vertex_stack[vertex_stack.length - 1]);

				backtrack_f(e);
			} else {
				// We're done with the search, having found nothing.
				end_f([]);
			}
		};
	},
	bfs: function (start, target, neighbour_f, visit_f, end_f) {
		var visited_vertices = {};
		visited_vertices[start] = true;
		var vertex_queue = [[start]];

		var get_edge = bind(this, 'get_edge');

		// Go through a single step of BFS.
		return function () {
			if (vertex_queue.length == 0) {
				// We're done with the search, having found nothing.
				end_f([]);

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
				var n = neighbours[i];

				if (!(n in visited_vertices)) {
					var e = get_edge(current_vertex, n);
					var new_path = current_path.slice(0);

					neighbour_f(e);

					new_path.push(n);
					vertex_queue.push(new_path);

					// Make sure that it doesn't get queued again.
					visited_vertices[n] = true;
				}
			}
		};
	},
	dijkstra: function (start, target, distance_f, neighbour_f, visit_f, end_f) {
		var distances = {};
		var previouses = {};
		var pool = {};

		for (var i in this.vertices) {
			distances[i] = Infinity;
			previouses[i] = null;
			pool[i] = this.vertices[i];
		}

		distances[start] = 0;
		distance_f(start, distances[start]);

		var get_edge = bind(this, 'get_edge');

		// Go through a single step of Dijkstra's algorithm.
		return function () {
			// Find the pending vertex with smallest distance.
			var min_v = null, min_d = null;

			for (var i in pool) {
				var d = distances[i];

				if (min_d === null || d < min_d) {
					min_v = pool[i];
					min_d = d;
				}
			}

			if (min_v === null || distances[min_v] === Infinity) {
				// Reachable vertices exhausted.
				end_f([]);

				return;
			} else if (min_v === target) {
				// Target acquired!
				var path = [];
				var next = target;

				while (next !== null) {
					path.unshift(next);
					next = previouses[next];
				}

				end_f(path);

				return;
			}

			// Deal with this vertex.
			visit_f(min_v);
			delete pool[min_v];

			var neighbours = min_v.list_neighbours();

			for (var i = 0; i < neighbours.length; i++) {
				var n = neighbours[i];

				// Only visit pending vertices.
				if (!(n in pool)) {
					continue;
				}

				var e = get_edge(min_v, n);

				neighbour_f(e);

				// Update the distance to this neighbour.
				var new_distance = distances[min_v] + e.weight;

				if (new_distance < distances[n]) {
					distances[n] = new_distance;
					previouses[n] = min_v;

					distance_f(n, distances[n]);
				}
			}
		};
	},
	prim_jarnik: function (start, visit_f, end_f) {
		var vertex_pool = {};
		var edge_pool = {};
		var result_vertices = [start];
		var result_edges = [];

		// Start with all vertices except the start vertex in the vertex pool
		// and all edges incident to the start vertex in the edge pool.
		for (var i in this.vertices) {
			var v = this.vertices[i];

			if (v != start) {
				vertex_pool[i] = v;
			}
		}

		var start_neighbours = start.list_neighbours();

		for (var i = 0; i < start_neighbours.length; i++) {
			var e = this.get_edge(start, start_neighbours[i]);

			edge_pool[e] = e;
		}

		var get_edge = bind(this, 'get_edge');

		// Go through a single step of Prim-Jarnik.
		return function () {
			// Find the edge in the pool with the smallest weight.
			var min_e = null, min_w = null;

			for (var i in edge_pool) {
				var e = edge_pool[i];
				var w = e.weight;

				if (min_w === null || w < min_w) {
					min_e = e;
					min_w = w;
				}
			}

			// The pool is depleted, so the MST is complete.
			if (min_e === null) {
				end_f(result_vertices, result_edges);

				return;
			}

			// Add the found edge to the MST, updating the pools.
			var new_vertex = min_e.v1 in vertex_pool ? min_e.v1 : min_e.v2;

			result_vertices.push(new_vertex);
			result_edges.push(min_e);
			visit_f(new_vertex, min_e);

			delete vertex_pool[new_vertex];

			// If any of the edges in the edge pool had the new vertex as one
			// of the ends, the other end must have already been in the MST.
			// Therefore now all these edges have both ends in the MST and must
			// be pruned from the pool.
			//
			// Any edges between the new vertex and vertices still in the
			// vertex pool must be added to the edge pool.
			var neighbours = new_vertex.list_neighbours();

			for (var i = 0; i < neighbours.length; i++) {
				var n = neighbours[i];
				var e = get_edge(new_vertex, n);

				if (e in edge_pool) {
					delete edge_pool[e];
				} else if (n in vertex_pool) {
					edge_pool[e] = e;
				}
			}
		};
	}
};
