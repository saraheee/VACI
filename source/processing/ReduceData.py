import source.processing.DataFrameOps as dfo
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE, MDS
from source.Options import Opt

import prince
import pandas as pd
import umap


class ReduceData(object):
    """
        A class for reducing the dimensionality of the data.
    """

    def get_reduced_data(self, data_list):
        """
        Apply all dimensionality reduction methods on a list of dataframes and
        return the results of all methods. Consider only columns with numerical
        features. In our data, the result is a 2D list with the size 3x4 from
        three imputation methods and four dimensionality reduction methods.

            :param data_list: the list of dataframes to reduce their dimensionality.
            :return: the 2D list that contains all dataframes with a reduced dimensionality
            by all methods.
        """
        reduced_data_list = []
        mask = dfo.get_all_numeric_features(data_list[0])

        for data in data_list:
            umap = self.apply_umap(data[mask.columns])
            pca = self.apply_pca(data[mask.columns])
            tsne = self.apply_tsne(data[mask.columns])
            mds = self.apply_mds(data[mask.columns])
            famd = self.apply_famd(data)
            reduced_data_list.append([umap, pca, tsne, mds, famd])

        return reduced_data_list

    def apply_umap(self, data):
        """
        Reduce the dimensionality of the data by applying
        Uniform Manifold Approximation and Projection (UMAP)
        on the dataframe.

            :param data: the dataframe to reduce its dimensionality.
            :return: the dataframe with reduced dimensionality.
        """
        model = umap.UMAP(init='random', metric='euclidean',
                          min_dist=0.1, random_state=42, n_components=2)
        mask = dfo.get_all_numeric_features(data)
        embedding = model.fit_transform(data[mask.columns])

        return pd.DataFrame(data=embedding, columns=['u1', 'u2'])

    def apply_pca(self, data):
        """
        Reduce the dimensionality of the data by applying
        Principal Component Analysis (PCA) on the dataframe.

            :param data: the dataframe to reduce its dimensionality.
            :return: the dataframe with reduced dimensionality.
        """
        pca = PCA(n_components=2, random_state=2)
        principalComponents = pca.fit_transform(data)

        return pd.DataFrame(data=principalComponents, columns=['p1', 'p2'])

    def apply_pca_50(self, data):
        """
        Reduce the dimensionality of the data by applying
        Principal Component Analysis (PCA) with 50 components
        on the dataframe.

            :param data: the dataframe to reduce its dimensionality.
            :return: the dataframe with reduced dimensionality.
        """
        pca = PCA(n_components=50)
        principalComponents = pca.fit_transform(data)
        return pd.DataFrame(data=principalComponents)

    def apply_tsne(self, data):
        """
        Reduce the dimensionality of the data by applying
        T-distributed Stochastic Neighbor Embedding (TSNE)
        on the dataframe.

            :param data: the dataframe to reduce its dimensionality.
            :return: the dataframe with reduced dimensionality.
        """
        numb_components = round(min(len(data.index), len(data.columns)) / 2)

        # print(data)
        # print("TSNE COMPONENTS: ", numb_components)

        pca = PCA(n_components=numb_components,
                  svd_solver='auto', random_state=2)
        pca_result = pca.fit_transform(data)

        # self.test_perplexity_for_tsne(4, 10, 1, pca_result_40)

        tsne = TSNE(init='pca', random_state=2, n_components=2, verbose=0, learning_rate='auto',
                    perplexity=min(8, numb_components), n_iter=400).fit_transform(pca_result)

        return pd.DataFrame(data=tsne)

    def test_perplexity_for_tsne(self, min, max, step, pca_comp):
        """Test different perplexity values for tsne in the defined range
        with the defined step size and write the result to a file.

            :param min: the minimum perplexity value to test.
            :param max: the maximum perplexity value that is excluded from testing.
            :param step: the step size between the min and max perplexity values.
            :param pca_comp: the pca result to use for the initialization.
        """
        for perplex in range(min, max, step):
            tsne = TSNE(init='pca', random_state=2, n_components=2, verbose=0, learning_rate='auto',
                        perplexity=perplex, n_iter=400).fit_transform(pca_comp)

    def apply_famd(self, data):
        """
        Reduce the dimensionality of the data by applying
        Factor analysis of mixed data (FAMD) on the dataframe.

            :param data: the dataframe to reduce its dimensionality.
            :return: the dataframe with reduced dimensionality.
        """
        famd = prince.FAMD(n_components=2, n_iter=3, copy=True,
                           check_input=True, engine='auto', random_state=42)

        if Opt.idx in data:
            data.drop(Opt.idx, axis=1, inplace=True)
        if Opt.cohort_number in data:
            data.drop(Opt.cohort_number, axis=1, inplace=True)
        famd = famd.fit(data)
        coords = famd.row_coordinates(data)

        return coords

    def apply_mds(self, data):
        """
        Reduce the dimensionality of the data by applying
        Multi-Dimension Scaling (MDS) on the dataframe.

            :param data: the dataframe to reduce its dimensionality.
            :return: the dataframe with reduced dimensionality.
        """
        embedding = MDS(n_components=2, random_state=42)
        mds = embedding.fit_transform(data)

        return pd.DataFrame(data=mds)
