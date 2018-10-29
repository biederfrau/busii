#!/usr/bin/env python3

import pandas as pd
from matplotlib import pyplot as plt

from mpl_toolkits.mplot3d import Axes3D

import sys

data = pd.read_csv(sys.argv[1])

fig = plt.figure()
ax = fig.add_subplot(111, projection="3d")

ax.scatter(data['X'], data['Y'], data['Z'])
ax.set_xlabel("x")
ax.set_ylabel("y")
ax.set_zlabel("z")
ax.set_title(sys.argv[1])

plt.show()
