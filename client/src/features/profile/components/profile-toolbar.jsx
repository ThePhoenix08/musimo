import {
  Search,
  Download,
  LogOut,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ProfileToolbar({
  handleLogout,
}) {

  const handleDownloadPDF =
    async () => {

      try {

        const analysisData = `
        <table>
          <tr>
            <th colspan="2">
              User Information
            </th>
          </tr>

          <tr>
            <td>Username</td>
            <td>@dhanraj</td>
          </tr>

          <tr>
            <td>Name</td>
            <td>Hari</td>
          </tr>

          <tr>
            <td>Email</td>
            <td>drkadam04@gmail.com</td>
          </tr>

          <tr>
            <th colspan="2">
              Profile Statistics
            </th>
          </tr>

          <tr>
            <td>Projects</td>
            <td>2</td>
          </tr>

          <tr>
            <td>Songs</td>
            <td>2</td>
          </tr>

          <tr>
            <td>AI Insights</td>
            <td>5</td>
          </tr>

          <tr>
            <th colspan="2">
              Emotion Score Breakdown
            </th>
          </tr>

          <tr>
            <td>Wonder</td>
            <td>6.2%</td>
          </tr>

          <tr>
            <td>Transcendence</td>
            <td>10.7%</td>
          </tr>

          <tr>
            <td>Tenderness</td>
            <td>11.2%</td>
          </tr>

          <tr>
            <td>Nostalgia</td>
            <td>16.6%</td>
          </tr>

          <tr>
            <td>Peacefulness</td>
            <td>6.9%</td>
          </tr>

          <tr>
            <td>Power</td>
            <td>21.0%</td>
          </tr>

          <tr>
            <td>
              Joyful Activation
            </td>
            <td>23.1%</td>
          </tr>

          <tr>
            <td>Tension</td>
            <td>22.4%</td>
          </tr>

          <tr>
            <td>Sadness</td>
            <td>17.0%</td>
          </tr>

          <tr>
            <th colspan="2">
              AI Insights
            </th>
          </tr>

          <tr>
            <td>
              Dominant Emotion
            </td>
            <td>
              Joyful Activation
            </td>
          </tr>

          <tr>
            <td>
              Favorite Instrument
            </td>
            <td>N/A</td>
          </tr>

          <tr>
            <td>
              Total Storage Used
            </td>
            <td>8.61 MB</td>
          </tr>

          <tr>
            <td>
              Average Song Duration
            </td>
            <td>252 sec</td>
          </tr>

          <tr>
            <th colspan="2">
              Instrumental Analysis
            </th>
          </tr>

          <tr>
            <td>
              Detected Instruments
            </td>
            <td>
              No Instruments Detected
            </td>
          </tr>

          <tr>
            <th colspan="2">
              Project Summary
            </th>
          </tr>

          <tr>
            <td>Total Projects</td>
            <td>2</td>
          </tr>

          <tr>
            <td>Total Tracks</td>
            <td>2</td>
          </tr>

          <tr>
            <td>Total Duration</td>
            <td>504s</td>
          </tr>
        </table>
      `;

        const printWindow =
          window.open(
            "",
            "_blank"
          );

        printWindow.document.write(`
        <html>

          <head>

            <title>
              Musimo Profile Report
            </title>

            <style>

              body {
                font-family: Arial;
                padding: 40px;
                background: white;
                color: black;
              }

              h1 {
                text-align: center;
                margin-bottom: 30px;
              }

              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
              }

              th {
                background: #000;
                color: #fff;
                padding: 12px;
                border: 1px solid #000;
                text-align: left;
              }

              td {
                padding: 10px;
                border: 1px solid #999;
              }

              tr:nth-child(even) {
                background: #f5f5f5;
              }

            </style>

          </head>

          <body>

            <h1>
              Musimo Profile Report
            </h1>

            ${analysisData}

          </body>

        </html>
      `);

        printWindow.document.close();

        printWindow.focus();

        printWindow.print();

      } catch (error) {

        console.error(
          "PDF download failed:",
          error
        );
      }
    };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

      {/* SEARCH */}
      <div className="flex flex-1 justify-center">

        <div className="relative w-full max-w-xl">

          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />

          <Input
            placeholder="Search projects, analytics, tracks..."
            className="h-11 rounded-2xl border-white/10 bg-zinc-900 pl-11 text-white placeholder:text-zinc-500"
          />
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex w-full items-center justify-center gap-3 md:w-auto md:justify-end">

        <Button
          onClick={
            handleDownloadPDF
          }
          className="gap-2 bg-yellow-600 hover:bg-yellow-500"
        >
          <Download className="h-4 w-4" />
        </Button>

        <Button
          variant="destructive"
          onClick={
            handleLogout
          }
          className="gap-2 bg-red-900"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}