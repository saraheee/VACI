import source.processing.DataFrameOps as dfo
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
import numpy as np


class DetectOutliers(object):
    """
        A class for detecting global and local outliers in the data.
    """

    def remove_global_outliers(self, data):
        """
        Detect and remove global outliers from the data.

            :param data: the data to process.
            :return: the processed data without global outliers.
        """
        data_without_outliers = data.copy()

        mask = dfo.get_all_numeric_features(data)
        df = data[mask.columns]

        clf = IsolationForest(random_state=0)
        clf.fit(df)
        y_pred = clf.predict(df)

        outliers = np.where(y_pred == -1)[0]
        data_without_outliers.drop(outliers, axis=0, inplace=True)

        return data_without_outliers

    def remove_local_outliers(self, data):
        """
        Detect and remove local outliers from the data.

            :param data: the data to process.
            :return: the processed data without local outliers.
        """
        data_without_outliers = data.copy()

        mask = dfo.get_all_numeric_features(data)
        df = data[mask.columns]

        clf = LocalOutlierFactor(n_neighbors=2)
        clf.fit(df)
        y_pred = clf.fit_predict(df)

        outliers = np.where(y_pred == -1)[0]
        data_without_outliers.drop(outliers, axis=0, inplace=True)

        return data_without_outliers
