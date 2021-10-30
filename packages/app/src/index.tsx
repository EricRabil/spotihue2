import React from 'react';
import ReactDOM from 'react-dom';
import { store } from './app/store';
import { Provider } from 'react-redux';
import App from './App';
import { SpotihueStream } from "./api";
import { reloadAll, bindToSpotihueStream } from "./app/connection";
import axios from 'axios';

const host = process.env.NODE_ENV === "development" ? "localhost" : window.location.hostname;

axios.defaults.baseURL = `http://${host}:9282`;
const stream = new SpotihueStream(`ws://${host}:9283`);

declare global {
  interface Window {
    stream: SpotihueStream;
  }
}

window.stream = stream;

bindToSpotihueStream(stream);

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);
