import { Activity, AlertCircle, BrainCircuit, Database, LineChart } from 'lucide-react';

export function ModelPerformanceView() {
  return (
    <div className="metro-secondary-page">
      <div className="metro-secondary-heading"><span className="metro-panel-icon"><BrainCircuit size={19} /></span><div><h1>Model performance</h1><p>Inference and evaluation status for passenger crowd forecasting</p></div></div>
      <section className="metro-dashboard-panel metro-performance-state">
        <span className="metro-performance-mark"><AlertCircle size={23} /></span>
        <div><h2>Performance metrics are not connected</h2><p>The frontend currently has no prediction or model-evaluation API contract. It does not show simulated values as live model performance.</p></div>
      </section>
      <div className="metro-performance-grid">
        <section className="metro-dashboard-panel"><span className="metro-performance-tile-icon"><Activity size={18} /></span><h2>Inference status</h2><p>Unavailable — no inference interface is exposed to this frontend.</p></section>
        <section className="metro-dashboard-panel"><span className="metro-performance-tile-icon"><LineChart size={18} /></span><h2>Evaluation metrics</h2><p>Unavailable — no evaluation dataset or metric response is connected here.</p></section>
        <section className="metro-dashboard-panel"><span className="metro-performance-tile-icon"><Database size={18} /></span><h2>Required integration</h2><p>A documented prediction and evaluation contract is needed before live performance can be reported.</p></section>
      </div>
    </div>
  );
}
