import React, {Component} from 'react';

import Map from './Map';

import './App.css';
import '../node_modules/leaflet/dist/leaflet.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <Map />
      </div>
    );
  }
}

export default App;
