<?php

namespace App\Export;

class ReportGenerator
{
    private string $reportDir;

    public function __construct(string $reportDir)
    {
        $this->reportDir = $reportDir;
        
        if (!is_dir($this->reportDir)) {
            mkdir($this->reportDir, 0777, true);
        }
    }

    public function saveJson(string $location, array $data): string
    {
        $filename = $this->generateFilename($location, 'json');
        file_put_contents($filename, json_encode($data, JSON_PRETTY_PRINT));
        return $filename;
    }

    public function saveTxt(string $location, array $data): string
    {
        $filename = $this->generateFilename($location, 'txt');
        $content = "WEATHER REPORT FOR: {$data['location']['name']}, {$data['location']['region']}\n";
        $content .= "Date: {$data['current']['last_updated']}\n";
        $content .= str_repeat("-", 40) . "\n";
        $content .= "Condition: {$data['current']['condition']['text']}\n";
        $content .= "Temperature: {$data['current']['temp_c']} °C\n";
        $content .= "Feels Like: {$data['current']['feelslike_c']} °C\n";
        $content .= "Humidity: {$data['current']['humidity']}%\n";
        $content .= "Wind: {$data['current']['wind_kph']} km/h {$data['current']['wind_dir']}\n";
        
        file_put_contents($filename, $content);
        return $filename;
    }

    public function saveHtml(string $location, array $data): string
    {
        $filename = $this->generateFilename($location, 'html');
        $loc = $data['location'];
        $current = $data['current'];
        $icon = "http:" . $current['condition']['icon'];
        
        $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Weather Report - {$loc['name']}</title>
    <style>
        :root {
            --bg-color: #0f172a;
            --card-bg: #1e293b;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --accent: #38bdf8;
            --border: #334155;
        }
        body {
            font-family: 'Segoe UI', system-ui, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-main);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
        }
        .weather-card {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 2rem;
            width: 100%;
            max-width: 400px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            text-align: center;
        }
        .location {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 0.2rem;
        }
        .region {
            color: var(--text-muted);
            font-size: 0.9rem;
            margin-bottom: 1.5rem;
        }
        .temp-container {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
        }
        .temp {
            font-size: 4rem;
            font-weight: 700;
            color: var(--accent);
        }
        .condition {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            text-transform: capitalize;
        }
        .details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            text-align: left;
            border-top: 1px solid var(--border);
            padding-top: 1.5rem;
        }
        .detail-item {
            display: flex;
            flex-direction: column;
        }
        .detail-label {
            font-size: 0.8rem;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .detail-value {
            font-size: 1.1rem;
            font-weight: 500;
        }
        .updated {
            margin-top: 2rem;
            font-size: 0.75rem;
            color: var(--text-muted);
        }
    </style>
</head>
<body>
    <div class="weather-card">
        <div class="location">{$loc['name']}</div>
        <div class="region">{$loc['region']}, {$loc['country']}</div>
        
        <div class="temp-container">
            <img src="{$icon}" alt="{$current['condition']['text']}">
            <div class="temp">{$current['temp_c']}°</div>
        </div>
        
        <div class="condition">{$current['condition']['text']}</div>
        
        <div class="details">
            <div class="detail-item">
                <span class="detail-label">Feels Like</span>
                <span class="detail-value">{$current['feelslike_c']}°C</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Humidity</span>
                <span class="detail-value">{$current['humidity']}%</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Wind</span>
                <span class="detail-value">{$current['wind_kph']} km/h</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Direction</span>
                <span class="detail-value">{$current['wind_dir']}</span>
            </div>
        </div>
        
        <div class="updated">Last Updated: {$current['last_updated']}</div>
    </div>
</body>
</html>
HTML;
        
        file_put_contents($filename, $html);
        return $filename;
    }

    private function generateFilename(string $location, string $ext): string
    {
        $safeLocation = preg_replace('/[^a-zA-Z0-9]/', '_', strtolower($location));
        $date = date('Ymd_His');
        return $this->reportDir . "/weather_{$safeLocation}_{$date}.{$ext}";
    }
}
