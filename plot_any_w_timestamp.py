#!/usr/bin/env python3

import dateutil.parser
import datetime as dt

import matplotlib
import matplotlib.pyplot as plt

import matplotlib.dates as dates
from matplotlib.dates import date2num

import numpy as np

from sys import argv, exit
from os import path
import json

import itertools

def pairwise(iterable):
    a, b = itertools.tee(iterable)
    next(b, None)
    return zip(a, b)

f = argv[1]

thing = path.basename(f).split('_')[0]
colors = { "aaTorque": "tomato", "aaLoad": "mediumseagreen", 'feedRateOvr': 'deepskyblue' }

with open(f) as fh:
    data = json.load(fh)

fig = plt.figure()

if len(data.keys()) > 1: fig.suptitle(path.basename(f))

for idx, axis in enumerate(sorted(data.keys())):
    times = [date2num(dateutil.parser.parse(t[0])) for t in data[axis]]
    points = [t[1] for t in data[axis]]

    for a, b in pairwise(enumerate(times)):
        diff = b[1] - a[1]

        if diff > 0.0001:
            points[a[0]] = float('nan')
            points[b[0]] = float('nan')

    ax = fig.add_subplot(len(data.keys()), 1, idx + 1)
    ax.plot(times, points, linewidth=0.3, color=colors[thing])

    ax.set_title(axis)
    ax.xaxis_date()

    ax.xaxis.set_minor_locator(dates.MinuteLocator(interval=10))
    ax.xaxis.set_minor_formatter(dates.DateFormatter('%H:%M'))

    ax.xaxis.set_major_locator(dates.HourLocator(interval=1))
    ax.xaxis.set_major_formatter(dates.DateFormatter(''))

plt.tight_layout()
plt.show()
