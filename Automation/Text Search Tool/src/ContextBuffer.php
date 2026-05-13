<?php

declare(strict_types=1);

namespace SearchLens;

class ContextBuffer
{
    private \SplFixedArray $buffer;
    private int $size;
    private int $head = 0;

    public function __construct(int $size)
    {
        $this->size = $size;
        // If size is 0, we don't need a buffer, but let's initialize it to 1 to avoid errors 
        // and just ignore it later, or handle size 0 explicitly.
        $this->buffer = new \SplFixedArray(max(1, $size));
    }

    public function add(int $lineNumber, string $line): void
    {
        if ($this->size === 0) {
            return;
        }

        $this->buffer[$this->head % $this->size] = [
            'line_number' => $lineNumber,
            'content' => $line
        ];
        $this->head++;
    }

    /**
     * @return array<int, array{line_number: int, content: string}>
     */
    public function getLines(): array
    {
        if ($this->size === 0 || $this->head === 0) {
            return [];
        }

        $lines = [];
        $count = min($this->size, $this->head);
        
        // If head > size, we've wrapped around. Oldest is head % size.
        $startIndex = $this->head > $this->size ? ($this->head % $this->size) : 0;

        for ($i = 0; $i < $count; $i++) {
            $index = ($startIndex + $i) % $this->size;
            $item = $this->buffer[$index];
            if ($item !== null) {
                $lines[] = $item;
            }
        }

        return $lines;
    }

    public function clear(): void
    {
        $this->head = 0;
        for ($i = 0; $i < $this->size; $i++) {
            $this->buffer[$i] = null;
        }
    }
}
