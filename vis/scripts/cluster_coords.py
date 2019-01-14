#!/usr/bin/env python3

import numpy as np
import pandas as pd
import sys
import sklearn
import sklearn.cluster
import json
import os
from math import isnan

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

try:
    clustering = sklearn.cluster.KMeans(n_clusters=n).fit(points)
    centroids = clustering.cluster_centers_
except:
    centroids = []

assignments = assign(centroids, points)
clusters = [{ "centroid": list(c), "points": [], "times": [], "tools": set() } for c in centroids]

print(data["TOOL"])
for point, cluster, time, tool in zip(points, assignments, data["T"], data["TOOL"]):
    clusters[cluster]["points"].append(list(point))
    clusters[cluster]["times"].append(dateutil.parser.parse(time))

    if tool != 'none':
        clusters[cluster]["tools"].add(tool)

clusters = [cluster for cluster in clusters if len(cluster["points"]) > 0]

for idx, cluster in enumerate(clusters):
    clusters[idx]["min_time"] = min(cluster["times"])
    clusters[idx]["tools"] = list(cluster["tools"])

path = Path(sys.argv[1]).parent
json.dump(clusters, fp=open(f"{path}/cluster_coords.json", 'w+'), default=json_serial)
