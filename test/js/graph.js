// Vertex

test('unique UIDs', function () {
	var v1 = new Vertex();
	var v2 = new Vertex();

	var n1 = v1.toString();
	var n2 = v2.toString();

	ok(n1 != n2, n1 + ' ' + n2);
});

test('neighbours', function () {
	var v1 = new Vertex();
	var v2 = new Vertex();
	var v3 = new Vertex();

	// 1 -- 2
	v1.add_neighbour(v2);
	v2.add_neighbour(v1);
	// 1 -- 3
	v1.add_neighbour(v3);
	v3.add_neighbour(v1);

	equal(v1.degree, 2);
	equal(v2.degree, 1);
	equal(v3.degree, 1);

	setEqual(v1.list_neighbours(), [v2, v3]);
	setEqual(v2.list_neighbours(), [v1]);
	setEqual(v3.list_neighbours(), [v1]);

	// 1 -- 2
	v1.remove_neighbour(v2);
	v2.remove_neighbour(v1);
	// 1 -- 3
	v1.remove_neighbour(v3);
	v3.remove_neighbour(v1);

	equal(v1.degree, 0);
	equal(v2.degree, 0);
	equal(v3.degree, 0);

	setEqual(v1.list_neighbours(), []);
	setEqual(v2.list_neighbours(), []);
	setEqual(v3.list_neighbours(), []);
});


// Edge

test('same names', function () {
	var v1 = new Vertex();
	var v2 = new Vertex();

	var n1 = Edge.prototype.generate_name(v1, v2);
	var n2 = Edge.prototype.generate_name(v2, v1);

	ok(n1 === n2, n1 + ' ' + n2);

	var e = new Edge(v1, v2);

	equal(e.toString(), n1);
});

test('weight', function () {
	var v1 = new Vertex();
	var v2 = new Vertex();

	var e = new Edge(v1, v2);

	e.max_weight = 3;

	equal(e.weight, 0);
	e.lighter();
	equal(e.weight, 0);

	e.heavier();
	equal(e.weight, 1);
	e.heavier(4);
	equal(e.weight, 3);
	e.lighter();
	equal(e.weight, 2);
});


// Graph

test('empty graph', function () {
	var G = new Graph(Vertex, Edge);

	equal(G.num_vertices, 0);
	equal(G.num_edges, 0);
});

test('one vertex', function () {
	var G = new Graph(Vertex, Edge);

	var v1 = G.add_vertex();

	equal(G.num_vertices, 1);
	equal(G.num_edges, 0);

	equal(v1.degree, 0);

	setEqual(v1.list_neighbours(), []);
});

test('one edge', function () {
	var G = new Graph(Vertex, Edge);

	var v1 = G.add_vertex();
	var v2 = G.add_vertex();

	var e1 = G.add_edge(v1, v2);

	equal(G.num_vertices, 2);
	equal(G.num_edges, 1);

	equal(v1.degree, 1);
	equal(v2.degree, 1);

	setEqual(v1.list_neighbours(), [v2]);
	setEqual(v2.list_neighbours(), [v1]);
});

test('remove', function () {
	var G = new Graph(Vertex, Edge);

	var v1 = G.add_vertex();
	var v2 = G.add_vertex();

	var e1 = G.add_edge(v1, v2);

	G.remove_vertex(v2);

	equal(G.num_vertices, 1);
	equal(G.num_edges, 0);

	equal(v1.degree, 0);
	equal(v2.degree, 0);

	setEqual(v1.list_neighbours(), []);
	setEqual(v2.list_neighbours(), []);
});

test('insert_binary_tree', function () {
	var G = new Graph(Vertex, Edge);

	var v1 = G.add_vertex();

	var t0 = G.insert_binary_tree(0);
	equal(t0.length, 0);

	var t1 = G.insert_binary_tree(1);
	equal(t1.length, 1);

	var t4 = G.insert_binary_tree(4);
	equal(t4.length, 15);

	equal(G.num_vertices, 17);
	equal(G.num_edges, 14);

	setEqual(t4[0].list_neighbours(), [t4[2], t4[1]]);
	setEqual(t4[4].list_neighbours(), [t4[1], t4[9], t4[10]]);
});


test('insert_complete_graph', function () {
	var G = new Graph(Vertex, Edge);

	var c1 = G.insert_complete_graph(2);
	var c2 = G.insert_complete_graph(7);

	equal(G.num_vertices, 9);
	equal(G.num_edges, 22);

	setEqual(c1[0].list_neighbours(), [c1[1]]);
	setEqual(c2[0].list_neighbours(), c2.slice(1));
});

test('insert_random_graph', function () {
	var G = new Graph(Vertex, Edge);

	var c1 = G.insert_random_graph(5);
	var c2 = G.insert_random_graph(5);

	G.add_edge(c1[0], c2[0]);

	ok(G.num_vertices >= 2);
	ok(G.num_vertices <= 10);
	ok(G.num_edges >= 1);
	ok(G.num_edges <= 21);
});

function test_search(f, start, target, success) {
	var found_path;
	// Make sure we always terminate.
	var remaining_steps = 1000;
	var step = f(start, target, noop, noop, function (p) {
		remaining_steps = -1;
		found_path = p;
	});

	while (remaining_steps > 0) {
		step();
	}

	equal(remaining_steps, -1, 'Exceeded step limit.');

	if (success) {
		ok(found_path.length >= 2);
		equal(found_path[0], start);
		equal(found_path[found_path.length - 1], target);
	} else {
		equal(found_path, undefined);
	}
}

