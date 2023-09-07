from waitress import serve
import source.ManageData as md
from source.Options import Opt

from flask import Flask, render_template, jsonify, request
from flask_cors import CORS

import numpy as np

from source.InterfaceOptions import DimReduction
from source.InterfaceOptions import Imputation
from source.InterfaceOptions import OutlierRemoval
from source.InterfaceOptions import Clustering
from source.InterfaceOptions import Scaling

app = Flask(__name__)
app.config["CACHE_TYPE"] = "null"
CORS(app)

data_manager = md.ManageData()
original_data = data_manager.get_original_clinical_data()
reduced_data = data_manager.get_reduced_data()
clustered_data = data_manager.get_clustered_data()
shap_values = data_manager.get_shap_data()
inter_lda_values = data_manager.get_lda_data()
inter_sgd_values = data_manager.get_sgd_data()

dim_red_values = [member.value for member in DimReduction]
imp_values = [member.value for member in Imputation]
outlier_values = [member.value for member in OutlierRemoval]
clustering_values = [member.value for member in Clustering]
scaling_values = [member.value for member in Scaling]

# data used for table and hovering
merged_imputed_data = data_manager.get_merged_imputed_data_for_hovering_and_table()


@app.route('/')
def index():
    """
    Define the index page of the application.

        :return: the rendered index page.
    """
    return render_template('index.html')


@app.route('/opt', methods=['GET', 'POST'])
def opt():
    """
    Get options of ui elements in the frontend.

        :return: the list of options currently selected in the frontend.
    """
    request.form.getlist('dimRedDropdown')
    return render_template('index.html')


@app.route('/get_scatterplot_data', methods=['GET', 'POST'])
def get_scatterplot_data():
    """
    GET the data needed for the visual representation as a json object of a 2D array.
    The first dimension represents the imputation methods. The second dimension
    represents the dimensionality reduction methods. Both are selected through
    the interface.
    POST the selected frontend options to the backend to process the data with
    the selected analysis options.

        :return: the data of the scatterplot as a json object.
    """
    if request.method == 'POST':
        data = request.get_json()

        if data.startswith("resetIndices"):
            data_manager.indices = []

        if data.startswith("resetClusters"):
            data_manager.clusters = []

        if data.startswith("indices"):
            if Opt.decimal_comma.value in data:
                string_arr = data[len("indices") +
                                  1:].split(Opt.decimal_comma.value)
                data_manager.indices = [int(elem) for elem in string_arr]

        if data.startswith("clusters"):
            if Opt.decimal_comma.value in data:
                string_arr = data[len("indices") +
                                  1:].split(Opt.decimal_comma.value)
                data_manager.clusters = [int(elem) for elem in string_arr]

        if data.startswith("features"):
            feature_list = data[len("features") +
                                1:].split(Opt.decimal_comma.value)
            data_manager.features = feature_list
        if data.startswith("clinical"):
            print("CLINICAL data received !")

        elif Opt.separator.value in data:  # more than one value is send
            data_input = data.split(Opt.separator.value)
            data_manager.dim_reduction = DimReduction[process(data_input[0])]
            data_manager.imputation = Imputation[data_input[1]]
            data_manager.clustering = Clustering[process(data_input[2])]
            data_manager.out_removal = OutlierRemoval[data_input[3]]
            data_manager.scaling = Scaling[data_input[4]]

        else:
            if data in dim_red_values:
                print("new dimred value: ", data)
                data_manager.dim_reduction = DimReduction[process(data)]

            if data in imp_values:
                print("new imp value: ", data)
                data_manager.imputation = Imputation[data]

            if data in outlier_values:
                print("new outlier value: ", data)
                data_manager.out_removal = OutlierRemoval[data]

            if data in clustering_values:
                print("new clustering value: ", data)
                data_manager.clustering = Clustering[process(data)]

            if data in scaling_values:
                print("new scaling value: ", data)
                data_manager.scaling = Scaling[data]

        data_manager.get_data_of_selected_options()
        return jsonify(data)

    elif request.method == 'GET':
        res = [create_scatterplot_data(data_manager.get_reduced_data()),
               create_shap_data(data_manager.get_shap_data()),
               create_clustering_data(data_manager.get_clustered_data()),
               create_interclass_data(data_manager.get_lda_data()),
               create_interclass_data(data_manager.get_sgd_data())
               ]

        return jsonify(str(res))


def process(data_input):
    """
    Remove dash symbol of data.

        :param data_input: the input to process.
        :return: the string without dash symbols.
    """
    return data_input.replace(Opt.dash_symbol.value, '')


@app.route('/get_data_tag')
def get_data_tag():
    """
    Get a tag per datasets to differentiate between them.

        :return: the data features grouped by the dataset name as json object.
    """
    return jsonify(str(data_manager.get_dataset_tag()))


@app.route('/get_shap_data')
def get_shap_data():
    """
    Get the shap data of the clusters.

        :return: the shap data of the clusters as json object.
    """
    return jsonify(str(create_shap_data(shap_values)))


