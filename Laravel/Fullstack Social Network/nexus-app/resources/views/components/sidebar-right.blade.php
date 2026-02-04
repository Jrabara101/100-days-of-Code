<div class="px-2 w-full">
    <!-- Sponsored -->
    <div class="mb-4">
        <h3 class="text-[#65676B] font-semibold text-[17px] mb-2 px-2">Sponsored</h3>
        <a href="#" class="flex items-center p-2 rounded-lg hover:bg-[#E4E6EB] transition-colors duration-200">
            <img src="https://via.placeholder.com/120x80" class="w-[120px] h-[80px] rounded-lg mr-3 object-cover" alt="Ad">
            <div class="flex flex-col">
                <span class="font-semibold text-[15px] text-[#050505]">Lifetime Access</span>
                <span class="text-[13px] text-[#65676B]">Gemini PRO + YT Premium</span>
            </div>
        </a>
        <a href="#" class="flex items-center p-2 rounded-lg hover:bg-[#E4E6EB] transition-colors duration-200">
            <img src="https://via.placeholder.com/120x80" class="w-[120px] h-[80px] rounded-lg mr-3 object-cover" alt="Ad">
             <div class="flex flex-col">
                <span class="font-semibold text-[15px] text-[#050505]">ChutneyAds Hiring</span>
                <span class="text-[13px] text-[#65676B]">Sr. Software Engineer</span>
            </div>
        </a>
    </div>

    <hr class="my-3 border-gray-300 mx-2">

    <!-- Contacts -->
    <div class="mb-4">
        <div class="flex items-center justify-between px-2 mb-2">
             <h3 class="text-[#65676B] font-semibold text-[17px]">Contacts</h3>
             <div class="flex space-x-2 text-[#65676B]">
                 <svg class="w-5 h-5 hover:bg-gray-200 rounded-full cursor-pointer p-0.5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" /></svg>
                 <svg class="w-5 h-5 hover:bg-gray-200 rounded-full cursor-pointer p-0.5" viewBox="0 0 20 20" fill="currentColor"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" /></svg>
             </div>
        </div>
        
        <ul class="space-y-1">
            @foreach(range(1, 10) as $i)
            <li>
                <a href="#" class="flex items-center p-2 rounded-lg hover:bg-[#E4E6EB] transition-colors duration-200">
                    <div class="relative">
                        <img src="https://ui-avatars.com/api/?name=User+{{ $i }}&background=random" class="w-9 h-9 rounded-full mr-3 border border-gray-200" alt="User">
                        <span class="absolute bottom-0 right-3 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                    </div>
                    <span class="font-medium text-[15px]">User {{ $i }}</span>
                </a>
            </li>
            @endforeach
        </ul>
    </div>
</div>
