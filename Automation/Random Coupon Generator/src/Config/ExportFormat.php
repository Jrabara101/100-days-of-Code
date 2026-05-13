<?php

declare(strict_types=1);

namespace PromoForge\Config;

enum ExportFormat: string
{
    case CSV = 'csv';
    case JSON = 'json';
    case SQLITE = 'sqlite';
}
