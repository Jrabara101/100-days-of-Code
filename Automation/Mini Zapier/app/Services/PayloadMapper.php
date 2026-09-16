<?php

declare(strict_types=1);

namespace App\Services;

use App\Integrations\DTOs\InterpolationTrace;
use App\Integrations\DTOs\Payload;

/**
 * High-performance Dynamic Payload Token Replacement Engine.
 *
 * Utilizes Laravel's data_get() helper combined with regular expressions
 * to dynamically interpolate variables from previous steps into the current step's
 * DTO without hardcoding business logic.
 */
class PayloadMapper
{
    /**
     * Regular expression matching mustache-syntax tokens:
     * e.g., {{ trigger.customer.email }}, {{ step_1.contact_id }}, {{ user.profile.name }}
     */
    private const TOKEN_REGEX = '/\{\{\s*([a-zA-Z0-9_\.\-]+)\s*\}\}/';

    /**
     * Map a raw configuration template using the accumulated workflow context.
     *
     * @param array<string, mixed> $template Key-value pairs containing mustache tokens
     * @param array<string, mixed> $context Full context tree (e.g. ['trigger' => [...], 'step_1' => [...]])
     * @param string|null $workflowId Optional workflow reference
     * @param int|null $stepOrder Optional step sequence
     * @return array{payload: Payload, traces: array<InterpolationTrace>}
     */
    public function mapToPayload(
        array $template,
        array $context,
        ?string $workflowId = null,
        ?int $stepOrder = null
    ): array {
        /** @var array<InterpolationTrace> $traces */
        $traces = [];

        $mappedData = $this->interpolateArray($template, $context, '', $traces);

        $payload = new Payload(
            data: $mappedData,
            context: $context,
            rawTemplate: $template,
            workflowId: $workflowId,
            stepOrder: $stepOrder
        );

        return [
            'payload' => $payload,
            'traces' => $traces,
        ];
    }

    /**
     * Recursively interpolate array structures.
     *
     * @param array<string, mixed> $array
     * @param array<string, mixed> $context
     * @param array<InterpolationTrace> $traces
     * @return array<string, mixed>
     */
    public function interpolateArray(array $array, array $context, string $prefix, array &$traces): array
    {
        $result = [];

        foreach ($array as $key => $value) {
            $currentPath = $prefix === '' ? (string) $key : "{$prefix}.{$key}";

            if (is_array($value)) {
                $result[$key] = $this->interpolateArray($value, $context, $currentPath, $traces);
            } elseif (is_string($value)) {
                $result[$key] = $this->interpolateString($value, $context, $currentPath, $traces);
            } else {
                $result[$key] = $value;
            }
        }

        return $result;
    }

    /**
     * Interpolate a string template against the given context.
     *
     * Supports both exact-match type preservation (e.g., "{{ trigger.user.id }}" => int 42)
     * and string-embedded replacement (e.g., "Hello {{ trigger.user.name }}!" => "Hello Jane Doe!").
     *
     * @param array<string, mixed> $context
     * @param array<InterpolationTrace> $traces
     */
    public function interpolateString(string $template, array $context, string $targetKey, array &$traces): mixed
    {
        // 1. Check for single exact token match to preserve primitive types (e.g., int, bool, array, null)
        if (preg_match('/^\s*\{\{\s*([a-zA-Z0-9_\.\-]+)\s*\}\}\s*$/', $template, $matches)) {
            $tokenPath = trim($matches[1]);
            $resolvedValue = data_get($context, $tokenPath);

            $traces[] = new InterpolationTrace(
                token: "{{ {$tokenPath} }}",
                resolvedValue: $resolvedValue,
                targetKey: $targetKey,
                fallbackUsed: $resolvedValue === null
            );

            return $resolvedValue;
        }

        // 2. String-embedded interpolation with multiple tokens
        return preg_replace_callback(self::TOKEN_REGEX, function (array $match) use ($context, $targetKey, &$traces): string {
            $tokenPath = trim($match[1]);
            $resolvedValue = data_get($context, $tokenPath);

            $traces[] = new InterpolationTrace(
                token: "{{ {$tokenPath} }}",
                resolvedValue: $resolvedValue,
                targetKey: $targetKey,
                fallbackUsed: $resolvedValue === null
            );

            if ($resolvedValue === null) {
                return '';
            }

            if (is_bool($resolvedValue)) {
                return $resolvedValue ? 'true' : 'false';
            }

            if (is_array($resolvedValue)) {
                return json_encode($resolvedValue, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?: '';
            }

            return (string) $resolvedValue;
        }, $template) ?? $template;
    }

    /**
     * Extract all token references from a string or nested array.
     *
     * @param array<string, mixed>|string $target
     * @return array<string> Unique token paths (e.g., ['trigger.user.name', 'trigger.user.email'])
     */
    public function extractTokens(array|string $target): array
    {
        $tokens = [];

        if (is_string($target)) {
            if (preg_match_all(self::TOKEN_REGEX, $target, $matches)) {
                foreach ($matches[1] as $path) {
                    $tokens[] = trim($path);
                }
            }
        } elseif (is_array($target)) {
            foreach ($target as $value) {
                $tokens = array_merge($tokens, $this->extractTokens($value));
            }
        }

        return array_values(array_unique($tokens));
    }
}
