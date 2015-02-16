var save = function(key, cmd) {

	var ls = window.localStorage;
	var obj = ls['terminalify'];
	var db;

	if (typeof obj == 'undefined') {
		db = {};
		db[key] = [];
	} else {
		db = JSON.parse(obj);
		console.log("Parsed the db from LS object");
	}

	console.log("Got terminalify DB... ", db);

	if (db[key].length >= 30) {
		var dropped = db[key].shift();
		console.log("Dropping oldest command...", dropped);
	}

	db[key].push(cmd);
	ls.setItem('terminalify', JSON.stringify(db));
}

var last = function(key, upCount) {

	if (upCount > 18) {
		upCount = 18;
	}

	var ls = window.localStorage;
	var obj = ls['terminalify'];
	var db;

	if (typeof obj == 'undefined') {
		return '';
	} else {
		db = JSON.parse(obj);
		var list = db[key];
		return list[list.length - 1 - upCount];
	}
}

module.exports = {
	save: save,
	getLast: last
}