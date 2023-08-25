const radiomicIcon = "\uf43c";
const genomicIcon = "\uf471";
const clinicalIcon = "\uf21e";
const undefinedIcon = "\uf4fa";

const TF = 20 // number of top features to show
let numberOfClusters = 0;
let shapClusters;
let currentShapCluster = 0;
let barDiv = false;

const margin = { top: 60, right: 10, bottom: 20, left: 20 },
    width = 350 - margin.left - margin.right,
    height = 350 - margin.top - margin.bottom,
    graph_misc = { ylabel: 23, xlabelH: 4, title: 13 };

/**
 * Starting point for showing the characterizing features per cluster.
 *
 * @param shapValues - the characterizing features per cluster.
 */
function d3ShapValues(shapValues) {
    shapClusters = shapValues;
    if (typeof (shapClusters) == "string") {
        shapClusters = parseDataToJson(shapValues);
    }
    numberOfClusters = shapClusters.length;
}

/**
 * Show the ranked shap values for the specified cluster in a bar chart.
 *
 * @param clusterNr - the identifier of the current cluster.
 */
function d3SingleShapPlot(clusterNr) {
    currentShapCluster = clusterNr;
    d3.select("#shapInterPlot").remove();
    let sorted = shapClusters[clusterNr].sort((prev, next) => next.value - prev.value);
    showBarPlot(sorted.slice(0, TF), clusterNr, colorBrewerScale[clusterNr]);
}

/**
 * Update the bar chart of the characterizing features.
 *
 * @param data - the updated data to use for the chart.
 * @param clusterNr - the identifier of the current cluster.
 */
function updateSingleShapPlot(data, clusterNr) {
    d3.select("#shapInterPlot").remove();
    if (data.length > 0) {
        showBarPlot(data[clusterNr].slice(0, TF), clusterNr.toString(), colorBrewerScale[clusterNr]);
    }
}

/**
 * Show the bar chart for the respective data.
 *
 * @param dataSet - the data to use for the chart.
 * @param plotTitle - the title of the chart.
 * @param color - the color of the bars.
 */
