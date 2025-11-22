        document.addEventListener('DOMContentLoaded', () => {
            // Initialize Lucide icons
            lucide.createIcons();
            
            // Set initial page state based on hash or default to 'home'
            const initialPage = window.location.hash.substring(1) || 'home';
            navigate(initialPage, false); // Initialize page without animation on load
            
            // Event listeners for mobile menu
            document.getElementById('mobile-menu-button').addEventListener('click', toggleMobileMenu);
            
            // Re-render icons after content is potentially modified (e.g., in dashboard)
            // This is especially important for sections loaded later.
            lucide.createIcons();
        });

        // Global state for current page
        let currentPage = 'home';
        let isLoggedIn = false;

        // --- Utility Functions ---

        /**
         * Exponential backoff retry logic for API calls.
         */
        async function fetchWithRetry(url, options, maxRetries = 5) {
            for (let i = 0; i < maxRetries; i++) {
                try {
                    const response = await fetch(url, options);
                    if (!response.ok) {
                        // Throw error for non-successful HTTP status (e.g., 400, 500)
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response;
                } catch (error) {
                    if (i === maxRetries - 1) {
                        throw error; // Last retry failed
                    }
                    // Wait 2^i * 1000 milliseconds
                    const delay = Math.pow(2, i) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }


        /**
         * Switches the active page content using smooth transitions.
         * @param {string} targetPage - The ID prefix of the page section to show (e.g., 'home', 'about').
         * @param {boolean} animate - Whether to apply transition/scroll (default true).
         */
        function navigate(targetPage, animate = true) {
            const allPages = document.querySelectorAll('.page-content');
            
            // 1. Hide the current page
            const activePage = document.getElementById(`${currentPage}-page`);
            if (activePage) {
                activePage.classList.remove('active');
                if (animate) {
                    activePage.classList.add('hidden');
                }
            }
            
            // 2. Determine the target page element
            const nextPage = document.getElementById(`${targetPage}-page`);
            if (!nextPage) {
                console.error('Page not found:', targetPage);
                targetPage = 'home';
                navigate('home');
                return;
            }

            // 3. Update the global state and hash
            currentPage = targetPage;
            window.location.hash = targetPage;

            // 4. Show the new page with transition
            nextPage.classList.remove('hidden');
            // Force a reflow before applying the 'active' class to ensure transition runs
            void nextPage.offsetWidth; 
            nextPage.classList.add('active');

            // Re-run icon generation for the newly shown page content
            lucide.createIcons();
            
            // 5. Scroll to the top of the main content
            if (animate) {
                 window.scrollTo({ top: 0, behavior: 'smooth' });
            }

            // Handle portal visibility state
            updatePortalView();
        }
        
        // --- Modal/Message Box Functions ---

        const modal = document.getElementById('mock-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        const modalIcon = document.getElementById('modal-icon');

        /**
         * Shows a message in the custom modal.
         * @param {string} title - Modal title.
         * @param {string} message - Modal body text.
         * @param {string} iconName - Lucide icon name (e.g., 'check-circle', 'alert-triangle').
         * @param {string} iconColor - Tailwind color class for the icon (e.g., 'text-primary', 'text-yellow-400').
         */
        function showModal(title, message, iconName = 'check-circle', iconColor = 'text-primary') {
            modalTitle.textContent = title;
            modalBody.textContent = message;
            
            // Update the icon element
            modalIcon.setAttribute('data-lucide', iconName);
            modalIcon.className = `h-10 w-10 mx-auto mb-4 ${iconColor}`;

            // Re-render icon
            lucide.createIcons(); 
            
            modal.classList.remove('hidden');
        }

        function closeModal() {
            modal.classList.add('hidden');
        }

        // --- Interaction Handlers ---

        function toggleMobileMenu() {
            const menu = document.getElementById('mobile-menu');
            menu.classList.toggle('hidden');
        }

        function mockBooking(className) {
            showModal('Booking Confirmed', `You have successfully booked the ${className} class. See you there!`, 'calendar-check', 'text-accent');
        }

        function mockSignup(planName) {
            showModal('Enrollment Started', `You are starting the sign-up process for the ${planName} plan. Redirecting to payment... (Mock)`);
            setTimeout(() => { closeModal(); }, 2000); // Auto-close for mock redirect
        }

        function handleContact(event) {
            event.preventDefault();
            const form = event.target;
            const messageEl = document.getElementById('contact-message');
            
            messageEl.classList.remove('hidden', 'text-red-400');
            messageEl.classList.add('text-accent');
            messageEl.textContent = 'Thank you for your inquiry! We will get back to you within 24 hours.';
            
            form.reset();
            setTimeout(() => { messageEl.classList.add('hidden'); }, 4000);
        }

        // --- Member Portal Logic ---

        function updatePortalView() {
            const loginEl = document.getElementById('portal-login');
            const dashboardEl = document.getElementById('portal-dashboard');

            if (currentPage !== 'portal') return;

            if (isLoggedIn) {
                loginEl.classList.add('hidden');
                dashboardEl.classList.remove('hidden');
                lucide.createIcons(); // Rerender icons on dashboard load
            } else {
                loginEl.classList.remove('hidden');
                dashboardEl.classList.add('hidden');
                document.getElementById('login-error').classList.add('hidden');
                document.getElementById('login-form').reset();
            }
        }

        function handleLogin(event) {
            event.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorEl = document.getElementById('login-error');

            if (username === 'demo' && password === 'password') {
                isLoggedIn = true;
                errorEl.classList.add('hidden');
                showModal('Login Successful', 'Welcome to your Member Dashboard, Demo User!', 'user-check', 'text-accent');
                // Use a short delay before navigating/updating to let the user read the success modal
                setTimeout(() => {
                    closeModal();
                    updatePortalView();
                }, 1500);
            } else {
                errorEl.classList.remove('hidden');
            }
        }
        
        function handleLogout() {
            isLoggedIn = false;
            showModal('Logged Out', 'You have been successfully logged out.', 'log-out', 'text-primary');
            setTimeout(() => {
                closeModal();
                updatePortalView();
            }, 1000);
        }

        function mockViewPlan() {
            showModal('Plan Details', 'The full plan viewer would launch here, showing detailed exercise descriptions, videos, and logging functionality. (Mock)', 'layout-grid', 'text-accent');
        }

        // --- Gemini API Integration: AI Workout Assistant ---
        
        const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=";
        const apiKey = ""; // Canvas will provide this at runtime

        const aiBtn = document.getElementById('ai-generate-btn');
        const aiBtnText = document.getElementById('ai-btn-text');
        const aiSpinner = document.getElementById('ai-loading-spinner');
        const aiPromptEl = document.getElementById('ai-prompt');
        const aiResultEl = document.getElementById('ai-workout-result');

        function toggleLoading(isLoading) {
            if (isLoading) {
                aiBtn.disabled = true;
                aiBtnText.textContent = 'Generating...';
                aiSpinner.classList.remove('hidden');
            } else {
                aiBtn.disabled = false;
                aiBtnText.textContent = 'Generate Workout ✨';
                aiSpinner.classList.add('hidden');
            }
        }

        async function generateAiWorkout(event) {
            event.preventDefault();
            const userPrompt = aiPromptEl.value;

            toggleLoading(true);
            aiResultEl.classList.add('hidden');
            aiResultEl.innerHTML = '';
            
            try {
                // 1. Construct the API Payload for Structured Output
                const systemPrompt = "You are 'Apex AI Coach,' a fitness expert. Your task is to generate short, effective workout routines and motivational quotes based on the user's input. Respond only with a single JSON object that strictly adheres to the provided schema.";
                
                const payload = {
                    contents: [{ parts: [{ text: userPrompt }] }],
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: "OBJECT",
                            properties: {
                                workout_name: { type: "STRING", description: "A catchy, descriptive name for the workout." },
                                duration: { type: "STRING", description: "The estimated time for the workout (e.g., '15 minutes' or '30-45 minutes')." },
                                exercises: {
                                    type: "ARRAY",
                                    description: "A list of 3 to 5 exercises.",
                                    items: {
                                        type: "OBJECT",
                                        properties: {
                                            name: { type: "STRING", description: "The name of the exercise (e.g., 'Dumbbell Squats')." },
                                            sets_reps: { type: "STRING", description: "Sets and Reps/Time (e.g., '3 sets of 12 reps' or '45 seconds work, 15 seconds rest')." },
                                            focus: { type: "STRING", description: "Brief description of the exercise focus." }
                                        },
                                        required: ["name", "sets_reps"]
                                    }
                                },
                                motivational_quote: { type: "STRING", description: "A short, powerful motivational quote." }
                            },
                            required: ["workout_name", "duration", "exercises", "motivational_quote"]
                        }
                    }
                };

                // 2. Fetch the response with retry logic
                const response = await fetchWithRetry(`${API_URL}${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();
                const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;

                if (!jsonText) {
                    throw new Error("AI returned an empty or malformed response.");
                }

                const workoutData = JSON.parse(jsonText);

                // 3. Render the structured result
                renderWorkout(workoutData);

            } catch (error) {
                console.error("Gemini API Error:", error);
                showModal("AI Error", `Failed to generate workout. Please ensure your request is clear and try again. (${error.message})`, 'alert-triangle', 'text-red-400');
            } finally {
                toggleLoading(false);
            }
        }

        function renderWorkout(data) {
            let exercisesHtml = data.exercises.map((ex, index) => `
                <li class="p-3 bg-gray-600 rounded-md flex justify-between items-start border-l-4 border-accent">
                    <div>
                        <span class="font-semibold text-white">${index + 1}. ${ex.name}</span>
                        <p class="text-xs text-gray-300 mt-1">${ex.focus}</p>
                    </div>
                    <span class="text-sm font-medium text-primary">${ex.sets_reps}</span>
                </li>
            `).join('');

            aiResultEl.innerHTML = `
                <h5 class="text-xl font-bold text-white mb-2">${data.workout_name}</h5>
                <p class="text-primary mb-4 flex items-center"><i data-lucide="clock" class="icon h-4 w-4"></i>Est. Time: ${data.duration}</p>
                <ul class="space-y-3 mb-6">
                    ${exercisesHtml}
                </ul>
                <div class="border-t border-gray-600 pt-4">
                    <p class="text-sm italic text-gray-400 flex items-start">
                        <i data-lucide="message-square-quote" class="h-5 w-5 text-accent mr-2 mt-1 flex-shrink-0"></i> 
                        ${data.motivational_quote}
                    </p>
                </div>
            `;
            aiResultEl.classList.remove('hidden');
            lucide.createIcons(); // Re-render icons after adding new content
        }