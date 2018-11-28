#!/usr/bin/env python3

import sys
import json

from pathlib import Path

proc = sys.argv[1]
time_sections = json.load(open('../../processed_data/time_sections.json'))

path = f"../data/{proc}"
Path(path).mkdir(parents=True, exist_ok=True)

json.dump(time_sections[proc], fp=open(path + '/activities.json', 'w+'))
