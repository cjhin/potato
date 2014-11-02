// Generated by CoffeeScript 1.7.1
(function() {
  var BubbleChart, root,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  BubbleChart = (function() {
    function BubbleChart(data) {
      this.safe_string = __bind(this.safe_string, this);
      this.hide_details = __bind(this.hide_details, this);
      this.show_details = __bind(this.show_details, this);
      this.move_towards_target = __bind(this.move_towards_target, this);
      this.adjust_label_pos = __bind(this.adjust_label_pos, this);
      this.update = __bind(this.update, this);
      this.color_by = __bind(this.color_by, this);
      this.color_buttons = __bind(this.color_buttons, this);
      this.split_by = __bind(this.split_by, this);
      this.split_buttons = __bind(this.split_buttons, this);
      this.remove_nodes = __bind(this.remove_nodes, this);
      this.add_nodes = __bind(this.add_nodes, this);
      this.remove_filter = __bind(this.remove_filter, this);
      this.add_filter = __bind(this.add_filter, this);
      this.remove_all = __bind(this.remove_all, this);
      this.add_all = __bind(this.add_all, this);
      this.subset_selection = __bind(this.subset_selection, this);
      this.create_filters = __bind(this.create_filters, this);
      this.data = data;
      this.width = $(window).width();
      this.height = $(window).height() - 105;
      $.each(this.data, (function(_this) {
        return function(i, d) {
          return d.node_id = i;
        };
      })(this));
      this.tooltip = CustomTooltip("node_tooltip");
      this.vis = d3.select("#vis").append("svg").attr("viewBox", "0 0 " + this.width + " " + this.height);
      this.force = d3.layout.force().gravity(-0.01).charge(function(d) {
        return -Math.pow(d.radius, 2.0) * 1.5;
      }).size([this.width, this.height]);
      this.nodes = this.force.nodes();
      this.labels = [];
      this.curr_filters = [];
      this.create_filters();
      this.split_buttons();
      if (data.length !== 1933) {
        this.color_buttons();
      }
      this.subset_selection();
    }

    BubbleChart.prototype.create_filters = function() {
      var filter_counter;
      this.filter_names = [];
      $.each(this.data[0], (function(_this) {
        return function(d) {
          if (d !== 'node_id' && d !== 'name') {
            return _this.filter_names.push({
              value: d
            });
          }
        };
      })(this));
      this.filters = {};
      filter_counter = 1;
      return this.data.forEach((function(_this) {
        return function(d) {
          return $.each(d, function(k, v) {
            var filter_exists;
            if (k !== 'node_id' && k !== 'name') {
              filter_exists = 0;
              $.each(_this.filters, function(f, e) {
                if (e.filter === k && e.value === v) {
                  filter_exists = 1;
                }
              });
              if (filter_exists === 0) {
                _this.filters[filter_counter] = {
                  id: filter_counter,
                  filter: k,
                  value: v
                };
                return filter_counter += 1;
              }
            }
          });
        };
      })(this));
    };

    BubbleChart.prototype.subset_selection = function() {
      var subset_select_button, subsets, that;
      subset_select_button = $("<button id='subset-select-button'>Select Subset</button>");
      subset_select_button.on("click", (function(_this) {
        return function(e) {
          return $("#subset-selection").toggle();
        };
      })(this));
      $("#modifiers").append(subset_select_button);
      $("#subset-selection").height(this.height);
      that = this;
      $("#all-data").addClass("filter-0").on("click", function(e) {
        if ($(this).hasClass("active")) {
          return that.remove_all();
        } else {
          $(this).addClass("active");
          that.add_all();
          return $("#subset-selection").hide();
        }
      });
      subsets = {};
      $.each(this.filter_names, (function(_this) {
        return function(k, v) {
          return subsets[v.value] = [];
        };
      })(this));
      $.each(this.filters, (function(_this) {
        return function(k, v) {
          return subsets[v.filter].push(v);
        };
      })(this));
      $.each(subsets, (function(_this) {
        return function(k, v) {
          var filter_group, filter_id;
          filter_id = "filter" + k;
          filter_group = $("<div class='filter-group-wrapper'><div class='filter-group-header'>" + k + "</div><div class='filter-group' id='" + filter_id + "'></div></div>");
          $("#subset-groups").append(filter_group);
          that = _this;
          return d3.select("#" + filter_id).selectAll('div').data(v).enter().append("div").attr("class", function(d) {
            return "filter-value filter-" + d.id;
          }).text(function(d) {
            return d.value;
          }).on("click", function(d) {
            if ($(this).hasClass("active")) {
              return that.remove_filter(d.id);
            } else {
              that.add_filter(d.id);
              return $(this).addClass("active");
            }
          });
        };
      })(this));
      return $("#subset-selection").show();
    };

    BubbleChart.prototype.add_all = function() {
      var filter_button;
      if (this.nodes.length !== this.data.length) {
        if (this.curr_filters.length > 0) {
          this.remove_all();
        }
        this.curr_filters.push({
          id: 0
        });
        filter_button = $("<button class='active filter-button filter-0'>All Data</button>");
        filter_button.on("click", (function(_this) {
          return function(e) {
            return _this.remove_all();
          };
        })(this));
        $("#filter-select-buttons").append(filter_button);
        return this.add_nodes(null);
      }
    };

    BubbleChart.prototype.remove_all = function() {
      return $.each(this.curr_filters, (function(_this) {
        return function(k, f) {
          return _this.remove_filter(f.id);
        };
      })(this));
    };

    BubbleChart.prototype.add_filter = function(id) {
      var curr_filter, filter_button;
      curr_filter = this.filters[id];
      if (this.curr_filters.length === 1 && this.curr_filters[0].id === 0) {
        this.remove_all();
      }
      if (this.curr_filters.length === 0) {
        $("#filter-select-buttons").text("Current subsets: ");
      }
      this.curr_filters.push(curr_filter);
      filter_button = $("<button class='active filter-button filter-" + id + "'>" + curr_filter.value + "</button>");
      filter_button.on("click", (function(_this) {
        return function(e) {
          return _this.remove_filter(id);
        };
      })(this));
      $("#filter-select-buttons").append(filter_button);
      return this.add_nodes(id);
    };

    BubbleChart.prototype.remove_filter = function(id) {
      var curr_filter;
      curr_filter = this.filters[id];
      this.remove_nodes(id);
      $(".filter-" + id).each(function(k, v) {
        var f_obj;
        f_obj = $(v);
        if (f_obj.hasClass('filter-button')) {
          return f_obj.detach();
        } else {
          return f_obj.removeClass("active");
        }
      });
      if (this.curr_filters.length === 0) {
        return $("#filter-select-buttons").text("");
      }
    };

    BubbleChart.prototype.add_nodes = function(id) {
      var curr_filter, split_id;
      if (id) {
        curr_filter = this.filters[id];
      }
      this.data.forEach((function(_this) {
        return function(d) {
          var curr_class, curr_r, node, vals;
          if (id === null || d[curr_filter.filter] === curr_filter.value) {
            if ($.grep(_this.nodes, function(e) {
              return e.id === d.node_id;
            }).length === 0) {
              vals = {};
              $.each(_this.filter_names, function(k, f) {
                return vals[f.value] = d[f.value];
              });
              curr_class = '';
              curr_r = 5;
              if (d['team']) {
                curr_class = d.team;
                curr_r = 8;
              }
              node = {
                id: d.node_id,
                radius: curr_r,
                name: d.name,
                values: vals,
                color: "#777",
                "class": curr_class,
                x: Math.random() * 900,
                y: Math.random() * 800,
                tarx: _this.width / 2.0,
                tary: _this.height / 2.0
              };
              return _this.nodes.push(node);
            }
          }
        };
      })(this));
      this.update();
      split_id = $(".split-option.active").attr('id');
      if (split_id !== void 0) {
        return this.split_by(split_id.split('-')[1]);
      }
    };

    BubbleChart.prototype.remove_nodes = function(id) {
      var curr_filter, len, should_remove;
      if (id === 0) {
        while (this.nodes.length > 0) {
          this.nodes.pop();
        }
        while (this.curr_filters.length > 0) {
          this.curr_filters.pop();
        }
      } else {
        curr_filter = this.filters[id];
        this.curr_filters = $.grep(this.curr_filters, (function(_this) {
          return function(e) {
            return e['filter'] !== curr_filter.filter || e['value'] !== curr_filter.value;
          };
        })(this));
        len = this.nodes.length;
        while (len--) {
          if (this.nodes[len]['values'][curr_filter.filter] === curr_filter.value) {
            should_remove = true;
            this.curr_filters.forEach((function(_this) {
              return function(k) {
                if (_this.nodes[len]['values'][k['filter']] === k['value']) {
                  return should_remove = false;
                }
              };
            })(this));
            if (should_remove === true) {
              this.nodes.splice(len, 1);
            }
          }
        }
      }
      return this.update();
    };

    BubbleChart.prototype.split_buttons = function() {
      $("#modifiers").append("<div id='split-wrapper' class='modifier-wrapper'><button id='split-button' class='modifier-button'>Split By<span class='button-arrow'>&#x25BC;</span><span id='split-hint' class='modifier-hint'></span></button><div id='split-menu' class='modifier-menu'></div></div>");
      $("#split-button").hover(function() {
        return $("#split-menu").slideDown(100);
      });
      $("#split-wrapper").mouseleave(function() {
        return $("#split-menu").slideUp(100);
      });
      return d3.select("#split-menu").selectAll('div').data(this.filter_names).enter().append("div").text(function(d) {
        return d.value;
      }).attr("class", 'modifier-option split-option').attr("id", function(d) {
        return 'split-' + d.value;
      }).on("click", (function(_this) {
        return function(d) {
          return _this.split_by(d.value);
        };
      })(this));
    };

    BubbleChart.prototype.split_by = function(split) {
      var curr_col, curr_row, curr_vals, height_2, num_cols, num_rows, width_2;
      if (this.circles === void 0 || this.circles.length === 0) {
        return;
      }
      $("#split-hint").html("<br>" + split);
      $(".split-option").removeClass('active');
      $("#split-" + split).addClass('active');
      while (this.labels.length > 0) {
        this.labels.pop();
      }
      curr_vals = [];
      this.circles.each((function(_this) {
        return function(c) {
          if (curr_vals.indexOf(c['values'][split]) < 0) {
            return curr_vals.push(c['values'][split]);
          }
        };
      })(this));
      num_rows = Math.round(Math.sqrt(curr_vals.length)) + 1;
      num_cols = curr_vals.length / (num_rows - 1);
      curr_row = 0;
      curr_col = 0;
      width_2 = this.width * 0.75;
      height_2 = this.height * 0.8;
      curr_vals.sort();
      curr_vals.forEach((function(_this) {
        return function(s, i) {
          var label;
          curr_vals[i] = {
            split: s,
            tarx: (_this.width * 0.08) + (0.5 + curr_col) * (width_2 / num_cols),
            tary: (_this.height * 0.15) + (0.5 + curr_row) * (height_2 / num_rows)
          };
          label = {
            val: s,
            split: split,
            x: curr_vals[i].tarx,
            y: curr_vals[i].tary,
            tarx: curr_vals[i].tarx,
            tary: curr_vals[i].tary
          };
          _this.labels.push(label);
          curr_col++;
          if (curr_col >= num_cols) {
            curr_col = 0;
            return curr_row++;
          }
        };
      })(this));
      this.circles.each((function(_this) {
        return function(c) {
          return curr_vals.forEach(function(s) {
            if (s.split === c['values'][split]) {
              c.tarx = s.tarx;
              return c.tary = s.tary;
            }
          });
        };
      })(this));
      return this.update();
    };

    BubbleChart.prototype.color_buttons = function() {
      $("#modifiers").append("<div id='color-wrapper' class='modifier-wrapper'><button id='color-button' class='modifier-button'>Color By<span class='button-arrow'>&#x25BC;</span><span id='color-hint' class='modifier-hint'></span></button><div id='color-menu' class='modifier-menu'></div></div>");
      $("#color-button").hover(function() {
        return $("#color-menu").slideDown(100);
      });
      $("#color-wrapper").mouseleave(function() {
        return $("#color-menu").slideUp(100);
      });
      return d3.select("#color-menu").selectAll('div').data(this.filter_names).enter().append("div").text(function(d) {
        return d.value;
      }).attr("class", 'modifier-option color-option').attr("id", function(d) {
        return 'color-' + d.value;
      }).on("click", (function(_this) {
        return function(d) {
          return _this.color_by(d.value);
        };
      })(this));
    };

    BubbleChart.prototype.color_by = function(split) {
      var colors, curr_vals, g, l_size, legend, num_colors;
      if (this.circles === void 0 || this.circles.length === 0) {
        return;
      }
      $("#color-hint").html("<br>" + split);
      $(".color-option").removeClass('active');
      $("#color-" + split).addClass('active');
      curr_vals = [];
      this.circles.each((function(_this) {
        return function(c) {
          if (curr_vals.indexOf(c['values'][split]) < 0) {
            return curr_vals.push(c['values'][split]);
          }
        };
      })(this));
      num_colors = curr_vals.length;
      colors = d3.scale.ordinal().domain(curr_vals).range(['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf', '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5', '#c49c94', '#f7b6d2', '#c7c7c7', '#dbdb8d', '#9edae5']);
      d3.select("#color-legend").selectAll("*").remove();
      l_size = 30;
      legend = d3.select("#color-legend").append("svg").attr("width", 150).attr("height", colors.domain().length * l_size).style("padding", "20px 0 0 20px");
      g = legend.selectAll("g").data(colors.domain()).enter().append("g");
      g.append("rect").attr("y", function(d, i) {
        return i * l_size;
      }).attr("rx", l_size * 0.5).attr("ry", l_size * 0.5).attr("width", l_size * 0.5).attr("height", l_size * 0.5).style("fill", (function(_this) {
        return function(d) {
          return colors(d);
        };
      })(this));
      g.append("text").attr("x", 20).attr("y", function(d, i) {
        return i * l_size + 12;
      }).text(function(d) {
        return d;
      });
      this.circles.each((function(_this) {
        return function(c) {
          return curr_vals.forEach(function(s) {
            if (s === c['values'][split]) {
              return c.color = String(colors(s));
            }
          });
        };
      })(this));
      return this.circles.attr("fill", function(d) {
        return d.color;
      });
    };

    BubbleChart.prototype.update = function() {
      var that;
      this.circles = this.vis.selectAll("circle").data(this.nodes, function(d) {
        return d.id;
      });
      that = this;
      this.circles.enter().append("circle").attr("r", 0).attr("stroke-width", 3).attr("id", function(d) {
        return "bubble_" + d.id;
      }).attr("fill", function(d) {
        return d.color;
      }).on("mouseover", function(d, i) {
        return that.show_details(d, i, this);
      }).on("mouseout", function(d, i) {
        return that.hide_details(d, i, this);
      }).attr("class", function(d) {
        if (d["class"].length > 0) {
          return d["class"].toLowerCase().replace(/\s/g, '_').replace('.', '');
        } else {
          return '';
        }
      });
      this.circles.transition().duration(2000).attr("r", function(d) {
        return d.radius;
      });
      this.circles.exit().remove();
      this.vis.selectAll(".split-labels").remove();
      this.text = this.vis.selectAll(".split-labels").data(this.labels);
      this.text.enter().append("text").attr("x", function(d) {
        return d.x;
      }).attr("y", function(d) {
        return d.y;
      }).attr("class", 'split-labels').text(function(d) {
        return d.val;
      });
      this.text.exit().remove();
      this.force.on("tick", (function(_this) {
        return function(e) {
          _this.circles.each(_this.move_towards_target(e.alpha)).attr("cx", function(d) {
            return d.x;
          }).attr("cy", function(d) {
            return d.y;
          });
          _this.text.each(_this.adjust_label_pos());
          return _this.text.each(_this.move_towards_target(e.alpha)).attr("x", function(d) {
            return d.x;
          }).attr("y", function(d) {
            return d.y;
          });
        };
      })(this));
      return this.force.start();
    };

    BubbleChart.prototype.adjust_label_pos = function() {
      return (function(_this) {
        return function(d) {
          var max_x, min_x, min_y;
          min_y = 10000;
          min_x = 10000;
          max_x = 0;
          _this.circles.each(function(c) {
            if (d.val === c['values'][d.split]) {
              if ((c.y - c.radius) < min_y) {
                min_y = c.y - c.radius;
              }
              if ((c.x - c.radius) < min_x) {
                min_x = c.x - c.radius;
              }
              if ((c.x + c.radius) > max_x) {
                return max_x = c.x + c.radius;
              }
            }
          });
          d.tary = min_y - 10;
          return d.tarx = (max_x - min_x) / 2.0 + min_x;
        };
      })(this);
    };

    BubbleChart.prototype.move_towards_target = function(alpha) {
      return (function(_this) {
        return function(d) {
          d.x = d.x + (d.tarx - d.x) * 0.7 * alpha;
          return d.y = d.y + (d.tary - d.y) * 0.7 * alpha;
        };
      })(this);
    };

    BubbleChart.prototype.show_details = function(data, i, element) {
      var content;
      content = "<div class='tooltip-name'>" + data.name + "</div>";
      $.each(data.values, function(k, v) {
        return content += "" + v + "<br/>";
      });
      return this.tooltip.showTooltip(content, d3.event);
    };

    BubbleChart.prototype.hide_details = function(data, i, element) {
      return this.tooltip.hideTooltip();
    };

    BubbleChart.prototype.safe_string = function(input) {
      return input.toLowerCase().replace(/\s/g, '_').replace('.', '');
    };

    return BubbleChart;

  })();

  root = typeof exports !== "undefined" && exports !== null ? exports : this;

  $(function() {
    var chart, render_vis;
    chart = null;
    render_vis = function(csv) {
      $("#toolbar").css("visibility", "visible");
      $(".load-screen").hide();
      return chart = new BubbleChart(csv);
    };
    $("#file-uploader").on('change', (function(_this) {
      return function(e) {
        var file, fileReader;
        file = e.target.files[0];
        if (file.type === 'text/csv') {
          fileReader = new FileReader();
          fileReader.onload = function(e) {
            return render_vis(d3.csv.parse(fileReader.result));
          };
          return fileReader.readAsText(file);
        }
      };
    })(this));
    $("#nfl-dataset").on('click', (function(_this) {
      return function(e) {
        return d3.csv("data/football/players_2.csv", render_vis);
      };
    })(this));
    $("#billionaire-dataset").on('click', (function(_this) {
      return function(e) {
        return d3.csv("data/billion/billionaire.csv", render_vis);
      };
    })(this));
    return $("#auto-dataset").on('click', (function(_this) {
      return function(e) {
        return d3.csv("data/auto/auto.csv", render_vis);
      };
    })(this));
  });

}).call(this);
