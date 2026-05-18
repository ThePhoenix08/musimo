import { Card } from '@/components/ui/card';
import {
    BarChart,
    Bar,
    ResponsiveContainer,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    AreaChart,
    Area,
} from 'recharts';
import MetricCard from '../metric-card';

export default function SpectralTab({ data }) {
    // Spectral Contrast data
    const spectralContrastData = data.spectral_contrast.mean.map(
        (val, idx) => ({
            band: `B${idx + 1}`,
            mean: parseFloat(val.toFixed(1)),
            std: parseFloat(data.spectral_contrast.std[idx].toFixed(1)),
        })
    );

    // Main spectral features comparison
    const spectralFeaturesData = [
        {
            name: 'Centroid (kHz)',
            value: parseFloat(
                (data.spectral_centroid.mean / 1000).toFixed(2)
            ),
            std: parseFloat(
                (data.spectral_centroid.std / 1000).toFixed(2)
            ),
        },
        {
            name: 'Bandwidth (kHz)',
            value: parseFloat(
                (data.spectral_bandwidth.mean / 1000).toFixed(2)
            ),
            std: parseFloat(
                (data.spectral_bandwidth.std / 1000).toFixed(2)
            ),
        },
        {
            name: 'Rolloff (kHz)',
            value: parseFloat(
                (data.spectral_rolloff.mean / 1000).toFixed(2)
            ),
            std: parseFloat(
                (data.spectral_rolloff.std / 1000).toFixed(2)
            ),
        },
    ];

    const metrics = [
        {
            title: 'Spectral Centroid',
            value: data.spectral_centroid.mean.toFixed(1),
            unit: 'Hz',
            description: 'Frequency weighted average',
            color: 'from-indigo-500 to-purple-500',
        },
        {
            title: 'Spectral Bandwidth',
            value: data.spectral_bandwidth.mean.toFixed(1),
            unit: 'Hz',
            description: 'Width of spectral content',
            color: 'from-rose-500 to-pink-500',
        },
        {
            title: 'Spectral Rolloff',
            value: data.spectral_rolloff.mean.toFixed(1),
            unit: 'Hz',
            description: '85% energy cutoff',
            color: 'from-cyan-500 to-blue-500',
        },
        {
            title: 'Spectral Flatness',
            value: data.spectral_flatness.mean.toFixed(4),
            unit: 'ratio',
            description: 'Noise-to-tone ratio',
            color: 'from-teal-500 to-cyan-500',
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                    Spectral Analysis
                </h2>

                <p className="text-muted-foreground mb-4">
                    Frequency domain features characterizing the spectral content of audio
                </p>
            </div>

            {/* Main Spectral Metrics */}
            <div>
                <h3 className="text-xl font-semibold text-foreground mb-4">
                    Spectral Features
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {metrics.map((metric, idx) => (
                        <MetricCard key={idx} {...metric} />
                    ))}
                </div>
            </div>

            {/* Spectral Features Comparison Chart */}
            <Card className="bg-card border border-border p-6 hover:border-primary/50 transition-colors">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                    Main Spectral Features - Mean vs Std
                </h3>

                <ResponsiveContainer width="100%" height={350}>
                    <BarChart
                        data={spectralFeaturesData}
                        layout="vertical"
                        barCategoryGap={25}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a3456" />

                        <XAxis
                            type="number"
                            stroke="#8b93b8"
                        />

                        <YAxis
                            dataKey="name"
                            type="category"
                            stroke="#8b93b8"
                            width={120}
                        />

                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--card)',
                                border: '1px solid #2a3456',
                                borderRadius: '8px',
                                color: '#e0e8ff',
                            }}
                        />

                        <Legend />

                        <Bar
                            dataKey="value"
                            fill="var(--chart-1)"
                            radius={[0, 12, 12, 0]}
                            name="Mean"
                        />

                        <Bar
                            dataKey="std"
                            fill="var(--chart-4)"
                            radius={[0, 12, 12, 0]}
                            name="Std Deviation"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </Card>

            {/* Spectral Contrast */}
            <Card className="bg-card border border-border p-6 hover:border-primary/50 transition-colors">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                    Spectral Contrast by Band
                </h3>

                <p className="text-sm text-muted-foreground mb-4">
                    Difference between peaks and valleys in the magnitude spectrum
                </p>

                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={spectralContrastData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a3456" />
                        <XAxis dataKey="band" stroke="#8b93b8" />
                        <YAxis stroke="#8b93b8" />

                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--card)',
                                border: '1px solid #2a3456',
                                borderRadius: '8px',
                                color: '#e0e8ff',
                            }}
                        />

                        <Legend />

                        <Bar dataKey="mean" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="std" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </Card>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Centroid and Bandwidth */}
                <Card className="bg-card border border-border p-6 hover:border-primary/50 transition-colors">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                        Spectral Centroid & Bandwidth
                    </h3>

                    <div className="space-y-4">
                        <div className="flex justify-between items-end pb-4 border-b border-border">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Mean</p>

                                <p className="text-2xl font-bold text-primary">
                                    {(data.spectral_centroid.mean / 1000).toFixed(2)} kHz
                                </p>
                            </div>

                            <div className="text-right">
                                <p className="text-sm text-muted-foreground mb-1">
                                    Std Dev
                                </p>

                                <p className="text-2xl font-bold text-secondary">
                                    {(data.spectral_centroid.std / 1000).toFixed(2)} kHz
                                </p>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground mb-2">
                                Bandwidth:
                            </p>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm">Mean</span>

                                    <span className="font-semibold text-foreground">
                                        {(data.spectral_bandwidth.mean / 1000).toFixed(2)} kHz
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-sm">Std Dev</span>

                                    <span className="font-semibold text-foreground">
                                        {(data.spectral_bandwidth.std / 1000).toFixed(2)} kHz
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Rolloff and Flatness */}
                <Card className="bg-card border border-border p-6 hover:border-primary/50 transition-colors">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                        Spectral Rolloff & Flatness
                    </h3>

                    <div className="space-y-4">
                        <div className="flex justify-between items-end pb-4 border-b border-border">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Mean</p>

                                <p className="text-2xl font-bold text-primary">
                                    {(data.spectral_rolloff.mean / 1000).toFixed(2)} kHz
                                </p>
                            </div>

                            <div className="text-right">
                                <p className="text-sm text-muted-foreground mb-1">
                                    Std Dev
                                </p>

                                <p className="text-2xl font-bold text-secondary">
                                    {(data.spectral_rolloff.std / 1000).toFixed(2)} kHz
                                </p>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground mb-2">
                                Flatness (Wiener Entropy):
                            </p>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm">Mean</span>

                                    <span className="font-semibold text-foreground">
                                        {data.spectral_flatness.mean.toFixed(4)}
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-sm">Std Dev</span>

                                    <span className="font-semibold text-foreground">
                                        {data.spectral_flatness.std.toFixed(4)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}