import React, {Component} from 'react';
import L from 'leaflet';
import rbush from 'rbush';

import './Map.css';
import locations from './locations.json';
import foggeo from './foggeo.json'

window.L = L;

function getFog(tree, blockSize, {minX, minY, maxX, maxY}) {
    console.log('getFog', arguments)
    var numRows = Math.ceil((maxY - minY) / blockSize);
    var numCols = Math.ceil((maxX - minX) / blockSize);

    var polygons = [];
    var collisions = 0;
    for (var i = 0; i < numRows; i++) {
        var y = maxY - ((blockSize/2) * ((i * 2) + 1));
        for (var j = 0; j < numCols; j++) {
            var x = minX + ((blockSize/2) * ((j * 2) + 1));
            var cell = {
                minX: x - (blockSize/2),
                maxX: x + (blockSize/2),
                minY: y - (blockSize/2),
                maxY: y + (blockSize/2),
            };
            var collides = tree.collides(cell);
            if (!collides) {
                polygons.push([[
                    [cell.minX, cell.minY],
                    [cell.minX, cell.maxY],
                    [cell.maxX, cell.maxY],
                    [cell.maxX, cell.minY],
                    [cell.minX, cell.minY],
                ]]);
            } else {
                collisions++;
            }
        }
    }
    return {"type": "MultiPolygon", "coordinates": polygons};
}


export default class Map extends Component {
  componentDidMount() {
    window.Map = this;

    this.map = window.map = L.map(this.div).setView({lat: 30.269816443963105, lng: -97.7493739128113}, 18);

    L.tileLayer('https://api.tiles.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoib2lqd29pcmloIiwiYSI6ImNpdmhjcXMyaDAxZXYyeGxta2d1NXVpYWgifQ.7PtQ8CDSWWjY417qr5P_yA', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
      })
      .addTo(this.map);

    this.map.on('zoomend', () => this.draw());
    this.map.on('dragend', () => this.draw());

    this.tree = rbush().fromJSON(locations);
    console.log('built tree', this.tree)

    this.draw();
  }

  draw = () => {
    console.log('draw')

    const bounds = this.map.getBounds();
    const zoom = this.map.getZoom()
    const blockSize = {
      18: 0.0001,
      17: 0.0005,
      16: 0.0008,
      15: 0.001,
      14: 0.002,
      13: 0.003,
      12: 0.006,
      11: 0.009,
      10: 0.03,
      9: 0.06,
      8: 0.09,
      7: 0.2,
      6: 0.4,
      5: 0.9,
      4: 1.7,
      3: 3.1,
      2: 6,
      1: 12,
      0: 24,
    }[zoom];
    const fog = window.fog = getFog(this.tree, blockSize, {minX: bounds.getSouthWest().lng, minY: bounds.getSouthWest().lat, maxX: bounds.getNorthEast().lng, maxY: bounds.getNorthEast().lat})

    console.log(fog)

    if (this.fogLayer) {
      this.fogLayer.clearLayers();
      this.fogLayer.addData(fog);
    }
    else {
      this.fogLayer = L.geoJson(fog, {onEachFeature: this.onEachFog}).addTo(this.map);
    }

  }

  onEachFog = (feature, layer) => {
    layer.setStyle({
      interactive: false,
      className: 'fog'
    });
  }

  render() {
    return (
      <div ref={(el) => this.div = el} className="Map">

      </div>
    );
  }
}
