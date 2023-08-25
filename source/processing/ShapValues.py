import source.processing.DataFrameOps as dfo


from sklearn.ensemble import RandomForestClassifier
import shap

import pandas as pd


class ShapValues(object):
    """
        A class for calculating shap values to determine features
        with the highest impact on the clustering result.
    """

    def calculate_shap_values(self, data, labels):
        """
        Calculate shap values with the high dimensional data and cluster labels.

            :param data: the high dimensional data.
            :param labels: the labels resulting from clustering the low dimensional data.
            :return: a list of shap values per cluster and patient.
        """
        clf = RandomForestClassifier(random_state=42)
        mask = dfo.get_all_numeric_features(data)
        clf.fit(data[mask.columns], labels)

        explainer = shap.TreeExplainer(clf)
        shap_values = explainer(data).values

        shap_list = []
        for patient in shap_values:
            patient = pd.DataFrame(patient, data.columns.values)
            shap_list.append(patient)

        mean_values = self.get_mean_shap_values_not_zero(shap_list)

        # general explainer
        explainer2 = shap.Explainer(clf)
        shap_values2 = explainer2(data).values
        shap_list2 = []
        for patient in shap_values2:
            patient = pd.DataFrame(patient, data.columns.values)
            shap_list2.append(patient)

        mean_values2 = self.get_mean_shap_values_not_zero(shap_list2)
        return self.get_all_mean_shap_values(shap_list)

    def get_mean_shap_values_not_zero(self, shap_values):
        """
        Calculate the mean of shap values from a list of shap values of all patients.
        Remove features with all zeros as they have no influence on the clustering.
        Sort the features by values to have the features with the highest impact per
        cluster on the top of the list.

            :param shap_values: the list of shap values for all features and clusters.
            :return: the non-zero sorted list of means of shap values per cluster.
        """
        all_df = pd.concat(shap_values)
        mean_df = all_df.groupby(level=0).mean()

        mean_df_no_zero = mean_df.loc[(mean_df != 0).any(axis=1)]
        sorted_values = []

        for i in range(len(mean_df_no_zero.columns)):
            sort = mean_df_no_zero.copy().sort_values(
                mean_df_no_zero.columns[i], ascending=False)
            sort = sort.iloc[:, [i]].copy()
            sorted_values.append(sort)

        return sorted_values

    def get_all_mean_shap_values(self, shap_values):
        """
        Calculate the mean of shap values from a list of shap values of all patients.

            :param shap_values: the list of shap values for all features and clusters.
            :return: the of means of all shap values per cluster in default order.
        """
        all_df = pd.concat(shap_values)
        mean_df = all_df.groupby(level=0).mean()

        return mean_df
