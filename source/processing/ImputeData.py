import source.FileWriter as fw
import source.processing.ErrorMetrics as em
import source.processing.DataFrameOps as dfo
import source.processing.ImputationMethods as im
from source.Options import Opt

import numpy as np
import sys

sys.setrecursionlimit(100000)


class ImputeData(object):
    """
        A class for handling missing data by imputations.
    """

    def impute_missing_values(self, data):
        """
        Determine the best imputation method for this dataset by evaluating the imputed
        result on a complete subset of the dataframe. Split this complete subset into training,
        and test set. If the sum of `percentage_training` and `percentage_test` is < 1, assign
        the remaining data to the validation set. Simulate different missingness in the complete
        data and evaluate the result, especially for the same percentage of missingness as in the
        original dataframe. Apply the best imputation method for each feature on the missing data
        afterward.

        Additionally, apply MICE and KNN imputation on all features, and return a list
        that contains the result of the best imputation method per feature, evaluated on the 
        training set, the result of the mice imputation applied on all features, and the result
        of the knn imputation applied on all features.

        If all values of a feature with dependencies are missing in the data, an imputation might not
        represent the correct distribution of the data. Therefore, replace these values with `-1` as
        they should not be imputed.

            :param data: the dataframe with missing values to impute.
            :return: a list of dataframes with all values imputed.
        """
        data = dfo.set_to_minus_one(
            data, Opt.X_score.value, Opt.Y_score.value)
        data_without_nan = dfo.get_complete_samples_of_dataset(data)
        complete_dataset = data_without_nan.copy()
        self.mask_missing = self.mark_missing_values(data)

        train, validate, test = self.split_data_into_training_test_validation_sets(
            complete_dataset, Opt.percentage_training.value, Opt.percentage_test.value)

        col_names = dfo.get_column_names_with_missing_data(data)

        if Opt.write_data_to_file.value:
            fw.write_df_to_file(data_without_nan, 'not-nan.csv')
            fw.write_df_to_file(train, 'training-set.csv')
            fw.write_df_to_file(test, 'test-set.csv')
            fw.write_df_to_file(validate, 'validation-set.csv')
            fw.write_df_to_file(self.mask_missing, 'missing-values.csv')

        if Opt.evaluate_best_imputation_method_for_data.value:
            step = Opt.min_limit.value
            self.create_missingness_and_apply_imputation(
                train, Opt.min_limit.value, Opt.max_limit.value, step, col_names)
            self.create_missingness_and_apply_imputation(
                test, Opt.min_limit.value, Opt.max_limit.value, step, col_names)
            self.create_missingness_and_apply_imputation(
                complete_dataset, Opt.min_limit.value, Opt.max_limit.value, step, col_names)

        best = self.apply_best_imputation_method_per_feature(
            data.copy(), col_names)
        mice = self.apply_mice_for_all_features(data.copy(), col_names)
        knn = self.apply_knn_for_all_features(data.copy(), col_names)
        const = data.copy().fillna("-1")
        hconst = data.copy().fillna("1000")
        none = data.copy()
        compl = complete_dataset.copy()

        return [best, mice, knn, const, hconst, none, compl]

    def get_missingness_indicator(self):
        """
        Get an indicator matrix that shows which values were originally
        missing in the dataset, even if they are imputed afterward.

            :return: an indicator matrix that shows the missing values.
        """
        return self.mask_missing

    def mark_missing_values(self, data):
        """
        Mark missing values in the dataframe by an indicator.

            :param data: the dataframe with missing values.
            :return: the dataframe with binary values that indicate for each entry, whether it is
            available or missing.
        """
        return data.isna()

    def apply_best_imputation_method_per_feature(self, data, col_names):
        """
        Apply the selected imputation methods to the data with missingness.
        These are selected per feature based on the evaluation of the training set.

        This method was replaced with MICE as it is data specific.
        To identify the best method for each feature in new data sets, the evaluation
        needs to be repeated on the data (through `apply_all_imputation_methods`).

            :param data: the dataframe with missingness to impute.
            :param col_names: the columns of the dataframe that contain missing values.
            :return: the dataframe imputed by selected imputation methods per column.
        """
        if len(col_names) < 1:
            return data

        return self.apply_mice_for_all_features(data, col_names)

    def apply_mice_for_all_features(self, data, col_names):
        """
        Apply MICE imputation to the data with missingness.

            :param data: the dataframe with missingness to impute.
            :param col_names: the columns of the dataframe that contain missing values.
            :return: the dataframe imputed by the MICE algorithm.
        """
        return im.mice_impute_all_values(data, col_names)

    def apply_knn_for_all_features(self, data, col_names):
        """
        Apply KNN imputation to the data with missingness.

            :param data: the dataframe with missingness to impute.
            :param col_names: the columns of the dataframe that contain missing values.
            :return: the dataframe imputed by the KNN algorithm.
        """
        return im.knn_impute_all_values(data, col_names)

    def create_missingness_and_apply_imputation(self, data, min_limit, max_limit, step, col_names):
        """
        Create different missingness percentages in data and apply all imputation methods on it.
        This method is used for the evaluation of the imputation methods on the dataframe to select
        the best imputation technique for each of the features with missingness.

            :param data: the complete data to simulate missingness in it.
            :param min_limit: the minimum percentage of missingness to simulate in the data.
            :param max_limit: the maximum percentage of missingness to simulate in the data.
            :param step: the step size to use for the simulation of the missingness in the data.
            :param col_names: the names of the columns to use for the simulation of missingness.
        """
        missingness_levels_data = self.create_data_with_different_missingness(
            min_limit, max_limit, step, data, col_names)
        eval_errors_file_content = self.create_header_for_evaluation_file(
            min_limit, max_limit, step)
        self.apply_all_imputation_methods(
            missingness_levels_data, data, col_names, eval_errors_file_content)

    def split_data_into_training_test_validation_sets(self, data, percentage_training, percentage_test):
        """
        Divide the data into a training, test, and validation set and return the three subsets.

            :param data: the complete dataframe to divide.
            :param percentage_training: the percentage that defines the size of the training set.
            :param percentage_test: the percentage that defines the size of the test set.
            :return: the three subsets of the dataset.
        """
        return np.split(data.sample(frac=1, random_state=42), [int(percentage_training * len(data)),
                                                               int((1 - percentage_test) * len(data))])

    def create_data_with_different_missingness(self, min_limit, max_limit, step, data, col_names):
        """
        Create an array of dataframes with different missingness percentages.

            :param min_limit: the minimum percentage of missingness to simulate in the data.
            :param max_limit: the maximum percentage of missingness to simulate in the data.
            :param step: the step size to use for the simulation of the missingness in the data.
            :param data: the dataframe to use for the simulation of missingness in the data.
            :param col_names: the column names of features to use for the simulation of missingness in the data.
            :return: A list of dataframes with different missingness percentages of the data simulated.
        """
        missingness_percent = min_limit
        missingness_levels_data = []
        i = 0

        while missingness_percent <= max_limit:
            missingness_levels_data.append(self.sim_missingness(
                data, col_names, missingness_percent))
            missingness_percent += step
            i += 1
        return missingness_levels_data

    def sim_missingness(self, data, col, percentage):
        """
        Simulate the specified amount of missingness in the specified column of the dataframe.

            :param data: the complete dataframe to use for the simulation of missingness.
            :param col: the name of the colum to use for the simulation of missingness.
            :param percentage: the percentage of missingness to simulate.
            :return: the dataframe with simulated missingness.
        """
        data_with_missingness = data.copy()
        sim_missing_number = em.calculate_number_from_percentage(
            len(data), percentage)

        data_with_missingness.loc[data_with_missingness[col].sample(
            n=sim_missing_number).index, col] = np.NaN
        return data_with_missingness

    def create_header_for_evaluation_file(self, min_limit, max_limit, step):
        """
        Create list from `min_limit` to `max_limit` with missingness percentages and use it for the file header.

            :param min_limit: the minimum percentage of missingness to simulate in the data.
            :param max_limit: the maximum percentage of missingness to simulate in the data.
            :param step: the step size to use for the simulation of the missingness in the data.
            :return: the file header including the percentages of missingness in the data and the error metrics used
            for the evaluation of the data.
        """
        eval_errors_file_header = "Method + Feature"
        header_missingness_scale = np.arange(
            min_limit, max_limit + step, step).tolist()

        for header_entry in header_missingness_scale:
            eval_errors_file_header += Opt.separator.value + \
                str(header_entry) + "% missing_Corr"
            eval_errors_file_header += Opt.separator.value + \
                str(header_entry) + "% missing_RMSE"
            eval_errors_file_header += Opt.separator.value + \
                str(header_entry) + "% missing_MAPE"

        return eval_errors_file_header

    def apply_specified_imputation_method(self, missingness_levels_data, ground_truth_data, column, function_name):
        """
        Apply the imputation method specified by `function_name` to the `missingness_levels_data`.

            :param missingness_levels_data: the dataframes with different percentages of missingness.
            :param ground_truth_data: the ground truth dataframe without missingness.
            :param column: the column name of the feature to impute.
            :param function_name: the name of the imputation function to apply.
            :return: the string variable that holds the evaluation results.
        """
        eval_errors = "\n" + function_name + Opt.underline_symbol.value + column
        for data_with_missingness in missingness_levels_data:

            res = getattr(im, function_name)(
                data_with_missingness.copy(), column)
            res = self.check_imputed_type(data_with_missingness, res, column)
            if Opt.write_data_to_file.value:
                fw.write_df_to_file(res[column], Opt.imputation_path.value +
                                    Opt.underline_symbol.value + function_name + column + Opt.file_type.value)

            correctly_imputed = em.get_percentage_of_correct_imputation(
                res, ground_truth_data, data_with_missingness, column)
            eval_errors += Opt.separator.value + str(correctly_imputed).replace(
                Opt.decimal_point.value, Opt.decimal_comma.value)

            if not (dfo.feature_has_object_type(data_with_missingness, column)):
                rmse = em.calculateRMSE(
                    res, ground_truth_data, data_with_missingness, column)
                mape = em.calculateMAPE(
                    res, ground_truth_data, data_with_missingness, column)
                eval_errors += (Opt.separator.value
                                + str(rmse).replace(Opt.decimal_point.value,
                                                    Opt.decimal_comma.value)
                                + Opt.separator.value
                                + str(mape).replace(Opt.decimal_point.value, Opt.decimal_comma.value))
            else:
                eval_errors += Opt.separator.value + Opt.dash_symbol.value + \
                    Opt.separator.value + Opt.dash_symbol.value
        return eval_errors

    def apply_all_imputation_methods(self, missingness_levels_data, ground_truth_data, col_names,
                                     eval_errors_file_content):
        """
        Apply all imputation methods on `missingness_levels_data` with different missingness percentages and write the
        resulting error metrics for all missingness levels and imputation methods to a file.

            :param missingness_levels_data: the dataframes with different percentages of missingness.
            :param ground_truth_data: the ground truth dataframe without missingness.
            :param col_names: the column names of features with missing data.
            :param eval_errors_file_content: the string variable with a header to safe the evaluation results to.
        """
        function_list = [
            im.univariate_mean.__name__,
            im.univariate_median.__name__,
            im.univariate_most_frequent.__name__,  # also suitable for categorical features
            im.linear_regression.__name__,
            im.mice_imp.__name__,
            im.mice_numeric_features.__name__,
            im.knn_one_feature.__name__,
            im.knn_same_type_features.__name__,
            im.knn_numeric_features.__name__,
            im.multivariate.__name__,
            im.multivariate_more_iter.__name__,
            im.multivariate_more_iter_same_type_features.__name__,
            im.multivariate_more_iter_numeric_features.__name__,
        ]
        for column in col_names:
            for function_name in function_list:
                if ((function_name != im.univariate_most_frequent.__name__)
                        and dfo.feature_has_object_type(missingness_levels_data[0], column)):
                    pass
                else:
                    eval_errors_file_content += self.apply_specified_imputation_method(
                        missingness_levels_data, ground_truth_data, column, function_name)

        fw.write_string_to_file(
            eval_errors_file_content, "/imputation/evaluation/evaluation_errors_data.csv")

    def check_imputed_type(self, data_with_missingness, imputed_data, column):
        """
        Check the imputed values for correctness. An imputed value should have
        the same characteristics (e.g. binary, discrete, data type) as the original
        value. If this not the case, update the imputed value accordingly.
        Further, if `X_score` is `0`, all values are missing and an imputation
        might not represent the correct distribution of the data. Therefore, replace
        these values with `-1` as they should not be imputed.

            :param data_with_missingness: the data with missing values.
            :param imputed_data: the data with the imputed values.
            :param column: the column of the data to check.
            :return: the checked and updated imputed data.
        """
        if dfo.feature_has_object_type(data_with_missingness, column):
            return imputed_data

        elif dfo.feature_is_binary(data_with_missingness, column):
            if not dfo.feature_is_binary(imputed_data, column):
                imputed_data[column] = imputed_data[column].round()

        elif dfo.feature_is_discrete(data_with_missingness, column):
            if not dfo.feature_is_discrete(imputed_data, column):
                imputed_data[column] = imputed_data[column].round()

        return dfo.set_to_minus_one(imputed_data, Opt.X_score.value, Opt.Y_score.value)
