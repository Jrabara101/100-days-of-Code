<?php

namespace App\Console;

use App\Api\WeatherClient;
use App\Cache\FileCache;
use App\Export\ReportGenerator;
use App\Utils\Config;
use App\Utils\Validator;

class Application
{
    private WeatherClient $apiClient;
    private FileCache $cache;
    private ReportGenerator $reportGenerator;

    public function __construct(string $basePath)
    {
        Config::load($basePath);
        
        $ttl = (int) Config::get('CACHE_TTL_MINUTES', 15);
        $this->cache = new FileCache($basePath . '/storage/cache', $ttl);
        $this->reportGenerator = new ReportGenerator($basePath . '/storage/reports');
    }

    public function run(array $argv): void
    {
        Style::title(" PH WEATHER CHECKER API ");

        $options = $this->parseArguments($argv);

        if (empty($options['location']) && empty($options['batch'])) {
            $this->showHelp();
            return;
        }

        $locations = [];
        if (!empty($options['batch'])) {
            if (!file_exists($options['batch'])) {
                Style::error("Batch file not found: {$options['batch']}");
                return;
            }
            $locations = file($options['batch'], FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        } else {
            $locations[] = $options['location'];
        }

        foreach ($locations as $location) {
            $this->processLocation($location, $options);
        }
    }

    private function processLocation(string $location, array $options): void
    {
        $location = Validator::sanitizeLocation($location);
        
        if (!Validator::validateLocation($location)) {
            Style::error("Invalid location provided.");
            return;
        }

        Style::info("Checking weather for: " . Style::format($location, 'white', true));

        try {
            $data = $this->cache->get($location);
            $cached = true;

            if (!$data) {
                $cached = false;
                
                if (!isset($this->apiClient)) {
                    $apiKey = Config::getRequired('WEATHER_API_KEY');
                    $this->apiClient = new WeatherClient($apiKey);
                }
                
                $data = $this->apiClient->getCurrentWeather($location);
                $this->cache->set($location, $data);
            }

            Style::displayWeatherDashboard($data);

            if ($cached) {
                Style::print(" * Showing cached result to save API calls.", 'yellow');
            }

            if ($options['save']) {
                $this->saveReport($location, $data, $options['format']);
            }

        } catch (\Exception $e) {
            Style::error("Failed to fetch weather: " . $e->getMessage());
        }
    }

    private function saveReport(string $location, array $data, string $format): void
    {
        try {
            $filename = '';
            switch (strtolower($format)) {
                case 'json':
                    $filename = $this->reportGenerator->saveJson($location, $data);
                    break;
                case 'txt':
                    $filename = $this->reportGenerator->saveTxt($location, $data);
                    break;
                case 'html':
                    $filename = $this->reportGenerator->saveHtml($location, $data);
                    break;
                default:
                    Style::error("Unknown format: {$format}. Supported: json, txt, html");
                    return;
            }
            Style::success("Report saved to: " . $filename);
        } catch (\Exception $e) {
            Style::error("Failed to save report: " . $e->getMessage());
        }
    }

    private function parseArguments(array $argv): array
    {
        $options = [
            'location' => '',
            'batch' => '',
            'save' => false,
            'format' => 'txt',
        ];

        // Skip the script name
        array_shift($argv);

        foreach ($argv as $arg) {
            if (str_starts_with($arg, '--batch=')) {
                $options['batch'] = substr($arg, 8);
            } elseif (str_starts_with($arg, '--format=')) {
                $options['format'] = substr($arg, 9);
            } elseif ($arg === '--save') {
                $options['save'] = true;
            } elseif (empty($options['location']) && !str_starts_with($arg, '--')) {
                $options['location'] = $arg;
            }
        }

        return $options;
    }

    private function showHelp(): void
    {
        Style::print("Usage:", 'yellow', true);
        Style::print("  php weather.php [location] [options]");
        echo PHP_EOL;
        Style::print("Options:", 'yellow', true);
        Style::print("  --save               Save the result to a file");
        Style::print("  --format=[type]      Format to save: txt, json, html (default: txt)");
        Style::print("  --batch=[file]       Check multiple locations from a text file");
        echo PHP_EOL;
        Style::print("Examples:", 'yellow', true);
        Style::print("  php weather.php Manila");
        Style::print("  php weather.php Cebu --save --format=html");
        Style::print("  php weather.php --batch=locations.txt --save --format=json");
    }
}
