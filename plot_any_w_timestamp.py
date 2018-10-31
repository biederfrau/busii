#!/usr/bin/env python3

import dateutil.parser
import datetime as dt

import matplotlib
import matplotlib.pyplot as plt

import matplotlib.dates as dates
from matplotlib.dates import date2num

import numpy as np

from sys import argv, exit
import json

from scipy.interpolate import spline

f = argv[1]

with open(f) as fh:
    data = json.load(fh)

fig = plt.figure()
fig.suptitle(f)

for idx, axis in enumerate(['X', 'Y', 'Z']):
    times = [date2num(dateutil.parser.parse(t[0])) for t in data[axis]]
    points = [t[1] for t in data[axis]]

    ax = fig.add_subplot(3, 1, idx + 1)
    ax.scatter(times, points)

    ax.set_title(axis)
    ax.xaxis_date()

    ax.xaxis.set_minor_locator(dates.MinuteLocator(interval=10))
    ax.xaxis.set_minor_formatter(dates.DateFormatter('%H:%M'))

    ax.xaxis.set_major_locator(dates.HourLocator(interval=1))
    ax.xaxis.set_major_formatter(dates.DateFormatter(''))

plt.tight_layout()
plt.show()
