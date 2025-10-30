const $ = require('jquery');
const React = require('react');

module.exports = React.createClass({
  getInitialState() {
    return {
      rates: {},
      conversion: 'EUR',
      base: 0,
      converted: 0
    };
  },

  getRates() {
    $.getJSON('http://api.fixer.io/latest?base=gbp', (res) => {
      this.setState({
        rates: res.rates
      });
    });
  },

  componentDidMount() {
    this.getRates();
  },

  selectConversion(e) {
    this.setState({ conversion: e.target.value }, () => {
      this.convertCurrency();
    });
  },

  convertCurrency(e) {
    let val = this.state.base;
    if(e && e.target) {
      val = e.target.value;
    }
    const rate = this.state.rates[this.state.conversion];

    this.setState({
      base: val || '',
      converted: (parseInt(val) || 0) * rate
    });
  },

  render: function() {
    return (
      <div className='currency-converter'>
        <form className="form-horizontal">
          <div className="form-group">
            <div className="column-left col-md-6">
              <input className='form-control' disabled value='GBP' type='text'/>
            </div>
            <div className="column-right col-md-6">
              <input type='text' className="form-control" onChange={this.convertCurrency} value={this.state.base} />
            </div>
          </div>

          <div className="form-group">
            <div className="column-left col-md-6">
              <select className="form-control" onChange={this.selectConversion}>
                <option value="EUR">Euro</option>
                <option value="USD">US Dollar</option>
              </select>
            </div>
            <div className="column-right col-md-6">
              <input type='text' className="form-control" label={this.state.conversion} onChange={this.convertCurrency} value={this.state.converted} />
            </div>
          </div>
        </form>
      </div>
    );
  }
});
