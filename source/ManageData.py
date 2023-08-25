import source.processing.DataFrameOps as dfo
from source.Options import Opt

from source.processing.ImputeData import ImputeData
from source.processing.EncodeData import EncodeData
from source.processing.ReadData import ReadData
from source.processing.MergeData import MergeData
from source.processing.ScaleData import ScaleData
from source.processing.DetectOutliers import DetectOutliers
from source.processing.ReduceData import ReduceData
from source.processing.ClusterData import ClusterData
from source.processing.ShapValues import ShapValues
from source.processing.InterclassFeatures import InterclassFeatures

from source.InterfaceOptions import DimReduction
from source.InterfaceOptions import Imputation
from source.InterfaceOptions import OutlierRemoval
from source.InterfaceOptions import Clustering
from source.InterfaceOptions import Scaling

import source.FileWriter as fw

import pandas as pd


class ManageData(object):
    """
        A class for managing the data.
    """

    # default values of options
    imputation = Imputation.BEST
    out_removal = OutlierRemoval.NO
    dim_reduction = DimReduction.UMAP
    clustering = Clustering.KMEANS
    scaling = Scaling.NORM
    indices = []
    features = []
    clusters = []

    def __init__(self):
        """
            The constructor that sets the initialization parameters for the data manager.
            Process the data by calling all methods and functions to read and handle the data.
        """

        self.dataset_tag = None
        self.clustered_stand_data_list = None
        self.clustered_norm_data_list = None
        self.reduced_stand_data_list = None
        self.reduced_norm_data_list = None
        self.data_imp_list_for_hovering_and_table = None
        self.merged_data_for_vis = None
        self.weights_sgd = None
        self.weights_lda = None
        self.shap_data = None
        self.clustered_data = None
        self.reduced_data = None
        self.clean_merged_imputed_data_no_encoding = None
        self.missing_data_handler = ImputeData()
        self.file_reader = ReadData()
        self.file_merger = MergeData()
        self.categorical_data_handler = EncodeData()
        self.missing_data_handler = ImputeData()
        self.data_scaler = ScaleData()
        self.outlier_detector = DetectOutliers()
        self.data_reducer = ReduceData()
        self.clustering_handler = ClusterData()
        self.shap_handler = ShapValues()
        self.inter_handler = InterclassFeatures()

        self.clinical_data = self.file_reader.get_clinical_data()
        self.orig_clinical_data = self.clinical_data.copy()

        self.genomic_data = self.file_reader.get_genomic_data()
        self.radiomic_data = self.file_reader.get_radiomic_data()

        self.get_data_of_selected_options()

    def get_data_of_selected_options(self):
        """
            Process the data with the selected options.
        """
        # encode categorical values of clinical data, except for FAMD
        encoded_clinical_data = self.clinical_data.copy()

        if self.dim_reduction != DimReduction.FAMD:
            encoded_clinical_data = self.categorical_data_handler.encode_categorical_values(
                self.clinical_data.copy())

        # handle imputation - based on selection
        imputed_clinical_data = self.handle_imputation(encoded_clinical_data.copy())

        # feature list per dataset without index and id to send it to frontend
        self.dataset_tag = {'clinical': imputed_clinical_data.columns[1:].tolist(),
                            'radiomic': self.radiomic_data.columns[2:].tolist(),
                            'genomic': self.genomic_data.columns[2:].tolist()
                            }

        # merge all datasets
        merged_data = self.file_merger.merge_data(
            [imputed_clinical_data, self.radiomic_data, self.genomic_data], Opt.ID.value)
        clean_merged_data = self.file_merger.clean_merged_data(merged_data)

        # get only selected columns of a dataframe
        if len(self.features) > 1:
            clean_merged_data = clean_merged_data.filter(self.features, axis=1)

        self.clean_merged_imputed_data_no_encoding = clean_merged_data.copy()

        # outlier removal - based on selection
        data_out_rem = clean_merged_data.copy()
        if self.out_removal == OutlierRemoval.GLOBAL:
            data_out_rem = self.outlier_detector.remove_global_outliers(
                clean_merged_data)
        elif self.out_removal == OutlierRemoval.LOCAL:
            data_out_rem = self.outlier_detector.remove_local_outliers(
                clean_merged_data)

        selected_lda_data = data_out_rem.copy()
        lda_input_data = data_out_rem.copy()
        if len(self.indices) > 0:
            selected_lda_data.set_index(
                selected_lda_data.columns[0], inplace=True)
            lda_input_data = selected_lda_data.iloc[self.indices].copy()

        # scaling
        if self.scaling == Scaling.STAND:
            scaled_data = self.data_scaler.standardize_data(data_out_rem)
        else:
            scaled_data = self.data_scaler.normalize_data(data_out_rem)

        # reduction
        reduced_data = scaled_data.copy()
        selected_data = scaled_data.copy()

        if len(self.indices) > 0:
            selected_data.set_index(selected_data.columns[0], inplace=True)
            scaled_data = selected_data.iloc[self.indices].copy()

        mask = dfo.get_all_numeric_features(scaled_data)
        if self.dim_reduction == DimReduction.UMAP:
            reduced_data = self.data_reducer.apply_umap(
                scaled_data[mask.columns])
        elif self.dim_reduction == DimReduction.PCA:
            reduced_data = self.data_reducer.apply_pca(
                scaled_data[mask.columns])
        elif self.dim_reduction == DimReduction.TSNE:
            reduced_data = self.data_reducer.apply_tsne(
                scaled_data[mask.columns])
        elif self.dim_reduction == DimReduction.MDS:
            reduced_data = self.data_reducer.apply_mds(
                scaled_data[mask.columns])
        elif self.dim_reduction == DimReduction.FAMD:
            reduced_data = self.data_reducer.apply_famd(scaled_data)
        self.reduced_data = reduced_data.copy()

        # clustering
        labels = []
        if len(self.clusters) > 0:
            labels = self.clusters

        else:
            if self.clustering == Clustering.KMEANS:
                labels = self.clustering_handler.kmeans_clustering(
                    reduced_data)
            elif self.clustering == Clustering.MSHIFT:
                labels = self.clustering_handler.mean_shift_clustering(
                    reduced_data)
            elif self.clustering == Clustering.HIERA4:
                labels = self.clustering_handler.hierarchical_clustering(
                    reduced_data)
            elif self.clustering == Clustering.HIERA6:
                labels = self.clustering_handler.hierarchical_clustering_2(
                    reduced_data)
            elif self.clustering == Clustering.DBSCAN:
                labels = self.clustering_handler.dbscan_clustering(
                    reduced_data)
            elif self.clustering == Clustering.OPTICS:
                labels = self.clustering_handler.optics_clustering(
                    reduced_data)
            elif self.clustering == Clustering.GMM:
                labels = self.clustering_handler.gmm_clustering(reduced_data)
        self.clustered_data = labels.copy()

        # shap values
        shap_values = self.shap_handler.calculate_shap_values(
            scaled_data[mask.columns].copy(), labels)
        self.shap_data = shap_values.copy()

        # all feature values of first class (e.g. 0) and second class (e.g. 1) as input
        # identify features that differentiate the most between both groups as output
        lda_input = lda_input_data[mask.columns].copy()
        lda_input['labels'] = labels

        # at least two clusters and no NaN values
        lda_sgd_possible = (len(set(labels)) > 1) and not (
            lda_input_data.isnull().values.any())

        fw.write_df_to_file(lda_input, "lda-test.csv")
        fw.write_df_to_file(lda_input_data, "lda-test-data.csv")

        if lda_sgd_possible:
            self.weights_lda = self.inter_handler.get_features_by_LDA_classifier(
                lda_input, labels)

            self.weights_sgd = self.inter_handler.get_features_by_SGD_classifier(
                lda_input, labels)
        else:
            self.weights_lda = pd.DataFrame()
            self.weights_sgd = pd.DataFrame()

        print("Data successfully processed")

    def precalculate_and_store_all_options(self):
        """
            Precalculate and store all result of all options. This method is replaced
            by the "getDataOfSelectedOptions" method to widen the interaction possibilities.
        """
        self.missing_data_handler = ImputeData()
        self.file_reader = ReadData()
        self.file_merger = MergeData()
        self.categorical_data_handler = EncodeData()
        self.missing_data_handler = ImputeData()
        self.data_scaler = ScaleData()
        self.outlier_detector = DetectOutliers()
        self.data_reducer = ReduceData()
        self.clustering_handler = ClusterData()
        self.shap_handler = ShapValues()

        clinical_data = self.file_reader.get_clinical_data()
        self.orig_clinical_data = clinical_data.copy()

        genomic_data = self.file_reader.get_genomic_data()
        radiomic_data = self.file_reader.get_radiomic_data()

        # impute encoded clinical data with BEST, MICE, KNN, CONST methods and save results in a list
        clinical_data_list = self.missing_data_handler.impute_missing_values(
            self.categorical_data_handler.encode_categorical_values(clinical_data))

        self.merged_data_for_vis = self.file_merger.get_merged_data(
            clinical_data_list.copy(), genomic_data, radiomic_data)
        self.data_imp_list_for_hovering_and_table = self.merged_data_for_vis

        # merge datasets
        merged_data_list = self.file_merger.get_merged_data(
            clinical_data_list, genomic_data, radiomic_data)

        # remove outliers
        best_without_global_outliers = self.outlier_detector.remove_global_outliers(
            merged_data_list[0].copy())
        best_without_local_outliers = self.outlier_detector.remove_local_outliers(
            merged_data_list[0].copy())
        merged_data_list.append(best_without_global_outliers)
        merged_data_list.append(best_without_local_outliers)

        # normalize/standardize data
        normalized_data_list = self.data_scaler.normalize_data_list(
            merged_data_list)
        standardized_data_list = self.data_scaler.standardize_data_list(
            merged_data_list)

        # reduce data
        self.reduced_norm_data_list = self.data_reducer.get_reduced_data(
            normalized_data_list)
        self.reduced_stand_data_list = self.data_reducer.get_reduced_data(
            standardized_data_list)

        # cluster data
        self.clustered_norm_data_list = self.clustering_handler.cluster_list(
            self.reduced_norm_data_list)
        self.clustered_stand_data_list = self.clustering_handler.cluster_list(
            self.reduced_stand_data_list)

        # shap values for t-SNE with mean shift
        tsne_res = normalized_data_list[0].copy()
        mask = dfo.get_all_numeric_features(tsne_res)
        tsne_reduced = self.data_reducer.apply_tsne(
            normalized_data_list[0].copy()[mask.columns])
        self.clustering_handler.mean_shift_clustering(
            tsne_reduced)

    def handle_imputation(self, data):
        """
        Apply the selected imputation option on the data.

            @param data: the data to impute.
            @return: the imputed data with no missingness.
        """
        mask = dfo.get_all_numeric_features(data)
        col_names = dfo.get_column_names_with_missing_data(data)
        if self.imputation == Imputation.BEST:
            return self.missing_data_handler.apply_best_imputation_method_per_feature(data, col_names)
        elif self.imputation == Imputation.MICE:
            data[mask.columns] = self.missing_data_handler.apply_mice_for_all_features(
                data[mask.columns], col_names)
            return data
        elif self.imputation == Imputation.KNN:
            data[mask.columns] = self.missing_data_handler.apply_knn_for_all_features(
                data[mask.columns], col_names)
            return data
        elif self.imputation == Imputation.CONST:
            return data.copy().fillna("-1")
        elif self.imputation == Imputation.HCONST:
            return data.copy().fillna("1000")
        elif self.imputation == Imputation.NOIMP:
            return data.copy()
        elif self.imputation == Imputation.COMPL:
            return dfo.get_complete_samples_of_dataset(data)

    def get_merged_imputed_data_for_hovering_and_table(self):
        """
        Get merged, imputed data without one-hot encoding.

            :return: the imputed and merged data.
        """
        return self.clean_merged_imputed_data_no_encoding

    def get_original_clinical_data(self):
        """
        Get original clinical data without any processing.

            :return: the original clinical data.
        """
        return self.orig_clinical_data

    def get_reduced_data(self):
        """
        Scale and reduce the data to two dimensions.

            :return: the reduced data.
        """
        return self.reduced_data

    def get_clustered_data(self):
        """
        Get labels that represent the clusters of data.

            :return: the labels of the clusters.
        """
        return self.clustered_data

    def get_shap_data(self):
        """
        Get SHAP values of clusters.

            :return: the SHAP values of the clusters sorted descending by their values.
        """
        return self.shap_data

    def get_lda_data(self):
        """
        Get LDA weights of features that discriminate between clusters.

            :return: the LDA features between the clusters sorted descending by their weight.
        """
        return self.weights_lda

    def get_sgd_data(self):
        """
        Get SGD weights of features that discriminate between clusters.

            :return: the SGD features between the clusters sorted descending by their weight.
        """
        return self.weights_sgd

    def get_dataset_tag(self):
        """
        Get feature names per dataset to differentiate between them in data filtering.

            :return: the object that holds the feature names per dataset.
        """
        return self.dataset_tag
