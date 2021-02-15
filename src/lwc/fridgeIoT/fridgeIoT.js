import { api, LightningElement, track } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import { chartConfig } from './chartConfig';
import chartjs from '@salesforce/resourceUrl/chartJs';

export default class Fridge extends LightningElement {
    @track chartJsConfig = chartConfig;
    @track wsData = [];
    @api wss_url;
    buttonLabel = 'Pause';
    chart;
    error;
    firstDevice;

    _isInitialized = false;
    _updateChart = true;

    renderedCallback() {
        if (this._isInitialized) {
            return;
        }
        this._isInitialized = true;

        loadScript(this, chartjs)
            .then(() => {
                const canvas = document.createElement('canvas');
                this.template.querySelector('div.chart').appendChild(canvas);
                const ctx = canvas.getContext('2d');
                this.chart = new window.Chart(ctx, this.chartJsConfig);
                
                const ws = new window.WebSocket(this.wss_url);

                const that = this;

                ws.onopen = (event) => {
                    console.log("[wss] Connection established.");
                }

                ws.onclose = (event) => {
                    console.log("[wss] Connection closed.");
                }

                ws.onmessage = (event) => {
                    if (!that._updateChart) return;
                    const e = JSON.parse(event.data);
                    console.log(e);
                    that.wsData.push(e);
                    that.chart.data.datasets[0].data.push(e.power);
                    that.chart.data.datasets[1].data.push(e.temperature);
                    that.chart.data.datasets[2].data.push(e.humidity);
                    if (that.chart.data.datasets[0].data.length > 10) {
                        that.chart.data.datasets[0].data.splice(0, 1);
                        that.chart.data.datasets[1].data.splice(0, 1);
                        that.chart.data.datasets[2].data.splice(0, 1);
                    }
                    that.chart.update();
                };
            })
            .catch((error) => {
                that.error = error;
            });
    }

    handleButtonClick() {
        this.buttonLabel = this._updateChart ? 'Resume' : 'Pause';
        this._updateChart = !this._updateChart;
    }


}
