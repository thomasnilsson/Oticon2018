(() => run())()

function run() {
	var w = 1200
	var h = 600

	var w2 = 1200
	var h2 = 250
	var boundaries = {
		bottom: h2 - 60,
		top: 20,
		left: 60,
		right: w2 - 20
	}
	var innerPadding = 0.1

	var rand = Math.random()

	//Define quantize scale to sort data values into buckets of color
	let color = ['#27586B', '#003549', '#05425A', '#52707C', '#888B8C']
	let oticonPink = "#b6007a"


	//For converting Dates to strings
	var hourOfDay = time => {
		var values = time.split(":")
		return +values[0]
	}

	var parseRow = row => ({
		"hour": hourOfDay(row.time),
		"lat": parseFloat(row.lat),
		"lon": parseFloat(row.long)
	})

	//Define map projection
	// From http://bl.ocks.org/phil-pedruco/6646844
	var projection = d3.geoMercator()
		.center([-73.94, 40.70])
		.translate([w / 2, h / 2])
		.scale(58 * 1000)

	//Define path generator
	var path = d3.geoPath()
		.projection(projection)

	//Create SVG element
	var svgGeo = d3.select("body").select("#chart1")
		.append("svg")
		.attr("width", w)
		.attr("height", h)

	var svgHist = d3.select("body").select("#chart2")
		.append("svg")
		.attr("width", w2)
		.attr("height", h2)

	//Load in GeoJSON data
	d3.json("data/boroughs.geojson", (error, json) => {
		// if (error) console.log("error fetching data")

		//Bind data and create one path per GeoJSON feature
		svgGeo.selectAll("path")
			.data(json.features)
			.enter()
			.append("path")
			.attr("d", path)
			.style("fill", (d, i) => color[i])
			.style("stroke", "black")
			.style("stroke-width", "0.5")

		svgGeo.selectAll("text")
			.data(json.features)
			.enter()
			.append("text")
			.attr("class", "label")
			.attr("x", d => path.centroid(d)[0] - 30)
			.attr("y", d => path.centroid(d)[1])
			.style("fill", "black")
			.text(d => d.properties.BoroName)

		d3.csv("data/noise.csv", parseRow, data => {

			var hours = d3.range(24)
			var counts = hours.map(x => 0) // 24x0 array

			for (i in data) {
				let hour = data[i].hour
				counts[hour] += 1
			}

			let n = data.length > 0 ? data.length : 1
			counts = counts.map(c => (c / n) * 500 * rand)

			x = d3.scaleBand()
				.domain(hours)
				.rangeRound([boundaries.left, boundaries.right])
				.paddingInner(innerPadding)

			xAxis = d3.axisBottom(x)

			y = d3.scaleLinear()
				.domain([0, d3.max(counts)])
				.range([boundaries.bottom, boundaries.top])

			yAxis = d3.axisLeft(y).ticks(5)

			// Make x axis with a g-element
			svgHist.append("g")
				.attr("transform", "translate(0, " + (boundaries.bottom) + ")")
				.call(xAxis)

			// Make y axis with another g-element
			svgHist.append("g")
				.attr("id", "yAxis")
				.attr("transform", "translate(" + boundaries.left + ", 0)")
				.call(yAxis)

			// Text label for the y axis
			svgHist.append("text")
				.attr("transform", "rotate(-90)")
				.style("text-anchor", "middle")
				.attr("y", boundaries.left / 2 - 10)
				.attr("x", -h2 / 2)
				.text("Average Noise Level (dB)")


			// Text label for the y axis
			svgHist.append("text")
				.style("text-anchor", "middle")
				.attr("y", boundaries.bottom + 40)
				.attr("x", w2 / 2)
				.text("Hour of Day")


			// Bars
			svgHist.selectAll("rect")
				.data(counts)
				.enter()
				.append("rect")
				.attr("x", (d, i) => x(i))
				.attr("y", d => y(d))
				.attr("width", x.bandwidth())
				.attr("height", d => boundaries.bottom - y(d))
				.attr("fill", oticonPink)

			// DRAW POINTS ON MAP
			var circles = svgGeo.append("g")
				.selectAll("circle")
				.data(data)
				.enter()
				.append("circle")
				.attr("cx", d => projection([d.lon, d.lat])[0])
				.attr("cy", d => projection([d.lon, d.lat])[1])
				.attr("r", 2)
				.style("stroke-width", 0.25)
				.style("opacity", 0.75)
				.attr("class", "non_brushed")

			function isBrushed(brush_coords, cx, cy) {
				var x0 = brush_coords[0][0],
					x1 = brush_coords[1][0],
					y0 = brush_coords[0][1],
					y1 = brush_coords[1][1]

				return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1
			}

			function highlightBrushedCircles() {
				if (d3.event.selection != null) {
					circles.attr("class", "non_brushed")

					var brush_coords = d3.brushSelection(this)

					circles.filter(function () {
							var cx = d3.select(this).attr("cx"),
								cy = d3.select(this).attr("cy")

							return isBrushed(brush_coords, cx, cy)
						})
						.attr("class", "brushed")
				}
			}

			function updatesvgHistogram() {
				var dataBrushed = d3.selectAll(".brushed").data()

				counts = hours.map(x => 0) // 24x0 array

				for (i in dataBrushed) {
					let hour = dataBrushed[i].hour
					counts[hour] += 1
				}

				let n = dataBrushed.length > 0 ? dataBrushed.length : 1

				counts = counts.map(c => (c / n) * 500 * rand)

				y.domain([0, d3.max(counts)])
				yAxis = d3.axisLeft(y).ticks(5)

				svgHist.selectAll("#yAxis")
					.transition()
					.call(yAxis)

				svgHist.selectAll("rect")
					.data(counts)
					.transition()
					.attr("x", (d, i) => x(i))
					.attr("y", d => y(d))
					.attr("width", x.bandwidth())
					.attr("height", d => boundaries.bottom - y(d))

			}

			var brush = d3.brush()
				.on("brush", highlightBrushedCircles)
				.on("end", updatesvgHistogram)

			svgGeo.append("g")
				.call(brush)
		})


	})
}