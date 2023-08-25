let data;
let hoverTableData;
let clusterLabelData;
let hoverData;
let allPatientData;
let allIndices = []
let selectedIndices = [];
let selectedCoordinates = [];
let hoverIndexForTable = -1;
let scatterplotHoverDiv;
let showScatterplotLegend = false;
let featureMap;
let filterColorScale;
let selectedData;
let radius = 6.5;
const NONE = -42;
const minZoom = 0.5;
const maxZoom = 25;
let processSubset = false;
let afterSelection = false;
let showAdvanced = false;
let activeFilter = false;
let legendNeeded = false;

let zoomToScatterplotSelection = false;
const colorBrewerScale = [
    "#1b9e77",
    "#d95f02",
    "#7570b3",
    "#e7298a",
    "#66a61e",
    "#e6ab02",
    "#a6761d",
    "#666666",
];
const maxDensColor = "#d3d7f0";
const densityColor = d3
    .scaleLinear()
    .domain([0, 1])
    .range(["white", maxDensColor]);

let scatterMargin = { top: 30, right: 40, bottom: 30, left: 40 };
let scatterArea = document.getElementById("scatterArea");
let scatterWidth =
    scatterArea.offsetWidth - scatterMargin.left - scatterMargin.right * 2.2;
let scatterHeight = scatterWidth / 2;

const dimRed = {
    TSNE: "T-SNE",
    MDS: "MDS",
    FAMD: "FAMD",
    UMAP: "UMAP",
    PCA: "PCA",
};
const imputations = {
    //BEST: "BEST",
    MICE: "MICE",
    KNN: "KNN",
    CONST: "CONST",
    HCONS: "HCONST",
    NOIMP: "NOIMP",
    COMPL: "COMPL",
};
const clustering = {
    KMEANS: "KMEANS",
    MSHIFT: "M-SHIFT",
    HIRA4: "HIERA-4",
    HIRA6: "HIERA-6",
    DBSCAB: "DBSCAN",
    OPTICS: "OPTICS",
    GMM: "GMM",
};
const outlier = {
    NO: "NO",
    GLOBAL: "GLOBAL",
    LOCAL: "LOCAL",
};
const scaling = {
    NORM: "NORM",
    STAND: "STAND",
};

const interclass = {
    LDA: "LDA",
    SGD: "SGD",
};

const linkOperators = {
    AND: "and",
    OR: "or",
};

let dimReductionMethods = Object.values(dimRed);
let selectedDimReduction = dimReductionMethods[3];

let imputationMethods = Object.values(imputations);
let selectedImputation = imputationMethods[0];

let clusteringMethods = Object.values(clustering);
let selectedClustering = clusteringMethods[0];

let outlierMethods = Object.values(outlier);
let selectedOutlierDetection = outlierMethods[0];

let scalingMethods = Object.values(scaling);
let selectedScaling = scalingMethods[0];

let interclassMethods = Object.values(interclass);
let selectedInterclass = interclassMethods[0];

let linkOperatorMethods = Object.values(linkOperators);
let featuresPerDataset;

/**
 * Starting point for showing the scatterplot of the stratified patient samples.
 *
 * @param dataset - the reduced and clustered data points.
 * @param clinicalInfo - the clinical scores for hovering over the scatter points.
 * @param dataTag - indication of the affiliation of each feature to a dataset.
 */
function d3ScatterPlot(dataset, clinicalInfo, dataTag) {

    hideElement("loadingIndicator");
    hideElement("zoomToSelectionButton");
    hideElement("linkOperatorDropdown");
    hideDropdownOptions();

    initDropdown("dimRedDropdown", dimReductionMethods);
    initDropdown("imputationDropdown", imputationMethods);
    initDropdown("clusteringDropdown", clusteringMethods);
    initDropdown("outlierDropdown", outlierMethods);
    initDropdown("scalingDropdown", scalingMethods);
    initDropdown("interclassDropdown", interclassMethods);
    initDropdown("linkOperatorDropdown", linkOperatorMethods); //
    changeDropDownByIndex("dimRedDropdown", 3);

    let status = window.performance.getEntriesByType("navigation")[0].type;
    if (status === "reload") {
        console.log("Page reloaded");
    }

    let allData = parseDataToJson(dataset);
    data = allData[0];
    clusterLabelData = allData[2];
    hoverTableData = parseDataToJson(clinicalInfo);
    featuresPerDataset = parseDataToJson(dataTag);

    hoverData = hoverTableData[0];
    allIndices = hoverData.map((element, index) => {
        return index;
    })
    allPatientData = hoverTableData[1];
    loadDataToFeatureMap(allPatientData);
    setupFeatureSelectionList();
    showScatterplot(data, getDataLimits(data), clusterLabelData);

}

