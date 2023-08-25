from source.Options import Opt
from sklearn.preprocessing import OneHotEncoder
import pandas as pd


class EncodeData(object):
    """
        A class for processing categorical data by encoding them.
    """

    def encode_categorical_list(self, data_list):
        """
        Handle a list of categorical values in the dataset by transforming
        the values of all list entries into numerical values.

            :param data_list: a list of dataframes to handle.
            :return: a list of handled dataframes with numerical values only.
        """
        encoded_data_list = []
        for data in data_list:
            encoded_data = self.encode_categorical_values(data)
            encoded_data_list.append(encoded_data)

        return encoded_data_list

    def encode_categorical_values(self, data):
        """
        Handle categorical values in the dataset by transforming them into numerical values.

            :param data: the dataframe to handle.
            :return: the handled dataframe with numerical values only.
        """

        col_name = Opt.categorical_score.value
        if col_name not in data:
            return data

        concatenation_symbol = Opt.plus_symbol.value
        encoder = OneHotEncoder(handle_unknown='ignore')
        each_cell_as_column_df = pd.DataFrame(
            encoder.fit_transform(data[[col_name]]).toarray())

        column_name = encoder.get_feature_names_out([col_name])
        each_cell_as_column_df.columns = column_name

        # remove prefix to facilitate the processing of the features
        each_cell_as_column_df.columns = each_cell_as_column_df.columns.str.lstrip(
            col_name + Opt.underline_symbol.value)

        cols_with_symb = [
            col for col in each_cell_as_column_df.columns if concatenation_symbol in col]
        cols_without_symb = [
            col for col in each_cell_as_column_df.columns if concatenation_symbol not in col]
        single_val_df = each_cell_as_column_df[cols_without_symb].copy()

        for combined_value in cols_with_symb:
            combined_value_array = combined_value.split(concatenation_symbol)
            for element in combined_value_array:
                single_value = element.strip()

                if single_value in single_val_df.columns:
                    # set available column to 1, when the combined column is 1
                    single_val_df.loc[each_cell_as_column_df[combined_value]
                                      == 1, single_value] = 1

                else:  # it is a new feature, add it to the dataframe
                    single_val_df[single_value] = each_cell_as_column_df[combined_value].to_numpy(
                    )

        # add name of original column to encoded features as prefix
        single_val_df.columns = col_name + Opt.space.value + single_val_df.columns

        # remove 'nan' column
        single_val_df = single_val_df[single_val_df.columns.drop(
            list(single_val_df.filter(regex='nan')))]

        # set missing values to 'NaN' to impute them afterward
        single_val_df.loc[(single_val_df == 0).all(axis=1)] = "NaN"
        single_val_df = single_val_df.astype(float)

        # combine the encoded dataframe with the original dataset by preserving its position
        col_pos = data.columns.get_loc(col_name)
        for val in range(len(single_val_df.columns)):
            if val < len(single_val_df.columns):
                data.insert(
                    col_pos + val, single_val_df.columns[val], single_val_df.values[:, val])

        # remove original column of categorical data as it is already included in an encoded way
        data.drop(col_name, axis=1, inplace=True)

        # remove duplicated index
        data.drop(Opt.idx.value, axis=1, inplace=True)

        return data

    def drop_columns(self, data):
        """
        Drop the ID columns of the dataframe.

            :param data: the dataframe to process.
            :return: the processed dataframe without the ID columns.
        """
        data.drop(Opt.cohort_number.value, axis=1, inplace=True)
        data.drop(Opt.ID.value, axis=1, inplace=True)
        return data
