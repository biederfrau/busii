#!/usr/bin/env python3

import dateutil.parser
import datetime as dt

import matplotlib as mpl
import matplotlib.pyplot as plt

import matplotlib.dates as dates
from matplotlib.dates import date2num

import numpy as np

from sys import argv, exit
from pathlib import Path
import json

import itertools

def pairwise(iterable):
    a, b = itertools.tee(iterable)
    next(b, None)
    return zip(a, b)

mpl.rcParams['timezone'] = 'Europe/Vienna'

f = argv[1]

thing = Path(f).stem.split('_')[0]
colors = { "aaTorque": "tomato", "aaLoad": "mediumseagreen", "aaVactB": "darkorange" }
units =  { "aaTorque": "Nm",     "aaLoad": "percent",        "aaVactB": "mm/min" }

with open(f) as fh:
    data = json.load(fh)

fig = plt.figure(figsize=(10, 8))

if len(data.keys()) > 1: fig.suptitle(Path(f).stem)

for idx, axis in enumerate(sorted(data.keys())):
    times = [date2num(dateutil.parser.parse(t[0])) for t in data[axis]]
    points = [t[1] for t in data[axis]]

    if len(times) == 1:
        print("only one data point---can't do much. bye")
        exit(-1)

    for a, b in pairwise(enumerate(times)):
        diff = b[1] - a[1]

        if diff > 0.0001:
            points[a[0]] = float('nan')
            points[b[0]] = float('nan')

    ax = fig.add_subplot(len(data.keys()), 1, idx + 1)
    ax.plot(times, points, linewidth=0.3, color=colors[thing])

    ax.set_title(axis)
    ax.xaxis_date()

    ax.set_xlabel("time")
    ax.set_ylabel(units[thing])

    ax.xaxis.set_minor_locator(dates.MinuteLocator(interval=10))
    ax.xaxis.set_minor_formatter(dates.DateFormatter('%H:%M'))

    ax.xaxis.set_major_locator(dates.HourLocator(interval=1))
    ax.xaxis.set_major_formatter(dates.DateFormatter(''))

plt.tight_layout()
plt.savefig(f"figures/{Path(f).stem}.pdf")

plt.show()