/**
 * Set local variables to show the last used options on page reload.
 */
function setLocalVariables() {
    localStorage.dimred = selectedDimReduction;
    localStorage.outlier = selectedOutlierDetection;
    localStorage.scaling = selectedScaling;
    localStorage.imputation = selectedImputation;
    localStorage.clustering = selectedClustering;
}

/**
 * Initialize the dropdowns for advanced analysis options.
 *
 * @param dropdownID - the ID of the dropdown to initialize.
 * @param methodOptions - the options to show in the dropdown.
 */
function initDropdown(dropdownID, methodOptions) {
    let dropdown = document.getElementById(dropdownID);
    for (const val of methodOptions) {
        let option = document.createElement("option");
        option.value = val;
        option.text = val.charAt(0).toUpperCase() + val.slice(1);
        dropdown.appendChild(option);
    }
}

/**
 * Get clinical, radiomic, and genomic data of all patients and save it to the feature map.
 *
 * @param patientData - the data features for all patients.
 */
function loadDataToFeatureMap(patientData) {
    featureMap = new Map();
    patientData.forEach((patient) => {

        for (let featureName in patient) {
            let valueInMap = featureMap.get(featureName);
            if (valueInMap != null) {
                // key already in map
                featureMap.get(featureName).push(patient[featureName]);
            } else {
                // add [key, value] pair to map
                featureMap.set(featureName, [patient[featureName]]);
            }
        }
    });
}

/**
 * Stratify the active patient selection on the scatterplot.
 * This repeats the cohort stratification on a patient subset
 * with the currently set dropdown options.
 */
function processSelectionOnScatterplotButtonClicked() {
    console.log("Process selection button clicked");
    if (selectedIndices.length > 0) {
        afterSelection = true;
        processSubset = true;
        sendOptionsPostRequest("indices " + selectedIndices);
    } else {
        processSubset = true;
        hoverIndexForTable = -1;
        sendOptionsPostRequest("resetIndices");
    }
}

/**
 * Group patients selected on the scatterplot into one cluster to compare them with the
 * patients that are not currently selected. The differences and characteristics of the
 * groups are updated in the heatmap and bar charts.
 */
function compareSelectionOnScatterplotButtonClicked() {
    console.log("Compare selection button clicked");
    if (selectedIndices.length > 0 && selectedIndices.length < data.length) {
        let labels = [];
        for (let i = 0; i < data.length; i++) {
            if (selectedIndices.includes(i)) {
                labels.push(1);
            } else {
                labels.push(0);
            }
        }
        afterSelection = true;
        sendOptionsPostRequest("clusters " + labels);
    } else {
        hoverIndexForTable = -1;
        sendOptionsPostRequest("resetClusters");
    }
}

/**
 * Zoom to the active patient selection on the scatterplot to open up the
 * points in the dimensionality reduced and clustered space.
 */
function zoomToSelectionOnScatterplotButtonClicked() {
    console.log("Zoom to selection button clicked");
    if (selectedIndices.length > 0) {
        zoomToScatterplotSelection = !zoomToScatterplotSelection;
        updateScatterplot();
    }
}

/**
 * Set predefined analysis options for t-SNE.
 */
function setTsnePresetButtonClicked() {
    console.log("Preset TSNE button clicked");
    setSelectedPreset(
        dimRed.TSNE,
        0,
        imputations.MICE,
        0,
        clustering.KMEANS,
        0,
        outlier.NO,
        0,
        scaling.NORM,
        0,
        interclass.SGD,
        0
    );
}

/**
 * Set predefined analysis options for FAMD.
 */
