from source.Options import Opt
import pandas as pd


class MergeData(object):
    """
        A class for merging the data of three csv files for radiomic, genomic, and clinical data.
    """

    def get_merged_data(self, clinical_list, genomic, radiomic):
        """
        Merge all datasets together and return a list of dataframes with the merged data.

            :param clinical_list: the list of clinical dataframes imputed with different methods.
            :param genomic: the genomic dataframe.
            :param radiomic: the radiomic dataframe
            :return: the list of merged dataframes that contain the samples available in all three datasets.
        """
        if len(clinical_list) == 1:
            return self.merge_data([clinical_list[0], genomic, radiomic], Opt.ID.value)

        merged_list = []
        for clinical in clinical_list:
            merged_df = self.merge_data(
                [clinical, genomic, radiomic], Opt.ID.value)
            merged_list.append(self.clean_merged_data(merged_df))

        return merged_list

    def merge_data(self, data_list, id_column):
        """
        Merge the data of a list of dataframes together by a unique id.

            :param data_list: the list of dataframes to merge.
            :param id_column: the unique id for each sample in the dataframes.
            :return: the merged dataframe.
        """
        if len(data_list) == 0:
            return []

        if len(data_list) == 1:
            return data_list[0]

        merged_df = data_list[0]
        for i in range(len(data_list)):
            if i < len(data_list) - 1:
                merged_df = pd.merge(
                    merged_df, data_list[i + 1], how='inner', left_on=id_column, right_on=id_column)

        return merged_df

    def clean_merged_data(self, data):
        """
        Clean the merged dataframe. Remove duplicated columns (e.g. ids) and indices of original
        dataframes. Rename columns with a postfix back to their original name. Keep only the first
        occurrence of duplicated rows.

            :param data: the dataframe to clean.
            :return: the cleaned dataframe.
        """
        data.drop(data.filter(regex='_y$').columns.tolist(),
                  axis=1, inplace=True)
        data.drop(data.filter(regex=Opt.idx.value +
                  '_x').columns.tolist(), axis=1, inplace=True)

        data.rename(columns={Opt.cohort_number.value +
                    '_x': Opt.cohort_number.value}, inplace=True)
        data = data[~data.index.duplicated(keep='first')]

        return data
