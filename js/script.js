/*
  PROTOTYPE COMMENTS:

  - currently built in d3 v4
  - build based on this example version code:
      https://bl.ocks.org/d3noob/1a96af738c89b88723eb63456beb6510
      https://bl.ocks.org/mbostock/34f08d5e11952a80609169b7917d4172


  TO DOs:
  - fully comment code
  - keep plotted paths as 'open'
  - attach brush handles https://observablehq.com/@connor-roche/multi-line-chart-focus-context-w-mouseover-tooltip
*/

console.log("PEARL - Line Chart");

var pearlData = {
  formatDatePEARL: d3.timeFormat("%m %Y"),
  formatDatePEARLLabelling: d3.timeFormat("%B %e, %Y"), // get from programmable time to label format time
  parseDatePEARL: d3.timeParse("%m %Y"),
  formatDatePEARLYear: d3.timeFormat("%Y"),
  formatDatePEARLMonth: d3.timeFormat("%m"),
  parseDatePEARLYear: d3.timeParse("%Y"),
  defaultStartDate: "01 2016",
  defaultEndDate: "01 2021",
  /* button_data: ["year", "month", "data", "default"], */
  collapsibleTreeData: { name: "root", children: [] },
  maxLinesReached: false,
  defaultLineToDraw: "total",
  colours: ["#01324b", "#be1818", "#0070a8", "#785ba7", "#007373", "#c75301"],
  coloursUsed: [],
  coloursAvailable: [],
  lineCounter: 0,
  smallMultipleSortVariable: "page_rank",
  topX: 100,
  yAxisDomainMaxRounding: 100,
  perChunk: 20,
  smallMultiplesChart: {},
  smallMultiplesChartxDomainMaximum: 0,
  selectedSupTopicNode: "",
  smallMultipleChartSliceSize: 60,
  topicsToDisable: [
    "Artificial Intelligence",
    "Biocomputing",
    "Egyptian 2021 Gastroenterology",
    "Scientific Reports",
    "Astrobiology",
    "SDG3 - Good Health and Well-Being",
    "SDG 7 - Energy",
    "permission",
    "Benjamin List",
  ],
};

var brush;
var bisect;
var focus;
var context;
var svg = d3.select("#line-chart-svg").attr("width", "100%");
var margin = { top: 20, right: 100, bottom: 150, left: 40 };
var margin2 = { top: 280, right: 100, bottom: 30, left: 40 };
var width = window.innerWidth - margin.left - margin.right;
var height = +svg.attr("height") - margin.top - margin.bottom;
var height2 = +svg.attr("height") - margin2.top - margin2.bottom;

var x, y;
var focusLine;
var contextLine;