function setFamdPresetButtonClicked() {
    console.log("Preset FAMD button clicked");
    setSelectedPreset(
        dimRed.FAMD,
        2,
        imputations.MICE,
        0,
        clustering.HIRA4,
        2,
        outlier.NO,
        0,
        scaling.NORM,
        0,
        interclass.SGD,
        0
    );
}

/**
 * Set predefined analysis options for MDS.
 */
function setMdsPresetButtonClicked() {
    console.log("Preset MDS button clicked");
    setSelectedPreset(
        dimRed.MDS,
        1,
        imputations.MICE,
        0,
        clustering.HIRA4,
        2,
        outlier.NO,
        0,
        scaling.NORM,
        1,
        interclass.SGD,
        0
    );
}

/**
 * Show or hide advanced analysis options on demand.
 */
function showAdvancedOptionsButtonClicked() {
    console.log("Show Advanced options button clicked");
    showAdvanced = !showAdvanced;
    if (showAdvanced) {
        showDropdownOptions();
    } else {
        hideDropdownOptions();
    }
}

/**
 * Import new datasets to the interface.
 */
function importDataButtonClicked() {
    console.log("Import data button clicked");
    alert("This functionality is not implemented yet.\nPlease check again later.")
}

/**
 * Read the data of a new CSV file.
 *
 * @param files - the data files to read.
 * @returns {*[]} - the list of the data content of the CSV.
 */
function readCSV(files) {
    let csvData = [];
    if (files.length > 0) {
        let file = files[0];
        let reader = new FileReader();
        reader.readAsText(file);
        reader.onload = function (event) {
            csvData = event.target.result;
            console.log(csvData, "\n---")
            sendOptionsPostRequest("clinical" + csvData);
            //var rowData = csvData.split('\n'); // one data sample (patient) per row
            //console.log(csvData, "\n___\n", rowData);
            return csvData;
        };
    } else {
        console.log("No file selected.");
    }
    return csvData;
}

/**
 * Export data from the interface.
 */
function exportDataButtonClicked() {
    console.log("Export data button clicked");
    alert("This functionality is not implemented yet.\nPlease check again later.")
}

/**
 * Show the hidden dropdown options for advanced data analysis.
 */
function showDropdownOptions() {
    showHiddenElement("imp");
    showHiddenElement("presets");
    showHiddenElement("outlier");
    showHiddenElement("scaling");
    showHiddenElement("dimred");
    showHiddenElement("clustering");
    showHiddenElement("interclass");
}

/**
 * Hide the dropdown options for advanced data analysis.
 */
function hideDropdownOptions() {
    hideElement("imp");
    hideElement("presets");
    hideElement("outlier");
    hideElement("scaling");
    hideElement("dimred");
    hideElement("clustering");
    hideElement("interclass");
}

/**
 * Set the analysis options of a predefined preset option.
 *
 * @param selDimRed - the selected dimensionality reduction method.
 * @param dimRedID - the dropdown ID of the selected dimensionality reduction method.
 * @param selImp - the selected imputation method.
 * @param impID - the dropdown ID of the selected imputation method.
 * @param selClus - the selected clustering method.
 * @param clusID - the dropdown ID of the selected clustering method.
 * @param selOut - the selected outlier detection and removal method.
 * @param outID - the dropdown ID of the selected outlier detection and removal method.
 * @param selScal - the selected data scaling method.
 * @param scalID - the dropdown ID of the selected scaling method.
 */
function setSelectedPreset(
    selDimRed,
    dimRedID,
    selImp,
    impID,
    selClus,
    clusID,
    selOut,
    outID,
    selScal,
    scalID,
) {
    let optionsString = "";
    optionsString += selDimRed + ";";
    optionsString += selImp + ";";
    optionsString += selClus + ";";
    optionsString += selOut + ";";
    optionsString += selScal;
    console.log(optionsString);

    selectedDimReduction = selDimRed;
    changeDropDownByIndex("dimRedDropdown", dimRedID);
    selectedImputation = selImp;
    changeDropDownByIndex("imputationDropdown", impID);
    selectedClustering = selClus;
    changeDropDownByIndex("clusteringDropdown", clusID);
    selectedOutlierDetection = selOut;
    changeDropDownByIndex("outlierDropdown", outID);
    selectedScaling = selScal;
    changeDropDownByIndex("scalingDropdown", scalID);
    //selectedInterclass = selInter;
    //changeDropDownByIndex("interClassDropdown", interID);

    // Plots are updated after receiving new data
    sendOptionsPostRequest(optionsString);
    setLocalVariables();
}