function showBarPlot(dataSet, plotTitle, color) {
    let axisMargin = 5,
        margin = 15,
        h = height * 2.36,
        w = width * 2.5,
        bh = (h - axisMargin - margin * 2) * 0.52 / dataSet.length,
        bp = (h - axisMargin - margin * 2) * 0.6 / dataSet.length,
        bar, svg, scale, xAxis, labelWidth = 0;

    let max = d3.max(dataSet, function (d) {
        return d.value;
    });

    let barArea = "#topFeaturesArea";
    let plotID = "shapInterPlot";

    if (plotTitle.startsWith("Top")) {
        barArea = "#topGenesArea";
        plotID = "topGenesPlot";
        d3.select("#topGenesPlot").remove();
    }

    svg = d3.select(barArea).append("svg")
        .attr("id", plotID)
        .attr("width", w + 20)
        .attr("height", h);

    bar = svg.selectAll("g")
        .data(dataSet)
        .enter()
        .append("g");

    bar.attr("class", "bar")
        .attr("fill", function () {
            return color;
        })
        .attr("transform", function (d, i) {
            return "translate(" + margin + "," + (i * (bh + bp) + bp + 18) + ")";
        });

    svg.append("text")
        .attr("x", (w + margin) / 2)
        .attr("y", graph_misc.title)
        .attr("class", "title")
        .attr("font-weight", 700)
        .attr("text-anchor", "middle")
        .attr("padding-bottom", "50px")
        .attr("fill", "black")
        .style("stroke", "none")
        .text(plotTitle)
        .attr("font-size", 16);

    if (plotTitle.length > 1 && !plotTitle.startsWith("Top")) { // interclass plot
        let pos = w / 2 - 77;
        let squareHeight = 20;
        let offset = -0.45;
        svg.selectAll("legendSquares")
            .data([plotTitle[0], plotTitle[2]])
            .enter()
            .append("rect")
            .attr("x", function () {
                return pos += 50;
            })
            .attr("y", function () {
                return offset;
            })
            .attr("rx", 8)
            .attr("ry", 8)
            .attr("width", squareHeight)
            .attr("height", squareHeight)
            .style("fill", function (d) {
                return colorBrewerScale[d];
            })
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle")
            .style("opacity", 0.8);
    }

    bar.append("text")
        .attr("class", "label")
        .attr("x", 18)
        .attr("y", bh / 2)
        .attr("dy", "0.35em")
        .attr("font-size", "20px")
        .attr("fill", function (d) {
            return d <= 0 ? "gray" : "black";
        })
        .style("stroke", "none")
        .text(function (d) {
            return d.feature;
        }).each(function () {
        labelWidth = Math.ceil(Math.max(labelWidth + 1.5, this.getBBox().width));
    });

    // glyph background
    bar.append("svg:circle")
        .attr("class", "node-glyph")
        .attr("r", 10)
        .attr("fill", function (d) {
            return getColorForDataset(d.feature);
        })
        .style("stroke", "none")
        .attr("cx", 0)
        .attr("cy", 5);

    // glyph label
    bar.append("svg:text")
        .attr("dx", 0)
        .attr("dy", 10)
        .attr("text-anchor", "middle")
        .attr("font-weight", "600")
        .text(function (d) {
            return getIndicationOfDataset(d.feature);
        })
        .attr("fill", "black")
        .style("stroke", "none")
        .attr("font-family", "Font Awesome 6 Free")
        .attr("font-size", "18px")
        .attr("width", "10px").attr("height", "10px")
        .attr("class", "fa");

    scale = d3.scaleLinear()
        .domain([0, max])
        .range([0, w - margin * 2 - labelWidth]);

    xAxis = d3.axisBottom()
        .scale(scale)
        .tickSize(-h + margin * 2 + axisMargin);

    let barChartToolTip = d3.tip()
        .attr("class", "d3-tip")
        .offset([0, 0])
        .html("<div id='barTipDiv'></div>");
    svg.call(barChartToolTip);

    let shapHoverDiv = d3
        .select("#shapArea")
        .append("div")
        .attr("id", "barplotdiv")
        .attr("class", "tooltip")
        .style("opacity", 0);

    let path = bar.append("path")
        .attr("d", function (d) {
            return rightRoundedRect(labelWidth, 0, d.value < 0 ? 0 : scale(Math.abs(d.value)), bh, 3.5);
        });

    path.attr("opacity", 0.7)
        .attr("width", function (d) {
            if (d.value <= 0) {
                return 0;
            }
            return scale(Math.abs(d.value));
        })
        .on("mouseover", function (d) {
            d3.select(this).transition()
                .duration("100")
                .attr("opacity", 1);

            shapHoverDiv.transition()
                .duration(100)
                .style("opacity", 1);

            shapHoverDiv.html(d.feature + "\n" + roundToN(d.value, 6))
                .style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY - 15) + "px");

            barDiv = true;
            showPatientDistributions(d);
        })
        .on("mouseout", function () {
            d3.select(this).transition()
                .duration("200")
                .attr("opacity", 0.7);

            shapHoverDiv.transition()
                .duration("200")
                .style("opacity", 0);

            barDiv = false;

        })
        .on("click", function (d, i) {
            console.log("user clicked on bar", d, i);
            showScatterplotLegend = true;

            shapHoverDiv.transition()
                .duration("200")
                .style("opacity", 0);

            legendNeeded = true;
            highlightSelection(d.feature);
        });

    svg.insert("g", ":first-child")
        .attr("class", "axisHorizontal")
        .attr("transform", "translate(" + (margin + labelWidth) + "," + (h - axisMargin - margin) + ")");
}

/**
 * Round `num` to the specified number `n` of decimal digits.
 *
 * @param num - the number to round.
 * @param n - the number of decimal digits to preserve.
 * @returns {number} the rounded number.
 */
function roundToN(num, n) {
    return +(Math.round(num + "e+" + n) + "e-" + n);
}

/**
 * Determine the affiliation of a feature to one of the datasets.
 *
 * @param featureName - the name of the feature.
 * @returns {string} - the indication of the dataset as font awesome icon.
 */
function getIndicationOfDataset(featureName) {
    if (featuresPerDataset['clinical'].includes(featureName)) {
        return clinicalIcon;
    }
    if (featuresPerDataset['radiomic'].includes(featureName)) {
        return radiomicIcon;
    }
    if (featuresPerDataset['genomic'].includes(featureName)) {
        return genomicIcon;
    }
    return undefinedIcon;
}

/**
 * The color to use for the shading of the dataset icons.
 * This enhances the recognition of the dataset of the respective
 * feature on the bar chart.
 *
 * @param featureName - the name of the feature.
 * @returns {string} - the color to use for shading the feature icon.
 */
