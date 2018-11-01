#!/usr/bin/env python3

import dateutil.parser
import datetime as dt

import matplotlib as mpl
import matplotlib.pyplot as plt

import matplotlib.dates as dates
from matplotlib.dates import date2num

import numpy as np

from sys import argv, exit
from os import path
import json

mpl.rcParams['timezone'] = 'Europe/Vienna'

f = argv[1]
thing = path.basename(f).split('_')[0]

colors = { "feedRateOvr": "mediumslateblue", "speedOvr": "mediumorchid" }

with open(f) as fh:
    data = json.load(fh)

fig = plt.figure()
ax = fig.add_subplot(111)

times = [date2num(dateutil.parser.parse(t[0])) for t in data[thing]]
overrides = [t[1] for t in data[thing]]

ax.step(times, overrides, color=colors[thing])

ax.xaxis_date()

ax.xaxis.set_minor_locator(dates.MinuteLocator(interval=10))
ax.xaxis.set_minor_formatter(dates.DateFormatter('%H:%M'))

ax.xaxis.set_major_locator(dates.HourLocator(interval=1))
ax.xaxis.set_major_formatter(dates.DateFormatter(''))

ax.set_title(path.basename(f))

plt.tight_layout()
plt.show()
