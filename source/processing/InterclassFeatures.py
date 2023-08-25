import itertools

from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
from sklearn.linear_model import SGDClassifier

import pandas as pd

TF = 20


class InterclassFeatures(object):
    """
        A class for calculating interclass features that are the most distinct between clusters.
    """

    def calculate_interclass_features(self, clf, data, labels):
        """
        Calculate interclass features with the high dimensional data and cluster labels.

            :param clf: the data classifier.
            :param data: the high dimensional data.
            :param labels: the labels resulting from clustering the low dimensional data.
            :return: a list of interclass features between each two clusters.
        """
        labels_string = 'labels'
        unique_labels = data[labels_string].explode().unique()
        pairwise_labels = list(itertools.combinations(unique_labels, 2))

        res = pd.DataFrame()

        for i in range(len(pairwise_labels)):
            class1 = pairwise_labels[i][0]
            class2 = pairwise_labels[i][1]
            data_pairwise_classes = data[(data[labels_string] == class1) | (
                data[labels_string] == class2)]

            # at least three datapoints left
            if data_pairwise_classes.shape[0] > 2:
                clf.fit(data_pairwise_classes.to_numpy(),
                        data_pairwise_classes[labels_string])
                weights = pd.DataFrame(data=clf.coef_, columns=data.columns)
                res[pairwise_labels[i]] = weights.T

        # remove labels row from res
        res = res.drop(labels_string)

        return res.sort_index(ascending=True)

    def get_features_by_LDA_classifier(self, data, labels):
        """
        Apply LDA pairwise on each two classes and return the features discriminating among them.

            :param data: the dataframe of the high dimensional data including their labels.
            :param labels: the labels of the dataframe.
            :return: the dataframe that contains the LDA features per pairwise clusters.
        """
        clf = LinearDiscriminantAnalysis()
        res = self.calculate_interclass_features(clf, data, labels)
        return res

    def get_features_by_SGD_classifier(self, data, labels):
        """
        Apply SGD pairwise on each two classes and return the features discriminating among them.

            :param data: the dataframe of the high dimensional data including their labels.
            :param labels: the labels of the dataframe.
            :return: the dataframe that contains the SGD features per pairwise clusters.
        """
        clf = SGDClassifier(loss='log_loss', penalty='l1', l1_ratio=0.9,
                            learning_rate='optimal', shuffle=False, n_jobs=3, fit_intercept=True)

        res = self.calculate_interclass_features(clf, data, labels)
        return res
