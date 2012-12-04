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

	equal(2, v1.degree);
	equal(1, v2.degree);
	equal(1, v3.degree);

	deepEqual([v2, v3], v1.list_neighbours());
	deepEqual([v1], v2.list_neighbours());
	deepEqual([v1], v3.list_neighbours());

	// 1 -- 2
	v1.remove_neighbour(v2);
	v2.remove_neighbour(v1);
	// 1 -- 3
	v1.remove_neighbour(v3);
	v3.remove_neighbour(v1);

	equal(0, v1.degree);
	equal(0, v2.degree);
	equal(0, v3.degree);

	deepEqual([], v1.list_neighbours());
	deepEqual([], v2.list_neighbours());
	deepEqual([], v3.list_neighbours());
});


// Edge

test('same names', function () {
	var v1 = new Vertex();
	var v2 = new Vertex();

	var n1 = Edge.prototype.generate_name(v1, v2);
	var n2 = Edge.prototype.generate_name(v2, v1);

	ok(n1 === n2, n1 + ' ' + n2);

	var e = new Edge(v1, v2);

	equal(n1, e.toString());
});


// Graph

test('empty graph', function () {
	var G = new Graph(Vertex, Edge);

	equal(0, G.num_vertices);
	equal(0, G.num_edges);
});

test('one vertex', function () {
	var G = new Graph(Vertex, Edge);

	var v1 = G.add_vertex();

	equal(1, G.num_vertices);
	equal(0, G.num_edges);

	equal(0, v1.degree);

	deepEqual([], v1.list_neighbours());
});

test('one edge', function () {
	var G = new Graph(Vertex, Edge);

	var v1 = G.add_vertex();
	var v2 = G.add_vertex();

	var e1 = G.add_edge(v1, v2);

	equal(2, G.num_vertices);
	equal(1, G.num_edges);

	equal(1, v1.degree);
	equal(1, v2.degree);

	deepEqual([v2], v1.list_neighbours());
	deepEqual([v1], v2.list_neighbours());
});

test('remove', function () {
	var G = new Graph(Vertex, Edge);

	var v1 = G.add_vertex();
	var v2 = G.add_vertex();

	var e1 = G.add_edge(v1, v2);

	G.remove_vertex(v2);

	equal(1, G.num_vertices);
	equal(0, G.num_edges);

	equal(0, v1.degree);
	equal(0, v2.degree);

	deepEqual([], v1.list_neighbours());
	deepEqual([], v2.list_neighbours());
});

test('clear', function () {
	var G = new Graph(Vertex, Edge);

	var v1 = G.add_vertex();
	var v2 = G.add_vertex();

	var e1 = G.add_edge(v1, v2);

	G.clear();

	equal(0, G.num_vertices);
	equal(0, G.num_edges);

	deepEqual([], v1.list_neighbours());
	deepEqual([], v2.list_neighbours());
});

test('insert_binary_tree', function () {
	var G = new Graph(Vertex, Edge);

	var v1 = G.add_vertex();

	var t0 = G.insert_binary_tree(0);
	equal(0, t0.length);

	var t1 = G.insert_binary_tree(1);
	equal(1, t1.length);

	var t4 = G.insert_binary_tree(4);
	equal(15, t4.length);

	equal(17, G.num_vertices);
	equal(14, G.num_edges);

	deepEqual([t4[1], t4[2]], t4[0].list_neighbours());
	deepEqual([t4[1], t4[9], t4[10]], t4[4].list_neighbours());
});


test('insert_complete_graph', function () {
	var G = new Graph(Vertex, Edge);

	var c1 = G.insert_complete_graph(2);
	var c2 = G.insert_complete_graph(7);

	equal(9, G.num_vertices);
	equal(22, G.num_edges);

	deepEqual([c1[1]], c1[0].list_neighbours());
	deepEqual(c2.slice(1), c2[0].list_neighbours());
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

	equal(-1, remaining_steps);

	if (success) {
		ok(found_path.length >= 2);
		equal(start, found_path[0]);
		equal(target, found_path[found_path.length - 1]);
	} else {
		deepEqual(undefined, found_path);
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
