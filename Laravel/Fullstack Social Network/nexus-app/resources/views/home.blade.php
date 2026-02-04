<x-app-layout>
    <!-- Stories Section -->
    <div class="relative py-4 w-full max-w-[680px]">
        <div class="flex space-x-2 overflow-x-auto pb-2 scrollbar-hidden">
            <!-- Create Story Card -->
            <div class="flex-shrink-0 w-[112px] h-[200px] bg-white rounded-xl overflow-hidden shadow-sm relative cursor-pointer group">
                <img src="https://ui-avatars.com/api/?name={{ Auth::user()->name }}&background=random" class="w-full h-3/4 object-cover group-hover:transform group-hover:scale-105 transition-transform duration-200">
                <div class="absolute bottom-0 w-full h-1/4 bg-white flex justify-center items-end pb-2 relative z-10">
                    <span class="text-[13px] font-semibold">Create story</span>
                </div>
                <div class="absolute bottom-[40px] left-1/2 transform -translate-x-1/2 w-8 h-8 bg-[#0866FF] rounded-full border-4 border-white flex items-center justify-center text-white z-20">
                    <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current"><path d="M11 19v-6H5v-2h6V5h2v6h6v2h-6v6Z"></path></svg>
                </div>
                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
            </div>

            <!-- Other Stories -->
             @foreach($stories as $story)
            <div class="flex-shrink-0 w-[112px] h-[200px] bg-gray-200 rounded-xl overflow-hidden shadow-sm relative cursor-pointer group">
                <img src="{{ $story->image_path }}" class="w-full h-full object-cover group-hover:transform group-hover:scale-105 transition-transform duration-200">
                <div class="absolute top-3 left-3 w-8 h-8 rounded-full border-4 border-[#0866FF] overflow-hidden bg-white z-20">
                     <img src="https://ui-avatars.com/api/?name={{ urlencode($story->user->name) }}&background=random" class="w-full h-full">
                </div>
                <div class="absolute bottom-2 left-3 text-white font-semibold text-[13px] z-20 shadow-black drop-shadow-md">
                    {{ $story->user->name }}
                </div>
                 <div class="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
            </div>
            @endforeach
        </div>
    </div>

    <!-- Create Post Section -->
    <div class="bg-white rounded-lg shadow-sm p-4 mb-4">
        <form action="{{ route('posts.store') }}" method="POST" enctype="multipart/form-data">
            @csrf
            
            <!-- Top Input -->
            <div class="flex items-center space-x-2 mb-3 border-b border-gray-100 pb-3">
                <a href="#" class="flex-shrink-0">
                    <img src="https://ui-avatars.com/api/?name={{ Auth::user()->name }}&background=random" class="w-10 h-10 rounded-full hover:opacity-90">
                </a>
                <input type="text" name="content" 
                    class="flex-1 bg-[#F0F2F5] hover:bg-[#E4E6EB] transition-colors rounded-full px-4 py-2.5 cursor-pointer text-[#050505] text-[17px] border-none focus:ring-0 focus:outline-none placeholder-gray-600"
                    placeholder="What's on your mind, {{ Auth::user()->name }}?">
            </div>

            <!-- Hidden File Input -->
            <input type="file" name="image" id="post_image" class="hidden">

            <!-- Actions -->
            <div class="flex items-center justify-between px-2 pt-1">
                <!-- Live Video -->
                <div class="flex-1 flex items-center justify-center space-x-2 py-2 hover:bg-[#F2F2F2] rounded-lg cursor-pointer text-[#65676B] font-semibold text-[15px]">
                    <svg width="24" height="24" viewBox="0 0 24 24" class="text-[#F02849]"><path fill="currentColor" d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4zM14 13h-3v3H9v-3H6v-2h3V8h2v3h3v2z"/></svg>
                    <span class="hidden sm:inline">Live video</span>
                </div>

                <!-- Photo/Video Label -->
                <label for="post_image" class="flex-1 flex items-center justify-center space-x-2 py-2 hover:bg-[#F2F2F2] rounded-lg cursor-pointer text-[#65676B] font-semibold text-[15px]">
                     <svg width="24" height="24" viewBox="0 0 24 24" class="text-[#45BD62]"><path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                    <span class="hidden sm:inline">Photo/video</span>
                </label>

                <!-- Feeling/Activity -->
                <div class="flex-1 flex items-center justify-center space-x-2 py-2 hover:bg-[#F2F2F2] rounded-lg cursor-pointer text-[#65676B] font-semibold text-[15px]">
                    <svg width="24" height="24" viewBox="0 0 24 24" class="text-[#F7B928]"><path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>
                    <span class="hidden sm:inline">Feeling/activity</span>
                </div>
            </div>
            
            <button type="submit" class="hidden"></button>
        </form>
    </div>

    <!-- Posts Feed -->
    @foreach($posts as $post)
    <div class="bg-white rounded-lg shadow-sm mb-4">
        <!-- Post Header -->
        <div class="p-4 pb-2 flex items-start justify-between">
             <div class="flex items-center">
                 <a href="{{ route('profile.show', $post->user) }}" class="mr-2">
                     <img src="https://ui-avatars.com/api/?name={{ urlencode($post->user->name) }}&background=random" class="w-10 h-10 rounded-full border border-gray-200">
                 </a>
                 <div>
                     <a href="{{ route('profile.show', $post->user) }}" class="font-semibold text-[#050505] hover:underline text-[15px]">{{ $post->user->name }}</a>
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
</x-app-layout>
