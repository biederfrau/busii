#!/usr/bin/env python3

import pandas as pd
import sys
import sklearn
import sklearn.cluster

import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D

data = pd.read_csv(sys.argv[1])
clustering = sklearn.cluster.KMeans(n_clusters=400).fit(data)
centroids = clustering.cluster_centers_

fig = plt.figure()
ax = fig.add_subplot(111, projection="3d")

ax.scatter(centroids[:, 0], centroids[:, 1], centroids[:, 2])

plt.tight_layout()
plt.show()
