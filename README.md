# VACI: Visual Analytics for Cohort Information

We present a visual analytics framework for the integrated exploration and analysis of cancer cohort
radiogenomics and clinical information. Our framework supports the workflow of cancer experts and biomedical
data scientists in investigating cancer mechanisms. This repository serves as the practical implementation of
the paper **Visual Analytics for the Integrated Exploration and Sensemaking of Cancer Cohort Radiogenomics and
Clinical Information** which was accepted for publication at the Eurographics Workshop on Visual Computing for
Biology and Medicine (EG VCBM 2023).

**Authors:** Sarah El-Sherbiny<sup>1</sup>, Jing Ning<sup>2,3</sup>, Brigitte Hantusch<sup>2</sup>, Lukas Kenner<sup>2,3,4,5,6</sup>, and Renata Georgia Raidou<sup>1</sup>

<sup>1</sup>TU Wien, Austria,
<sup>2</sup>Department of Pathology, Medical University of Vienna, Austria,
<sup>3</sup>Christian Doppler Laboratory for Applied Metabolomics, Austria,
<sup>4</sup>Comprehensive Cancer Center, Medical University of Vienna, Austria,
<sup>5</sup>Unit of Laboratory Animal Pathology, University of Veterinary Medicine Vienna, Austria,
<sup>6</sup>Center for Biomarker Research in Medicine, Austria

## Demo Video

https://github.com/saraheee/VACI/assets/24226023/a33808da-ac47-453a-90de-2623997761c2

## Framework

**Interface views** of our visual radiogenomics analysis dashboard:

- **(A) Scatterplot view:** stratifiied data, where each point represents one patient
- **(B) Tab views:** detailed data exploration (see figure below)
- **(C) Heatmap view:** features that characterize and differentiate clusters
- **(D) Tooltip view:** patient distributions of a selected feature
- **(E) Advanced analysis:** options are displayed on demand

![framework-overview](https://github.com/saraheee/VACI/assets/24226023/3ca5a117-b867-4076-923d-fc8a88df8446)

**Tab views of our framework** (detail view of B):

- **Values**: first few feature values of the clinical data
- **Clusters:** most predictive features of the scatterplot clusters
- **Top genes:** ranked list of genes of an active patient selection
- **Processing:** include/exclude data subsets or features for the analysis
- **Hypothesis:** visual assessment and refinement of hypotheses

![framework-tabs](https://github.com/saraheee/VACI/assets/24226023/cf753f3c-f1b5-4274-b9b4-fe3dc4a78783)

## Tasks

**Main tasks** of our analytical workflow:

- **(T0) Preprocessing:** enhance the data quality and facilitate the automated analysis and visualization
- **(T1) Cohort stratification:** identify and visualize patterns in the high-dimensional and complex data
- **(T2) Forward analysis:** freely explore the data for knowledge discovery
- **(T3) Backward analysis:** assess and refine hypotheses on the underlying data

![task-workflow](https://github.com/saraheee/VACI/assets/24226023/896bc2f4-caa9-403d-935d-f6b7fe008ee0)

## Disclaimer

The `data` folder contains a generated toy data set as the prostate cancer data we used in this work is not publicly
available. This demonstrates the data set structure that is parsed by our implementation. We changed the default
parameters for this toy data set to `UMAP` as the dimensionality reduction method and `LDA` for identifying the pairwise
cluster differences. For different data sets other parameters might be more suitable. The path to new data can be
specified in the `source/Options.py` file. The framework currently accepts three files as an input (e.g. for radiomics,
genomics, and clinical data) with a unified `id` as a feature column that is used for merging the data tables.

## Available online

We hosted the framework with the generated toy data set under the following link:\
https://kontor.cg.tuwien.ac.at/VACI

## Getting started

Execute `run.sh` or `run.bat`. These perform the following operations.

1. Upgrade pip by `python -m pip install --upgrade pip`
2. Install package for virtual environment:
   - Linux: install `python3-venv` package by `sudo apt install python3-venv`
   - Windows: install `virtualenv` package by `pip install virtualenv`
3. Create a virtual environment
   - Linux: for environment named `env` use `python -m venv env`
   - Windows: for environment named `winenv` use `virtualenv winenv`
4. Activate the virtual environment
   - Linux: `source env/bin/activate`
   - Windows: `./winenv/Scripts/activate`
5. Install requirements by `pip install -r requirements.txt`
6. Run the application
   - Default: `flask run` (runs on http://127.0.0.1:5000/)
   - `flask run --host=127.0.0.1 --port=5051` to specify host and port

We tested our application on the Chrome and Firefox browsers on Windows 11 and Ubuntu-20.04 (WSL).
