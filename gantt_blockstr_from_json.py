#!/usr/bin/env python3

import matplotlib
import matplotlib.pyplot as plt

from sys import argv
import json

f = 'block_sections.json'
names = argv[1:]

with open(f) as fh:
    data = json.load(fh)

if len(names) == 1 and names[0] == 'all':
    names = sorted(data.keys(), reverse=True)

fig, ax = plt.subplots()
start, width = 5, (5000 - len(names)*10)/len(names)

end = 0
yticks = []
for name in names:
    print(name)
    chunks = [(t[0], t[1] - t[0]) for t in data[name]['sections']]

    end_ = chunks[-1]
    end_ = end_[0] + end_[1]
    end = max(end, end_)

    ax.broken_barh(chunks, (start, width), color=data[name]['color'])
    yticks.append((2*start + width)/2)
    start += width + 10

ax.set_ylim(0, 5000)
ax.set_xlim(0, end)

ax.set_xlabel('blocks')
ax.set_title('machining processes and their block numbers')

ax.set_yticks(yticks)
ax.set_yticklabels(names)

plt.savefig('blockstr_nocolor.svg')
plt.tight_layout()
plt.show()