/**
 * Change an analysis option by its dropdown index.
 *
 * @param dropdown - the dropdown to change.
 * @param index - the index of the dropdown option to set.
 */
function changeDropDownByIndex(dropdown, index) {
    document.getElementById(dropdown).getElementsByTagName("option")[
        index
    ].selected = true;
}

/**
 * Send the current analysis options to the backend to re-stratify the active patient subset on the scatterplot.
 *
 * @param data - the data options to send to the backend.
 */
function sendOptionsPostRequest(data) {
    if (selectedIndices.length > 0 && selectedIndices.length < 3) {
        alert(
            "To process a subset of the data, please select at least three samples."
        );
        return;
    }
    if (getSelectedImputation() === imputations.NOIMP && getSelectedOutlierDetection() !== outlier.NO) {
        alert(
            "GLOBAL or LOCAL outlier removal is only possible if NOIMP is NOT selected in the imputation dropdown." +
            "\nPlease check your input and try again."
        );
        return;
    }

    document.body.style.cursor = "wait";
    showHiddenElement("loadingIndicator");

    fetch(scatterPlotDataUrl, {
        method: "POST",
        headers: {
            "Content-type": "application/json",
            Accept: "application/json",
        },

        body: JSON.stringify(data),
    })
        .then((res) => {
            if (res.ok) {
                receiveDataGetRequest();
                document.body.style.cursor = "default";
                hideElement("loadingIndicator");
                console.log("Data successfully processed");
                return res.json();
            } else {
                hideElement("loadingIndicator");
                document.body.style.cursor = "default";
                alert(
                    "An error occurred in processing the data.\nPlease check your input and try again."
                );
            }
        })
        .then((response) => {
            console.log(response);
        })
        .catch((err) => console.error(err));
}

/**
 * Receive the stratified data from the backend and update all visual charts accordingly.
 */
function receiveDataGetRequest() {
    fetch(scatterPlotDataUrl)
        .then((response) => {
            let newData = response.json();

            console.log("New data received: ", newData);
            newData.then(function (result) {
                let allData = parseDataToJson(result);
                data = allData[0];
                let newShapData = allData[1];
                clusterLabelData = allData[2];
                numberOfClusters = newShapData.length;

                let lda = allData[3];
                let sgd = allData[4];

                if (processSubset) {
                    if (selectedIndices.length > 0) {
                        allIndices = selectedIndices;
                    } else {
                        allIndices = hoverData.map((element, index) => {
                            return index;
                        })
                    }
                    processSubset = false;
                }

                if (afterSelection) {
                    selectedIndices = [];
                }
                // UPDATE ALL CHARTS
                updateScatterplot();
                afterSelection = false;

                d3Heatmap(newShapData, [lda, sgd]);
                d3ShapValues(newShapData);
                d3InterclassValues([lda, sgd]);
                d3SingleInterclassPlot("0 1");
            });
        })
        .catch((err) => console.error(err));
}

/**
 * Hide an element from the interface.
 *
 * @param elementID - the ID of the element to hide.
 */
function hideElement(elementID) {
    document.getElementById(elementID).style.display = "none";
}

/**
 * Show a hidden element in the interface.
 *
 * @param elementID - the ID of the element to show.
 */
function showHiddenElement(elementID) {
    document.getElementById(elementID).style.display = "block";
}

/**
 * Get the selected imputation option in the interface dropdown.
 *
 * @returns {*} - the currently selected imputation option.
 */
function getSelectedImputation() {
    let imputationElem = document.getElementById("imputationDropdown");
    return imputationElem.options[imputationElem.selectedIndex].value;
}

/**
 * Called, when the imputation dropdown is changed.
 */
function imputationDropdownChanged() {
    let selectedImputation = getSelectedImputation();
    sendOptionsPostRequest(selectedImputation);
    localStorage.imputation = selectedImputation;

    console.log("selected: " + selectedImputation);
    updateScatterplot();
}

/**
 * Get the selected outlier detection and removal option in the interface dropdown.
 *
 * @returns {*} - the currently selected outlier detection and removal option.
 */
