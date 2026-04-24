<?php

namespace App\Api;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use RuntimeException;

class WeatherClient
{
    private Client $client;
    private string $apiKey;
    private const BASE_URL = 'http://api.weatherapi.com/v1/';

    public function __construct(string $apiKey)
    {
        $this->apiKey = $apiKey;
        $this->client = new Client([
            'base_uri' => self::BASE_URL,
            'timeout'  => 10.0,
        ]);
    }

    /**
     * Fetches current weather for a specific location.
     * We append ", Philippines" to ensure it looks up the correct country.
     */
    public function getCurrentWeather(string $location): array
    {
        try {
            $query = $location . ', Philippines';
            $response = $this->client->request('GET', 'current.json', [
                'query' => [
                    'key' => $this->apiKey,
                    'q' => $query,
                    'aqi' => 'no'
                ]
            ]);

            $data = json_decode($response->getBody()->getContents(), true);
            
            if (isset($data['error'])) {
                throw new RuntimeException($data['error']['message']);
            }
            
            return $data;
        } catch (GuzzleException $e) {
            throw new RuntimeException("API Request failed: " . $e->getMessage());
        }
    }
}
