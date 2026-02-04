<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Facebook</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    <link rel="icon" href="https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg">
    <style>
        /* Custom scrollbar for sidebars */
        .scrollbar-hidden::-webkit-scrollbar {
            display: none;
        }
        .hover-bg-gray:hover {
            background-color: #f2f2f2;
        }
    </style>
</head>
<body class="bg-[#F0F2F5] text-[#050505] font-sans antialiased overflow-y-scroll">
    
    <!-- Navbar -->
    <x-navbar />

    <div class="flex justify-between mt-[56px] min-h-[calc(100vh-56px)]">
        <!-- Left Sidebar (Fixed) -->
        <div class="hidden md:block w-[360px] h-screen fixed left-0 top-[56px] overflow-y-auto hover:overflow-y-scroll scrollbar-hidden pb-4">
            <x-sidebar-left />
        </div>

        <!-- Main Feed (Centered) -->
        <div class="flex-1 flex justify-center w-full px-0 md:pl-[360px] lg:pr-[360px]">
            <div class="w-full max-w-[680px] py-4 px-2 sm:px-4">
                {{ $slot }}
            </div>
        </div>

        <!-- Right Sidebar (Fixed) -->
        <div class="hidden lg:block w-[360px] h-screen fixed right-0 top-[56px] overflow-y-auto hover:overflow-y-scroll scrollbar-hidden pt-4 pr-2">
            <x-sidebar-right />
        </div>
    </div>

</body>
</html>
