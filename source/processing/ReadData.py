import source.processing.DataFrameOps as dfo
from source.Options import Opt
import pandas as pd
import chardet
import pathlib
import os

# File names of default toy data sets
rad = Opt.radiomics_dataset.value + Opt.file_type.value
gen = Opt.genomics_dataset.value + Opt.file_type.value
cli = Opt.clinical_dataset.value + Opt.file_type.value

enc_dict = "encoding"
"""
    Column of the dictionary resulting from chardet that contains the file encoding.
"""


def get_path_to_input_data(filename):
    """
    Get the joined path of an input file.

        :param filename: the file whose path is determined.
        :return: the file path as a string.
    """
    return str(os.path.join(pathlib.Path().resolve(), Opt.input_folder.value, filename))


def process_symbols(entry, symbol, constant):
    """
    If `entry` contains `symbol`, remove `symbol` from `entry` and decrease it by `constant`.
    Otherwise, no change is performed to `entry`.

        :param entry: the entry to process.
        :param symbol: the symbol to remove.
        :param constant: the constant to decrease the entry with.
        :return: the processed entry without the symbol and decreased by the constant.
    """
    if symbol in str(entry):
        number = float(entry.replace(symbol, ""))
        return number - constant

    else:
        return entry


def get_file_encoding(file_path):
    """
    Determine the file encoding based on the first bytes of the file.

        :param file_path: the path of the file.
        :return: the encoding of the file.
    """
    with open(file_path, 'rb') as raw_data:
        result = chardet.detect(raw_data.read(Opt.number_of_bytes.value))
        return result[enc_dict]


def read_data_from_file(path, encoding):
    """
    Read data from a file and return it as a dataframe.

        :param path: the path of the file.
        :param encoding: the encoding of the file.
        :return: the dataframe that contains the data of the file.
    """
    return pd.read_csv(path, delimiter=Opt.separator.value, decimal=Opt.decimal_comma.value, encoding=encoding)


def cleanup_data(data):
    """
    Cleanup the data object by removing whitespaces, and unifying the decimal symbols.

        :param data: the dataframe object to process.
        :return: the cleaned data.
    """
    # remove all leading and trailing whitespaces of string entries
    mask = dfo.get_all_object_features(data)
    data[mask.columns] = mask.apply(lambda x: x.str.strip())

    # symbol occurs only in the `post_PSA` column
    column = Opt.Z_score.value
    symbol = Opt.smaller_symbol.value
    constant = Opt.constant_to_decrease.value

    # decrease entries with the `<` symbol by a constant and remove the symbol
    if column in data:
        data[column] = data.apply(lambda x: process_symbols(
            x[column], symbol, constant), axis=1)

    # use unified decimal symbol for all numerical data
    for col in range(len(mask.columns)):
        try:
            data[mask.columns[col]] = [float(str(j).replace(
                Opt.decimal_comma.value, Opt.decimal_point.value)) for j in data[mask.columns[col]]]
        except ValueError:
            pass

    return data


class ReadData(object):
    """
        A class for reading the data of three csv files for radiomic, genomic, and clinical data.
    """

    def __init__(self):
        """
            The constructor that sets the initialization parameters for the data reader.
        """
        path_to_use = Opt.server_path.value
        if not Opt.server_deployment.value:
            path_to_use = Opt.input_folder.value

        self.radiomics_df = pd.read_csv(path_to_use + rad, delimiter=Opt.separator.value,
                                        decimal=Opt.decimal_comma.value, encoding=Opt.encoding.value)
        self.genomics_df = pd.read_csv(path_to_use + gen, delimiter=Opt.separator.value,
                                       decimal=Opt.decimal_comma.value, encoding=Opt.encoding.value)
        self.clinical_df = pd.read_csv(path_to_use + cli, delimiter=Opt.separator.value,
                                       decimal=Opt.decimal_comma.value, encoding=Opt.encoding.value)

        # cleanup data
        self.clinical_df = cleanup_data(self.clinical_df)

        # pair the index with the row number
        self.clinical_df = self.clinical_df.reset_index()
        self.genomics_df = self.genomics_df.reset_index()
        self.radiomics_df = self.radiomics_df.reset_index()

    def get_clinical_data(self):
        """
        Get the clinical data as a dataframe.

            :return: the clinical data as a dataframe.
        """
        return self.clinical_df

    def get_genomic_data(self):
        """
        Get the genomic data as a dataframe.

            :return: the genomic data as a dataframe.
        """
        return self.genomics_df

    def get_radiomic_data(self):
        """
        Get the radiomic data as a dataframe.

            :return: the radiomic data as a dataframe.
        """
        return self.radiomics_df
