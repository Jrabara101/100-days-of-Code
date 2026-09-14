<?php

declare(strict_types=1);

namespace App\Engine\DAG;

use App\Exceptions\WorkflowExecutionException;
use RuntimeException;

class GraphResolver
{
    /**
     * Resolve and validate a Directed Acyclic Graph (DAG) into an ordered linear execution plan
     * using Kahn's algorithm for topological sorting and cycle detection.
     *
     * @param array<string, array{class: string, depends_on?: array<string>}> $nodeMap
     * @return array<int, string> Ordered array of node keys
     */
    public function resolve(array $nodeMap): array
    {
        $inDegree = [];
        $adjacencyList = [];

        foreach (array_keys($nodeMap) as $nodeKey) {
            $inDegree[$nodeKey] = 0;
            $adjacencyList[$nodeKey] = [];
        }

        foreach ($nodeMap as $nodeKey => $nodeConfig) {
            $dependencies = $nodeConfig['depends_on'] ?? [];
            foreach ($dependencies as $dep) {
                if (! array_key_exists($dep, $nodeMap)) {
                    throw new WorkflowExecutionException(
                        message: "Invalid DAG topology: Node '{$nodeKey}' depends on non-existent node '{$dep}'.",
                        nodeKey: $nodeKey,
                    );
                }
                $adjacencyList[$dep][] = $nodeKey;
                $inDegree[$nodeKey]++;
            }
        }

        // Queue of nodes with no dependencies (in-degree = 0)
        $queue = [];
        foreach ($inDegree as $nodeKey => $degree) {
            if ($degree === 0) {
                $queue[] = $nodeKey;
            }
        }

        $orderedNodes = [];

        while (! empty($queue)) {
            $current = array_shift($queue);
            $orderedNodes[] = $current;

            foreach ($adjacencyList[$current] as $neighbor) {
                $inDegree[$neighbor]--;
                if ($inDegree[$neighbor] === 0) {
                    $queue[] = $neighbor;
                }
            }
        }

        if (count($orderedNodes) !== count($nodeMap)) {
            throw new RuntimeException('Circular dependency detected in workflow DAG. Pipeline execution aborted.');
        }

        return $orderedNodes;
    }
}
