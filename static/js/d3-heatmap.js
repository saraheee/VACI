colorDomain = [-1, 0, 1];
neutralColor = "#faf7fc";
violettColor = "#6c4675";
colorRange = ["white", neutralColor, "darkred"];
scatterFeatureRange = ["#e0e0e0", "#4d4d4d"];

const logScale = d3.scaleLog()
    .domain(colorDomain)
    .range(colorRange);

// for scatterplot
const scatterplotScale = d3.scaleLinear()
    .domain(colorDomain)
    .range(scatterFeatureRange);

const linScale = d3.scaleLinear()
    .domain(colorDomain)
    .range(colorRange);

// for heatmap
const expScale = d3.scalePow()
    .exponent(Math.E)
    .domain(colorDomain)
    .range(colorRange);

const selectedColorScale = expScale;
let showNormalized = true;
let selectedShapForBarPlot = true;

/**
 * Starting point for showing the characteristics and pairwise differences of the clusters in the heatmap.
 *
 * @param shapData - the characterizing features per cluster.
 * @param interclassData - the differentiating features per cluster pair.
 */
function d3Heatmap(shapData, interclassData) {
    d3.select("#heatmapPlot").remove();
    if (typeof (shapData) == "string") {
        shapData = parseDataToJson(shapData);
    }
    if (typeof (interclassData) == "string") {
        interclassData = parseDataToJson(interclassData);
    }
    numberOfClusters = shapData.length;
    let lda = interclassData[0];
    let selectedInterclassData = interclassData[1]; //sgd

    if (selectedInterclass === interclass.LDA) {
        selectedInterclassData = lda;
    }

    let P = 0.5 // amount of data in percent to show
    let NUM = shapData[0].length * P / 100;
    let C = NUM / shapData.length;
    //C = selectedInterclassData.length > 1 ? C : C * 25;
    C = selectedInterclassData.length > 1 ? 90 : 25;

    // sort data descending by value and take the top C per category
    let topFeatures = [];
    let minShap = Infinity;
    let maxShap = -Infinity;
    let k = 0;
    let currentShap;
    let currentMax;
    let currentMin;
    for (; k < shapData.length; k++) {
        shapData[k] = shapData[k].sort((prev, next) => next.value - prev.value);
        currentShap = shapData[k];
        currentMax = currentShap[0].value;
        currentMin = currentShap[currentShap.length - 1].value;
        if (minShap > currentMin) {
            minShap = currentMin;
        }
        if (maxShap < currentMax) {
            maxShap = currentMax;
        }

        topFeatures[k] = shapData[k].slice(0, C);
    }

    let minLDA = Infinity;
    let maxLDA = -Infinity;
    let currentLDA;
    for (let i = 0; i < selectedInterclassData.length; i++) {
        selectedInterclassData[i] = selectedInterclassData[i].sort((prev, next) => next.value - prev.value);

        currentLDA = selectedInterclassData[i];
        currentMax = currentLDA[0].value;
        currentMin = currentLDA[currentLDA.length - 1].value;
        if (minLDA > currentMin) {
            minLDA = currentMin;
        }
        if (maxLDA < currentMax) {
            maxLDA = currentMax;
        }
        topFeatures[k] = selectedInterclassData[i].slice(0, C);
    }

    let normShap;
    for (let i = 0; i < shapData.length; i++) {
        currentShap = shapData[i];
        for (k = 0; k < shapData[i].length; k++) {
            // normalize data to range [-1 0 1];
            if (shapData[i][k].value < 0) {
                normShap = (((shapData[i][k].value - minShap)) / (maxShap - minShap)) - 1;
            } else if (shapData[i][k].value > 0) {
                normShap = (((shapData[i][k].value - minShap)) / (maxShap - minShap));
            } else {
                normShap = 0;
            }
            shapData[i][k].normalizedValue = normShap;
        }
    }

    let normLDA;
    for (let i = 0; i < selectedInterclassData.length; i++) {
        currentLDA = selectedInterclassData[i];
        for (k = 0; k < selectedInterclassData[i].length; k++) {
            // normalize data to range [-1 0 1];
            if (selectedInterclassData[i][k].value < 0) {
                normLDA = (((selectedInterclassData[i][k].value - minLDA)) / (maxLDA - minLDA)) - 1;
            } else if (selectedInterclassData[i][k].value > 0) {
                normLDA = (((selectedInterclassData[i][k].value - minLDA)) / (maxLDA - minLDA));
            } else {
                normLDA = 0;
            }
            selectedInterclassData[i][k].normalizedValue = normLDA;
        }
    }

    let topFeatureNames = [];
    for (let i = 0; i < topFeatures.length; i++) {
        topFeatureNames[i] = d3.set(topFeatures[i].map(function (d) {
            return d.feature;
        })).values();
    }
    let ind = topFeatureNames.indexOf("index");
    if (ind > -1) {
        array.splice(ind);
    }
    let allTopNames = [];
    topFeatureNames.forEach(element => {
        allTopNames = allTopNames.concat(element);
    });

    //add all clinical values to heatmap 
    allTopNames = allTopNames.concat(featuresPerDataset['clinical'])
    let topFeatureData = [];
    let i = 0;
    allTopNames.forEach(name => {
        shapData.forEach(dataCluster => {
            let shap_found = dataCluster.filter(item => (item.feature === name));
            if (shap_found.length > 0) {
                topFeatureData[i] = shap_found[0];
                i++;
            }
        });
        selectedInterclassData.forEach(dataCluster => {
            let inter_found = dataCluster.filter(item => (item.feature === name));
            if (inter_found.length > 0) {
                topFeatureData[i] = inter_found[0];
                i++;
            }
        });
    });
    showHeatmap(topFeatureData, selectedInterclassData.length);

}

