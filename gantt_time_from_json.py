#!/usr/bin/env python3

import dateutil.parser
import datetime as dt
import matplotlib.pyplot as plt
import matplotlib.dates as dates
from matplotlib.dates import date2num

from math import inf

from sys import argv
import json

f = 'processed_data/time_sections.json'
names = argv[1:]

with open(f) as fh:
    data = json.load(fh)

if len(names) == 1 and names[0] == 'all':
    names = sorted(data.keys(), reverse=True)

fig, ax = plt.subplots()
start, width = 5, (500 - len(names)*10)/len(names)

begin, end = inf, -inf

yticks = []
for name in names:
    chunks = [(date2num(dateutil.parser.parse(t[0])), date2num(dateutil.parser.parse(t[1]))) for t in data[name]['sections']]

    begin = min(begin, chunks[0][0])
    end = max(end, chunks[-1][1])

    chunks = [(t[0], t[1] - t[0]) for t in chunks]

    ax.broken_barh(chunks, (start, width), color=data[name]['color'])
    yticks.append((2*start + width)/2)
    start += width + 10

ax.set_ylim(0, 500)
ax.set_xlim(begin, end)

ax.set_yticks(yticks)
ax.set_yticklabels(names)

ax.xaxis_date()
ax.xaxis.set_minor_locator(dates.HourLocator(interval=4))
ax.xaxis.set_minor_formatter(dates.DateFormatter('%H:%M'))

ax.xaxis.set_major_locator(dates.DayLocator(interval=1))
ax.xaxis.set_major_formatter(dates.DateFormatter('\n%a, %d-%m-%Y'))

plt.savefig("a.svg")
plt.show()
