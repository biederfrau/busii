#!/usr/bin/env python3

import pandas as pd
from matplotlib import pyplot as plt

from mpl_toolkits.mplot3d import Axes3D
import seaborn as sns

import sys

data = pd.read_csv(sys.argv[1])

fig = plt.figure()
ax = fig.add_subplot(111, projection="3d")

cmap = sns.light_palette("navy", as_cmap=True)

pts = ax.scatter(data['X'], data['Y'], data['Z'], c=range(0, data.shape[0]), cmap=cmap)
ax.set_xlabel("x")
ax.set_ylabel("y")
ax.set_zlabel("z")
ax.set_title(sys.argv[1])

fig.colorbar(pts)

plt.tight_layout()
plt.show()
