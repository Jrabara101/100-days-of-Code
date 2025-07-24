Rails.application.routes.draw do
  root 'posts#index' 
  resources :posts # or your home controller
  get 'news', to: 'news#index'
  get 'podcasts', to: 'podcasts#index'
  get 'resources', to: 'resources#index'
  get 'contact', to: 'contact#index'

  resources :podcasts do
    member do
      post :play
    end
  end
end