#!/usr/bin/env python3

import pandas as pd
import sys
import sklearn
import sklearn.cluster

import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D

n = 600
data = pd.read_csv(sys.argv[1])
clustering = sklearn.cluster.KMeans(n_clusters=n).fit(data)
centroids = clustering.cluster_centers_

fig = plt.figure()
ax = fig.add_subplot(121, projection="3d")
ax.scatter(data['X'], data['Y'], data['Z'])
ax.set_title("all points")

ax = fig.add_subplot(122, projection="3d")
ax.scatter(centroids[:, 0], centroids[:, 1], centroids[:, 2])
ax.set_title(f"compressed to {n} points by k-means")

plt.tight_layout()
plt.show()
