'use strict';

var React = require('react');
var ReactDOM = require('react-dom');
var Converter = require('./Converter');

ReactDOM.render(React.createElement(Converter, null), document.getElementById('demo'));