function drawLineChart(json, selectValue) {
  pearlData.data = json;
  // pearlData.formatDatePEARL = d3.timeFormat("%m %Y");
  // pearlData.formatDatePEARLLabelling = d3.timeFormat("%B %e, %Y");
  // pearlData.parseDatePEARL = d3.timeParse("%m %Y");
  // pearlData.defaultStartDate = "01 2016";
  // pearlData.defaultEndDate = "01 2021";
  pearlData.formattedDefaultStartDate = pearlData.parseDatePEARL(
    pearlData.defaultStartDate
  );
  pearlData.formattedDefaultEndDate = pearlData.parseDatePEARL(
    pearlData.defaultEndDate
  );

  pearlData.data.forEach(function (d, i) {
    d.formattedDate = pearlData.parseDatePEARL(d.month + " " + d.year);
  });

  data = pearlData.data.filter(function (d, i) {
    return d.label == "total";
  });

  (x = d3.scaleTime().range([0, width])),
    (x2 = d3.scaleTime().range([0, width])),
    (y = d3.scaleLinear().range([height, 0])),
    (y2 = d3.scaleLinear().range([height2, 0]));

  (lineChart_xAxis = d3.axisBottom(x)),
    (lineChart_xAxis2 = d3.axisBottom(x2)),
    (lineChart_yAxis = d3.axisLeft(y)),
    (lineChart_yAxisRight = d3.axisRight(y));

  /* var */ brush = d3
    .brushX()
    .extent([
      [0, 0],
      [width, height2],
    ])
    .on("brush end", brushed);

  var zoom = d3
    .zoom()
    .scaleExtent([1, Infinity])
    .translateExtent([
      [0, 0],
      [width, height],
    ])
    .extent([
      [0, 0],
      [width, height],
    ])
    .on("zoom", zoomed);

  // Add the line
  focusLine = d3
    .line()
    .curve(d3.curveMonotoneX)
    .x(function (d) {
      return x(d.formattedDate);
    })
    .y(function (d) {
      return y(d.articles);
    });

  contextLine = d3
    .line()
    .curve(d3.curveMonotoneX)
    .x(function (d) {
      return x2(d.formattedDate);
    })
    .y(function (d) {
      return y2(d.articles);
    });

  svg
    .append("defs")
    .append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", width)
    .attr("height", height);

  focus = svg
    .append("g")
    .attr("class", "focus")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  context = svg
    .append("g")
    .attr("class", "context")
    .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

  x.domain(
    d3.extent(data, function (d) {
      return d.formattedDate;
    })
  );

  y.domain([
    0,
    Math.ceil(
      d3.max(data, function (d) {
        return d.articles;
      }) / pearlData.yAxisDomainMaxRounding
    ) * pearlData.yAxisDomainMaxRounding,
  ]);
  x2.domain(x.domain());
  y2.domain(y.domain());

  var defaultSelection = [
    x(pearlData.formattedDefaultStartDate),
    x(pearlData.formattedDefaultEndDate),
  ];

  var display_range_group = d3
    .select("#line-chart-svg")
    .append("g")
    .attr("id", "buttons_group")
    .attr("transform", "translate(" + width / 2 + "," + 0 + ")");

  display_range_group
    .append("text")
    .attr("id", "displayDates")
    .text(
      "Showing data from: " +
        pearlData.formatDatePEARL(x.domain()[0]) +
        " - " +
        pearlData.formatDatePEARL(x.domain()[1]) +
        "    Zoom to: "
    )
    .style("text-anchor", "end")
    .style("fill", "#565656")
    .style("font-size", "9px")
    .style("font-weight", "bold")
    .attr("transform", "translate(" + 0 + "," + 10.5 + ")");

  var button_width = 40;
  var button_height = 14;

  var button_data = ["year", "month", "data", "default"];
  var button = display_range_group
    .selectAll(".scale_button")
    .data(button_data)
    .enter()
    .append("g")
    .attr("class", "scale_button")
    .attr("transform", function (d, i) {
      return "translate(" + (20 + i * button_width + i * 10) + ",0)";
    })
    .on("click", scaleDate);

  button
    .append("rect")
    .attr("width", button_width)
    .attr("height", button_height)
    .attr("rx", 1)
    .attr("ry", 1);

  button
    .append("text")
    .attr("dy", button_height / 2 + 3)
    .attr("dx", button_width / 2)
    .style("fill", "#565656")
    .style("font-size", "9px")
    .style("text-anchor", "middle")
    .text(function (d) {
      return d;
    });

  pearlData.nestedData = d3
    .nest()
    .key(function (d) {
      return d.label;
    })
    .entries(pearlData.data);

  pearlData.constructedLineData = {};

  pearlData.nestedData.forEach(function (d, i) {
    pearlData.constructedLineData[d.key] = d.values;
  }); // end forEach...

  focus
    .append("path")
    .datum(pearlData.constructedLineData[pearlData.defaultLineToDraw])
    .attr("class", function (d, i) {
      var lineName = d[0].label;

      focus
        .append("text")
        .attr("class", function (d, i) {
          return "line-annotation-label " + lineName.replaceAll(" ", "-");
        })
        .attr("x", width + 40)
        .attr("y", y(d[d.length - 1].articles))
        .text(lineName);

      return "focus line " + lineName.replaceAll(" ", "-");
    })
    .attr("d", focusLine);

  focus
    .append("g")
    .attr("class", "lineChart axis axis--x")
    .attr("transform", "translate(0," + height + ")")
    .call(lineChart_xAxis);

  focus
    .append("g")
    .attr("class", "lineChart axis axis--y left")
    .call(lineChart_yAxis);

  focus
    .append("g")
    .attr("class", "lineChart axis axis--y right")
    .attr("transform", "translate(" + width + "," + 0 + ")")
    .call(lineChart_yAxisRight);

  d3.selectAll(".yAxisTicks").remove();

  // draw tick grid lines extending from y-axis ticks on axis across scatter graph
  var yticks = focus
    .selectAll(".lineChart.axis.axis--y.left")
    .selectAll(".tick");

  yticks
    .append("svg:line")
    .attr("class", "yAxisTicks")
    .attr("y0", 0)
    .attr("y1", 0)
    .attr("x1", 0)
    .attr("x2", width)
    .style("stroke-width", 0.5)
    .style("stroke", "##565656")
    .style("stroke-dasharray", "2 2")
    .style("opacity", 0.3);

  d3.selectAll(".lineChart.axis.axis--y.left")
    .append("text")
    .attr("class", "yAxisTitle")
    .attr("x", 0)
    .attr("y", -10)
    .text("Number of Articles");

  context
    .append("path")
    .datum(pearlData.constructedLineData[pearlData.defaultLineToDraw])
    .attr("class", function (d, i) {
      var lineName = d[0].label;
      return "context line " + lineName;
    })
    .attr("d", contextLine);

  context
    .append("g")
    .attr("class", "lineChart axis axis--x")
    .attr("transform", "translate(0," + height2 + ")")
    .call(lineChart_xAxis2);

  addTickGridLines();

  context
    .append("g")
    .attr("class", "brush")
    .call(brush)
    .call(brush.move, defaultSelection);

  d3.selectAll(".resize")
    .attr("transform", "translate(0," + 0 + ")")
    .attr("rx", 2.5)
    .attr("ry", 2.5)
    .attr("height", height2 + 6)
    .attr("width", 5);

  d3.selectAll(".handle")
    .attr("transform", "translate(-1," + height2 / 3 + ")")
    .attr("rx", 4)
    .attr("ry", 4)
    .attr("height", height2 / 3 + 6)
    .attr("width", 8);

  svg
    .append("rect")
    .attr("class", "zoom")
    .attr("width", width)
    .attr("height", height)
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .call(zoom);
  // });// end data load ...

  function brushed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom

    var s = d3.event.selection || x2.range();
    x.domain(s.map(x2.invert, x2));

    focus.selectAll(".line").attr("d", focusLine);
    focus.selectAll(".lineChart.axis--x").call(lineChart_xAxis);

    svg
      .selectAll(".zoom")
      .call(
        zoom.transform,
        d3.zoomIdentity.scale(width / (s[1] - s[0])).translate(-s[0], 0)
      );

    d3.select("#displayDates").text(
      "Showing data from: " +
        pearlData.formatDatePEARLLabelling(x.domain()[0]) +
        " - " +
        pearlData.formatDatePEARLLabelling(x.domain()[1]) +
        "    Zoom to: "
    );

    return;
  } // end function brushed

  function zoomed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush

    var t = d3.event.transform;
    x.domain(t.rescaleX(x2).domain());

    focus.selectAll(".line").attr("d", focusLine);
    focus.selectAll(".lineChart.axis--x").call(lineChart_xAxis);
    context.selectAll(".brush").call(brush.move, x.range().map(t.invertX, t));

    return;
  } // end function brushed

  d3.selection.prototype.moveToFront = function () {
    return this.each(function () {
      this.parentNode.appendChild(this);
    });
  };

  d3.selection.prototype.moveToBack = function () {
    return this.each(function () {
      var firstChild = this.parentNode.firstChild;
      if (firstChild) {
        this.parentNode.insertBefore(this, firstChild);
      }
    });
  };

  function scaleDate(d, i) {
    d3.selectAll(".xAxisTicks").remove();

    // reset brush and both line charts to full extent of data
    if (d == "data") {
      var start = x2.domain()[0];
      var end = x2.domain()[1];

      x.domain([start, end]);

      d3.selectAll(".focus")
        .selectAll(".lineChart.axis.axis--x")
        .call(lineChart_xAxis);

      focus.selectAll(".line").attr("d", focusLine);

      var defaultSelection = [x2(start), x2(end)];

      context
        .selectAll(".brush")
        .call(brush)
        .call(brush.move, defaultSelection);
    } else if (d == "default") {
      var start = x2.domain()[0];
      var end = x2.domain()[1];

      x.domain([start, end]);

      var defaultSelection = [
        x2(pearlData.formattedDefaultStartDate),
        x2(pearlData.formattedDefaultEndDate),
      ];

      d3.selectAll(".focus")
        .selectAll(".lineChart.axis.axis--x")
        .call(lineChart_xAxis);

      context
        .selectAll(".brush")
        .call(brush)
        .call(brush.move, defaultSelection);
    } else if (d == "year") {
      var start = x.domain()[0];
      var end = d3.timeYear.offset(start, 1);

      x.domain([x2(start), x2(end)]);

      d3.selectAll(".focus")
        .selectAll(".lineChart.axis.axis--x")
        .call(lineChart_xAxis);

      context
        .selectAll(".brush")
        .call(brush)
        .call(brush.move, [x2(start), x2(end)]);
    } else if (d == "month") {
      var start = x.domain()[0];
      var end = d3.timeMonth.offset(start, 1);

      x.domain([x2(start), x2(end)]);

      d3.selectAll(".focus")
        .selectAll(".lineChart.axis.axis--x")
        .call(lineChart_xAxis);

      context
        .selectAll(".brush")
        .call(brush)
        .call(brush.move, [x2(start), x2(end)]);
    } // end else.
    addTickGridLines();

    return;
  } // end function scaleDate()

  return;
} // end function drawLineChart()