/**
 * Show the top characterizing and pairwise differentiating features in the heatmap.
 *
 * @param topFeatureData - the ranked list of top features to show.
 * @param numberOfInter - the number of cluster pairs for the pairwise differences.
 */
function showHeatmap(topFeatureData, numberOfInter) {
    let INCREASE = 1;
    INCREASE = numberOfInter === 1 ? INCREASE : 1.2;

    const margin = { top: 120, right: 20, bottom: 20, left: 110 };
    const element = document.getElementById("heatmapArea");
    const width = element.offsetWidth * INCREASE * 2;
    const height = width / 10 * numberOfClusters * INCREASE;

    const itemSize = 200;
    const cellSize = itemSize - 1;

    const xElements = d3.set(topFeatureData.map(function (d) {
        return d.feature;
    })).values();

    const yElements = d3.set(topFeatureData.map(function (d) {
        return d.cluster;
    })).values();

    let values = [];
    topFeatureData.forEach(e => {
        values.push(showNormalized ? element.normalizedValue : e.value);
    });

    let minV = Infinity;
    let maxV = -Infinity;
    if (showNormalized) {
        minV = -1;
        maxV = 1;
    } else {
        values.forEach(num => {
            if (num < minV) {
                minV = num;
            }
            if (num > maxV) {
                maxV = num;
            }
        });
    }

    let cellWidth = cellSize / 9;
    let cellHeight = cellSize / 9;

    const xScale = d3.scaleBand()
        .domain(xElements)
        .range([0, xElements.length * (cellWidth)])
        .paddingInner(0.2);

    const xAxis = d3.axisTop(xScale)
        .tickFormat(function (d) {
            return d;
        });

    const yScale = d3.scaleBand()
        .domain(yElements)
        .range([0, yElements.length * (cellHeight)])
        .paddingInner(0.2);

    const yAxis = d3.axisLeft(yScale)
        .tickFormat(function (d) {
            return d;
        });

    const colorScale = d3.scaleSequential(
        (d) => {
            return selectedColorScale(d);
        }
    );
    const svg = d3.select('#heatmapArea').append("svg")
        .attr("id", "heatmapPlot")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.select("#heatmapdiv").remove();
    const heatMapToolTip = d3.tip()
        .attr("class", "d3-tip")
        .offset([-305, -140])
        .html("<div id='tipDiv'></div>");
    svg.call(heatMapToolTip);

    const cells = svg.selectAll('rect')
        .data(topFeatureData)
        .enter()
        .append('g')
        .append('rect');

    cells.attr('class', 'cell')
        .attr('width', (cellWidth - 3) > 0 ? cellWidth - 3 : cellWidth)
        .attr('height', (cellHeight - 3) > 0 ? cellHeight - 3 : cellHeight)
        .attr('y', function (d) {
            return yScale(d.cluster);
        })
        .attr('x', function (d) {
            return xScale(d.feature);
        })
        .attr("rx", 4)
        .attr("ry", 4)
        .attr('fill', function (d) {
            if (d) {
                if (d.value === 0) {
                    return neutralColor;
                } else {
                    return colorScale(showNormalized ? d.normalizedValue : d.value);
                }
            } else {
                return "black";
            }
        })

        .on("mouseover", function (d) {
            d3.select(this).transition()
                .duration("100")
                .style("stroke", "black")
                .style("stroke-width", 2)
                .attr("opacity", 0.5);

            heatMapToolTip.show();
            showPatientDistributions(d);
        })
        .on("mouseout", function () {
            d3.select(this).transition()
                .duration("200")
                .style("stroke", "none")
                .attr("opacity", 1)
                .style("fill", function (d) {
                    if (d.value === 0) {
                        return neutralColor;
                    }
                });
            heatMapToolTip.hide();
        })
        .on("click", function (d, i) {
            showScatterplotLegend = true;
            console.log("user clicked on heat map cell", d, i)
            highlightSelection(d.feature);
            heatMapToolTip.hide();
        });

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .selectAll('text')
        .attr('font-weight', 'normal')
        .attr('fill', 'black');

    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        .selectAll('text')
        .attr('font-weight', 'normal')
        .attr('font-size', '12px')
        .attr('fill', 'black')
        .style("text-anchor", "start")
        .attr("dx", "0.8em")
        .attr("dy", "0.5em")
        .attr("transform", function () {
            return "rotate(-65)";
        });

    let keys = [];
    let init = -1;
    let step = 0.00008;
    for (let i = 0; init < 1; i++) {
        keys.push(init);
        init += step;
    }
    let pos = 0;
    let squareHeight = 15;
    let offset = 8;
    let topLabelSize = 70;
    svg.selectAll("legendSquares")
        .data(keys)
        .enter()
        .append("rect")
        .attr("x", function () {
            return pos += 0.061;
        })
        .attr("y", function () {
            let yPos = cellHeight * numberOfClusters * numberOfInter + topLabelSize + offset;
            if (numberOfInter > 1) {
                if (numberOfInter === 3) {
                    return yPos / 2 + offset * 2;
                }
                return yPos / 2 - offset;
            } else {
                return yPos - offset * 3;
            }
        })
        .attr("width", 1)
        .attr("height", squareHeight)
        .style("fill", function (d) {
            if (d >= -step * 4 && d <= step * 4 || d < -0.999) {
                return "black";
            }
            return selectedColorScale(d);
        });


    svg.selectAll("legendLabels")
        .data([-1, 0, 1])
        .enter()
        .append("text")
        .attr("x", function (d, i) {
            return -10 + i * (squareHeight + 751);
        })
        .attr("y", function () {
            let yPos = cellHeight * 1.2 * numberOfClusters * numberOfInter + topLabelSize + squareHeight * 1.2;
            if (numberOfInter > 1) {
                if (numberOfInter === 3) {
                    return yPos / 2 + 30;
                }
                return yPos / 2 - 30;
            } else {
                return yPos - offset * 3 + 20; //yPos + 15 * 6;
            }
        })
        .style("fill", function (d) {
            if (d === 0 || d === -1) {
                return "black";
            }
            return selectedColorScale(d);
        })
        .text(function (d) {
            return d;
        })
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle");

    // topFeatureData, numberOfClusters, numberOfInter
    pos = -20;
    squareHeight = 20;
    let interclassSquares = [];
    for (let i = 0; i < yElements.length; i++) {
        if (yElements[i].length > 1) {
            interclassSquares.push(yElements[i]);
        }
    }

    svg.selectAll("legendSquaresLeftFirst")
        .data(yElements)
        .enter()
        .append("rect")
        .attr("id", function (d) {
            return "legend" + d.replace(" ", "") + "a";
        })
        .attr("x", function () {
            return -48;
        })
        .attr("y", function (d) {
            return yScale(d);
        })
        .attr("rx", 8)
        .attr("ry", 8)
        .attr("width", function (d) {
            return d.length > 1 ? squareHeight / 2 : squareHeight;
        })
        .attr("height", squareHeight)
        .attr("text-anchor", "left")
        .style("fill", function (d) {
            return d.length > 1 ? colorBrewerScale[d[2]] : colorBrewerScale[d];
        })
        .style("alignment-baseline", "middle")
        .style("opacity", 0.8)
        .on("click", handleMouseClickOnCellIndicator)
        .on("mouseover", handleMouseOverCellIndicator)
        .on("mouseout", handleMouseOutOfCellIndicator);

    svg.selectAll("legendSquaresLeftSecond")
        .data(interclassSquares)
        .enter()
        .append("rect")
        .attr("id", function (d) {
            return "legend" + d.replace(" ", "") + "b";
        })
        .attr("x", function () {
            return -37;
        })
        .attr("y", function (d) {
            return yScale(d);
        })
        .attr("rx", 8)
        .attr("ry", 8)
        .attr("width", squareHeight / 2)
        .attr("height", squareHeight)
        .style("fill", function (d) {
            if (d.length > 0) {
                return colorBrewerScale[d[0]];
            }
            return "white";
        })
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle")
        .style("opacity", 0.8)
        .on("click", handleMouseClickOnCellIndicator)
        .on("mouseover", handleMouseOverCellIndicator)
        .on("mouseout", handleMouseOutOfCellIndicator);

    cells.exit().remove();
}

