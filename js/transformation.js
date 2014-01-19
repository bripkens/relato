(function(context) {

  var projects = [];

  context.loadProjectData = function(s) {
    projects = s.split('\n')
      .slice(1)
      .filter(function(line) {
        return line !== '';
      })
      .map(function(line) {
        var parts = line.split(',');
        return {
          name: parts[0],
          runtimeUsers: parseInt(parts[1], 10),
          developmentUsers: parseInt(parts[2], 10),
          pageRank: parseFloat(parts[3])
        };
      });
    return projects;
  };

  context.getProjectDataSortedBy = function(prop, ascending) {
    var copy = projects.slice();
    copy.sort(function(p1, p2) {
      var v1 = p1[prop];
      var v2 = p2[prop];

      if (v1 < v2) {
        return ascending ? -1 : 1;
      } else if (v1 > v2) {
        return ascending ? 1 : -1;
      } else {
        return 0;
      }
    });
    return copy;
  };

})(this);
