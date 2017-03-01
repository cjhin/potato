(function() {
  var root,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  window.Potato = (function() {
    var default_params;

    default_params = {
      split: true,
      color: true,
      size: true,
      "class": null
    };

    function Potato(data, params) {
      if (params == null) {
        params = default_params;
      }

      this.data = data;
      this.create_filters();

      this.labels = [];

      $("#vis").append("<div class='tooltip' id='node-tooltip'></div>").append("<div id='toolbar'><div id='modifiers'></div><div id='filter-select-buttons'></div></div>");
      $("#node-tooltip").hide();

      this.width = $(window).width();
      this.height = $(window).height() - 55;
      this.svg = d3.select("#vis").append("svg").attr("viewBox", "0 0 " + this.width + " " + this.height).attr("id", "vis-svg");

      $.each(params, (function(_this) {
        return function(k, v) {
          if (k !== 'class' && v === true) {
            return _this.create_buttons(k);
          }
        };
      })(this));

      // for now arbitrarily start all nodes at radius of 5
      data.forEach(function(d) {
        d.radius = 5;
      });

      // "Electric repulsive charge", prevents overlap of nodes
      var chargeForce = d3.forceManyBody().strength(function(d) {
        // base it on the radius of the node
        return -Math.pow(d.radius, 2.0) * 0.2;
      });

      // Keep nodes centered on screen
      var centerXForce = d3.forceX(this.width / 2);
      var centerYForce = d3.forceY(this.height / 2);

      // Apply default forces to simulation
      this.simulation = d3.forceSimulation()
          .force("charge", chargeForce)
          .force("x", centerXForce)
          .force("y", centerYForce);

      var node = this.svg.selectAll("circle")
          .data(data)
          .enter().append("circle")
          .attr("r", function(d) {
            return d.radius;
          })
          .attr("fill", "#777");

      // Add the nodes to the simulation, and specify how to draw
      this.simulation.nodes(data)
          .on("tick", function() {
            // The d3 force simulation updates the x & y coordinates
            // of each node every tick/frame, based on the various active forces.
            // It is up to us to translate these coordinates to the screen.
            node.attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; });

            // TODO: hmmmm so one option is to update labels here, and not actually attach them to the physics simulation

          });
    }

    // Update any labels on the screen as needed, called by orderBy and splitBy
    Potato.prototype.updateLabels = function() {
      var text = this.svg.selectAll(".split-labels")
          .data(this.labels)

      var enter = text.enter().append("text");

      // .merge() is a new thing from d3v4 if you want the updates to apply to
      // new/appended elements
      // http://stackoverflow.com/questions/38297872/d3-js-v4-0-0-alpha-35-transitions-not-working
      text.merge(enter).transition()
          .attr("class", "split-labels")
          .text(function(d) { return d.val; })
          .attr("x", function(d) { return d.tarx; })
          .attr("y", function(d) { return d.tary; });

      text.exit().remove();
    }

    Potato.prototype.order_by = function(filter) {

      var extent = this.getNumericExtent(filter);

      var orderPadding = 160;

      // TODO: should we allow switching between linear and sqrt scale?
      var orders = d3.scaleLinear()
          .domain([extent.min, extent.max])
          .range([orderPadding, this.width - orderPadding]);

      // TODO: this should probably move to the reset function
      this.labels = [];

      // Tail
      this.labels.push({
        val: extent.min,
        split: filter,
        tarx: orders.range()[0],
        tary: this.height / 2.0 - 50 // TODO: either make this relative to the number of nodes, or do the fancy thing in the old version
      });
      // Head
      this.labels.push({
        val: extent.max,
        split: filter,
        tarx: orders.range()[1],
        tary: this.height / 2.0 - 50 // TODO: either make this relative to the number of nodes, or do the fancy thing in the old version
      });

      // TODO: add the line thing between the labels?
      this.updateLabels();

      var xForceFn = d3.forceX(function(d) {
        var new_x = orders(parseFloat(d[filter]))
        // if this row doesn't have this value, then fly off screen (to left)
        if(isNaN(parseFloat(d[filter]))) {
          return -100;
        }
        return new_x;
      });

      var yForceFn = d3.forceY(this.height / 2.0);
      this.simulation.force("x", xForceFn);
      this.simulation.force("y", yForceFn);

      this.simulation.alpha(1).restart();

      //TODO: Handle edge case with only one value
      /*if (filterMin === filterMax) {
        orders.range([this.width / 2.0, this.width / 2.0]);
      }*/
      // TODO: labels
    };

    Potato.prototype.split_by = function(filter, data_type) {
      var curr_col, curr_row, curr_vals, height_2, num_cols, num_rows, width_2;

      // TODO: this probably needs to be... this.data[]?
      /*
      if (this.nodes === void 0 || this.nodes.length === 0) {
        return;
      }*/

      // TODO: fix this
      //this.reset('split');

      // TODO: Change the hint on the button, seems like maybe this should go somewhere else?
      $("#split-hint").html("<br>" + filter);
      $("#split-" + filter).addClass('active-filter');

      if (data_type === "num") {
        // TODO: implement order_by
        return this.order_by(filter);
      } else {
        // first determine the unique values for this category in the dataset, also sort
        var uniqueKeys = d3.map(this.data, function(d) {
          return d[filter];
        }).keys().sort();

        // then determine what spots all the values should go to
        num_cols = Math.ceil(Math.sqrt(uniqueKeys.length));
        num_rows = Math.ceil(uniqueKeys.length / num_cols);
        curr_row = 0;
        curr_col = 0;

        // padding because the clumps tend to float off the screen
        width_2 = this.width * 0.8;
        height_2 = this.height * 0.8;

        var keysToLocation = {};

        // TODO: this should probably move to the reset function
        this.labels = [];

        // then for each category value, increment to give the "row/col" coordinate
        // maybe save this in an object where key == category and value = {row: X, col: Y}
        uniqueKeys.forEach((function(_this) {
          return function(d) {
            var finalObj = {
              x: (_this.width * 0.12) + (0.5 + curr_col) * (width_2 / num_cols),
              y: (_this.height * 0.10) + (0.5 + curr_row) * (height_2 / num_rows)
            };

            curr_col++;
            if (curr_col >= num_cols) {
              curr_col = 0;
              curr_row++;
            }

            keysToLocation[d] = finalObj;

            // also add a filter label
            _this.labels.push({
              val: d,
              split: filter,
              tarx: finalObj.x,
              tary: finalObj.y - 50 // TODO: either make this relative to the number of nodes, or do the fancy thing in the old version
            });
          };
        })(this));

        this.updateLabels();

        var xForceFn = d3.forceX(function(d) {
          return keysToLocation[d[filter]].x;
        });

        var yForceFn = d3.forceY(function(d) {
          return keysToLocation[d[filter]].y;
        });
        this.simulation.force("x", xForceFn);
        this.simulation.force("y", yForceFn);

        this.simulation.alpha(1).restart();
      }
    };

    Potato.prototype.size_by = function(filter) {
      /*
      if (this.nodes === void 0 || this.nodes.length === 0) {
        return;
      }*/
      //this.reset('size');
      $("#size-hint").html("<br>" + filter);
      $("#size-" + filter).addClass('active-filter');

      var extent = this.getNumericExtent(filter);

      var sizeScale = d3.scaleSqrt()
          .domain([extent.min, extent.max])
          .range([3, 12]);

      // handle missing values gracefully by setting circle size to zero
      this.data.forEach(function(d) {
        var currSize = sizeScale(d[filter]);
        if (!isNaN(currSize) && currSize !== "" && currSize > 0) {
          d.radius = currSize;
        } else {
          d.radius = 0;
        }
      });

      // update the actual circle svg sizes
      this.svg.selectAll("circle")
          .data(this.data)
          .transition()
          .attr("r", function(d) {
            return d.radius;
          });

      // but also update the simulation

      var chargeForce = d3.forceManyBody().strength(function(d) {
        // base it on the radius of the node
        return -Math.pow(d.radius, 2.0) * 0.2;
      });

      // change chargeForce to take into account new node sizes
      this.simulation.force("charge", chargeForce)
      this.simulation.alpha(1).restart();
    };

    Potato.prototype.color_by = function(filter, data_type) {
      var curr_vals;
      /*if (this.nodes === void 0 || this.nodes.length === 0) {
        return;
      }*/
      //this.reset('color');

      // hmmmm we should probably just do this at init?
      if ($("#color-legend").length < 1) {
        $("#vis").append("<div id='color-legend'></div>")
        $("#color-legend").append("<svg></svg>");
      }
      $("#color-hint").html("<br>" + filter);
      $("#color-" + filter).addClass('active-filter');

      // first determine the unique values for this category in the dataset, also sort alpha
      // historically it was ranked by number, but I think alpha may actually be better?
      // to keep female/asian/Argentina as one color no matter what the other splits are?
      var uniqueKeys = d3.map(this.data, function(d) {
        return d[filter];
      }).keys().sort();

      var numeric = data_type === 'num';

      var colorScale;
      // if numeric do gradient, else do categorical
      if(numeric === true) {
        var extent = this.getNumericExtent(filter);

        colorScale = d3.scaleLinear()
            .domain([extent.min, extent.max])
            .range(["#ccc", "#1f77b4"]);
      } else {
        colorScale = d3.scaleOrdinal()
            .domain(uniqueKeys)
            .range(['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#bcbd22', '#17becf', '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5', '#c49c94', '#f7b6d2', '#dbdb8d', '#9edae5', '#777777']);
      }

      this.svg.selectAll("circle")
          .data(this.data)
          .transition()
          .attr("fill", function(d) { return colorScale(d[filter]); } );

      // TODO: there used to be code to limit to 18 total colors, and then group the rest in "other"

      // Setup legend
      var legendDotSize = 30;
      var legendWrapper = d3.select("#color-legend").select("svg")
          .attr("width", 150)
          .attr("height", colorScale.domain().length * legendDotSize)
          .style("padding", "20px 0 0 20px");

      // The text of the legend
      var legendText = legendWrapper.selectAll("text")
          .data(colorScale.domain());

      var textEnter = legendText.enter().append("text")
          .attr("y", function(d, i) { return i * legendDotSize + 12; })
          .attr("x", 20);

      legendText.merge(textEnter).transition()
          .text(function(d) { return d; });

      legendText.exit().remove();

      // The dots of the legend
      var legendDot = legendWrapper.selectAll("rect")
          .data(colorScale.domain());

      var dotEnter = legendDot.enter().append("rect")
          .attr("y", function(d, i) { return i * legendDotSize; })
          .attr("rx", legendDotSize * 0.5)
          .attr("ry", legendDotSize * 0.5)
          .attr("width", legendDotSize * 0.5)
          .attr("height", legendDotSize * 0.5)
          .style("fill", function(d) { return colorScale(d); }); // we repeat this so it doesnt flash in from black

      legendDot.merge(dotEnter).transition()
          .style("fill", function(d) { return colorScale(d); });

      legendDot.exit().remove();
    };

    Potato.prototype.apply_filters = function() {
      return $(".active-filter").each((function(_this) {
        return function(i, filterObj) {
          var filter_id = $(filterObj).attr('id');
          var dash_loc = filter_id.indexOf('-');
          var type = filter_id.substr(0, dash_loc);
          var val = filter_id.substr(dash_loc + 1);
          return _this.apply_filter(type, val, $(filterObj).attr('data-type'));
        };
      })(this));
    };

    Potato.prototype.apply_filter = function(type, filter, data_type) {
      if (type === "split") {
        this.split_by(filter, data_type);
      }
      if (type === "color") {
        this.color_by(filter, data_type);
      }
      if (type === "size") {
        return this.size_by(filter);
      }
    };

    Potato.prototype.create_buttons = function(type) {
      var button_filters, type_upper;
      type_upper = type[0].toUpperCase() + type.slice(1);
      $("#modifiers").append("<div id='" + type + "-wrapper' class='modifier-wrapper'><button id='" + type + "-button' class='modifier-button'>" + type_upper + "<span class='button-arrow'>&#x25BC;</span><span id='" + type + "-hint' class='modifier-hint'></span></button><div id='" + type + "-menu' class='modifier-menu'></div></div>");
      $("#" + type + "-button").hover(function() {
        return $("#" + type + "-menu").slideDown(100);
      });
      $("#" + type + "-wrapper").mouseleave(function() {
        return $("#" + type + "-menu").slideUp(100);
      });
      $("#" + type + "-button").on("click", (function(_this) {
        return function() {
          return _this.reset(type);
        };
      })(this));
      button_filters = this.numeric_filters;
      if (type === "color" || type === "split") {
        button_filters = button_filters.concat({
          value: '',
          type: 'divider'
        }).concat(this.categorical_filters);
      }
      return d3.select("#" + type + "-menu").selectAll('div').data(button_filters).enter().append("div").text(function(d) {
        return d.value;
      }).attr("class", function(d) {
        if (d.type === 'divider') {
          return 'divider-option';
        } else {
          return "modifier-option " + type + "-option";
        }
      }).attr("data-type", function(d) {
        return "" + d.type;
      }).attr("id", function(d) {
        return type + "-" + d.value;
      }).on("click", (function(_this) {
        return function(d) {
          return _this.apply_filter(type, d.value, d.type);
        };
      })(this));
    };

    Potato.prototype.create_filters = function() {
      var reset_button, reset_tooltip, sorted_filters;
      sorted_filters = {};

      this.filter_names = [];
      $.each(this.data[0], (function(_this) {
        return function(d) {
          var d_mod;
          if (d !== 'node_id') {
            d_mod = d.replace(/\(|\)/g, " ");
            _this.filter_names.push({
              value: d_mod
            });
            return sorted_filters[d_mod] = [];
          }
        };
      })(this));
      this.data.forEach((function(_this) {
        return function(d) {
          return $.each(d, function(k, v) {
            var filter_exists, k_mod;
            k_mod = k.replace(/\(|\)/g, " ");
            if (k_mod !== 'node_id') {
              filter_exists = $.grep(sorted_filters[k_mod], function(e) {
                return e.filter === k_mod && e.value === v;
              });
              if (filter_exists.length === 0) {
                return sorted_filters[k_mod].push({
                  filter: k_mod,
                  value: v
                });
              }
            }
          });
        };
      })(this));
      this.categorical_filters = [];
      this.numeric_filters = [];
      $.each(sorted_filters, (function(_this) {
        return function(f, v) {
          if (isNaN(v[0].value.replace(/%/, "").replace(/,/g, ""))) {
            if (v.length !== _this.data.length && v.length < 500) {
              return _this.categorical_filters.push({
                value: f,
                type: 'cat'
              });
            }
          } else {
            return _this.numeric_filters.push({
              value: f,
              type: 'num'
            });
          }
        };
      })(this));
      $.each(this.categorical_filters, (function(_this) {
        return function(k, v) {
          return sorted_filters[v.value].sort(function(a, b) {
            if (a.value === b.value) {
              return 0;
            } else {
              return (a.value > b.value) || -1;
            }
          });
        };
      })(this));
      reset_tooltip = $("<div class='tooltip' id='reset-tooltip'>Click and drag on the canvas to select nodes.</div>");
      reset_button = $("<button id='reset-button' class='disabled-button modifier-button'><span id='reset-icon'>&#8635;</span> Reset Selection</button>");
      reset_button.on("click", (function(_this) {
        return function(e) {
          if (!reset_button.hasClass('disabled-button')) {
            return _this.add_all();
          }
        };
      })(this)).on("mouseover", (function(_this) {
        return function(e) {
          return reset_tooltip.show();
        };
      })(this)).on("mouseout", (function(_this) {
        return function(e) {
          return reset_tooltip.hide();
        };
      })(this));
      reset_button.append(reset_tooltip);
      reset_tooltip.hide();
      return $("#filter-select-buttons").append(reset_button);
    };

    Potato.prototype.parseNumericString = function(str) {
      return parseFloat(str.replace(/%/, "").replace(/,/g, ""));
    };

    // for a given filter, get the extent (min and max)
    Potato.prototype.getNumericExtent = function(filter) {
      var filterMax = 0;
      var filterMin = null;
      for(var i = 0; i < this.data.length; i++) {
        var currVal = this.parseNumericString(this.data[i][filter]);

        // ignore emptys (NaN)
        if(!isNaN(currVal)) {
          if(currVal > filterMax) {
            filterMax = currVal;
          }
          if(filterMin === null || currVal < filterMin) {
            filterMin = currVal;
          }
        }
      }

      return { min: filterMin, max: filterMax };
    };

    return Potato;

  })();

  root = typeof exports !== "undefined" && exports !== null ? exports : this;

}).call(this);
