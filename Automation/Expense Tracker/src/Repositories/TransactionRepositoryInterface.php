<?php

declare(strict_types=1);

namespace VaultCLI\Repositories;

use VaultCLI\DTOs\TransactionDTO;

/**
 * TransactionRepositoryInterface – the Repository Pattern contract.
 *
 * Architectural note: By programming to this interface instead of a
 * concrete class, the rest of the application (Commands, Analytics)
 * is decoupled from the underlying storage engine.  Swapping SQLite
 * for MySQL, PostgreSQL, or even a flat-file store requires only a
 * new implementation of this interface – zero changes to callers.
 * This satisfies the Dependency Inversion Principle (SOLID).
 */
interface TransactionRepositoryInterface
{
    public function save(TransactionDTO $dto): int;

    public function findById(int $id): ?TransactionDTO;

    public function delete(int $id): bool;

    /** @return TransactionDTO[] */
    public function findAll(int $limit = 20, int $offset = 0): array;

    /** @return TransactionDTO[] */
    public function findByMonth(int $year, int $month): array;

    /** @return TransactionDTO[] */
    public function findByCategory(string $category): array;

    /** @return array{category:string, total:int}[] */
    public function sumByCategory(int $year, int $month): array;

    public function totalIncomeCents(int $year, int $month): int;

    public function totalExpenseCents(int $year, int $month): int;
}
