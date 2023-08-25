import source.processing.DataFrameOps as dfo

from source.Options import Opt
import numpy as np
import pandas as pd

import sys

from sklearn.linear_model import LinearRegression
from sklearn.impute import SimpleImputer
from sklearn.impute import KNNImputer

from fancyimpute import IterativeImputer
from impyute.imputation.cs import fast_knn
from impyute.imputation.cs import mice
sys.setrecursionlimit(100000)


def univariate_mean(data, column):
    """
    Apply univariate imputation by the `mean` on the specified feature of the dataframe.

        :param data: the dataframe to impute its features.
        :param column: the feature name of the dataframe to impute.
        :return: the dataframe with the imputed feature.
    """
    imp = SimpleImputer(missing_values=np.nan, strategy="mean")
    data[column] = imp.fit_transform(data[column].to_numpy().reshape(-1, 1))
    return data


def univariate_median(data, column):
    """
    Apply univariate imputation by the `median` on the specified feature of the dataframe.

        :param data: the dataframe to impute its features.
        :param column: the feature name of the dataframe to impute.
        :return: the dataframe with the imputed feature.
    """
    imp = SimpleImputer(missing_values=np.nan, strategy="median")
    data[column] = imp.fit_transform(data[column].to_numpy().reshape(-1, 1))
    return data


def univariate_most_frequent(data, column):
    """
    Apply univariate imputation by the `most frequent` entry on the specified feature of the dataframe.

        :param data: the dataframe to impute its features.
        :param column: the feature name of the dataframe to impute.
        :return: the dataframe with the imputed feature.
    """
    imp = SimpleImputer(missing_values=np.nan, strategy="most_frequent")
    data[column] = imp.fit_transform(data[column].to_numpy().reshape(-1, 1))
    return data


def linear_regression(data, column):
    """
    Apply linear regression imputation on the specified feature of the dataframe.

        :param data: the dataframe to impute its features.
        :param column: the feature name of the dataframe to impute.
        :return: the dataframe with the imputed feature.
    """
    lr = LinearRegression()
    iter_number = 10
    imp = IterativeImputer(estimator=lr, missing_values=np.nan, max_iter=iter_number,
                           verbose=2, imputation_order='roman', random_state=0)
    data[column] = imp.fit_transform(data[column].to_numpy().reshape(-1, 1))
    return data


def mice_imp(data, column):
    """
    Apply Multiple Imputation by Chained Equations (MICE) imputation on the specified
    feature of the dataframe. Consider all features of the same type as the feature to impute
    for the imputation.

        :param data: the dataframe to impute its features.
        :param column: the feature name of the dataframe to impute.
        :return: the dataframe with the imputed feature.
    """
    mask = dfo.get_all_features_of_same_type_as_column(data, column)
    res = mice(data[mask.columns].values)

    data[column] = res
    return data


def mice_numeric_features(data, column):
    """
    Apply Multiple Imputation by Chained Equations (MICE) imputation on the specified
    feature of the dataframe. Consider all numeric features in the dataframe for the imputation.

        :param data: the dataframe to impute its features.
        :param column: the feature name of the dataframe to impute.
        :return: the dataframe with the imputed feature.
    """
    mask = dfo.get_all_numeric_features(data)
    res = mice(data[mask.columns].values)

    data[column] = res
    return data


def mice_impute_all_values(data, col_names):
    """
    Impute all features of a dataframe through MICE.

        :param data: the data with missingness to impute its values.
        :param col_names: the columns that contain missing values.
        :return: the imputed data without missingness
    """
    result = data.copy()
    processed_data = drop_columns(data.copy())

    mice_impute = IterativeImputer()
    imputed_data = pd.DataFrame(data=mice_impute.fit_transform(processed_data.select_dtypes(include=np.number)),
                                index=None, columns=processed_data.select_dtypes(include=np.number).columns.tolist())
    for col in col_names:
        if col in imputed_data:
            res = round_imputed_type(data, col, imputed_data[col])
            result[col] = res

    return result


def knn_impute_all_values(data, col_names):
    """
    Impute all features of a dataframe through KNN.

        :param data: the data with missingness to impute its values.
        :param col_names: the columns that contain missing values.
        :return: the imputed data without missingness
    """
    result = data.copy()

    neighbors = 5
    processed_data = drop_columns(data.copy())
    imputer = KNNImputer(n_neighbors=neighbors)
    imputed_data = pd.DataFrame(data=imputer.fit_transform(processed_data),
                                index=None, columns=processed_data.columns)
    for col in col_names:
        if col in imputed_data:
            res = round_imputed_type(data, col, imputed_data[col])
            result[col] = res

    return result


def knn_one_feature(data, column):
    """
    Apply K-Nearest Neighbors (KNN) imputation on the specified feature of the dataframe.
    Consider only the specified feature for the imputation.

        :param data: the dataframe to impute its features.
        :param column: the feature name of the dataframe to impute.
        :return: the dataframe with the imputed feature.
    """
    neighbors = 5

    knn = KNNImputer(n_neighbors=neighbors, add_indicator=False)
    knn.fit(data[column].to_numpy().reshape(-1, 1))
    res = knn.transform(data[column].to_numpy().reshape(-1, 1))

    data[column] = res
    return data