function getColorForDataset(featureName) {
    let dataset = getIndicationOfDataset(featureName);
    if (dataset === radiomicIcon) {
        return "white";
    }
    if (dataset === clinicalIcon) {
        return "yellow";
    }
    if (dataset === genomicIcon) {
        return "lightblue";
    }
}

/**
 * Called, when the radiomics checkbox is clicked to filter the data.
 */
function radiomicsCheckboxOnShapPlotClicked() {
    if (selectedShapForBarPlot) {
        let shapD = getShapDataOfMarkedCheckboxes();
        updateSingleShapPlot(shapD, currentShapCluster);

    } else {
        let interD = getInterclassDataOfMarkedCheckboxes();
        updateSingleInterclassPlot(interD, currentInterclassCluster);
    }
    let checkBox = document.getElementById("radiomicsCheckBoxOnShapPlot");
    if (checkBox.checked) {
        console.log("Radiomics checkbox is checked");
    } else {
        console.log("Radiomics checkbox is unchecked");
    }
}

/**
 * Called, when the genomics checkbox is clicked to filter the data.
 */
function genomicsCheckboxOnShapPlotClicked() {
    if (selectedShapForBarPlot) {
        let shapD = getShapDataOfMarkedCheckboxes();
        updateSingleShapPlot(shapD, currentShapCluster);
    } else {
        let interD = getInterclassDataOfMarkedCheckboxes();
        updateSingleInterclassPlot(interD, currentInterclassCluster);
    }

    let checkBox = document.getElementById("genomicsCheckBoxOnShapPlot");
    if (checkBox.checked) {
        console.log("Genomics checkbox is checked");
    } else {
        console.log("Genomics checkbox is unchecked");
    }
}

/**
 * Called, when the clinical checkbox is clicked to filter the data.
 */
function clinicalCheckboxOnShapPlotClicked() {
    if (selectedShapForBarPlot) {
        let shapD = getShapDataOfMarkedCheckboxes();
        updateSingleShapPlot(shapD, currentShapCluster);

    } else {
        let interD = getInterclassDataOfMarkedCheckboxes();
        updateSingleInterclassPlot(interD, currentInterclassCluster);
    }
    let checkBox = document.getElementById("clinicalCheckBoxOnShapPlot");
    if (checkBox.checked) {
        console.log("Clinical checkbox is checked");
    } else {
        console.log("Clinical checkbox is unchecked");
    }
}

/**
 * Get the filtered data based on the status of each of the checkboxes.
 *
 * @returns {*[]} - the filtered data as ranked list.
 */
function getShapDataOfMarkedCheckboxes() {
    let radiomicsCheckbox = document.getElementById("radiomicsCheckBoxOnShapPlot");
    let genomicsCheckbox = document.getElementById("genomicsCheckBoxOnShapPlot");
    let clinicalCheckbox = document.getElementById("clinicalCheckBoxOnShapPlot");

    let result = [];
    let clusterData;
    for (let i = 0; i < shapClusters.length; i++) {
        let shapPerCluster = [];
        clusterData = shapClusters[i];
        clusterData.forEach(element => {
            let dsIcon = getIndicationOfDataset(element.feature);
            if (radiomicsCheckbox.checked && dsIcon === radiomicIcon) {
                shapPerCluster.push(element);
            } else if (genomicsCheckbox.checked && dsIcon === genomicIcon) {
                shapPerCluster.push(element);
            } else if (clinicalCheckbox.checked && dsIcon === clinicalIcon) {
                shapPerCluster.push(element);
            }
        });
        result.push(shapPerCluster);
    }
    return result;
}

/**
 * Get the path data for a rectangle with rounded right corners. The top-left corner is ⟨x,y⟩.
 * Source of the function: https://stackoverflow.com/questions/12115691/svg-d3-js-rounded-corners-on-one-side-of-a-rectangle
 *
 * @param x - the x coordinate of the top-left corner.
 * @param y  - the y coordinate of the top-left corner.
 * @param width - the width of the bar.
 * @param height - the height of the bar.
 * @param radius - the radius of the rounding.
 * @returns {string} - the path data for a rectangle with rounded right corners.
 */
function rightRoundedRect(x, y, width, height, radius) {
    return "M" + x + "," + y
        + "h" + (width - radius)
        + "a" + radius + "," + radius + " 0 0 1 " + radius + "," + radius
        + "v" + (height - 2 * radius)
        + "a" + radius + "," + radius + " 0 0 1 " + -radius + "," + radius
        + "h" + (radius - width)
        + "z";
}