from source.Options import Opt
import pathlib
import os


def write_df_to_file(df, filename):
    """
    Write dataframe to file.

        :param df: the dataframe to write.
        :param filename: the filename to use for the output. 
    """
    df.to_csv(get_path_to_output_data(filename), sep=Opt.separator.value,
              decimal=Opt.decimal_comma.value, encoding=Opt.encoding.value)
    print("Data written to file '" + filename + "'")


def write_string_to_file(string, filename):
    """
    Write string to file.

        :param string: the string to write.
        :param filename: the filename to use for the output.
    """
    with open(get_path_to_output_data(filename), "w") as text_file:
        text_file.write(string)


def get_path_to_output_data(filename):
    """
    Get the joined path of an output file.

        :param filename: the file whose path is determined.
        :return: the file path as a string.
    """
    directory = str(os.path.join(pathlib.Path().resolve(), Opt.output_folder.value))
    if not os.path.exists(directory):
        os.makedirs(directory)

    return str(directory + filename)