function getSelectedOutlierDetection() {
    let outlierElem = document.getElementById("outlierDropdown");
    return outlierElem.options[outlierElem.selectedIndex].value;
}

/**
 * Called, when the outlier detection and removal dropdown is changed.
 */
function outlierDropdownChanged() {
    let selectedOutlierDetection = getSelectedOutlierDetection();
    sendOptionsPostRequest(selectedOutlierDetection);
    localStorage.outlier = selectedOutlierDetection;

    console.log("selected: " + selectedOutlierDetection);
    updateScatterplot();
}

/**
 * Called, when the data scaling dropdown is changed.
 */
function scalingDropdownChanged() {
    let scalingElem = document.getElementById("scalingDropdown");
    selectedScaling = scalingElem.options[scalingElem.selectedIndex].value;
    sendOptionsPostRequest(selectedScaling);
    localStorage.scaling = selectedScaling;

    console.log("selected: " + selectedScaling);
    updateScatterplot();
}

/**
 * Called, when the dimensionality reduction dropdown is changed.
 */
function dimReductionDropdownChanged() {
    let dimRedElem = document.getElementById("dimRedDropdown");
    selectedDimReduction = dimRedElem.options[dimRedElem.selectedIndex].value;
    sendOptionsPostRequest(selectedDimReduction);
    localStorage.dimred = selectedDimReduction;

    console.log("selected: " + selectedDimReduction);
    updateScatterplot();
}

/**
 * Called, when the clustering dropdown is changed.
 */
function clusteringDropdownChanged() {
    let clusteringElem = document.getElementById("clusteringDropdown");
    selectedClustering =
        clusteringElem.options[clusteringElem.selectedIndex].value;
    sendOptionsPostRequest(selectedClustering);
    localStorage.clustering = selectedClustering;

    console.log("selected: " + selectedClustering);
    updateScatterplot();
}

/**
 * Get min and max limits of the scatterplot points in x and y direction.
 *
 * @param data - the scatterplot points.
 * @returns {number[][]} - the ranges (min/max values) of the scatter points.
 */
function getDataLimits(data) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < data.length; i++) {
        if (data[i].x < minX) {
            minX = data[i].x;
        }
        if (data[i].y < minY) {
            minY = data[i].y;
        }
        if (data[i].x > maxX) {
            maxX = data[i].x;
        }
        if (data[i].y > maxY) {
            maxY = data[i].y;
        }
    }
    let epsX = (maxX - minX) / 10;
    let epsY = (maxY - minY) / 10;
    return [
        [minX - epsX, maxX + epsX],
        [minY - epsY, maxY + epsY],
    ];
}

/**
 * Show the scatterplot on screen.
 *
 * @param data - the data points of the scatterplot.
 * @param limits - the data limits of the scatter points.
 * @param clusterLabels - the clustering labels of the scatter points.
 */
