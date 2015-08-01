var plottyjs = {};
(function(){
  this.makePlots = function(els) {
    for (var i = 0; i < els.length; ++i) {
      var el = els[i];

      var svg = d3.select(el).append('svg');
      svg.attr("width", el.dataset.width).attr("height", el.dataset.height);

      var chart = new this.Plot(svg, {
        t: el.dataset.from
            ? [Number.parseFloat(el.dataset.from), Number.parseFloat(el.dataset.to)]
            : null,
        xbounds: el.dataset.left
            ? [Number.parseFloat(el.dataset.left), Number.parseFloat(el.dataset.right)]
            : null,
        ybounds: el.dataset.bottom
            ? [Number.parseFloat(el.dataset.bottom), Number.parseFloat(el.dataset.top)]
            : null,
        samples: el.dataset.samples
            ? Number.parseFloat(el.dataset.samples)
            : null,
        margin: el.dataset.margin
            ? Number.parseFloat(el.dataset.margin)
            : null,
      });

      if (el.dataset.y && el.dataset.x) {
        chart.parametric(el.dataset.x, el.dataset.y);
      } else if (el.dataset.r) {
        chart.polar(el.dataset.r);
      } else {
        chart.cartesian(el.dataset.y);
      }
    }
  };

  this.newPlot = function(width, height, options) {
    var a = d3.selectAll("script");
    var script = a[0][a[0].length - 1];
    var svg = d3.select(script.parentNode).append("svg");
    svg.attr("width", width).attr("height", height);
    return new this.Plot(svg, options);
  };

  this.Plot = function(root, options) {
    this.svg = root;
    this.t = options.t || [-1, 1];
    this.samples = options.samples || 100;
    this.xbounds = options.xbounds;
    this.ybounds = options.ybounds;
    this.margin = options.margin || 2;

    this.width = root.attr("width");
    this.height = root.attr("height");

    this.xScale = undefined;
    this.yScale = undefined;
  };

  this.Plot.prototype.cartesian = function (y, t) {
    if (typeof y == 'string') {
      var f = math.compile(y);
      y = function (x) {
        return f.eval({
          x: x
        });
      };
    }
    var line = this.plot(identity, y);
    return line;
  };

  this.Plot.prototype.polar = function (r) {
    if (typeof r == 'string') {
      var f = math.compile(r);
      r = function(o) {
        return f.eval({
          o: o
        });
      };
    }
    var line = this.plot(function (o) {
        return r(o) * Math.cos(o);
    }, function (o) {
        return r(o) * Math.sin(o);
    });
    return line;
  };

  this.Plot.prototype.parametric = function (x, y) {
    if (typeof x == 'string') {
      var fx = math.compile(x);
      x = function (t) {
        return fx.eval({
          t: t
        });
      };
    }
    if (typeof y == 'string') {
      var fy = math.compile(y);
      y = function (t) {
        return fy.eval({
          t: t
        });
      };
    }
    var line = this.plot(x, y);
    return line;
  };

  this.Plot.prototype.plot = function (fx, fy) {
    var dt = (this.t[1] - this.t[0]) / this.samples;
    var ts = d3.range(this.t[0], this.t[1] + dt, dt);

    // Array of Arrays of points, for each piece of the function.
    // Functions with no vertical asymptotes have a single 'piece'.
    var pieces = [];
    // Array of points currently being added.
    var pts = [];

    var lastPt = null;
    var lastT = null;
    for (var i = 0; i < ts.length; i++) {
      t1 = ts[i];
      var x1 = fx(t1);
      var y1 = fy(t1);
      var pt = [x1, y1];

      if (Number.isNaN(x1) || !Number.isFinite(x1) || Number.isNaN(y1) || !Number.isFinite(y1)) {
        if (pts.length > 0) pieces.push(pts);
        pts = [];
        lastPt = null;
      } else if (checkAsymptote(fx, fy, lastT, lastPt, t1, pt, 0)) {
        if (pts.length > 0) pieces.push(pts);
        pts = [];
        pts.push(pt);
        lastPt = pt;
      } else {
        pts.push(pt);
        lastPt = pt;
      }
      lastT = t1;
    }
    if (pts.length > 0) pieces.push(pts);

    this._getScale(pieces);
    var line = d3.svg.line().x(wrapIndex(this.x, 0)).y(wrapIndex(this.y, 1));

    // Stick all the pieces together
    var lineData = "";
    for (var i = 0; i < pieces.length; ++i) {
      if (pieces[i].length > 1) {
        lineData += line(pieces[i]);
      }
    }
    return this.svg.append("path").attr("d", lineData);
  };

  this.Plot.prototype._getScale = function (pts) {
    if (this.x && this.y) return;

    if (this.xbounds) {
      this.x = d3.scale.linear()
          .domain([this.xbounds[0], this.xbounds[1]])
          .range([this.margin, this.width - this.margin]);
    } else {
      var flat = pts.reduce(function(a, b) {
        return a.concat(b);
      }).map(function(a) {
          return a[0];
      }).filter(function(a) {
        return a;
      });
      this.x = d3.scale.linear()
          .domain([d3.min(flat), d3.max(flat)])
          .range([this.margin, this.width - this.margin]);
    }

    if (this.ybounds) {
      this.y = d3.scale.linear()
          .domain([this.ybounds[0], this.ybounds[1]])
          .range([this.height - this.margin, this.margin]);
    } else {
      var flat = pts.reduce(function(a, b) {
        return a.concat(b);
      }).map(function(a) {
          return a[1];
      }).filter(function(a) {
        return a;
      });
      this.y = d3.scale.linear()
          .domain([d3.min(flat), d3.max(flat)])
          .range([this.height - this.margin, this.margin]);
    }
  };

  // ================================================================
  // Private functions
  function wrapIndex(f, i) {
    return function (p) {
      return f(p[i]);
    };
  }

  function getIndex(i) {
    return (function (x) {
      return x[i];
    });
  }

  function identity(x) {
    return x;
  }

  function sign(a, b) {
    if (a > b) return 1;
    if (a < b) return -1;
    return 0;
  }

  function checkAsymptote(fx, fy, t1, p1, t2, p2, n) {
    if (t1 == null || p1 == null || n > 10) {
      return false;
    }

    var mt = t1 + (t2 - t1) / 2;
    var mx = fx(mt);
    var my = fy(mt);
    var mp = [mx, my];

    if (Number.isNaN(mx) || !Number.isFinite(mx) ||
        Number.isNaN(my) || !Number.isFinite(my)) {
      return true;
    }

    var s1 = sign(p1[1], my);
    var s2 = sign(my, p2[1]);
    // Neither s1 or s2 are '0', i.e this section was not flat,
    // and they are different, so derivative changed sign.
    if (s1 && s2 && s1 != s2) {
      if (n == 10) {
        // We have subdivided enough without finding an Inf or NaN.
        return true;
      }
      return checkAsymptote(fx, fy, t1, p1, mt, mp, n + 1) ||
             checkAsymptote(fx, fy, mt, mp, t2, p2, n + 1);
    }
    return false;
  };

}).call(plottyjs);
