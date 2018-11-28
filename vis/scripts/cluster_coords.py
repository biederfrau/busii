#!/usr/bin/env python3

import numpy as np
import pandas as pd
import sys
import sklearn
import sklearn.cluster
import json
import os

from pathlib import Path

import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D

def assign(centroids, points):
    assignments = []
    for pt in points:
        dist = []
        for centroid in centroids:
            dist.append(np.dot(pt - centroid, pt - centroid))

        assignments.append(np.argmin(dist))

    return assignments

data = pd.read_csv(sys.argv[1]).values
n = min(600, len(data))

clustering = sklearn.cluster.KMeans(n_clusters=n).fit(data)
centroids = clustering.cluster_centers_

assignments = assign(centroids, data)
clusters = [{ "centroid": list(c), "points": [] } for c in centroids]

for point, cluster in zip(data, assignments):
    clusters[cluster]["points"].append(list(point))

proc_id = Path(sys.argv[1]).stem
path = f"../data/{proc_id}/"
Path(path).mkdir(parents=True, exist_ok=True)

json.dump(clusters, fp=open(path + '/cluster_coords.json', 'w+'))