function showScatterplot(data, limits, clusterLabels) {
    let labelArr = [];
    clusterLabels.forEach(element => {
        labelArr.push(element.label);
    });
    labelArr = labelArr.filter((item, index) => labelArr.indexOf(item) === index);
    numberOfClusters = labelArr.length;
    for (let i = 0; i < clusterLabels.length; i++) {
        data[i].cluster = clusterLabels[i].label;
    }

    let xLimits = limits[0];
    let yLimits = limits[1];

    let xAxis = d3.scaleLinear().domain(xLimits).range([0, scatterWidth]);
    let yAxis = d3.scaleLinear().domain(yLimits).range([scatterHeight, 0]);

    let svg = d3
        .select("#scatterArea")
        .append("svg")
        .attr("id", "scatterplot")
        .attr("width", scatterWidth + scatterMargin.left + scatterMargin.right)
        .attr("height", scatterHeight + scatterMargin.top + scatterMargin.bottom);

    //drawAxis(svg, xAxis, yAxis)
    d3.select("#scatterdiv").remove();
    scatterplotHoverDiv = d3
        .select("#scatterArea")
        .append("div")
        .attr("id", "scatterdiv")
        .attr("class", "tooltip")
        .style("opacity", 0);

    selectedData = getDataPointsOfSelectedIndices(data);
    showPatientScoresOfSelection(featuresPerDataset['clinical'][0]);
    d3SingleInterclassPlot("0 1");
    topGenesOfSelection();

    const x = d3.scaleLinear().domain(xLimits).range([0, scatterWidth]);
    const y = d3.scaleLinear().domain(yLimits).range([scatterHeight, 0]);

    drawDensityContours(svg, data, x, y);
    let circles = drawCircles(svg, data, xAxis, yAxis);

    let zoom = d3
        .zoom()
        .extent([
            [0, 0],
            [scatterWidth, scatterHeight],
        ])
        .on("zoom", function () {
            let newX = d3.event.transform.rescaleX(xAxis);
            let newY = d3.event.transform.rescaleY(yAxis);

            d3.selectAll("circle")
                .attr("cx", function (d) {
                    return typeof d != "undefined" ? newX(d.x) : 0;
                })
                .attr("cy", function (d) {
                    return typeof d != "undefined" ? newY(d.y) : 0;
                });

            // remove old contour lines and draw new ones
            svg.selectAll("path").remove();
            drawDensityContours(svg, data, newX, newY);
        });

    let lasso = lassoSelection(svg, circles, radius);
    svg.call(lasso);
    svg.call(zoom);

    if (!addFeatureInput) {
        let featureName = data["featureName"];
        if (featureName !== undefined) {
            let featureData = Array.from(featureMap.get(featureName));
            let minVal = Math.min(...featureData);
            let maxVal = Math.max(...featureData);
            if (showScatterplotLegend) {
                showLegend(svg, [minVal, featureName, maxVal]);
                showScatterplotLegend = false;
            }
        }
    }
    circles.exit().remove();
}

/**
 * Show legend of the actively selected feature on the scatterplot.
 *
 * @param svg - the svg to show the legend on.
 * @param range - the range of the scatterplot.
 */
function showLegend(svg, range) {
    let keys = [];
    let init = -1;
    let step = 0.00008;
    for (let i = 0; init < 1; i++) {
        keys.push(init);
        init += step;
    }
    let pos = 0;
    let squareHeight = 20;
    let offset = 13;

    svg.selectAll("legendSquares")
        .data(keys)
        .enter()
        .append("rect")
        .attr("x", function (d, i) {
            return 15 + i * (pos + 0.045);
        })
        .attr("y", function () {
            return scatterHeight + offset;
        })
        .attr("width", 1)
        .attr("height", squareHeight)
        .style("fill", function (d) {
            if (d >= -step * 4 && d <= step * 4) {
                return "black";
            }
            return filterColorScale(d);
        });
    showLegendLabels(svg, range);
}

/**
 * Show legend labels of the actively selected feature on the scatterplot.
 *
 * @param svg - the svg to show the legend labels on.
 * @param range - the range of the scatterplot.
 */
function showLegendLabels(svg, range) {
    let squareHeight = 20;
    let offset = 57;

    svg.selectAll("legendLabels")
        .data(range)
        .enter()
        .append("text")
        .attr("x", function (d, i) {
            return 6 + i * (squareHeight + 520);
        })
        .attr("y", function () {
            return scatterHeight + offset;
        })
        .style("fill", function (d) {
            if (d === 0) {
                return "black";
            }
        })
        .text(function (d) {
            return d;
        })
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle");

}

/**
 * Drax scatterplot axis.
 *
 * @param svg - the svg to draw the axis on.
 * @param xAxis - the x-axis to draw.
 * @param yAxis - the y-axis to draw.
 */
function drawAxis(svg, xAxis, yAxis) {
    svg
        .append("g")
        .attr("transform", "translate(0," + scatterHeight + ")")
        .call(d3.axisBottom(xAxis));
    svg
        .append("g")
        .attr(
            "transform",
            "translate(" + scatterMargin.left + "," + scatterMargin.top + ")"
        )
        .call(d3.axisLeft(yAxis));
}

/**
 * Draw density contours on the scatterplot.
 *
 * @param svg - the svg to draw the density contours on.
 * @param data - the data to use for estimating the contours.
 * @param x - the x scale of the scatterplot.
 * @param y - the y scale of the scatterplot.
 */
