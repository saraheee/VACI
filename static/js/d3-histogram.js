let selectedMinRange;
let selectedMaxRange;

let hypothesisFeaturesPerHistoSlider = {};
let hypothesisOperatorsPerHistoSlider = {};

let allHypothesisFeatureStartRanges = {};
let allHypothesisFeatureEndRanges = {};

let allIndicesPerBin = {};

/**
 * Draw a histogram with sliders for interactive hypothesis assessment through patient filtering.
 * Code adapted from: https://observablehq.com/@trebor/snapping-histogram-slider
 */
function histogramSlider(featureName) {

    featureMap = getPatientsFeatureMap();
    let featureData = Array.from(featureMap.get(featureName));
    let featureIndices = Array.from(featureMap.get("index"));
    let minValue = Math.min(...featureData);
    let maxValue = Math.max(...featureData);

    let histogram = {};
    let indexPerBin = [];
    let startFeatureRangeValue = [];
    let endFeatureRangeValue = [];
    let defaultBinSize = 0.05;
    let genomicMinSize = 0; //0.0001;

    const numBins = Math.ceil(Math.sqrt(featureData.length));
    let binSize = Math.round((maxValue - minValue) / numBins);
    binSize = Math.max(binSize, defaultBinSize);

    let currentMin = minValue;
    let currentMax = minValue + binSize;

    // always include 0 for genomic data
    let isGenomic = getIndicationOfDataset(featureName) === genomicIcon;
    if (isGenomic) {
        currentMin = 0;
        currentMax = 0;
        startFeatureRangeValue.push(currentMin);
        endFeatureRangeValue.push(currentMax);
        currentMin = genomicMinSize;
        currentMax = binSize;
    }

    // define histogram bin ranges
    for (let i = 0; currentMax < maxValue; i++) {
        if (getIndicationOfDataset(featureName) === clinicalIcon) {
            currentMin = +currentMin.toFixed(2);
            currentMax = +currentMax.toFixed(2);
        } else {
            currentMin = +currentMin.toFixed(4);
            currentMax = +currentMax.toFixed(4);
        }
        startFeatureRangeValue.push(currentMin);
        endFeatureRangeValue.push(currentMax);
        currentMin += binSize;
        currentMax += binSize;
    }

    startFeatureRangeValue[0] = minValue;
    endFeatureRangeValue[endFeatureRangeValue.length - 1] = maxValue + 1;

    if (getIndicationOfDataset(featureName) === clinicalIcon) {
        if (minValue === 0 && maxValue === 1) { //handle binary values
            startFeatureRangeValue = [0, 1];
            endFeatureRangeValue = [0, 1];

        } else if (binSize === defaultBinSize && Number.isInteger(minValue) && Number.isInteger(maxValue)) { //handle integer values
            startFeatureRangeValue = Array.from({ length: maxValue }, (_, i) => i + minValue);
            endFeatureRangeValue = startFeatureRangeValue;
        }
    }

    if (isGenomic && startFeatureRangeValue.length < 2) {
        startFeatureRangeValue = [0, 0];
        endFeatureRangeValue = [0, maxValue + 0.05];
    }

    //create histogram in the defined ranges
    let maxHistValue = -Infinity;
    for (let i = 0; i < startFeatureRangeValue.length; i++) {
        let minX = startFeatureRangeValue[i];
        let maxX = endFeatureRangeValue[i];
        let binValueCounter = 0;
        indexPerBin[i] = [];

        for (let k = 0; k < featureData.length; k++) {
            let element = featureData[k];
            let index = featureIndices[k];
            if (minX === maxX && element === minX) { //min == max (qualitative, binary)
                binValueCounter++;
                indexPerBin[i].push(index);
            } else if (element >= minX && element < maxX) { // general case
                binValueCounter++;
                indexPerBin[i].push(index);
            }
        }
        histogram[i + 1] = binValueCounter;
        if (binValueCounter > maxHistValue) {
            maxHistValue = binValueCounter
        }
    }

    if (minValue === 0 && maxValue === 0) {
        startFeatureRangeValue.push(0);
        endFeatureRangeValue.push(0);
    }

    //remove duplicated genes (so that values of 0 are not counted in second bin too)
    if (isGenomic && Object.keys(histogram).length >= 2) {
        histogram[2] = histogram[2] - histogram[1];
        indexPerBin[1] = indexPerBin[1].filter(x => !indexPerBin[0].includes(x));
    }

    const defaultOptions = {
        'w': 300,
        'h': 150,
        'margin': {
            top: 20,
            bottom: 20,
            left: 30,
            right: 30,
        },
        bucketSize: 1,
        defaultRange: [0, 100],
        format: d3.format('0.3s'),
    };

    const [min, max] = d3.extent(Object.keys(histogram).map(d => +d));
    const range = [min, max + 1]

    // width and height of svg
    const { w, h, margin, defaultRange, bucketSize, format } = { ...defaultOptions, ...defaultOptions };

    // dimensions of slider bar
    const width = w - margin.left - margin.right;
    const height = h - margin.top - margin.bottom;

    const x = d3.scaleLinear()
        .domain(range)
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(Object.values(histogram))])
        .range([0, height]);

    let histoArea;
    let featureID;
    if (addFeatureInput) {
        histoArea = "#distAreaOfSelection";
        featureID = "hypothesisHistoSlider" + hypothesisIdCounter;

        allHypothesisFeatureStartRanges[featureID] = startFeatureRangeValue;
        allHypothesisFeatureEndRanges[featureID] = endFeatureRangeValue;
    }
    allIndicesPerBin[featureID] = indexPerBin;

    let svg = d3.select(histoArea)
        .append("svg")
        .attr("id", featureID);

    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`)

    // histogram values
    let histogramBars = g.append('g').selectAll('rect')
        .data(d3.range(range[0], range[1] + 1))
        .enter()
        .append('rect')
        .attr('x', d => x(d))
        .attr('y', d => height - y(histogram[d] || 0))
        .attr('width', width / (range[1] - range[0]))
        .attr('height', d => y(histogram[d] || 0))
        .style('fill', function () {
            return 'lightgray';
        });

    // background lines
    g.append('g').selectAll('line')
        .data(d3.range(range[0], range[1] + 1))
        .enter()
        .append('line')
        .attr('x1', d => x(d))
        .attr('x2', d => x(d))
        .attr('y1', 0)
        .attr('y2', height)
        .style('stroke', 'white');

    // labels
    let labelMin = g.append('text')
        .attr('id', 'label-min')
        .attr('x', '-1.6em')
        .attr('y', height + 10)
        .attr("fill", "darkgray")
        .text(0);

    let labelMax = g.append('text')
        .attr('id', 'label-max')
        .attr('x', '-1.6em')
        .attr('y', 0)
        .attr("fill", "darkgray")
        .text(maxHistValue);

    let histTitle = g.append("text")
        .attr("x", width / 2)
        .attr("y", -8)
        .attr("class", "title")
        .attr("text-anchor", "middle")
        .text(featureName)
        .attr("font-size", "16px");

    let labelL = g.append('text')
        .attr('id', 'labelleft')
        .attr('x', 0)
        .attr('y', height + margin.top - 5);

    let labelR = g.append('text')
        .attr('id', 'labelright')
        .attr('x', 0)
        .attr('y', height + margin.top - 5);

    let minRange = 0;
    let maxRange = 0;

    let brush = d3.brushX()
        .extent([[0, 0], [width, height]])
        .on('brush', function () {
            let s = d3.event.selection;

            // update and move labels
            minRange = Math.round(x.invert(s[0])) * bucketSize - 1;
            maxRange = (Math.round(x.invert(s[1])) - 1) * bucketSize - 1;

            let rangeArrStart = [];
            let rangeArrEnd = [];
            // colorize scatterplot
            if (featureID.startsWith("hypothesis")) {
                rangeArrStart = allHypothesisFeatureStartRanges[featureID];
                rangeArrEnd = allHypothesisFeatureEndRanges[featureID];

                selectedMinRange = rangeArrStart[minRange];
                selectedMaxRange = rangeArrEnd[maxRange];
            }
            labelL.attr('x', s[0]).text(selectedMinRange === 0 && isGenomic && selectedMaxRange !== 0 &&
                minRange === 1 ? ">" + selectedMinRange : selectedMinRange);
            labelR.attr('x', s[1]).text(selectedMinRange === selectedMaxRange ||
                isSameRangeArray(rangeArrStart, rangeArrEnd) ? selectedMaxRange : "<" + selectedMaxRange);

            // move brush handles
            handle.attr("display", null)
                .attr("transform", (d, i) => "translate(" + [s[i], - height / 4] + ")");

            let selectedFeatureIndices = [];
            let currInd = minRange;
            while (currInd <= maxRange) {
                selectedFeatureIndices.push(allIndicesPerBin[featureID][currInd]);
                currInd++;
            }
            selectedFeatureIndices = selectedFeatureIndices.flat(maxHistValue);
            histogramBars.style('fill', function (d) {
                if (d > minRange && d < maxRange + 2) {
                    return featureID.startsWith("hypothesis") ? "black" : "#4d5e6f";
                }
                return "lightgray";
            }).style('stroke', "black");

            if (featureID.startsWith("hypothesis")) {
                hypothesisFeaturesPerHistoSlider[featureID] = selectedFeatureIndices;
            }

            let resultingHypothesisIndices = getIndicesOfQuery(hypothesisFeaturesPerHistoSlider, hypothesisOperatorsPerHistoSlider);
            highlightResultingIndices(resultingHypothesisIndices);

            // update view while brushing
            svg.node().value = s.map(d => bucketSize * Math.round(x.invert(d)));
            svg.node().dispatchEvent(new CustomEvent("input"));
        })
        .on('end', function () {
            if (!d3.event.sourceEvent || !d3.event.selection) {
                return;
            }
            let d0 = d3.event.selection.map(x.invert);
            let d1 = d0.map(Math.round)
            d3.select(this).transition().call(d3.event.target.move, d1.map(x))
        });

    let gBrush = g.append("g")
        .attr("class", "brush")
        .call(brush);

    /**
     * Source of brush handles: https://bl.ocks.org/Fil/2d43867ba1f36a05459c7113c7f6f98a
     *
     * @param d - the brush data.
     * @returns {string} - the brush path.
     */
    let brushResizePath = function (d) {
        let e = +(d.type === "e"),
            x = e ? 1 : -1,
            y = height / 2;
        return "M" + (0.5 * x) + "," + y + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6) + "V" + (2 * y - 6) +
            "A6,6 0 0 " + e + " " + (0.5 * x) + "," + (2 * y) + "Z" + "M" + (2.5 * x) + "," + (y + 8) + "V" + (2 * y - 8) +
            "M" + (4.5 * x) + "," + (y + 8) + "V" + (2 * y - 8);
    }

    let handle = gBrush.selectAll(".handle--custom")
        .data([{ type: "w" }, { type: "e" }])
        .enter().append("path")
        .attr("class", "handle--custom")
        .attr("stroke", "#888")
        .attr("fill", '#eee')
        .attr("cursor", "ew-resize")
        .attr("d", brushResizePath);

    // Override the default behaviour: clicking outside the selected area should not deselect everything.
    // See: https://bl.ocks.org/mbostock/6498000
    gBrush.selectAll(".overlay")
        .each(function (d) { d.type = "selection"; })
        .on("mousedown touchstart", brushcentered);

    /**
     * Re-center the brush through using a fixed width.
     */
    function brushcentered() {
        let dx = x(1) - x(0),
            cx = d3.mouse(this)[0],
            x0 = cx - dx / 2,
            x1 = cx + dx / 2;
        d3.select(this.parentNode).call(brush.move, x1 > width ? [width - dx, width] : x0 < 0 ? [0, dx] : [x0, x1]);
    }
    // default brush range
    gBrush.call(brush.move, defaultRange
        .map(d => width * (d / 100))
        .map(x.invert)
        .map(Math.round)
        .map(x));
}

/**
 * Get indices of the resulting set of a hypothesis query.
 *
 * @param featuresPerHistoSlider - indices of the histogram sliders per feature slider.
 * @param operatorsPerHistoSlider - indices of the operator dropdowns per operator.
 * @returns {*[]} - indices of the resulting set.
 */
function getIndicesOfQuery(featuresPerHistoSlider, operatorsPerHistoSlider) {
    let featureIndices = Object.values(featuresPerHistoSlider);
    if (featureIndices.length < 1) {
        return [];
    }
    if (featureIndices.length === 1) {
        return featureIndices[0];
    }
    let resultingSet = [];
    let allOperators = Object.values(operatorsPerHistoSlider);
    for (let i = 0; i < featureIndices.length - 1; i++) {
        let firstSet = resultingSet.length < 1 ? featureIndices[i] : resultingSet;
        let secondSet = featureIndices[i + 1];
        let operator = allOperators[i];

        if (operator === "and") {
            resultingSet = removeDuplicates(firstSet.filter(value => secondSet.includes(value)));
        } else {
            resultingSet = removeDuplicates(firstSet.concat(secondSet));
        }
    }
    return resultingSet;
}

/**
 * Remove duplicated indices from the resulting hypothesis query.
 *
 * @param indicesArray - the indices array to filter.
 * @returns {*} - the filtered indices array.
 */
function removeDuplicates(indicesArray) {
    return indicesArray.filter((item, index) => indicesArray.indexOf(item) === index);
}

/**
 * Check the min and max ranges array of indices.
 *
 * @param minRange - the array that holds the min ranges.
 * @param maxRange - the array that holds the max ranges.
 * @returns {boolean} - true if both range arrays are the same.
 */
function isSameRangeArray(minRange, maxRange) {
    for (let i = 0; i < minRange.length; i++) {
        if (minRange[i] !== maxRange[i]) {
            return false;
        }
    }
    return true;
}