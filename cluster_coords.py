#!/usr/bin/env python3

import pandas as pd
import sys
import sklearn
import sklearn.cluster

from pathlib import Path

import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D

n = 600
data = pd.read_csv(sys.argv[1])
clustering = sklearn.cluster.KMeans(n_clusters=n, n_jobs=-1).fit(data)
centroids = clustering.cluster_centers_

fig = plt.figure(figsize=(16, 6))
ax = fig.add_subplot(121, projection="3d")
ax.scatter(data['X'], data['Y'], data['Z'])
ax.set_title("all points")

ax = fig.add_subplot(122, projection="3d")
ax.scatter(centroids[:, 0], centroids[:, 1], centroids[:, 2])
ax.set_title(f"compressed to {n} points by k-means")

plt.savefig(f"figures/compress_{Path(sys.argv[1]).stem}.pdf")

plt.tight_layout()
#  plt.show()