function drawDensityContours(svg, data, x, y) {
    let densityData = d3
        .contourDensity()
        .x(function (d) {
            return x(d.x);
        })
        .y(function (d) {
            return y(d.y);
        })
        .size([scatterWidth, scatterHeight])
        .bandwidth(50)(data);

    //draw contours
    svg
        .insert("g", "g")
        .selectAll("path")
        .data(densityData)
        .enter()
        .append("path")
        .attr("d", d3.geoPath())
        .attr("fill", function (d) {
            return densityColor(d.value * 1000);
        })
        .attr("stroke", maxDensColor)
        .attr("stroke-linejoin", "round");
}

/**
 * Draw the scatterplot circles.
 *
 * @param svg - the svg to draw the scatterplot circles on.
 * @param data - the scatter points to draw the circles for.
 * @param xAxis - the x-Axis of the scatterplot.
 * @param yAxis - the y-Axis of the scatterplot.
 * @returns {*} - the radius of the circles.
 */
function drawCircles(svg, data, xAxis, yAxis) {
    filterColorScale = d3.scaleSequential(
        (d) => {
            return scatterplotScale(d);
        }
    )
    //draw circles
    return svg
        .selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .on("mousemove", handleMouseMoveOnPoint)
        .on("mouseover", handleMouseOverPoint)
        .on("mouseout", handleMouseOutOfPoint)

        .style("fill", function (d) {
            // normal cases
            if (activeFilter) {
                if (d.highlight === 0) {
                    return "lightgray";
                } else {
                    if (hypothesisFilter) {
                        legendNeeded = false;
                        return d.highlight === 1 ? colorBrewerScale[d.cluster] : d.highlight;
                    } else {
                        return filterColorScale(d.normValue);
                    }
                }
            } else {
                legendNeeded = false;
                return colorBrewerScale[d.cluster];
            }
        })
        .style("opacity", 1)
        .style("stroke", function (d) {
            if ((activeFilter && !d.highlight) || d.highlight) {
                return colorBrewerScale[d.cluster];
            } else {
                return "black";
            }
        })
        .style("stroke-width", function (d) {
            if (d.highlight) {
                return 3;
            } else {
                return 1;
            }
        })

        .attr("cx", function (d) {
            return xAxis(d.x);
        })
        .attr("cy", function (d) {
            return yAxis(d.y);
        })
        .attr("r", function (d) {
            return selectedData.includes(d) ? 2 * radius : radius;
        });
}

/**
 * Called when hovering over a point on the scatterplot.
 */
function handleMouseOverPoint() {
    d3.select(this)
        .transition()
        .attr("r", function (d) {
            return selectedData.includes(d) ? 4 * radius : 2 * radius;
        });

    scatterplotHoverDiv
        .transition()
        .style("opacity", 1);
}

/**
 * Called when moving the mouse away from a point on the scatterplot.
 */
function handleMouseOutOfPoint() {
    d3.select(this)
        .transition()
        .duration("200")
        .attr("r", function (d) {
            return selectedData.includes(d) ? 2 * radius : radius;
        });

    scatterplotHoverDiv.transition().duration("200").style("opacity", 0);
}

/**
 * Called while the mouse moves over a scatterplot point.
 *
 * @param d - the scatter point the mouse is moving on.
 * @param i - the index of the scatter point.
 */
function handleMouseMoveOnPoint(d, i) {
    let hoverPos = data.indexOf(d); // same as i
    let hoverIndex = allIndices[i];
    scatterplotHoverDiv
        .html(hoverDataToString(getHoverDataOfSelection(), hoverPos, hoverIndex))
        .style("left", d3.event.pageX + 10 + "px")
        .style("top", d3.event.pageY - 15 + "px");
}

/**
 * Get the data points of the active patient selection on the scatterplot.
 *
 * @param data - the stratified scatterplot data.
 * @returns {*[]} - the list of scatter plot points of the active patient selection.
 */
function getDataPointsOfSelectedIndices(data) {
    selectedData = [];
    if (selectedIndices.length > 0) {
        for (let i = 0; i < selectedIndices.length; i++) {
            selectedData.push(data[selectedIndices[i]]);
        }
    }
    return selectedData;
}

/**
 * Format the clinical data to show on hovering over a scatter point.
 *
 * @param hoverData - the clinical data to show on hovering over a scatter point.
 * @param dataIndex - the index of the scatter point the mouse is moved on.
 * @param hoverIndex - the index of the hovered data.
 * @returns {string} - the formatted data to show on mouse hover.
 */
