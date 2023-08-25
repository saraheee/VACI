import numpy as np


def feature_is_binary(data, column):
    """
    Check whether the specified feature of the dataframe consists of binary
    values only. The input could also contain missing data, therefore missing
    entries are dropped before checking.

        :param data: the dataframe to check its feature.
        :param column: the feature name of the dataframe to check.
        :return: `true` if all values of this feature are binary, otherwise `false`.
    """
    return np.isin(data[column].dropna().unique(), [0, 1]).all()


def feature_is_discrete(data, column):
    """
    Check whether the specified feature of the dataframe consists of discrete
    values only. The input could also contain missing data, therefore missing
    entries are dropped before checking.

        :param data: the dataframe to check its feature.
        :param column: the feature name of the dataframe to check.
        :return: `true` if all values of this feature are discrete, otherwise `false`.
    """
    return np.array_equal(data[column].dropna().values, data[column].dropna().values.astype(int))


def feature_has_object_type(data, column):
    """
    Check whether the specified feature of the dataframe is of type `object`.

        :param data: the dataframe to check its features.
        :param column: the feature name of the dataframe to check.
        :return: `true` if this feature is of type `object`, otherwise `false`.
    """
    return data[column].dtype == 'object'


def round_feature_to_binary(feature):
    """
    Round the feature to a binary value.

        :param feature: the feature data to round.
        :return: the rounded feature.
    """
    return feature.apply(lambda x: 0 if x < 0.5 else 1)


def round_feature_to_discrete_positive(feature):
    """
    Round the feature to a discrete positive value.

        :param feature: the feature data to round.
        :return: the rounded feature.
    """
    return feature.apply(lambda x: 0 if x < 0 else round(x))


def round_feature_to_continuous_positive(feature):
    """
    Round the feature to a positive value with two decimal points.

        :param feature: the feature data to round.
        :return: the rounded feature.
    """
    return feature.apply(lambda x: 0 if (x < 0 and x != -1) else round(x, 2))


def get_all_object_features(data):
    """
    Determine all features of type `object` in the dataframe.

        :param data: the dataframe to select its `object` features.
        :return: a subset of the data with all features that have the type `object`.
    """
    return data.select_dtypes(['object'])


def get_all_features_of_same_type_as_column(data, column):
    """
    Determine a subset of the data with columns of the same type as the column specified.

        :param data: the whole dataframe.
        :param column: the column that specifies the datatype of the features to select.
        :return: a subset of the data with all features that have the same datatype as the column specified.
    """
    return data.select_dtypes([data[column].dtypes])


def get_all_numeric_features(data):
    """
    Determine a subset of the data with all columns that include numeric data.
    In our case the datatypes `float64`, `int64` are available in the data.

        :param data: the whole dataframe.
        :return: a subset of the data with numeric features.
    """
    return data.select_dtypes(['float64', 'int64'])


def set_to_minus_one(data, col_to_check, col_to_replace):
    """
    When an entry in `col_to_check` is 0, set the value of `col_to_replace` for this
    sample to -1. This is needed for setting the `Y_score` based on the `X_score`,
    when the value is missing in the dataframe.

        :param data: the dataframe to check and replace its values.
        :param col_to_check: the feature to check in the dataframe.
        :param col_to_replace: the feature to replace in the dataframe.
    """
    data.loc[data[col_to_check] == 0, col_to_replace] = -1
    return data


def get_column_names_with_missing_data(data):
    """
    Get the names of all columns in a dataframe that have values missing.

        :param data: the dataframe to check for missingness.
        :return: the names of all data columns that contain missing values.
    """
    return data.columns[data.isnull().any()]


def get_complete_samples_of_dataset(data):
    """
    Get a subset of all rows in the dataframe that are complete. A row is complete, if all
    of its values are known.

        :param data: the dataframe with missingness.
        :return: a subset of all rows of the dataframe without missingness.
    """
    return data.dropna()


def fill_nan_values_by_constant(data, constant):
    """
    Fill missing values of the dataframe by a constant.

        :param data: the dataframe to process.
        :param constant: the constant to fill in missing values.
        :return: the dataframe with all missing values filled in by a constant.
    """
    return data.fillna(constant)
