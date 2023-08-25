import numpy as np


def calculateMAPE(imputed_data, ground_truth, data_with_missingness, column):
    """
    Calculate the Mean Absolute Percentage Error (MAPE) of the imputed data.

        :param imputed_data: the data with the imputed values.
        :param ground_truth: the ground truth of the dataset.
        :param data_with_missingness: the data with missing values.
        :param column: the column to calculate the MAPE for.
        :return: the MAPE of the imputed values.
    """
    mask_training_missing = data_with_missingness[column].isna()

    res_feature = imputed_data[column]
    imputed_res = res_feature[mask_training_missing]

    train_gt = ground_truth[column]
    gt_values = train_gt[mask_training_missing]

    return (np.abs((gt_values - imputed_res) / gt_values)).mean() * 100


def calculateRMSE(imputed_data, ground_truth, data_with_missingness, column):
    """
    Calculate the Root Mean Square Error (RMSE) of the imputed data.

        :param imputed_data: the data with the imputed values.
        :param ground_truth: the ground truth of the dataset.
        :param data_with_missingness: the data with missing values.
        :param column: the column to calculate the RMSE for.
        :return: the RMSE of the imputed values.
    """
    mask_training_missing = data_with_missingness[column].isna()

    res_feature = imputed_data[column]
    imputed_res = res_feature[mask_training_missing]

    train_gt = ground_truth[column]
    gt_values = train_gt[mask_training_missing]

    return np.sqrt(((imputed_res - gt_values) ** 2).mean())


def get_percentage_of_correct_imputation(imputed_data, ground_truth, data_with_missingness, column):
    """
    Calculate the percentage of correct imputations with respect to all imputed values.

        :param imputed_data: the data with the imputed values.
        :param ground_truth: the ground truth of the dataset.
        :param data_with_missingness: the data with missing values.
        :param column: the column to calculate the percentage for.
        :return: the percentage of correct imputations with respect to all imputed values.
    """
    mask_training_missing = data_with_missingness[column].isna()

    res_feature = imputed_data[column]
    imputed_res = res_feature[mask_training_missing]

    train_gt = ground_truth[column]
    gt_values = train_gt[mask_training_missing]

    return calculate_percentage(len(gt_values), sum(imputed_res == gt_values))


def calculate_percentage(whole, part):
    """
    Calculate the percentage of `part` with respect to `whole`.

        :param whole: the size of the whole dataset.
        :param part: the size of the subset of the whole dataset.
        :return: the percentage of `part` with respect to `whole`.
    """
    return part * 100 / whole


def calculate_number_from_percentage(whole, percentage):
    """
    Calculate the size of a subset from its percentage with respect to the whole dataset.

        :param whole: the size of the whole dataset.
        :param percentage: the percentage of the subset.
        :return: the size of the subset with respect to the percentage specified.
    """
    return int(whole * percentage / 100)


def get_percentage_of_missing_data(data):
    """
    Return the percentage of missingness in `data` for each of its features.

        :param data: the data to determine the missingness in its features.
        :return: the series with the percentages of missingness per feature.
    """
    return data.isnull().mean() * 100
