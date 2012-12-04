test('empty graph', function () {
	var G = new Graph(Vertex, Edge);

	equal(0, G.num_vertices());
	equal(0, G.num_edges());
});

test('one vertex', function () {
	var G = new Graph(Vertex, Edge);

	var v1 = G.add_vertex();

	equal(1, G.num_vertices());
	equal(0, G.num_edges());

	equal(0, G.get_vertex(v1).degree);

	deepEqual([], G.neighbours(v1));
});

test('one edge', function () {
	var G = new Graph(Vertex, Edge);

	var v1 = G.add_vertex();
	var v2 = G.add_vertex();

	var e1 = G.add_edge(v1, v2);

	equal(2, G.num_vertices());
	equal(1, G.num_edges());

	equal(1, G.get_vertex(v1).degree);
	equal(1, G.get_vertex(v2).degree);

	deepEqual([v2], G.neighbours(v1));
	deepEqual([v1], G.neighbours(v2));
});

test('remove', function () {
	var G = new Graph(Vertex, Edge);

	var v1 = G.add_vertex();
	var v2 = G.add_vertex();

	var e1 = G.add_edge(v1, v2);

	G.remove_vertex(v2);

	equal(1, G.num_vertices());
	equal(0, G.num_edges());

	equal(0, G.get_vertex(v1).degree);

	deepEqual([], G.neighbours(v1));
});

test('clear', function () {
	var G = new Graph(Vertex, Edge);

	var v1 = G.add_vertex();
	var v2 = G.add_vertex();

	var e1 = G.add_edge(v1, v2);

	G.clear();

	equal(0, G.num_vertices());
	equal(0, G.num_edges());

	equal(undefined, G.get_vertex(v1));

	deepEqual([], G.neighbours(v1));
	deepEqual([], G.neighbours(v2));
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

	equal(17, G.num_vertices());
	equal(14, G.num_edges());

	deepEqual([t4[1], t4[2]], G.neighbours(t4[0]));
	deepEqual([t4[1], t4[9], t4[10]], G.neighbours(t4[4]));
});


test('insert_complete_graph', function () {
	var G = new Graph(Vertex, Edge);

	var c1 = G.insert_complete_graph(2);
	var c2 = G.insert_complete_graph(7);

	equal(9, G.num_vertices());
	equal(22, G.num_edges());

	deepEqual([c1[1]], G.neighbours(c1[0]));
	deepEqual(c2.slice(1), G.neighbours(c2[0]));
});

test('insert_random_graph', function () {
	var G = new Graph(Vertex, Edge);

	var c1 = G.insert_random_graph(5);
	var c2 = G.insert_random_graph(5);

	G.add_edge(c1[0], c2[0]);

	ok(G.num_vertices() >= 2);
	ok(G.num_vertices() <= 10);
	ok(G.num_edges() >= 1);
	ok(G.num_edges() <= 21);
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