test('dfs_without_target', function () {
	var G = new Graph(Vertex, Edge);

	var vs1 = G.insert_complete_graph(7);
	var vs2 = G.insert_complete_graph(7);

	test_search(bind(G, 'dfs'), vs2[0], null, false);
});

test('dfs_with_connected_target', function () {
	var G = new Graph(Vertex, Edge);

	var vs1 = G.insert_complete_graph(7);
	var vs2 = G.insert_complete_graph(7);

	test_search(bind(G, 'dfs'), vs2[0], vs2[1], true);
});

test('dfs_with_disconnected_target', function () {
	var G = new Graph(Vertex, Edge);

	var vs1 = G.insert_complete_graph(7);
	var vs2 = G.insert_complete_graph(7);

	test_search(bind(G, 'dfs'), vs2[0], vs1[1], false);
});

test('bfs_without_target', function () {
	var G = new Graph(Vertex, Edge);

	var vs1 = G.insert_complete_graph(7);
	var vs2 = G.insert_complete_graph(7);

	test_search(bind(G, 'bfs'), vs2[0], null, false);
});

test('bfs_with_connected_target', function () {
	var G = new Graph(Vertex, Edge);

	var vs1 = G.insert_complete_graph(7);
	var vs2 = G.insert_complete_graph(7);

	test_search(bind(G, 'bfs'), vs2[0], vs2[1], true);
});

test('bfs_with_disconnected_target', function () {
	var G = new Graph(Vertex, Edge);

	var vs1 = G.insert_complete_graph(7);
	var vs2 = G.insert_complete_graph(7);

	test_search(bind(G, 'bfs'), vs2[0], vs1[1], false);
});

function test_dijkstra(G, start, target, path) {
	var found_path;
	// Make sure we always terminate.
	var remaining_steps = 1000;
	var step = G.dijkstra(start, target, function (c, n) {
		return G.get_edge(c, n).weight;
	}, noop, noop, noop, function (p) {
		remaining_steps = -1;
		found_path = p;
	});

	while (remaining_steps > 0) {
		step();
	}

	equal(remaining_steps, -1, 'Exceeded step limit.');

	deepEqual(found_path, path);
}

test('dijkstra', function () {
	var G = new Graph(Vertex, Edge);

	var vs1 = G.insert_binary_tree(4);
	var vs2 = G.insert_binary_tree(4);

	var long_path = [vs1[0], vs1[1], vs1[3], vs1[7]];
	var short_path = [vs1[0], vs1[7]];

	// No path between components.
	test_dijkstra(G, vs1[0], vs2[0], undefined);

	// Only a single path possible in a tree.
	test_dijkstra(G, vs1[0], vs1[7], long_path);

	// Add a shortcut.
	var shortcut = G.add_edge(vs1[0], vs1[7]);
	test_dijkstra(G, vs1[0], vs1[7], short_path);

	// Make the shortcut not worth it anymore.
	shortcut.heavier();
	test_dijkstra(G, vs1[0], vs1[7], long_path);
});

// Given a graph G, a list of vertices vs, and a list of index pairs ips,
// generate a list of the corresponding edges.
function edge_list(G, vs, ips) {
	var result = [];

	for (var i = 0; i < ips.length; i++) {
		var ip = ips[i];

		result.push(G.get_edge(vs[ip[0]], vs[ip[1]]));
	}

	return result;
}

function test_prim_jarnik(G, start, mst) {
	var found_mst;
	// Make sure we always terminate.
	var remaining_steps = 1000;
	var step = G.prim_jarnik(start, function (e) {
		return e.weight;
	}, noop, function (t) {
		remaining_steps = -1;
		found_mst = t;
	});

	while (remaining_steps > 0) {
		step();
	}

	equal(remaining_steps, -1, 'Exceeded step limit.');

	setEqual(found_mst, mst);
}

test('prim_jarnik', function () {
	var G = new Graph(Vertex, Edge);

	var vs1 = G.insert_binary_tree(3);
	var vs2 = G.insert_binary_tree(3);

	var edge_indices = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]];
	var es1 = edge_list(G, vs1, edge_indices);
	var es2 = edge_list(G, vs2, edge_indices);

	// Each component has its own MST.
	test_prim_jarnik(G, vs1[0], es1);
	test_prim_jarnik(G, vs2[6], es2);

	// If we join them, there is still a unique MST.
	var bridge1 = G.add_edge(vs1[3], vs2[3]);
	var es3 = es1.concat(es2, bridge1);

	test_prim_jarnik(G, vs1[0], es3);
	test_prim_jarnik(G, vs2[6], es3);

	// If we join them with a heavier edge, it won't be used.
	var bridge2 = G.add_edge(vs1[6], vs2[6]);

	bridge2.heavier();

	test_prim_jarnik(G, vs1[0], es3);
	test_prim_jarnik(G, vs2[6], es3);

	// But making one of the original edges even heavier will cause the new
	// bridge to be used.
	var heavy_edge = G.get_edge(vs1[1], vs1[3]);
	var es4 = es1.concat(es2, bridge1, bridge2);

	heavy_edge.heavier(2);

	for (var i = 0; i < es4.length; i++) {
		if (es4[i] == heavy_edge) {
			es4.splice(i, 1);

			break;
		}
	}

	test_prim_jarnik(G, vs1[0], es4);
	test_prim_jarnik(G, vs2[6], es4);
});
