let selectedFeatureList = [];

let allRadiomicList = [];
let allGenomicList = [];
let allClinicalList = [];

let wholeGenomicData = "Genomic";
let wholeRadiomicData = "Radiomic";
let wholeClinicalData = "Clinical";

let hypothesisIdCounter = 1;

let addFeatureInput = false;
let hypothesisFilter = false;

const purpose = {
    VALUES: "values",
    PROCESSING: "processing",
    PROCESSING_EXCLUDE: "exclude",
    HYPOTHESIS: "hypothesis",
};

/**
 * Set up a feature selection list to assess a hypothesis or define feature subsets to stratify.
 */
function setupFeatureSelectionList() {
    let featureList = [wholeGenomicData, wholeRadiomicData, wholeClinicalData];
    let featureExcludeList = [wholeGenomicData, wholeRadiomicData, wholeClinicalData];
    let highlightList = [];
    let valuesList = [];

    for (const [key, _] of featureMap.entries()) {
        if (key !== "index" && key !== "id") {
            featureList.push(key);
            featureExcludeList.push(key);

            let datasetType = getIndicationOfDataset(key);

            if (datasetType === radiomicIcon) {
                allRadiomicList.push(key);
            } else if (datasetType === genomicIcon) {
                allGenomicList.push(key);
            } else if (datasetType === clinicalIcon) {
                allClinicalList.push(key);
            }
        }
        if (key !== "index" && key !== "id") {
            highlightList.push(key);
            if (key !== "id" && !defaultDataToShow.includes(key)) {
                valuesList.push(key);
            }
        }
    }
    autocomplete(document.getElementById("input"), purpose.PROCESSING, featureList);
    autocomplete(document.getElementById("inputToExclude"), purpose.PROCESSING_EXCLUDE, featureExcludeList);
    autocomplete(document.getElementById("highlightPre"), purpose.HYPOTHESIS, highlightList);
    autocomplete(document.getElementById("patientValuesField"), purpose.VALUES, valuesList);
}

/**
 * Create a textfield with autocomplete functionality.
 *
 * @param input - the textfield to use for feature input.
 * @param purp - defines the purpose of the functionality.
 *               the textfield can be used to select `VALUES`
 *               or to highlight and assess `HYPOTHESIS` features
 *               or to apply the `PROCESSING` on a feature subset
 * @param featureList the list of features to use for the autocomplete selection field.
 */
