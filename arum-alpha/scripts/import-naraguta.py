"""Export the supplied workbook without changing signs, units, or cell order.

Usage: python scripts/import-naraguta.py ../Sheet168_Naraguta_K_Th_U_All_Data_FIXED.xlsx
Requires openpyxl. The generated files are committed for runtime/deployment.
"""
import hashlib
import json
import math
from pathlib import Path
import struct
import sys
import openpyxl

source = Path(sys.argv[1])
workbook = openpyxl.load_workbook(source, read_only=True, data_only=True)
grids = []
axes = None
for name in ('Potassium Grid', 'Thorium Grid', 'Uranium Grid'):
    rows = iter(workbook[name].values)
    eastings = list(next(rows)[1:])
    northings, values = [], []
    for row in rows:
        northings.append(row[0])
        values.extend(row[1:])
    assert all(isinstance(v, (int, float)) and math.isfinite(v) for v in values)
    if axes is None:
        axes = (eastings, northings)
    assert axes == (eastings, northings), 'Grid coordinates must align'
    grids.append(values)
assert all(x == eastings[0] + i * 125 for i, x in enumerate(eastings))
assert all(y == northings[0] + i * 125 for i, y in enumerate(northings))
output = Path(__file__).resolve().parents[1] / 'data'
payload = b''.join(struct.pack('<ddd', *values) for values in zip(*grids))
(output / 'naraguta.bin').write_bytes(payload)
metadata = dict(source=source.name, sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),
                dataSha256=hashlib.sha256(payload).hexdigest(), nx=len(eastings), ny=len(northings),
                minX=eastings[0], maxX=eastings[-1], minY=northings[0], maxY=northings[-1],
                spacing=125, crs='EPSG:32632', units='Not specified',
                sheets=['Potassium Grid', 'Thorium Grid', 'Uranium Grid'])
(output / 'naraguta.json').write_text(json.dumps(metadata, indent=2) + '\n')
print(f'Exported {len(grids[0])} aligned cells; preserved all workbook values as float64.')
