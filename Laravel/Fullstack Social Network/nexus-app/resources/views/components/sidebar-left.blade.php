<div class="px-2 w-full">
    <ul class="space-y-1">
        <!-- User Profile -->
        <li>
            <a href="{{ route('profile.show', Auth::user()) }}" class="flex items-center p-2 rounded-lg hover:bg-[#E4E6EB] transition-colors duration-200">
                <img src="https://ui-avatars.com/api/?name={{ urlencode(Auth::user()->name) }}&background=random" alt="Profile" class="w-9 h-9 rounded-full mr-3">
                <span class="font-medium text-[15px]">{{ Auth::user()->name }}</span>
            </a>
        </li>
        <!-- Friends -->
        <li>
            <a href="#" class="flex items-center p-2 rounded-lg hover:bg-[#E4E6EB] transition-colors duration-200">
                 <div class="w-9 h-9 mr-3 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white">
                    <svg viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"></path></svg>
                 </div>
                <span class="font-medium text-[15px]">Friends</span>
            </a>
        </li>
        <!-- Memories -->
        <li>
            <a href="#" class="flex items-center p-2 rounded-lg hover:bg-[#E4E6EB] transition-colors duration-200">
                 <div class="w-9 h-9 mr-3 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white">
                    <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm3.3 14.71L11 12.41V7h2v4.59l3.71 3.71-1.42 1.41z"></path></svg>
                 </div>
                <span class="font-medium text-[15px]">Memories</span>
            </a>
        </li>
        <!-- Saved -->
        <li>
            <a href="#" class="flex items-center p-2 rounded-lg hover:bg-[#E4E6EB] transition-colors duration-200">
                 <div class="w-9 h-9 mr-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                    <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"></path></svg>
                 </div>
                <span class="font-medium text-[15px]">Saved</span>
            </a>
        </li>
        <!-- Groups -->
        <li>
            <a href="#" class="flex items-center p-2 rounded-lg hover:bg-[#E4E6EB] transition-colors duration-200">
                 <div class="w-9 h-9 mr-3 rounded-full bg-gradient-to-br from-blue-300 to-blue-500 border border-blue-200 flex items-center justify-center text-white">
                    <svg viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg>
                 </div>
                <span class="font-medium text-[15px]">Groups</span>
            </a>
        </li>
        <!-- Video -->
        <li>
            <a href="#" class="flex items-center p-2 rounded-lg hover:bg-[#E4E6EB] transition-colors duration-200">
                 <div class="w-9 h-9 mr-3 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white">
                    <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"></path></svg>
                 </div>
                <span class="font-medium text-[15px]">Video</span>
            </a>
        </li>
         <!-- Marketplace -->
         <li>
            <a href="#" class="flex items-center p-2 rounded-lg hover:bg-[#E4E6EB] transition-colors duration-200">
                 <div class="w-9 h-9 mr-3 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white">
                   <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M12 2l-5.5 9h11L12 2zm0 3.84L13.93 9h-3.87L12 5.84zM17.5 13c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM3 13c-2.49 0-4.5 2.01-4.5 4.5S.51 22 3 22s4.5-2.01 4.5-4.5S5.49 13 3 13zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"></path></svg>
                 </div>
                <span class="font-medium text-[15px]">Marketplace</span>
            </a>
        </li>
        
        <!-- See More -->
        <li>
            <div class="flex items-center p-2 rounded-lg hover:bg-[#E4E6EB] transition-colors duration-200 cursor-pointer">
                <div class="w-9 h-9 rounded-full bg-[#E4E6EB] flex items-center justify-center mr-3">
                    <svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor">
                        <path d="M8 12a1 1 0 0 1-.707-.293l-4-4a1 1 0 1 1 1.414-1.414L8 9.586l3.293-3.293a1 1 0 0 1 1.414 1.414l-4 4A1 1 0 0 1 8 12z"/>
                    </svg>
                </div>
                <span class="font-medium text-[15px]">See more</span>
            </div>
        </li>
    </ul>

    <hr class="my-3 border-gray-300 mx-2">

    <div class="px-2">
        <h3 class="text-[#65676B] font-semibold text-[17px] mb-2">Your Shortcuts</h3>
        <ul class="space-y-1">
             <li>
                <a href="#" class="flex items-center p-2 rounded-lg hover:bg-[#E4E6EB] transition-colors duration-200">
                    <img src="https://via.placeholder.com/36" class="w-9 h-9 rounded-lg mr-3 object-cover" alt="Group">
                    <span class="font-medium text-[15px]">Laravel Developers</span>
                </a>
            </li>
            <li>
                <a href="#" class="flex items-center p-2 rounded-lg hover:bg-[#E4E6EB] transition-colors duration-200">
                    <img src="https://via.placeholder.com/36/ff0000/ffffff?text=U" class="w-9 h-9 rounded-lg mr-3 object-cover" alt="Group">
                    <span class="font-medium text-[15px]">UI/UX Designers</span>
                </a>
            </li>
        </ul>
    </div>
</div>
