import { Card } from '@/components/ui/card';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';

export default function MfccTab({ data }) {
  // Prepare MFCC Delta Mean data
  const mfccDeltaMeanData = data.mfcc_delta.mean.map((val, idx) => ({
    coefficient: `MFCC ${idx + 1}`,
    value: parseFloat((val * 1000).toFixed(2)),
  }));

  // Prepare MFCC Delta Std data
  const mfccDeltaStdData = data.mfcc_delta.std.map((val, idx) => ({
    coefficient: `MFCC ${idx + 1}`,
    value: parseFloat(val.toFixed(2)),
  }));

  // Combined data for line chart comparison
  const mfccCombinedData = data.mfcc.mean.map((val, idx) => ({
    coefficient: `MFCC ${idx + 1}`,
    mean: parseFloat(val.toFixed(2)),
    std: parseFloat(data.mfcc.std[idx].toFixed(2)),
  }));

  // Combined data for bar chart comparison
  const comparisonData = data.mfcc.mean.map((val, idx) => ({
    coef: `C${idx + 1}`,
    mean: parseFloat(val.toFixed(1)),
    std: parseFloat(data.mfcc.std[idx].toFixed(1)),
  }));

  const deltaComparisonData = data.mfcc_delta.mean.map((val, idx) => ({
    coef: `D${idx + 1}`,
    mean: parseFloat((val * 1000).toFixed(2)),
    std: parseFloat(data.mfcc_delta.std[idx].toFixed(2)),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">
          MFCC Analysis
        </h2>

        <p className="text-muted-foreground mb-4">
          Mel-Frequency Cepstral Coefficients - fundamental features for speech
          and music analysis
        </p>
      </div>

      {/* MFCC Mean and Std Comparison */}
      <Card className="bg-card border border-border p-6 hover:border-primary/50 transition-colors">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          MFCC Coefficients - Mean vs Std
        </h3>

        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3456" />
            <XAxis dataKey="coef" stroke="#8b93b8" />
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

      {/* MFCC Mean and Std Combined Line Chart */}
      <Card className="bg-card border border-border p-6 hover:border-primary/50 transition-colors">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          MFCC Coefficients - Mean & Std Distribution
        </h3>

        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={mfccCombinedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3456" />

            <XAxis
              dataKey="coefficient"
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

            <Legend />

            <Line
              type="monotone"
              dataKey="mean"
              stroke="#00d9ff"
              strokeWidth={3}
              dot={{ fill: '#00d9ff', r: 5 }}
              activeDot={{ r: 7 }}
              name="Mean"
            />

            <Line
              type="monotone"
              dataKey="std"
              stroke="#7c3aed"
              strokeWidth={3}
              dot={{ fill: '#7c3aed', r: 5 }}
              activeDot={{ r: 7 }}
              name="Std Dev"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* MFCC Delta Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MFCC Delta Mean */}
        <Card className="bg-card border border-border p-6 hover:border-primary/50 transition-colors">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            MFCC Delta Mean (×10³)
          </h3>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mfccDeltaMeanData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3456" />

              <XAxis
                dataKey="coefficient"
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

              <Line
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* MFCC Delta Std */}
        <Card className="bg-card border border-border p-6 hover:border-primary/50 transition-colors">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            MFCC Delta Std
          </h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mfccDeltaStdData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3456" />

              <XAxis
                dataKey="coefficient"
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

              <Bar
                dataKey="value"
                fill="#f59e0b"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Delta Comparison */}
      <Card className="bg-card border border-border p-6 hover:border-primary/50 transition-colors">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          MFCC Delta - Mean vs Std
        </h3>

        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={deltaComparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3456" />
            <XAxis dataKey="coef" stroke="#8b93b8" />
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

            <Bar dataKey="mean" fill="#10b981" radius={[8, 8, 0, 0]} />
            <Bar dataKey="std" fill="#f59e0b" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}