import { Card } from '@/components/ui/card';
import {
    ResponsiveContainer,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,

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
                        <PieChart>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--card)',
                                    border: '1px solid #2a3456',
                                    borderRadius: '8px',
                                    color: '#e0e8ff',
                                }}
                                labelStyle={{ color: '#e0e8ff' }}
                                itemStyle={{ color: '#e0e8ff' }}
                            />

                            <Legend />

                            <Pie
                                data={[
                                    {
                                        name: 'RMS Mean',
                                        value: chartData[0].mean,
                                        fill: 'var(--chart-1)',
                                    },
                                    {
                                        name: 'RMS Std',
                                        value: chartData[0].std,
                                        fill: 'var(--chart-3)',
                                    },
                                    {
                                        name: 'ZCR Mean',
                                        value: chartData[1].mean,
                                        fill: 'var(--chart-2)',
                                    },
                                    {
                                        name: 'ZCR Std',
                                        value: chartData[1].std,
                                        fill: 'var(--chart-5)',
                                    },
                                ]}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={110}
                                innerRadius={30}
                                paddingAngle={4}
                                label={({ name, value }) => `${name}: ${value}`}
                                labelLine={false}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>
                {/* Spectral Features Chart */}
                <Card className="bg-card border border-border rounded-xl p-4 sm:p-6 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/10 transition-all">
                    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
                        Spectral Features (in kHz)
                    </h3>

                    <ResponsiveContainer width="100%" height={300}>
                        <RadarChart outerRadius={100} data={spectralChartData}>
                            <PolarGrid stroke="#2a3456" />

                            <PolarAngleAxis
                                dataKey="name"
                                stroke="#8b93b8"
                            />

                            <PolarRadiusAxis stroke="#8b93b8" />

                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--card)',
                                    border: '1px solid #2a3456',
                                    borderRadius: '8px',
                                    color: '#e0e8ff',
                                }}
                            />

                            <Radar
                                name="Spectral Features"
                                dataKey="value"
                                stroke="var(--chart-2)"
                                fill="var(--chart-2)"
                                fillOpacity={0.4}
                            />
                        </RadarChart>
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

                <ResponsiveContainer width="100%" height={420}>
                    <RadarChart
                        outerRadius={140}
                        data={data.spectral_contrast.mean.map((val, idx) => ({
                            band: `Band ${idx + 1}`,
                            contrast: parseFloat(val.toFixed(2)),
                        }))}
                    >
                        <PolarGrid stroke="#2a3456" />

                        <PolarAngleAxis
                            dataKey="band"
                            stroke="#8b93b8"
                        />

                        <PolarRadiusAxis
                            stroke="#8b93b8"
                        />

                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--card)',
                                border: '1px solid #2a3456',
                                borderRadius: '8px',
                                color: '#e0e8ff',
                            }}
                        />

                        <Radar
                            name="Contrast"
                            dataKey="contrast"
                            stroke="var(--chart-2)"
                            fill="var(--chart-2)"
                            fillOpacity={0.45}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </Card>
        </div>
    );
}