import source.processing.DataFrameOps as dfo


class ScaleData(object):
    """
        A class for scaling the data by a normalization or a standardization.
    """

    def normalize_data_list(self, data_list):
        """
        Normalize a list of dataframes in the range [0 1] based on feature columns.
        If all values of a feature are 0, set the normalized value of this feature to 0.

            :param data_list: the list of dataframes to normalize.
            :return: the normalized dataframes in the range [0 1].
        """
        normalized = []
        for data in data_list:
            data = self.normalize_data(data)
            normalized.append(data)

        return normalized

    def normalize_data(self, data):
        """
        Normalize a dataframe in the range [0 1] based on feature columns.
        If all values of a feature are 0, set the normalized value of this feature to 0.

            :param data: the dataframes to normalize.
            :return: the normalized dataframe in the range [0 1].
        """
        mask = dfo.get_all_numeric_features(data)
        data[mask.columns] = (data[mask.columns] - data[mask.columns].min()) / \
            (data[mask.columns].max() - data[mask.columns].min())
        data[mask.columns] = dfo.fill_nan_values_by_constant(data[mask.columns], 0)

        return data

    def standardize_data_list(self, data_list):
        """
        Standardize a list of dataframes by the mean of the data. If all values of a
        feature are 0, set the standardized value of this feature to 0.

            :param data_list: the list of dataframes to standardize.
            :return: the standardized dataframes by the mean.
        """
        standardized = []
        for data in data_list:
            data = self.standardize_data(data)
            standardized.append(data)

        return standardized

    def standardize_data(self, data):
        """
        Standardize a dataframes by the mean of the data. If all values of a
        feature are 0, set the standardized value of this feature to 0.

            :param data: the dataframe to standardize.
            :return: the standardized dataframe by the mean.
        """
        mask = dfo.get_all_numeric_features(data)
        data[mask.columns] = (data[mask.columns] - data[mask.columns].mean()) / data[mask.columns].std()
        data[mask.columns] = dfo.fill_nan_values_by_constant(data[mask.columns], 0)

        return data
