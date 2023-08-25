from enum import Enum


class DimReduction(Enum):
    """
    Dimensionality reduction methods provided:
        UMAP: uniform manifold approximation and projection
        PCA: principal component analysis
        TSNE: t-distributed stochastic neighbor embedding
        MDS: multidimensional scaling
        FAMD: factor analysis of mixed data
    """
    UMAP = 'UMAP'
    PCA = 'PCA'
    TSNE = 'T-SNE'
    MDS = 'MDS'
    FAMD = 'FAMD'


class Imputation(Enum):
    """
    Imputation methods provided:
        BEST: identify the best method based on the evaluation on a complete data subset.
        MICE: multiple imputation by chained equations
        KNN: k-nearest neighbors imputation algorithm
        CONST: impute all values by the constant `-1`
        HCONST: impute all values by the constant `1000`
        NOIMP: do not impute any missing values
        COMPL: show only the complete data subset with no missingness
    """
    BEST = 'BEST'
    MICE = 'MICE'
    KNN = 'KNN'
    CONST = 'CONST'
    HCONST = 'HCONST'
    NOIMP = 'NOIMP'
    COMPL = 'COMPL'


class OutlierRemoval(Enum):
    """
    Outlier removal options:
        NO (default): no outlier removal applied on the data
        GLOBAL: global outliers are identified and removed
        LOCAL: local outliers are identified and removed
    """
    NO = 'NO'
    GLOBAL = 'GLOBAL'
    LOCAL = 'LOCAL'


class Clustering(Enum):
    """
    Clustering methods provided:
        KMEANS: k-means algorithm
        MSHIFT: mean-shift algorithm
        HIERA4: hierarchical clustering with 4 clusters
        HIERA6: hierarchical clustering with 6 clusters
        DBSCAN: density-based spatial clustering of applications with noise
        OPTICS: ordering points to identify the clustering structure
        GMM: Gaussian mixture models
    """
    KMEANS = 'KMEANS'
    MSHIFT = 'M-SHIFT'
    HIERA4 = 'HIERA-4'
    HIERA6 = 'HIERA-6'
    DBSCAN = 'DBSCAN'
    OPTICS = 'OPTICS'
    GMM = 'GMM'


class Scaling(Enum):
    """
    Data scaling methods provided:
        NORM: data normalization
        STAND: data standardization
    """
    NORM = 'NORM'
    STAND = 'STAND'
