<nav class="bg-white h-[56px] w-full fixed top-0 left-0 z-50 flex items-center justify-between px-4 shadow-sm border-b border-gray-200">
    <!-- Left: Logo & Search -->
    <div class="flex items-center gap-2">
        <a href="/" class="shrink-0">
            <svg viewBox="0 0 36 36" class="h-10 w-10 text-[#0866FF] fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.181 35.87C29.094 34.791 36 27.202 36 18c0-9.941-8.059-18-18-18S0 8.059 0 18c0 8.442 5.811 15.526 13.652 17.471l-.274-5.568h-4.25v-5.416h4.25v-3.237c0-5.162 2.13-7.964 8.208-7.964 1.738 0 3.8.058 4.675.154v5.303h-2.921c-2.453 0-3.083 1.156-3.083 2.913v2.831h6.059l-.921 5.416H20.25v6.52c-.023 1.023-.047 2.05-.069 3.078Z"></path>
            </svg>
        </a>
        <div class="hidden xl:flex items-center bg-[#F0F2F5] rounded-full px-3 py-2 w-[240px]">
            <svg viewBox="0 0 20 20" class="h-4 w-4 text-gray-500 fill-current mr-2">
                <path d="M19 17.586l-4.502-4.502a7.965 7.965 0 001.996-5.084 8 8 0 10-8 8 7.965 7.965 0 005.084-1.996L17.586 19 19 17.586zM3 8a5 5 0 1110 0 5 5 0 01-10 0z"></path>
            </svg>
            <input type="text" placeholder="Search Facebook" class="bg-transparent border-none outline-none text-[15px] placeholder-gray-500 w-full text-black">
        </div>
        <div class="xl:hidden w-10 h-10 bg-[#F0F2F5] rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 section-btn">
            <svg viewBox="0 0 20 20" class="h-5 w-5 text-gray-600 fill-current">
                <path d="M19 17.586l-4.502-4.502a7.965 7.965 0 001.996-5.084 8 8 0 10-8 8 7.965 7.965 0 005.084-1.996L17.586 19 19 17.586zM3 8a5 5 0 1110 0 5 5 0 01-10 0z"></path>
            </svg>
        </div>
    </div>

    <!-- Center: Navigation Links -->
    <div class="hidden md:flex flex-1 justify-center max-w-[600px] h-full">
        <ul class="flex items-center w-full justify-between h-full space-x-1">
            <li class="h-full flex-1 flex items-center justify-center border-b-[3px] border-[#0866FF] cursor-pointer">
                <svg viewBox="0 0 24 24" class="h-7 w-7 text-[#0866FF] fill-current">
                    <path d="M22.502 13.5v8.25a.75.75 0 01-.75.75H16.5a.75.75 0 01-.75-.75V15.75a1.5 1.5 0 00-1.5-1.5h-1.5a1.5 1.5 0 00-1.5 1.5v6a.75.75 0 01-.75.75H5.253a.75.75 0 01-.75-.75V13.5a.75.75 0 01.32-.625L11.571 6.55a.75.75 0 01.857 0l6.753 5.326a.75.75 0 01.32.624h.001zM12 2.766 2.227 10.473a2.25 2.25 0 00-.96 1.875v8.25A2.25 2.25 0 003.518 22.5h5.25a2.25 2.25 0 002.25-2.25V15.75h1.964v4.5a2.25 2.25 0 002.25 2.25h5.25a2.25 2.25 0 002.25-2.25V13.5a2.25 2.25 0 00-.96-1.875L12 2.766z"></path>
                    <path d="M12.429 2.143 21.08 8.965a.75.75 0 01-1.05 1.05L12 2.766 3.97 10.015a.75.75 0 11-1.05-1.05l8.651-6.822a.75.75 0 01.858 0z"></path>
                 </svg>
            </li>
            <li class="h-full flex-1 flex items-center justify-center border-b-[3px] border-transparent hover:bg-gray-100 rounded-lg mx-1 cursor-pointer group">
                 <svg viewBox="0 0 24 24" class="h-7 w-7 text-gray-500 group-hover:text-gray-600 fill-current">
                    <path d="M20 7h-2V5c0-1.103-.897-2-2-2H8c-1.103 0-2 .897-2 2v2H4c-1.103 0-2 .897-2 2v8c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2V9c0-1.103-.897-2-2-2zM8 5h8v2H8V5zm0 10c0 1.103.897 2 2 2h4c1.103 0 2-.897 2-2v-2H8v2z"></path>
                 </svg>
            </li>
            <li class="h-full flex-1 flex items-center justify-center border-b-[3px] border-transparent hover:bg-gray-100 rounded-lg mx-1 cursor-pointer group relative">
                 <svg viewBox="0 0 24 24" class="h-7 w-7 text-gray-500 group-hover:text-gray-600 fill-current">
                     <path d="M16 2H8C4.691 2 2 4.691 2 8v13a1 1 0 001 1h13c3.309 0 6-2.691 6-6V8c0-3.309-2.691-6-6-6zm4 14c0 2.206-1.794 4-4 4H4V8c0-2.206 1.794-4 4-4h8c2.206 0 4 1.794 4 4v8z"></path>
                 </svg>
                 <!-- Badge -->
                 <div class="absolute top-2 right-6 bg-[#E41E3F] text-white text-[10px] font-bold px-1.5 rounded-full border-2 border-white">3</div>
            </li>
            <li class="h-full flex-1 flex items-center justify-center border-b-[3px] border-transparent hover:bg-gray-100 rounded-lg mx-1 cursor-pointer group">
                 <svg viewBox="0 0 24 24" class="h-7 w-7 text-gray-500 group-hover:text-gray-600 fill-current">
                     <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"></path>
                     <path d="M12 6a4.004 4.004 0 00-3.939 3.039c-.1.547.452.961.939.961h6c.487 0 1.039-.414.939-.961A4.004 4.004 0 0012 6zM8.078 15.176c-.22.691.365 1.324 1.054 1.324h5.736c.688 0 1.274-.633 1.054-1.324A3.992 3.992 0 0012 13a3.992 3.992 0 00-3.922 2.176z"></path>
                 </svg>
            </li>
            <li class="h-full flex-1 flex items-center justify-center border-b-[3px] border-transparent hover:bg-gray-100 rounded-lg mx-1 cursor-pointer group">
                 <!-- Gaming Icon -->
                 <svg viewBox="0 0 24 24" class="h-7 w-7 text-gray-500 group-hover:text-gray-600 fill-current">
                     <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM7.5 14a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm4.5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm4.5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"></path>
                 </svg>
            </li>
        </ul>
    </div>

    <!-- Right: Profile & Actions -->
    <div class="flex items-center gap-2 justify-end">
        
        <!-- Menu Icon -->
        <div class="w-10 h-10 bg-[#F0F2F5] hover:bg-gray-200 rounded-full flex items-center justify-center cursor-pointer md:hidden">
             <!-- Hamburger -->
             <svg viewBox="0 0 24 24" class="h-5 w-5 text-black">
                 <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
             </svg>
        </div>

        <div class="hidden xl:flex w-10 h-10 bg-[#e4e6eb] hover:bg-gray-300 rounded-full items-center justify-center cursor-pointer">
            <svg viewBox="0 0 24 24" class="h-5 w-5 text-black fill-current">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM6.5 14l3.5-3.5L13.5 14l4-4"></path>
            </svg>
        </div>

        <!-- Messenger -->
        <div class="w-10 h-10 bg-[#e4e6eb] hover:bg-gray-300 rounded-full flex items-center justify-center cursor-pointer">
            <svg viewBox="0 0 28 28" class="h-5 w-5 text-black fill-current">
                <path d="M14 2.042c6.76 0 12 4.952 12 11.64S20.76 25.322 14 25.322a13.091 13.091 0 0 1-3.474-.461.956 .956 0 0 0-.641.047L7.5 25.959a.961.961 0 0 1-1.348-.849l-.065-2.134a.957.957 0 0 0-.322-.684A11.389 11.389 0 0 1 2 13.682C2 6.994 7.24 2.042 14 2.042ZM6.794 17.086a.57.57 0 0 0 .827.758l3.786-2.874a.722.722 0 0 1 .868 0l2.8 2.1a1.8 1.8 0 0 0 2.6-.481l3.525-5.592a.57.57 0 0 0-.827-.758l-3.786 2.874a.722.722 0 0 1-.868 0l-2.8-2.1a1.8 1.8 0 0 0-2.6.481Z"></path>
            </svg>
        </div>

        <!-- Notifications -->
        <div class="w-10 h-10 bg-[#e4e6eb] hover:bg-gray-300 rounded-full flex items-center justify-center cursor-pointer relative">
            <svg viewBox="0 0 28 28" class="h-5 w-5 text-black fill-current">
                <path d="M7.847 23.488C9.207 23.488 11.443 23.363 14.467 22.865a.5.5 0 0 0 .412-.416c1.332-6.538 1.488-8.89 1.488-10.27S15.657 8 13.08 8 9.696 9.423 9.696 12.18c0 1.586.177 3.931 1.448 10.329a.5.5 0 0 0 .412.416c2.732.449 4.881.563 6.291.563zm-4.764 2.03a14.7 14.7 0 0 1-1.405-7.337C1.678 11.282 6.786 6 13.08 6s11.402 5.282 11.402 12.181a14.7 14.7 0 0 1-1.405 7.337 1.5 1.5 0 0 1-2.072.582l-.462-.258a.5.5 0 0 0-.485 0l-.438.252a1.5 1.5 0 0 1-2.112-.66 12.916 12.916 0 0 0-3.34-3.34.5.5 0 0 0-.485 0l-.438.252a1.5 1.5 0 0 1-2.112-.66 12.916 12.916 0 0 0-3.34 3.34 1.5 1.5 0 0 1-2.072-.582l-.462-.258a.5.5 0 0 0-.485 0l-.438.252a1.5 1.5 0 0 1-2.072-.582z"></path>
                <path d="M14 26a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path>
            </svg>
            <div class="absolute -top-1 -right-1 bg-[#E41E3F] text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full border-2 border-[#fff]">9+</div>
        </div>

        <!-- User Profile -->
        <a href="{{ route('profile.show', Auth::user()) }}" class="w-10 h-10 rounded-full overflow-hidden cursor-pointer border border-gray-200 hover:opacity-90">
            <img src="https://ui-avatars.com/api/?name={{ urlencode(Auth::user()->name) }}&background=random" alt="Profile" class="w-full h-full object-cover">
        </a>
    </div>
</nav>