/**
 * Switch between the detailed views of cluster characteristics and pairwise differences through cell indicators on the
 * left side of the heatmap.
 *
 * @param d - the cluster or cluster pair the user selected through the cell indicator of the heatmap.
 * @param i - the index of the indicator the user clicked on.
 */
function handleMouseClickOnCellIndicator(d, i) {
    console.log("clicked on cell indicator", d, i);
    if (d.length > 1) {
        selectedShapForBarPlot = false;
        d3SingleInterclassPlot(d);
        //hidePatientsOfClusters();
    } else {
        selectedShapForBarPlot = true;
        d3SingleShapPlot(d);
        //showPatientsOfClusters(d);
    }
}

/**
 *
 * @param d
 */
function handleMouseOverCellIndicator(d) {
    let idPrefix = "#legend" + d.replace(" ", "");
    let selected = d.length > 1 ? d3.selectAll(idPrefix + "a," + idPrefix + "b") : d3.select(this);
    selected.transition()
        .duration("100")
        .style("stroke", "black")
        .style("stroke-width", 2)
        .style("cursor", "pointer")
        .attr("opacity", 0.5);
}

/**
 *
 * @param d
 */
function handleMouseOutOfCellIndicator(d) {
    let idPrefix = "#legend" + d.replace(" ", "");
    let selected = d.length > 1 ? d3.selectAll(idPrefix + "a," + idPrefix + "b") : d3.select(this);
    selected.transition()
        .duration("200")
        .style("stroke", "none")
        .style("cursor", "default")
        .attr("opacity", 1);
}

