import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";

const data = [
    { name: "Jan", value: -400 },
    { name: "Feb", value: 300 },
    { name: "Mar", value: -200 },
    { name: "Apr", value: 600 },
];

export default function NegativeAreaChart() {
    return (
        <Card className="w-full max-w-xl">
            <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#8884d8"
                            fill="#8884d8"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
