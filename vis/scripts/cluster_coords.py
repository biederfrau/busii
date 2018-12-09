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

from collections import defaultdict

import dateutil.parser

from datetime import date, datetime

def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""

    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError ("Type %s not serializable" % type(obj))

def assign(centroids, points):
    assignments = []
    for pt in points:
        dist = []
        for centroid in centroids:
            dist.append(np.dot(pt - centroid, pt - centroid))

        assignments.append(np.argmin(dist))

    return assignments

data = pd.read_csv(sys.argv[1])
points = data[["X", "Y", "Z"]].values
n = min(600, len(data))

clustering = sklearn.cluster.KMeans(n_clusters=n).fit(points)
centroids = clustering.cluster_centers_

assignments = assign(centroids, points)
clusters = [{ "centroid": list(c), "points": [], "times": [] } for c in centroids]

for point, cluster, time in zip(points, assignments, data["T"]):
    clusters[cluster]["points"].append(list(point))
    clusters[cluster]["times"].append(dateutil.parser.parse(time))

for idx, cluster in enumerate(clusters):
    clusters[idx]["min_time"] = min(cluster["times"])

proc_id = Path(sys.argv[1]).stem
path = f"../data/{proc_id}/"
Path(path).mkdir(parents=True, exist_ok=True)

json.dump(clusters, fp=open(path + '/cluster_coords.json', 'w+'), default=json_serial)
