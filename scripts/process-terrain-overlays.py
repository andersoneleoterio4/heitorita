"""Project the additional KML layers into the existing terrain CRS."""
import json
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

sys.path.insert(0, '.terrain-tools')
from rasterio.warp import transform

root = Path('.')
meta = json.loads((root / 'assets/terrain-metadata.json').read_text())
layers = []
for filename, geometry, color in [
    ('Poligonal_ANM', 'LineString', '#ff4040'),
    ('Nova_Frente_de_Lavra', 'Point', '#a8ef74'),
]:
    xml = ET.parse(root / 'assets' / (filename + '.kml'))
    coordinates = xml.find('.//{*}' + geometry + '/{*}coordinates')
    coords = [list(map(float, item.split(','))) for item in coordinates.text.split()]
    east, north = transform('EPSG:4326', meta['crs'],
                            [c[0] for c in coords], [c[1] for c in coords])
    left, bottom, right, top = meta['bounds']
    assert all(left <= x <= right and bottom <= y <= top for x, y in zip(east, north))
    layers.append(dict(name=filename, type=geometry, color=color,
                       coordinates=list(map(list, zip(east, north)))))
(root / 'assets/terrain-overlays.json').write_text(json.dumps(layers, indent=2), encoding='utf8')
print('Projected layers:', ', '.join(layer['name'] for layer in layers))
