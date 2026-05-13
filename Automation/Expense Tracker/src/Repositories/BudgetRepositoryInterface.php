<?php

declare(strict_types=1);

namespace VaultCLI\Repositories;

use VaultCLI\DTOs\BudgetDTO;

/**
 * BudgetRepositoryInterface – contract for budget limit persistence.
 */
interface BudgetRepositoryInterface
{
    public function save(BudgetDTO $dto): int;

    public function findByCategory(string $category): ?BudgetDTO;

    /** @return BudgetDTO[] */
    public function findAll(): array;

    public function delete(string $category): bool;
}