def knn_same_type_features(data, column):
    """
    Apply K-Nearest Neighbors (KNN) imputation on the specified feature of the dataframe.
    Consider all features of the same type as the feature to impute for the imputation.

        :param data: the dataframe to impute its features.
        :param column: the feature name of the dataframe to impute.
        :return: the dataframe with the imputed feature.
    """
    neighbors = 5

    mask = dfo.get_all_features_of_same_type_as_column(data, column)
    res = fast_knn(data[mask.columns].values, k=neighbors)

    data[column] = res
    return data


def knn_numeric_features(data, column):
    """
    Apply K-Nearest Neighbors (KNN) imputation on the specified feature of the dataframe.
    Consider all numeric features for the imputation.

        :param data: the dataframe to impute its features.
        :param column: the feature name of the dataframe to impute.
        :return: the dataframe with the imputed feature.
    """
    neighbors = 5

    mask = dfo.get_all_numeric_features(data)
    res = fast_knn(data[mask.columns].values, k=neighbors)

    data[column] = res
    return data


def multivariate(data, column):
    """
    Apply multivariate imputation on the specified feature of the dataframe.

        :param data: the dataframe to impute its features.
        :param column: the feature name of the dataframe to impute.
        :return: the dataframe with the imputed feature.
    """
    iter_number = 5

    imp = IterativeImputer(max_iter=iter_number, random_state=0)
    imp.fit(data[column].to_numpy().reshape(-1, 1))

    data[column] = imp.transform(data[column].to_numpy().reshape(-1, 1))
    return data


def multivariate_more_iter(data, column):
    """
    Apply multivariate imputation on the specified feature of the dataframe
    with a higher number of iterations. Consider only the specified feature
    for the imputation.

        :param data: the dataframe to impute its features.
        :param column: the feature name of the dataframe to impute.
        :return: the dataframe with the imputed feature.
    """
    iter_number = 50

    imp = IterativeImputer(max_iter=iter_number, random_state=0)
    imp.fit(data[column].to_numpy().reshape(-1, 1))
    IterativeImputer(random_state=0)

    data[column] = imp.transform(data[column].to_numpy().reshape(-1, 1))
    return data


def multivariate_more_iter_same_type_features(data, column):
    """
    Apply multivariate imputation on the specified feature of the dataframe
    with a higher number of iterations. Consider all features of the same type
    as the feature to impute for the imputation.

        :param data: the dataframe to impute its features.
        :param column: the feature name of the dataframe to impute.
        :return: the dataframe with the imputed feature.
    """
    iter_number = 50

    mask = dfo.get_all_features_of_same_type_as_column(data, column)
    imp = IterativeImputer(max_iter=iter_number, random_state=0)
    imp.fit(data[mask.columns].values)
    IterativeImputer(random_state=0)

    data[column] = imp.transform(data[mask.columns].values)
    return data


def multivariate_more_iter_numeric_features(data, column):
    """
    Apply multivariate imputation on the specified feature of the dataframe
    with a higher number of iterations. Consider all numeric features in the
    dataframe for the imputation.

        :param data: the dataframe to impute its features.
        :param column: the feature name of the dataframe to impute.
        :return: the dataframe with the imputed feature.
    """
    iter_number = 50
    mask = dfo.get_all_numeric_features(data)

    imp = IterativeImputer(max_iter=iter_number, random_state=0)
    imp.fit(data[mask.columns].values)
    IterativeImputer(random_state=0)

    data[column] = imp.transform(data[mask.columns].values)
    return data


def round_imputed_type(data_with_missingness, column, imputed_feature):
    """
    Round the imputed value to match the same characteristics
    (e.g. binary, discrete) as the not imputed feature values.

        :param data_with_missingness: the data with missing values.
        :param column: the column of the data to check.
        :param imputed_feature: the imputed data values.
        :return: the rounded imputed data values.
    """
    if dfo.feature_has_object_type(data_with_missingness, column):
        return imputed_feature

    elif dfo.feature_is_binary(data_with_missingness, column):
        imputed_feature = dfo.round_feature_to_binary(imputed_feature)

    elif dfo.feature_is_discrete(data_with_missingness, column):
        imputed_feature = dfo.round_feature_to_discrete_positive(
            imputed_feature)

    else:
        imputed_feature = dfo.round_feature_to_continuous_positive(
            imputed_feature)

    return imputed_feature


def drop_columns(data):
    """
    Drop columns with indices and that are not used for the
    imputation of feature values.

        :param data: the data to process.
        :return: the processed data after the columns are dropped.
    """
    if Opt.idx in data:
        data.drop(Opt.idx, axis=1, inplace=True)
    if Opt.cohort_number in data:
        data.drop(Opt.cohort_number, axis=1, inplace=True)
    if Opt.ID in data:
        data.drop(Opt.ID, axis=1, inplace=True)
    return data
