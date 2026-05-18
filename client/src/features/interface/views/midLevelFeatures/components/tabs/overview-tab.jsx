import { Card } from '@/components/ui/card';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import MetricCard from '../metric-card';

export default function OverviewTab({ data }) {
  
  const overviewMetrics = [
    {
      title: 'Tempo',
      value: data.tempo.toFixed(1),
      unit: 'BPM',
      description: 'Beats per minute',
      color: 'from-yellow-400 to-pink-500',
    },
    {
      title: 'Audio Duration',
      value: (data.Audio_Length / 60).toFixed(2),
      unit: 'minutes',
      description: 'Total audio length',
      color: 'from-yellow-400 to-pink-500',
    },
    {
      title: 'RMS Energy',
      value: data.rms.mean.toFixed(3),
      unit: 'normalized',
      description: 'Root mean square energy',
      color: 'from-yellow-400 to-pink-500',
    },
    {
      title: 'Zero Crossing Rate',
      value: data.zcr.mean.toFixed(3),
      unit: 'normalized',
      description: 'Signal noisiness indicator',
      color: 'from-yellow-400 to-pink-500',
    },
  ];

  const spectralMetrics = [
    {
      title: 'Spectral Centroid',
      value: data.spectral_centroid.mean.toFixed(1),
      unit: 'Hz',
      description: 'Brightness of sound',
      color: 'from-yellow-400 to-pink-500',
    },
    {
      title: 'Spectral Bandwidth',
      value: data.spectral_bandwidth.mean.toFixed(1),
      unit: 'Hz',
      description: 'Frequency spread',
      color: 'from-yellow-400 to-pink-500',
    },
    {
      title: 'Spectral Rolloff',
      value: data.spectral_rolloff.mean.toFixed(1),
      unit: 'Hz',
      description: 'High-frequency energy cutoff',
      color: 'from-yellow-400 to-pink-500',
    },
    {
      title: 'Spectral Flatness',
      value: data.spectral_flatness.mean.toFixed(4),
      unit: 'normalized',
      description: 'Spectral tonal quality',
      color: 'from-yellow-400 to-pink-500',
    },
  ];

  const chartData = [
    {
      name: 'RMS Energy',
      mean: parseFloat(data.rms.mean.toFixed(3)),
      std: parseFloat(data.rms.std.toFixed(3)),
    },
    {
      name: 'ZCR',
      mean: parseFloat(data.zcr.mean.toFixed(3)),
      std: parseFloat(data.zcr.std.toFixed(3)),
    },
  ];

  const spectralChartData = [
    {
      name: 'Spectral Centroid',
      value: parseFloat(
        (data.spectral_centroid.mean / 1000).toFixed(2)
      ),
    },
    {
      name: 'Spectral Bandwidth',
      value: parseFloat(
        (data.spectral_bandwidth.mean / 1000).toFixed(2)
      ),
    },
    {
      name: 'Spectral Rolloff',
      value: parseFloat(
        (data.spectral_rolloff.mean / 1000).toFixed(2)
      ),
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Main Metrics */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3 sm:mb-4">
          Audio Characteristics
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {overviewMetrics.map((metric, idx) => (
            <MetricCard key={idx} {...metric} />
          ))}
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Energy Analysis Chart */}
        <Card className="bg-card border border-border rounded-xl p-4 sm:p-6 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/10 transition-all">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
            Energy Analysis
          </h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3456" />
              <XAxis dataKey="name" stroke="#8b93b8" />
              <YAxis stroke="#8b93b8" />

              <Tooltip
                contentStyle={{
                  backgroundColor: '#151d3a',
                  border: '1px solid #2a3456',
                  borderRadius: '8px',
                  color: '#e0e8ff',
                }}
              />

              <Legend />

              <Bar dataKey="mean" fill="#00d9ff" radius={[8, 8, 0, 0]} />
              <Bar dataKey="std" fill="#7c3aed" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Spectral Features Chart */}
        <Card className="bg-card border border-border rounded-xl p-4 sm:p-6 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/10 transition-all">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
            Spectral Features (in kHz)
          </h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={spectralChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3456" />

              <XAxis
                dataKey="name"
                stroke="#8b93b8"
                angle={-45}
                textAnchor="end"
                height={100}
              />

              <YAxis stroke="#8b93b8" />

              <Tooltip
                contentStyle={{
                  backgroundColor: '#151d3a',
                  border: '1px solid #2a3456',
                  borderRadius: '8px',
                  color: '#e0e8ff',
                }}
              />

              <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Spectral Metrics */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3 sm:mb-4">
          Spectral Properties
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {spectralMetrics.map((metric, idx) => (
            <MetricCard key={idx} {...metric} />
          ))}
        </div>
      </div>

      {/* Spectral Contrast */}
      <Card className="bg-card border border-border rounded-xl p-4 sm:p-6 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/10 transition-all">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Spectral Contrast by Band
        </h3>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data.spectral_contrast.mean.map((val, idx) => ({
              band: `Band ${idx + 1}`,
              contrast: val,
            }))}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3456" />
            <XAxis dataKey="band" stroke="#8b93b8" />
            <YAxis stroke="#8b93b8" />

            <Tooltip
              contentStyle={{
                backgroundColor: '#151d3a',
                border: '1px solid #2a3456',
                borderRadius: '8px',
                color: '#e0e8ff',
              }}
            />

            <Bar
              dataKey="contrast"
              fill="#f59e0b"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}