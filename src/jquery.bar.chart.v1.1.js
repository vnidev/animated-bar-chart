/**
 *   Animated bar chart library v1.1
 *   jquery.bar.chart.js
 *   Author: vnidev
 *
 *   License: Open source - MIT
 *   Please visit http://opensource.org/licenses/MIT for more information
 *
 *   Full details and documentation:
 *   https://github.com/vnidev/animated-bar-chart.git
 */
(function($) {

   /**
   * Initial function for generating animated bar chart
   *
   * @example
   *  $('#chtAnimatedBarChart').animatedBarChart(options);
   *
   * @param prop {Object} list of options for chart initialization
   *
   * @return {Object}
   */
   $.fn.animatedBarChart = function(prop) {
      var self = this;
      var item_id = $(self).attr('id');

      // init default params
      var defaults = $.extend(true, {}, {
         data: [], // data for chart rendering
         params: { // columns from data array for rendering graph
            group_name: 'group_name', // title for group name to be shown in legend
            name: 'name', // name for xaxis
            value: 'value' // value for yaxis
         },
         horizontal_bars: false, // default chart orientation
         chart_height: 400, // default chart height in px
         colors: null, // colors for chart
         show_legend: true, // show chart legend
         x_grid_lines: true, // show x grid lines
         y_grid_lines: true, // show y grid lines
         tweenDuration: 300, // speed for tranistions
         bars: { // default bar settings
            padding: 0.075, // padding between bars
            opacity: 0.7, // default bar opacity
            opacity_hover: 0.45, // default bar opacity on mouse hover
            disable_hover: false, // disable animation and legend on hover
            hover_name_text: 'name', // text for name column for label displayed on bar hover
            hover_value_text: 'value', // text for value column for label displayed on bar hover
         },
         number_format: { // default locale for number format
            format: ',.2f', // default number format
            decimal: '.', // decimal symbol
            thousands : ',', // thousand separator symbol
            grouping: [3], // thousand separator grouping
            currency: ['$'] // currency symbol
         },
         margin: { // margins for chart rendering
            top: 0, // top margin
            right: 35, // right margin
            bottom: 20, // bottom margin
            left: 70 // left margin
         },
         rotate_x_axis_labels: { // rotate xaxis label params
            process: true, // process xaxis label rotation
            minimun_resolution: 720, // minimun_resolution for label rotating
            bottom_margin: 15, // bottom margin for label rotation
            rotating_angle: 90, // angle for rotation,
            x_position: 9, // label x position after rotation
            y_position: -3 // label y position after rotation
         }
      }, prop);

      // variables definition
      var _svg, _svg_chart, _width, _height,
         _xScale, _yScale, x_lines, y_lines,
         chart_container_margin = 0, rotate_labels = false,
         ul_container, data_distinct = [], chart_container, number_format;

      // function for creating gridlines in x and y axis
      function make_x_gridlines() { return d3.axisBottom(_xScale); }
      function make_y_gridlines() { return d3.axisLeft(_yScale); }

      /**
      * Main function for chart init
      *
      * @example
      *  self.init();
      *
      */
      self.init = function() {
         // initialize default colors if colors option is null
         if (!defaults.colors) {
            defaults.colors = [];
            var temp_color = d3.scaleOrdinal(d3.schemeCategory10);
            for (var i = 0; i < 10; i++)
            defaults.colors.push(temp_color(i));
         }

         // add top margin for details
         if (!defaults.bars.disable_hover) chart_container_margin = 20;

         // distonct group name data
         $.each(defaults.data, function(idx, item) {
            data_distinct.push(item[defaults.params.group_name]);
         });
         data_distinct = $.unique(data_distinct);

         // rotate xaxis labels if resolution is less then defined in defaults
         if ($(document).width() < defaults.rotate_x_axis_labels.minimun_resolution && defaults.rotate_x_axis_labels.process) {
            defaults.margin.bottom = defaults.margin.bottom + defaults.rotate_x_axis_labels.bottom_margin;
            rotate_labels = true;
         }

         // set d3 format locale
         d3.formatDefaultLocale(defaults.number_format);
         // set number formaat
         number_format = d3.format(defaults.number_format.format);

         // get container width and height
         var _container = $('#' + item_id);
         _width = _container.width();
         _height = defaults.chart_height; //_container.height();

         // draw svg container for chart
         _svg = d3.select('#' + item_id).append("svg")
            .attr("width", "100%").attr("height", defaults.chart_height)
            .attr('viewBox', '0 0 ' + _width + ' ' + _height)
            .attr('preserveAspectRatio', 'none');

         // init container for chart and move after legend
         _svg_chart = _svg.append('g').attr("class", "svg_chart").attr("transform", 'translate(' + defaults.margin.left + ', ' + defaults.margin.top + chart_container_margin + ')');

         // initialize x and y scale
         if (defaults.horizontal_bars) { // horizontal bar chart
            // define yScale
            _xScale= d3.scaleLinear()
               .range([0, _width - defaults.margin.left - defaults.margin.right])
               .domain([0, d3.max(defaults.data, function(d) { return d[defaults.params.value] })]);

            // define xScale
            _yScale = d3.scaleBand()
               .range([_height - defaults.margin.top - defaults.margin.bottom - chart_container_margin, 0])
               .domain(defaults.data.map( function(d) { return d[defaults.params.name]; }))
               .padding(defaults.bars.padding);
         }
         else { // vertical bar chart
            // define xScale
            _xScale = d3.scaleBand()
               .range([0, _width - defaults.margin.left - defaults.margin.right])
               .domain(defaults.data.map( function(d) { return d[defaults.params.name]; }))
               .padding(defaults.bars.padding);

            // define yScale
            _yScale= d3.scaleLinear()
               .range([_height - defaults.margin.top - defaults.margin.bottom - chart_container_margin, 0])
               .domain([0, d3.max(defaults.data, function(d) { return d[defaults.params.value] })]);
         }

         // add x and y scale to svg
         _svg_chart.append("g").attr("class", "xaxis")
            .attr("transform", 'translate(0, ' + (_height - defaults.margin.top - defaults.margin.bottom - chart_container_margin) + ')').call(d3.axisBottom(_xScale));
         _svg_chart.append("g").attr("class", "yaxis").call(d3.axisLeft(_yScale).ticks(5));

         // chart container initialization
         chart_container = _svg_chart.append('g').attr('class', 'chart_container');

         // init container for y grid lines if x_grid_lines is true
         if (defaults.x_grid_lines) x_lines = _svg_chart.append("g").attr("class", "x_lines")
            .attr("transform", "translate(0," + (_height - defaults.margin.top - defaults.margin.bottom - chart_container_margin) + ")");

         // init container for y grid lines if y_grid_lines is true
         if (defaults.y_grid_lines) y_lines = _svg_chart.append("g").attr("class", "y_lines");

         // init container for legend if show_legend is true
         if (defaults.show_legend) ul_container = d3.select('#' + item_id).append('div').attr('class', 'legend_div').append('ul');

         // render initial chart
         self.render();
      }

      /**
      * Main function for chart rendering
      *
      * @example
      *  self.render();
      *
      */
      self.render = function () {
         if (defaults.horizontal_bars) { // horizontal bar chart
            // redraw y scale for new values
            _xScale.domain([0, d3.max(defaults.data, function(d) { return d[defaults.params.value] })]);
            _svg_chart.select(".xaxis").transition().duration(defaults.tweenDuration).call(d3.axisBottom(_xScale));

            _yScale.domain(defaults.data.map( function(d) { return d[defaults.params.name]; }))
            _svg_chart.select(".yaxis").transition().duration(defaults.tweenDuration).call(d3.axisLeft(_yScale));
         }
         else { // vertical bar chart
            // redraw y scale for new values
            _yScale.domain([0, d3.max(defaults.data, function(d) { return d[defaults.params.value] })]);
            _svg_chart.select(".yaxis").transition().duration(defaults.tweenDuration).call(d3.axisLeft(_yScale));

            _xScale.domain(defaults.data.map(function(d) { return d[defaults.params.name]; }));
            _svg_chart.select(".xaxis").transition().duration(defaults.tweenDuration).call(d3.axisBottom(_xScale));
         }

         if (rotate_labels) {
            _svg_chart.select('.xaxis').selectAll("text").transition().duration(defaults.tweenDuration)
                  .attr("y", defaults.rotate_x_axis_labels.y_position).attr("x", defaults.rotate_x_axis_labels.x_position)
                  .attr("transform", 'rotate(' + defaults.rotate_x_axis_labels.rotating_angle + ')')
                  .style("text-anchor", "start");
         }

         // redraw x scale gridlines
         if (defaults.x_grid_lines) {
            x_lines.transition().duration(defaults.tweenDuration).call(make_x_gridlines()
               .tickSize(-(_height - defaults.margin.top - defaults.margin.bottom - chart_container_margin)).tickFormat(""));
         }

         // redraw y scale gridlines
         if (defaults.y_grid_lines) {
            y_lines.transition().duration(defaults.tweenDuration).call(make_y_gridlines()
               .tickSize(-(_width - defaults.margin.left - defaults.margin.right)).tickFormat(""));
         }

         // add chart legend
         if (defaults.show_legend) self.addChartLegend();

         // init chart groups with data
         var chart_groups = chart_container.selectAll('rect').data(defaults.data);

         // draw bars on enter - begin
         var bar_chart_enter = chart_groups.enter()
            .append('rect')
            .attr("class", "bar_item")
            .style("fill", function(d, i) {
               var index = self.getDistinctDataIndex(d[defaults.params.group_name]);
               return defaults.colors[index];
            })
            .style('opacity', defaults.bars.opacity)
            .on("mouseover", function (d, i) { // on mouse hover animation
               if (!defaults.bars.disable_hover) {
                  var text_value = d[defaults.params.group_name] + ', ' + defaults.bars.hover_name_text + ': ' + d[defaults.params.name] + ', ' + defaults.bars.hover_value_text + ': ' + number_format(d[defaults.params.value]);
                  _svg.append("text")
                     .attr("class", "title-text")
                     .style("fill", function() {
                        var index = self.getDistinctDataIndex(d[defaults.params.group_name]);
                        return defaults.colors[index];
                     })
                     .text(text_value)
                     .attr("text-anchor", "middle")
                     .attr("x", (_width ) / 2)
                     .attr("y", chart_container_margin - 7);
                  d3.select(this).style('opacity', defaults.bars.opacity_hover).style("cursor", "pointer");
               }
            })
            .on("mouseout", function(d) { // on mouse out animation
               if (!defaults.bars.disable_hover) {
                  _svg.select(".title-text").remove();
                  d3.select(this).style('opacity', defaults.bars.opacity);
               }
            });

         if (defaults.horizontal_bars) { // horizontal bar chart
            bar_chart_enter.attr("x", function(d) { return _xScale(0); })
               .attr("y", function(d, i) {
                  var index = self.getDistinctDataIndex(d[defaults.params.group_name]);
                  return _yScale(d[defaults.params.name]) + (index * _yScale.bandwidth() / data_distinct.length);
               })
               .attr("width", 0)
               .attr("height", function(d) { return _yScale.bandwidth() / data_distinct.length })
               .transition().duration(defaults.tweenDuration)
                  .attr("width", function(d) { return _xScale(d[defaults.params.value]) });
         }
         else { // vertical bar chart
            bar_chart_enter.attr("x", function(d, i) {
               var index = self.getDistinctDataIndex(d[defaults.params.group_name]);
               return _xScale(d[defaults.params.name]) + (index * _xScale.bandwidth() / data_distinct.length);
            })
            .attr("y", function(d) { return _yScale(0) } )
            .attr("width", function(d) { return _xScale.bandwidth() / data_distinct.length })
            .attr("height", 0)
            .transition().duration(defaults.tweenDuration)
               .attr("y", function(d) { return _yScale(d[defaults.params.value]) })
               .attr("height", function(d) { return _height - defaults.margin.top - defaults.margin.bottom - chart_container_margin - _yScale(d[defaults.params.value]) });
         }
         // draw bars on enter - end

         // update bar width, height and position - begin
         var bar_chart_update = chart_groups.data(defaults.data)
            .transition().duration(defaults.tweenDuration)
               .style("fill", function(d, i) {
                  var index = self.getDistinctDataIndex(d[defaults.params.group_name]);
                  return defaults.colors[index];
               });

         if (defaults.horizontal_bars) { // horizontal bar chart
            bar_chart_update.attr("y", function(d, i) {
                  var index = self.getDistinctDataIndex(d[defaults.params.group_name]);
                  return _yScale(d[defaults.params.name]) + (index * _yScale.bandwidth() / data_distinct.length);
               })
               .attr("height", function(d) { return _yScale.bandwidth() / data_distinct.length })
               .attr("width", function(d) { return _xScale(d[defaults.params.value]) });
         }
         else { // vertical bar chart
            bar_chart_update.attr("x", function(d, i) {
               var index = self.getDistinctDataIndex(d[defaults.params.group_name]);
               return _xScale(d[defaults.params.name]) + (index * _xScale.bandwidth() / data_distinct.length)
            })
            .attr("width", _xScale.bandwidth() / data_distinct.length)
            .attr("y", function(d) { return _yScale(d[defaults.params.value]) })
            .attr("height", function(d) { return _height - defaults.margin.top - defaults.margin.bottom - chart_container_margin - _yScale(d[defaults.params.value]) });
         }
         // update bar width, height and position - end

         // remove empty bars
         chart_groups.exit()
            .transition().duration(defaults.tweenDuration)
            .style('opacity', 0).remove();
      }

      /**
      * Main function for chart rendering
      *
      * @example
      *  chart.updateChart(new_options);
      *
      * @param prop {Object} list of options for chart update
      *
      */
      self.updateChart = function (prop) {
         defaults = $.extend(defaults, prop);

         data_distinct = [];
         $.each(defaults.data, function(idx, item) {
            data_distinct.push(item[defaults.params.group_name]);
         });
         data_distinct = $.unique(data_distinct);

         self.render();
      };

      /**
      * Main function for chart legend render
      *
      * @example
      *  self.addChartLegend();
      *
      */
      self.addChartLegend = function() {
         // init li elements for legend
         var div_legend = ul_container.selectAll('li').data(data_distinct);

         // draw li elements for legend
         var li = div_legend.enter().append("li");
         li.append("div").attr('style', function(d, i) { return 'background-color: ' + defaults.colors[i] });
         li.append("p").text( function(d) { return d; } );

         // update li elements with new values
         var li_update = div_legend.data(data_distinct);
         li_update.select('div').attr('style', function(d, i) { return 'background-color: ' + defaults.colors[i] });
         li_update.select('p').text( function(d) { return d; } );

         // remove empty li elements from legend
         div_legend.exit().remove();
      }

      /**
      * Main function for get item index from data_distinct
      *
      * @example
      *  chart.getDistinctDataIndex(item);
      *
      * @param item {Object} object to get index from data distinct
      *
      * @return {Number}
      */
      self.getDistinctDataIndex = function(item)
      {
         var index = 0;
         $.each(data_distinct, function(idx, curr_item) {
            if (item == curr_item)
            {
               index = idx;
               return false;
            }
         });
         return index;
      }

      // chart initialization
      self.init();

      // return self
      return self;
   }
}(jQuery));