function addTickGridLines() {
  d3.selectAll(".xAxisTicks").remove();

  // draw tick grid lines extending from y-axis ticks on axis across scatter graph
  var xticks = focus.selectAll(".lineChart.axis.axis--x").selectAll(".tick");

  xticks
    .append("svg:line")
    .attr("class", "xAxisTicks")
    .attr("y0", 0)
    .attr("y1", -height)
    .attr("x1", 0)
    .attr("x2", 0)
    .style("stroke-width", 1)
    .style("stroke", "#565656")
    .style("opacity", 0.3);

  // draw tick grid lines extending from y-axis ticks on axis across scatter graph
  var xticks = context.selectAll(".lineChart.axis.axis--x").selectAll(".tick");

  xticks
    .append("svg:line")
    .attr("class", "xAxisTicks")
    .attr("y0", 0)
    .attr("y1", -height2)
    .attr("x1", 0)
    .attr("x2", 0)
    .style("stroke-width", 1)
    .style("stroke", "#565656")
    .style("opacity", 0.5);

  return;
} // end addTickGridLines

function lineAddRemove(fid) {
  var circle = d3.select("#" + fid.value.replaceAll(" ", "-"));
  circle.classed("line-selected", !circle.classed("line-selected"));

  if (circle.classed("line-selected")) {
    focus
      .append("path")
      .datum(pearlData.constructedLineData[fid.value])
      .attr("class", function (d, i) {
        // var lineName = d[0].label;

        focus
          .append("text")
          .attr("class", function (d, i) {
            return "line-annotation-label " + fid.value.replaceAll(" ", "-");
          })
          .attr("x", width + 10)
          .attr("y", y(d[d.length - 1].articles))
          .text(fid.value);

        return "focus line " + fid.value.replaceAll(" ", "-");
      })
      .attr("d", focusLine);

    context
      .append("path")
      .datum(pearlData.constructedLineData[fid.value])
      .attr("class", function (d, i) {
        return "context line " + fid.value.replaceAll(" ", "-");
      })
      .attr("d", contextLine);

    d3.selectAll(".brush").moveToFront();
  } else {
    d3.selectAll(".focus.line." + fid.value.replaceAll(" ", "-")).remove();
    d3.selectAll(".context.line." + fid.value.replaceAll(" ", "-")).remove();
    d3.selectAll(
      ".line-annotation-label." + fid.value.replaceAll(" ", "-")
    ).remove();
  }

  return;
} // end function lineAddRemove
