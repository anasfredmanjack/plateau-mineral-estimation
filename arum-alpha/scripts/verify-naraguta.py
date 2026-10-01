"""Independently compare every deployed value and coordinate with the source Excel file."""
import json
from pathlib import Path
import struct
import sys
import openpyxl

book = openpyxl.load_workbook(sys.argv[1], read_only=True, data_only=True)
directory = Path(__file__).resolve().parents[1] / 'data'
metadata = json.loads((directory / 'naraguta.json').read_text())
payload = (directory / 'naraguta.bin').read_bytes()
count = 0
for channel, name in enumerate(('Potassium Grid', 'Thorium Grid', 'Uranium Grid')):
    rows = iter(book[name].values)
    header = next(rows)
    assert list(header[1:]) == [metadata['minX'] + c * 125 for c in range(metadata['nx'])]
    for r, row in enumerate(rows):
        assert row[0] == metadata['minY'] + r * 125
        for c, expected in enumerate(row[1:]):
            actual, = struct.unpack_from('<d', payload, (r * metadata['nx'] + c) * 24 + channel * 8)
            assert actual == expected, (name, r + 2, c + 2, actual, expected)
            count += 1
assert count == 582114
print(f'Verified exact equality of all {count:,} Excel values and all coordinate axes.')
