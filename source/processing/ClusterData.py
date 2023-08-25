from sklearn.cluster import KMeans
from sklearn.cluster import MeanShift
from sklearn.cluster import AgglomerativeClustering
from sklearn.cluster import DBSCAN
from sklearn.cluster import OPTICS
from sklearn.mixture import GaussianMixture
from scipy.cluster.hierarchy import dendrogram

import sklearn
import numpy as np


class ClusterData(object):
    """
        A class for data clustering.
    """

    def kmeans_clustering(self, data):
        """
        Apply k-means clustering on the data.
        The number of clusters is determined by the elbow method.

            :param data: the data to cluster.
            :return: the resulting labels for the clusters.
        """
        clustering = KMeans(n_clusters=2, random_state=1).fit(data)
        labels = clustering.labels_

        #print("Silhouette Coeff. kmeans: ", metrics.silhouette_score(data, labels, metric="sqeuclidean"))
        #print("calinski harabaz kmeans: ", sklearn.metrics.calinski_harabasz_score(data, labels))
        #print("davies bouldin kmeans: ", sklearn.metrics.davies_bouldin_score(data, labels))
        return labels

    def apply_elbow_method(self, data):
        """
        Identify the number of k-means clusters by the elbow method.

            :param data: the data to analyze.
            :return: the list of distortions for k from 1 to 9.
        """
        distortions = []
        K = range(1, 10)
        for k in K:
            clustering = KMeans(n_clusters=k).fit(data)
            distortions.append(clustering.inertia_)

        return distortions

    def mean_shift_clustering(self, data):
        """
        Apply mean-shift clustering on the data.
        Estimate the bandwidth by the average of the furthest
        distance between points.

            :param data: the data to cluster.
            :return: the resulting labels for the clusters.
        """
        bw = sklearn.cluster.estimate_bandwidth(data, quantile=0.3, n_samples=None, random_state=1, n_jobs=-1)
        clustering = MeanShift(bandwidth=max(0.1, bw)).fit(data)
        labels = clustering.labels_

        #print("Silhouette Coeff. mean shift: ", metrics.silhouette_score(data, labels, metric="sqeuclidean"))
        #print("calinski harabaz mean shift: ", sklearn.metrics.calinski_harabasz_score(data, labels))
        #print("davies bouldin mean shift: ", sklearn.metrics.davies_bouldin_score(data, labels))
        return labels

    def hierarchical_clustering(self, data):
        """
        Apply hierarchical clustering on the data.

            :param data: the data to cluster.
            :return: the resulting labels for the clusters.
        """
        hierarchical_cluster = AgglomerativeClustering(n_clusters=4, affinity='euclidean', linkage='ward',
                                                       compute_distances=True)
        labels = hierarchical_cluster.fit_predict(data)
        self.plot_dendrogram(hierarchical_cluster, truncate_mode="level", p=3)

        #print("Silhouette Coeff. hierarch 4: ", metrics.silhouette_score(data, labels, metric="sqeuclidean"))
        #print("calinski harabaz h4: ", sklearn.metrics.calinski_harabasz_score(data, labels))
        #print("davies bouldin h4: ", sklearn.metrics.davies_bouldin_score(data, labels))

        return labels

    def hierarchical_clustering_2(self, data):
        """
        Apply hierarchical clustering on the data.

            :param data: the data to cluster.
            :return: the resulting labels for the clusters.
        """
        hierarchical_cluster = AgglomerativeClustering(n_clusters=6, affinity='euclidean', linkage='ward')
        labels = hierarchical_cluster.fit_predict(data)

        #print("Silhouette Coeff. hierarch 6: ", metrics.silhouette_score(data, labels, metric="sqeuclidean"))
        #print("calinski harabaz h6: ", sklearn.metrics.calinski_harabasz_score(data, labels))
        #print("davies bouldin h6: ", sklearn.metrics.davies_bouldin_score(data, labels))

        return labels

    def dbscan_clustering(self, data):
        """
        Apply DBSCAN clustering on the data.

            :param data: the data to cluster.
            :return: the resulting labels for the clusters.
        """
        clustering = DBSCAN(min_samples=5).fit(data)
        labels = clustering.labels_

        #print("Silhouette Coeff. dbscan: ", metrics.silhouette_score(data, labels, metric="sqeuclidean"))
        #print("calinski harabaz db: ", sklearn.metrics.calinski_harabasz_score(data, labels))
        #print("davies bouldin db: ", sklearn.metrics.davies_bouldin_score(data, labels))

        return labels

    def optics_clustering(self, data):
        """
        Apply OPTICS clustering on the data.

            :param data: the data to cluster.
            :return: the resulting labels for the clusters.
        """
        clustering = OPTICS(min_samples=5).fit(data)
        labels = clustering.labels_

        #print("Silhouette Coeff. optics: ", metrics.silhouette_score(data, labels, metric="sqeuclidean"))
        #print("calinski harabaz optics: ", sklearn.metrics.calinski_harabasz_score(data, labels))
        #print("davies bouldin optics: ", sklearn.metrics.davies_bouldin_score(data, labels))

        return labels

    def gmm_clustering(self, data):
        """
        Apply GMM clustering on the data.

            :param data: the data to cluster.
            :return: the resulting labels for the clusters.
        """
        clustering = GaussianMixture(n_components=4, random_state=0).fit(data)
        labels = clustering.predict(data)

        #print("Silhouette Coeff. gmm: ", metrics.silhouette_score(data, labels, metric="sqeuclidean"))
        #print("calinski harabaz gmm: ", sklearn.metrics.calinski_harabasz_score(data, labels))
        #print("davies bouldin gmm: ", sklearn.metrics.davies_bouldin_score(data, labels))

        return labels

    def cluster_list(self, data_list):
        """
        Apply clustering methods on a list of dataframes with different imputation and dimensionality reduction methods.

            :param data_list: the list of dataframes.
            :return: the list of resulting labels for the clusters.
        """
        list_all = []

        ##################################
        imp_list = []
        for imputation_method in data_list:
            dimred_list = []
            for dimred_method in imputation_method:
                labels = self.kmeans_clustering(dimred_method)
                dimred_list.append(labels)
            imp_list.append(dimred_list)
            # ----------------------------------
        list_all.append(imp_list)
        ####################################
        imp_list = []
        for imputation_method in data_list:
            dimred_list = []
            for dimred_method in imputation_method:
                labels = self.mean_shift_clustering(dimred_method)
                dimred_list.append(labels)
            imp_list.append(dimred_list)
            # ----------------------------------
        list_all.append(imp_list)
        ####################################
        imp_list = []
        for imputation_method in data_list:
            dimred_list = []
            for dimred_method in imputation_method:
                labels = self.hierarchical_clustering(dimred_method)
                dimred_list.append(labels)
            imp_list.append(dimred_list)
            # ----------------------------------
        list_all.append(imp_list)
        ####################################
        imp_list = []
        for imputation_method in data_list:
            dimred_list = []
            for dimred_method in imputation_method:
                labels = self.hierarchical_clustering_2(dimred_method)
                dimred_list.append(labels)
            imp_list.append(dimred_list)
            # ----------------------------------
        list_all.append(imp_list)
        ####################################
        imp_list = []
        for imputation_method in data_list:
            dimred_list = []
            for dimred_method in imputation_method:
                labels = self.dbscan_clustering(dimred_method)
                dimred_list.append(labels)
            imp_list.append(dimred_list)
            # ----------------------------------
        list_all.append(imp_list)
        ####################################
        imp_list = []
        for imputation_method in data_list:
            dimred_list = []
            for dimred_method in imputation_method:
                labels = self.optics_clustering(dimred_method)
                dimred_list.append(labels)
            imp_list.append(dimred_list)
            # ----------------------------------
        list_all.append(imp_list)
        ####################################
        imp_list = []
        for imputation_method in data_list:
            dimred_list = []
            for dimred_method in imputation_method:
                labels = self.gmm_clustering(dimred_method)
                dimred_list.append(labels)
            imp_list.append(dimred_list)
            # ----------------------------------
        list_all.append(imp_list)
        ####################################
        ####################################

        return list_all

    def plot_dendrogram(self, model, **kwargs):
        """
        Plot the dendrogram of hierarchical clustering.
        Source of this function:
        https://scikit-learn.org/stable/auto_examples/cluster/plot_agglomerative_dendrogram.html

            :param model: the hierarchical clustering model to show its dendrogram.
        """

        counts = np.zeros(model.children_.shape[0])
        n_samples = len(model.labels_)

        for i, merge in enumerate(model.children_):
            current_count = 0

            for child_idx in merge:
                if child_idx < n_samples:
                    current_count += 1
                else:
                    current_count += counts[child_idx - n_samples]
            counts[i] = current_count

        linkage_matrix = np.column_stack([model.children_, model.distances_, counts]).astype(float)
        dendrogram(linkage_matrix, **kwargs)
