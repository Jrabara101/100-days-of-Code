<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PostController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $posts = Post::with('user')->latest()->get();
        $stories = \App\Models\Story::with('user')->active()->latest()->get();
        return view('home', compact('posts', 'stories'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'content' => 'required_without:image|string|nullable',
            'image' => 'nullable|image|max:10240', // 10MB max
        ]);

        $path = null;
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('posts', 'public');
        }

        Auth::user()->posts()->create([
            'content' => $validated['content'],
            'image_path' => $path,
        ]);

        return redirect()->route('home')->with('success', 'Post created successfully!');
    }
}