function hoverDataToString(hoverData, dataIndex, hoverIndex) {
    let patientData = data[dataIndex];
    let statement = (patientData.highlight === 1) ? "\n\nhypothesis: ✔" :
        (patientData.highlight === undefined || patientData.highlight === "empty") ? "" : "\n\nhypothesis: ✖";
    return (
        hoverData[hoverIndex].id +

        "\n\nAge: " +
        hoverData[hoverIndex].age +
        "\nWeight: " +
        hoverData[hoverIndex].weight +
        " kg" +

        "\nBMI: " +
        hoverData[hoverIndex].bmi +
        "\nHeight: " +
        hoverData[hoverIndex].size +
        " m"

        + statement
    );
}

/**
 * Perform lasso selections on the scatterplot.
 *
 * @param svg - the svg of the scatterplot.
 * @param circles - the circles drawn for the scatterplot points.
 * @param r - the radius of the circles on the scatterplot.
 * @returns {*} - the lasso path to draw on the scatterplot.
 */
function lassoSelection(svg, circles, r) {
    let lasso_start = function () {
        lasso
            .items()
            .attr("r", r)
            .classed("not_possible", true)
            .classed("selected", false);
    };

    let lasso_draw = function () {
        lasso
            .possibleItems()
            .classed("not_possible", false)
            .classed("possible", true)
            .attr("r", 2 * r);

        lasso
            .notPossibleItems()
            .classed("not_possible", true)
            .classed("possible", false)
            .attr("r", r);
    };

    let lasso_end = function () {
        lasso
            .items()
            .classed("not_possible", false)
            .classed("possible", false)
            .attr("r", r);

        let selectedCircles = lasso
            .selectedItems()
            .classed("selected", true)
            .attr("r", 2 * r);

        selectedCoordinates = [];
        selectedIndices = [];
        let numSelected = selectedCircles._groups[0].length;

        for (let i = 0; i < numSelected; i++) {
            let coordinates = selectedCircles._groups[0][i].__data__;
            selectedCoordinates.push(coordinates);
            let selectedIndex = data.indexOf(coordinates);
            selectedIndices.push(selectedIndex);
        }
        if (selectedIndices.length > 0) {
            showHiddenElement("zoomToSelectionButton");
        } else {
            hoverIndexForTable = -1;
            hideElement("zoomToSelectionButton");
        }
        updateScatterplot();
        lasso.notSelectedItems();
    };

    let lasso = d3
        .lasso()
        .closePathSelect(true)
        .closePathDistance(Infinity)
        .items(circles)
        .targetArea(svg)
        .on("start", lasso_start)
        .on("draw", lasso_draw)
        .on("end", lasso_end);

    return lasso;
}

/**
 * Update the scatterplot by drawing a new chart.
 */
function updateScatterplot() {
    let limits = getDataLimits(data);
    if (zoomToScatterplotSelection && selectedIndices.length > 0) {
        let selectedData = getDataPointsOfSelectedIndices(data);
        limits = getDataLimits(selectedData);
    }
    if (selectedIndices.length <= 0) {
        zoomToScatterplotSelection = false;
    }
    d3.select("#scatterplot").remove();
    showScatterplot(data, limits, clusterLabelData);
}

/**
 * Get the hover data of an active scatter point.
 *
 * @returns {*} - the hover data of an active scatter point.
 */
function getHoverDataOfSelection() {
    return hoverData;
}

/**
 * Get the patient data containing all features for all patients.
 *
 * @returns {*} - the patient data.
 */
function getAllPatientData() {
    return allPatientData;
}

/**
 * Get the patient data as a feature map.
 * @returns {*} - a feature map of patient scores.
 */
function getPatientsFeatureMap() {
    return featureMap;
}

/**
 * Parse data to json after receiving it from the backend.
 *
 * @param input - the received data to parse.
 * @returns {any} - the parsed data to process and visualize on the frontend.
 */
function parseDataToJson(input) {
    let replaced_str = input
        .replaceAll("'", '"')
        .replaceAll("False", "false")
        .replaceAll("True", "true")
        .replaceAll("nan", NONE);

    return JSON.parse(replaced_str);
}
