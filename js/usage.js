(function() {
	var h = 300, w = 1200,
		margins = {bottom: h - 50, top: 20, left: 50, right: w - 150},
		animationversion = 1000,
		body = d3.select("body"),
		div = body.select("#usagePlot"),
		tooltip = d3.select("#tipUsage")
			.classed("hidden", true),
		title = div.append("h4"),
		svg = div.append("svg")
			.attr("width", w)
			.attr("height", h),
		normalColor = "#55AAFF",
		hoverColor = "#FFA500"
		
	var parseRow = row => {
	  return {
	    "version" : row.version,
	    "counts" : +row.counts
	  }
	}

	var innerPadding = 0.5, categoryIndex = 0,
		x, y, xAxis, yAxis, months, dataset

	var handleMouseOver = (rect, d) => {
		// Use mouse coordinates for tooltip position
		var xPos = d3.event.pageX
		var yPos = d3.event.pageY

		// Update the tooltip position
		tooltip.style("left", xPos + "px").style("top", yPos + "px")

		// Update the tooltip information
		d3.select("#usageVersion")
			.text(d.version)

		d3.select("#usageValue")
			.text(parseInt(d.usage) + "%")

		// Show the tooltip
		tooltip.classed("hidden", false)

		// Highlight the current bar
		d3.select(rect).attr("fill", hoverColor)
	}

	var handleMouseOut = rect => {
		//Hide the tooltip again
		tooltip.classed("hidden", true)

		// Remove highlight from the current bar
		d3.select(rect)
			.transition()
			.duration(250)
			.attr("fill", normalColor)
	}

	let max = 100

	let data = [
		{"version" : "1.3", "usage" : parseInt(Math.random() * max)},
		{"version" : "1.4", "usage" : parseInt(Math.random() * max)},
		{"version" : "1.5", "usage" : parseInt(Math.random() * max)},
		{"version" : "1.6", "usage" : parseInt(Math.random() * max)},
		{"version" : "1.7", "usage" : parseInt(Math.random() * max)},
		{"version" : "2.0", "usage" : parseInt(Math.random() * max)},
		{"version" : "2.1", "usage" : parseInt(Math.random() * max)},
		{"version" : "2.2", "usage" : parseInt(Math.random() * max)},
		{"version" : "2.3", "usage" : parseInt(Math.random() * max)},
	]
	// console.log(data)

	// Find highest y value
	var yMax = d3.max(data, d => d.usage)

	// Find the x domain, the result here is: [Jan, Feb, Mar... Dec]
	var versionvalues = data.map(d => d.version)

	// x Scale
	x = d3.scaleBand()
		.domain(versionvalues)
		.rangeRound([margins.left, margins.right])
		.paddingInner(innerPadding)

	xAxis = d3.axisBottom(x).ticks(7)

	// y Scale
	y = d3.scaleLinear()
	.domain([0, yMax])
	.range([margins.bottom, margins.top])

	yAxis = d3.axisLeft(y).ticks(5)

	// Bars
	svg.selectAll("rect")
	.data(data)
	.enter()
	.append("rect")
	.attr("x", d => x(d.version))
	.attr("y", d =>  y(d.usage))
	.attr("width", x.bandwidth())
	.attr("height", d => margins.bottom - y(d.usage))
	.attr("fill", normalColor)
		.on("mouseover", function(d) {
			handleMouseOver(this, d)
		})
		.on("mouseout", function() {
			handleMouseOut(this)
		})

	// Make x axis with a g-element
	svg.append("g")
	  .attr("transform", "translate(0, " + (margins.bottom) + ")")
	  .call(xAxis)

	// Make y axis with another g-element
	svg.append("g")
	  .attr("id", "yAxis")
	  .attr("transform", "translate(" + margins.left + ", 0)")
	  .call(yAxis)

	// Text label for the y axis
	svg.append("text")
		.attr("transform", "rotate(-90)")
		.style("text-anchor", "middle")
		.attr("y", margins.left/2 - 10)
		.attr("x", -h/2)
		.text("Average Usage Percentage")

	// Text label for the y axis
	svg.append("text")
		// .attr("transform", "rotate(-90)")
		.style("text-anchor", "middle")
		.attr("y", margins.bottom + 40)
		.attr("x", w/2)
		.text("version of the Week")

})()
