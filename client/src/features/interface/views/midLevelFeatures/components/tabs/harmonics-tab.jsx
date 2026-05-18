import { Card } from '@/components/ui/card';
import {
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    AreaChart,
    Area,
} from 'recharts';

export default function HarmonicsTab({ data }) {
    const chromaNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    const chromaData = chromaNotes.map((note, idx) => ({
        name: note,
        mean: parseFloat(data.chroma.mean[idx].toFixed(3)),
        std: parseFloat(data.chroma.std[idx].toFixed(3)),
    }));

    // Tonnetz data (6 dimensions)
    const tonnetzLabels = [
        '5th',
        '3rd',
        'Minor 3rd',
        'Minor 6th',
        'Augmented 2nd',
        'Augmented 5th',
    ];

    const tonnetzData = tonnetzLabels.map((label, idx) => ({
        name: label,
        value: parseFloat(data.tonnetz.mean[idx].toFixed(4)),
        std: parseFloat(data.tonnetz.std[idx].toFixed(4)),
    }));

    // Radar chart data for Chroma
    const radarChromaData = chromaNotes.map((note, idx) => ({
        subject: note,
        mean: parseFloat(data.chroma.mean[idx].toFixed(2)),
    }));

    // Radar chart data for Tonnetz
    const radarTonnetzData = tonnetzLabels.map((label, idx) => ({
        subject: label,
        value: Math.abs(parseFloat(data.tonnetz.mean[idx].toFixed(3))),
    }));

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                    Harmonic Analysis
                </h2>

                <p className="text-muted-foreground mb-4">
                    Chroma and Tonnetz features representing harmonic content and tonal
                    relationships
                </p>
            </div>

            {/* Chroma Features */}
            <div>
                <h3 className="text-xl font-semibold text-foreground mb-4">
                    Chroma Features (Pitch Classes)
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Chroma Radar Chart */}
                    <Card className="lg:col-span-2 bg-card border border-border p-6 hover:border-primary/50 transition-colors">
                        <h4 className="text-lg font-semibold text-foreground mb-4">
                            Chroma Distribution (Radar View)
                        </h4>

                        <ResponsiveContainer width="100%" height={400}>
                            <RadarChart data={radarChromaData}>
                                <PolarGrid stroke="#2a3456" />
                                <PolarAngleAxis dataKey="subject" stroke="#8b93b8" />
                                <PolarRadiusAxis stroke="#8b93b8" />

                                <Radar
                                    name="Chroma Mean"
                                    dataKey="mean"
                                    stroke="#00d9ff"
                                    fill="#00d9ff"
                                    fillOpacity={0.3}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Chroma Statistics */}
                    <Card className="bg-card border border-border p-6 hover:border-primary/50 transition-colors">
                        <h4 className="text-lg font-semibold text-foreground mb-4">
                            Chroma Statistics
                        </h4>

                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
                            {chromaData.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="pb-3 border-b border-border last:border-0"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-semibold text-primary">
                                            {item.name}
                                        </span>

                                        <span className="text-sm text-muted-foreground">
                                            ±{item.std.toFixed(3)}
                                        </span>
                                    </div>

                                    <div className="w-full bg-secondary/20 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full"
                                            style={{ width: `${item.mean * 100}%` }}
                                        />
                                    </div>

                                    <p className="text-sm text-foreground mt-1">
                                        {item.mean.toFixed(3)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Chroma Bar Chart */}
            <Card className="bg-card border border-border p-6 hover:border-primary/50 transition-colors">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                    Chroma Mean vs Std Deviation
                </h3>

                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={chromaData}>
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

                        <Bar dataKey="mean" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="std" fill="var(--chart-3)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </Card>

            {/* Tonnetz Features */}
            <div>
                <h3 className="text-xl font-semibold text-foreground mb-4">
                    Tonnetz Features (Tonal Centroid)
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Tonnetz Radar Chart */}
                    <Card className="lg:col-span-2 bg-card border border-border p-6 hover:border-primary/50 transition-colors">
                        <h4 className="text-lg font-semibold text-foreground mb-4">
                            Tonnetz Distribution (Polar View)
                        </h4>

                        <ResponsiveContainer width="100%" height={400}>
                            <RadarChart data={radarTonnetzData}>
                                <PolarGrid stroke="#2a3456" />
                                <PolarAngleAxis dataKey="subject" stroke="#8b93b8" />
                                <PolarRadiusAxis stroke="#8b93b8" />

                                <Radar
                                    name="Tonnetz Value"
                                    dataKey="value"
                                    stroke="#10b981"
                                    fill="#10b981"
                                    fillOpacity={0.3}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Tonnetz Statistics */}
                    <Card className="bg-card border border-border p-6 hover:border-primary/50 transition-colors">
                        <h4 className="text-lg font-semibold text-foreground mb-4">
                            Tonnetz Values
                        </h4>

                        <div className="space-y-3">
                            {tonnetzData.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="p-3 bg-secondary/10 rounded-lg border border-border/50"
                                >
                                    <p className="text-sm font-semibold text-primary mb-1">
                                        {item.name}
                                    </p>

                                    <div className="flex justify-between items-baseline">
                                        <p className="text-lg font-bold text-foreground">
                                            {item.value >= 0 ? '+' : ''}
                                            {item.value.toFixed(4)}
                                        </p>

                                        <p className="text-xs text-muted-foreground">
                                            ±{item.std.toFixed(4)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Tonnetz Bar Chart */}
            <Card className="bg-card border border-border p-6 hover:border-primary/50 transition-colors">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                    Tonnetz Mean vs Std Deviation
                </h3>

                <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={tonnetzData}>
                        <defs>
                            <linearGradient
                                id="tonnetzWave"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop offset="0%" stopColor="var(--chart-3)" />
                                <stop offset="100%" stopColor="#000000" />
                            </linearGradient>

                            <linearGradient
                                id="tonnetzStdWave"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop offset="0%" stopColor="var(--chart-5)" />
                                <stop offset="100%" stopColor="#000000" />
                            </linearGradient>
                        </defs>

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

                        <Legend />

                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="var(--chart-3)"
                            fill="url(#tonnetzWave)"
                            strokeWidth={3}
                            fillOpacity={0.4}
                            name="Mean"
                        />

                        <Area
                            type="monotone"
                            dataKey="std"
                            stroke="var(--chart-5)"
                            fill="url(#tonnetzStdWave)"
                            strokeWidth={3}
                            fillOpacity={0.25}
                            name="Std Deviation"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </Card>

            {/* Summary Card */}
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                    Harmonic Summary
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground mb-2">
                            Dominant Pitch Class
                        </p>

                        <p className="text-2xl font-bold text-primary">
                            {
                                chromaNotes[
                                chromaData.reduce(
                                    (maxIdx, item, idx, arr) =>
                                        item.mean > arr[maxIdx].mean ? idx : maxIdx,
                                    0
                                )
                                ]
                            }
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-muted-foreground mb-2">
                            Highest Tonnetz Component
                        </p>

                        <p className="text-2xl font-bold text-primary">
                            {
                                tonnetzData.reduce((maxItem, item) =>
                                    Math.abs(item.value) > Math.abs(maxItem.value)
                                        ? item
                                        : maxItem
                                ).name
                            }
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}