const areaID = "#tipDiv";
const barAreaID = "#barTipDiv";
const opacity = 0.7;
let compHoverDiv;
let pyramidHoverDiv;
let hoverTextGeneral, hoverTextGeneral2, hoverTextGeneral3;
let activeID = barDiv ? barAreaID : areaID;

/**
 * Show feature distributions of patients grouped by clusters.
 *
 * @param featureName - the name of the selected feature.
 * @param clusterID - the ID number of the cluster or cluster pair.
 * @param featureData - the feature data for all patients.
 */
function showFeatureDistributionsPerCluster(featureName, clusterID, featureData) {
    featureData.forEach(function (d) {
        d.cluster2 = +(d.cluster2);
        d.cluster1 = +(d.cluster1);
        return d;
    })

    d3.select("#distributionPyramid").remove();
    d3.select("#clusterComparison").remove();
    distributionPyramid(featureName, clusterID, featureData);
    clusterComparison(featureName, clusterID, featureData);
}

/**
 * Show feature distribution for all patients as pyramid chart.
 *
 * @param featureName - the name of the selected feature.
 * @param clusterID - the ID number of the cluster or cluster pair.
 * @param featureData - the feature data for all patients.
 */
function distributionPyramid(featureName, clusterID, featureData) {
    let width = 400 - (margin.left + margin.right);
    let height = 300 - (margin.top + margin.bottom);

    const x = d3.scaleLinear().rangeRound([(width / 2) + margin.left * 2, width]),
        x2 = d3.scaleLinear().rangeRound([(width / 2) - margin.left * 2, 0]),
        y = d3.scaleBand().rangeRound([height, 0]).padding(0.1);

    const xAxisRight = d3.axisBottom(x).ticks(6).tickSize(-height),
        xAxisLeft = d3.axisBottom(x2).ticks(6).tickSize(-height),
        yAxis = d3.axisLeft(y);

    const svg = d3.select(activeID)
        .append("svg")
        .attr("id", "distributionPyramid")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
        .attr("class", "axis axis--xright hide")
        .attr("transform", "translate(0," + height + ")")
    svg.append("g")
        .attr("class", "axis axis--xleft hide")
        .attr("transform", "translate(0," + height + ")")
    svg.append("g")
        .attr("class", "axis axis--y")
        .attr("transform", "translate(" + (width / 2 + 10) + ",0)")

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .text(featureName)
        .attr("font-size", "15px");
    update(featureData, clusterID);

    /**
     * Update the feature distribution chart.
     *
     * @param featureData - the feature data for all patients.
     * @param clusterID - the ID number of the cluster or cluster pair.
     */
    function update(featureData, clusterID) {
        if (featureData.length < 1) {
            return;
        }
        x.domain([0, d3.max(featureData, function (d) {
            return Math.max(d.cluster2, d.cluster1)
        })]).nice();
        let minRange = featureData[0].range;
        let maxRange = featureData[Object.keys(featureData)[Object.keys(featureData).length - 1]].range
        x2.domain(x.domain())
        y.domain(featureData.map(function (d) {
            return d.range;
        }));

        svg.selectAll(".axis.axis--xright").call(xAxisRight);
        svg.selectAll(".axis.axis--xleft").call(xAxisLeft);
        svg.append("text")
            .style("text-anchor", "middle")
            .attr("x", width / 2)
            .attr("y", 210)
            .attr("font-size", "12px")
            .text(minRange.split(" - ")[0]);

        svg.append("text")
            .style("text-anchor", "middle")
            .attr("x", width / 2)
            .attr("y", 10)
            .attr("font-size", "12px")
            .text(maxRange.split(" - ")[1]);


        hoverTextGeneral = svg.append("text")
            .style("text-anchor", "right")
            .attr("x", width - 100)
            .attr("y", 5)
            .attr("font-size", "14px")
            .attr("fill", "darkred");

        hoverTextGeneral2 = svg.append("text")
            .style("text-anchor", "right")
            .attr("x", width - 100)
            .attr("y", 25)
            .attr("font-size", "14px")
            .attr("fill", "darkred");

        hoverTextGeneral3 = svg.append("text")
            .style("text-anchor", "right")
            .attr("x", width - 10)
            .attr("y", 30)
            .attr("font-size", "18px")
            .attr("font-weight", 500)
            .attr("fill", "darkred");

        // Left bars of cluster data
        svg.selectAll(".clusterLeftBar")
            .data(featureData).enter()
            .append("rect")
            .attr("class", "clusterLeftBar")
            .attr("y", function (d) {
                return y(d.range);
            })
            .attr("x", function (d) {
                return x2(d.cluster1);
            })
            .attr("fill", function () {
                return Number.isInteger(clusterID) && clusterID !== 0 ? "lightgray" : colorBrewerScale[0];
            })
            .attr("fill-opacity", opacity)
            .attr("height", y.bandwidth())
            .attr("width", function (d) {
                return Math.abs(x2(d.cluster1) - x2(0));
            })
            .on("mouseover", function (d) {
                hoverTextGeneral.text(d.range);
                hoverTextGeneral2.text("#patients: " + d.cluster1);

            })
            .on("mouseout"
                , function () {
                    hoverTextGeneral.text("");
                    hoverTextGeneral2.text("");
                });

        // Right bars of cluster data
        svg.selectAll(".clusterRightBar")
            .data(featureData).enter()
            .append("rect")
            .attr("class", "clusterRightBar")
            .attr("x", x(0))
            .attr("y", function (d) {
                return y(d.range)
            })
            .attr("fill", function () {
                return Number.isInteger(clusterID) && clusterID !== 1 ? "lightgray" : colorBrewerScale[1];
            })
            .attr("fill-opacity", opacity)
            .attr("height", y.bandwidth())
            .attr("width", function (d) {
                return Math.abs(x(d.cluster2) - x(0))
            })
            .on("mouseover", function (d) {
                hoverTextGeneral.text(d.range);
                hoverTextGeneral2.text("#patients: " + d.cluster2);
            })
            .on("mouseout", function () {
                hoverTextGeneral.text("");
                hoverTextGeneral2.text("");
            });

        let clusterLeft = svg.selectAll(".clusterLeft")
            .data(featureData);

        let clusterRight = svg.selectAll(".clusterRight")
            .data(featureData);

        clusterLeft
            .enter()
            .append("rect")
            .attr("class", "C1 clusterLeft")
            .attr("y", function (d) {
                return y(d.range)
            })
            .attr("height", y.bandwidth())
            .merge(clusterLeft)

        clusterRight
            .enter()
            .append("rect")
            .attr("class", "C2 clusterRight")
            .attr("y", function (d) {
                return y(d.range);
            })
            .attr("height", y.bandwidth())
            .merge(clusterRight)
    }
}