function autocomplete(input, purp, featureList) {
    let currentFocus;

    // while writing in the text field:
    input.addEventListener("input", function () {
        let autoDiv, elemDiv, i, val = this.value;
        closeAllLists();
        if (!val) {
            return false;
        }

        currentFocus = -1;

        autoDiv = document.createElement('div');
        autoDiv.setAttribute("id", this.id + "autocomplete-list");
        autoDiv.setAttribute("class", "autocomplete-items");

        this.parentNode.appendChild(autoDiv);

        for (i = 0; i < featureList.length; i++) {

            if (featureList[i].toUpperCase().includes(val.toUpperCase())) {
                elemDiv = document.createElement('div');

                // matching letters in bold
                elemDiv.innerHTML = "<strong>" + featureList[i].substr(0, val.length) + "</strong>";
                elemDiv.innerHTML += featureList[i].substr(val.length);

                // input field with the current array item value
                elemDiv.innerHTML += "<input type='hidden' value='" + featureList[i] + "'>";

                // click on item value
                elemDiv.addEventListener("click", function () {
                    input.value = this.getElementsByTagName("input")[0].value;

                    if (purp === purpose.HYPOTHESIS) {
                        if ((addFeatureInput && Object.keys(hypothesisFeaturesPerHistoSlider).length > 0)) {
                            addLinkOperator();
                        }
                        if (addFeatureInput) {
                            histogramSlider(input.value);
                        } else {
                            highlightSelection(input.value);
                        }
                    } else if (purp === purpose.VALUES) {
                        showPatientScoresOfSelection(input.value);
                        featureList = removeFromSuggestion(featureList, input.value);

                    } else if (purp === purpose.PROCESSING) {

                        // add feature to list
                        if (!selectedFeatureList.includes(input.value)) {
                            selectedFeatureList.push(input.value);

                            // remove input from suggestions
                            featureList = removeFromSuggestion(featureList, input.value);

                            if (input.value === wholeRadiomicData) {
                                allRadiomicList.forEach(feature => {
                                    if (!selectedFeatureList.includes(feature)) {
                                        selectedFeatureList.push(feature);
                                    }
                                    featureList = featureList.filter(function (elem) {
                                        return elem !== feature;
                                    });
                                });
                            } else if (input.value === wholeGenomicData) {
                                allGenomicList.forEach(feature => {
                                    if (!selectedFeatureList.includes(feature)) {
                                        selectedFeatureList.push(feature);
                                    }
                                    featureList = featureList.filter(function (elem) {
                                        return elem !== feature;
                                    });
                                });
                            } else if (input.value === wholeClinicalData) {
                                allClinicalList.forEach(feature => {
                                    if (!selectedFeatureList.includes(feature)) {
                                        selectedFeatureList.push(feature);
                                    }
                                    featureList = featureList.filter(function (elem) {
                                        return elem !== feature;
                                    });

                                });
                            }
                        }

                        let parentDiv = document.getElementById("currentlySelectedFeaturesArea");
                        let textContent = parentDiv.textContent;
                        let content = document.createTextNode(input.value);
                        if (textContent.length > 0) {
                            content = document.createTextNode(", " + input.value);
                        }
                        parentDiv.appendChild(content);

                    } else if (purp === purpose.PROCESSING_EXCLUDE) {
                        // remove feature from list
                        if (selectedFeatureList.includes(input.value)) {

                            // remove input from active feature selection
                            selectedFeatureList = removeFromArraySelection(selectedFeatureList, input.value);

                            // remove input from suggestions
                            featureList = removeFromSuggestion(featureList, input.value);

                            if (input.value === wholeRadiomicData) {
                                allRadiomicList.forEach(feature => {
                                    if (selectedFeatureList.includes(feature)) {
                                        selectedFeatureList = removeFromArraySelection(selectedFeatureList, feature);
                                    }
                                    featureList = featureList.filter(function (elem) {
                                        return elem !== feature;
                                    });
                                });
                            } else if (input.value === wholeGenomicData) {
                                allGenomicList.forEach(feature => {
                                    if (selectedFeatureList.includes(feature)) {
                                        selectedFeatureList = removeFromArraySelection(selectedFeatureList, feature);
                                    }
                                    featureList = featureList.filter(function (elem) {
                                        return elem !== feature;
                                    });
                                });
                            } else if (input.value === wholeClinicalData) {
                                allClinicalList.forEach(feature => {
                                    if (selectedFeatureList.includes(feature)) {
                                        selectedFeatureList = removeFromArraySelection(selectedFeatureList, feature);
                                    }
                                    featureList = featureList.filter(function (elem) {
                                        return elem !== feature;
                                    });

                                });
                            }
                        }

                        let parentDiv = document.getElementById("currentlyExcludedFeaturesArea");
                        let textContent = parentDiv.textContent;
                        let content = document.createTextNode(input.value);
                        if (textContent.length > 0) {
                            content = document.createTextNode(", " + input.value);
                        }
                        parentDiv.appendChild(content);

                    }

                    // remove input from text field
                    input.value = "";
                    closeAllLists();
                });
                autoDiv.appendChild(elemDiv);
            }
        }

    });

    // key input listener
    input.addEventListener("keydown", function (e) {
        let x = document.getElementById(this.id + "autocomplete-list");
        if (x) {
            x = x.getElementsByTagName('div');
        }
        if (e.keyCode === 40) { // arrow down key
            currentFocus++;
            addActive(x);

        } else if (e.keyCode === 38) { // arrow up key
            currentFocus--;
            addActive(x);

        } else if (e.keyCode === 13) { // enter key prevents form from being submitted
            e.preventDefault();
            if (currentFocus > -1) {
                if (x) {
                    x[currentFocus].click();
                }
            }
        }
    });

    /**
     * Remove a value from the feature list.
     *
     * @param selectedFeatureList - the selected feature list to remove the value from.
     * @param value - the value to remove.
     * @returns {*} - the feature list without the specified value.
     */
    function removeFromArraySelection(selectedFeatureList, value) {
        return selectedFeatureList.filter(function (e) {
            return e !== value;
        })
    }

    /**
     * Remove a value from the feature suggestion list.
     *
     * @param featureList - the list of feature suggestions.
     * @param value - the value to remove.
     * @returns {*} - the feature suggestion list without the specified value.
     */
    function removeFromSuggestion(featureList, value) {
        return featureList.filter(function (elem) {
            return elem !== value;
        });
    }

    /**
     * Mark the selected item as active.
     *
     * @param x - the item to mark.
     * @returns {boolean} - `true`, if the item could be marked as active, `false` otherwise.
     */
    function addActive(x) {
        if (!x) {
            return false;
        }
        removeActive(x);
        if (currentFocus >= x.length) {
            currentFocus = 0;
        }
        if (currentFocus < 0) {
            currentFocus = (x.length - 1);
        }

        // add `active` class to autocomplete items
        x[currentFocus].classList.add("autocomplete-active");
        return true;
    }

    // remove `active` class from autocomplete items
    function removeActive(x) {
        for (let i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }

    // close all autocomplete lists except the current `element`
    function closeAllLists(element) {
        let x = document.getElementsByClassName("autocomplete-items");
        for (let i = 0; i < x.length; i++) {
            if (element !== x[i] && element !== input) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }

    // after a click in the document:
    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
}

/**
 * Send the resulting feature subset to the backend for cohort stratification.
 */
function processSelectedFeaturesButtonClicked() {
    // send features to backend
    sendOptionsPostRequest("features " + selectedFeatureList);

    // reset values
    document.getElementById("currentlySelectedFeaturesArea").innerHTML = "";
    document.getElementById("currentlyExcludedFeaturesArea").innerHTML = "";
    selectedFeatureList = [];
    setupFeatureSelectionList();
}

/**
 * Highlight the patient values of the selected feature on the scatterplot.
 *
 * @param featureName - the feature name selected from the feature suggestion list.
 */
function highlightSelection(featureName) {
    let singleFeatureData = Array.from(featureMap.get(featureName));
    activeFilter = true;

    let normalizedData = normalizeFeatureArray(singleFeatureData, featureName);
    for (let i = 0; i < singleFeatureData.length; i++) {
        data[i].normValue = normalizedData[i];
        data[i].realValue = singleFeatureData[i];
        if (singleFeatureData[i] === 0) {
            data[i].highlight = 0;
        } else {
            data[i].highlight = 1;
        }
    }
    data["featureName"] = featureName;
    hypothesisFilter = false;
    updateScatterplot();
    activeFilter = false;

}
/**
 *  Mark the patients that fulfill the hypothesis for highlighting them on the scatterplot.
 *
 * @param hypothesisIndices - the indices of patients that fulfill the hypothesis.
 */
function highlightResultingIndices(hypothesisIndices) {
    let indexNumber = Array.from(featureMap.get("index"));
    activeFilter = true;
    selectedIndices = [];
    for (let i = 0; i < indexNumber.length; i++) {
        if (hypothesisIndices.includes(indexNumber[i])) {
            data[i].highlight = 1;
            selectedIndices.push(indexNumber[i]);
        } else {
            data[i].highlight = 0;
        }
    }
    hypothesisFilter = true;
    updateScatterplot();
    activeFilter = false;
}

/**
 * Reset all indices colors when clearing the hypothesis.
 */
function resetAllIndicesColor() {
    let indexNumber = Array.from(featureMap.get("index"));
    for (let i = 0; i < indexNumber.length; i++) {
        data[i].highlight = "empty";
        data[i].stroke = "empty";
    }
    updateScatterplot();
}
/**
 * Normalize the feature values of all patients between -1 and 1.
 *
 * @param singleFeatureData - the feature array with patient values to normalize.
 * @param featureName - the name of the feature to normalize its patient values.
 * @returns {*[]} normalized - the normalized values array between -1 and 1.
 */
function normalizeFeatureArray(singleFeatureData, featureName) {
    if (featureName.startsWith("final")) {
        let output = [];
        singleFeatureData.forEach(element => {
            if (element.startsWith("pre")) {
                output.push(-1);
            } else if (element.startsWith("rapid")) {
                output.push(1);
            }
        });
        return output;
    }
    let minVal = Math.min(...singleFeatureData);
    let maxVal = Math.max(...singleFeatureData);
    return singleFeatureData.map(function (x) {
        return x === 0 ? 0 : 2 * ((x - minVal) / (maxVal - minVal)) - 1;
    });
}

/**
 * Called, when the operator for linking hypothesis features is changed through the interface dropdowns.
 *
 * @param elemID - the ID of the link dropdown that was changed.
 */
function linkOperatorDropdownChanged(elemID) {
    if (elemID.startsWith("hypothesis")) {
        let operatorElem = document.getElementById(elemID);
        hypothesisOperatorsPerHistoSlider[elemID] = operatorElem.options[operatorElem.selectedIndex].value;
    }
    let resultingHypothesisIndices = getIndicesOfQuery(hypothesisFeaturesPerHistoSlider, hypothesisOperatorsPerHistoSlider);
    highlightResultingIndices(resultingHypothesisIndices);
}

/**
 * Add a new link operator between each two hypothesis features.
 */
function addLinkOperator() {
    let originalOperator = document.getElementById('linkOperatorDropdown');
    let clonedOperator = originalOperator.cloneNode(true);
    clonedOperator.removeAttribute("id");
    let defaultValue = "and";
    if (addFeatureInput) {
        let featureID = "hypothesisOperator" + hypothesisIdCounter;
        clonedOperator.setAttribute("id", featureID);
        hypothesisOperatorsPerHistoSlider[featureID] = defaultValue;
        hypothesisIdCounter++;
    }
    clonedOperator.style.display = "initial";

    let histoAreaID = "distAreaOfSelection";
    document.getElementById(histoAreaID).append(clonedOperator);
}

/**
 * Called, when the hypothesis radio button for highlighting/adding features is changed.
 */
function hypothesisRadioButtonClicked() {
    console.log("hypothesis radio button");

    let checkBox = document.getElementById("addRadio");
    if (checkBox.checked) {
        console.log("`add` radio button is checked");
        addFeatureInput = true;
    } else {
        console.log("`highlight` radio button is checked");
        addFeatureInput = false;
    }

}

/**
 * Remove operators and histogram sliders from the view and reset arrays.
 * */
function clearHypothesisButtonClicked() {
    console.log("clear hypothesis button is clicked");

    resetAllIndicesColor();
    removeAllElements(hypothesisFeaturesPerHistoSlider);
    removeAllElements(hypothesisOperatorsPerHistoSlider);
    resetHypothesisRanges();

}

/**
 * Remove the histogram slider, when clearing the hypothesis input.
 *
 * @param sliderID -- the ID of the histogram slider to remove.
 */
function removeAllElements(sliderID) {
    let idArray = Object.keys(sliderID);
    idArray.forEach(id => {
        d3.select("#" + id).remove();
    });
    sliderID = {};
}

/**
 * Reset all ranges when clearing the hypothesis.
 */
function resetHypothesisRanges() {
    hypothesisFeaturesPerHistoSlider = {};
    hypothesisOperatorsPerHistoSlider = {};

    allHypothesisFeatureStartRanges = {};
    allHypothesisFeatureEndRanges = {};
}
