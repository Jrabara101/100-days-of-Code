<x-app-layout>
    <!-- Profile Header -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
        <!-- Cover Photo -->
        <div class="h-[200px] sm:h-[250px] bg-gradient-to-r from-gray-300 to-gray-400 relative">
            <button class="absolute bottom-4 right-4 bg-white hover:bg-gray-100 text-black px-3 py-1.5 rounded-md font-semibold text-[15px] flex items-center shadow-sm">
                <svg viewBox="0 0 24 24" class="w-5 h-5 mr-1.5 fill-current"><path d="M19 12h-2v3h-3v2h3v3h2v-3h3v-2h-3zM7 9a2 2 0 1 1-2-2 2 2 0 0 1 2 2zm16-4v10a2 2 0 0 1-2 2h-6.23a3 3 0 0 0-1.2.25l-2.92 1.3a3 3 0 0 1-2.45 0l-2.92-1.3a3 3 0 0 0-1.2-.25H2a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h1.5a2.5 2.5 0 0 1 2.37 1.69l.63 2h5l.63-2A2.5 2.5 0 0 1 12.5 3H16a2 2 0 0 1 2 2zM7 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4z"></path></svg>
                <span>Edit cover photo</span>
            </button>
        </div>

        <div class="px-4 pb-4">
            <div class="flex flex-col sm:flex-row relative">
                <!-- Profile Picture -->
                <div class="-mt-[84px] sm:-mt-[30px] flex justify-center sm:justify-start">
                    <div class="relative">
                        <img src="https://ui-avatars.com/api/?name={{ urlencode($user->name) }}&background=random&size=168" class="w-[168px] h-[168px] rounded-full border-[4px] border-white shadow-sm object-cover">
                        <div class="absolute bottom-2 right-2 bg-gray-200 hover:bg-gray-300 p-2 rounded-full cursor-pointer border border-white">
                            <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current"><path d="M19 12h-2v3h-3v2h3v3h2v-3h3v-2h-3zM7 9a2 2 0 1 1-2-2 2 2 0 0 1 2 2zm16-4v10a2 2 0 0 1-2 2h-6.23a3 3 0 0 0-1.2.25l-2.92 1.3a3 3 0 0 1-2.45 0l-2.92-1.3a3 3 0 0 0-1.2-.25H2a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h1.5a2.5 2.5 0 0 1 2.37 1.69l.63 2h5l.63-2A2.5 2.5 0 0 1 12.5 3H16a2 2 0 0 1 2 2zM7 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4z"></path></svg>
                        </div>
                    </div>
                </div>

                <!-- Name & Actions -->
                <div class="mt-3 sm:mt-0 sm:ml-4 flex-1 flex flex-col justify-end pb-2 text-center sm:text-left">
                    <h1 class="text-[32px] font-bold text-[#050505] leading-tight">{{ $user->name }}</h1>
                    <div class="font-semibold text-[#65676B] text-[15px] hover:underline cursor-pointer mb-4">
                        {{ rand(100, 5000) }} friends
                    </div>
                    
                    <div class="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
                        <!-- Add Story / Add Friend -->
                        @if(auth()->id() === $user->id)
                        <button class="bg-[#0866FF] hover:bg-[#005CE6] text-white px-4 py-1.5 rounded-md font-semibold text-[15px] flex items-center transition-colors">
                            <svg viewBox="0 0 24 24" class="w-4 h-4 mr-1.5 fill-current"><path d="M11 19v-6H5v-2h6V5h2v6h6v2h-6v6Z"></path></svg>
                            Add to story
                        </button>
                        <button class="bg-[#E4E6EB] hover:bg-[#D8DADF] text-[#050505] px-4 py-1.5 rounded-md font-semibold text-[15px] flex items-center transition-colors">
                            <svg viewBox="0 0 24 24" class="w-4 h-4 mr-1.5 fill-current"><path d="M16.924 9.617A1 1 0 0 0 16 9h-3.003V6.003a1 1 0 0 0-1-1h-2.003a1 1 0 0 0-1 1v3.003H6.003a1 1 0 0 0-1 1v2.003a1 1 0 0 0 1 1h3.003v3.003a1 1 0 0 0 1 1h2.003a1 1 0 0 0 1-1v-3.003h3.003a1 1 0 0 0 1-1zM11 20a1 1 0 0 1-1-1v-4H6a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h4V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4v4a1 1 0 0 1-1 1z"/> <!-- Pen Icon for Edit? --> <path d="m14.06 9.02.92.92L5.92 19H5v-.92l9.06-9.06M17.66 3c-.25 0-.51.1-.7.29l-1.83 1.83 3.75 3.75 1.83-1.83a.996.996 0 0 0 0-1.41l-2.34-2.34c-.2-.2-.45-.29-.71-.29zm-3.6 3.19L3 17.25V21h3.75L17.81 9.94l-3.75-3.75z"></path> </svg>
                            Edit profile
                        </button>
                        @else
                        <button class="bg-[#0866FF] hover:bg-[#005CE6] text-white px-4 py-1.5 rounded-md font-semibold text-[15px] flex items-center transition-colors">
                            <svg viewBox="0 0 24 24" class="w-4 h-4 mr-1.5 fill-current"><path d="M11 19v-6H5v-2h6V5h2v6h6v2h-6v6Z"></path></svg>
                            Add friend
                        </button>
                        <button class="bg-[#E4E6EB] hover:bg-[#D8DADF] text-[#050505] px-4 py-1.5 rounded-md font-semibold text-[15px] flex items-center transition-colors">
                            <svg viewBox="0 0 24 24" class="w-4 h-4 mr-1.5 fill-current"><path d="M14 2.042c6.76 0 12 4.952 12 11.64S20.76 25.322 14 25.322a13.091 13.091 0 0 1-3.474-.461.956 .956 0 0 0-.641.047L7.5 25.959a.961.961 0 0 1-1.348-.849l-.065-2.134a.957.957 0 0 0-.322-.684A11.389 11.389 0 0 1 2 13.682C2 6.994 7.24 2.042 14 2.042Z"></path></svg>
                            Message
                        </button>
                        @endif
                    </div>
                </div>
            </div>

            <hr class="my-4 border-gray-300">

            <!-- Profile Nav -->
            <div class="flex items-center space-x-1 overflow-x-auto scrollbar-hidden">
                <div class="px-4 py-3 rounded-lg text-[#0866FF] bg-transparent hover:bg-[#E4E6EB] font-semibold cursor-pointer border-b-[3px] border-[#0866FF] whitespace-nowrap">Posts</div>
                <div class="px-4 py-3 rounded-lg text-[#65676B] hover:bg-[#E4E6EB] font-semibold cursor-pointer whitespace-nowrap">About</div>
                <div class="px-4 py-3 rounded-lg text-[#65676B] hover:bg-[#E4E6EB] font-semibold cursor-pointer whitespace-nowrap">Friends</div>
                <div class="px-4 py-3 rounded-lg text-[#65676B] hover:bg-[#E4E6EB] font-semibold cursor-pointer whitespace-nowrap">Photos</div>
                <div class="px-4 py-3 rounded-lg text-[#65676B] hover:bg-[#E4E6EB] font-semibold cursor-pointer whitespace-nowrap">Videos</div>
                <div class="px-4 py-3 rounded-lg text-[#65676B] hover:bg-[#E4E6EB] font-semibold cursor-pointer whitespace-nowrap">Check-ins</div>
            </div>
        </div>
    </div>

    <!-- Layout: Left Info, Right Posts -->
    <div class="flex flex-col md:flex-row gap-4">
        <!-- Left Column: Intro & Photos -->
        <div class="w-full md:w-2/5 space-y-4">
            <!-- Intro -->
            <div class="bg-white rounded-lg shadow-sm p-4">
                <h2 class="text-[20px] font-bold text-[#050505] mb-3">Intro</h2>
                <div class="text-center mb-4 text-[15px]">
                    <span class="text-[#050505]">Frontend Developer at <strong>Tech Corp</strong></span>
                </div>
                <button class="w-full bg-[#E4E6EB] hover:bg-[#D8DADF] text-[#050505] py-1.5 rounded-md font-semibold text-[15px] mb-3">
                    Edit bio
                </button>
                <div class="space-y-3 text-[15px] text-[#050505]">
                    <div class="flex items-center">
                        <svg class="w-5 h-5 text-[#8C939D] mr-2 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"></path></svg>
                        <span>Lives in <strong>New York, NY</strong></span>
                    </div>
                    <div class="flex items-center">
                        <svg class="w-5 h-5 text-[#8C939D] mr-2 fill-current" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.67-5.33-4-8-4z"></path></svg>
                        <span>Followed by <strong>120 people</strong></span>
                    </div>
                </div>
                <button class="w-full bg-[#E4E6EB] hover:bg-[#D8DADF] text-[#050505] py-1.5 rounded-md font-semibold text-[15px] mt-4">
                    Edit details
                </button>
                <button class="w-full bg-[#E4E6EB] hover:bg-[#D8DADF] text-[#050505] py-1.5 rounded-md font-semibold text-[15px] mt-2">
                    Add Hobbies
                </button>
            </div>

            <!-- Photos (Simplified) -->
            <div class="bg-white rounded-lg shadow-sm p-4">
                <div class="flex justify-between items-center mb-3">
                    <h2 class="text-[20px] font-bold text-[#050505]">Photos</h2>
                    <a href="#" class="text-[#0866FF] text-[15px] hover:underline">See all photos</a>
                </div>
                <div class="grid grid-cols-3 gap-1 rounded-lg overflow-hidden">
                    @foreach(range(1, 9) as $i)
                        <img src="https://picsum.photos/150?random={{ $i }}" class="w-full aspect-square object-cover">
                    @endforeach
                </div>
            </div>
        </div>

        <!-- Right Column: Posts -->
        <div class="w-full md:w-3/5">
            <!-- Create Post (If Owner) -->
            @if(auth()->id() === $user->id)
            <div class="bg-white rounded-lg shadow-sm p-4 mb-4">
                <div class="flex items-center space-x-2 mb-3 border-b border-gray-100 pb-3">
                    <a href="#" class="flex-shrink-0">
                        <img src="https://ui-avatars.com/api/?name={{ Auth::user()->name }}&background=random" class="w-10 h-10 rounded-full hover:opacity-90">
                    </a>
                    <div class="flex-1 bg-[#F0F2F5] hover:bg-[#E4E6EB] transition-colors rounded-full px-3 py-2.5 cursor-pointer text-[#65676B] text-[17px]">
                        What's on your mind?
                    </div>
                </div>
                <div class="flex items-center justify-between px-2 pt-1">
                    <div class="flex-1 flex items-center justify-center space-x-2 py-2 hover:bg-[#F2F2F2] rounded-lg cursor-pointer text-[#65676B] font-semibold text-[15px]">
                        <svg width="24" height="24" viewBox="0 0 24 24" class="text-[#F02849]"><path fill="currentColor" d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4zM14 13h-3v3H9v-3H6v-2h3V8h2v3h3v2z"/></svg>
                        <span class="hidden sm:inline">Live video</span>
                    </div>
                    <div class="flex-1 flex items-center justify-center space-x-2 py-2 hover:bg-[#F2F2F2] rounded-lg cursor-pointer text-[#65676B] font-semibold text-[15px]">
                         <svg width="24" height="24" viewBox="0 0 24 24" class="text-[#45BD62]"><path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                        <span class="hidden sm:inline">Photo/video</span>
                    </div>
                    <div class="flex-1 flex items-center justify-center space-x-2 py-2 hover:bg-[#F2F2F2] rounded-lg cursor-pointer text-[#65676B] font-semibold text-[15px]">
                        <svg width="24" height="24" viewBox="0 0 24 24" class="text-[#F7B928]"><path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>
                        <span class="hidden sm:inline">Life event</span>
                    </div>
                </div>
            </div>
            @endif

            <!-- Profile Feed -->
            @foreach($posts as $post)
            <div class="bg-white rounded-lg shadow-sm mb-4">
                <!-- Post Header -->
                <div class="p-4 pb-2 flex items-start justify-between">
                     <div class="flex items-center">
                         <a href="#" class="mr-2">
                             <img src="https://ui-avatars.com/api/?name={{ urlencode($post->user->name) }}&background=random" class="w-10 h-10 rounded-full border border-gray-200">
                         </a>
                         <div>
                             <a href="#" class="font-semibold text-[#050505] hover:underline text-[15px]">{{ $post->user->name }}</a>
                             <div class="text-[#65676B] text-[13px] flex items-center">
                                 <a href="#" class="hover:underline">{{ $post->created_at->diffForHumans() }}</a>
                                 <span class="mx-1">·</span>
                                 <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" class="text-[#65676B]">
                                     <path d="M8 1a7 7 0 1 0 7 7A7 7 0 0 0 8 1zm0 12a5 5 0 1 1 5-5 5 5 0 0 1-5 5zm.5-7.53V2.46a.5.5 0 0 0-1 0v3.01a.5.5 0 0 0 .5.53zM8 2a.5.5 0 0 0-.46.33l-1 3a.5.5 0 0 0 .94.32L8 4.22l.53 1.57a.5.5 0 0 0 .94-.32l-1-3A.5.5 0 0 0 8 2z"/>
                                     <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zM7 8V6h2v2H7z"/> 
                                     <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5" fill="none" />
                                     <path d="M2.5 8h11M8 2.5a13 13 0 0 0 0 11 13 13 0 0 0 0-11z" stroke="currentColor" stroke-width="1.5" fill="none" />
                                 </svg>
                             </div>
                         </div>
                     </div>
                     <button class="text-[#65676B] hover:bg-gray-100 p-2 rounded-full">
                         <svg viewBox="0 0 20 20" width="20" height="20" fill="currentColor"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/></svg>
                     </button>
                </div>

                <!-- Post Content -->
                @if($post->content)
                <div class="px-4 pb-2">
                    <p class="text-[15px] text-[#050505] leading-normal mb-2">
                        {{ $post->content }}
                    </p>
                </div>
                @endif

                <!-- Post Media -->
                @if($post->image_path)
                <div class="w-full bg-gray-100 border-t border-b border-gray-100">
                    <img src="{{ asset('storage/' . $post->image_path) }}" class="w-full object-contain max-h-[600px]">
                </div>
                @endif

                <!-- Post Stats -->
                <div class="px-4 py-2 flex items-center justify-between text-[#65676B] text-[15px]">
                    <div class="flex items-center cursor-pointer hover:underline">
                        <span class="bg-[#0866FF] rounded-full p-1 z-10 border-2 border-white -mr-1">
                            <!-- Blue Thumb -->
                            <svg class="w-2.5 h-2.5 text-white fill-current" viewBox="0 0 16 16"><path d="M8.823 8.354a.5.5 0 0 0 .554.832c.667-.333 1.334.832 2.054 1.15.542.238 1.13.238 1.67-.093 1.488-.916 2-3.125 2-4.125s-.5-2-1.5-2-.5 1-1.5 1-.5-1-1.5-1-.5 1-1.5 1zm-1.646.832a.5.5 0 0 0 .554-.832C7.064 8.021 6.397 9.186 5.677 9.504c-.542.238-1.13.238-1.67-.093-1.488-.916-2-3.125-2-4.125s.5-2 1.5-2 .5 1 1.5 1 .5-1 1.5-1 .5 1 1.5 1z"/></svg>
                        </span>
                         <span class="ml-2">0</span>
                    </div>
                    <div class="flex space-x-3">
                         <a href="#" class="hover:underline">0 comments</a>
                         <a href="#" class="hover:underline">0 shares</a>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="px-2 pb-1">
                    <div class="flex items-center justify-between border-t border-gray-200 pt-1">
                        <button class="flex-1 flex items-center justify-center space-x-2 py-1.5 rounded-md hover:bg-[#F2F2F2] text-[#65676B] font-semibold text-[15px]">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                            <span>Like</span>
                        </button>
                        <button class="flex-1 flex items-center justify-center space-x-2 py-1.5 rounded-md hover:bg-[#F2F2F2] text-[#65676B] font-semibold text-[15px]">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                            <span>Comment</span>
                        </button>
                        <button class="flex-1 flex items-center justify-center space-x-2 py-1.5 rounded-md hover:bg-[#F2F2F2] text-[#65676B] font-semibold text-[15px]">
                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                            <span>Share</span>
                        </button>
                    </div>
                </div>
            </div>
            @endforeach
        </div>
    </div>
</x-app-layout>
