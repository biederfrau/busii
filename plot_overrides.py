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

colors = { "feedRateOvr": "mediumslateblue", "speedOvr": "mediumorchid", "actToolRadius": "lightslategray" }
units  = { "feedRateOvr": "percent",         "speedOvr": "percent",      "actToolRadius": "mm" }

with open(f) as fh:
    data = json.load(fh)

fig = plt.figure(figsize=(20, 4))
ax = fig.add_subplot(111)

times = [date2num(dateutil.parser.parse(t[0])) for t in data[thing]]
overrides = [t[1] for t in data[thing]]

if len(times) == 1:
    print("only one data point---cant do much. bye")
    exit(-1)

ax.step(times, overrides, color=colors[thing], where="post")

ax.xaxis_date()

ax.xaxis.set_minor_locator(dates.MinuteLocator(interval=5))
ax.xaxis.set_minor_formatter(dates.DateFormatter('%H:%M'))

ax.xaxis.set_major_locator(dates.HourLocator(interval=1))
ax.xaxis.set_major_formatter(dates.DateFormatter(''))

ax.set_title(Path(f).stem)

ax.set_xlabel("time")
ax.set_ylabel(units[thing])

plt.tight_layout()
plt.savefig(f"figures/{Path(f).stem}.pdf")

#  plt.show()