/**
 * Merge the data of the top features of the cluster characteristics and differences.
 *
 * @param data - the new data to merge.
 * @param mergedHeatmapData - the previously merged data to add the new data to.
 * @param prefix - the prefix to use for the data.
 * @param sort - true, if the data should be sorted after merging, otherwise the order is preserved.
 * @returns {*} - the merged feature data per cluster characteristics or pairwise cluster differences.
 */
function mergeData(data, mergedHeatmapData, prefix, sort) {
    if (sort) {
        return mergeAndSortData(data, mergedHeatmapData, prefix);
    } else {
        return mergeUnsortedData(data, mergedHeatmapData, prefix);
    }
}

/**
 * Merge and sort the data features.
 *
 * @param data - the new data to merge.
 * @param mergedHeatmapData - the previously merged data to add the new data to.
 * @param prefix - the prefix to use for the data.
 * @returns {*} - the merged feature data per cluster characteristics or pairwise cluster differences.
 */
function mergeAndSortData(data, mergedHeatmapData, prefix) {
    let key;
    let mergedIndex = mergedHeatmapData.length;

    // indicator defines the order in merging the datasets together
    let indicator = [clinicalIcon, radiomicIcon, genomicIcon];
    indicator.forEach(indicatorIcon => {
        for (let i = 0; i < data.length; i++) {
            let dataCluster = data[i];
            for (key in dataCluster) {
                if (dataCluster.hasOwnProperty(key)) {
                    let datasetIcon = getIndicationOfDataset(dataCluster[key].feature);
                    if (datasetIcon === indicatorIcon) {
                        dataCluster[key].cluster = prefix + " " + dataCluster[key].cluster;
                        mergedHeatmapData[mergedIndex] = dataCluster[key];
                        mergedIndex++;
                    }
                }
            }
        }
    });
    return mergedHeatmapData;
}

/**
 * Merge the features and preserve the original order.
 *
 * @param data - the new data to merge.
 * @param mergedHeatmapData - the previously merged data to add the new data to.
 * @param prefix - the prefix to use for the data.
 * @returns {*} - the merged feature data per cluster characteristics or pairwise cluster differences.
 */
function mergeUnsortedData(data, mergedHeatmapData, prefix) {
    let key;
    let mergedIndex = mergedHeatmapData.length;
    for (let i = 0; i < data.length; i++) {
        let dataCluster = data[i];
        for (key in dataCluster) {
            if (dataCluster.hasOwnProperty(key)) {
                dataCluster[key].cluster = prefix + " " + dataCluster[key].cluster;
                mergedHeatmapData[mergedIndex] = dataCluster[key];
                mergedIndex++;
            }
        }
    }
    return mergedHeatmapData;
}
