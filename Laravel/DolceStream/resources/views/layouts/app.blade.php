<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ config('app.name', 'DolceStream') }}</title>
    <!-- Bootstrap 5 -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap" rel="stylesheet">
    <!-- Alpine.js -->
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <style>
        :root {
            --bs-font-sans-serif: 'Outfit', sans-serif;
            --ds-pink: #FFD1DC;
            --ds-cream: #FFFDD0;
            --ds-mint: #E0F2F1;
            --ds-gold: #D4AF37;
            --ds-dark: #2C3E50;
        }
        body {
            background-color: var(--ds-cream);
            color: var(--ds-dark);
            font-family: var(--bs-font-sans-serif);
        }
        .btn-primary {
            background-color: var(--ds-pink);
            border-color: var(--ds-pink);
            color: var(--ds-dark);
            font-weight: 600;
        }
        .btn-primary:hover {
            background-color: #ffbdce; 
            border-color: #ffbdce;
            color: var(--ds-dark);
        }
        .text-gold { color: var(--ds-gold); }
        .bg-pink { background-color: var(--ds-pink) !important; }
    </style>
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
        <div class="container">
            <a class="navbar-brand fw-bold" href="{{ route('home') }}">
                🍰 DolceStream
            </a>
        </div>
    </nav>

    <main class="py-4">
        @yield('content')
    </main>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
