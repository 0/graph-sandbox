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
	var dfs = f(start, target, noop, noop, function (p) {
		remaining_steps = -1;
		found_path = p;
	});

	while (remaining_steps > 0) {
		dfs();
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