def create_shap_data(shap_scores):
    """
    Transform the shap data into a list of elements to visualize the clusters.

        :param shap_scores: the shap data to transform.
        :return: the transformed data as a list of {feature, cluster 1 ... cluster n} elements.
    """
    shap_list_all_clusters = []
    for col in range(shap_scores.shape[1]):

        cluster_res_list = []
        for row in range(shap_scores.shape[0]):
            data_instance = {'feature': shap_scores.index[row],
                             'value': shap_scores.iloc[row, col],
                             'cluster': shap_scores.columns[col]
                             }
            cluster_res_list.append(data_instance)

        shap_list_all_clusters.append(cluster_res_list)

    return shap_list_all_clusters


@app.route('/get_interclass_data')
def get_interclass_data():
    """
    Get the pairwise interclass data of the clusters.

        :return: the interclass data of the clusters as json object.
    """
    lda_res = create_interclass_data(inter_lda_values)
    sgd_res = create_interclass_data(inter_sgd_values)

    return jsonify(str([lda_res, sgd_res]))


def create_interclass_data(values):
    """
    Get the pairwise interclass data of the clusters.

        :return: the transformed data as a list of elements.
    """
    res = []
    for col in range(values.shape[1]):
        col_res = []
        cluster = values.columns[col]

        for row in range(values.shape[0]):
            data_instance = {'feature': values.index[row],
                             'value': values.iloc[row, col],
                             'cluster': str(cluster[0]) + " " + str(cluster[1])
                             }
            col_res.append(data_instance)
        res.append(col_res)

    return res


@app.route('/get_clustered_data')
def get_clustered_data():
    """
    Get the labels of the clusters.

        :return: the cluster labels as a json object.
    """
    return jsonify(str(create_clustering_data(clustered_data)))


@app.route('/get_scatterplot_hover_data')
def get_scatterplot_hover_data():
    """Get the data needed for hovering over points in the scatterplot.

    :return: the data of the scatterplot as a json object that contains
    clinical data.
    """
    res = []

    scatterplot_hover_data = create_scatterplot_hover_data(merged_imputed_data)
    scatterplot_table_data = create_scatterplot_table_data(merged_imputed_data)

    res.append(scatterplot_hover_data)
    res.append(scatterplot_table_data[0])

    return jsonify(str(res))


def create_scatterplot_data(data):
    """
    Transform the data into a list of tuples to visualize in a scatterplot.

        :param data: the dataframe to transform.
        :return: the transformed data as a list of {x, y} tuples.
    """
    result = []
    for row in range(len(data)):
        data_instance = {'x': data.iloc[row, 0], 'y': data.iloc[row, 1]}
        result.append(data_instance)
    return result


def create_clustering_data(clusters):
    """
    Transform the label data into a list of elements to visualize the clusters.

        :param clusters: the label data to transform.
        :return: the transformed data as a list of {label} elements.
    """
    result = []
    for label in clusters:
        data_instance = {'label': label}
        result.append(data_instance)
    return result


def create_scatterplot_hover_data(data):
    """
    Transform the hover data into a list of tuples to visualize it in a scatterplot.
    To display the feature units (e.g. kg, m) correctly, the first columns have to be in this order:
    ID, Age, Weight (kg), BMI, Size (m)

        :param data: the dataframe to transform.
        :return: the transformed data as a list of tuples.
    """
    result = []
    for row in range(len(data)):
        data_instance = {}
        i = 0
        data_instance['id'] = data.iloc[row, i]
        i += 1
        data_instance['age'] = data.iloc[row, i]
        i += 1
        data_instance['weight'] = data.iloc[row, i]
        i += 1
        data_instance['bmi'] = data.iloc[row, i]
        i += 1
        data_instance['size'] = data.iloc[row, i]
        result.append(data_instance)
    return result


def create_scatterplot_table_data(data):
    """
    Transform the data into a list of tuples to visualize in a table.

        :param data: the dataframe to transform.
        :return: the transformed data as a list of tuples.
    """
    result = []
    for row in range(len(data)):
        data_instance = {'index': row}

        i = 0
        for column in data:
            data_instance[column] = data.iloc[row, i]
            i += 1

        result.append(data_instance)

    return [result]


def calculate_percentage(value, total):
    """
    Calculate the percentage of a value towards the total value.

        :param value: the value.
        :param total: the total value.
        :return: the percentage of the value towards the total value.
    """
    return np.round((np.divide(value, total) * 100), 2)


def data_creation(data, percent, class_labels, group=None):
    """
    Append the data needed for a visualization.

        :param data: the data of the visualization as a list.
        :param percent: the percentage of the data towards the total value.
        :param class_labels: the labels of the data to use for the visualization.
        :param group: None.
    """
    for data_index, item in enumerate(percent):
        data_instance = {
            'category': class_labels[data_index], 'value': item, 'group': group}
        data.append(data_instance)


@app.after_request
def add_header(response):
    """
    Set the response header.

        :param response: the response header to set.
        :return: the response with the header set.
    """
    response.headers['X-UA-Compatible'] = 'IE=Edge,chrome=1'
    response.headers['Cache-Control'] = 'public, max-age=0'
    return response


if __name__ == "__main__":
    """
        The starting point of the application.
    """

    if Opt.server_deployment.value:
        serve(app, host='0.0.0.0', port=5000, url_scheme='https')
    else:
        app.run(debug=False)
