from enum import Enum


class Opt(Enum):
    """
        Store all options for the backend.
    """

    radiomics_dataset = 'sample/radiomics-toy-data'
    genomics_dataset = 'sample/genomics-toy-data'
    clinical_dataset = 'sample/clinical-toy-data'

    ID = 'id'
    """
        Identifier column for merging csv files by a common ID.
    """

    idx = 'index'
    """
        Unique index column of pandas dataframe.
    """

    write_data_to_file = False
    """
        Specifies whether interim results are written to files.
    """

    space = ' '
    plus_symbol = '+'
    smaller_symbol = '<'
    dash_symbol = '-'
    underline_symbol = '_'
    constant_to_decrease = 0.001
    """
        For data processing.
    """

    evaluate_best_imputation_method_for_data = False
    percentage_training = 0.6
    percentage_test = 0.4
    """
        If the sum of `percentage_training` and `percentage_test` is < 1,
        the remaining data is assigned to the validation set.
    """

    min_limit = 5
    max_limit = 95
    """
        Min and max boarders for the simulation of missingness in the data.
    """

    file_type = '.csv'
    separator = ';'
    decimal_point = '.'
    decimal_comma = ','
    encoding = 'UTF-8'
    input_folder = 'data/input/'
    output_folder = 'data/output/'
    imputation_path = 'data/output/imputation/'
    """
        For reading and writing files.
    """

    server_deployment = False
    server_path = '/home/vaci/htdocs/vaci/data/input/'
    """
        Set to `True` and update server path if deployed on server.
    """

    number_of_bytes = 10000
    """
        Number of bytes analyzed to determine the file encoding.
    """

    X_score = 'X_score'
    Y_score = 'Y_score'
    Z_score = 'Z_score'
    categorical_score = 'clinical stage'
    cohort_number = 'cohort_number'
    """
        Options for feature specific data processing.
    """