/**
 * Show the number of patients that have the selected feature grouped per cluster in a bar chart for comparison.
 *
 * @param featureName - the name of the selected feature.
 * @param clusterID - the ID number of the cluster or cluster pair.
 * @param featureData - the feature data for all patients.
 */
function clusterComparison(featureName, clusterID, featureData) {
    let width = 150 / 2 - (margin.left + margin.right),
        height = 420 / 2 - (margin.top + margin.bottom);

    let x0 = d3.scaleBand().rangeRound([0, width]),
        x1 = d3.scaleBand().paddingOuter(0.2),
        x2 = d3.scaleBand().paddingOuter(0.2),
        y = d3.scaleLinear().rangeRound([height, 0]);

    let xAxis = d3.axisBottom(x0),
        yAxis = d3.axisLeft(y);

    let svg = d3.select(activeID)
        .append("svg")
        .attr("id", "clusterComparison")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")");

    svg.append("g")
        .attr("class", "axis axis--y");

    update(featureData, clusterID);

    /**
     * Update the bar chart comparing the number of patients that have the selected feature grouped by clusters.
     *
     * @param featureData - the feature data for all patients.
     * @param clusterID - the ID number of the cluster or cluster pair.
     */
    function update(featureData, clusterID) {
        let barKey = ["cluster1", "cluster2"]
        let clusterKey = ["0", "1"]

        x0.domain(["0  |  1"]);
        x1.domain(barKey).rangeRound([0, x0.bandwidth()]);
        x2.domain(clusterKey).rangeRound([0, x0.bandwidth()]);

        y.domain([0, clusterLabelData.length])

        svg.selectAll(".axis.axis--y")
            .call(yAxis);

        svg.selectAll(".axis.axis--x")
            .call(xAxis);

        let barGroups = svg.selectAll("g.layer")
            .data(["empty"]);

        let barDistance = 4;
        barGroups.exit().remove();

        d3.select("#pyramiddiv").remove();
        pyramidHoverDiv = d3
            .select("#barplotArea")
            .append("div")
            .attr("id", "pyramiddiv")
            .attr("class", "tooltip")
            .style("opacity", 0);

        d3.select("#clustercompdiv").remove();
        compHoverDiv = d3
            .select("#barplotArea")
            .append("div")
            .attr("id", "clustercompdiv")
            .attr("class", "tooltip")
            .style("opacity", 0);

        barGroups
            .enter()
            .append("g")
            .classed('layer', true);

        svg.selectAll("g.layer").selectAll(".bars")
            .data(function () {
                return barKey.map(function (key) {
                    let sum = d3.sum(featureData, function (e) {
                        return e[key];
                    })
                    return { key: key, value: sum };
                });
            }).enter()
            .append("rect")
            .attr("class", "bars")
            .attr("fill", function (d) {
                if (Number.isInteger(clusterID) && clusterID === (d.key.slice(-1) - 1)) {
                    return colorBrewerScale[clusterID];
                }
                if (!Number.isInteger(clusterID)) {
                    return colorBrewerScale[d.key.slice(-1) - 1];
                }
                return "lightgray";
            })
            .attr("fill-opacity", opacity)
            .attr("x", function (d) {
                return x1(d.key);
            })
            .attr("y", function (d) {
                return y(d.value);
            })
            .attr("width", x1.bandwidth() - barDistance)
            .attr("height", function (d) {
                return height - y(d.value)
            })
            .on("mouseover", function (d) {
                hoverTextGeneral3.text(d.value);
            })
            .on("mouseout", function () {
                hoverTextGeneral3.text("");
            });

        let barsCluster = svg.selectAll("g.layer").selectAll(".barsCluster")
            .data(function () {
                return clusterKey.map(function (key) {
                    let sum = d3.sum(featureData, function (e) {
                        return e[key];
                    })
                    return { key: key, value: sum };
                });
            });
        barsCluster.exit().remove();

        barsCluster
            .enter()
            .append("rect")
            .attr("class", "barsCluster")
            .attr("x", function (d) {
                return x2(d.key);
            })
            .attr("width", x1.bandwidth())
            .merge(barsCluster)
            .attr("font-size", "18px");
    }

}
