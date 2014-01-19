(function(context) {
  'use strict';

  var dom = React.DOM;

  function loadCsv() {
    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function() {
        if (xhr.readyState !== 4) return;

        if (199 < xhr.status && xhr.status < 300) {
          resolve(xhr.responseText);
        } else {
           reject(new Error('Response code is ' + xhr.status));
        }
      };
      xhr.ontimeout = function() {
        reject(new Error('Request timed out.'));
      };
      xhr.timeout = 60000;
      xhr.open('GET', 'stats.csv', true);
      xhr.send();
    });
  }


  function transformToJs(s) {
    return s.split('\n')
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
  }


  function sortProjectData(appState) {
    var ascending = appState.sort.ascending;
    var prop = appState.sort.property;
    var getter = null;
    if (prop === 'users') {
      getter = function(project) {
        return project.runtimeUsers + project.developmentUsers;
      };
    } else {
      getter = function(project) {
        return project[prop];
      };
    }

    function comparator(p1, p2) {
      var v1 = getter(p1);
      var v2 = getter(p2);

      if (v1 < v2) {
        return ascending ? -1 : 1;
      } else if (v1 > v2) {
        return ascending ? 1 : -1;
      } else {
        return 0;
      }
    }
    appState.projects.sort(comparator);
    if (appState.filteredProjects) {
      appState.filteredProjects.sort(comparator);
    }

    return appState;
  }


  var DataTable = React.createClass({
    render: function() {
      var refresher = this.props.refresher;
      var appState = this.props.appState;
      var pageLength = appState.pageLength;
      var page = appState.page;
      var projects = appState.query ? appState.filteredProjects
                                    : appState.projects;

      var visibleProjects = [];
      if (projects.length > 0) {
        visibleProjects = projects.slice(page * pageLength,
          Math.min(projects.length, page * pageLength + pageLength));;
      }

      var setSortProperty = function(prop, defaultOrder, e) {
        if (appState.sort.property === prop) {
          appState.sort.ascending = !appState.sort.ascending;
        } else {
          appState.sort.ascending = defaultOrder;
          appState.sort.property = prop;
        }
        appState.page = 0;
        sortProjectData(appState);
        refresher();
        e.preventDefault();
      };

      var th = function(label, prop, defaultOrder) {
        var className = '';
        if (appState.sort.property === prop) {
          if (appState.sort.ascending) {
            className = 'ascending';
          } else {
            className = 'descending';
          }
        }
        return dom.th({
          href: '#',
          className: className,
          onClick: setSortProperty.bind(null, prop, defaultOrder)
        }, label);
      };

      return dom.table({},
        dom.thead({},
          dom.tr({},
            th('Name', 'name', true),
            th('# Users', 'users', false),
            th('# Runtime Users', 'runtimeUsers', false),
            th('# Development Users', 'developmentUsers', false),
            th('Page Rank', 'pageRank', false))),
        dom.tbody({},
          visibleProjects.map(function(project) {
            return dom.tr({},
              dom.td({},
                dom.a({href: 'https://npmjs.org/package/' + project.name},
                  project.name)),
              dom.td({}, numeral(project.runtimeUsers +
                project.developmentUsers).format('0,0')),
              dom.td({}, numeral(project.runtimeUsers).format('0,0')),
              dom.td({}, numeral(project.developmentUsers).format('0,0')),
              dom.td({}, numeral(project.pageRank).format('0,0.00')));
          })));
    }
  });


  var Pagination = React.createClass({
    render: function() {
      var refresher = this.props.refresher;
      var appState = this.props.appState;
      var projects = appState.query ? appState.filteredProjects
                                    : appState.projects;
      var pageLength = appState.pageLength;
      var page = appState.page;
      var pageCount = Math.ceil(projects.length / pageLength);

      return dom.ul({className: 'pagination'},
        dom.li({},
          dom.a({
            href: '#',
            dangerouslySetInnerHTML: {__html: "&laquo;&laquo;"},
            onClick: function(e) {
              appState.page = 0;
              refresher();
              e.preventDefault();
            }})),
        dom.li({},
          dom.a({
            href: '#',
            dangerouslySetInnerHTML: {__html: "&laquo;"},
            onClick: function(e) {
              appState.page = Math.max(0, appState.page - 1);
              refresher();
              e.preventDefault();
            }})),
        dom.li({},
          dom.span({}, 'Page ' + (page + 1) + ' / ' + Math.max(pageCount, 1))),
        dom.li({},
          dom.a({
            href: '#',
            dangerouslySetInnerHTML: {__html: "&raquo;"},
            onClick: function(e) {
              appState.page = Math.min(pageCount, appState.page + 1);
              refresher();
              e.preventDefault();
            }})),
        dom.li({},
          dom.a({
            href: '#',
            dangerouslySetInnerHTML: {__html: "&raquo;&raquo;"},
            onClick: function(e) {
              appState.page = pageCount - 1;
              refresher();
              e.preventDefault();
            }})));
    }
  });


  var LoadingNotification = React.createClass({
    render: function() {
      return dom.div({className: 'loading'},
        dom.img({src: 'img/loading-animation.gif'}),
        dom.p({}, 'Downloading statistics, please wait...'));
    }
  });


  var Search = React.createClass({
    render: function() {
      var self = this;
      return dom.div({className: 'search'},
        dom.label({htmlFor: 'search'}, 'Search'),
        dom.input({
          type: 'search',
          'id': 'search',
          onChange: function(e) {
            var query = e.target.value.toLowerCase();
            var projects = self.props.appState.projects;
            var filtered = projects.filter(function(project) {
              return project.name.toLowerCase().indexOf(query) !== -1;
            });
            self.props.appState.query = query;
            self.props.appState.filteredProjects = filtered;
            self.props.appState.page = 0;
            self.props.refresher();
          }
        }));
    }
  });


  var updateStats = function(projects) {
    var nodes = projects.length;
    var edges = projects.reduce(function(n, project) {
      return n + project.runtimeUsers + project.developmentUsers;
    }, 0);
    document.getElementById('projectCount').innerHTML =
      numeral(nodes).format('0,0');
    document.getElementById('referenceCount').innerHTML =
      numeral(edges).format('0,0');
  };


  var Relato = React.createClass({
    getInitialState: function() {
      return {
        projects: [],
        page: 0,
        pageLength: 15,
        sort: {
          property: 'pageRank',
          ascending: false
        }
      };
    },

    componentDidMount: function() {
      var self = this;
      loadCsv()
      .then(transformToJs)
      .then(function(projects) {
        updateStats(projects);
        var appState = self.getInitialState();
        appState.projects = projects;
        sortProjectData(appState);
        self.setState(appState);
        return appState;
      })
      .catch(function(err) {
        console.err(err);
      });
    },

    render: function() {
      if (this.state.projects.length === 0) {
        return LoadingNotification({});
      }
      var self = this;
      var refresher = function() {
        self.forceUpdate();
      };

      return dom.div({},
        Search({appState: this.state, refresher: refresher}),
        Pagination({appState: this.state, refresher: refresher}),
        DataTable({appState: this.state, refresher: refresher}));
    }
  });

  React.renderComponent(Relato({}), document.getElementById('npm-data'));
})(this);
